import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
import { randInt } from 'three/src/math/MathUtils.js';


export class Bee {
    // Variables for the shared static template model
    static loader = new GLTFLoader();
    static beeTemplate = null;
    static isLoaded = false;
    static loadPromise = null;

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
        this.goingHome = false;
        this.nectarCollected = 0;

        this.lowerBound = Math.min(frustumSize * .1, 10);
        this.upperBound = Math.max(frustumSize * .9, frustumSize - 10);
        this.centerMargin = frustumSize / 2;
        this.target = this.getNewTarget();

        this.speed = 1 / 50;
    }

    initMesh() {
        this.mesh = Bee.beeTemplate.clone(true);
        this.mesh.position.copy(this.hive.position);
        this.scene.add(this.mesh);
    }

    /**
     * @param {number} delta 
     */
    update(delta) {
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

        this.mesh.lookAt(this.target);
        const distance = this.mesh.position.distanceTo(this.target);
        const step = this.speed * delta;
        if (distance < step) {
            this.mesh.position.copy(this.target);

            if (!this.goingHome) {
                this.target = this.hive.position;
                this.goingHome = true;
            } else {
                this.target = this.getNewTarget();
                this.goingHome = false;
            }
        } else {
            const direction = new THREE.Vector3().subVectors(this.target, this.mesh.position).normalize();
            this.mesh.position.addScaledVector(direction, step);
        }
    }

    getNewTarget() {
        const x = this.centerMargin - randInt(this.lowerBound, this.upperBound);
        const y = randInt(4, 10);
        const z = this.centerMargin - randInt(this.lowerBound, this.upperBound);
        return new THREE.Vector3(x, y, z);
    }
}