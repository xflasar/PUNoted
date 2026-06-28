import React, { useState } from "react";
import {
	Box,
	Typography,
	ListItemButton,
	Tooltip,
	useTheme,
	alpha,
	IconButton,
} from "@mui/material";
import {
	MyLocation,
	Timeline,
	Inventory2,
	LocalShipping,
	ExpandMore,
} from "@mui/icons-material";
import { useGlobalData } from "../../../../../context/globaldatacontext";
import { getOriginDestinationLabel } from "../../utils/flightplanorigindestination";
import MaterialBadge from "../../../../../cosm/components/materialbadge";
import ShipFlightStatus from "./ShipFlightStatus";
import type { AnimatedShipData } from "../../types/maptypes";

// --- ASSETS ---
import lcb from "../../../../../assets/ships/LCB.png";
import wcb from "../../../../../assets/ships/WCB.png";
import vcb from "../../../../../assets/ships/VCB.png";
import hcb from "../../../../../assets/ships/HCB.png";

interface ShipRowProps {
	ship: AnimatedShipData;
	onSelect: (id: string) => void;
	isMine: boolean;
	isPathVisible: boolean;
	onTogglePath: (id: string) => void;
	isSelected: boolean;
	indentation?: number;
}

const iconStyle: React.CSSProperties = {
	width: "100%",
	height: "100%",
	objectFit: "contain",
	imageRendering: "-webkit-optimize-contrast" as any,
};

const getShipIcon = (ship: any) => {
	if (!ship) return <LocalShipping sx={{ fontSize: 20 }} />;
	const type = ship.type || ship.ship_type || ship.shipType || "";
	const t = type.toUpperCase();
	if (t.includes("LCB")) return <img src={lcb} alt="LCB" style={iconStyle} />;
	if (t.includes("WCB")) return <img src={wcb} alt="WCB" style={iconStyle} />;
	if (t.includes("VCB")) return <img src={vcb} alt="VCB" style={iconStyle} />;
	if (t.includes("HCB")) return <img src={hcb} alt="HCB" style={iconStyle} />;
	return <LocalShipping sx={{ fontSize: 20 }} />;
};

