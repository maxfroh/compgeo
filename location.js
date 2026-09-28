import * as THREE from 'three';
import { randInt } from 'three/src/math/MathUtils.js';
import { BEE_COLLECTION_TIME, MIN_PER_DAY } from './parameters';


export class Location {
    constructor() {
        this.beesPresent = 0;
    }
}


export class Hive extends Location {
    constructor(scene, renderer, frustumSize) {
        super();
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


export class Patch extends Location {
    static BLACK = new THREE.Color().setHSL(0, 0, 0);
    static label = 0;

    constructor(frustumSize) {
        super();
        this.name = Patch.label;
        Patch.label += 1;

        this.lowerBound = Math.min(frustumSize * .1, 10);
        this.upperBound = Math.max(frustumSize * .9, frustumSize - 10);
        const centerMargin = frustumSize / 2;
        const x = centerMargin - randInt(this.lowerBound, this.upperBound);
        const y = 3;
        const z = centerMargin - randInt(this.lowerBound, this.upperBound);
        this.radius = randInt(1, 3);
        const segments = 6;

        this.position = new THREE.Vector3(x, y, z);
        console.log(`Patch ${this.name} is ${this.position.distanceTo(new THREE.Vector3(0, 0, 0))} from the hive`);
        this.geometry = new THREE.CircleGeometry(this.radius, segments);
        this.color = new THREE.Color(
            `hsl(${randInt(270, 320)}, ${randInt(50, 80)}%, ${randInt(50, 80)}%)`
        )
        this.material = new THREE.MeshPhongMaterial({ color: this.color, side: THREE.DoubleSide });
        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.position.copy(this.position);
        this.mesh.rotation.x = -Math.PI / 2

        this.nectarBaseLevel = randInt(2, 3) * this.radius;
        this.nectarLevel = this.nectarBaseLevel;
        this.recoupTimer = 0;
        this.averageAttractiveness = randInt(1, 100) / 100;
    }


    update(delta) {
        const currentColor = new THREE.Color().lerpColors(Patch.BLACK, this.color, this.nectarLevel / this.nectarBaseLevel);
        this.material.color.set(currentColor);
        if(this.name == 2) {
            // console.log(`n: ${this.nectarLevel} r: ${this.recoupTimer}`);
        }
        if (this.nectarLevel == 0 && this.recoupTimer < 3) {
            this.recoupTimer += delta / (MIN_PER_DAY * 60);
        } else {
            this.recoupTimer = 0;
            this.nectarLevel = Math.min(
                this.nectarBaseLevel,
                this.nectarLevel + delta / (MIN_PER_DAY * 60)
            );
        }
    }

    collectNectar(delta) {
        const nectar = Math.min(this.nectarLevel, delta / BEE_COLLECTION_TIME);
        this.nectarLevel = Math.max(
            0,
            this.nectarLevel - nectar
        );
        if(this.name == 2) {
            // console.log(`returning ${nectar} | n: ${this.nectarLevel}`);
        }
        return nectar;
    }


    /**
     * @param {Hive} hive
     * @param {number} time 
     */
    getWeight(hive, time) {
        return this.#f(hive.position, this.position, this.nectarBaseLevel, this.nectarLevel, this.beesPresent, time, this.averageAttractiveness);
    }


    /**
     * @param {Vector3} p_h The location of the hive.
     * @param {Vector3} p_t The location of the target patch.
     * @param {number} size The total nectar capacity of the target.
     * @param {number} n The current nectar capacity of the target.
     * @param {number} b The current number of bees at the target.
     * @param {number} t The time of day (any number in [0, 24)).
     * @param {number} a The average attractiveness of flowers in the target patch.
     * @returns {number} The weight of the patch. 
    */
    #f(p_h, p_t, size, n, b, t, a) {
        // console.log(`Patch ${this.name}: ${10 * (60 * this.#q(p_h, p_t, t) + 30 * Math.exp(-2 * b / size) + 10 * a)}`);

        return (
            // (
            //     Math.log(
            //         0.154 * Patch.#z(t) / (1 + p_h.distanceTo(p_t))
            //     )
            // ) +
            // (
            //     -1 * (1 - Patch.#z(t)) +
            //     Patch.#z(t) * 1 / (p_h.distanceTo(p_t) + 1)
            // ) *
            10 *
            (40 * this.#q(p_h, p_t, t) *
                10 * Math.exp(-2 * b / size) +
                10 * a)
            // (2 / (1 + Math.exp(b / size)))
        );
    }

    /**
     * @param {THREE.Vector3} p_h 
     * @param {THREE.Vector3} p_t 
     * @param {number} t
     */
    #q(p_h, p_t, t) {
        const squeezeFactor = 3.5;
        const squeezed_p_h = p_h.clone().multiplyScalar(squeezeFactor);
        const squeezed_p_t = p_t.clone().multiplyScalar(squeezeFactor);
        const m = squeezeFactor * Math.abs(this.upperBound - this.lowerBound) / 2; // maximum distance possible from hive along x/z-axis
        const d_max = Math.sqrt(2 * Math.pow(m, 2)); // maximum distance (sqrt[m^2 + m^2])
        const d = squeezed_p_h.distanceTo(squeezed_p_t) / d_max; // normalize distance
        const distanceDaylightFactor = d / Math.pow(0.3 * Patch.#z(t), -1 * d);
        const maxDDF = 10 / 3;
        const normalizedDDF = distanceDaylightFactor / maxDDF;
        return Math.max(0, normalizedDDF);
    }

    /**
     * Modified lognormal distribution.
     * Scaled for t in [0, 24).
     * 
     * Will return higher values the closer it gets to the ideal time of day for honey bees to forage (~7am-1:30pm).
     */
    static #z(t) {
        const _t = Math.min(24.01, Math.max(t, 1.01));
        const std = 0.31;
        const mu = 12;
        const scaleFactor = 7;
        const z_max = scaleFactor * Math.exp(Math.pow(std, 2) / 2) / (mu * std * Math.sqrt(2 * Math.PI));
        const val = Math.min(
            1,
            (
                scaleFactor * (
                    1 / (1.08 * std * (_t - 1) * Math.sqrt(2 * Math.PI))
                ) *
                Math.exp(
                    (
                        -1 * Math.pow(
                            (Math.log(1.08 * (_t - 1)) - Math.log(mu)), 2
                        )
                    ) /
                    (2 * Math.pow(std, 2))
                )
            )
        );
        return (isNaN(val) || val <= 0) ? 0 : (val / z_max);
    }
}
