import React from "react";
import { Box, Typography, useTheme, alpha } from "@mui/material";
import { formatDistanceToNowStrict } from "date-fns";
import { useGlobalData } from "../../../../../context/globaldatacontext";
import { getOriginDestinationLabel } from "../../utils/flightplanorigindestination";
import type { AnimatedShipData } from "../../types/maptypes";

interface ShipFlightStatusProps {
	ship: AnimatedShipData;
	isMine: boolean;
}

const ShipFlightStatus: React.FC<ShipFlightStatusProps> = ({
	ship,
	isMine,
}) => {
	const theme = useTheme();
	const { systemsPoints, allPlanetsData, allStationsData } = useGlobalData();
	const activeFlight: any = ship.plan || (ship as any).flight;

	const startStr = activeFlight?.arrivaltimestamp;
	const endStr = activeFlight?.departuretimestamp;

	if (!startStr || !endStr) return null;

	const start = new Date(startStr).getTime();
	const end = new Date(endStr).getTime();

	const now = Date.now();
	const totalDuration = end - start;
	const elapsed = now - start;
	const isArrived = now >= end;

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

	// CSS GPU Animation Config
	const barStyle = isArrived
		? {
				transform: "scaleX(1)",
				backgroundColor: isMine
					? theme.palette.primary.main
					: theme.palette.secondary.main,
			}
		: {
				animationName: "growProgress",
				animationDuration: `${totalDuration}ms`,
				animationTimingFunction: "linear",
				animationFillMode: "forwards",
				animationDelay: `-${elapsed}ms`,
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
						willChange: "transform",
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
