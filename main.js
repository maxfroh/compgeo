import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';

const loader = new GLTFLoader();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);


const sphere_geometry = new THREE.SphereGeometry(1, 16, 16);
const sphere_material = new THREE.MeshPhongMaterial({ color: 0xffff00 });
const sphere = new THREE.Mesh(sphere_geometry, sphere_material);
sphere.translateY(1);
// scene.add(sphere);

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
// scene.add(cube);

function loadBeeModel() {
    return new Promise((resolve, reject) => {
        loader.load('public/bee.glb', (gltf) => {
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

const bee = beeTemplate.clone(true);
scene.add(bee)

const light = new THREE.AmbientLight(0x808080, 3); // soft white light
// light.position.set(-1, 2, 4);
scene.add(light);
const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
directionalLight.position.set(-1, 2, 4);
scene.add(directionalLight);


camera.position.z = 5;


function animate(time) {
    bee.rotation.x = time / 2000;
    bee.rotation.y = time / 1000;
    renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
