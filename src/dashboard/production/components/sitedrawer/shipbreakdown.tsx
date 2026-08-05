import React, { useMemo } from "react";
import {
	Box,
	Typography,
	useTheme,
	alpha,
	Tooltip,
	Select,
	MenuItem,
	FormControl,
	IconButton,
} from "@mui/material";
import { X } from "lucide-react";
import { smartFormat, CARGO_BAYS } from "./utils.ts";
import MaterialBadge from "../../../../cosm/components/materialbadge.tsx";
import { useGlobalData } from "../../../../context/globaldatacontext.tsx";

export const ShipBreakdown = ({
	ship,
	index,
	unmetW,
	unmetV,
	useMyFleet,
	animatedShipData,
	fleetMappingConfig,
	setFleetMappingConfig,
	isManual,
	manualFleet,
	setManualFleet,
}: {
	ship: any;
	index: number;
	unmetW?: number;
	unmetV?: number;
	useMyFleet?: boolean;
	animatedShipData?: any[];
	fleetMappingConfig?: Record<string, string>;
	setFleetMappingConfig?: React.Dispatch<
		React.SetStateAction<Record<string, string>>
	>;
	isManual?: boolean;
	manualFleet?: any[];
	setManualFleet?: React.Dispatch<React.SetStateAction<any[]>>;
}) => {
	const theme = useTheme();
	const globalData = useGlobalData();

	const shipsList = useMemo(() => {
		if (animatedShipData && animatedShipData.length > 0)
			return animatedShipData;
		if (globalData?.ownerShips && globalData.ownerShips.length > 0)
			return globalData.ownerShips;
		return [];
	}, [animatedShipData, globalData?.ownerShips]);

	const wLoadPct = Math.min(100, (ship.loadedW / ship.weight) * 100);
	const vLoadPct = Math.min(100, (ship.loadedV / ship.volume) * 100);

	const inventoryItems = Object.entries(ship.inventory).filter(
		([_, amt]) => (amt as number) >= 0.1,
	);

	const mappedShipId = fleetMappingConfig?.[ship.fleetId] || "";

	const handleMapShip = (e: any) => {
		if (setFleetMappingConfig) {
			setFleetMappingConfig((prev) => ({
				...prev,
				[ship.fleetId]: e.target.value,
			}));
		}
	};

	const handleTypeChange = (e: any) => {
		if (setManualFleet) {
			setManualFleet((prev) =>
				prev.map((mShip) =>
					mShip.id === ship.fleetId
						? { ...mShip, bayId: e.target.value }
						: mShip,
				),
			);
		}
	};

	const handleRemoveShip = () => {
		if (setManualFleet) {
			setManualFleet((prev) =>
				prev.filter((mShip) => mShip.id !== ship.fleetId),
			);
		}
	};

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				gap: 0.75,
				py: 1,
				px: 1,
				borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
				bgcolor: "rgba(0,0,0,0.2)",
				borderRadius: "8px",
				mb: 0.75,
				"&:last-child": { mb: 0 },
			}}
		>
			<Box
				sx={{
					display: "flex",
					flexDirection: "row",
					alignItems: "center",
					width: "100%",
					gap: 1.5,
				}}
			>
				{isManual ? (
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 0.5,
						}}
					>
						<Typography
							variant="caption"
							sx={{
								color: "text.primary",
								fontWeight: 800,
								fontSize: "0.75rem",
							}}
						>
							{index + 1}.
						</Typography>
						<Select
							value={ship.id}
							onChange={handleTypeChange}
							size="small"
							variant="standard"
							disableUnderline
							sx={{
								fontSize: "0.75rem",
								fontWeight: 800,
								color: "#ffd700",
								"& .MuiSelect-select": { py: 0, px: 0.5 },
							}}
						>
							{CARGO_BAYS.map((bay) => (
								<MenuItem
									key={bay.id}
									value={bay.id}
									sx={{ fontSize: "0.75rem" }}
								>
									{bay.id}
								</MenuItem>
							))}
						</Select>
					</Box>
				) : (
					<Typography
						variant="caption"
						sx={{
							color: "text.primary",
							fontWeight: 800,
							fontSize: "0.75rem",
						}}
					>
						{index + 1}. {ship.id}
					</Typography>
				)}

				<Box
					sx={{
						display: "flex",
						width: "100%",
						flexDirection: "column",
						gap: 0.5,
					}}
				>
					{/* --- WEIGHT BAR --- */}
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<Tooltip
							title={`Loaded: ${ship.loadedW.toFixed(0)}t | Capacity: ${ship.weight}t`}
						>
							<Box
								sx={{
									flex: 1,
									height: 5,
									bgcolor: alpha(theme.palette.text.secondary, 0.15),
									borderRadius: 2,
									position: "relative",
								}}
							>
								<Box
									sx={{
										position: "absolute",
										top: 0,
										left: 0,
										height: "100%",
										width: `${wLoadPct}%`,
										bgcolor: "#ffd700",
										borderRadius: 2,
										transition: "width 0.3s ease",
									}}
								/>
							</Box>
						</Tooltip>
						<Typography
							variant="caption"
							sx={{
								fontSize: "0.68rem",
								fontWeight: 700,
								color: "text.secondary",
								whiteSpace: "nowrap",
							}}
						>
							<span style={{ color: "white" }}>{ship.loadedW.toFixed(0)}</span>{" "}
							/ {ship.weight} t
						</Typography>
					</Box>

					{/* --- VOLUME BAR --- */}
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<Tooltip
							title={`Loaded: ${ship.loadedV.toFixed(0)}m³ | Capacity: ${ship.volume}m³`}
						>
							<Box
								sx={{
									flex: 1,
									height: 5,
									bgcolor: alpha(theme.palette.text.secondary, 0.15),
									borderRadius: 2,
									position: "relative",
								}}
							>
								<Box
									sx={{
										position: "absolute",
										top: 0,
										left: 0,
										height: "100%",
										width: `${vLoadPct}%`,
										bgcolor: "#00e5ff",
										borderRadius: 2,
										transition: "width 0.3s ease",
									}}
								/>
							</Box>
						</Tooltip>
						<Typography
							variant="caption"
							sx={{
								fontSize: "0.68rem",
								fontWeight: 700,
								color: "text.secondary",
								whiteSpace: "nowrap",
							}}
						>
							<span style={{ color: "white" }}>{ship.loadedV.toFixed(0)}</span>{" "}
							/ {ship.volume} m³
						</Typography>
					</Box>
				</Box>

				{isManual && (
					<IconButton
						size="small"
						onClick={handleRemoveShip}
						sx={{ color: "error.main", p: 0.25 }}
					>
						<X size={14} />
					</IconButton>
				)}
			</Box>

			{/* Map to Fleet Dropdown (Connected to User Ships Context) */}
			{useMyFleet && (
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						gap: 1,
						mt: 0.25,
					}}
				>
					<Typography
						variant="caption"
						sx={{
							fontSize: "0.68rem",
							color: "rgba(255,255,255,0.7)",
							fontWeight: 700,
						}}
					>
						Assign Fleet Ship:
					</Typography>
					<FormControl size="small" sx={{ flex: 1 }}>
						<Select
							value={mappedShipId}
							displayEmpty
							onChange={handleMapShip}
							MenuProps={{
								slotProps: {
									paper: {
										sx: {
											background: "#101020",
											backgroundImage: "none",
											color: "white",
										},
									},
								},
							}}
							sx={{
								height: 26,
								fontSize: "0.72rem",
								fontWeight: 700,
								bgcolor: "rgba(0,0,0,0.4)",
								color: "white",
								"& .MuiSelect-select": { py: 0, px: 1 },
							}}
						>
							<MenuItem
								value=""
								sx={{ fontSize: "0.75rem", fontStyle: "italic" }}
							>
								Select Fleet Ship...
							</MenuItem>
							{shipsList.map((realShip: any) => {
								const reg =
									realShip.registration ||
									realShip.ShipRegistration ||
									realShip.id;
								const name = realShip.name || realShip.ShipName || "Ship";
								const vol = realShip.CargoVolume || 2000;
								const wgt = realShip.CargoWeight || 2000;

								return (
									<MenuItem key={reg} value={reg} sx={{ fontSize: "0.75rem" }}>
										🚢 {reg} - {name} ({vol} m³ / {wgt} t)
									</MenuItem>
								);
							})}
						</Select>
					</FormControl>
				</Box>
			)}

			<Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, pt: 0.5 }}>
				{inventoryItems.length > 0 ? (
					inventoryItems.map(([ticker, amt]) => (
						<Box
							key={ticker}
							sx={{ display: "flex", alignItems: "center", gap: 0.25 }}
						>
							<MaterialBadge ticker={ticker} />
							<Typography
								variant="caption"
								fontWeight={700}
								sx={{ fontSize: "0.7rem", color: "white" }}
							>
								{smartFormat(amt as number).text}
							</Typography>
						</Box>
					))
				) : (
					<Typography
						variant="caption"
						sx={{
							fontSize: "0.65rem",
							color: "text.disabled",
							fontStyle: "italic",
						}}
					>
						Empty Cargo Hold
					</Typography>
				)}
			</Box>
		</Box>
	);
};
