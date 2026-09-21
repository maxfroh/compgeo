import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';

const loader = new GLTFLoader();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 75, 0);
camera.lookAt(0, 0, 0);
camera.up.set(0, 0, -1);

const light = new THREE.AmbientLight(0x808080, 3); // soft white light
// light.position.set(-1, 2, 4);
scene.add(light);
const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
directionalLight.position.set(-1, 2, 4);
scene.add(directionalLight);

camera.position.z = 5;


const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);


const sphere_geometry = new THREE.SphereGeometry(1, 16, 16);
const sphere_material = new THREE.MeshPhongMaterial({ color: 0xffff00 });
const sphere = new THREE.Mesh(sphere_geometry, sphere_material);
sphere.translateY(1);
// scene.add(sphere);

const size = 100;
const geometry = new THREE.PlaneGeometry(size, size);
const material = new THREE.MeshBasicMaterial({ color: 0x11cc44, side: THREE.DoubleSide });
const square = new THREE.Mesh(geometry, material);
square.rotation.x = -Math.PI / 2;
scene.add(square);

function loadBeeModel() {
    return new Promise((resolve, reject) => {
        loader.load('bee.glb', (gltf) => {
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
            resolve(gltf.scene);
        }, undefined, (error) => {
            console.error(error);
            reject(error);
        });
    });
}

const beeTemplate = await loadBeeModel();

// const bee = beeTemplate.clone(true);

function getNewGoal() {
    const x = 50 - THREE.MathUtils.randInt(10, 90);
    const y = THREE.MathUtils.randInt(5, 15);
    const z = 50 - THREE.MathUtils.randInt(10, 90);
    return new THREE.Vector3(x, y, z);
}

var bees = []
for (let i = 0; i < 10; i++) {
    const bee = {
        model: beeTemplate.clone(true),
        target: getNewGoal(),
        init: function () {
            this.model.position.copy(getNewGoal());
        },
        move: function (delta) {
            this.model.lookAt(this.target);
            const distance = this.model.position.distanceTo(this.target);
            const step = delta;
            if (distance < step) {
                this.target = getNewGoal();
            } else {
                const direction = new THREE.Vector3().subVectors(this.target, this.model.position);
                this.model.position.addScaledVector(direction, 1 / 1000 * step);
            }
        }
    }
    bees.push(bee);
}

bees.forEach((bee) => { bee.init(); scene.add(bee.model) });

let lastTime = 0;

function animate(time) {
    const delta = time - lastTime;
    lastTime = time;

    if (!delta || isNaN(delta)) {
        renderer.render(scene, camera);
        return;
    }

    bees.forEach((bee) => { bee.move(delta) });
    // const targetRotation = new THREE.Matrix4();
    // targetRotation.lookAt(bee.position, beeTarget, bee.up);
    // const targetQuaternion = new THREE.Quaternion().setFromRotationMatrix(targetRotation);
    // bee.quaternion.rotateTowards(targetQuaternion, delta);

    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);
