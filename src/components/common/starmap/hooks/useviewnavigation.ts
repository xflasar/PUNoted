import { useCallback, useEffect } from "react";
// Removed throttle for view state updates to ensure immediate clamping
import { CartesianInterpolator } from "../utils/deckgl";
import type { MapPoint, OrthographicViewState } from "../types/maptypes";

const GALAXY_TO_SYSTEM_ZOOM_IN_THRESHOLD = 2;
const SYSTEM_PAN_OFFSET = 40;

// Utility to compare floating-point numbers
function approxEqual(arg0: any, arg1: number): boolean {
	const a = Number(arg0 ?? 0);
	const b = Number(arg1 ?? 0);

	if (!isFinite(a) || !isFinite(b)) return a === b;
	if (Number.isNaN(a) || Number.isNaN(b)) return false;

	const diff = Math.abs(a - b);
	const EPS = 1e-6;
	return diff <= EPS || diff <= EPS * Math.max(1, Math.abs(a), Math.abs(b));
}

interface UseViewNavigationProps {
	systemsPoints: MapPoint[];
	isGalaxyView: boolean;
	galaxyViewState: any;
	setGalaxyViewState: React.Dispatch<React.SetStateAction<any>>;
	setSystemViewState: React.Dispatch<React.SetStateAction<any>>;
	centeredSystem: MapPoint | null;
	setCenteredSystem: (system: MapPoint | null) => void;
	currentViewMode: "galaxy" | "system";
	setCurrentViewMode: React.Dispatch<React.SetStateAction<"galaxy" | "system">>;
	ignoreOnViewStateChangeRef: React.MutableRefObject<boolean>;
	systemBoundsRef: React.MutableRefObject<{
		minX: number;
		maxX: number;
		minY: number;
		maxY: number;
	} | null>;
	initialPlanetZoomRef: React.MutableRefObject<number | null>;
	viewStateRef: React.MutableRefObject<any>;
	maxSystemZoom: number;
	minSystemZoom: number;
	previousGalaxyViewStateRef: React.MutableRefObject<any | null>;
	viewportWidth: number;
	viewportHeight: number;
	mode: string;
	systemExitZoomRef: React.MutableRefObject<number | null>;
}

function viewStateChanged(a: any, b: any) {
	if (!a || !b) return true;

	return (
		!approxEqual(a.target?.[0], b.target?.[0]) ||
		!approxEqual(a.target?.[1], b.target?.[1]) ||
		!approxEqual(a.zoom, b.zoom)
	);
}

