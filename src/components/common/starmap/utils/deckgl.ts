import { TransitionInterpolator } from "@deck.gl/core";

/* Minimal interpolator for smooth fly-to */
export class CartesianInterpolator extends TransitionInterpolator {
	constructor() {
		super({ compare: ["target", "zoom"] });
	}
	interpolateProps(startProps: any, endProps: any, t: number) {
		const next: any = {};
		if (startProps.target && endProps.target) {
			next.target = [
				startProps.target[0] + (endProps.target[0] - startProps.target[0]) * t,
				startProps.target[1] + (endProps.target[1] - startProps.target[1]) * t,
			];
		} else next.target = endProps.target || startProps.target;
		next.zoom =
			(startProps.zoom ?? 0) +
			((endProps.zoom ?? 0) - (startProps.zoom ?? 0)) * t;
		return next;
	}
	getT(p: number) {
		return p;
	}
}

// Controller logic to disable dragging/panning in system view
export const controllerForPlanetMode = (isPlanetModeActive: boolean) => {
	if (!isPlanetModeActive) return true;
	return {
		dragPan: true, // allow pan but we will clamp it inside handler
		dragRotate: false,
		scrollZoom: true,
		doubleClickZoom: false,
		touchZoom: true,
		touchRotate: false,
	};
};
