import { useEffect } from "react";
import { useGlobalData } from "../../../../context/globaldatacontext";
import { useGlobalWs } from "../../../../dashboard/websocket/useglobaluserws";
import { getOriginDestinationLabel } from "../utils/flightplanorigindestination";
import {
	AnimatedShipData,
	FlightPlan,
	WorkerFlightPlan,
} from "../types/maptypes";

export const useShipWebSocket = ({
	mode, // Add mode to props
	systemsPoints,
	allPlanetsData,
	allStationsData,
	animationWorker,
}: any) => {
	// 1. Safe context access - these now return defaults if Providers are missing
	const ws = useGlobalWs();
	const {
		rawInitialShips,
		setRawInitialShips,
		setAnimatedShipData,
		setActiveFlightPlans,
	} = useGlobalData();

	const userId =
		typeof window !== "undefined"
			? localStorage.getItem("currentUserId")
			: null;
	const mapChannel = userId ? `map:user:${userId}` : null;

	// 2. High-Frequency Coordinate Listener
	// Optimization: If mapChannel is null (Public), useGlobalWs will/should bail internally.
	// We pass undefined if no channel exists to prevent subscription attempts.
	useGlobalWs(
		mode === "public" ? undefined : mapChannel || undefined,
		(message) => {
			if (mode === "public" || !animationWorker) return;

			if (message.type === "SHIP_POSITION_UPDATE") {
				animationWorker.postMessage({
					type: "SHIP_POSITION_UPDATE",
					payload: {
						shipId: message.data.shipId,
						x: message.data.x,
						y: message.data.y,
						progress: message.data.progress || 0,
					},
				});
			}
		},
	);

	// 3. Enrichment Logic
	useEffect(() => {
		// 1. Bail if in public mode
		if (mode === "public") return;

		// 2. ONLY run if rawInitialShips is present (This prevents the loop!)
		if (!rawInitialShips || rawInitialShips.length === 0) return;

		// 3. Ensure other data is ready
		const isDataReady =
			systemsPoints?.length > 0 && Object.keys(allPlanetsData || {}).length > 0;
		if (!isDataReady) return;

		const labelGetter = getOriginDestinationLabel(
			systemsPoints,
			allPlanetsData,
			allStationsData,
		);
		const initialShipData: AnimatedShipData[] = [];
		const initialFlightPlans: FlightPlan[] = [];

		rawInitialShips.forEach((ship: any) => {
			let enrichedPlan: FlightPlan | null = null;
			let currentLocationLabel = "Unknown Location";

			if (ship.flight) {
				const originLabel = labelGetter(ship.flight as WorkerFlightPlan, true);
				const destinationLabel = labelGetter(
					ship.flight as WorkerFlightPlan,
					false,
				);
				enrichedPlan = {
					...ship.flight,
					shipid: ship.shipid,
					origin: originLabel,
					destination: destinationLabel,
				};
				initialFlightPlans.push(enrichedPlan);
			} else {
				const fakePlanForLookup = {
					originsystemid: ship.addresssystemid,
					originplanetid: ship.addressplanetid,
					originstationid: ship.addressstationid,
				};
				currentLocationLabel = labelGetter(fakePlanForLookup as any, true);
			}

			initialShipData.push({
				id: ship.shipid,
				registration: ship.registration,
				name: ship.name,
				ownerName: ship.ship_owner_display_name,
				ownerId: ship.ship_owner_userid,
				is_owner_ship: ship.is_owner_ship,
				type: ship.ship_type,
				addressplanetid: ship.addressplanetid,
				addresssystemid: ship.addresssystemid,
				addressstationid: ship.addressstationid,
				position: [0, 0],
				progress: 0,
				plan: enrichedPlan,
				currentLocationLabel: enrichedPlan ? undefined : currentLocationLabel,
				cargo: {
					currentvolume: ship.volumeload,
					maxvolume: ship.volumecapacity,
					currentweight: ship.weightload,
					maxweight: ship.weightcapacity,
					items: ship.cargo_items || [],
				},
			});
		});

		// 4. Update states
		setAnimatedShipData(initialShipData);
		setActiveFlightPlans(initialFlightPlans);

		// 5. IMPORTANT: Clear the raw data. This causes one re-render,
		// but on the next run, step #2 will catch it and prevent the loop.
		setRawInitialShips(null);
	}, [
		mode,
		rawInitialShips, // The "Lock"
		systemsPoints,
		allPlanetsData,
		allStationsData,
		setAnimatedShipData,
		setActiveFlightPlans,
		setRawInitialShips,
	]);
};
