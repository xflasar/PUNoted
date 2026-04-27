// src/utils/orbit.ts
import type { MapPoint, PlanetData, XY } from "../types/mapTypes";
const SCALE_FACTOR = 5000000000;

/**
 * calculateOrbitEllipse
 * - 2D top-down ellipse using planetData.scaledOrbitalRadius
 * - small default segment count to avoid huge arrays
 */
export function calculateOrbitEllipse(
	starSystem: MapPoint,
	planetData: PlanetData & { scaledOrbitalRadius?: number },
	numSegments = 128,
): { path: XY[]; color: [number, number, number, number] } {
	const a_real = planetData.semimajoraxis ?? 1e10; // meters
	const e = planetData.eccentricity ?? 0;

	// semi-latus rectum
	const p = a_real * (1 - e * e);

	// Orbital elements (radians)
	const i_rad = planetData.inclination ?? 0;
	const raan_rad = planetData.rightascension ?? 0; // Ω
	const aop_rad = planetData.periapsis ?? 0; // ω

	const path: XY[] = new Array(numSegments + 1);

	for (let j = 0; j <= numSegments; j++) {
		const nu = (j / numSegments) * Math.PI * 2; // true anomaly

		// radius in orbital plane
		const r = p / (1 + e * Math.cos(nu));

		// position in orbital plane
		const xOrb = r * Math.cos(nu);
		const yOrb = r * Math.sin(nu);
		const zOrb = 0;

		// rotate from orbital plane -> inertial frame
		// orbitalPlaneToInertial returns [X, Y, Z]
		const inertial = orbitalPlaneToInertial(
			[yOrb, xOrb, zOrb],
			raan_rad,
			aop_rad,
			i_rad,
		);

		// apply the same display scaling and axis sign convention as calculateMovingPlanetPosition
		const finalX = starSystem.x + inertial[0] / SCALE_FACTOR;
		const finalY = starSystem.y - inertial[1] / SCALE_FACTOR;

		path[j] = [finalX, finalY];
	}

	return { path, color: [0, 255, 255, 100] };
}

function rotationMatrix(angleRad: number, axis: 1 | 3): number[] {
	// axis: 3 = z-axis rotation, 1 = x-axis rotation (following your vector.r conventions)
	const c = Math.cos(angleRad);
	const s = Math.sin(angleRad);
	if (axis === 3) {
		// Rz(angle)
		return [c, -s, 0, s, c, 0, 0, 0, 1];
	} else {
		// Rx(angle)
		return [1, 0, 0, 0, c, -s, 0, s, c];
	}
}

/**
 * Convert position in orbital plane to inertial frame:
 * x: [x, y, z] in orbital plane
 * Ω (raan), ω (arg of periapsis), i (inclination) all in radians
 *
 * Uses the same multiplication order as your original:
 * Rz(-Ω) * Rx(-i) * Rz(-ω) * x
 */
export function orbitalPlaneToInertial(
	x: number[],
	Ω: number,
	ω: number,
	i: number,
): number[] {
	// Rz(-Ω)
	const Rz_negΩ = rotationMatrix(-Ω, 3);
	// Rx(-i)
	const Rx_negi = rotationMatrix(-i, 1);
	// Rz(-ω)
	const Rz_negω = rotationMatrix(-ω, 3);

	// tmp1 = Rz(-ω) * x  (returns vector)
	const tmp1 = matrixMultiply(Rz_negω, x) as number[];
	// tmp2 = Rx(-i) * tmp1
	const tmp2 = matrixMultiply(Rx_negi, tmp1) as number[];
	// result = Rz(-Ω) * tmp2
	const result = matrixMultiply(Rz_negΩ, tmp2) as number[];
	return result;
}

function matrixMultiply(
	m1: number[],
	m2: number[] | number[],
): number[] | null {
	// m1: 3x3 array (length 9)
	// m2: either 3x3 (length 9) or vector length 3
	if (m2.length === 9) {
		return [
			m1[0] * m2[0] + m1[1] * m2[3] + m1[2] * m2[6],
			m1[0] * m2[1] + m1[1] * m2[4] + m1[2] * m2[7],
			m1[0] * m2[2] + m1[1] * m2[5] + m1[2] * m2[8],
			m1[3] * m2[0] + m1[4] * m2[3] + m1[5] * m2[6],
			m1[3] * m2[1] + m1[4] * m2[4] + m1[5] * m2[7],
			m1[3] * m2[2] + m1[4] * m2[5] + m1[5] * m2[8],
			m1[6] * m2[0] + m1[7] * m2[3] + m1[8] * m2[6],
			m1[6] * m2[1] + m1[7] * m2[4] + m1[8] * m2[7],
			m1[6] * m2[2] + m1[7] * m2[5] + m1[8] * m2[8],
		];
	} else if (m2.length === 3) {
		return [
			m1[0] * m2[0] + m1[1] * m2[1] + m1[2] * m2[2],
			m1[3] * m2[0] + m1[4] * m2[1] + m1[5] * m2[2],
			m1[6] * m2[0] + m1[7] * m2[1] + m1[8] * m2[2],
		];
	}
	return null;
}
