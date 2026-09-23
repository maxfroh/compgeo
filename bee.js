import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
import { randInt } from 'three/src/math/MathUtils.js';
import { Patch } from './location';


export class Bee {
    // Variables for the shared static template model
    static loader = new GLTFLoader();
    static beeTemplate = null;
    static isLoaded = false;
    static loadPromise = null;

    //
    static nectarCapacity = 6;
    static speed = 20;

    static loadBeeModel(renderer) {
        if (Bee.loadPromise) {
            return Bee.loadPromise;
        }

        Bee.loadPromise = new Promise((resolve, reject) => {
            Bee.loader.load('bee.glb', (gltf) => {
                gltf.scene.children.forEach((child) => {
                    child.rotation.y += -Math.PI / 2;
                });

                gltf.scene.traverse((child) => {
                    if (child.isMesh && child.material.map) {
                        child.material.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
                        child.material.map.minFilter = THREE.LinearMipmapLinearFilter;
                        child.material.needsUpdate = true;
                    }
                });
                gltf.scene.scale.set(2, 2, 2);
                Bee.beeTemplate = gltf.scene;
                Bee.isLoaded = true;
                resolve(gltf.scene);
            }, undefined, (error) => {
                console.error(error);
                reject(error);
            });
        });

        return Bee.loadPromise;
    }

    /**
     * @param {THREE.Scene} scene 
     * @param {THREE.WebGLRenderer} renderer
     * @param {number} frustumSize
     * @param {Hive} hive  
     * @param {Array<Patch>} patches 
     */
    constructor(scene, renderer, frustumSize, hive, patches) {
        this.scene = scene;

        if (Bee.isLoaded) {
            this.initMesh();
        } else {
            Bee.loadBeeModel(renderer).then(() => {
                this.initMesh();
            });
        }

        this.hive = hive;
        this.patches = patches;
        this.goingHome = false;
        this.gatheringNectar = false;
        this.nectarCollected = 0;
        this.nectarTimer = 0;

        this.lowerBound = Math.min(frustumSize * .1, 10);
        this.upperBound = Math.max(frustumSize * .9, frustumSize - 10);
        this.centerMargin = frustumSize / 2;
        this.target = this.getNewTarget();

    }

    initMesh() {
        this.mesh = Bee.beeTemplate.clone(true);
        this.mesh.position.copy(this.hive.position);
        this.hive.bees_present += 1;
        this.scene.add(this.mesh);
    }

    /**
     * @param {number} delta 
     */
    update(delta) {
        // console.log("Current state:", { gathering: this.gatheringNectar, timer: this.nectarTimer, collected: this.nectarCollected, target: this.target });
        if (this.gatheringNectar) {
            this.nectarTimer += delta;

            const nectar = this.target.collectNectar ? this.target.collectNectar(delta) : 1;
            this.nectarCollected += (isNaN(nectar) ? 0 : nectar);

            if (this.nectarTimer > 2 || this.nectarCollected >= Bee.nectarCapacity || nectar == 0) {
                this.target.bees_present = Math.max(0, this.target.bees_present - 1);

                this.gatheringNectar = false;

                if (this.nectarCollected >= Bee.nectarCapacity) {
                    this.goingHome = true;
                    this.target = this.hive;
                } else {
                    this.target = this.getNewTarget();
                    if (this.target === this.hive) {
                        this.goingHome = true;
                    } else {
                        this.nectarTimer = 0;
                    }
                }
            }
        }

        this.move(delta);

    }

    /**
     * @param {number} delta 
     */
    move(delta) {
        // don't move if the mesh is not loaded
        if (!this.mesh || !this.target) {
            return;
        }

        this.mesh.lookAt(this.target.position);
        const distance = this.mesh.position.distanceTo(this.target.position);
        const step = Bee.speed * delta;

        if (distance < step) {
            this.mesh.position.copy(this.target.position);
            this.target.bees_present += 1;

            if (!this.goingHome) {
                this.gatheringNectar = true;
                this.nectarTimer = 0;
            } else {
                this.nectarCollected = 0;
                this.goingHome = false;
                this.target = this.getNewTarget();
            }
        } else {
            const direction = new THREE.Vector3().subVectors(this.target.position, this.mesh.position).normalize();
            this.mesh.position.addScaledVector(direction, step);
        }

    }

    /**
     * @returns {Patch}
     */
    getNewTarget() {
        let newTarget = this.patches[Math.floor(Math.random() * this.patches.length)];
        let tries = 10;

        if (this.target && this.target !== this.hive) {
            while (
                newTarget === this.target ||
                (newTarget.nectar_level !== undefined && newTarget.nectar_level <= 0)
            ) {
                newTarget = this.patches[Math.floor(Math.random() * this.patches.length)];
                tries -= 1;
                if (tries <= 0) {
                    console.log("Couldn't find anyone... going home!");
                    this.goingHome = true;
                    this.gatheringNectar = false;
                    return this.hive;
                }
            }
        }
        return newTarget;
    }
}