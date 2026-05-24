import { EMPIRE_PALETTE, NEUTRAL_COLOR } from "../constants/colors";

export const hexToRgba = (
	hex: string,
	alpha = 255,
): [number, number, number, number] => {
	const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	if (!m) return [0, 0, 0, alpha];
	return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16), alpha];
};

export const assignEmpireColors = (codes: string[]) => {
	const map: Record<string, string> = {};
	const paletteKeys = Object.keys(EMPIRE_PALETTE);
	let idx = 0;
	for (const c of codes) {
		if ((EMPIRE_PALETTE as any)[c]) map[c] = (EMPIRE_PALETTE as any)[c];
		else
			map[c] =
				(EMPIRE_PALETTE as any)[paletteKeys[idx % paletteKeys.length]] || null;
		idx++;
	}
	return map;
};

export function getPlanetColorByPopulation(
	population: number,
	maxPlanetPopulationInContext: number,
): [number, number, number, number] {
	// Light Blue/Grey - used for zero population or errors.
	const defaultColor: [number, number, number, number] = [100, 100, 100, 255];
	const VISUAL_POP_FLOOR = 100; // Population at or below this level gets the minimum color intensity (I_MIN).
	const I_MIN = 0.1; // Minimum visual intensity factor.
	const I_MAX = 1.0; // Maximum visual intensity factor.

	if (maxPlanetPopulationInContext <= 0 || population <= 0) {
		return defaultColor;
	}

	// 1. Calculate Logarithmic Values
	const currentLog = Math.log10(Math.max(1, population));
	const maxLog = Math.log10(Math.max(1, maxPlanetPopulationInContext));

	// Define the logarithmic floor L_floor. Populations below this are clamped.
	const logFloor = Math.log10(VISUAL_POP_FLOOR);

	// 2. Determine Intensity Factor
	let intensityFactor: number;

	if (currentLog <= logFloor) {
		// Clamp low populations to the minimum visual intensity (0.1)
		intensityFactor = I_MIN;
	} else {
		// Calculate the effective range and stretch the factor from I_MIN to I_MAX
		const effectiveLogRange = maxLog - logFloor;

		if (effectiveLogRange <= 1e-6) {
			// Handle systems where max pop is near floor (or equals it)
			intensityFactor = I_MAX;
		} else {
			// Normalize log(population) over the new effective log range.
			const normalizedFactor = (currentLog - logFloor) / effectiveLogRange;

			// Stretch the result from [0, 1] to the target range [I_MIN, I_MAX]
			intensityFactor = I_MIN + (I_MAX - I_MIN) * normalizedFactor;
		}
	}

	// Ensure the intensity is clamped between 0.1 and 1.0
	const I = Math.min(I_MAX, Math.max(I_MIN, intensityFactor));

	// 3. Interpolate Color (Light Cyan -> Yellow -> Dark Red) using the stretched intensity I
	// First, map the intensity range [0.1, 1.0] to an interpolation factor t [0, 1]
	const t = (I - I_MIN) / (I_MAX - I_MIN);

	let r, g, b;

	if (t < 0.5) {
		// Transition 1: Light Cyan (t=0) -> Yellow (t=0.5)
		const t1 = t * 2; // t1 goes from 0 to 1

		// R: 100 -> 255
		r = Math.round(100 + (255 - 100) * t1);
		// G: 255 -> 255
		g = 255;
		// B: 255 -> 100
		b = Math.round(255 + (100 - 255) * t1);
	} else {
		// Transition 2: Yellow (t=0.5) -> Dark Red (t=1)
		const t2 = (t - 0.5) * 2; // t2 goes from 0 to 1

		// R: 255 -> 200
		r = Math.round(255 + (200 - 255) * t2);
		// G: 255 -> 0
		g = Math.round(255 + (0 - 255) * t2);
		// B: 100 -> 0
		b = Math.round(100 + (0 - 100) * t2);
	}

	// Cap R, G, B values to ensure they are within [0, 255]
	r = Math.max(0, Math.min(255, r));
	g = Math.max(0, Math.min(255, g));
	b = Math.max(0, Math.min(255, b));

	return [r, g, b, 255];
}
