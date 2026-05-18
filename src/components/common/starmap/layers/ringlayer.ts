import { ScatterplotLayer } from "@deck.gl/layers";
import type { MapPoint } from "../types/maptypes";

// Define the fixed order of rendering (innermost to outermost)
const POP_TYPES_RENDER_ORDER = [
	"SCIENTIST",
	"ENGINEER",
	"TECHNICIAN",
	"SETTLER",
	"PIONEER",
];

export function createSystemRingLayer({
	id = "system-population-rings",
	systems,
	visible = true,
}: {
	id?: string;
	systems: MapPoint[];
	visible?: boolean;
}) {
	if (!visible || !systems || systems.length === 0) {
		return new ScatterplotLayer({ id, data: [], visible: false });
	}

	const ringData: {
		x: number;
		y: number;
		radius: number;
		color: number[];
		popType: string;
		width: number;
	}[] = [];

	// ------------------------------------------------------------------
	// This multiplier controls the overall thickness of all rings.
	// Increase this value (e.g., to 50.0 or 100.0) to make the rings visually thicker.
	const WIDTH_SCALING_FACTOR = 2.5;
	// ------------------------------------------------------------------

	// Minimum width ensures the smallest population rings are still visible
	const MIN_LINE_WIDTH = 3.0;

	for (const sys of systems) {
		if (!sys.popBreakdown || sys.popBreakdown.length === 0) continue;

		const totalPopulation = sys.population || 1; // Use 1 to prevent division by zero

		// Use the log of the total population as a scaling factor.
		// A larger system will have a higher factor, making its rings physically thicker.
		const totalPopLogFactor = Math.log10(totalPopulation + 1);

		// Convert the array into a Map for quick lookup based on the fixed order
		const breakdownMap = new Map(sys.popBreakdown.map((b) => [b.type, b]));

		// START RADIUS: Begins at the outer edge of the central system dot.
		const START_RADIUS = (sys.radiusHint ? sys.radiusHint : 1) / 2 || 5;
		let currentRadius = START_RADIUS;

		// Iterate through the FIXED ORDER (SCIENTIST -> PIONEER)
		for (const type of POP_TYPES_RENDER_ORDER) {
			const breakdown = breakdownMap.get(type);

			if (!breakdown || breakdown.count === 0) continue;

			const currentCount = breakdown.count;

			// 1. Calculate Proportional Width (Thickness)
			//    - Ratio: (currentCount / totalPopulation) gives the segment's share (0 to 1).
			//    - Multiplier: totalPopLogFactor scales the result by the system's absolute size.
			//    - WIDTH_SCALING_FACTOR controls the final pixel width.
			const proportionalWidth = Math.max(
				MIN_LINE_WIDTH,
				(currentCount / totalPopulation) *
					totalPopLogFactor *
					WIDTH_SCALING_FACTOR,
			);

			// 2. Calculate the center radius for the current ring (for stacking).
			const ringCenterRadius = currentRadius + proportionalWidth / 2;

			ringData.push({
				x: sys.x,
				y: sys.y,
				radius: ringCenterRadius,
				color: breakdown.color,
				popType: breakdown.type,
				width: proportionalWidth,
			});

			// 3. Advance the current radius position to the outer edge of this ring.
			currentRadius += proportionalWidth;
		}
	}

	// Sort to ensure the largest radius (PIONEER) is drawn FIRST (BOTTOM layer).
	// This maintains the correct concentric stacking order.
	ringData.sort((a, b) => b.radius - a.radius);

	return new ScatterplotLayer({
		id,
		data: ringData,
		getPosition: (d: any) => [d.x, d.y],

		getFillColor: [0, 0, 0, 0], // Fill must be transparent
		getLineColor: (d: any) => d.color,
		getLineWidth: (d: any) => d.width, // Use the calculated proportional width

		getLineMinPixels: 1,
		lineWidthUnits: "pixels",
		radiusUnits: "pixels",

		getRadius: (d: any) => d.radius, // Use the calculated center radius
		radiusScale: 1,

		stroked: true,

		updateTriggers: {
			data: [systems],
		},
		visible,
	});
}
