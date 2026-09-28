import React from "react";
import {
	Box,
	Paper,
	TextField,
	InputAdornment,
	IconButton,
	ToggleButtonGroup,
	ToggleButton,
	Select,
	MenuItem,
	Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";
import FilterListIcon from "@mui/icons-material/FilterList";
import SettingsIcon from "@mui/icons-material/Settings";
import CategoryIcon from "@mui/icons-material/Category";
import type { ShareBasis } from "../types";

interface ToolbarProps {
	inputValue: string;
	onInputChange: (val: string) => void;
	exactMatch: boolean;
	onExactMatchToggle: () => void;
	filterOpen: boolean;
	onFilterToggle: () => void;
	activePricingMode: "CX" | "CORP";
	onPricingModeChange?: (mode: "CX" | "CORP") => void;
	selectedExchange: string;
	onSelectedExchangeChange?: (ex: string) => void;
	shareBasis: ShareBasis;
	onShareBasisChange: (basis: ShareBasis) => void;
	groupByCategory: boolean;
	onGroupByCategoryToggle: () => void;
	multiRecipeCount: number;
	onSettingsOpen: () => void;
}

export const CorpSummaryToolbar: React.FC<ToolbarProps> = ({
	inputValue,
	onInputChange,
	exactMatch,
	onExactMatchToggle,
	filterOpen,
	onFilterToggle,
	activePricingMode,
	onPricingModeChange,
	selectedExchange,
	onSelectedExchangeChange,
	shareBasis,
	onShareBasisChange,
	groupByCategory,
	onGroupByCategoryToggle,
	multiRecipeCount,
	onSettingsOpen,
}) => (
	<Paper
		elevation={0}
		sx={{
			p: 1,
			bgcolor: "rgba(10, 10, 20, 0.65)",
			borderRadius: 2,
			border: "1px solid rgba(255, 255, 255, 0.06)",
			display: "flex",
			alignItems: "center",
			justifyContent: "space-between",
			flexWrap: "wrap",
			gap: 1,
		}}
	>
		{/* Search Input Bar */}
		<Box
			sx={{
				display: "flex",
				alignItems: "center",
				gap: 1,
				flex: 1,
				minWidth: 260,
			}}
		>
			<TextField
				size="small"
				placeholder="Search material ticker or name..."
				value={inputValue}
				onChange={(e) => onInputChange(e.target.value)}
				slotProps={{
					input: {
						startAdornment: (
							<InputAdornment position="start">
								<SearchIcon
									sx={{ color: "rgba(255,255,255,0.4)", fontSize: 18 }}
								/>
							</InputAdornment>
						),
						endAdornment: (
							<InputAdornment position="end">
								<Tooltip
									title={
										exactMatch
											? "Exact Ticker Match Active"
											: "Toggle Exact Ticker Match"
									}
									arrow
								>
									<IconButton
										size="small"
										onClick={onExactMatchToggle}
										sx={{
											color: exactMatch ? "#64FFDA" : "rgba(255,255,255,0.3)",
											bgcolor: exactMatch
												? "rgba(100,255,218,0.1)"
												: "transparent",
										}}
									>
										<CenterFocusStrongIcon sx={{ fontSize: 16 }} />
									</IconButton>
								</Tooltip>
							</InputAdornment>
						),
					},
				}}
				sx={{
					flex: 1,
					"& .MuiOutlinedInput-root": {
						bgcolor: "rgba(13, 13, 25, 0.6)",
						color: "#FFF",
						borderRadius: 1.5,
						fontSize: "0.82rem",
						"& fieldset": { borderColor: "rgba(255,255,255,0.08)" },
						"&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
						"&.Mui-focused fieldset": { borderColor: "#64FFDA" },
					},
				}}
			/>

			{/* Filters Trigger */}
			<Tooltip title="Filter Options & Categories" arrow>
				<IconButton
					onClick={onFilterToggle}
					sx={{
						bgcolor: filterOpen
							? "rgba(100,255,218,0.12)"
							: "rgba(13, 13, 25, 0.6)",
						color: filterOpen ? "#64FFDA" : "rgba(255,255,255,0.7)",
						border: "1px solid rgba(255,255,255,0.08)",
						borderRadius: 1.5,
						height: 36,
						width: 36,
					}}
				>
					<FilterListIcon sx={{ fontSize: 18 }} />
				</IconButton>
			</Tooltip>

			{/* Group by Category Toggle */}
			<Tooltip
				title={
					groupByCategory ? "Grouped by Category" : "Group Rows by Category"
				}
				arrow
			>
				<IconButton
					onClick={onGroupByCategoryToggle}
					sx={{
						bgcolor: groupByCategory
							? "rgba(100,255,218,0.12)"
							: "rgba(13, 13, 25, 0.6)",
						color: groupByCategory ? "#64FFDA" : "rgba(255,255,255,0.7)",
						border: "1px solid rgba(255,255,255,0.08)",
						borderRadius: 1.5,
						height: 36,
						width: 36,
					}}
				>
					<CategoryIcon sx={{ fontSize: 18 }} />
				</IconButton>
			</Tooltip>
		</Box>

		{/* Controls Bar: Pricing Mode, Exchange, Share Basis & Recipe Settings */}
		<Box
			sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}
		>
			{/* Pricing Mode Toggle: CX / CORP */}
			<ToggleButtonGroup
				size="small"
				value={activePricingMode}
				exclusive
				onChange={(_, val) => val && onPricingModeChange?.(val)}
				sx={{
					bgcolor: "rgba(13, 13, 25, 0.6)",
					border: "1px solid rgba(255,255,255,0.08)",
					borderRadius: 1.5,
					height: 36,
					"& .MuiToggleButton-root": {
						color: "rgba(255,255,255,0.6)",
						fontWeight: 600,
						fontSize: "0.72rem",
						px: 1.25,
						border: "none",
						"&.Mui-selected": {
							color: "#64FFDA",
							bgcolor: "rgba(100,255,218,0.12)",
						},
					},
				}}
			>
				<ToggleButton value="CX">CX PRICE</ToggleButton>
				<ToggleButton value="CORP">CORP PRICE</ToggleButton>
			</ToggleButtonGroup>

			{/* Exchange Selector (Only when CX mode active) */}
			{activePricingMode === "CX" && (
				<Select
					size="small"
					value={selectedExchange}
					onChange={(e) => onSelectedExchangeChange?.(e.target.value)}
					sx={{
						height: 36,
						bgcolor: "rgba(13, 13, 25, 0.6)",
						color: "#FFF",
						fontSize: "0.74rem",
						fontWeight: 600,
						borderRadius: 1.5,
						"& .MuiOutlinedInput-notchedOutline": {
							borderColor: "rgba(255,255,255,0.08)",
						},
						"&:hover .MuiOutlinedInput-notchedOutline": {
							borderColor: "rgba(255,255,255,0.2)",
						},
						"& .MuiSelect-select": { py: 0.5, px: 1.25 },
					}}
				>
					<MenuItem value="IC1">IC1 (ICA)</MenuItem>
					<MenuItem value="NC1">NC1 (NCC)</MenuItem>
					<MenuItem value="AI1">AI1 (AIC)</MenuItem>
					<MenuItem value="CI1">CI1 (CIS)</MenuItem>
					<MenuItem value="CI2">CI2 (CIS)</MenuItem>
				</Select>
			)}

			{/* Share Basis Selector */}
			<Box sx={{ display: "flex", alignItems: "center" }}>
				<Select
					size="small"
					value={shareBasis}
					onChange={(e) => onShareBasisChange(e.target.value as ShareBasis)}
					sx={{
						height: 36,
						bgcolor: "rgba(13, 13, 25, 0.6)",
						color: "rgba(255,255,255,0.85)",
						fontSize: "0.74rem",
						fontWeight: 600,
						borderRadius: 1.5,
						"& .MuiOutlinedInput-notchedOutline": {
							borderColor: "rgba(255,255,255,0.08)",
						},
						"&:hover .MuiOutlinedInput-notchedOutline": {
							borderColor: "rgba(255,255,255,0.2)",
						},
						"& .MuiSelect-select": { py: 0.5, px: 1.25 },
					}}
				>
					<MenuItem value="PROD">Share % by PROD</MenuItem>
					<MenuItem value="CONS">Share % by CONS</MenuItem>
					<MenuItem value="STOCK">Share % by STOCK</MenuItem>
					<MenuItem value="REVENUE">Share % by REVENUE</MenuItem>
					<MenuItem value="EXPENSE">Share % by EXPENSE</MenuItem>
				</Select>
			</Box>

			{/* Recipe Variant Settings Button */}
			<Tooltip title="Configure Multi-Recipe Overrides" arrow>
				<IconButton
					onClick={onSettingsOpen}
					sx={{
						bgcolor: "rgba(13, 13, 25, 0.6)",
						color: "rgba(255,255,255,0.7)",
						border: "1px solid rgba(255,255,255,0.08)",
						borderRadius: 1.5,
						height: 36,
						width: 36,
						"&:hover": {
							color: "#64FFDA",
							borderColor: "rgba(100,255,218,0.3)",
						},
					}}
				>
					<SettingsIcon sx={{ fontSize: 18 }} />
				</IconButton>
			</Tooltip>
		</Box>
	</Paper>
);
