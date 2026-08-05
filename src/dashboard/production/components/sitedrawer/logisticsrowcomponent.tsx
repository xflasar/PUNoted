import React from "react";
import {
	Box,
	Typography,
	Paper,
	Checkbox,
	TextField,
	Select,
	MenuItem,
	InputAdornment,
	useTheme,
	alpha,
	Tooltip,
} from "@mui/material";
import { smartFormat, formatNumber } from "./utils.ts";
import MaterialBadge from "../../../../cosm/components/materialbadge.tsx";

const GRID_COLUMNS = "120px 100px 75px 65px 120px 1fr";

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

	const props = cargoPlan.getMatProps(row.ticker);
	const allocW = allocated * props.weight;
	const allocV = allocated * props.volume;

	const currentDays = row.current / (row.dailyBurn || 1);

	let statusColor = "rgba(123, 104, 238, 0.2)";
	let statusBg = "rgba(16, 16, 32, 0.4)";

	if (isSelected && row.missing > 0) {
		if (allocated >= row.missing) {
			statusColor = theme.palette.success.main;
			statusBg = alpha(theme.palette.success.main, 0.1);
		} else if (allocated > 0) {
			statusColor = theme.palette.warning.main;
			statusBg = alpha(theme.palette.warning.main, 0.1);
		} else {
			statusColor = theme.palette.error.main;
			statusBg = alpha(theme.palette.error.main, 0.1);
		}
	} else if (isSelected) {
		statusColor = theme.palette.primary.main;
		statusBg = alpha(theme.palette.primary.main, 0.08);
	}

	return (
		<Paper
			variant="outlined"
			sx={{
				p: 0.6,
				px: 1,
				bgcolor: statusBg,
				borderColor: statusColor,
				borderRadius: "8px",
				display: "grid",
				gridTemplateColumns: GRID_COLUMNS,
				alignItems: "center",
				gap: 1,
				mb: 0.5,
				transition: "all 0.15s ease",
			}}
		>
			{/* 1. Checkbox & Material Badge */}
			<Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
				<Checkbox
					size="small"
					checked={isSelected}
					onChange={() => toggleMaterial(row.ticker)}
					sx={{ p: 0 }}
				/>
				<MaterialBadge ticker={row.ticker} />
				<Typography
					variant="body2"
					sx={{ fontWeight: 800, color: "white", fontSize: "0.78rem" }}
				>
					{row.ticker}
				</Typography>
			</Box>

			{/* 2. Stock / Current Days Info */}
			<Box
				sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}
			>
				<Typography
					variant="caption"
					sx={{
						fontSize: "0.72rem",
						fontWeight: 800,
						color:
							currentDays < 5
								? "#ff5252"
								: currentDays < 15
									? "#ffd700"
									: "#69f0ae",
					}}
				>
					{currentDays > 999 ? "∞" : `${currentDays.toFixed(1)}d`}
				</Typography>
				<Typography
					variant="caption"
					sx={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.5)" }}
				>
					({smartFormat(row.current).text} u)
				</Typography>
			</Box>

			{/* 3. Target Days Input */}
			<Box sx={{ display: "flex", justifyContent: "center" }}>
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
							endAdornment: (
								<InputAdornment position="end" sx={{ mr: 0 }}>
									<Typography
										variant="caption"
										fontSize="0.6rem"
										color="text.secondary"
									>
										d
									</Typography>
								</InputAdornment>
							),
							sx: {
								fontSize: "0.75rem",
								fontWeight: 800,
								height: 24,
								px: 0.5,
								bgcolor: "rgba(0,0,0,0.4)",
								color: "white",
								textAlign: "center",
							},
						},
					}}
					sx={{ width: 56 }}
				/>
			</Box>

			{/* 4. Priority Dropdown */}
			<Box sx={{ display: "flex", justifyContent: "center" }}>
				<Select
					size="small"
					value={materialPriorities?.[row.ticker] || 1}
					onChange={(e) =>
						handlePriorityChange(row.ticker, Number(e.target.value))
					}
					sx={{
						height: 24,
						width: 52,
						fontSize: "0.7rem",
						fontWeight: 800,
						bgcolor: "rgba(0,0,0,0.4)",
						color: "#ffd700",
						"& .MuiSelect-select": { py: 0, px: 0.5, textAlign: "center" },
					}}
				>
					{[1, 2, 3, 4, 5].map((p) => (
						<MenuItem key={p} value={p} sx={{ fontSize: "0.75rem" }}>
							P{p}
						</MenuItem>
					))}
				</Select>
			</Box>

			{/* 5. Allocated Supply QTY */}
			<Box
				sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}
			>
				<Typography
					variant="caption"
					sx={{
						fontWeight: 800,
						color: allocated > 0 ? "#69f0ae" : "rgba(255,255,255,0.4)",
						fontSize: "0.75rem",
					}}
				>
					{allocated > 0 ? `+${allocated.toLocaleString()} u` : "0 u"}
				</Typography>
			</Box>

			{/* 6. Mass / Volume Specs */}
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					alignItems: "flex-end",
				}}
			>
				{allocated > 0 ? (
					<Tooltip
						title={`Weight: ${allocW.toFixed(1)}t | Volume: ${allocV.toFixed(1)}m³`}
					>
						<Typography
							variant="caption"
							sx={{
								fontSize: "0.68rem",
								color: "rgba(255,255,255,0.7)",
								fontWeight: 700,
							}}
						>
							{allocW.toFixed(0)}t / {allocV.toFixed(0)}m³
						</Typography>
					</Tooltip>
				) : (
					<Typography
						variant="caption"
						sx={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.3)" }}
					>
						0t / 0m³
					</Typography>
				)}
			</Box>
		</Paper>
	);
};
