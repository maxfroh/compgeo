import * as THREE from 'three';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { Line2, LineGeometry } from 'three/examples/jsm/Addons.js';

import { Hive, Patch } from './location.js';
import { Bee } from './bee.js';
import { weightedVoronoi } from 'd3-weighted-voronoi';

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

const NUM_BEES = 20;
const NUM_PATCHES = 30;

const hive = new Hive(scene, renderer, frustumSize);

const patches = []
for (let i = 0; i < NUM_PATCHES; i++) {
    const patch = new Patch(frustumSize);
    scene.add(patch.mesh);
    patches.push(patch);
}

const bees = []
for (let i = 0; i < NUM_BEES; i++) {
    const bee = new Bee(scene, renderer, frustumSize, hive, patches);
    bees.push(bee);
}

let lastTime = 0;
let currTime = 0.5;
let currDay = 0;
let frame = 0;
const MIN_PER_DAY = 1;

const trackedOutlines = [];
/**
 * @param {Array<Array<Array<number>} cells
 */
function drawVoronoi(cells) {
    trackedOutlines.forEach((outline) => {
        scene.remove(outline);
        outline.geometry.dispose();
        outline.material.dispose();
    });
    trackedOutlines.length = 0;

    const total = cells.length;
    cells.forEach((cell, i) => {
        const points = cell.map((point) => new THREE.Vector3(point[0], 2, point[1]));
        // close the loop
        points.push(points[0]);
        const geometry = new LineGeometry().setFromPoints(points);
        const material = new LineMaterial({
            color: 0xffeeee,
            // color: new THREE.Color(`hsl(${180 + 360 * Math.cos(i) * Math.sin(i)}, ${80 + 15 * Math.cos(i)}%, ${60 + 10 * Math.sin(i)}%)`),
            linewidth: 4,
        });
        const outline = new Line2(geometry, material);
        trackedOutlines.push(outline);
        scene.add(outline);
    })
}

let old_cell = [];

/**
 * @param {Hive} hive
 * @param {number} currTime 
 */
function processVoronoi(hive, currTime) {

    // console.log(patches[0].getWeight(hive, currTime) / patches[4].getWeight(hive, currTime), patches[10].getWeight(hive, currTime) / patches[8].getWeight(hive, currTime));
    const calcVoronoi = weightedVoronoi()
        .x(function (patch) { return patch.position.x; }) // x = patch x-coord
        .y(function (patch) { return patch.position.z; }) // y is actually patch z-coord!
        .weight(function (patch) { return patch.getWeight(hive, currTime); }) // use patch's weight function
        .clip([[-frustumSize / 2, -frustumSize / 2], [-frustumSize / 2, frustumSize / 2], [frustumSize / 2, frustumSize / 2], [frustumSize / 2, -frustumSize / 2]]);  // set the clipping polygon
    const cells = calcVoronoi(patches);
    if (old_cell.length == 0) {
        old_cell = Array.from(cells[4][2]);
    } else {
        // console.log(new THREE.Vector2(old_cell[0], old_cell[1]).distanceTo(new THREE.Vector2(cells[4][2][0], cells[4][2][1])));
        old_cell = Array.from(cells[4][2]);
    }
    drawVoronoi(cells);
    return cells;
}

processVoronoi(hive, currTime * 24);

function animate(time) {
    const delta = time - lastTime;
    lastTime = time;

    if (!delta || isNaN(delta)) {
        renderer.render(scene, camera);
        return;
    }

    const deltaSeconds = delta / 1000; 

    bees.forEach((bee) => { bee.update(deltaSeconds) });
    patches.forEach((patch) => { patch.update(deltaSeconds) });

    currTime += deltaSeconds / (MIN_PER_DAY * 60);
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

    frame += 1;
    if (frame > 11) {
        frame = 0;
    }

    processVoronoi(hive, currTime * 24);

    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

// window.addEventListener('resize', () => {
//     // camera.aspect = window.innerWidth / window.innerHeight;
//     // camera.updateProjectionMatrix();
//     renderer.setSize(window.innerWidth, window.innerHeight);
// });

