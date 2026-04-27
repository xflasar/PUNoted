// gameEllipse.ts
const KM_TO_M = 1000;
const SYSTEM_SCALE_FACTOR = 5_000_000_000; // keep your map scale here

// ----------------- Small linear algebra + quaternion -----------------
class Vec3 {
	constructor(
		public x = 0,
		public y = 0,
		public z = 0,
	) {}
	clone() {
		return new Vec3(this.x, this.y, this.z);
	}
	sub(v: Vec3) {
		this.x -= v.x;
		this.y -= v.y;
		this.z -= v.z;
		return this;
	}
	add(v: Vec3) {
		this.x += v.x;
		this.y += v.y;
		this.z += v.z;
		return this;
	}

	// Quaternion multiplication-styled application (matches game code)
	applyQuaternion(q: Quaternion) {
		const x = this.x,
			y = this.y,
			z = this.z;
		const qx = q.x,
			qy = q.y,
			qz = q.z,
			qw = q.w;
		// Equivalent to the game's applyQuaternion implementation
		const ix = qw * x + qy * z - qz * y;
		const iy = qw * y + qz * x - qx * z;
		const iz = qw * z + qx * y - qy * x;
		const iw = -qx * x - qy * y - qz * z;
		this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
		this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
		this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
		return this;
	}

	applyAxisAngle(axis: Vec3, angle: number) {
		const q = new Quaternion().setFromAxisAngle(axis, angle);
		return this.applyQuaternion(q);
	}
}

class Quaternion {
	x = 0;
	y = 0;
	z = 0;
	w = 1;
	setFromAxisAngle(axis: Vec3, angle: number) {
		const half = angle / 2;
		const s = Math.sin(half);
		this.x = axis.x * s;
		this.y = axis.y * s;
		this.z = axis.z * s;
		this.w = Math.cos(half);
		return this;
	}
}

const Z_AXIS = new Vec3(0, 0, 1);

// ----------------- Ellipse helpers (game-faithful) -----------------

function _findTForPointOnEllipse(a: number, b: number, p: Vec3): number {
	// atan2(y/b, x/a) — same as game
	return Math.atan2(p.y / b, p.x / a);
}

function _calculateEllipseAt(out: Vec3, t: number, a: number, b: number): Vec3 {
	out.x = a * Math.cos(t);
	out.y = b * Math.sin(t);
	out.z = 0;
	return out;
}

function _calculateDistancesOnEllipse(tA: number, tB: number) {
	let delta = tB - tA;
	// Normalize to [-pi, pi]
	while (delta > Math.PI) delta -= 2 * Math.PI;
	while (delta < -Math.PI) delta += 2 * Math.PI;

	let sign = 1;
	if (delta < 0) {
		sign = -1;
		delta = -delta;
	} // minDistanceSign
	return { tA, tDistance: delta, minDistanceSign: sign };
}

/**
 * distanceOnEllipse(ellipse, startVec3, endVec3)
 * returns object used by waypointsOnEllipse in the game:
 * { tA, tDistance, minDistanceSign }
 */
function distanceOnEllipse(
	ellipse: {
		center: Vec3;
		semiMajorAxis: number;
		semiMinorAxis: number;
		alpha: number;
	},
	start: Vec3,
	end: Vec3,
) {
	// matches the game's: rotate point by +alpha into ellipse-local space
	const r = start
		.clone()
		.sub(ellipse.center)
		.applyAxisAngle(Z_AXIS, ellipse.alpha);
	const o = end
		.clone()
		.sub(ellipse.center)
		.applyAxisAngle(Z_AXIS, ellipse.alpha);

	const tA = _findTForPointOnEllipse(
		ellipse.semiMajorAxis,
		ellipse.semiMinorAxis,
		r,
	);
	const tB = _findTForPointOnEllipse(
		ellipse.semiMajorAxis,
		ellipse.semiMinorAxis,
		o,
	);

	return _calculateDistancesOnEllipse(tA, tB);
}

/**
 * waypointsOnEllipse(ellipse, startVec3, endVec3)
 * Reproduces the game's canonical sampling:
 * - computes distanceOnEllipse
 * - uses steps = ceil(tDistance / (2π) * 800)
 * - for i in [0..steps-1]: t = tA + minDistanceSign * (i/800 * 2π)
 * - calculates local ellipse point, rotates by -alpha, adds center, sets Z interpolation
 */
function waypointsOnEllipse(
	ellipse: {
		center: Vec3;
		semiMajorAxis: number;
		semiMinorAxis: number;
		alpha: number;
	},
	start: Vec3,
	end: Vec3,
): Vec3[] {
	const d = distanceOnEllipse(ellipse, start, end);
	const points: Vec3[] = [];
	const steps = Math.max(1, Math.ceil((d.tDistance / (2 * Math.PI)) * 800));

	for (let a = 0; a < steps; a++) {
		const s = d.tA + d.minDistanceSign * ((a / 800) * 2 * Math.PI);
		const l = _calculateEllipseAt(
			new Vec3(),
			s,
			ellipse.semiMajorAxis,
			ellipse.semiMinorAxis,
		);
		// rotate back by -alpha (game does this)
		l.applyAxisAngle(Z_AXIS, -ellipse.alpha);
		l.add(ellipse.center);
		// Z interpolation: same formula game uses (linear)
		l.z = (a / (steps - 1)) * end.z + (1 - a / (steps - 1)) * start.z;
		points.push(l);
	}
	return points;
}

// ----------------- Map-level API: produce map-space [x,y] waypoints -----------------

/**
 * calculateTransferPath(transfer, systemCenter)
 * - transfer: transfer object (or JSON string) with fields centerx, centery, semimajoraxis, semiminoraxis, alpha, startpositionx/y, targetpositionx/y
 * - systemCenter: {x:number,y:number} map coords of the system origin
 *
 * returns Array<[mapX, mapY]>
 */
