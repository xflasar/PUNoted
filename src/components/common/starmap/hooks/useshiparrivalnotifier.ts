import { useEffect, useRef } from "react";
import {
	parseFlightTimestamp,
	getFlightArrivalMs,
} from "../utils/timestamputils";
import { audioAlerts } from "../../../../utils/audioalerts";
import { useGlobalWsContext } from "../../../../dashboard/websocket/globalwscontext";
import type { ShipData, FlightPlan } from "../types/maptypes";

const NOTIFIED_ARRIVALS_KEY = "punoted_notified_ship_arrivals";

function getNotifiedArrivals(): Set<string> {
	try {
		const raw = localStorage.getItem(NOTIFIED_ARRIVALS_KEY);
		if (raw) return new Set(JSON.parse(raw));
	} catch {}
	return new Set();
}

function saveNotifiedArrival(key: string) {
	try {
		const current = getNotifiedArrivals();
		current.add(key);
		const arr = Array.from(current).slice(-300);
		localStorage.setItem(NOTIFIED_ARRIVALS_KEY, JSON.stringify(arr));
	} catch {}
}

export function triggerShipArrivalNotification(
	title: string,
	message: string,
	tagKey: string,
) {
	// 1. Audio Alert Chime
	try {
		audioAlerts.playChime("info");
	} catch {}

	// 2. Desktop Push Notification (Web API)
	if (typeof window !== "undefined" && "Notification" in window) {
		if (window.Notification.permission === "granted") {
			try {
				new window.Notification(title, {
					body: message,
					icon: "/icon128.png",
					tag: tagKey,
				});
			} catch {}
		} else if (window.Notification.permission === "default") {
			window.Notification.requestPermission().then((perm) => {
				if (perm === "granted") {
					try {
						new window.Notification(title, {
							body: message,
							icon: "/icon128.png",
							tag: tagKey,
						});
					} catch {}
				}
			});
		}
	}
}

/**
 * React Hook that monitors ship flight arrivals in both Online Real-Time Telemetry mode
 * (via extension WebSocket) and Background / Offline mode (via scheduled flight plan arrival timestamps).
 */
export const useShipArrivalNotifier = (
	ownerShips: ShipData[],
	activeFlightPlans: FlightPlan[],
) => {
	const wsContext = useGlobalWsContext();
	const checkedArrivalsRef = useRef<Set<string>>(getNotifiedArrivals());

	// -------------------------------------------------------------
	// 1. REAL-TIME EXTENSION WEBSOCKET TELEMETRY LISTENER (ONLINE)
	// -------------------------------------------------------------
	useEffect(() => {
		if (!wsContext) return;

		const handleWsMessage = (msg: any) => {
			if (!msg) return;
			const type = String(msg.messageType || msg.type || "").toUpperCase();
			const msgStr = JSON.stringify(msg).toUpperCase();
			const isFlightEnd =
				type.includes("FLIGHT_ENDED") ||
				type.includes("FLIGHT_COMPLETED") ||
				type.includes("FLIGHT_ARRIVED") ||
				type.includes("FLIGHT_PLAN_COMPLETED") ||
				type.includes("SHIP_ARRIVAL") ||
				type.includes("FLIGHT_DONE") ||
				msgStr.includes("FLIGHT_ENDED") ||
				msgStr.includes("FLIGHT_COMPLETED");

			if (isFlightEnd) {
				const payload = msg.data || msg.payload || msg;
				const shipName =
					payload.ship_name ||
					payload.name ||
					payload.registration ||
					"Your ship";
				const dest =
					payload.destination ||
					payload.destination_name ||
					payload.location ||
					"destination";
				const shipId = payload.ship_id || payload.id || "ship";
				const key = `ws_${shipId}_${Date.now()}`;

				if (!checkedArrivalsRef.current.has(key)) {
					checkedArrivalsRef.current.add(key);
					saveNotifiedArrival(key);
					triggerShipArrivalNotification(
						`🚀 Ship Arrived: ${shipName}`,
						`${shipName} has completed its flight and arrived at ${dest}!`,
						key,
					);
				}
			}
		};

		wsContext.addMessageListener(handleWsMessage);
		return () => wsContext.removeMessageListener(handleWsMessage);
	}, [wsContext]);

	// -------------------------------------------------------------
	// 2. TIMED BACKGROUND / OFFLINE FLIGHT ARRIVAL MONITOR (10s LOOP)
	// -------------------------------------------------------------
	useEffect(() => {
		const checkArrivals = () => {
			if (!ownerShips || ownerShips.length === 0) return;
			const now = Date.now();
			const notified = checkedArrivalsRef.current;

			ownerShips.forEach((ship) => {
				const plan = ship.plan || (ship as any).flight;
				const arrivalMs = getFlightArrivalMs(plan);
				if (arrivalMs <= 0) return;

				const shipId =
					ship.ship_id || ship.id || (ship as any).shipid || "unknown";
				const shipName = ship.name || ship.registration || shipId;
				const arrivalKey = `arrival_${shipId}_${arrivalMs}`;

				// If flight has completed (now >= arrivalMs)
				if (now >= arrivalMs) {
					if (!notified.has(arrivalKey)) {
						// Only notify if arrival was within the last 2 hours (prevents ancient past arrivals on cold boots)
						const isRecent = now - arrivalMs < 2 * 60 * 60 * 1000;
						notified.add(arrivalKey);
						saveNotifiedArrival(arrivalKey);

						if (isRecent) {
							const destName =
								plan?.segments?.[plan.segments.length - 1]?.destination_name ||
								plan?.destination ||
								(ship as any).addressplanetid ||
								"destination";

							triggerShipArrivalNotification(
								`🚀 Ship Arrived: ${shipName}`,
								`${shipName} (${ship.registration || "Ship"}) has completed its flight and arrived at ${destName}!`,
								arrivalKey,
							);
						}
					}
				}
			});
		};

		checkArrivals();
		const intervalId = setInterval(checkArrivals, 10000);
		return () => clearInterval(intervalId);
	}, [ownerShips, activeFlightPlans]);
};
