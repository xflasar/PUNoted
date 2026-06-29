import React, { useMemo } from "react";
import {
	Box,
	TextField,
	Autocomplete,
	Typography,
	Switch,
	ToggleButtonGroup,
	ToggleButton,
	Select,
	MenuItem,
	Button,
} from "@mui/material";
import { useFilter } from "./filtercontext";
import type { FilterState } from "./filtercontext";
import { useGlobalData } from "../../../../../context/globaldatacontext";
import { useMapData } from "../../hooks/usemapdata";
import MaterialBadge from "../../../../../cosm/components/materialbadge";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

const FilterPanel: React.FC = () => {
	const { filter, setFilter } = useFilter();
	const { mapData } = useGlobalData();
	const { allPlanetsData, systemsPoints } = useMapData(mapData);

	// Extract unique available resource tickers dynamically from allPlanetsData
	const availableResources = useMemo(() => {
		const res = new Set<string>();
		if (allPlanetsData) {
			Object.values(allPlanetsData).forEach((planets) => {
				planets.forEach((p) => {
					p.resources?.forEach((r: any) => {
						const ticker = r.material || r.name;
						if (ticker) res.add(ticker.toUpperCase());
					});
				});
			});
		}
		return Array.from(res).sort();
	}, [allPlanetsData]);

	// Prepare systems for Origin and Destination selection
	const systemOptions = useMemo(() => {
		if (!systemsPoints) return [];
		return systemsPoints
			.map((s: any) => ({
				label: s.name || s.systemName || s.label || "Unnamed System",
				id: s.originalSystemId || s.id,
			}))
			.sort((a, b) => a.label.localeCompare(b.label));
	}, [systemsPoints]);

	const selectedOriginOption = useMemo(() => {
		return (
			systemOptions.find((opt) => opt.id === filter.originSystemId) || null
		);
	}, [systemOptions, filter.originSystemId]);

	const selectedDestinationOption = useMemo(() => {
		return (
			systemOptions.find((opt) => opt.id === filter.destinationSystemId) || null
		);
	}, [systemOptions, filter.destinationSystemId]);

	const updateFilterField = <K extends keyof FilterState>(
		field: K,
		value: FilterState[K],
	) => {
		setFilter((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const toggleResource = (ticker: string) => {
		const nextResources = new Set(filter.resources);
		if (nextResources.has(ticker)) {
			nextResources.delete(ticker);
		} else {
			nextResources.add(ticker);
		}
		updateFilterField("resources", nextResources);
	};

	const handleReset = () => {
		setFilter({
			temperatureRange: [-50, 500],
			populationRange: [0, 10000000],
			resources: new Set(),
			filterRadius: 0,
			originSystemId: null,
			destinationSystemId: null,
			planetType: "all",
			fertileOnly: false,
			gravity: "all",
			temperature: "all",
			pressure: "all",
			cogcEnabled: false,
			cogcProgram: "ALL",
		});
	};

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				color: "#ffffff",
				width: "100%",
				height: "100%",
				maxHeight: "40vh",
			}}
		>
			{/* STICKY HEADER */}
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					p: 2,
					pb: 1,
					borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
					flexShrink: 0,
				}}
			>
				<Typography
					variant="subtitle2"
					sx={{
						fontWeight: 800,
						color: "#00e5ff",
						textTransform: "uppercase",
						fontSize: "0.7rem",
						letterSpacing: "0.15em",
						textShadow: "0 0 8px rgba(0, 229, 255, 0.4)",
					}}
				>
					Map Filters
				</Typography>
				<Button
					startIcon={<RestartAltIcon />}
					onClick={handleReset}
					size="small"
					variant="text"
					sx={{
						py: 0,
						color: "rgba(255,255,255,0.5)",
						fontSize: "0.7rem",
						fontWeight: 600,
						textTransform: "uppercase",
						letterSpacing: "0.05em",
						"&:hover": {
							color: "#00e5ff",
							bgcolor: "rgba(0, 229, 255, 0.08)",
						},
					}}
				>
					Reset
				</Button>
			</Box>

			{/* SCROLLABLE CONTENT */}
			<Box
				sx={{
					flex: 1,
					overflowY: "auto",
					p: 2,
					display: "flex",
					flexDirection: "column",
					gap: 2,
					"&::-webkit-scrollbar": { width: "4px" },
					"&::-webkit-scrollbar-track": { background: "transparent" },
					"&::-webkit-scrollbar-thumb": {
						backgroundColor: "rgba(0, 229, 255, 0.3)",
						borderRadius: "2px",
					},
				}}
			>
				{/* Planet Type Toggles */}
				<Box>
					<Typography
						variant="caption"
						sx={{
							color: "rgba(255,255,255,0.6)",
							fontWeight: 600,
							fontSize: "0.7rem",
							display: "block",
							mb: 0.5,
						}}
					>
						Planet Type
					</Typography>
					<ToggleButtonGroup
						value={filter.planetType}
						exclusive
						onChange={(_, val) => val && updateFilterField("planetType", val)}
						size="small"
						fullWidth
						sx={{
							bgcolor: "rgba(0,0,0,0.3)",
							border: "1px solid rgba(255,255,255,0.1)",
							"& .MuiToggleButton-root": {
								color: "rgba(255,255,255,0.6)",
								fontSize: "0.7rem",
								py: 0.5,
								border: "none",
								textTransform: "uppercase",
								fontWeight: 600,
								"&.Mui-selected": {
									color: "#00e5ff",
									bgcolor: "rgba(0, 229, 255, 0.15)",
									textShadow: "0 0 4px rgba(0, 229, 255, 0.5)",
									"&:hover": {
										bgcolor: "rgba(0, 229, 255, 0.25)",
									},
								},
							},
						}}
					>
						<ToggleButton value="all">All</ToggleButton>
						<ToggleButton value="rocky">Rocky</ToggleButton>
						<ToggleButton value="gaseous">Gaseous</ToggleButton>
					</ToggleButtonGroup>
				</Box>

				{/* Fertility Toggle */}
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						bgcolor: "rgba(0,0,0,0.2)",
						p: 1,
						borderRadius: "6px",
						border: "1px solid rgba(255,255,255,0.05)",
					}}
				>
					<Typography
						variant="caption"
						sx={{
							color: "rgba(255,255,255,0.8)",
							fontWeight: 600,
							fontSize: "0.75rem",
						}}
					>
						Fertile Planets Only
					</Typography>
					<Switch
						checked={filter.fertileOnly}
						onChange={(e) => updateFilterField("fertileOnly", e.target.checked)}
						size="small"
						sx={{
							"& .MuiSwitch-switchBase.Mui-checked": { color: "#00e5ff" },
							"& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
								backgroundColor: "#00e5ff",
							},
						}}
					/>
				</Box>

				{/* Physical Properties (Gravity, Temp, Pressure) Toggles */}
				<Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
					{/* Gravity */}
					<Box>
						<Typography
							variant="caption"
							sx={{
								color: "rgba(255,255,255,0.6)",
								fontWeight: 600,
								fontSize: "0.7rem",
								display: "block",
								mb: 0.5,
							}}
						>
							Gravity
						</Typography>
						<ToggleButtonGroup
							value={filter.gravity}
							exclusive
							onChange={(_, val) => val && updateFilterField("gravity", val)}
							size="small"
							fullWidth
							sx={{
								bgcolor: "rgba(0,0,0,0.3)",
								border: "1px solid rgba(255,255,255,0.1)",
								"& .MuiToggleButton-root": {
									color: "rgba(255,255,255,0.6)",
									fontSize: "0.65rem",
									py: 0.25,
									border: "none",
									fontWeight: 600,
									"&.Mui-selected": {
										color: "#00e5ff",
										bgcolor: "rgba(0, 229, 255, 0.15)",
										"&:hover": { bgcolor: "rgba(0, 229, 255, 0.25)" },
									},
								},
							}}
						>
							<ToggleButton value="all">All</ToggleButton>
							<ToggleButton value="low">Low (≤1g)</ToggleButton>
							<ToggleButton value="high">High (&gt;1g)</ToggleButton>
						</ToggleButtonGroup>
					</Box>

					{/* Temperature */}
					<Box>
						<Typography
							variant="caption"
							sx={{
								color: "rgba(255,255,255,0.6)",
								fontWeight: 600,
								fontSize: "0.7rem",
								display: "block",
								mb: 0.5,
							}}
						>
							Temperature
						</Typography>
						<ToggleButtonGroup
							value={filter.temperature}
							exclusive
							onChange={(_, val) =>
								val && updateFilterField("temperature", val)
							}
							size="small"
							fullWidth
							sx={{
								bgcolor: "rgba(0,0,0,0.3)",
								border: "1px solid rgba(255,255,255,0.1)",
								"& .MuiToggleButton-root": {
									color: "rgba(255,255,255,0.6)",
									fontSize: "0.65rem",
									py: 0.25,
									border: "none",
									fontWeight: 600,
									"&.Mui-selected": {
										color: "#00e5ff",
										bgcolor: "rgba(0, 229, 255, 0.15)",
										"&:hover": { bgcolor: "rgba(0, 229, 255, 0.25)" },
									},
								},
							}}
						>
							<ToggleButton value="all">All</ToggleButton>
							<ToggleButton value="low">Low (&lt;273K)</ToggleButton>
							<ToggleButton value="high">High (≥273K)</ToggleButton>
						</ToggleButtonGroup>
					</Box>

					{/* Pressure */}
					<Box>
						<Typography
							variant="caption"
							sx={{
								color: "rgba(255,255,255,0.6)",
								fontWeight: 600,
								fontSize: "0.7rem",
								display: "block",
								mb: 0.5,
							}}
						>
							Pressure
						</Typography>
						<ToggleButtonGroup
							value={filter.pressure}
							exclusive
							onChange={(_, val) => val && updateFilterField("pressure", val)}
							size="small"
							fullWidth
							sx={{
								bgcolor: "rgba(0,0,0,0.3)",
								border: "1px solid rgba(255,255,255,0.1)",
								"& .MuiToggleButton-root": {
									color: "rgba(255,255,255,0.6)",
									fontSize: "0.65rem",
									py: 0.25,
									border: "none",
									fontWeight: 600,
									"&.Mui-selected": {
										color: "#00e5ff",
										bgcolor: "rgba(0, 229, 255, 0.15)",
										"&:hover": { bgcolor: "rgba(0, 229, 255, 0.25)" },
									},
								},
							}}
						>
							<ToggleButton value="all">All</ToggleButton>
							<ToggleButton value="low">Low (≤1b)</ToggleButton>
							<ToggleButton value="high">High (&gt;1b)</ToggleButton>
						</ToggleButtonGroup>
					</Box>
				</Box>

				{/* COGC Program Filters */}
				<Box
					sx={{
						bgcolor: "rgba(0,0,0,0.2)",
						p: 1.5,
						borderRadius: "8px",
						border: "1px solid rgba(255,255,255,0.06)",
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
						<Typography
							variant="caption"
							sx={{
								color: "rgba(255,255,255,0.8)",
								fontWeight: 600,
								fontSize: "0.75rem",
							}}
						>
							Filter COGC Program
						</Typography>
						<Switch
							checked={filter.cogcEnabled}
							onChange={(e) =>
								updateFilterField("cogcEnabled", e.target.checked)
							}
							size="small"
							sx={{
								"& .MuiSwitch-switchBase.Mui-checked": { color: "#00e5ff" },
								"& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
									backgroundColor: "#00e5ff",
								},
							}}
						/>
					</Box>
					{filter.cogcEnabled && (
						<Select
							value={filter.cogcProgram}
							onChange={(e) => updateFilterField("cogcProgram", e.target.value)}
							size="small"
							fullWidth
							variant="outlined"
							sx={{
								fontSize: "0.75rem",
								color: "white",
								bgcolor: "rgba(0,0,0,0.3)",
								"& .MuiOutlinedInput-notchedOutline": {
									borderColor: "rgba(255,255,255,0.15)",
								},
								"&:hover .MuiOutlinedInput-notchedOutline": {
									borderColor: "rgba(0, 229, 255, 0.3)",
								},
								"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
									borderColor: "#00e5ff",
								},
								"& .MuiSvgIcon-root": { color: "rgba(255,255,255,0.6)" },
							}}
							MenuProps={{
								PaperProps: {
									sx: {
										bgcolor: "rgba(15, 18, 28, 0.98)",
										border: "1px solid rgba(0, 229, 255, 0.2)",
										color: "white",
										"& .MuiMenuItem-root": {
											fontSize: "0.75rem",
											"&.Mui-selected": {
												bgcolor: "rgba(0, 229, 255, 0.15) !important",
											},
											"&:hover": {
												bgcolor: "rgba(255, 255, 255, 0.05) !important",
											},
										},
									},
								},
							}}
						>
							<MenuItem value="ALL">All Programs</MenuItem>
							<MenuItem value="NONE">No Program</MenuItem>
							<MenuItem value="RESOURCE_EXTRACTION">
								Resource Extraction
							</MenuItem>
							<MenuItem value="CHEMISTRY">Chemistry</MenuItem>
							<MenuItem value="METALLURGY">Metallurgy</MenuItem>
							<MenuItem value="MANUFACTURING">Manufacturing</MenuItem>
							<MenuItem value="AGRICULTURE">Agriculture</MenuItem>
							<MenuItem value="FOOD_INDUSTRIES">Food Industries</MenuItem>
							<MenuItem value="CONSTRUCTION">Construction</MenuItem>
							<MenuItem value="FUEL_REFINING">Fuel Refining</MenuItem>
							<MenuItem value="ELECTRONICS">Electronics</MenuItem>
						</Select>
					)}
				</Box>

				{/* Resource Toggles (No Scroll, Chip Badges Directly Clickable) */}
				<Box>
					<Typography
						variant="caption"
						sx={{
							display: "block",
							mb: 1,
							color: "rgba(255,255,255,0.6)",
							fontWeight: 600,
							fontSize: "0.7rem",
						}}
					>
						Resource Filters
					</Typography>
					<Box
						sx={{
							display: "flex",
							flexWrap: "wrap",
							gap: 0.75,
						}}
					>
						{availableResources.map((ticker) => {
							const isActive = filter.resources.has(ticker);
							return (
								<Box
									key={ticker}
									onClick={() => toggleResource(ticker)}
									sx={{
										cursor: "pointer",
										borderRadius: "4px",
										border: isActive
											? "1px solid #00e5ff"
											: "1px solid rgba(255,255,255,0.12)",
										boxShadow: isActive
											? "0 0 8px rgba(0, 229, 255, 0.25)"
											: "none",
										transition: "all 0.15s ease",
										opacity: isActive ? 1 : 0.5,
										display: "inline-flex",
										"&:hover": {
											transform: "scale(1.05)",
											opacity: 1,
											borderColor: isActive
												? "#00e5ff"
												: "rgba(255,255,255,0.3)",
										},
									}}
								>
									<MaterialBadge ticker={ticker} />
								</Box>
							);
						})}
					</Box>
				</Box>

				{/* Pathfinding Autocompletes */}
				<Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
					<Typography
						variant="caption"
						sx={{
							color: "rgba(255,255,255,0.6)",
							fontWeight: 600,
							fontSize: "0.7rem",
							display: "block",
							mb: -0.5,
						}}
					>
						Path Finding
					</Typography>

					{/* Origin */}
					<Box>
						<Autocomplete
							size="small"
							options={systemOptions}
							getOptionLabel={(opt) => opt.label}
							value={selectedOriginOption}
							onChange={(_, val) =>
								updateFilterField("originSystemId", val ? val.id : null)
							}
							renderInput={(params) => (
								<TextField
									{...params}
									variant="standard"
									placeholder="Select Origin System..."
									InputProps={{
										...params.InputProps,
										style: { color: "white", fontSize: "0.75rem" },
									}}
									sx={{
										"& .MuiInput-underline:before": {
											borderBottomColor: "rgba(255,255,255,0.1)",
										},
										"& .MuiInput-underline:hover:before": {
											borderBottomColor: "rgba(255,255,255,0.25) !important",
										},
										"& .MuiInput-underline:after": {
											borderBottomColor: "#00e5ff",
										},
									}}
								/>
							)}
							PaperComponent={({ children, ...other }) => (
								<Paper
									{...other}
									sx={{
										bgcolor: "rgba(15, 18, 28, 0.98)",
										border: "1px solid rgba(0, 229, 255, 0.15)",
										color: "white",
										boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6)",
										"& .MuiAutocomplete-option": {
											fontSize: "0.75rem",
											'&[aria-selected="true"]': {
												bgcolor: "rgba(0, 229, 255, 0.15) !important",
											},
											"&:hover": {
												bgcolor: "rgba(255, 255, 255, 0.05) !important",
											},
										},
									}}
								>
									{children}
								</Paper>
							)}
						/>
					</Box>

					{/* Destination */}
					<Box>
						<Autocomplete
							size="small"
							options={systemOptions}
							getOptionLabel={(opt) => opt.label}
							value={selectedDestinationOption}
							onChange={(_, val) =>
								updateFilterField("destinationSystemId", val ? val.id : null)
							}
							renderInput={(params) => (
								<TextField
									{...params}
									variant="standard"
									placeholder="Select Destination System..."
									InputProps={{
										...params.InputProps,
										style: { color: "white", fontSize: "0.75rem" },
									}}
									sx={{
										"& .MuiInput-underline:before": {
											borderBottomColor: "rgba(255,255,255,0.1)",
										},
										"& .MuiInput-underline:hover:before": {
											borderBottomColor: "rgba(255,255,255,0.25) !important",
										},
										"& .MuiInput-underline:after": {
											borderBottomColor: "#00e5ff",
										},
									}}
								/>
							)}
							PaperComponent={({ children, ...other }) => (
								<Paper
									{...other}
									sx={{
										bgcolor: "rgba(15, 18, 28, 0.98)",
										border: "1px solid rgba(0, 229, 255, 0.15)",
										color: "white",
										boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6)",
										"& .MuiAutocomplete-option": {
											fontSize: "0.75rem",
											'&[aria-selected="true"]': {
												bgcolor: "rgba(0, 229, 255, 0.15) !important",
											},
											"&:hover": {
												bgcolor: "rgba(255, 255, 255, 0.05) !important",
											},
										},
									}}
								>
									{children}
								</Paper>
							)}
						/>
					</Box>
				</Box>

				{/* Radius Setting */}
				<Box>
					<Typography
						variant="caption"
						sx={{
							color: "rgba(255,255,255,0.6)",
							fontWeight: 600,
							fontSize: "0.7rem",
						}}
					>
						Radius Limit (parsecs)
					</Typography>
					<TextField
						type="number"
						variant="standard"
						fullWidth
						value={filter.filterRadius}
						onChange={(e) =>
							updateFilterField(
								"filterRadius",
								Math.max(0, Number(e.target.value)),
							)
						}
						InputProps={{
							inputProps: { min: 0, max: 1000 },
							style: { color: "white", fontSize: "0.75rem" },
						}}
						sx={{
							"& .MuiInput-underline:before": {
								borderBottomColor: "rgba(255,255,255,0.1)",
							},
							"& .MuiInput-underline:hover:before": {
								borderBottomColor: "rgba(255,255,255,0.25) !important",
							},
							"& .MuiInput-underline:after": { borderBottomColor: "#00e5ff" },
						}}
					/>
				</Box>
			</Box>
		</Box>
	);
};

export default FilterPanel;