export function calculateTransferPath(
	transfer: any,
	systemCenter: { x: number; y: number },
): [number, number][] {
	if (!transfer) return [];
	const t = typeof transfer === "string" ? JSON.parse(transfer) : transfer;

	const ellipse = {
		center: new Vec3(
			Number(t.centerx || 0) * KM_TO_M,
			Number(t.centery || 0) * KM_TO_M,
			0,
		),
		semiMajorAxis: Number(t.semimajoraxis || 0) * KM_TO_M,
		semiMinorAxis: Number(t.semiminoraxis || 0) * KM_TO_M,
		alpha: Number(t.alpha || 0),
	};

	if (!ellipse.semiMajorAxis || !ellipse.semiMinorAxis) return [];

	const start = new Vec3(
		Number(t.startpositionx || 0) * KM_TO_M,
		Number(t.startpositiony || 0) * KM_TO_M,
		0,
	);
	const end = new Vec3(
		Number(t.targetpositionx || 0) * KM_TO_M,
		Number(t.targetpositiony || 0) * KM_TO_M,
		0,
	);

	const points = waypointsOnEllipse(ellipse, start, end);

	// Map transform (same scale convention as used elsewhere)
	return points.map((p) => [
		systemCenter.x + p.x / SYSTEM_SCALE_FACTOR,
		systemCenter.y - p.y / SYSTEM_SCALE_FACTOR,
	]);
}

// ----------------- Ship position on the same ellipse (Kepler-solve) -----------------

// Kepler solver (same numeric approach game used)
function keplerEquation(e: number, M: number): number {
	// normalize M to [-pi, pi]
	const Mnorm =
		((((M + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;
	if (Math.abs(e) < 1e-8) return Mnorm;
	let E = e < 0.8 ? Mnorm : Math.PI;
	let delta = 1;
	for (let iter = 0; Math.abs(delta) > 1e-14 && iter < 100; iter++) {
		const f = E - e * Math.sin(E) - Mnorm;
		const fp = 1 - e * Math.cos(E);
		delta = -f / fp;
		E += delta;
	}
	return E;
}

/**
 * shipPositionOnEllipse(transfer, progress, systemCenter)
 * - progress in [0,1] along the flight time (linear interpolation of mean anomaly)
 * returns [mapX, mapY]
 */
export function shipPositionOnEllipse(
	transfer: any,
	progress: number,
	systemCenter: { x: number; y: number },
): [number, number] | null {
	if (!transfer) return null;
	const t = typeof transfer === "string" ? JSON.parse(transfer) : transfer;

	const KM_TO_M = 1000;

	const cx = Number(t.centerx || 0) * KM_TO_M;
	const cy = Number(t.centery || 0) * KM_TO_M;
	const a = Number(t.semimajoraxis || 0) * KM_TO_M;
	const b = Number(t.semiminoraxis || 0) * KM_TO_M;
	const alpha = Number(t.alpha || 0);

	if (!a || !b) return null;

	// 1. Calculate Eccentricity
	// e = sqrt(1 - (b/a)^2) assuming a >= b (standard for major axis)
	const ecc = Math.sqrt(Math.max(0, 1 - (b * b) / (a * a)));

	const startX = Number(t.startpositionx || 0) * KM_TO_M;
	const startY = Number(t.startpositiony || 0) * KM_TO_M;
	const targetX = Number(t.targetpositionx || 0) * KM_TO_M;
	const targetY = Number(t.targetpositiony || 0) * KM_TO_M;

	// --- LOCAL ROTATION (matches game) ---
	const center = new Vec3(cx, cy, 0);

	// Transform World -> Local (rotate by +alpha)
	const sLocal = new Vec3(startX, startY, 0)
		.sub(center)
		.applyAxisAngle(Z_AXIS, alpha);

	const eLocal = new Vec3(targetX, targetY, 0)
		.sub(center)
		.applyAxisAngle(Z_AXIS, alpha);

	// Calculate start/end Eccentric Anomalies (E)
	const startE = _findTForPointOnEllipse(a, b, sLocal);
	const endE = _findTForPointOnEllipse(a, b, eLocal);

	// --- SHORTEST ARC LOGIC ---
	// Ensure we interpolate along the shortest path on the ellipse ring
	let deltaE = endE - startE;
	while (deltaE > Math.PI) deltaE -= 2 * Math.PI;
	while (deltaE < -Math.PI) deltaE += 2 * Math.PI;

	const targetEUnwrapped = startE + deltaE;

	// 2. Convert to Mean Anomaly (M)
	// M = E - e * sin(E)
	const startM = startE - ecc * Math.sin(startE);
	const endM = targetEUnwrapped - ecc * Math.sin(targetEUnwrapped);

	// 3. Interpolate Mean Anomaly (M) linearly with time (progress)
	const clampedProgress = Math.min(1, Math.max(0, progress));
	const currentM = startM + (endM - startM) * clampedProgress;

	// 4. Solve for current Eccentric Anomaly (E)
	const currentE = keplerEquation(ecc, currentM);

	// --- ELLIPSE POSITION ---
	// Calculate local position from E
	const localPos = _calculateEllipseAt(new Vec3(), currentE, a, b);

	// Transform Local -> World (rotate by -alpha, match waypointsOnEllipse)
	localPos.applyAxisAngle(Z_AXIS, -alpha);
	localPos.add(center);

	// --- MAP SPACE (Y inverted) ---
	return [
		systemCenter.x + localPos.x / SYSTEM_SCALE_FACTOR,
		systemCenter.y - localPos.y / SYSTEM_SCALE_FACTOR, // Note: Y is usually subtracted in map projection
	];
}
