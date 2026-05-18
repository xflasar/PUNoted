import { TextLayer } from "@deck.gl/layers";
import { CollisionFilterExtension } from "@deck.gl/extensions";

// Initialize extension once to save memory
const collisionFilter = new CollisionFilterExtension();

export function createSystemLabelLayer({
	id = "system-labels-factory",
	systems,
	visible = true,
}: {
	id?: string;
	systems: any[];
	visible?: boolean;
	// Removed unused props like viewport/screenMap
}) {
	// If not visible or empty, return empty layer
	if (!systems?.length || !visible) {
		return new TextLayer({ id, data: [], visible });
	}

	return new TextLayer({
		id,
		data: systems, // Pass ALL 5000 systems. GPU handles the rest.

		// 1. Text Appearance
		getPosition: (d: any) => [d.x, d.y],
		getText: (d: any) => d.label,
		getSize: 12,
		getColor: [255, 255, 255, 255],

		// 2. Background Box (Helps readability)
		billboard: true,
		background: true,
		getBackgroundColor: [0, 0, 0, 160],
		backgroundPadding: [4, 2],

		// 3. GPU COLLISION (The Performance Fix)
		// This extension hides overlapping text automatically on the GPU.
		extensions: [collisionFilter],
		collisionEnabled: true,

		// Priority: Higher population stars "win" the collision battle
		getCollisionPriority: (d: any) => Math.log1p(d.population ?? 0),

		// Settings: Scale up the collision box to add "padding" between labels
		collisionTestProps: {
			sizeScale: 2.5, // 2.5x larger bounding box ensures labels aren't crowded
		},

		// 4. Optimization
		getPixelOffset: [15, -15], // Constant offset (Top-Right)
		sizeUnits: "pixels",
		pickable: false, // Important: Disable picking on labels to save CPU on hover
		visible,

		// 5. Stability
		// Ensure deck.gl knows to only update if data/visibility changes
		updateTriggers: {
			getCollisionPriority: [systems],
		},
	});
}

/**
 * Planet Labels (Simpler, no collision needed usually)
 */
export function createPlanetLabelLayer({
	id = "planet-labels-factory",
	planets,
	visible = true,
}: any) {
	if (!planets?.length) return new TextLayer({ id, data: [], visible });

	return new TextLayer({
		id,
		data: planets,
		getPosition: (d: any) => [d.x, d.y],
		getText: (d: any) => d.name,
		getSize: 12,
		getColor: [255, 255, 255, 230],
		getPixelOffset: [0, -25],
		billboard: true,
		background: true,
		getBackgroundColor: [0, 0, 0, 150],
		visible,
		pickable: false,
	});
}
