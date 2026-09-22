import * as THREE from 'three';
import { randInt } from 'three/src/math/MathUtils.js';


export class Location {
    static locations = [];
}


export class Hive {
    constructor(scene, renderer, frustumSize) {
        this.scene = scene;
        const x = 0;
        const y = 3;
        const z = 0;
        this.radius = 4;
        this.segments = 6;
        this.position = new THREE.Vector3(x, y, z);
        this.geometry = new THREE.CircleGeometry(this.radius, this.segments);
        this.material = new THREE.MeshPhongMaterial({ color: 0xa36700, side: THREE.DoubleSide });
        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.position.copy(this.position);
        this.mesh.rotation.x = -Math.PI / 2
        this.scene.add(this.mesh);
    }
}


export class Patch {
    constructor(frustumSize) {
        const lowerBound = Math.min(frustumSize * .1, 10);
        const upperBound = Math.max(frustumSize * .9, frustumSize - 10);
        const centerMargin = frustumSize / 2;
        const x = centerMargin - randInt(lowerBound, upperBound);
        const y = 3;
        const z = centerMargin - randInt(lowerBound, upperBound);
        const radius = 1;
        const segments = 6;

        this.position = new THREE.Vector3(x, y, z);
        this.geometry = new THREE.CircleGeometry(radius, segments);
        this.material = new THREE.MeshPhongMaterial({ color: 0xee2200, side: THREE.DoubleSide });
        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.position.copy(this.position);
        this.mesh.rotation.x = -Math.PI / 2

        this.nectar_level = randInt(2,6);
        this.bees_present = 1;
        this.average_attractiveness = randInt(2,6);
    }

    /**
     * @param {Hive} hive
     * @param {number} time 
     */
    getWeight(hive, time) {
        return this.#f(hive.position, this.position, this.nectar_level, this.bees_present, time, this.average_attractiveness);
        // return Math.log1p(rawWeight) * 1000;
    }


    /**
     * @param {Vector3} p_h The location of the hive.
     * @param {Vector3} p_t The location of the target patch.
     * @param {number} n The total nectar capacity of the target (number of flowers).
     * @param {number} b The current number of bees at the target.
     * @param {number} t The time of day (any number in [0, 24)).
     * @param {number} a The average attractiveness of flowers in the target patch.
     * @returns {number} The weight of the patch. 
    */
    #f(p_h, p_t, n, b, t, a) {
        return Patch.#z(t) * ((1 - Patch.#p(t)) + Patch.#p(t) * 1 / (1 + p_h.distanceTo(p_t))) * n * a * (1 / b);
    }

    static #p(t) {
        return 1 - Patch.#z(t) / 2
    }

    /**
     * Modified lognormal distribution.
     * Scaled for t in [0, 24).
     * 
     * Will return higher values the closer it gets to the ideal time of day for honey bees to forage (~7am-1:30pm).
     */
    static #z(t) {
        const _t = Math.min(24.01, Math.max(t, 1.01));
        const val = Math.min(
            2 * Math.min(
                1,
                10 * (
                    1 / (1.08 * 0.23 * (_t - 1) * Math.sqrt(2 * Math.PI))
                ) *
                Math.exp(
                    (
                        -1 * Math.pow(
                            (Math.log(1.08 * (_t - 1)) - Math.log(10)), 2
                        )
                    ) /
                    (2 * Math.pow(0.23, 2))
                )
            )
        );
        return isNaN(val) || val <= 0 ? 0 : val;
    }
}
