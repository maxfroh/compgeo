import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
import { Patch } from './patch.js';
import { Hive, Bee } from './bee.js';


const scene = new THREE.Scene();

// orthographic camera setup
const aspect = window.innerWidth / window.innerHeight;
const frustumSize = 200;
const left = -frustumSize * aspect / 2;
const right = frustumSize * aspect / 2;
const top = frustumSize / 2;
const bottom = -frustumSize / 2;
const near = 0.1;
const far = 1000;
const camera = new THREE.OrthographicCamera(left, right, top, bottom, near, far);

camera.position.set(0, 50, 0);
camera.lookAt(0, 0, 0);
camera.up.set(0, 0, -1);

// light setup
const light = new THREE.AmbientLight(0x5060a0, 3); // dark bluish ambient light
light.position.set(0, 30, 0);
scene.add(light);
const sunIntensity = 5;
const directionalLight = new THREE.DirectionalLight(0xffffff, sunIntensity); // bright white sunlight
directionalLight.position.set(0, 30, 0);
scene.add(directionalLight);

// renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
// renderer.shadowMap.enabled = true;
// renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
// document.body.appendChild(renderer.domElement);

// overlay text and add canvas to document
const container = document.getElementById('canvas-container');
const clockTime = document.getElementById('current-time');
const clockDay = document.getElementById('current-day');
container.appendChild(renderer.domElement);

// ground
const geometry = new THREE.PlaneGeometry(frustumSize, frustumSize);
const material = new THREE.MeshPhongMaterial({ color: 0x11cc44, side: THREE.DoubleSide });
const ground = new THREE.Mesh(geometry, material);
ground.receiveShadow = true;
ground.rotation.x = -Math.PI / 2;
scene.add(ground);


var patches = []
for (let i = 0; i < 10; i++) {
    const patch = new Patch(frustumSize);
    console.log(patch.position);
    scene.add(patch.mesh);
    patches.push(patch);
}

const hive = new Hive(scene, renderer, frustumSize);

var bees = []
for (let i = 0; i < 10; i++) {
    const bee = new Bee(scene, renderer, hive, frustumSize);
    bees.push(bee);
}

let lastTime = 0;
let currTime = 0.5;
let currDay = 0;
const MIN_PER_DAY = 0.5;

function animate(time) {
    const delta = time - lastTime;
    lastTime = time;

    if (!delta || isNaN(delta)) {
        renderer.render(scene, camera);
        return;
    }

    bees.forEach((bee) => { bee.move(delta) });

    currTime += delta / (MIN_PER_DAY * 60 * 1000);
    if (currTime >= 1) {
        currTime = 0;
        currDay += 1;
    }

    const hour = Math.floor(currTime * 24);
    const minute = Math.floor(60 * (24 * currTime - hour));
    const d = 23.5 * Math.PI / 180;
    const lightLevel = Math.max(0, Math.min(1, Math.cos(d) * Math.cos((currTime - 0.5) * Math.PI * 1.3)))

    directionalLight.intensity = lightLevel * sunIntensity;

    clockTime.innerText = `${String(hour).padStart(2, 0)}:${String(minute).padStart(2, 0)}`;
    clockDay.innerText = currDay;

    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);
