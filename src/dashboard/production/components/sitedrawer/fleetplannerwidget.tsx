import React, { useCallback, useState } from "react";
import {
	Box,
	Typography,
	Paper,
	Button,
	Checkbox,
	FormControl,
	Select,
	MenuItem,
	useTheme,
	alpha,
	Collapse,
	IconButton,
	LinearProgress,
} from "@mui/material";
import { ChevronUp, ChevronDown, Settings2, Plus } from "lucide-react";
import { CARGO_BAYS } from "./utils";
import { ShipBreakdown } from "./shipbreakdown";

export const FleetPlannerWidget = ({
	cargoPlan,
	allocationStrategy,
	allowedShipTypes,
	shipOverride,
	selectedMaterials,
	assumeOptimal,
	maxShips,
	handleStrategyChange,
	handleAllowedShipsChange,
	setShipOverride,
	handleCopyLogistics,
	toggleAssumeOptimal,
	handleMaxShipsChange,
	useMyFleet,
	setUseMyFleet,
	animatedShipData,
	fleetMappingConfig,
	setFleetMappingConfig,
	manualFleet,
	setManualFleet,
	isReturnTrip,
}: any) => {
	const theme = useTheme();
	const [fleetExpanded, setFleetExpanded] = useState(false);

	const handleAddShip = useCallback(() => {
		if (setManualFleet) {
			setManualFleet((prev: any[]) => [
				...prev,
				{
					id: `manual-ship-${Date.now()}`,
					bayId: "LCB",
				},
			]);
		}
	}, [setManualFleet]);

	const pctW =
		cargoPlan.idealW > 0
			? Math.min(100, (cargoPlan.loadedW / cargoPlan.idealW) * 100)
			: 100;
	const pctV =
		cargoPlan.idealV > 0
			? Math.min(100, (cargoPlan.loadedV / cargoPlan.idealV) * 100)
			: 100;

	return (
		<Paper
			variant="outlined"
			sx={{
				p: 1.25,
				mb: 1.5,
				bgcolor: "rgba(16, 16, 32, 0.6)",
				borderColor: "rgba(123, 104, 238, 0.3)",
				borderRadius: "12px",
				display: "flex",
				flexDirection: "column",
				maxHeight: fleetExpanded ? "45vh" : "auto",
				transition: "max-height 0.3s ease",
			}}
		>
			{/* Top Control Toolbar */}
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					gap: 1,
					pb: 1,
					borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
				}}
			>
				<Box
					sx={{
						display: "flex",
						gap: 1,
						flexWrap: "wrap",
						alignItems: "center",
						justifyContent: "space-between",
					}}
				>
					{/* Left Selectors */}
					<Box
						sx={{
							display: "flex",
							gap: 1,
							flexWrap: "wrap",
							alignItems: "center",
						}}
					>
						<FormControl size="small">
							<Select
								value={shipOverride}
								onChange={(e) => setShipOverride(e.target.value as string)}
								sx={{
									height: 26,
									fontSize: "0.72rem",
									fontWeight: 700,
									bgcolor: "rgba(0,0,0,0.4)",
									color: "white",
									"& .MuiSelect-select": { py: 0, px: 1 },
								}}
							>
								<MenuItem value="auto" sx={{ fontSize: "0.75rem" }}>
									Auto Fleet
								</MenuItem>
								<MenuItem value="manual" sx={{ fontSize: "0.75rem" }}>
									Manual Fleet
								</MenuItem>
								{CARGO_BAYS.map((s) => (
									<MenuItem
										key={s.id}
										value={s.id}
										sx={{ fontSize: "0.75rem" }}
									>
										Force {s.id}
									</MenuItem>
								))}
							</Select>
						</FormControl>

						{shipOverride !== "manual" && (
							<FormControl size="small">
								<Select
									value={String(maxShips || 0)}
									onChange={(e) => handleMaxShipsChange(e.target.value)}
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
										value="0"
										sx={{ fontSize: "0.75rem", fontWeight: 600 }}
									>
										Max Ships: {shipOverride === "auto" ? "Auto" : "1"}
									</MenuItem>
									{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
										<MenuItem
											key={num}
											value={String(num)}
											sx={{ fontSize: "0.75rem", fontWeight: 600 }}
										>
											Max Ships: {num}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						)}

						<FormControl size="small">
							<Select
								value={allocationStrategy}
								onChange={(e) => handleStrategyChange(e.target.value as any)}
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
									value="together"
									sx={{ fontSize: "0.75rem", fontWeight: 600 }}
								>
									Keep Together
								</MenuItem>
								<MenuItem
									value="balance"
									sx={{ fontSize: "0.75rem", fontWeight: 600 }}
								>
									Balance Load
								</MenuItem>
								<MenuItem
									value="categorized"
									sx={{ fontSize: "0.75rem", fontWeight: 600 }}
								>
									Group by Category
								</MenuItem>
							</Select>
						</FormControl>

						{shipOverride === "manual" && (
							<Button
								variant="contained"
								size="small"
								startIcon={<Plus size={14} />}
								onClick={handleAddShip}
								sx={{
									height: 26,
									fontSize: "0.72rem",
									fontWeight: 800,
									bgcolor: "#7B68EE",
									textTransform: "none",
									px: 1,
								}}
							>
								Add Ship
							</Button>
						)}
					</Box>

					{/* Right Action Buttons */}
					<Box sx={{ display: "flex", gap: 0.75, alignItems: "center" }}>
						<Button
							variant={useMyFleet ? "contained" : "outlined"}
							size="small"
							onClick={() => setUseMyFleet(!useMyFleet)}
							sx={{
								height: 26,
								px: 1,
								fontSize: "0.7rem",
								fontWeight: 800,
								textTransform: "none",
								bgcolor: useMyFleet ? "#7B68EE" : "rgba(0,0,0,0.3)",
								color: useMyFleet ? "white" : "rgba(255,255,255,0.7)",
								border: "1px solid rgba(123, 104, 238, 0.3)",
							}}
						>
							Map to Fleet
						</Button>
						<Button
							variant={assumeOptimal ? "contained" : "outlined"}
							size="small"
							onClick={toggleAssumeOptimal}
							sx={{
								height: 26,
								px: 1,
								fontSize: "0.7rem",
								fontWeight: 800,
								textTransform: "none",
								bgcolor: assumeOptimal ? "#69f0ae" : "rgba(0,0,0,0.3)",
								color: assumeOptimal ? "black" : "rgba(255,255,255,0.7)",
								border: "1px solid rgba(105, 240, 174, 0.3)",
							}}
						>
							100% Opt.
						</Button>
						<Button
							variant="contained"
							size="small"
							startIcon={<Settings2 size={14} />}
							onClick={handleCopyLogistics}
							disabled={selectedMaterials.size === 0}
							sx={{
								height: 26,
								px: 1,
								fontSize: "0.7rem",
								fontWeight: 800,
								bgcolor: "#00e5ff",
								color: "black",
								textTransform: "none",
								"&:hover": { bgcolor: "#00b8d4" },
							}}
						>
							XIT Config
						</Button>
					</Box>
				</Box>
			</Box>

			{/* Total Fleet Cargo Payload Progress Bars */}
			{(cargoPlan.idealW > 0 || cargoPlan.idealV > 0) && (
				<Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 0.5 }}>
					<Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
						<Box
							sx={{ flex: 1, display: "flex", alignItems: "center", gap: 1 }}
						>
							<Box
								sx={{
									flex: 1,
									height: 6,
									bgcolor: "rgba(255,255,255,0.1)",
									borderRadius: 3,
									overflow: "hidden",
								}}
							>
								<Box
									sx={{
										height: "100%",
										width: `${pctW}%`,
										bgcolor: "#ffd700",
										transition: "width 0.3s",
									}}
								/>
							</Box>
							<Typography
								variant="caption"
								sx={{
									color: "white",
									fontWeight: 800,
									fontSize: "0.72rem",
									whiteSpace: "nowrap",
								}}
							>
								{cargoPlan.loadedW.toFixed(0)} / {cargoPlan.idealW.toFixed(0)} t
								({pctW.toFixed(0)}%)
							</Typography>
						</Box>

						<Box
							sx={{ flex: 1, display: "flex", alignItems: "center", gap: 1 }}
						>
							<Box
								sx={{
									flex: 1,
									height: 6,
									bgcolor: "rgba(255,255,255,0.1)",
									borderRadius: 3,
									overflow: "hidden",
								}}
							>
								<Box
									sx={{
										height: "100%",
										width: `${pctV}%`,
										bgcolor: "#00e5ff",
										transition: "width 0.3s",
									}}
								/>
							</Box>
							<Typography
								variant="caption"
								sx={{
									color: "white",
									fontWeight: 800,
									fontSize: "0.72rem",
									whiteSpace: "nowrap",
								}}
							>
								{cargoPlan.loadedV.toFixed(0)} / {cargoPlan.idealV.toFixed(0)}{" "}
								m³ ({pctV.toFixed(0)}%)
							</Typography>
						</Box>
					</Box>
				</Box>
			)}

			{/* Fleet Ships Breakdown Collapsible */}
			{cargoPlan.ships && cargoPlan.ships.length > 0 && (
				<Box sx={{ mt: 1 }}>
					<Box
						onClick={() => setFleetExpanded(!fleetExpanded)}
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							cursor: "pointer",
							py: 0.25,
							px: 0.5,
							bgcolor: "rgba(0,0,0,0.3)",
							borderRadius: "6px",
						}}
					>
						<Typography
							variant="caption"
							sx={{ color: "#7B68EE", fontWeight: 800, fontSize: "0.72rem" }}
						>
							Fleet Breakdown ({cargoPlan.ships.length} Ships)
						</Typography>
						<IconButton size="small" sx={{ p: 0, color: "white" }}>
							{fleetExpanded ? (
								<ChevronUp size={16} />
							) : (
								<ChevronDown size={16} />
							)}
						</IconButton>
					</Box>

					<Collapse in={fleetExpanded}>
						<Box
							sx={{
								mt: 0.75,
								display: "flex",
								flexDirection: "column",
								gap: 0.5,
								maxHeight: "35vh",
								overflowY: "auto",
							}}
						>
							{cargoPlan.ships.map((ship: any, idx: number) => (
								<ShipBreakdown
									key={ship.fleetId || idx}
									ship={ship}
									index={idx}
									useMyFleet={useMyFleet}
									animatedShipData={animatedShipData}
									fleetMappingConfig={fleetMappingConfig}
									setFleetMappingConfig={setFleetMappingConfig}
									isManual={shipOverride === "manual"}
									manualFleet={manualFleet}
									setManualFleet={setManualFleet}
								/>
							))}
						</Box>
					</Collapse>
				</Box>
			)}
		</Paper>
	);
};
