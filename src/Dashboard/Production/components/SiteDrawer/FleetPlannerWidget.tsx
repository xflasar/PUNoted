import React, { useState } from "react";
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
} from "@mui/material";
import { Calculator, ChevronUp, ChevronDown, Settings2 } from "lucide-react";
import { CARGO_BAYS } from "./utils";
import { ShipBreakdown } from "./ShipBreakdown";

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
}: any) => {
	const theme = useTheme();

	const [fleetExpanded, setFleetExpanded] = useState(false);

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
				p: 1.5,
				mb: 2,
				borderColor: "secondary.main",
				borderRadius: 1,
				display: "flex",
				flexDirection: "column",
				maxHeight: fleetExpanded ? "45vh" : "auto",
				transition: "max-height 0.3s ease",
			}}
		>
			<Box
				sx={{
					display: "flex",
					flexDirection: "row",
					gap: 1.5,
					borderBottom: `1px dashed ${alpha(theme.palette.divider, 0.5)}`,
					pb: 1.5,
					flexShrink: 0,
					justifyContent: "space-between",
				}}
			>
				{/* Top Header & Main Actions */}
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
							MenuProps={{
								slotProps: {
									paper: {
										sx: {
											background: theme.palette.background.default,
											backgroundImage: "none",
											color: theme.palette.text.primary,
										},
									},
								},
							}}
							value={shipOverride}
							onChange={(e) => setShipOverride(e.target.value as string)}
							sx={{
								height: 28,
								fontSize: "0.75rem",
								fontWeight: 700,
								background: theme.palette.background.default,
								"& .MuiSelect-select": { py: 0, px: 1.5 },
							}}
						>
							<MenuItem value="auto" sx={{ fontSize: "0.8rem" }}>
								Auto Fleet
							</MenuItem>
							{CARGO_BAYS.map((s) => (
								<MenuItem key={s.id} value={s.id} sx={{ fontSize: "0.8rem" }}>
									Force {s.id}
								</MenuItem>
							))}
						</Select>
					</FormControl>

					<FormControl size="small">
						<Select
							MenuProps={{
								slotProps: {
									paper: {
										sx: {
											background: theme.palette.background.default,
											backgroundImage: "none",
											color: theme.palette.text.primary,
										},
									},
								},
							}}
							value={String(maxShips || 0)}
							onChange={(e) => handleMaxShipsChange(e.target.value)}
							sx={{
								height: 28,
								fontSize: "0.75rem",
								fontWeight: 700,
								background: theme.palette.background.default,
								"& .MuiSelect-select": { py: 0, px: 1.5 },
							}}
						>
							<MenuItem value="0" sx={{ fontSize: "0.8rem", fontWeight: 600 }}>
								Max Ships: {shipOverride === "auto" ? "Auto" : "1"}
							</MenuItem>
							{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
								<MenuItem
									key={num}
									value={String(num)}
									sx={{ fontSize: "0.8rem", fontWeight: 600 }}
								>
									Max Ships: {num}
								</MenuItem>
							))}
						</Select>
					</FormControl>

					<FormControl size="small">
						<Select
							MenuProps={{
								slotProps: {
									paper: {
										sx: {
											background: theme.palette.background.default,
											backgroundImage: "none",
											color: theme.palette.text.primary,
										},
									},
								},
							}}
							value={allocationStrategy}
							onChange={(e) => handleStrategyChange(e.target.value as any)}
							sx={{
								height: 28,
								fontSize: "0.75rem",
								fontWeight: 700,
								bgcolor: theme.palette.background.paper,
								"& .MuiSelect-select": { py: 0, px: 1.5 },
							}}
						>
							<MenuItem
								value="together"
								sx={{ fontSize: "0.8rem", fontWeight: 600 }}
							>
								Keep Together
							</MenuItem>
							<MenuItem
								value="balance"
								sx={{ fontSize: "0.8rem", fontWeight: 600 }}
							>
								Balance Load
							</MenuItem>
							<MenuItem
								value="categorized"
								sx={{ fontSize: "0.8rem", fontWeight: 600 }}
							>
								Group by Category
							</MenuItem>
						</Select>
					</FormControl>

					{shipOverride === "auto" && (
						<FormControl size="small">
							<Select
								MenuProps={{
									slotProps: {
										paper: {
											sx: {
												background: theme.palette.background.default,
												backgroundImage: "none",
												color: theme.palette.text.primary,
											},
										},
									},
								}}
								multiple
								displayEmpty
								value={allowedShipTypes}
								onChange={(e) =>
									handleAllowedShipsChange(e.target.value as string[])
								}
								renderValue={(selected) =>
									(selected as string[]).length === CARGO_BAYS.length
										? "All Ships"
										: `${(selected as string[]).length} Allowed`
								}
								sx={{
									height: 28,
									fontSize: "0.75rem",
									fontWeight: 600,
									bgcolor: theme.palette.background.paper,
									"& .MuiSelect-select": { py: 0, px: 1.5 },
								}}
							>
								{CARGO_BAYS.map((s) => (
									<MenuItem
										key={s.id}
										value={s.id}
										sx={{ minHeight: "auto", p: 0.5 }}
									>
										<Checkbox
											size="small"
											checked={allowedShipTypes.includes(s.id)}
											sx={{ p: 0.5 }}
										/>
										<Typography variant="body2">{s.id}</Typography>
									</MenuItem>
								))}
							</Select>
						</FormControl>
					)}
				</Box>

				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
						<Button
							variant={useMyFleet ? "contained" : "outlined"}
							size="small"
							color={useMyFleet ? "primary" : "inherit"}
							onClick={() => setUseMyFleet(!useMyFleet)}
							sx={{
								height: 28,
								px: 1.5,
								py: 0,
								fontSize: "0.75rem",
								fontWeight: 700,
								borderColor: useMyFleet
									? "transparent"
									: alpha(theme.palette.text.primary, 0.2),
							}}
						>
							Map to Fleet
						</Button>
						<Button
							variant={assumeOptimal ? "contained" : "outlined"}
							size="small"
							color={assumeOptimal ? "success" : "inherit"}
							onClick={toggleAssumeOptimal}
							sx={{
								height: 28,
								px: 1.5,
								py: 0,
								fontSize: "0.75rem",
								fontWeight: 700,
								borderColor: assumeOptimal
									? "transparent"
									: alpha(theme.palette.text.primary, 0.2),
							}}
						>
							100% Opt.
						</Button>
						<Button
							variant="contained"
							size="small"
							color="info"
							startIcon={<Settings2 size={14} />}
							onClick={handleCopyLogistics}
							disabled={selectedMaterials.size === 0}
							sx={{
								height: 28,
								px: 1.5,
								py: 0,
								fontSize: "0.75rem",
								fontWeight: 700,
							}}
						>
							XIT Config
						</Button>

						{cargoPlan.fleet.length > 0 && (
							<IconButton
								onClick={() => setFleetExpanded(!fleetExpanded)}
								size="small"
								sx={{ ml: 0.5, color: "text.secondary" }}
							>
								{fleetExpanded ? (
									<ChevronUp size={18} />
								) : (
									<ChevronDown size={18} />
								)}
							</IconButton>
						)}
					</Box>
				</Box>
			</Box>

			{/* Progress bars (always visible) */}
			{(cargoPlan.idealW > 0 || cargoPlan.idealV > 0) && (
				<Box
					sx={{
						mt: 1,
						display: "flex",
						flexDirection: "row",
						gap: 10.5,
						flexShrink: 0,
					}}
				>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							width: "100%",
							gap: 1,
						}}
					>
						<Box
							sx={{
								flex: 1,
								height: 6,
								bgcolor: alpha(theme.palette.error.main, 0.6),
								borderRadius: 1,
								position: "relative",
								overflow: "hidden",
							}}
						>
							<Box
								sx={{
									position: "absolute",
									top: 0,
									left: 0,
									height: "100%",
									width: `${pctW}%`,
									bgcolor: "tertiary.main",
									transition: "width 0.3s",
								}}
							/>
						</Box>
						<Typography
							variant="caption"
							sx={{ minWidth: 80, textAlign: "right", fontWeight: 800 }}
						>
							{cargoPlan.loadedW.toFixed(0)} / {cargoPlan.idealW.toFixed(0)} t
						</Typography>
					</Box>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 1,
							width: "100%",
						}}
					>
						<Box
							sx={{
								flex: 1,
								height: 6,
								bgcolor: alpha(theme.palette.error.main, 0.6),
								borderRadius: 1,
								position: "relative",
								overflow: "hidden",
							}}
						>
							<Box
								sx={{
									position: "absolute",
									top: 0,
									left: 0,
									height: "100%",
									width: `${pctV}%`,
									bgcolor: "tertiary.main",
									transition: "width 0.3s",
								}}
							/>
						</Box>
						<Typography
							variant="caption"
							sx={{ minWidth: 80, textAlign: "right", fontWeight: 800 }}
						>
							{cargoPlan.loadedV.toFixed(0)} / {cargoPlan.idealV.toFixed(0)} m³
						</Typography>
					</Box>
				</Box>
			)}

			<Collapse in={fleetExpanded} unmountOnExit>
				{cargoPlan.fleet.length > 0 && (
					<Box
						sx={{
							mt: 0.5,
							overflowY: "auto",
							maxHeight: "30vh",
							pr: 1,
							"&::-webkit-scrollbar": { width: "6px" },
							"&::-webkit-scrollbar-thumb": {
								backgroundColor: alpha(theme.palette.text.secondary, 0.2),
								borderRadius: "3px",
							},
							"&::-webkit-scrollbar-thumb:hover": {
								backgroundColor: alpha(theme.palette.text.secondary, 0.4),
							},
						}}
					>
						{cargoPlan.fleet.map((ship: any, idx: number) => {
							const isManual = shipOverride !== "auto";
							const unmetW = isManual
								? Math.max(0, cargoPlan.idealW - cargoPlan.loadedW)
								: 0;
							const unmetV = isManual
								? Math.max(0, cargoPlan.idealV - cargoPlan.loadedV)
								: 0;

							return (
								<ShipBreakdown
									key={ship.fleetId}
									ship={ship}
									index={idx}
									unmetW={unmetW}
									unmetV={unmetV}
									useMyFleet={useMyFleet}
									animatedShipData={animatedShipData}
									fleetMappingConfig={fleetMappingConfig}
									setFleetMappingConfig={setFleetMappingConfig}
								/>
							);
						})}
					</Box>
				)}
			</Collapse>
		</Paper>
	);
};
