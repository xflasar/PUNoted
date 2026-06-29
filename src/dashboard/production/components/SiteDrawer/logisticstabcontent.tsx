import React, { useState, useMemo } from "react";
import { Box, Typography, Stack, Button, useTheme, alpha } from "@mui/material";
import { CheckSquare, Square } from "lucide-react";
import { FleetPlannerWidget } from "./fleetplannerwidget";
import { LogisticsRowComponent } from "./logisticsrowcomponent";
import { XitConfigPopover } from "../../../../components/common/xitconfigpopover";
import { useGlobalData } from "../../../../context/globaldatacontext";

export const LogisticsTabContent: React.FC<any> = ({
	siteName,
	logisticsRows,
	selectedMaterials,
	materialPriorities,
	allowedShipTypes,
	shipOverride,
	allocationStrategy,
	assumeOptimal,
	maxShips,
	flightBufferDays,
	setShipOverride,
	handleTargetChange,
	handlePriorityChange,
	handleAllowedShipsChange,
	handleStrategyChange,
	toggleMaterial,
	toggleAllLogistics,
	toggleAssumeOptimal,
	handleMaxShipsChange,
	handleFlightBufferChange,
	handleAddDaysToAll,
	handleSyncAllTargets,
	cargoPlan,
	surplusCargoPlan,
	onShowSnackbar,
	manualFleet,
	setManualFleet,
	surplusRows,
	selectedSurplusMaterials,
	enableSurplus,
	toggleSurplusMaterial,
	toggleEnableSurplus,
	toggleAllSurplus,
}) => {
	const theme = useTheme();
	const { animatedShipData } = useGlobalData();

	// --- XIT CONFIGURATION STATE ---
	const [xitAnchorEl, setXitAnchorEl] = useState<HTMLElement | null>(null);
	const [useMyFleet, setUseMyFleet] = useState(false);
	const [fleetMappingConfig, setFleetMappingConfig] = useState<
		Record<string, string>
	>({});
	const [viewMode, setViewMode] = useState<"dropoff" | "pickup">("dropoff");

	React.useEffect(() => {
		if (shipOverride === "manual" && setManualFleet) {
			setManualFleet((prev: any[]) => {
				let changed = false;
				const next = prev.map((mShip: any) => {
					const mappedReg = fleetMappingConfig[mShip.id];
					if (mappedReg) {
						const realShip = animatedShipData?.find(
							(s: any) => s.registration === mappedReg,
						);
						if (realShip && realShip.type && realShip.type !== mShip.bayId) {
							changed = true;
							return { ...mShip, bayId: realShip.type };
						}
					}
					return mShip;
				});
				return changed ? next : prev;
			});
		}
	}, [fleetMappingConfig, animatedShipData, shipOverride, setManualFleet]);

	const handleOpenXitSettings = (event: React.MouseEvent<HTMLElement>) => {
		const targetPlan = viewMode === "dropoff" ? cargoPlan : surplusCargoPlan;
		if (Object.keys(targetPlan.allocatedResults).length === 0) {
			onShowSnackbar("No materials allocated.");
			return;
		}
		setXitAnchorEl(event.currentTarget);
	};

	const allocatedMaterials = useMemo(() => {
		const targetPlan = viewMode === "dropoff" ? cargoPlan : surplusCargoPlan;
		const materials: Record<string, number> = {};
		Object.entries(targetPlan.allocatedResults).forEach(([ticker, amt]) => {
			if ((amt as number) > 0) materials[ticker] = Math.ceil(amt as number);
		});
		return materials;
	}, [cargoPlan.allocatedResults, surplusCargoPlan.allocatedResults, viewMode]);

	const activeRows = viewMode === "dropoff" ? logisticsRows : surplusRows;
	const activeSelected =
		viewMode === "dropoff" ? selectedMaterials : selectedSurplusMaterials;
	const activeToggleAll =
		viewMode === "dropoff" ? toggleAllLogistics : toggleAllSurplus;
	const activeToggleMaterial =
		viewMode === "dropoff" ? toggleMaterial : toggleSurplusMaterial;
	const activeCargoPlan = viewMode === "dropoff" ? cargoPlan : surplusCargoPlan;

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				height: "100%",
				overflow: "hidden",
			}}
		>
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					mb: 1,
				}}
			>
				<Box sx={{ display: "flex", gap: 1 }}>
					<Button
						variant={viewMode === "dropoff" ? "contained" : "outlined"}
						size="small"
						color={viewMode === "dropoff" ? "primary" : "inherit"}
						onClick={() => setViewMode("dropoff")}
						sx={{
							height: 24,
							fontSize: "0.7rem",
							py: 0,
							px: 1,
							borderColor:
								viewMode === "dropoff"
									? "transparent"
									: alpha(theme.palette.text.primary, 0.2),
						}}
					>
						Drop-off (Inputs)
					</Button>
					<Button
						variant={viewMode === "pickup" ? "contained" : "outlined"}
						size="small"
						color={viewMode === "pickup" ? "primary" : "inherit"}
						onClick={() => setViewMode("pickup")}
						sx={{
							height: 24,
							fontSize: "0.7rem",
							py: 0,
							px: 1,
							borderColor:
								viewMode === "pickup"
									? "transparent"
									: alpha(theme.palette.text.primary, 0.2),
						}}
					>
						Pick-up (Surplus)
					</Button>
				</Box>
				{viewMode === "pickup" && (
					<Button
						variant={enableSurplus ? "contained" : "outlined"}
						size="small"
						color={enableSurplus ? "success" : "inherit"}
						onClick={toggleEnableSurplus}
						sx={{
							height: 24,
							fontSize: "0.7rem",
							py: 0,
							px: 1,
							borderColor: enableSurplus
								? "transparent"
								: alpha(theme.palette.text.primary, 0.2),
						}}
					>
						{enableSurplus ? "Surplus Enabled" : "Enable Surplus"}
					</Button>
				)}
			</Box>

			{viewMode === "pickup" && !enableSurplus ? (
				<Box
					sx={{
						flex: 1,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<Typography variant="body2" color="text.secondary">
						Surplus tracking is disabled. Enable it to plan return trips.
					</Typography>
				</Box>
			) : (
				<>
					<FleetPlannerWidget
						cargoPlan={viewMode === "dropoff" ? cargoPlan : surplusCargoPlan}
						allocationStrategy={allocationStrategy}
						allowedShipTypes={allowedShipTypes}
						shipOverride={shipOverride}
						selectedMaterials={
							viewMode === "dropoff"
								? selectedMaterials
								: selectedSurplusMaterials
						}
						assumeOptimal={assumeOptimal}
						maxShips={maxShips}
						handleStrategyChange={handleStrategyChange}
						handleAllowedShipsChange={handleAllowedShipsChange}
						setShipOverride={setShipOverride}
						handleCopyLogistics={handleOpenXitSettings}
						toggleAssumeOptimal={toggleAssumeOptimal}
						handleMaxShipsChange={handleMaxShipsChange}
						useMyFleet={useMyFleet}
						setUseMyFleet={setUseMyFleet}
						animatedShipData={animatedShipData}
						fleetMappingConfig={fleetMappingConfig}
						setFleetMappingConfig={setFleetMappingConfig}
						manualFleet={manualFleet}
						setManualFleet={setManualFleet}
						isReturnTrip={viewMode === "pickup"}
					/>

					{/* --- GLOBAL SELECT/DESELECT & QUICK ACTIONS --- */}
					<Box
						sx={{
							mb: 1,
							px: 0.5,
							display: "flex",
							flexWrap: "wrap",
							justifyContent: "space-between",
							alignItems: "center",
							gap: 1,
						}}
					>
						<Button
							size="small"
							startIcon={
								activeSelected.size === activeRows.length &&
								activeRows.length > 0 ? (
									<CheckSquare size={16} />
								) : (
									<Square size={16} />
								)
							}
							onClick={activeToggleAll}
							sx={{
								color: "text.secondary",
								p: 0,
								fontSize: "0.75rem",
								minWidth: "auto",
							}}
						>
							{activeSelected.size === activeRows.length &&
							activeRows.length > 0
								? "None"
								: "All"}
						</Button>

						{viewMode === "dropoff" && (
							<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
								<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
									<Typography
										variant="caption"
										fontWeight={700}
										color="text.secondary"
									>
										Buffer:
									</Typography>
									<input
										type="number"
										min="0"
										value={flightBufferDays}
										onChange={(e) => handleFlightBufferChange(e.target.value)}
										style={{
											width: "30px",
											height: "20px",
											fontSize: "0.7rem",
											fontWeight: 800,
											textAlign: "center",
											borderRadius: "4px",
											border: `1px solid ${theme.palette.divider}`,
											backgroundColor: alpha(
												theme.palette.background.default,
												0.5,
											),
											color: theme.palette.text.primary,
										}}
									/>
									<Typography
										variant="caption"
										fontWeight={700}
										color="text.secondary"
									>
										d
									</Typography>
								</Box>
								<Box
									sx={{ width: "1px", height: "12px", bgcolor: "divider" }}
								/>
								<Button
									size="small"
									variant="outlined"
									sx={{
										py: 0,
										px: 0.5,
										minWidth: 0,
										fontSize: "0.65rem",
										height: 20,
									}}
									onClick={() => handleAddDaysToAll(1)}
								>
									+1d
								</Button>
								<Button
									size="small"
									variant="outlined"
									sx={{
										py: 0,
										px: 0.5,
										minWidth: 0,
										fontSize: "0.65rem",
										height: 20,
									}}
									onClick={() => handleAddDaysToAll(7)}
								>
									+7d
								</Button>
								<Button
									size="small"
									variant="contained"
									color="secondary"
									sx={{
										py: 0,
										px: 0.5,
										minWidth: 0,
										fontSize: "0.65rem",
										height: 20,
									}}
									onClick={() => handleSyncAllTargets(30)}
								>
									30d Sync
								</Button>
							</Box>
						)}
					</Box>

					{/* --- DATA ROWS --- */}
					<Box sx={{ flex: 1, overflowY: "auto", pr: 0.5 }}>
						<Stack spacing={1}>
							{activeRows.length > 0 ? (
								activeRows.map((row: any) => {
									const isSelected = activeSelected.has(row.ticker);
									const allocated =
										activeCargoPlan.allocatedResults[row.ticker] || 0;

									return (
										<LogisticsRowComponent
											key={row.ticker}
											row={row}
											isSelected={isSelected}
											allocated={allocated}
											cargoPlan={activeCargoPlan}
											materialPriorities={materialPriorities}
											handlePriorityChange={handlePriorityChange}
											handleTargetChange={handleTargetChange}
											toggleMaterial={activeToggleMaterial}
											viewMode={viewMode}
										/>
									);
								})
							) : (
								<Typography
									textAlign="center"
									color="text.secondary"
									variant="body2"
									sx={{ py: 3, display: "block" }}
								>
									{viewMode === "pickup"
										? "No surplus production detected."
										: "No consumption detected."}
								</Typography>
							)}
						</Stack>
					</Box>
				</>
			)}

			{/* XIT Configuration Popover */}
			<XitConfigPopover
				anchorEl={xitAnchorEl}
				onClose={() => setXitAnchorEl(null)}
				siteName={siteName}
				materials={allocatedMaterials}
				cargoPlanFleet={cargoPlan.fleet}
				useMyFleet={useMyFleet}
				fleetMappingConfig={fleetMappingConfig}
				onShowSnackbar={onShowSnackbar}
			/>
		</Box>
	);
};
