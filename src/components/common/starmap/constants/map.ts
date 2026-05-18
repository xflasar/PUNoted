import type { OrthographicViewState } from "../types/maptypes";

export const INITIAL_VIEW_STATE: OrthographicViewState = {
	target: [0, 0],
	zoom: -3,
	minZoom: -3,
	maxZoom: 8,
	pitch: 0,
	bearing: 0,
};

export const BASE_PLANET_SIZE = 1;
export const BASE_ORBIT_DISTANCE = 1;
export const PLANET_SPACING_BUFFER = 2;
export const INITIAL_STAR_SIZE = 25;
export const SYSTEM_STAR_SIZE = 50;

export const REFERENCE_EPOCH = 1451690603;
export const PLANETARY_MOTION_FACTOR = 20;

export const PLANET_ZOOM_THRESHOLD = 4;
export const SYSTEM_ZOOM_THRESHOLD = -2;

export const BASE_RADIUS = 5;
export const POP_SCALE = 3.5;
export const MAX_PIXEL_RADIUS = 12;

export const SYSTEM_BASE_RADIUS = 3;
export const SYSTEM_MAX_RADIUS_INCREMENT = 20;
export const PLANET_BASE_RADIUS = 0.5;
export const PLANET_MAX_RADIUS_INCREMENT = 12;

export const CELL_SIZE = 50;

export const MIN_ICON_PIXELS = 5; // Icons never get smaller than this
export const MAX_ICON_PIXELS = 100; // Icons never get bigger than this
export const REF_ZOOM = 0; // The zoom level where scale is 1:1

// label and visibility tuning
export const LABEL_ZOOM_THRESHOLD = 0.5; // below this hide most labels
export const LABEL_POP_THRESHOLD = 1000; // show labels for systems below zoom only if population > this
export const MAX_LABELS_AT_ONCE = 200; // simple throttle for label count
export const SYSTEMS_VISIBLE_ZOOM = -2; // show systems when zoom >= SYSTEMS_VISIBLE_ZOOM

export const GALAXY_TO_SYSTEM_ZOOM_IN_THRESHOLD = 8; // Zoom to enter system view (click/zoom-in)
export const SYSTEM_TO_GALAXY_ZOOM_OUT_THRESHOLD = 5; // Zoom to exit system view
