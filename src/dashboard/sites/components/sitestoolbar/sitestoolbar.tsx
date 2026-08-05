import React from "react";
import {
	Box,
	Typography,
	TextField,
	InputAdornment,
	useTheme,
	Button,
	ToggleButtonGroup,
	ToggleButton,
	Autocomplete,
	Tooltip,
} from "@mui/material";
import {
	Search,
	ChevronDown,
	ChevronUp,
	Globe,
	Layers,
	Users,
} from "lucide-react";
import type { SitesToolbarProps } from "./types";

export const SitesToolbar: React.FC<SitesToolbarProps> = ({
	summaryOpen,
	setSummaryOpen,
	filteredSitesCount,
	totalLinesCount,
	groupLoanedMode = "owned",
	setGroupLoanedMode,
	leaseFilter,
	setLeaseFilter,
	availableTenants,
	selectedTenants,
	setSelectedTenants,
	searchTerm,
	setSearchTerm,
}) => {
	const theme = useTheme();

	return (
		<Box
			sx={{
				width: "100%",
				px: { xs: 1.5, sm: 2.5 },
				py: 0.75,
				bgcolor: "rgba(16, 16, 32, 0.6)",
				backdropFilter: "blur(15px)",
				borderBottom: "1px solid rgba(123, 104, 238, 0.2)",
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				gap: 1.5,
				flexWrap: "wrap",
			}}
		>
			{/* CLUSTER 1: Summary Toggle & Sites/Lines Count */}
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					gap: 1.25,
					flexWrap: "nowrap",
				}}
			>
				<Button
					onClick={() => setSummaryOpen(!summaryOpen)}
					variant={summaryOpen ? "contained" : "outlined"}
					color="primary"
					startIcon={<Globe size={15} />}
					endIcon={
						summaryOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />
					}
					size="small"
					sx={{
						fontWeight: 800,
						fontSize: "0.75rem",
						borderRadius: "8px",
						textTransform: "none",
						px: 1.5,
						py: 0.4,
						whiteSpace: "nowrap",
					}}
				>
					SUMMARY
				</Button>

				<Typography
					variant="body2"
					sx={{
						color: "rgba(255, 255, 255, 0.75)",
						whiteSpace: "nowrap",
						fontSize: "0.78rem",
						fontWeight: 700,
					}}
				>
					{filteredSitesCount} Sites &nbsp;•&nbsp; {totalLinesCount} Lines
				</Typography>
			</Box>

			{/* CLUSTER 2: Site Grouping & Lease Type Toggles */}
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					gap: 1,
					flexWrap: "wrap",
				}}
			>
				{/* Loaned Grouping Customization Toggle */}
				{setGroupLoanedMode && (
					<Tooltip title="Group loaned sites together under Owned Sites or separate by Partner Username">
						<ToggleButtonGroup
							size="small"
							value={groupLoanedMode}
							exclusive
							onChange={(_, newVal) => {
								if (newVal) setGroupLoanedMode(newVal);
							}}
							sx={{
								height: 32,
								bgcolor: "rgba(0, 0, 0, 0.4)",
								border: "1px solid rgba(123, 104, 238, 0.2)",
								borderRadius: "8px",
								"& .MuiToggleButton-root": {
									color: "rgba(255, 255, 255, 0.6)",
									fontSize: "0.7rem",
									fontWeight: 700,
									px: 1,
									py: 0,
									border: "none",
									textTransform: "none",
									"&.Mui-selected": {
										color: "white",
										bgcolor: "#7B68EE",
									},
								},
							}}
						>
							<ToggleButton value="owned">
								<Layers size={13} style={{ marginRight: 4 }} /> Owned
							</ToggleButton>
							<ToggleButton value="user">
								<Users size={13} style={{ marginRight: 4 }} /> User
							</ToggleButton>
						</ToggleButtonGroup>
					</Tooltip>
				)}

				{/* Lease Type Switcher */}
				<ToggleButtonGroup
					size="small"
					value={leaseFilter}
					exclusive
					onChange={(_, newVal) => {
						if (newVal !== null) {
							setLeaseFilter(newVal);
							setSelectedTenants([]);
						}
					}}
					sx={{
						height: 32,
						bgcolor: "rgba(0, 0, 0, 0.4)",
						border: "1px solid rgba(123, 104, 238, 0.2)",
						borderRadius: "8px",
						"& .MuiToggleButton-root": {
							color: "rgba(255, 255, 255, 0.6)",
							fontSize: "0.7rem",
							fontWeight: 700,
							px: 1.25,
							py: 0,
							border: "none",
							"&.Mui-selected": {
								color: "white",
								bgcolor: "#7B68EE",
							},
						},
					}}
				>
					<ToggleButton value="ALL">ALL</ToggleButton>
					<ToggleButton value="OWNED">OWNED</ToggleButton>
					<ToggleButton value="INBOUND">INBOUND</ToggleButton>
					<ToggleButton value="OUTBOUND">OUTBOUND</ToggleButton>
				</ToggleButtonGroup>
			</Box>

			{/* CLUSTER 3: Filter Users Autocomplete & Search Input */}
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					gap: 1,
					flexWrap: "wrap",
					flexGrow: { xs: 1, sm: 0 },
				}}
			>
				{/* Filter Users Multi-Select Autocomplete */}
				{availableTenants.length > 0 && (
					<Autocomplete
						multiple
						size="small"
						options={availableTenants}
						value={selectedTenants}
						onChange={(_, newValue) => setSelectedTenants(newValue)}
						renderInput={(params) => (
							<TextField
								{...params}
								variant="outlined"
								placeholder={selectedTenants.length === 0 ? "Filter Users" : ""}
								sx={{
									"& .MuiOutlinedInput-root": {
										height: 32,
										py: "2px !important",
										px: "6px !important",
										fontSize: "0.75rem",
										bgcolor: "rgba(0, 0, 0, 0.4)",
										border: "1px solid rgba(123, 104, 238, 0.2)",
										borderRadius: "8px",
										color: "white",
									},
								}}
							/>
						)}
						sx={{ minWidth: 160, maxWidth: 240, flex: 1 }}
					/>
				)}

				{/* Planet / Search Input */}
				<TextField
					size="small"
					placeholder="Search planets or sites"
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					slotProps={{
						input: {
							startAdornment: (
								<InputAdornment position="start">
									<Search size={14} color="rgba(255, 255, 255, 0.5)" />
								</InputAdornment>
							),
						},
					}}
					sx={{
						minWidth: 180,
						flex: 1,
						"& .MuiOutlinedInput-root": {
							height: 32,
							fontSize: "0.75rem",
							bgcolor: "rgba(0, 0, 0, 0.4)",
							border: "1px solid rgba(123, 104, 238, 0.2)",
							borderRadius: "8px",
							color: "white",
							"& fieldset": { border: "none" },
						},
					}}
				/>
			</Box>
		</Box>
	);
};
