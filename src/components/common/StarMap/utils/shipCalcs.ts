const SYSTEM_SCALE_FACTOR = 5_000_000_000;

export const calculateTransferPath = (
	transfer: any,
	systemCenter: { x: number; y: number },
	scaleFactor = SYSTEM_SCALE_FACTOR,
): [number, number][] => {
	// 1. Safety Checks
	if (!transfer) return [];

	// Ensure systemCenter is valid
	const cx_sys = Number(systemCenter?.x);
	const cy_sys = Number(systemCenter?.y);
	if (isNaN(cx_sys) || isNaN(cy_sys)) return [];

	// 2. Parse transfer data safely
	let tData = transfer;
	if (typeof transfer === "string") {
		try {
			tData = JSON.parse(transfer);
		} catch (e) {
			console.warn("JSON Parse Error in calculateTransferPath", e);
			return [];
		}
	}

	// 3. Extract & Validate Numbers (Force to 0 if missing/invalid to prevent NaN)
	const cx = Number(tData.centerx || 0);
	const cy = Number(tData.centery || 0);
	const a = Number(tData.semimajoraxis || 0);
	const b = Number(tData.semiminoraxis || 0);
	const alpha = Number(tData.alpha || 0);

	const startX = Number(tData.startpositionx || 0);
	const startY = Number(tData.startpositiony || 0);
	const targetX = Number(tData.targetpositionx || 0);
	const targetY = Number(tData.targetpositiony || 0);

	if (a === 0 || b === 0) return []; // Cannot draw 0-size ellipse

	// 4. Calculate Angle Helper
	const getTheta = (px: number, py: number) => {
		const dx = px - cx;
		const dy = py - cy;
		const cosA = Math.cos(-alpha);
		const sinA = Math.sin(-alpha);
		const localX = dx * cosA - dy * sinA;
		const localY = dx * sinA + dy * cosA;
		return Math.atan2(localY / b, localX / a);
	};

	const startTheta = getTheta(startX, startY);
	const endTheta = getTheta(targetX, targetY);

	// 5. Shortest Arc Logic
	let deltaTheta = endTheta - startTheta;
	while (deltaTheta > Math.PI) deltaTheta -= 2 * Math.PI;
	while (deltaTheta < -Math.PI) deltaTheta += 2 * Math.PI;

	const path: [number, number][] = [];
	const segments = 64;

	// 6. Generate Points
	for (let i = 0; i <= segments; i++) {
		const t = i / segments;
		const theta = startTheta + deltaTheta * t;

		const cosT = Math.cos(theta);
		const sinT = Math.sin(theta);
		const cosA = Math.cos(alpha);
		const sinA = Math.sin(alpha);

		// Physics Position
		const xm = cx + a * cosT * cosA - b * sinT * sinA;
		const ym = cy + a * cosT * sinA + b * sinT * cosA;

		// Map Scale Position
		const mapX = cx_sys + xm / scaleFactor;
		const mapY = cy_sys - ym / scaleFactor; // Invert Y for map

		if (!isNaN(mapX) && !isNaN(mapY)) {
			path.push([mapX, mapY]);
		}
	}

	return path;
};
