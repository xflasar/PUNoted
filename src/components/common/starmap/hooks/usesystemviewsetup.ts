import { useState, useEffect } from "react";
import type {
	MapPoint,
	PlanetData,
	SystemStats,
	PlanetPosition,
	StationData,
	StationPosition,
} from "../types/maptypes";
import { calculateOrbitEllipse } from "../utils/orbit";

import { createCirclePolygon } from "../utils/geometry";
import { CartesianInterpolator } from "../utils/deckgl";

// --- Functions moved from orbit.ts to fix dependency issue ---
const SCALE_FACTOR = 5000000000;
const REFERENCE_EPOCH = 1451690603; // seconds
const SIMULATION_INTERVAL = 86400;
const PLANETARY_MOTION_FACTOR = 20;
const G = 6.67384e-11;
const SCALE_FACTOR_STATIONS = 5000000000;

function _calculateWorldTime(
	timeSeconds: number,
	useTimeAccelerationFactor = true,
): number {
	const timeAccelerationFactor = useTimeAccelerationFactor
		? (SIMULATION_INTERVAL / 86400) * PLANETARY_MOTION_FACTOR
		: 1;
	return (
		REFERENCE_EPOCH + (timeSeconds - REFERENCE_EPOCH) * timeAccelerationFactor
	);
}

