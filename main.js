import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


const sphere_geometry = new THREE.SphereGeometry( 1, 16, 16 );
const sphere_material = new THREE.MeshPhongMaterial( { color: 0xffff00 } );
const sphere = new THREE.Mesh( sphere_geometry, sphere_material );
sphere.translateY(1);
scene.add( sphere );

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

const light = new THREE.AmbientLight( 0x808080 ); // soft white light
scene.add( light );
const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
scene.add( directionalLight );


camera.position.z = 5;


function animate(time) {
    sphere.rotation.x = time / 2000;
    sphere.rotation.y = time / 1000;
    cube.rotation.x = time / 2000;
    cube.rotation.y = time / 1000;
    renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
