import * as THREE from 'three';
import { randInt } from 'three/src/math/MathUtils.js';


export class Location {
    constructor() {
        this.bees_present = 0;
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

        const lowerBound = Math.min(frustumSize * .1, 10);
        const upperBound = Math.max(frustumSize * .9, frustumSize - 10);
        const centerMargin = frustumSize / 2;
        const x = centerMargin - randInt(lowerBound, upperBound);
        const y = 3;
        const z = centerMargin - randInt(lowerBound, upperBound);
        this.radius = randInt(1, 3);
        const segments = 6;

        this.position = new THREE.Vector3(x, y, z);
        this.geometry = new THREE.CircleGeometry(this.radius, segments);
        this.color = new THREE.Color(
            `hsl(${randInt(270, 320)}, ${randInt(50, 80)}%, ${randInt(50, 80)}%)`
        )
        this.material = new THREE.MeshPhongMaterial({ color: this.color, side: THREE.DoubleSide });
        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.position.copy(this.position);
        this.mesh.rotation.x = -Math.PI / 2

        this.nectar_base_level = randInt(2, 3) * this.radius;
        this.nectar_level = this.nectar_base_level;
        this.recoup_timer = 0;
        this.average_attractiveness = randInt(1, 100) / 100;
    }


    update(delta) {
        const currentColor = new THREE.Color().lerpColors(Patch.BLACK, this.color, this.nectar_level / this.nectar_base_level);
        this.material.color.set(currentColor);

        if (this.nectar_level == 0 && this.recoup_timer < 3) {
            this.recoup_timer += delta;
        } else {
            this.recoup_timer = 0;
            this.nectar_level = Math.min(
                this.nectar_base_level,
                this.nectar_level + delta
            );
        }
    }

    collectNectar(delta) {
        const nectar = Math.min(this.nectar_level, 4 * delta);
        this.nectar_level = Math.max(
            0,
            this.nectar_level -= nectar
        );
        return nectar;
    }


    /**
     * @param {Hive} hive
     * @param {number} time 
     */
    getWeight(hive, time) {
        // if (this.name == 2) {
        //     console.log(`Patch ${this.name}: ${this.#f(hive.position, this.position, this.nectar_base_level, this.nectar_level, this.bees_present, time, this.average_attractiveness)}`);
        // }
        return this.#f(hive.position, this.position, this.nectar_base_level, this.nectar_level, this.bees_present, time, this.average_attractiveness);
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
            100 *
            Patch.#z(t) *
            Math.pow(n / size, 2) *
            a *
            (2 / (1 + Math.exp(b / size)))
        );
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
            1,
            (
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
        return isNaN(val) || val <= 0 ? 0 : (val);
    }
}
