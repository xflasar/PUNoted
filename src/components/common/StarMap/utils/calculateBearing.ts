/**
 * Calculates the bearing (angle in degrees) from point A to point B,
 * aligned with Deck.gl's standard: 0 degrees is UP (North), clockwise rotation.
 */
const calculateBearing = (
	startCoords: [number, number],
	endCoords: [number, number],
): number => {
	const dx = endCoords[0] - startCoords[0];
	const dy = endCoords[1] - startCoords[1];

	// 1. Math.atan2 returns radians counter-clockwise from the positive X-axis.
	// We convert it to degrees (AngleInDegrees: 0=East, increases counter-clockwise).
	let angleInDegrees = Math.atan2(dy, dx) * (180 / Math.PI);

	// 2. Adjust to Deck.gl/Navigational Standard: 0=North, increases clockwise.

	// a) Shift the origin from X-axis (East) to Y-axis (North) by subtracting 90.
	//    (0 degrees is now North, but still increases counter-clockwise)
	let bearing = angleInDegrees + 90;

	// b) Invert the direction (from counter-clockwise to clockwise) by negating.
	bearing = -bearing;

	// 3. Normalize to 0-360 degrees.
	if (bearing < 0) {
		bearing += 360;
	}

	return bearing;
};
export default calculateBearing;