const ShipRow: React.FC<ShipRowProps> = ({
	ship,
	onSelect,
	isMine,
	isPathVisible,
	onTogglePath,
	isSelected,
	indentation = 0,
}) => {
	const theme = useTheme();
	const { storageState, systemsPoints, allPlanetsData, allStationsData } =
		useGlobalData();
	const [isExpanded, setIsExpanded] = useState(false);
	const hasPlan = !!(ship.plan || ship.flight);
	const cargo = (ship as any).cargo;

	// Resolve Storage Info
	const units = Object.values(storageState?.units || {});
	const shipReg = ship.registration;
	const shipName = ship.name;
	const shipStore = units.find(
		(u) =>
			(u.name === shipReg || u.name === shipName) && u.type === "SHIP_STORE",
	);
	const stlFuelStore = units.find(
		(u) =>
			(u.name === shipReg || u.name === shipName) &&
			u.type === "STL_FUEL_STORE",
	);
	const ftlFuelStore = units.find(
		(u) =>
			(u.name === shipReg || u.name === shipName) &&
			u.type === "FTL_FUEL_STORE",
	);

	const stlFuelQty =
		stlFuelStore?.items?.find((i) => i.name === "SF")?.quantity || 0;
	const ftlFuelQty =
		ftlFuelStore?.items?.find((i) => i.name === "FF")?.quantity || 0;

	const hasStlFuelSupport =
		!!stlFuelStore && (stlFuelStore.volumecapacity || 0) > 0;
	const hasFtlFuelSupport =
		!!ftlFuelStore && (ftlFuelStore.volumecapacity || 0) > 0;

	const stlFuelPct = hasStlFuelSupport
		? Math.round(
				(stlFuelStore.volumeload / (stlFuelStore.volumecapacity || 1)) * 100,
			)
		: 0;
	const ftlFuelPct = hasFtlFuelSupport
		? Math.round(
				(ftlFuelStore.volumeload / (ftlFuelStore.volumecapacity || 1)) * 100,
			)
		: 0;

	const activeFlight: any = ship.plan || (ship as any).flight;
	const end = activeFlight?.departuretimestamp
		? new Date(activeFlight.departuretimestamp).getTime()
		: 0;
	const now = Date.now();
	const isArrived = end > 0 && now >= end;

	const getLabel = getOriginDestinationLabel(
		systemsPoints,
		allPlanetsData,
		allStationsData,
	);
	const currentLocation =
		ship.currentLocationLabel ||
		(ship.plan ? "In Transit" : "Orbital/Stationary");
	const destName = activeFlight
		? getLabel(activeFlight, false) || activeFlight.destination || "Unknown"
		: "";

	const getCargoColor = (current: number, max: number) => {
		const ratio = current / (max || 1);
		if (ratio > 0.9) return theme.palette.error.main;
		if (ratio > 0.7) return theme.palette.warning.main;
		return theme.palette.text.secondary;
	};

	const hasLowFuel =
		(hasStlFuelSupport && stlFuelPct < 20) ||
		(hasFtlFuelSupport && ftlFuelPct < 20);
	const hasProblem = hasLowFuel || isArrived;

	return (
		<ListItemButton
			onClick={() => {
				setIsExpanded(!isExpanded);
				onSelect(ship.id || ship.ship_id);
			}}
			sx={{
				flexDirection: "column",
				alignItems: "stretch",
				borderRadius: "8px",
				margin: "6px 8px",
				width: "calc(100% - 16px)",
				border: `1.5px solid ${isSelected ? theme.palette.primary.main : hasProblem ? alpha(theme.palette.error.main, 0.6) : alpha(theme.palette.divider, 0.4)}`,
				background: isSelected
					? `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`
					: hasProblem
						? `linear-gradient(90deg, ${alpha(theme.palette.error.main, 0.1)} 0%, ${alpha(theme.palette.error.main, 0.02)} 100%)`
						: "rgba(20, 20, 30, 0.35)",
				backdropFilter: "blur(8px)",
				py: 1.25,
				px: 1.5,
				minHeight: 52,
				transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
				position: "relative",
				overflow: "hidden",
				boxShadow: isSelected
					? `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
					: hasProblem
						? `0 0 10px ${alpha(theme.palette.error.main, 0.15)}`
						: "none",
				"&::before": {
					content: '""',
					position: "absolute",
					left: 0,
					top: 0,
					bottom: 0,
					width: "4px",
					bgcolor: isArrived
						? "warning.main"
						: hasLowFuel
							? "error.main"
							: isMine
								? "primary.main"
								: "secondary.main",
					opacity: isSelected || hasProblem ? 1 : 0,
					transition: "opacity 0.2s ease",
				},
				"&:hover": {
					background: isSelected
						? `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`
						: alpha(theme.palette.background.default, 0.45),
					borderColor: isSelected
						? theme.palette.primary.main
						: hasProblem
							? alpha(theme.palette.error.main, 0.8)
							: alpha(theme.palette.divider, 0.8),
					transform: "translateY(-1px)",
					boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
				},
				pl: 1.5 + indentation,
			}}
		>
			<Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
				<Box
					sx={{
						mr: 1.5,
						p: 0.25,
						borderRadius: "8px",
						bgcolor: isMine
							? alpha(theme.palette.primary.main, 0.1)
							: alpha(theme.palette.secondary.main, 0.1),
						color: isMine ? "primary.main" : "secondary.main",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						width: 44,
						height: 44,
						flexShrink: 0,
						border: `1.5px solid ${isMine ? alpha(theme.palette.primary.main, 0.25) : alpha(theme.palette.secondary.main, 0.25)}`,
						boxShadow: isMine
							? `0 0 10px ${alpha(theme.palette.primary.main, 0.15)}`
							: `0 0 10px ${alpha(theme.palette.secondary.main, 0.15)}`,
						transition: "transform 0.2s ease",
						"&:hover": {
							transform: "scale(1.05)",
						},
					}}
				>
					{getShipIcon(ship)}
				</Box>
				<Box
					sx={{
						flex: 1,
						overflow: "hidden",
						mr: 1,
						display: "flex",
						flexDirection: "column",
					}}
				>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							flexWrap: "wrap",
							gap: 0.75,
							width: "100%",
						}}
					>
						<Tooltip
							title={ship.name || ship.registration}
							placement="top"
							arrow
						>
							<Typography
								variant="body2"
								sx={{
									fontWeight: 650,
									color: theme.palette.text.primary,
									fontSize: "0.825rem",
									letterSpacing: "0.01em",
									wordBreak: "break-all",
								}}
							>
								{ship.name || ship.registration}
							</Typography>
						</Tooltip>
						<Typography
							variant="caption"
							sx={{
								color: theme.palette.text.secondary,
								fontSize: "0.6rem",
								fontWeight: 700,
								px: 0.5,
								py: 0.1,
								borderRadius: "4px",
								bgcolor: "rgba(255, 255, 255, 0.05)",
								border: "1px solid rgba(255, 255, 255, 0.08)",
								letterSpacing: "0.05em",
								flexShrink: 0,
							}}
						>
							{ship.type || ship.ship_type || ship.shipType}
						</Typography>
						{hasLowFuel && (
							<Tooltip title="Fuel reserve below 20%">
								<Typography
									variant="caption"
									sx={{
										color: theme.palette.error.main,
										fontWeight: 800,
										fontSize: "0.55rem",
										px: 0.5,
										py: 0.1,
										borderRadius: "4px",
										bgcolor: alpha(theme.palette.error.main, 0.1),
										border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
										letterSpacing: "0.05em",
										flexShrink: 0,
									}}
								>
									⚠️ LOW FUEL
								</Typography>
							</Tooltip>
						)}
					</Box>
					{!isMine && (
						<Typography
							variant="caption"
							noWrap
							sx={{
								color: theme.palette.secondary.main,
								fontSize: "0.65rem",
								display: "block",
								fontWeight: 500,
								mt: 0.25,
							}}
						>
							{ship.ship_owner_display_name || ship.display_name}
						</Typography>
					)}
				</Box>

				{/* Vertical SF & FF stack */}
				{isMine && (hasStlFuelSupport || hasFtlFuelSupport) && (
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							gap: 0.25,
							alignItems: "flex-end",
							mr: 1,
							flexShrink: 0,
						}}
					>
						{hasStlFuelSupport && (
							<Typography
								variant="caption"
								sx={{
									color:
										stlFuelPct < 20
											? theme.palette.error.main
											: theme.palette.info.main,
									fontWeight: 700,
									fontSize: "0.55rem",
									px: 0.5,
									py: 0.1,
									borderRadius: "3px",
									bgcolor:
										stlFuelPct < 20
											? alpha(theme.palette.error.main, 0.08)
											: alpha(theme.palette.info.main, 0.08),
									border: `1px solid ${stlFuelPct < 20 ? alpha(theme.palette.error.main, 0.25) : alpha(theme.palette.info.main, 0.25)}`,
									lineHeight: 1.1,
								}}
							>
								SF: {stlFuelPct}%
							</Typography>
						)}
						{hasFtlFuelSupport && (
							<Typography
								variant="caption"
								sx={{
									color:
										ftlFuelPct < 20
											? theme.palette.error.main
											: theme.palette.secondary.main,
									fontWeight: 700,
									fontSize: "0.55rem",
									px: 0.5,
									py: 0.1,
									borderRadius: "3px",
									bgcolor:
										ftlFuelPct < 20
											? alpha(theme.palette.error.main, 0.08)
											: alpha(theme.palette.secondary.main, 0.08),
									border: `1px solid ${ftlFuelPct < 20 ? alpha(theme.palette.error.main, 0.25) : alpha(theme.palette.secondary.main, 0.25)}`,
									lineHeight: 1.1,
								}}
							>
								FF: {ftlFuelPct}%
							</Typography>
						)}
					</Box>
				)}

				<Box
					onClick={(e) => e.stopPropagation()}
					sx={{
						display: "flex",
						alignItems: "center",
						gap: 0.5,
						flexShrink: 0,
					}}
				>
					{hasPlan && (
						<Tooltip title={isPathVisible ? "Hide Path" : "Show Path"}>
							<IconButton
								size="small"
								onClick={() => onTogglePath(ship.id || ship.ship_id)}
								sx={{
									p: 0.5,
									color: isPathVisible
										? theme.palette.secondary.main
										: theme.palette.action.disabled,
									"&:hover": {
										color: theme.palette.secondary.light,
										bgcolor: "rgba(255, 255, 255, 0.05)",
									},
								}}
							>
								<Timeline sx={{ fontSize: 16 }} />
							</IconButton>
						</Tooltip>
					)}
					<Tooltip title="Locate">
						<IconButton
							size="small"
							onClick={(e) => {
								e.stopPropagation();
								onSelect(ship.id || ship.ship_id);
							}}
							sx={{
								p: 0.5,
								color: theme.palette.text.primary,
								opacity: 0.6,
								"&:hover": {
									opacity: 1,
									bgcolor: "rgba(255, 255, 255, 0.05)",
								},
							}}
						>
							<MyLocation sx={{ fontSize: 16 }} />
						</IconButton>
					</Tooltip>
					<Tooltip title={isExpanded ? "Collapse Details" : "Expand Details"}>
						<IconButton
							size="small"
							onClick={(e) => {
								e.stopPropagation();
								setIsExpanded(!isExpanded);
							}}
							sx={{
								p: 0.5,
								color: theme.palette.text.secondary,
								transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
								transition: "transform 0.2s ease",
								"&:hover": {
									color: theme.palette.text.primary,
									bgcolor: "rgba(255, 255, 255, 0.05)",
								},
							}}
						>
							<ExpandMore sx={{ fontSize: 16 }} />
						</IconButton>
					</Tooltip>
				</Box>
			</Box>

			{/* COMPACT PLAN VIEW */}
			{hasPlan && !isArrived && (
				<ShipFlightStatus ship={ship} isMine={isMine} />
			)}

			{/* ARRIVED WARNING */}
			{hasPlan && isArrived && (
				<Box
					sx={{ display: "flex", alignItems: "center", mt: 0.5, width: "100%" }}
				>
					<Typography
						variant="caption"
						sx={{
							color: theme.palette.warning.main,
							fontWeight: 700,
							fontSize: "0.65rem",
							display: "inline-flex",
							alignItems: "center",
							gap: 0.5,
						}}
					>
						⚠️ Arrived at {destName} • Telemetry update required
					</Typography>
				</Box>
			)}

			{/* STATIONARY LOCATION */}
			{!hasPlan && (
				<Typography
					variant="caption"
					sx={{
						color: theme.palette.text.secondary,
						fontSize: "0.675rem",
						mt: 0.25,
						width: "100%",
					}}
				>
					Location: {currentLocation}
				</Typography>
			)}

			{cargo &&
				!isExpanded &&
				(cargo.currentvolume > 0 || cargo.currentweight > 0) && (
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							mt: 0.75,
							pt: 0.75,
							width: "100%",
							borderTop: "1px dashed rgba(255, 255, 255, 0.05)",
						}}
					>
						<Box sx={{ display: "flex", alignItems: "center" }}>
							<Inventory2
								sx={{
									fontSize: 11,
									color: theme.palette.text.secondary,
									mr: 0.5,
									opacity: 0.6,
								}}
							/>
							<Typography
								variant="caption"
								sx={{
									color: getCargoColor(cargo.currentvolume, cargo.maxvolume),
									fontSize: "0.675rem",
									fontWeight: 500,
								}}
							>
								{cargo.currentvolume}{" "}
								<span
									style={{ color: theme.palette.text.disabled, opacity: 0.5 }}
								>
									/
								</span>{" "}
								{cargo.maxvolume} m³
							</Typography>
						</Box>
						<Box sx={{ display: "flex", alignItems: "center" }}>
							<Typography
								variant="caption"
								sx={{
									color: getCargoColor(cargo.currentweight, cargo.maxweight),
									fontSize: "0.675rem",
									fontWeight: 500,
								}}
							>
								{cargo.currentweight}{" "}
								<span
									style={{ color: theme.palette.text.disabled, opacity: 0.5 }}
								>
									/
								</span>{" "}
								{cargo.maxweight} t
							</Typography>
						</Box>
					</Box>
				)}

			{/* Expanded Panel */}
			{isExpanded && (
				<Box
					sx={{
						mt: 1.5,
						pt: 1.5,
						borderTop: "1px solid rgba(255, 255, 255, 0.06)",
						display: "flex",
						flexDirection: "column",
						gap: 1.5,
						width: "100%",
					}}
				>
					{/* Specs details */}
					<Box>
						<Typography
							variant="caption"
							sx={{
								color: "rgba(255,255,255,0.4)",
								display: "block",
								fontSize: "0.6rem",
								fontWeight: 700,
								textTransform: "uppercase",
								letterSpacing: "0.05em",
								mb: 0.5,
							}}
						>
							Ship details
						</Typography>
						<Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
							<Typography
								variant="caption"
								sx={{
									fontSize: "0.725rem",
									color: theme.palette.text.secondary,
								}}
							>
								Type:{" "}
								<span
									style={{ color: theme.palette.text.primary, fontWeight: 600 }}
								>
									{ship.type || ship.ship_type || ship.shipType || "Unknown"}
								</span>
							</Typography>
							<Typography
								variant="caption"
								sx={{
									fontSize: "0.725rem",
									color: theme.palette.text.secondary,
								}}
							>
								Registration:{" "}
								<span
									style={{ color: theme.palette.text.primary, fontWeight: 600 }}
								>
									{ship.registration}
								</span>
							</Typography>
						</Box>
					</Box>

					{/* Current Position or Flight Details */}
					{hasPlan && !isArrived ? (
						<Box>
							<Typography
								variant="caption"
								sx={{
									color: "rgba(255,255,255,0.4)",
									display: "block",
									fontSize: "0.6rem",
									fontWeight: 700,
									textTransform: "uppercase",
									letterSpacing: "0.05em",
									mb: 0.5,
								}}
							>
								Flight Details
							</Typography>
							<ShipFlightStatus ship={ship} isMine={isMine} />
						</Box>
					) : (
						<Box>
							<Typography
								variant="caption"
								sx={{
									color: "rgba(255,255,255,0.4)",
									display: "block",
									fontSize: "0.6rem",
									fontWeight: 700,
									textTransform: "uppercase",
									letterSpacing: "0.05em",
									mb: 0.25,
								}}
							>
								Current Position
							</Typography>
							<Typography
								variant="body2"
								sx={{
									fontSize: "0.725rem",
									fontWeight: 500,
									color: theme.palette.text.primary,
								}}
							>
								{isArrived ? `${destName} (Arrived)` : currentLocation}
							</Typography>
							{isArrived && (
								<Typography
									variant="caption"
									sx={{
										color: theme.palette.warning.main,
										display: "block",
										mt: 0.5,
										fontWeight: 650,
									}}
								>
									⚠️ Flight ended. Awaiting telemetry update from Apex.
								</Typography>
							)}
						</Box>
					)}

					{/* Storages summary with progress bars */}
					{(hasStlFuelSupport || hasFtlFuelSupport || shipStore) && (
						<Box>
							<Typography
								variant="caption"
								sx={{
									color: "rgba(255,255,255,0.4)",
									display: "block",
									fontSize: "0.6rem",
									fontWeight: 700,
									textTransform: "uppercase",
									letterSpacing: "0.05em",
									mb: 0.75,
								}}
							>
								Storage Status
							</Typography>
							<Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
								{hasStlFuelSupport && (
									<Box
										sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}
									>
										<Box
											sx={{
												display: "flex",
												justifyContent: "space-between",
												alignItems: "flex-start",
												flexWrap: "wrap",
												gap: 0.5,
											}}
										>
											<Typography
												variant="caption"
												sx={{
													fontSize: "0.675rem",
													color: theme.palette.text.secondary,
												}}
											>
												STL Fuel Tank ({stlFuelQty} SF)
											</Typography>
											<Typography
												variant="caption"
												sx={{
													fontSize: "0.675rem",
													fontWeight: 600,
													color:
														stlFuelPct < 20
															? theme.palette.error.main
															: theme.palette.info.main,
													textAlign: "right",
												}}
											>
												{stlFuelStore.volumeload.toFixed(2)} /{" "}
												{stlFuelStore.volumecapacity} m³ • {stlFuelPct}%
											</Typography>
										</Box>
										<Box
											sx={{
												width: "100%",
												height: 4,
												bgcolor: "rgba(255, 255, 255, 0.05)",
												borderRadius: 1,
												overflow: "hidden",
											}}
										>
											<Box
												sx={{
													width: `${Math.min(100, stlFuelPct)}%`,
													height: "100%",
													bgcolor:
														stlFuelPct < 20
															? theme.palette.error.main
															: theme.palette.info.main,
												}}
											/>
										</Box>
									</Box>
								)}
								{hasFtlFuelSupport && (
									<Box
										sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}
									>
										<Box
											sx={{
												display: "flex",
												justifyContent: "space-between",
												alignItems: "flex-start",
												flexWrap: "wrap",
												gap: 0.5,
											}}
										>
											<Typography
												variant="caption"
												sx={{
													fontSize: "0.675rem",
													color: theme.palette.text.secondary,
												}}
											>
												FTL Fuel Tank ({ftlFuelQty} FF)
											</Typography>
											<Typography
												variant="caption"
												sx={{
													fontSize: "0.675rem",
													fontWeight: 600,
													color:
														ftlFuelPct < 20
															? theme.palette.error.main
															: theme.palette.secondary.main,
													textAlign: "right",
												}}
											>
												{ftlFuelStore.volumeload.toFixed(2)} /{" "}
												{ftlFuelStore.volumecapacity} m³ • {ftlFuelPct}%
											</Typography>
										</Box>
										<Box
											sx={{
												width: "100%",
												height: 4,
												bgcolor: "rgba(255, 255, 255, 0.05)",
												borderRadius: 1,
												overflow: "hidden",
											}}
										>
											<Box
												sx={{
													width: `${Math.min(100, ftlFuelPct)}%`,
													height: "100%",
													bgcolor:
														ftlFuelPct < 20
															? theme.palette.error.main
															: theme.palette.secondary.main,
												}}
											/>
										</Box>
									</Box>
								)}
								{shipStore && (
									<Box
										sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}
									>
										{/* Volume Progress */}
										<Box
											sx={{
												display: "flex",
												flexDirection: "column",
												gap: 0.25,
											}}
										>
											<Box
												sx={{
													display: "flex",
													justifyContent: "space-between",
													flexWrap: "wrap",
													gap: 0.5,
												}}
											>
												<Typography
													variant="caption"
													sx={{
														fontSize: "0.675rem",
														color: theme.palette.text.secondary,
													}}
												>
													Cargo Volume
												</Typography>
												<Typography
													variant="caption"
													sx={{
														fontSize: "0.675rem",
														fontWeight: 600,
														color: theme.palette.primary.main,
														textAlign: "right",
													}}
												>
													{shipStore.volumeload.toFixed(2)} /{" "}
													{shipStore.volumecapacity} m³ (
													{Math.round(
														(shipStore.volumeload /
															(shipStore.volumecapacity || 1)) *
															100,
													)}
													%)
												</Typography>
											</Box>
											<Box
												sx={{
													width: "100%",
													height: 4,
													bgcolor: "rgba(255, 255, 255, 0.05)",
													borderRadius: 1,
													overflow: "hidden",
												}}
											>
												<Box
													sx={{
														width: `${Math.min(100, Math.round((shipStore.volumeload / (shipStore.volumecapacity || 1)) * 100))}%`,
														height: "100%",
														bgcolor: theme.palette.primary.main,
													}}
												/>
											</Box>
										</Box>

										{/* Weight Progress */}
										<Box
											sx={{
												display: "flex",
												flexDirection: "column",
												gap: 0.25,
											}}
										>
											<Box
												sx={{
													display: "flex",
													justifyContent: "space-between",
													flexWrap: "wrap",
													gap: 0.5,
												}}
											>
												<Typography
													variant="caption"
													sx={{
														fontSize: "0.675rem",
														color: theme.palette.text.secondary,
													}}
												>
													Cargo Weight
												</Typography>
												<Typography
													variant="caption"
													sx={{
														fontSize: "0.675rem",
														fontWeight: 600,
														color: theme.palette.primary.main,
														textAlign: "right",
													}}
												>
													{shipStore.weightload.toFixed(2)} /{" "}
													{shipStore.weightcapacity} t (
													{Math.round(
														(shipStore.weightload /
															(shipStore.weightcapacity || 1)) *
															100,
													)}
													%)
												</Typography>
											</Box>
											<Box
												sx={{
													width: "100%",
													height: 4,
													bgcolor: "rgba(255, 255, 255, 0.05)",
													borderRadius: 1,
													overflow: "hidden",
												}}
											>
												<Box
													sx={{
														width: `${Math.min(100, Math.round((shipStore.weightload / (shipStore.weightcapacity || 1)) * 100))}%`,
														height: "100%",
														bgcolor: theme.palette.primary.main,
													}}
												/>
											</Box>
										</Box>
									</Box>
								)}
							</Box>
						</Box>
					)}

					{/* Cargo Items List using MaterialBadges */}
					{shipStore && shipStore.items && shipStore.items.length > 0 ? (
						<Box>
							<Typography
								variant="caption"
								sx={{
									color: "rgba(255,255,255,0.4)",
									display: "block",
									fontSize: "0.6rem",
									fontWeight: 700,
									textTransform: "uppercase",
									letterSpacing: "0.05em",
									mb: 0.75,
								}}
							>
								Cargo Manifest ({shipStore.items.length})
							</Typography>
							<Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
								{shipStore.items.map((item: any, idx: number) => (
									<Box
										key={idx}
										sx={{
											display: "inline-flex",
											alignItems: "center",
											bgcolor: "rgba(0, 0, 0, 0.2)",
											border: "1px solid rgba(255,255,255,0.06)",
											borderRadius: "4px",
											px: 0.5,
											py: 0.25,
											gap: 0.5,
											fontSize: "0.65rem",
										}}
									>
										<MaterialBadge ticker={item.name} />
										<Typography
											variant="caption"
											sx={{
												fontSize: "0.65rem",
												fontWeight: 700,
												color: theme.palette.text.primary,
											}}
										>
											{item.quantity}
										</Typography>
									</Box>
								))}
							</Box>
						</Box>
					) : (
						isMine && (
							<Box>
								<Typography
									variant="caption"
									sx={{
										color: "rgba(255,255,255,0.4)",
										display: "block",
										fontSize: "0.6rem",
										fontWeight: 700,
										textTransform: "uppercase",
										letterSpacing: "0.05em",
										mb: 0.25,
									}}
								>
									Cargo Manifest
								</Typography>
								<Typography
									variant="caption"
									sx={{
										color: theme.palette.text.secondary,
										fontStyle: "italic",
										fontSize: "0.675rem",
									}}
								>
									No cargo items on board.
								</Typography>
							</Box>
						)
					)}
				</Box>
			)}
		</ListItemButton>
	);
};

export default React.memo(ShipRow, (prev, next) => {
	return (
		(prev.ship.id || prev.ship.ship_id) ===
			(next.ship.id || next.ship.ship_id) &&
		prev.isSelected === next.isSelected &&
		prev.isPathVisible === next.isPathVisible &&
		prev.ship.plan === next.ship.plan
	);
});
