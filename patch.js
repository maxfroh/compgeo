import * as THREE from 'three';
import { randInt } from 'three/src/math/MathUtils.js';


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

        this.nectar_level = 1;
        this.bees_present = 1;
        this.average_attractiveness = 1;
    }

    getWeight(hive, time) {
        return this.#f(hive.position, this.position, this.nectar_level, this.bees_present, time, this.average_attractiveness);
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
        return (1 / p_h.distanceTo(p_t)) * n * (1 / b) * Patch.#z(t) * a;
    }

    // modified form of lognormal distribution
    static #z(t) {
        return (
            2 * Math.min(
                1,
                10 * (
                    1 / (1.08 * 0.23 * (t - 1) * Math.sqrt(2 * Math.PI))
                ) *
                Math.exp(
                    (
                        -1 * Math.pow(
                            Math.log(1.08 * (t - 1)) - Math.log(10), 2
                        )
                    ) /
                    (2 * Math.pow(0.23, 2))
                )
            )
        ) || 0;
    }
}

/*
p_h = (x,y,z) of the hive
p_t = (x,y,z) of the target
n = nectar capacity of the target
b = current number of bees at the target
t = time of day ([0, 24))
a = attractiveness of flowers in patch

f(p_h, p_t, n, b, t, a) = (1 / distance(p_h, p_t)) * n * (1 / b) * z(t) * a

z(t) = (2 * Math.min(1, 
    10 * (1 / (1.08 * 0.23 * (t - 1) * Math.sqrt(2 * Math.PI))) * Math.exp((-1 * Math.pow(Math.log(1.08 * (t - 1)) - Math.log(10), 2)) / (2 * Math.pow(0.23, 2)))
)) || 0

*/

/**
 * @param {Vector3} p_h The location of the hive.
 * @param {Vector3} p_t The location of the target patch.
 * @param {number} n The total nectar capacity of the target (number of flowers).
 * @param {number} b The current number of bees at the target.
 * @param {number} t The time of day (any number in [0, 24)).
 * @param {number} a The average attractiveness of flowers in the target patch.
 * @returns {number} The weight of the patch. 
 */

function get_weight(p_h, p_t, n, b, t, a) {
    return (1 / p_h.distanceTo(p_t)) * n * (1 / b) * z(t) * a;
}

// modified form of lognormal distribution
function z(t) {
    return (
        2 * Math.min(
            1,
            10 * (
                1 / (1.08 * 0.23 * (t - 1) * Math.sqrt(2 * Math.PI))
            ) *
            Math.exp(
                (
                    -1 * Math.pow(
                        Math.log(1.08 * (t - 1)) - Math.log(10), 2
                    )
                ) /
                (2 * Math.pow(0.23, 2))
            )
        )
    ) || 0;
}