function matrixMultiply(
	m1: number[],
	m2: number[] | number[],
): number[] | null {
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

function rotationMatrix(angleRad: number, axis: 1 | 3): number[] {
	const c = Math.cos(angleRad);
	const s = Math.sin(angleRad);
	if (axis === 3) {
		return [c, -s, 0, s, c, 0, 0, 0, 1];
	} else {
		return [1, 0, 0, 0, c, -s, 0, s, c];
	}
}

function orbitalPlaneToInertial(
	x: number[],
	Ω: number,
	ω: number,
	i: number,
): number[] {
	const Rz_negΩ = rotationMatrix(-Ω, 3);
	const Rx_negi = rotationMatrix(-i, 1);
	const Rz_negω = rotationMatrix(-ω, 3);
	const tmp1 = matrixMultiply(Rz_negω, x) as number[];
	const tmp2 = matrixMultiply(Rx_negi, tmp1) as number[];
	return matrixMultiply(Rz_negΩ, tmp2) as number[];
}

function keplerEquation(e: number, M: number): number {
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

export function calculateMovingPlanetPosition(
	starSystem: MapPoint,
	planetData: PlanetData,
	currentTimeSeconds: number,
): any {
	const worldTime = _calculateWorldTime(currentTimeSeconds / 1000, true);
	const t0 = 0,
		M0 = 0;
	const a = planetData.scaledOrbitalRadius ?? 100,
		e = planetData.eccentricity ?? 0,
		i = planetData.inclination ?? 0,
		Ω = planetData.rightascension ?? 0,
		ω = planetData.periapsis ?? 0;
	let GM = 398600441800000;
	if (planetData.mass && starSystem.mass) {
		GM = G * (planetData.mass + starSystem.mass);
	}
	const p = a * (1 - e * e),
		n = Math.sqrt(GM / Math.pow(a, 3)),
		M = M0 + n * (worldTime - t0),
		E = keplerEquation(e, M);
	const nu = 2 * Math.atan(Math.sqrt((1 + e) / (1 - e)) * Math.tan(E / 2)),
		r = p / (1 + e * Math.cos(nu));
	const xOrb = r * Math.cos(nu),
		yOrb = r * Math.sin(nu);
	const inertial = orbitalPlaneToInertial([yOrb, xOrb, 0], Ω, ω, i);
	const posX = starSystem.x + inertial[0] / SCALE_FACTOR,
		posY = starSystem.y - inertial[1] / SCALE_FACTOR;
	return {
		x: posX,
		y: posY,
		planetid: planetData.planetid,
		name: planetData.planetname,
		parentSystemId: starSystem.originalSystemId ?? "",
		orbitalRadius: planetData.scaledOrbitalRadius ?? a / SCALE_FACTOR,
		planetPopulation: planetData.planetPopulation ?? 0,
		scaledOrbitalRadius: planetData.scaledOrbitalRadius ?? a / SCALE_FACTOR,
		scaledPlanetRadius: planetData.scaledPlanetRadius ?? 1,
		semimajoraxis: planetData.semimajoraxis,
		eccentricity: planetData.eccentricity,
		inclination: planetData.inclination,
		rightascension: planetData.rightascension,
		periapsis: planetData.periapsis,
		orbitindex: planetData.orbitindex,
		resources: planetData.resources,
		gravity: planetData.gravity,
		pressure: planetData.pressure,
		temperature: planetData.temperature,
		fertility: planetData.fertility,
		cogc: planetData.cogc,
		type: planetData.type,
	};
}

export function calculateMovingStationPosition(
	starSystem: MapPoint,
	stationData: StationData,
	currentTimeSeconds: number,
): any {
	const worldTime = _calculateWorldTime(currentTimeSeconds / 1000, true);
	const t0 = 0,
		M0 = 0;
	const a = stationData.semimajoraxis ?? 1e10,
		e = stationData.eccentricity ?? 0,
		i = stationData.inclination ?? 0,
		Ω = stationData.rightascension ?? 0,
		ω = stationData.periapsis ?? 0;
	const stationMass = 125000;
	let GM = 398600441800000;
	if (starSystem.mass) GM = G * (stationMass + starSystem.mass);
	const p = a * (1 - e * e),
		n = Math.sqrt(GM / Math.pow(a, 3)),
		M = M0 + n * (worldTime - t0),
		E = keplerEquation(e, M);
	const nu = 2 * Math.atan(Math.sqrt((1 + e) / (1 - e)) * Math.tan(E / 2)),
		r = p / (1 + e * Math.cos(nu));
	const xOrb = r * Math.cos(nu),
		yOrb = r * Math.sin(nu);
	const inertial = orbitalPlaneToInertial([yOrb, xOrb, 0], Ω, ω, i);
	const posX = starSystem.x + inertial[0] / SCALE_FACTOR_STATIONS,
		posY = starSystem.y - inertial[1] / SCALE_FACTOR_STATIONS;
	return {
		x: posX,
		y: posY,
		stationid: stationData.stationid,
		name: stationData.name,
		parentSystemId: starSystem.originalSystemId ?? "",
		orbitalRadius: a / SCALE_FACTOR_STATIONS,
		scaledOrbitalRadius: a / SCALE_FACTOR_STATIONS,
		scaledStationRadius: 1,
		semimajoraxis: stationData.semimajoraxis,
		eccentricity: stationData.eccentricity,
		inclination: stationData.inclination,
		rightascension: stationData.rightascension,
		periapsis: stationData.periapsis,
	};
}
// --- End of moved functions ---

export const useSystemViewSetup = (
	centeredSystem: MapPoint | null,
	allPlanetsData: Record<string, PlanetData[]>,
	setSystemViewState: React.Dispatch<React.SetStateAction<any>>,
	setCurrentViewMode: React.Dispatch<React.SetStateAction<"galaxy" | "system">>,
	initialPlanetZoomRef: React.MutableRefObject<number | null>,
	ignoreOnViewStateChangeRef: React.MutableRefObject<boolean>,
	systemBoundsRef: React.MutableRefObject<{
		minX: number;
		maxX: number;
		minY: number;
		maxY: number;
	} | null>,
	mapWidth: number, // Changed from mapSize
	mapHeight: number, // Changed from mapSize
	allStationsData: Record<string, StationData[]>,
	systemExitZoomRef: React.MutableRefObject<number | null>,
	currentViewMode: "galaxy" | "system",
) => {
	const [orbitLines, setOrbitLines] = useState<any[]>([]);
	const [systemBoundingBox, setSystemBoundingBox] = useState<any[]>([]);
	const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
	const [initialPlanets, setInitialPlanets] = useState<PlanetPosition[]>([]);
	const [initialStations, setInitialStations] = useState<StationPosition[]>([]);
	const [microAsteroids, setMicroAsteroids] = useState<any[]>([]);

	useEffect(() => {
		if (!centeredSystem || currentViewMode !== "system") {
			setOrbitLines([]);
			setSystemBoundingBox([]);
			setSystemStats(null);
			systemBoundsRef.current = null;
			setInitialPlanets([]);
			setInitialStations([]);
			setMicroAsteroids([]);
			return;
		}

		const sid = centeredSystem.originalSystemId ?? "";
		let planets = sid ? allPlanetsData[sid] || [] : [];
		planets = planets
			.slice()
			.sort((a, b) => (a.semimajoraxis ?? 0) - (b.semimajoraxis ?? 0));

		const stations = sid ? allStationsData[sid] || [] : [];

		const VISUAL_MAX_RADIUS = 80;
		const VISUAL_MIN_RADIUS = 8;
		const MINIMUM_VISUAL_GAP = 3;
		const BOUNDING_BOX_OFFSET = 50;
		const MAX_ASTEROID_COUNT = 5;

		const maxA = Math.max(
			...planets.map((p) => Math.max(1, p.semimajoraxis * 1e10)),
			1,
		);
		const minA =
			planets.length > 0 ? Math.max(1, planets[0].semimajoraxis * 1e10) : 1;
		const logMinA = Math.log10(minA);
		const logMaxA = Math.log10(maxA);
		const logRange = logMaxA - logMinA;
		const visualRange = VISUAL_MAX_RADIUS - VISUAL_MIN_RADIUS;
		let lastOrbit = 0;

		const maxPopPlanet = planets.reduce(
			(max, current) => {
				const maxPop = max.planetPopulation ?? 0;
				const currentPop = current.planetPopulation ?? 0;
				return currentPop > maxPop ? current : max;
			},
			planets[0] || { planetPopulation: 0 },
		);

		const maxPopLogFactor = Math.log10(
			Math.max(1, maxPopPlanet.planetPopulation!),
		);

		const scaled = planets.map((p) => {
			const aReal = Math.max(1, p.semimajoraxis * 1e10);
			const logA = Math.log10(aReal);
			let normalizedDistance = 0;
			if (logRange > 1e-6) normalizedDistance = (logA - logMinA) / logRange;
			else normalizedDistance = 0.5;
			const exaggeratedNormalizedDistance = Math.pow(normalizedDistance, 4);
			const proportionalRadius =
				VISUAL_MIN_RADIUS + visualRange * exaggeratedNormalizedDistance;
			const minRequiredRadius = lastOrbit + MINIMUM_VISUAL_GAP;
			const safeA = Math.max(proportionalRadius, minRequiredRadius);
			lastOrbit = safeA;
			const typeStr = (p.type || "").toUpperCase();
			const isGas = typeStr.includes("GAS") || typeStr.includes("GASEOUS");
			const gravity = p.gravity ?? 1.0;
			let visual = 1.0;
			if (isGas) {
				visual = 1.8 + Math.min(1.2, gravity * 0.1);
			} else {
				visual = 0.7 + Math.min(0.6, gravity * 0.25);
			}
			return { ...p, scaledOrbitalRadius: safeA, scaledPlanetRadius: visual };
		});

		const initialPositions = scaled.map((pd) =>
			calculateMovingPlanetPosition(
				centeredSystem as MapPoint,
				pd as any,
				Date.now(),
			),
		);
		const initialStationsData = stations.map((sd) =>
			calculateMovingStationPosition(
				centeredSystem as MapPoint,
				sd as any,
				Date.now(),
			),
		);
		setInitialStations(initialStationsData as StationPosition[]);
		setInitialPlanets(initialPositions as PlanetPosition[]);

		const ol = scaled.map((pd) =>
			calculateOrbitEllipse(centeredSystem as MapPoint, pd as any, 128),
		);
		const stationsOrbits = stations.map((st) =>
			calculateOrbitEllipse(centeredSystem as MapPoint, st as any, 128),
		);
		ol.push(...stationsOrbits);
		setOrbitLines(ol);

		if (initialPositions.length > 0) {
			const lastPlanet = planets[planets.length - 1];
			const outerOrbitRadius = lastPlanet.semimajoraxis / 5000000000;
			const totalRadius = outerOrbitRadius + BOUNDING_BOX_OFFSET;
			const asteroidCount = centeredSystem.microasteroidCount ?? 0;
			const colorFactor = Math.min(
				1,
				Math.max(0, asteroidCount / MAX_ASTEROID_COUNT),
			);
			let colorR: number, colorG: number, colorB: number;
			if (colorFactor >= 0.75) {
				colorR = 255;
				colorG = 0;
				colorB = 0;
			} else if (colorFactor >= 0.15) {
				colorR = 255;
				colorG = 100;
				colorB = 0;
			} else {
				colorR = 100;
				colorG = 150;
				colorB = 255;
			}
			const finalColor: [number, number, number, number] = [
				colorR,
				colorG,
				colorB,
				150,
			];
			// Generate micro-asteroids -> look into this more to make it more asteorid generation
			if (asteroidCount > 0 && initialPositions.length > 0) {
				const maxAsteroids = Math.min(250, asteroidCount);
				const outerOrbitRadius = totalRadius - BOUNDING_BOX_OFFSET;
				const innerOrbitRadius = initialPositions[0].orbitalRadius ?? 10;
				const generated: any[] = [];
				for (let aIdx = 0; aIdx < maxAsteroids; aIdx++) {
					const r =
						innerOrbitRadius +
						Math.random() * (outerOrbitRadius - innerOrbitRadius);
					const theta = Math.random() * Math.PI * 2;
					const px =
						centeredSystem.x +
						r * Math.cos(theta) +
						(Math.random() - 0.5) * 0.1;
					const py =
						centeredSystem.y +
						r * Math.sin(theta) +
						(Math.random() - 0.5) * 0.1;
					generated.push({
						position: [px, py],
						size: 1 + Math.random() * 2,
						color: [
							140 + Math.random() * 60,
							130 + Math.random() * 40,
							110 + Math.random() * 30,
							180,
						],
					});
				}
				setMicroAsteroids(generated);
			} else {
				setMicroAsteroids([]);
			}

			const polygon = createCirclePolygon(
				[centeredSystem.x, centeredSystem.y],
				totalRadius,
			);
			setSystemBoundingBox([{ polygon: polygon, color: finalColor }]);

			console.log(centeredSystem);
			console.log(systemBoundsRef);

			systemBoundsRef.current = {
				minX: centeredSystem.x - totalRadius,
				maxX: centeredSystem.x + totalRadius,
				minY: centeredSystem.y - totalRadius,
				maxY: centeredSystem.y + totalRadius,
			};

			// Calculate dynamic zoom
			const systemWidth =
				systemBoundsRef.current.maxX - systemBoundsRef.current.minX;
			const systemHeight =
				systemBoundsRef.current.maxY - systemBoundsRef.current.minY;

			// Ensure mapWidth and mapHeight are not zero to avoid division by zero
			const effectiveMapWidth = Math.max(1, mapWidth);
			const effectiveMapHeight = Math.max(1, mapHeight);

			// Calculate zoom based on width and height, choosing the more restrictive one
			const zoomX = Math.log2(effectiveMapWidth / systemWidth);
			const zoomY = Math.log2(effectiveMapHeight / systemHeight);
			let dynamicZoom = Math.min(zoomX, zoomY);

			// Add some padding to the zoom level so the system isn't right at the edge
			dynamicZoom -= 0.5; // Adjust this value as needed for desired padding
			const ZOOM_EXIT_BUFFER = 1.5;
			systemExitZoomRef.current = dynamicZoom - ZOOM_EXIT_BUFFER;

			const systemCenter = [centeredSystem.x, centeredSystem.y];
			const targetSystemViewState = {
				target: systemCenter,
				zoom: dynamicZoom, // Use dynamicZoom instead of PLANET_ZOOM_THRESHOLD
				transitionDuration: 300,
				transitionInterpolator: new CartesianInterpolator(),
			};
			ignoreOnViewStateChangeRef.current = true;
			setSystemViewState(targetSystemViewState);
			setCurrentViewMode("system");
			setSystemBoundingBox([{ polygon: polygon, color: finalColor }]);
			initialPlanetZoomRef.current = dynamicZoom; // Update initialPlanetZoomRef as well
			setTimeout(() => {
				ignoreOnViewStateChangeRef.current = false;
			}, 350);
		} else {
			setSystemBoundingBox([]);

			systemBoundsRef.current = null;

			// If no planets, still set a default system view state
			const defaultZoom = -2;
			initialPlanetZoomRef.current = defaultZoom;
			systemExitZoomRef.current = defaultZoom - 1.5;

			const systemCenter = [centeredSystem.x, centeredSystem.y];
			const targetSystemViewState = {
				target: systemCenter,
				zoom: -2, // A reasonable default zoom for an empty system
				transitionDuration: 300,
				transitionInterpolator: new CartesianInterpolator(),
			};
			ignoreOnViewStateChangeRef.current = true;
			setSystemViewState(targetSystemViewState);
			setCurrentViewMode("system");
			initialPlanetZoomRef.current = -2;
			setTimeout(() => {
				ignoreOnViewStateChangeRef.current = false;
			}, 350);
		}
	}, [
		centeredSystem,
		allPlanetsData,
		allStationsData,
		setSystemViewState,
		setCurrentViewMode,
		initialPlanetZoomRef,
		ignoreOnViewStateChangeRef,
		systemBoundsRef,
		currentViewMode,
	]);

	return {
		orbitLines,
		systemBoundingBox,
		systemStats,
		initialPlanets,
		initialStations,
		microAsteroids,
	};
};
