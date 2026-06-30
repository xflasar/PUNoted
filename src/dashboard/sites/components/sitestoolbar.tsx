import React, { useState } from "react";
import {
	Box,
	Typography,
	TextField,
	InputAdornment,
	useTheme,
	alpha,
	Divider,
	Button,
	ToggleButtonGroup,
	ToggleButton,
	Autocomplete,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	useMediaQuery,
	Paper,
} from "@mui/material";
import { Search, ChevronDown, ChevronUp, Globe } from "lucide-react";

interface SitesToolbarProps {
	summaryOpen: boolean;
	setSummaryOpen: (val: boolean) => void;
	filteredSitesCount: number;
	totalLinesCount: number;
	leaseFilter: string;
	setLeaseFilter: (val: any) => void;
	availableTenants: string[];
	selectedTenants: string[];
	setSelectedTenants: (val: string[]) => void;
	searchTerm: string;
	setSearchTerm: (val: string) => void;
}

export const SitesToolbar: React.FC<SitesToolbarProps> = ({
	summaryOpen,
	setSummaryOpen,
	filteredSitesCount,
	totalLinesCount,
	leaseFilter,
	setLeaseFilter,
	availableTenants,
	selectedTenants,
	setSelectedTenants,
	searchTerm,
	setSearchTerm,
}) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));
	const [mobileFiltersExpanded, setMobileFiltersExpanded] = useState(false);

	return (
		<Paper
			elevation={0}
			sx={{
				zIndex: 10,
				borderBottom: `1px solid ${theme.palette.divider}`,
				bgcolor: alpha(theme.palette.background.default, 0.8),
				backdropFilter: "blur(10px)",
			}}
		>
			<Box
				sx={{
					px: { xs: 2, sm: 3 },
					display: "flex",
					flexDirection: { xs: "column", md: "row" },
					alignItems: { xs: "stretch", md: "center" },
					justifyContent: "space-between",
					gap: 1,
				}}
			>
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						gap: 2,
						width: { xs: "100%", sm: "auto" },
						justifyContent: "space-between",
					}}
				>
					<Button
						onClick={() => setSummaryOpen(!summaryOpen)}
						variant={summaryOpen ? "tonal" : "text"}
						startIcon={<Globe size={16} />}
						endIcon={
							summaryOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />
						}
						size="small"
						sx={{ fontWeight: 700, color: "text.primary", borderRadius: 1.5 }}
					>
						SUMMARY
					</Button>

					<Divider
						orientation="vertical"
						flexItem
						sx={{
							height: 20,
							alignSelf: "center",
							display: { xs: "none", sm: "block" },
						}}
					/>

					<Typography
						variant="body2"
						color="text.secondary"
						sx={{ whiteSpace: "nowrap", fontSize: "0.8rem", fontWeight: 600 }}
					>
						{filteredSitesCount} Sites &nbsp;•&nbsp; {totalLinesCount} Lines
					</Typography>
				</Box>

				<Accordion
					expanded={isMobile ? mobileFiltersExpanded : true}
					onChange={
						isMobile
							? (_, expanded) => setMobileFiltersExpanded(expanded)
							: undefined
					}
					elevation={0}
					square
					sx={{
						width: { xs: "100%", md: "auto" },
						bgcolor: "transparent",
						backgroundImage: "none",
						"&:before": { display: "none" },
						m: "0 !important",
						"&.Mui-expanded": {
							m: "0 !important",
						},
						"& .MuiAccordionSummary-root": {
							p: 0,
							minHeight: { xs: 32, md: "auto" },
							"&.Mui-expanded": { minHeight: { xs: 32, md: "auto" } },
							cursor: isMobile ? "pointer" : "default",
						},
						"& .MuiAccordionSummary-content": {
							m: 0,
							"&.Mui-expanded": { m: 0 },
						},
					}}
				>
					<AccordionSummary
						expandIcon={
							isMobile ? (
								<ChevronDown size={16} style={{ color: "white" }} />
							) : null
						}
						sx={{ display: { xs: "flex", md: "none" } }}
					>
						<Typography
							variant="caption"
							sx={{
								fontWeight: 700,
								color: "text.secondary",
								letterSpacing: 0.5,
							}}
						>
							FILTER & SEARCH OPTIONS
						</Typography>
					</AccordionSummary>

					<AccordionDetails
						sx={{
							p: 0,
							display: { xs: "block", md: "flex" },
							mt: { xs: 1, md: 0 },
						}}
					>
						<Box
							sx={{
								display: "flex",
								flexDirection: { xs: "column", sm: "row" },
								alignItems: { xs: "stretch", sm: "center" },
								gap: 1.5,
							}}
						>
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
									bgcolor: alpha(theme.palette.background.default, 0.5),
									display: "flex",
									"& .MuiToggleButton-root": {
										flexGrow: 1,
										py: 0,
										px: 1.5,
										fontSize: "0.7rem",
									},
								}}
							>
								<ToggleButton value="all">All</ToggleButton>
								<ToggleButton value="owned">Owned</ToggleButton>
								<ToggleButton value="leased" sx={{ gap: 0.5 }}>
									Inbound
								</ToggleButton>
								<ToggleButton value="loaned" sx={{ gap: 0.5 }}>
									Outbound
								</ToggleButton>
							</ToggleButtonGroup>

							{(leaseFilter === "leased" || leaseFilter === "loaned") && (
								<Autocomplete
									multiple
									limitTags={1}
									size="small"
									options={availableTenants}
									value={selectedTenants}
									onChange={(_, newValue) => setSelectedTenants(newValue)}
									sx={{ width: { xs: "100%", sm: 180 } }}
									renderInput={(params) => (
										<TextField
											{...params}
											placeholder="Filter Partners..."
											sx={{
												"& .MuiOutlinedInput-root": {
													borderRadius: 1.5,
													py: "2px !important",
												},
											}}
										/>
									)}
								/>
							)}

							<TextField
								size="small"
								placeholder="Search planets..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								slotProps={{
									input: {
										startAdornment: (
											<InputAdornment position="start">
												<Search size={16} />
											</InputAdornment>
										),
									},
								}}
								sx={{
									width: { xs: "100%", sm: 220 },
									"& .MuiOutlinedInput-root": {
										borderRadius: 1.5,
										height: 32,
									},
									"& input": { fontSize: "0.75rem" },
								}}
							/>
						</Box>
					</AccordionDetails>
				</Accordion>
			</Box>
		</Paper>
	);
};
