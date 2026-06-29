import React from "react";
import {
	Box,
	Typography,
	Paper,
	Checkbox,
	TextField,
	FormControl,
	Select,
	MenuItem,
	useTheme,
	alpha,
	InputAdornment,
	Button,
} from "@mui/material";
import { smartFormat, formatNumber } from "./utils.ts";
import MaterialBadge from "../../../../cosm/components/materialbadge.tsx";

export const LogisticsRowComponent = ({
	row,
	isSelected,
	allocated,
	cargoPlan,
	materialPriorities,
	handlePriorityChange,
	handleTargetChange,
	toggleMaterial,
	viewMode = "dropoff",
}: any) => {
	const theme = useTheme();
	const isTruncated = isSelected && row.missing > 0 && allocated < row.missing;

	const props = cargoPlan.getMatProps(row.ticker);
	const allocW = allocated * props.weight;
	const allocV = allocated * props.volume;

	const currentDays = row.current / row.dailyBurn;
	const newTotalUnits = row.current + allocated;
	const newTotalDays = newTotalUnits / row.dailyBurn;

	let statusColor = "divider";
	let statusBg = "transparent";

	if (isSelected && row.missing > 0) {
		if (allocated >= row.missing) {
			statusColor = "success.main";
			statusBg = alpha(theme.palette.success.main, 0.15);
		} else if (allocated > 0) {
			statusColor = "warning.main";
			statusBg = alpha(theme.palette.warning.main, 0.15);
		} else {
			statusColor = "error.main";
			statusBg = alpha(theme.palette.error.main, 0.15);
		}
	} else if (isSelected) {
		statusColor = "primary.main";
		statusBg = alpha(theme.palette.action.selected, 0.1);
	}

	const handleTopOff = (e: React.MouseEvent) => {
		e.stopPropagation();
		const availW = Math.max(0, cargoPlan.fleetMaxW - cargoPlan.loadedW);
		const availV = Math.max(0, cargoPlan.fleetMaxV - cargoPlan.loadedV);

		if (availW <= 0.001 && availV <= 0.001) return;

		const canFitUnits = Math.floor(
			Math.min(availW / props.weight, availV / props.volume),
		);

		if (canFitUnits > 0) {
			const extraDays = canFitUnits / row.dailyBurn;
			const newTarget = Math.ceil(row.target + extraDays);
			handleTargetChange(row.ticker, String(newTarget));
		}
	};

	const handleAddDays = (days: number, e: React.MouseEvent) => {
		e.stopPropagation();
		const currentTarget = row.target || 0;
		handleTargetChange(row.ticker, String(Math.max(0, currentTarget + days)));
	};

	const handleSync = (days: number, e: React.MouseEvent) => {
		e.stopPropagation();
		handleTargetChange(row.ticker, String(days));
	};

	// Reusable border styles for a cohesive theme glow
	const hintBorderStyle = {
		borderColor: alpha(theme.palette.primary.main, 0.3),
		transition: "border-color 0.2s, background-color 0.2s",
		"&:hover": {
			borderColor: theme.palette.primary.main,
			bgcolor: alpha(theme.palette.primary.main, 0.05),
		},
	};

	return (
		<Paper
			variant="outlined"
			sx={{
				p: 1,
				px: 1.5,
				bgcolor: statusBg,
				borderColor: statusColor,
				borderRadius: 1,
				display: "flex",
				flexDirection: "column",
				gap: 1,
			}}
		>
			<Box
				sx={{
					display: "flex",
					flexWrap: { xs: "wrap", md: "nowrap" },
					alignItems: "center",
					gap: 2,
				}}
			>
				{/* 1. Checkbox, Badge & Current Stock */}
				<Box
					sx={{
						minWidth: 140,
						display: "flex",
						alignItems: "center",
						gap: 1,
					}}
				>
					<Checkbox
						size="small"
						checked={isSelected}
						onChange={() => toggleMaterial(row.ticker)}
						sx={{ p: 0 }}
					/>
					<Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
						<Box
							sx={{
								display: "inline-flex",
								transform: "scale(0.85)",
								transformOrigin: "left center",
								mb: -0.5,
							}}
						>
							<MaterialBadge ticker={row.ticker} />
						</Box>
						<Typography
							variant="caption"
							color="text.secondary"
							sx={{
								fontSize: "0.7rem",
								fontWeight: 600,
								display: "flex",
								gap: 0.5,
							}}
						>
							{viewMode === "pickup" ? (
								<>
									<span>Prod: {formatNumber(row.dailyBurn)}/d</span>
									<span>Stock: {smartFormat(row.current).text}</span>
								</>
							) : (
								<>
									<span>Stock: {formatNumber(currentDays)}d</span>
									<span>({smartFormat(row.current).text})</span>
								</>
							)}
						</Typography>
					</Box>
				</Box>

				{/* 2. Target Days & Quick Actions */}
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						flex: 1,
						minWidth: 160,
					}}
				>
					<Box
						sx={{
							display: "flex",
							flexDirection: "row",
							flexWrap: "wrap",
							alignItems: "center",
							gap: 1,
						}}
					>
						<TextField
							type="text"
							size="small"
							value={row.target === 0 ? "" : row.target}
							onChange={(e) => {
								let val = e.target.value.replace(/\D/g, "");
								if (val === "") val = "0";
								handleTargetChange(row.ticker, val);
							}}
							slotProps={{
								input: {
									inputMode: "numeric",
									endAdornment:
										viewMode === "pickup" ? null : (
											<InputAdornment position="end" sx={{ ml: 0.5 }}>
												<Typography
													variant="body2"
													fontWeight={800}
													color="text.secondary"
												>
													d
												</Typography>
											</InputAdornment>
										),
									sx: {
										fontSize: "0.85rem",
										fontWeight: 800,
										height: 28,
										minWidth: 55,
									},
								},
							}}
							sx={{
								"& input": { textAlign: "center", p: 0 },
								"& .MuiOutlinedInput-root": {
									"& fieldset": {
										borderColor: alpha(theme.palette.primary.main, 0.3),
										transition: "border-color 0.2s",
									},
									"&:hover fieldset": {
										borderColor: theme.palette.primary.main,
									},
									"&.Mui-focused fieldset": {
										borderColor: theme.palette.primary.main,
									},
								},
							}}
						/>

						{viewMode !== "pickup" && (
							<Box
								sx={{
									display: "flex",
									flexWrap: "wrap",
									gap: 0.5,
									flex: 1,
								}}
							>
								<Button
									size="small"
									variant="outlined"
									sx={{
										minWidth: 0,
										px: 0.5,
										py: 0,
										height: 22,
										fontSize: "0.65rem",
										color: "text.secondary",
										...hintBorderStyle, // Spread the hint style here
									}}
									onClick={(e) => handleAddDays(1, e)}
								>
									+1d
								</Button>
								<Button
									size="small"
									variant="outlined"
									sx={{
										minWidth: 0,
										px: 0.5,
										py: 0,
										height: 22,
										fontSize: "0.65rem",
										color: "text.secondary",
										...hintBorderStyle,
									}}
									onClick={(e) => handleAddDays(7, e)}
								>
									+7d
								</Button>
								<Button
									size="small"
									variant="outlined"
									sx={{
										minWidth: 0,
										px: 0.5,
										py: 0,
										height: 22,
										fontSize: "0.65rem",
										color: "text.secondary",
										...hintBorderStyle,
									}}
									onClick={(e) => handleSync(30, e)}
								>
									30d Sync
								</Button>

								{isSelected && (
									<Button
										size="small"
										variant="outlined"
										color="info"
										sx={{
											minWidth: 0,
											px: 0.5,
											py: 0,
											height: 22,
											fontSize: "0.65rem",
											borderColor: alpha(theme.palette.info.main, 0.3),
											transition: "border-color 0.2s, background-color 0.2s",
											"&:hover": {
												borderColor: theme.palette.info.main,
												bgcolor: alpha(theme.palette.info.main, 0.05),
											},
										}}
										onClick={handleTopOff}
									>
										Top Off Space
									</Button>
								)}
							</Box>
						)}
					</Box>
				</Box>

				{/* 3. Loaded / Needed */}
				<Box sx={{ flex: 1, minWidth: 120, textAlign: "right" }}>
					<Typography
						variant="caption"
						display="block"
						color="text.secondary"
						sx={{
							fontSize: "0.65rem",
							mb: 0.25,
							fontWeight: 700,
							textTransform: "uppercase",
						}}
					>
						Loaded / Needed
					</Typography>
					{row.missing > 0 ? (
						<Box
							sx={{
								display: "flex",
								justifyContent: "flex-end",
								alignItems: "baseline",
								gap: 0.5,
							}}
						>
							<Typography
								variant="body2"
								fontWeight={900}
								color={isTruncated ? "error.main" : "text.primary"}
								sx={{ lineHeight: 1.1 }}
							>
								+{smartFormat(allocated).text}
							</Typography>
							<Typography
								variant="caption"
								color="text.secondary"
								sx={{ opacity: 0.7, fontWeight: 700 }}
							>
								/ {smartFormat(row.missing).text}
							</Typography>
						</Box>
					) : (
						<Typography
							variant="body2"
							color="text.secondary"
							fontWeight={900}
							sx={{ lineHeight: 1.1 }}
						>
							OK
						</Typography>
					)}
				</Box>

				{/* 4. Projected Total */}
				<Box
					sx={{
						minWidth: 90,
						textAlign: "right",
						borderLeft: `1px solid ${theme.palette.divider}`,
						pl: 2,
					}}
				>
					<Typography
						variant="caption"
						display="block"
						color="text.secondary"
						sx={{
							fontSize: "0.65rem",
							mb: 0.25,
							fontWeight: 700,
							textTransform: "uppercase",
						}}
					>
						Projected
					</Typography>
					<Typography variant="body2" fontWeight={900} sx={{ lineHeight: 1.1 }}>
						{formatNumber(newTotalDays)}d
					</Typography>
					<Typography
						variant="caption"
						color="text.secondary"
						sx={{ fontSize: "0.7rem", fontWeight: 600 }}
					>
						({smartFormat(newTotalUnits).text})
					</Typography>
				</Box>

				{/* 5. Advanced: Priority */}
				<Box sx={{ minWidth: 90 }}>
					<FormControl size="small" fullWidth>
						<Select
							value={materialPriorities[row.ticker] || 3}
							onChange={(e) =>
								handlePriorityChange(row.ticker, e.target.value as number)
							}
							sx={{
								height: 24,
								fontSize: "0.75rem",
								fontWeight: 700,
								"& .MuiSelect-select": { py: 0, px: 1 },
								"& .MuiOutlinedInput-notchedOutline": {
									borderColor: alpha(theme.palette.primary.main, 0.3),
									transition: "border-color 0.2s",
								},
								"&:hover .MuiOutlinedInput-notchedOutline": {
									borderColor: theme.palette.primary.main,
								},
								"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
									borderColor: theme.palette.primary.main,
								},
							}}
						>
							<MenuItem value={1} sx={{ fontSize: "0.75rem", fontWeight: 700 }}>
								Critical
							</MenuItem>
							<MenuItem value={2} sx={{ fontSize: "0.75rem", fontWeight: 700 }}>
								High
							</MenuItem>
							<MenuItem value={3} sx={{ fontSize: "0.75rem", fontWeight: 700 }}>
								Normal
							</MenuItem>
							<MenuItem value={4} sx={{ fontSize: "0.75rem", fontWeight: 700 }}>
								Low
							</MenuItem>
							<MenuItem value={5} sx={{ fontSize: "0.75rem", fontWeight: 700 }}>
								Filler
							</MenuItem>
						</Select>
					</FormControl>
				</Box>
			</Box>
		</Paper>
	);
};
