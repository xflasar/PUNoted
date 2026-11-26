import React, { useEffect, useState } from "react";
import { Box, Typography, useTheme, alpha } from "@mui/material";
import { formatDistanceToNowStrict } from "date-fns";
import { useGlobalData } from "../../../../../context/globaldatacontext";
import { useMapData } from "../../hooks/usemapdata";
import { getOriginDestinationLabel } from "../../utils/flightplanorigindestination";
import {
	parseFlightTimestamp,
	getFlightArrivalMs,
	getFlightDepartureMs,
} from "../../utils/timestamputils";
import type { AnimatedShipData } from "../../types/maptypes";

export { parseFlightTimestamp, getFlightArrivalMs, getFlightDepartureMs };

interface ShipFlightStatusProps {
	ship: AnimatedShipData;
	isMine: boolean;
}

const ShipFlightStatus: React.FC<ShipFlightStatusProps> = ({
	ship,
	isMine,
}) => {
	const theme = useTheme();
	const { mapData } = useGlobalData();
	const { systemsPoints, allPlanetsData, allStationsData } =
		useMapData(mapData);
	const activeFlight: any = ship.plan || (ship as any).flight;

	const start = getFlightDepartureMs(activeFlight);
	const end = getFlightArrivalMs(activeFlight);
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		const current = Date.now();
		setNow(current);
		if (!start || !end || current >= end) return;

		const intervalMs = end - current < 120000 ? 5000 : 10000;
		const id = window.setInterval(() => {
			if (document.hidden) return;
			const nextNow = Date.now();
			setNow(nextNow);
			if (nextNow >= end) {
				window.clearInterval(id);
			}
		}, intervalMs);
		return () => window.clearInterval(id);
	}, [start, end]);

	if (!start || !end) return null;

	const totalDuration = end - start;
	const elapsed = now - start;
	const isArrived = now >= end;
	const progress = isArrived
		? 1
		: totalDuration > 0
			? Math.min(1, Math.max(0, elapsed / totalDuration))
			: 1;

	const getLabel = getOriginDestinationLabel(
		systemsPoints,
		allPlanetsData,
		allStationsData,
	);
	const originName =
		getLabel(activeFlight, true) || activeFlight.origin || "Unknown";
	const destName =
		getLabel(activeFlight, false) || activeFlight.destination || "Unknown";
	const etaText = isArrived
		? "Arrived"
		: formatDistanceToNowStrict(end, { addSuffix: true });

	const barStyle = {
		transform: `scaleX(${progress})`,
		backgroundColor: isMine
			? theme.palette.primary.main
			: theme.palette.secondary.main,
	};

	return (
		<Box
			sx={{
				width: "100%",
				mt: 0.5,
				display: "flex",
				alignItems: "center",
				gap: 1,
			}}
		>
			<Typography
				variant="caption"
				noWrap
				sx={{
					color: theme.palette.text.secondary,
					fontSize: "0.65rem",
					maxWidth: "25%",
				}}
			>
				{originName}
			</Typography>
			<Box
				sx={{
					flex: 1,
					height: 3,
					borderRadius: 1.5,
					bgcolor: alpha(theme.palette.common.white, 0.1),
					overflow: "hidden",
					position: "relative",
				}}
			>
				<div
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						height: "100%",
						width: "100%",
						transformOrigin: "left center",
						...barStyle,
					}}
				/>
			</Box>
			<Typography
				variant="caption"
				noWrap
				sx={{
					color: theme.palette.text.secondary,
					fontSize: "0.65rem",
					textAlign: "right",
					maxWidth: "25%",
				}}
			>
				{destName}
			</Typography>
			<Typography
				variant="caption"
				sx={{
					color: theme.palette.success.main,
					fontWeight: 700,
					fontSize: "0.65rem",
					minWidth: "40px",
					textAlign: "right",
				}}
			>
				{etaText}
			</Typography>
		</Box>
	);
};

export default React.memo(ShipFlightStatus, (prev, next) => {
	return prev.ship.plan === next.ship.plan && prev.isMine === next.isMine;
});
