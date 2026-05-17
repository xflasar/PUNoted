import React, { useState, useMemo } from "react";
import { Box, Typography, Stack, Button, useTheme, alpha } from "@mui/material";
import { CheckSquare, Square } from "lucide-react";
import { FleetPlannerWidget } from "./FleetPlannerWidget";
import { LogisticsRowComponent } from "./LogisticsRowComponent";
import { XitConfigPopover } from "../../../../components/common/XitConfigPopover";
import { useGlobalData } from "../../../../context/GlobalDataContext";

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
	onShowSnackbar,
}) => {
	const theme = useTheme();
	const { animatedShipData } = useGlobalData();

	// --- XIT CONFIGURATION STATE ---
	const [xitAnchorEl, setXitAnchorEl] = useState<HTMLElement | null>(null);
	const [useMyFleet, setUseMyFleet] = useState(false);
	const [fleetMappingConfig, setFleetMappingConfig] = useState<
		Record<string, string>
	>({});

	const handleOpenXitSettings = (event: React.MouseEvent<HTMLElement>) => {
		if (Object.keys(cargoPlan.allocatedResults).length === 0) {
			onShowSnackbar("No materials allocated.");
			return;
		}
		setXitAnchorEl(event.currentTarget);
	};

	const allocatedMaterials = useMemo(() => {
		const materials: Record<string, number> = {};
		Object.entries(cargoPlan.allocatedResults).forEach(([ticker, amt]) => {
			if ((amt as number) > 0) materials[ticker] = Math.ceil(amt as number);
		});
		return materials;
	}, [cargoPlan.allocatedResults]);

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				height: "100%",
				overflow: "hidden",
			}}
		>
			<FleetPlannerWidget
				cargoPlan={cargoPlan}
				allocationStrategy={allocationStrategy}
				allowedShipTypes={allowedShipTypes}
				shipOverride={shipOverride}
				selectedMaterials={selectedMaterials}
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
						selectedMaterials.size === logisticsRows.length ? (
							<CheckSquare size={16} />
						) : (
							<Square size={16} />
						)
					}
					onClick={toggleAllLogistics}
					sx={{
						color: "text.secondary",
						p: 0,
						fontSize: "0.75rem",
						minWidth: "auto",
					}}
				>
					{selectedMaterials.size === logisticsRows.length ? "None" : "All"}
				</Button>

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
								backgroundColor: alpha(theme.palette.background.default, 0.5),
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
					<Box sx={{ width: "1px", height: "12px", bgcolor: "divider" }} />
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
			</Box>

			{/* --- DATA ROWS --- */}
			<Box sx={{ flex: 1, overflowY: "auto", pr: 0.5 }}>
				<Stack spacing={1}>
					{logisticsRows.length > 0 ? (
						logisticsRows.map((row: any) => {
							const isSelected = selectedMaterials.has(row.ticker);
							const allocated = cargoPlan.allocatedResults[row.ticker] || 0;

							return (
								<LogisticsRowComponent
									key={row.ticker}
									row={row}
									isSelected={isSelected}
									allocated={allocated}
									cargoPlan={cargoPlan}
									materialPriorities={materialPriorities}
									handlePriorityChange={handlePriorityChange}
									handleTargetChange={handleTargetChange}
									toggleMaterial={toggleMaterial}
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
							No consumption detected.
						</Typography>
					)}
				</Stack>
			</Box>

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
