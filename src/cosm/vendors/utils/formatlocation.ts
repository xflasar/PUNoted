export const formatLocation = (name?: string, id?: string) => {
	const locationName = name?.trim();
	const locationId = id?.trim();
	let displayName = locationName || locationId || "Unknown";
	let displayId: string | null = null;
	if (locationName && locationId) {
		const sameLabel =
			locationName.localeCompare(locationId, undefined, {
				sensitivity: "base",
			}) === 0;
		displayName = locationName;
		displayId = sameLabel ? null : locationId;
	}
	return displayId ? `${displayName} (${displayId})` : displayName;
};