export const useViewNavigation = ({
	systemsPoints,
	isGalaxyView,
	galaxyViewState,
	setGalaxyViewState,
	setSystemViewState,
	centeredSystem,
	setCenteredSystem,
	currentViewMode,
	setCurrentViewMode,
	ignoreOnViewStateChangeRef,
	systemBoundsRef,
	initialPlanetZoomRef,
	viewStateRef,
	mode,
	systemExitZoomRef,
}: UseViewNavigationProps) => {
	// --- Transition Logic ---

	const transitionToGalaxyView = useCallback(() => {
		if (!centeredSystem) return;

		ignoreOnViewStateChangeRef.current = true;
		setCenteredSystem(null);
		setCurrentViewMode("galaxy");

		setGalaxyViewState((v: any) => ({
			...v,
			target: [centeredSystem.x, centeredSystem.y],
			zoom: GALAXY_TO_SYSTEM_ZOOM_IN_THRESHOLD - 1,
			transitionDuration: 0,
			transitionInterpolator: new CartesianInterpolator(),
		}));
	}, [
		centeredSystem,
		setCenteredSystem,
		setCurrentViewMode,
		setGalaxyViewState,
		ignoreOnViewStateChangeRef,
	]);

	const transitionToSystemView = useCallback(
		(system: MapPoint) => {
			ignoreOnViewStateChangeRef.current = true;
			setCenteredSystem(system);

			setGalaxyViewState((v: any) => ({
				...v,
				target: [system.x, system.y],
				transitionDuration: 500,
				transitionInterpolator: new CartesianInterpolator(),
			}));
		},
		[setCenteredSystem, setGalaxyViewState, ignoreOnViewStateChangeRef],
	);

	const onSystemClick = useCallback(
		(sys: MapPoint | null) => {
			if (!sys) return;
			if (currentViewMode === "galaxy") {
				transitionToSystemView(sys);
			} else if (currentViewMode === "system") {
				transitionToGalaxyView();
			}
		},
		[currentViewMode, transitionToSystemView, transitionToGalaxyView],
	);

	// --- View State Logic ---

	const handleIgnoredViewStateChange = (next: OrthographicViewState) => {
		if (!ignoreOnViewStateChangeRef.current) return;

		ignoreOnViewStateChangeRef.current = false; // 🔴 BREAK THE LOOP

		if (currentViewMode === "system") {
			setSystemViewState(next);
		} else {
			const old = viewStateRef.current || {};
			if (viewStateChanged(old, next)) {
				setGalaxyViewState(next);
			}
		}
	};

	/**
	 * Calculates the constrained view state for System Mode.
	 * Returns the valid next state, or null if no change is needed.
	 */
	const getConstrainedSystemViewState = (next: any) => {
		// 1. Check Exit Threshold (Zoom Out)
		// We do this first to catch the exit intent immediately
		const exitThreshold = systemExitZoomRef?.current ?? -1;

		if (next.zoom < exitThreshold) {
			if (currentViewMode === "system") {
				transitionToGalaxyView();
			}
			return null; // 🔴 do NOT keep clamping
		}

		const bounds = systemBoundsRef.current;

		if (bounds) {
			// 2. Pan Clamping (Stay within system bounds)
			const [tx, ty] = next.target;
			const minX = bounds.minX - SYSTEM_PAN_OFFSET;
			const maxX = bounds.maxX + SYSTEM_PAN_OFFSET;
			const minY = bounds.minY - SYSTEM_PAN_OFFSET;
			const maxY = bounds.maxY + SYSTEM_PAN_OFFSET;

			const clampedX = Math.max(minX, Math.min(maxX, tx));
			const clampedY = Math.max(minY, Math.min(maxY, ty));

			// Return the clamped state
			return {
				...next,
				target: [clampedX, clampedY],
				zoom: next.zoom,
			};
		} else if (centeredSystem) {
			// 3. Initial Load / No Bounds Yet
			const initialZoom = initialPlanetZoomRef.current ?? next.zoom;
			// Don't let user zoom out past the initial "fit" zoom until bounds are loaded
			const clampedZoom = Math.min(initialZoom, next.zoom);

			return {
				...next,
				target: [centeredSystem.x, centeredSystem.y],
				zoom: clampedZoom,
			};
		}

		return next;
	};

	// --- Lifecycle Effects ---

	useEffect(() => {
		if (currentViewMode === "system") {
			initialPlanetZoomRef.current = null;
		}
	}, [currentViewMode, initialPlanetZoomRef]);

	useEffect(() => {
		if (currentViewMode === "galaxy") {
			systemBoundsRef.current = null;
		}
	}, [currentViewMode, systemBoundsRef]);

	// --- Main Handler ---

	/**
	 * Handles the view state change.
	 * THROTTLE REMOVED: Clamping logic must run synchronously to prevent visual jitter or boundary leaks.
	 */
	const handleViewStateChange = useCallback(
		({ viewState: next }: any) => {
			// Priority 1: Handle ongoing programmatic transitions (animations)
			if (ignoreOnViewStateChangeRef.current) {
				handleIgnoredViewStateChange(next);
				return;
			}

			// Priority 2: System View Logic
			if (currentViewMode === "system" && centeredSystem) {
				const constrainedState = getConstrainedSystemViewState(next);
				if (!constrainedState) return;

				// Only update state if something actually changed (performance optimization)
				const old = viewStateRef.current || {};
				const changed =
					!approxEqual(old.target?.[0] ?? 0, constrainedState.target[0]) ||
					!approxEqual(old.target?.[1] ?? 0, constrainedState.target[1]) ||
					!approxEqual(old.zoom ?? 0, constrainedState.zoom);

				if (changed) {
					setSystemViewState(constrainedState);
				}
			}
			// Priority 3: Galaxy View Logic
			else {
				const old = viewStateRef.current || {};
				if (viewStateChanged(old, next)) {
					setGalaxyViewState(next);
				}
			}
		},
		[
			currentViewMode,
			centeredSystem,
			setSystemViewState,
			setGalaxyViewState,
			ignoreOnViewStateChangeRef,
			systemBoundsRef,
			initialPlanetZoomRef,
			viewStateRef,
			transitionToGalaxyView,
			systemExitZoomRef, // Ensure this dependency is present
		],
	);

	// --- Auto-Zoom Logic ---

	useEffect(() => {
		if (!isGalaxyView || mode === "shipping") return;

		const z = galaxyViewState.zoom ?? -Infinity;

		if (z >= GALAXY_TO_SYSTEM_ZOOM_IN_THRESHOLD) {
			const tgt = galaxyViewState.target ?? [0, 0];
			if (!systemsPoints || systemsPoints.length === 0) return;

			let best: MapPoint | null = null;
			let bestDist = Infinity;
			for (const s of systemsPoints) {
				const dx = s.x - tgt[0];
				const dy = s.y - tgt[1];
				const d2 = dx * dx + dy * dy;
				if (d2 < bestDist) {
					bestDist = d2;
					best = s;
				}
			}

			if (best) {
				if (!centeredSystem || centeredSystem.id !== best.id) {
					onSystemClick(best);
				}
			}
		}
	}, [
		galaxyViewState.zoom,
		isGalaxyView,
		systemsPoints,
		centeredSystem,
		onSystemClick,
		mode,
	]);

	return { handleViewStateChange, onSystemClick };
};
