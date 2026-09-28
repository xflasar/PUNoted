import React from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Box,
	Typography,
	IconButton,
	ToggleButtonGroup,
	ToggleButton,
	Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { ALL_CATEGORIES } from "../../../production/constants";
import type { FlowDirectionFilter, SourceTypeFilter } from "../types";

interface FilterDialogProps {
	open: boolean;
	onClose: () => void;
	selectedCategories: string[];
	onToggleCategory: (cat: string) => void;
	flowDirectionFilter: FlowDirectionFilter;
	onFlowDirectionChange: (val: FlowDirectionFilter) => void;
	sourceTypeFilter: SourceTypeFilter;
	onSourceTypeChange: (val: SourceTypeFilter) => void;
	hideZeroFlow: boolean;
	onHideZeroFlowChange: (val: boolean) => void;
}

export const CorpFilterDialog: React.FC<FilterDialogProps> = ({
	open,
	onClose,
	selectedCategories,
	onToggleCategory,
	flowDirectionFilter,
	onFlowDirectionChange,
	sourceTypeFilter,
	onSourceTypeChange,
	hideZeroFlow,
	onHideZeroFlowChange,
}) => (
	<Dialog
		open={open}
		onClose={onClose}
		maxWidth="sm"
		fullWidth
		slotProps={{
			paper: {
				sx: {
					bgcolor: "#141424",
					border: "1px solid rgba(123, 104, 238, 0.4)",
					borderRadius: 2.5,
					p: 1,
				},
			},
		}}
	>
		<DialogTitle
			sx={{
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				pb: 1,
			}}
		>
			<Typography
				variant="subtitle1"
				sx={{ fontWeight: 800, color: "#64FFDA", textTransform: "uppercase" }}
			>
				Material & Flow Filters
			</Typography>
			<IconButton
				size="small"
				onClick={onClose}
				sx={{ color: "rgba(255,255,255,0.6)" }}
			>
				<CloseIcon fontSize="small" />
			</IconButton>
		</DialogTitle>

		<DialogContent
			sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
		>
			{/* Source Type Filter */}
			<Box>
				<Typography
					variant="caption"
					sx={{
						color: "rgba(255,255,255,0.6)",
						fontWeight: 700,
						mb: 0.75,
						display: "block",
					}}
				>
					SOURCE TYPE
				</Typography>
				<ToggleButtonGroup
					size="small"
					value={sourceTypeFilter}
					exclusive
					onChange={(_, v) => v && onSourceTypeChange(v)}
					fullWidth
					sx={{
						bgcolor: "rgba(255,255,255,0.03)",
						border: "1px solid rgba(255,255,255,0.1)",
						borderRadius: 1.5,
						"& .MuiToggleButton-root": {
							color: "rgba(255,255,255,0.6)",
							fontSize: "0.72rem",
							fontWeight: 700,
							"&.Mui-selected": {
								color: "#4FC3F7",
								bgcolor: "rgba(79, 195, 247, 0.15)",
							},
						},
					}}
				>
					<ToggleButton value="ALL">ALL SOURCES</ToggleButton>
					<ToggleButton value="PRODUCTION">PRODUCTION ONLY</ToggleButton>
					<ToggleButton value="WORKFORCE">WORKFORCE CONSUMABLES</ToggleButton>
				</ToggleButtonGroup>
			</Box>

			{/* Flow Direction Filter */}
			<Box>
				<Typography
					variant="caption"
					sx={{
						color: "rgba(255,255,255,0.6)",
						fontWeight: 700,
						mb: 0.75,
						display: "block",
					}}
				>
					FLOW DIRECTION
				</Typography>
				<ToggleButtonGroup
					size="small"
					value={flowDirectionFilter}
					exclusive
					onChange={(_, v) => v && onFlowDirectionChange(v)}
					fullWidth
					sx={{
						bgcolor: "rgba(255,255,255,0.03)",
						border: "1px solid rgba(255,255,255,0.1)",
						borderRadius: 1.5,
						"& .MuiToggleButton-root": {
							color: "rgba(255,255,255,0.6)",
							fontSize: "0.72rem",
							fontWeight: 700,
							"&.Mui-selected": {
								color: "#64FFDA",
								bgcolor: "rgba(100, 255, 218, 0.15)",
							},
						},
					}}
				>
					<ToggleButton value="ALL">ALL FLOWS</ToggleButton>
					<ToggleButton value="PROD_ONLY">PROD ONLY</ToggleButton>
					<ToggleButton value="CONS_ONLY">CONS ONLY</ToggleButton>
				</ToggleButtonGroup>
			</Box>

			{/* Hide Zero Flow */}
			<Box>
				<ToggleButton
					size="small"
					value="hideZero"
					selected={hideZeroFlow}
					onChange={() => onHideZeroFlowChange(!hideZeroFlow)}
					fullWidth
					sx={{
						height: 34,
						fontSize: "0.75rem",
						fontWeight: 700,
						color: hideZeroFlow ? "#FFB74D" : "rgba(255,255,255,0.5)",
						bgcolor: hideZeroFlow
							? "rgba(255, 183, 77, 0.15)"
							: "rgba(255, 255, 255, 0.03)",
						border: "1px solid rgba(255, 183, 77, 0.3) !important",
						borderRadius: 1.5,
					}}
				>
					{hideZeroFlow ? "HIDE 0-FLOW (ACTIVE)" : "SHOW ALL 0-FLOW MATERIALS"}
				</ToggleButton>
			</Box>

			{/* Category Selector */}
			<Box>
				<Typography
					variant="caption"
					sx={{
						color: "rgba(255,255,255,0.6)",
						fontWeight: 700,
						mb: 0.75,
						display: "block",
					}}
				>
					MATERIAL CATEGORIES
				</Typography>
				<Box
					sx={{
						display: "flex",
						flexWrap: "wrap",
						gap: 0.75,
						maxHeight: 180,
						overflowY: "auto",
					}}
				>
					<ToggleButton
						value="ALL"
						selected={selectedCategories.includes("ALL")}
						onClick={() => onToggleCategory("ALL")}
						size="small"
						sx={{
							py: 0.25,
							px: 1.25,
							fontSize: "0.68rem",
							fontWeight: 700,
							borderRadius: 1,
							border: "1px solid rgba(255,255,255,0.15)",
							"&.Mui-selected": {
								bgcolor: "rgba(100, 255, 218, 0.2)",
								color: "#64FFDA",
								borderColor: "#64FFDA",
							},
						}}
					>
						ALL CATEGORIES
					</ToggleButton>
					{ALL_CATEGORIES.map((cat) => (
						<ToggleButton
							key={cat}
							value={cat}
							selected={selectedCategories.includes(cat)}
							onClick={() => onToggleCategory(cat)}
							size="small"
							sx={{
								py: 0.25,
								px: 1.25,
								fontSize: "0.68rem",
								fontWeight: 700,
								borderRadius: 1,
								border: "1px solid rgba(255,255,255,0.12)",
								color: "rgba(255,255,255,0.7)",
								"&.Mui-selected": {
									bgcolor: "rgba(165, 148, 255, 0.2)",
									color: "#A594FF",
									borderColor: "#A594FF",
								},
							}}
						>
							{cat}
						</ToggleButton>
					))}
				</Box>
			</Box>
		</DialogContent>

		<DialogActions sx={{ px: 3, pb: 2 }}>
			<Button
				onClick={onClose}
				variant="contained"
				size="small"
				sx={{ bgcolor: "#64FFDA", color: "#000", fontWeight: 800 }}
			>
				Apply Filters
			</Button>
		</DialogActions>
	</Dialog>
);
