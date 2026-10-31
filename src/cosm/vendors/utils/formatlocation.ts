import { useSyncExternalStore } from "react";
import { openDB } from "idb";

let systemNames: Record<string, string> = {};
const listeners = new Set<() => void>();
let version = 0;
let loadPromise: Promise<void> | undefined;

type SystemStar = { NaturalId?: string; Name?: string };

export const setLocationSystemNames = (names: Record<string, string> = {}) => {
	systemNames = names;
	version += 1;
	listeners.forEach((listener) => listener());
};

const getSystemNames = (systems: SystemStar[]) =>
	Object.fromEntries(
		systems.flatMap(({ NaturalId: code, Name: name }) =>
			code && name && code !== name ? [[code, name]] : [],
		),
	);

export const loadLocationSystemNames = () => {
	loadPromise ??= (async () => {
		const db = await openDB("PUNotedDB", 1, {
			upgrade(database) {
				database.createObjectStore("app-cache");
			},
		});
		const cached = await db.get("app-cache", "location_system_names");
		if (cached?.data) setLocationSystemNames(cached.data);
		if (cached?.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000) return;

		const response = await fetch("https://rest.fnar.net/systemstars");
		if (!response.ok) return;
		const data = getSystemNames(await response.json());
		setLocationSystemNames(data);
		await db.put(
			"app-cache",
			{ timestamp: Date.now(), data },
			"location_system_names",
		);
	})().catch(() => {});
	return loadPromise;
};

export const useLocationFormatVersion = () =>
	useSyncExternalStore(
		(listener) => {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
		() => version,
	);

export const formatLocation = (name?: string, id?: string) => {
	const locationName = name?.trim();
	const locationId = id?.trim();
	if (locationId && (!locationName || locationName === locationId)) {
		const systemName = systemNames[locationId.slice(0, -1)];
		if (systemName)
			return `${systemName} ${locationId.slice(-1)} (${locationId})`;
	}

	let displayName = locationName || locationId || "Unknown";
	let displayId: string | null = null;
	if (locationName && locationId) {
		displayName = locationName;
		displayId = locationName === locationId ? null : locationId;
	}
	return displayId ? `${displayName} (${displayId})` : displayName;
};
