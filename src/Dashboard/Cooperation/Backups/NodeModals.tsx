import { API_BASE_URL } from "../../../config/api";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
	Box,
	Typography,
	Button,
	Modal,
	TextField,
	Autocomplete,
	useTheme,
	List,
	ListItem,
	ListItemText,
	Select,
	MenuItem,
	InputLabel,
	FormControl,
	IconButton,
	CircularProgress,
	Divider,
} from "@mui/material";
import {
	Save,
	Close as CloseIcon,
	Add as AddIcon,
	Delete as DeleteIcon,
	Factory,
	LocalShipping,
	Search as SearchIcon,
} from "@mui/icons-material";
import {
	type NodeBaseModalProps,
	type ChainNodeData,
	type GroupMember,
	type UserStorage,
	type SectorOption,
	type PlanetOption,
	type SystemOption,
	type InputRecipe,
} from "./types";
import {
	COLOR_CONSTANTS,
	calculateProductionAndConsumption,
	getTickerColor,
} from "./helpers";
import { v4 as uuidv4 } from "uuid";
import { RecipeSelector } from "./components/inputRecipe";

// --- NEW TEMPORARY STATE TYPE FOR THE UI ---
interface UserFlowInput {
	uid: string;
	username: string;
	displayName: string;
	rate: number;
	type: "Produce" | "Consume";
}

// --- NEW TYPE FOR SEARCH RESULTS (from Python backend) ---
interface SearchResultPlanet {
	planetid: string;
	name: string;
	naturalid: string;
	system: {
		systemid: string;
		name: string;
		sector: {
			externalsectorid: string;
			name: string;
		};
	};
}

// --- API HELPER: exponentialBackoffFetch ---
const exponentialBackoffFetch = async (
	url: string,
	attempt: number = 0,
): Promise<any> => {
	const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
	if (attempt > 0) {
		// console.log(`Retrying fetch for ${url} in ${delay.toFixed(0)}ms (Attempt ${attempt + 1}).`);
		await new Promise((resolve) => setTimeout(resolve, delay));
	}

	try {
		const response = await fetch(url);
		if (!response.ok) {
			// NOTE: Assuming your FastAPI backend is exposed on this path
			const isSearchEndpoint = url.includes("/planets/search");
			if (response.status === 404 && isSearchEndpoint) {
				// If the search endpoint is not found, we don't retry, just fail gracefully.
				return [];
			}
			if (response.status === 429 && attempt < 5) {
				// Too Many Requests
				return exponentialBackoffFetch(url, attempt + 1);
			}
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		return await response.json();
	} catch (error) {
		if (attempt < 5) {
			return exponentialBackoffFetch(url, attempt + 1);
		}
		console.error("Fetch failed after multiple retries:", error);
		throw error;
	}
};
// ----------------------------

// --- Tab Panel Component (for UI Improvement) ---
interface TabPanelProps {
	children?: React.ReactNode;
	index: number;
	value: number;
}
const TabPanel = (props: TabPanelProps) => {
	const { children, value, index, ...other } = props;
	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`simple-tabpanel-${index}`}
			aria-labelledby={`simple-tab-${index}`}
			{...other}
		>
			{/* Used to contain the scrollable content */}
			{value === index && (
				<Box sx={{ p: 3, overflowY: "auto" }}>{children}</Box>
			)}
		</div>
	);
};
// ----------------------------

// --- Base URL for Planet API ---

const NodeBaseModal: React.FC<NodeBaseModalProps> = ({
	open,
	onClose,
	onSave,
	materials,
	initialData,
	isEdit,
	groupMembers,
}) => {
	const [materialTicker, setMaterialTicker] = useState(
		initialData?.materialTicker || "",
	);
	const [siteName, setSiteName] = useState(initialData?.siteName || "New-Site");
	const [productionRate, setProductionRate] = useState(
		initialData?.productionRate.toFixed(1) || "0.0",
	);
	const [consumptionRate, setConsumptionRate] = useState(
		initialData?.consumptionRatio?.toFixed(1) || "0.0",
	);
	const [netRate, setNetRate] = useState(
		initialData?.netFlow.toFixed(1) || "0.0",
	);
	const [error, setError] = useState("");
	const theme = useTheme();

	// User Flow States
	const [userFlowInputs, setUserFlowInputs] = useState<UserFlowInput[]>([]);
	const [userStorage, setUserStorage] = useState<UserStorage[]>([]);
	const [userToAdd, setUserToAdd] = useState<GroupMember | null>(null);
	const [manualInputText, setManualInputText] = useState<string>("");

	// Location States (3-Tier Hierarchy)
	/* const [sectorOptions, setSectorOptions] = useState<SectorOption[]>([]); */
	const [selectedSector, setSelectedSector] = useState<SectorOption | null>(
		null,
	);
	const [selectedSystem, setSelectedSystem] = useState<SystemOption | null>(
		null,
	);
	/* const [planetOptions, setPlanetOptions] = useState<PlanetOption[]>([]); */
	const [selectedPlanet, setSelectedPlanet] = useState<PlanetOption | null>(
		null,
	);
	/* const [systemOptions, setSystemOptions] = useState<SystemOption[]>([]);
	const [isLoadingSystems, setIsLoadingSystems] = useState(false);
	const [isLoadingPlanets, setIsLoadingPlanets] = useState(false); */

	// --- NEW: Planet Search State ---
	const [searchTerm, setSearchTerm] = useState<string>("");
	const [searchResults, setSearchResults] = useState<SearchResultPlanet[]>([]);
	const [isSearching, setIsSearching] = useState<boolean>(false);

	const [selectedRecipe, setSelectedRecipe] = useState<InputRecipe | null>(
		null,
	);

	const handleSelectRecipe = (
		recipe: React.SetStateAction<InputRecipe | null>,
	) => {
		setSelectedRecipe(recipe);
	};

	// Tab State
	const [tabValue, setTabValue] = useState(0);

	// --- Memoized Helpers ---
	const materialOptions = useMemo(
		() => materials.map((m) => m.ticker),
		[materials],
	);

	const selectedMaterial = useMemo(
		() => materials.find((m) => m.ticker === materialTicker),
		[materials, materialTicker],
	);

	// Calculate the color for the modal border/highlights
	const accentColor = useMemo(() => {
		// Assuming Material type has a colorHex property
		// Fallback to secondary color if no material is selected
		return selectedMaterial
			? getTickerColor(selectedMaterial.ticker)
			: theme.palette.secondary.main;
	}, [selectedMaterial, theme.palette.secondary.main]);

	/* const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
		setTabValue(newValue);
	}; */

	// --- Initialization/Reset Effect ---
	useEffect(() => {
		if (initialData) {
			setMaterialTicker(initialData.materialTicker);
			setSiteName(initialData.siteName);

			const initialFlows: UserFlowInput[] = (initialData.userFlows || []).map(
				(flow) => {
					const member = groupMembers.find(
						(m) => m.username === flow.username,
					) as GroupMember;
					return {
						uid: member?.uid || flow.username,
						username: flow.username,
						displayName: member?.displayName || flow.username,
						rate: parseFloat(parseFloat(flow.rate).toFixed(1)),
						type: flow.type as "Produce" | "Consume",
					};
				},
			);
			setUserFlowInputs(initialFlows);

			const initialStorage: UserStorage[] = (initialData.userStorage || []).map(
				(storage) => ({
					username: storage.username,
					current: storage.current,
					unit: storage.unit,
					overallStorage: storage.overallStorage,
				}),
			);
			setUserStorage(initialStorage);
			setError("");

			const recipe =
				materials
					.find((mat) => mat.ticker === initialData.materialTicker)
					?.inputRecipes.find(
						(recipe) => recipe.processid === initialData.recipe?.processid,
					) || null;
			setSelectedRecipe(recipe);

			// --- Location init logic (assuming initialData has location objects) ---
			setSelectedSector(initialData.sector || null);
			setSelectedSystem(initialData.system || null);
			setSelectedPlanet(initialData.planet || null);
		} else {
			setMaterialTicker("");
			setSiteName("New-Site");
			setProductionRate("0.0");
			setUserFlowInputs([]);
			setUserStorage([]);
			setSelectedSector(null);
			setSelectedSystem(null);
			setSelectedPlanet(null);
			setError("");
		}
	}, [initialData, open, groupMembers]);

	// --- Dedicated useEffect to update productionRate ---
	useEffect(() => {
		// NOTE: Assuming your calculateNetProductionRate utility takes a node object or object with userFlows.
		const mockNodeData = { userFlows: userFlowInputs };
		const { production, consumption, net } = calculateProductionAndConsumption(
			mockNodeData as ChainNodeData,
		);
		const productionString = production.toFixed(1);
		const consumptionString = consumption.toFixed(1);
		const netString = net.toFixed(1);

		if (productionString !== productionRate) {
			setProductionRate(productionString);
		}

		if (consumptionString !== consumptionRate) {
			setConsumptionRate(consumptionString);
		}

		if (netString !== netRate) {
			setNetRate(netString);
		}
	}, [userFlowInputs, productionRate, setProductionRate]);

	// --- Planet API Logic (Existing Sector/System/Planet Hierarchy) ---

	// 1. Fetch ALL Sectors on mount (Cacheable)
	/* useEffect(() => {
		const fetchSectors = async () => {
			try {
				const res = await fetch(`${API_BASE_URL}/map/sectors`);
				if (res.ok) {
					const sectors: SectorOption[] = await res.json();
					setSectorOptions(sectors);
				} else {
					console.error("Failed to fetch sectors. Status:", res.status);
				}
			} catch (e) {
				console.error("Error fetching sectors:", e);
			}
		};

		if (sectorOptions.length === 0) {
			fetchSectors();
		}
	}, []);

	// 2. Fetch Systems when Sector changes
	useEffect(() => {
		if (selectedSystem) return;

		setSystemOptions([]);
		setSelectedSystem(null);
		setPlanetOptions([]);
		setSelectedPlanet(null);

		if (selectedSector) {
			const fetchSystems = async (sectorId: string) => {
				setIsLoadingSystems(true);
				try {
					const encodedSectorId = encodeURIComponent(sectorId);
					const res = await fetch(
						`${API_BASE_URL}/map/systems?sector=${encodedSectorId}`
					);

					if (res.ok) {
						const systems: SystemOption[] = await res.json();
						setSystemOptions(systems || []);
					} else {
						console.error("Failed to fetch systems. Status:", res.status);
					}
				} catch (e) {
					console.error("Error fetching systems:", e);
				} finally {
					setIsLoadingSystems(false);
				}
			};
			fetchSystems(selectedSector.externalsectorid);
		}
	}, [selectedSector]);

	// 3. Fetch Planets when System changes
	useEffect(() => {
		if (selectedPlanet) return;

		setPlanetOptions([]);
		setSelectedPlanet(null);

		if (selectedSystem) {
			const fetchPlanets = async (systemId: string) => {
				setIsLoadingPlanets(true);
				try {
					const encodedSystemId = encodeURIComponent(systemId);
					const res = await fetch(
						`${API_BASE_URL}/map/planets?system=${encodedSystemId}`
					);

					if (res.ok) {
						const planets: PlanetOption[] = await res.json();
						setPlanetOptions(planets || []);
					} else {
						console.error("Failed to fetch planets. Status:", res.status);
					}
				} catch (e) {
					console.error("Error fetching planets:", e);
				} finally {
					setIsLoadingPlanets(false);
				}
			};
			fetchPlanets(selectedSystem.systemid);
		}
	}, [selectedSystem]); */

	// --- API: PLANET SEARCH FUNCTION (NEW) ---
	const searchPlanets = useCallback(async (query: string) => {
		if (query.length < 3) {
			setSearchResults([]);
			return;
		}

		setIsSearching(true);
		// Use the new endpoint for planet search
		const apiUrl = `${API_BASE_URL}/map/planets/search?query=${encodeURIComponent(
			query,
		)}`;

		try {
			const data: SearchResultPlanet[] = await exponentialBackoffFetch(apiUrl);
			console.log(data);
			console.log(query);
			setSearchResults(data);
		} catch (error) {
			console.error("Failed to search planets:", error);
			setSearchResults([]);
		} finally {
			setIsSearching(false);
		}
	}, []);

	// --- HANDLER: SELECT PLANET FROM SEARCH (NEW) ---
	const handleSearchPlanetSelection = useCallback(
		(planet: SearchResultPlanet) => {
			// 1. Map the nested result back to the flat state structure
			const sectorData: SectorOption = {
				externalsectorid: planet.system.sector.externalsectorid, // Use externalsectorid for SectorOption
				name: planet.system.sector.name,
			};
			const systemData: SystemOption = {
				systemid: planet.system.systemid,
				name: planet.system.name,
			};
			const planetData: PlanetOption = {
				planetid: planet.planetid,
				name: planet.name,
				naturalid: planet.naturalid,
			};

			// 2. Set the main location states
			setSelectedSector(sectorData);
			setSelectedSystem(systemData);
			setSelectedPlanet(planetData);

			// 3. Switch back to the 'Details & Site' tab (index 0) to confirm the selection
			setTabValue(0);

			// 4. Clear search state
			setSearchTerm("");
			setSearchResults([]);
		},
		[],
	);

	const handleAddUserToFlow = useCallback(
		(user: GroupMember | null) => {
			if (!user || userFlowInputs.some((uf) => uf.uid === user.uid)) {
				return;
			}

			const newUserFlow: UserFlowInput = {
				uid: user.uid,
				username: user.username,
				displayName: user.displayName || user.username,
				rate: 0.0,
				type: "Produce",
			};

			const newUserStorage: UserStorage = {
				username: user.username,
				current: 0,
				unit: "",
				overallStorage: [],
			};

			setUserFlowInputs((prev) => [...prev, newUserFlow]);
			setUserStorage((prev) => [...prev, newUserStorage]);
		},
		[userFlowInputs, setUserFlowInputs, setUserStorage],
	);

	const handleFlowChange = useCallback(
		(uid: string, field: "rate" | "type", value: string) => {
			setUserFlowInputs((prev) =>
				prev.map((flow) =>
					flow.uid === uid
						? {
								...flow,
								[field]:
									field === "type"
										? (value as "Produce" | "Consume")
										: parseFloat(value),
							}
						: flow,
				),
			);
		},
		[],
	);

	const handleRemoveFlowUser = useCallback(
		(uid: string) => {
			setUserFlowInputs((prevFlows) =>
				prevFlows.filter((flow) => flow.uid !== uid),
			);
			setUserStorage((prevStorage) =>
				prevStorage.filter((storage) => {
					const flowToRemove = userFlowInputs.find((f) => f.uid === uid);
					return storage.username !== flowToRemove?.username;
				}),
			);
		},
		[userFlowInputs],
	);

	const getUniqueId = () => {
		if (
			typeof crypto !== "undefined" &&
			typeof crypto.randomUUID === "function"
		) {
			return crypto.randomUUID();
		}
		return uuidv4();
	};

	// --- Save Logic ---
	const handleSave = () => {
		const rate = parseFloat(productionRate);
		if (isNaN(rate)) {
			setError("Net production rate must be a valid number.");
			return;
		}
		if (!materialTicker || !selectedMaterial) {
			setError("Material Ticker is required and must be valid.");
			return;
		}
		if (!siteName) {
			setError("Site/Planet Name is required.");
			setTabValue(0);
			return;
		}
		// Location validation check
		if (!selectedSector || !selectedSystem || !selectedPlanet) {
			setError("Location (Sector, System, Planet) is required.");
			setTabValue(0);
			return;
		}

		const finalNodeId = isEdit ? initialData!.nodeId : getUniqueId();

		const finalUserFlows: UserFlowInput[] = userFlowInputs.map((input) => ({
			uid: input.uid,
			displayName: input.displayName,
			username: input.username,
			rate: input.rate || 0.0,
			type: input.type,
		}));

		const finalUserStorage: UserStorage[] = userStorage.map((storage) => ({
			username: storage.username,
			current: storage.current || 0,
			unit: storage.unit,
			overallStorage: storage.overallStorage,
		}));

		const newNodeData: ChainNodeData = {
			nodeId: finalNodeId,
			materialTicker: materialTicker,
			locked: false,
			recipe: !selectedRecipe
				? materials.find((mat) => mat.ticker === materialTicker)!
						.inputRecipes[0]
				: selectedRecipe,
			isResource: selectedMaterial!.inputRecipes.length > 0 ? false : true,
			isEndMaterial: selectedMaterial!.requiredFor.length > 0 ? false : true,
			siteName: siteName.trim() || "Untitled-Site",
			sector: selectedSector,
			system: selectedSystem,
			planet: selectedPlanet,
			productionRate: rate,
			productionUnit: `${materialTicker}/d`,
			statusColor: COLOR_CONSTANTS.GREY_TEXT,
			netFlow: isEdit ? initialData!.netFlow : parseFloat(netRate),
			consumptionRatio: isEdit
				? initialData!.consumptionRatio
				: parseFloat(consumptionRate),
			productionBuilding: selectedMaterial!.production_building,
			userFlows: finalUserFlows,
			userStorage: finalUserStorage,
			position: initialData?.position,
			supply: {},
			inputStatus: false,
		};

		const updatedProductionRate =
			calculateProductionAndConsumption(newNodeData);

		const nodeToSave: ChainNodeData = {
			...newNodeData,
			productionRate: updatedProductionRate.production,
			consumptionRatio: updatedProductionRate.consumption,
			netFlow: updatedProductionRate.net,
		};

		console.log(nodeToSave);

		onSave(nodeToSave);
		onClose();
	};

	const modalStyle = {
		position: "absolute" as const,
		top: "50%",
		left: "50%",
		transform: "translate(-50%, -50%)",
		width: 650,
		background: theme.palette.background.paper,
		borderRadius: 2,
		border: `3px solid ${accentColor}`, // Use accent color for border
		boxShadow: 24,
		p: 0,
		overflow: "hidden",
	};

	// Custom style for the disabled/calculated rate field
	const calculatedInputStyle = {
		"& .MuiOutlinedInput-root.Mui-disabled": {
			"& fieldset": {
				borderColor: accentColor,
				borderWidth: "2px", // Make the highlight prominent
			},
		},
	};

	// --- RENDER FUNCTION FOR SEARCH TAB ---
	const renderSearchTab = () => (
		<Box>
			<TextField
				fullWidth
				label="Search Planet Name or Natural ID (min 3 chars)"
				value={searchTerm}
				onChange={(e) => setSearchTerm(e.target.value)}
				onKeyDown={(e) => {
					// Trigger search on Enter key press
					if (e.key === "Enter" && searchTerm.length >= 3) {
						searchPlanets(searchTerm);
					}
				}}
				margin="normal"
				sx={{ mb: 1 }}
				InputProps={{
					endAdornment: isSearching ? (
						<CircularProgress color="inherit" size={20} />
					) : (
						<IconButton
							onClick={() => searchPlanets(searchTerm)}
							disabled={searchTerm.length < 3}
							color="primary"
						>
							<SearchIcon />
						</IconButton>
					),
				}}
			/>

			<Divider sx={{ my: 2 }} />

			{!selectedPlanet ||
				(searchResults.length > 0 &&
					(searchResults.length > 0 ? (
						<List sx={{ maxHeight: 300, overflowY: "auto", p: 0 }}>
							<Typography
								variant="subtitle2"
								sx={{ ml: 1, mb: 1, color: "text.secondary" }}
							>
								Found {searchResults.length} results. Click to select.
							</Typography>
							{searchResults.map((planet) => (
								<ListItem
									key={planet.planetid}
									component="button"
									onClick={() => handleSearchPlanetSelection(planet)}
									sx={{
										border: `1px solid ${theme.palette.divider}`,
										borderRadius: 1,
										mb: 0.5,
										background: "transparent",
										"&:hover": {
											bgcolor: theme.palette.action.selected,
										},
									}}
								>
									<ListItemText
										primary={
											<Box
												sx={{
													display: "flex",
													justifyContent: "space-between",
													alignItems: "center",
												}}
											>
												<Typography
													variant="body1"
													sx={{ fontWeight: "bold", color: accentColor }}
												>
													{planet.name} ({planet.naturalid})
												</Typography>
												<Typography variant="caption" color="textSecondary">
													{planet.system.sector.name} / {planet.system.name}
												</Typography>
											</Box>
										}
										secondary={`In System ${planet.system.name}, Sector ${planet.system.sector.name}`}
									/>
								</ListItem>
							))}
						</List>
					) : searchTerm.length >= 3 && !isSearching ? (
						<Typography
							color="textSecondary"
							sx={{ textAlign: "center", py: 3 }}
						>
							No planets found matching your query.
						</Typography>
					) : (
						<Typography
							color="textSecondary"
							sx={{ textAlign: "center", py: 3 }}
						>
							Type at least 3 characters and press Enter or the search icon to
							find a planet by name or ID.
						</Typography>
					)))}
		</Box>
	);
	// --- END RENDER FUNCTION FOR SEARCH TAB ---

	// --- MAIN RENDER ---
	return (
		<Modal open={open} onClose={onClose}>
			<Box sx={modalStyle}>
				<Box sx={{ borderBottom: 1, borderColor: "divider", px: 3, pt: 2 }}>
					<Typography
						variant="h6"
						component="h2"
						sx={{
							mb: 1,
							fontWeight: "bold",
							color: theme.palette.primary.light,
						}}
					>
						{isEdit ? "Edit Production Node" : "Add New Production Node"}
					</Typography>
				</Box>

				{/* ------------------------------------------------------------------ */}
				{/* TAB 0: NODE DETAILS & SITE (UNCHANGED) */}
				{/* ------------------------------------------------------------------ */}
				<TabPanel value={tabValue} index={0}>
					<Box sx={{ display: "flex", gap: 2, mb: 3 }}>
						{/* Material Ticker */}
						<Autocomplete
							options={materialOptions}
							value={materialTicker}
							onChange={(_event, newValue) => {
								setMaterialTicker(newValue || "");
								setError("");
							}}
							renderInput={(params) => (
								<TextField
									{...params}
									label="Material Ticker"
									variant="outlined"
									fullWidth
									required
								/>
							)}
							sx={{ flex: 1 }}
							disabled={isEdit}
						/>
						{/* Production Rate (Derived) */}
						<TextField
							label={`Net Production Rate (${
								selectedMaterial?.ticker + "/d" || "u/h"
							})`}
							variant="outlined"
							fullWidth
							type="text"
							value={productionRate}
							disabled={true}
							error={!!error}
							sx={{ flex: 1, ...calculatedInputStyle }}
						/>
						<TextField
							label={`Site name`}
							variant="outlined"
							fullWidth
							type="text"
							onChange={(e) => setSiteName(e.target.value)}
							value={siteName}
							error={!!error}
							sx={{ flex: 1, ...calculatedInputStyle }}
						/>
					</Box>

					<Divider />
					<Box
						sx={{
							display: "flex",
							flexDirection: "row",
							gap: 2, // Adds space between the two columns (e.g., 16px)
							width: "100%", // Ensures the outer box takes up available width
						}}
					>
						{/* LEFT COLUMN: Planet Search/Selection (Fixed 50% width) */}
						<Box sx={{ flexShrink: 0, width: "50%" }}>
							{renderSearchTab()}
							{selectedPlanet && (
								<Box
									sx={{
										mt: 1,
										p: 1,
										borderRadius: 1,
										borderLeft: `4px solid ${accentColor}`,
										bgcolor: "action.hover",
									}}
								>
									<Typography variant="subtitle2" color="textSecondary">
										Selected Location:
									</Typography>
									<Typography variant="body1" sx={{ fontWeight: "bold" }}>
										{selectedSector?.name} / {selectedSystem?.name} /{" "}
										{selectedPlanet.name}
									</Typography>
								</Box>
							)}
						</Box>

						{/* RIGHT COLUMN: Recipe Selector (Fills remaining space) */}
						<Box sx={{ flexGrow: 1, minWidth: 0 }}>
							{" "}
							{/* flexGrow: 1 ensures it consumes the rest of the space */}
							<RecipeSelector
								material={selectedMaterial}
								selectedRecipe={selectedRecipe}
								onSelectRecipe={handleSelectRecipe}
							/>
						</Box>
					</Box>
				</TabPanel>

				<Box>
					<Box sx={{ display: "flex", gap: 1, mb: 2, p: 1 }}>
						<Autocomplete
							freeSolo
							options={
								groupMembers.filter(
									(m) => !userFlowInputs.some((uf) => uf.uid === m.uid),
								) as GroupMember[]
							}
							getOptionLabel={(member) => {
								if (typeof member === "string") {
									return member;
								}
								return member.displayName || member.username;
							}}
							value={userToAdd}
							onInputChange={(_event, newInputValue) => {
								setManualInputText(newInputValue);
							}}
							onChange={(_event, newValue) => {
								if (typeof newValue === "string") {
									const username = newValue.trim();
									setUserToAdd(
										username
											? {
													uid: username,
													username,
													displayName: username,
													role: "viewer",
												}
											: null,
									);
								} else if (newValue) {
									setUserToAdd(newValue);
								} else {
									setUserToAdd(null);
								}
							}}
							inputValue={manualInputText}
							renderInput={(params) => (
								<TextField
									{...params}
									label="Select or Type Username"
									variant="outlined"
									size="small"
									fullWidth
								/>
							)}
							isOptionEqualToValue={(option, value) => option.uid === value.uid}
							sx={{ flexGrow: 1 }}
						/>
						<Button
							variant="contained"
							onClick={() => {
								let userObjectToAdd = userToAdd;
								const manualUsername = manualInputText.trim();
								if (
									manualUsername &&
									(!userObjectToAdd || typeof userObjectToAdd === "string")
								) {
									userObjectToAdd = {
										uid: manualUsername,
										username: manualUsername,
										displayName: manualUsername,
										role: "viewer",
									};
								}
								if (userObjectToAdd) {
									handleAddUserToFlow(userObjectToAdd);
									setManualInputText("");
									setUserToAdd(null);
								}
							}}
							disabled={!manualInputText.trim()}
							startIcon={<AddIcon />}
							size="medium"
							color="secondary"
						>
							Add
						</Button>
					</Box>

					{/* List of Editable User Flows (remains the same) */}
					<List
						sx={{
							maxHeight: 350,
							overflowY: "auto",
							border: `1px solid ${theme.palette.divider}`,
							borderRadius: 1,
							background: theme.palette.background.paper,
						}}
					>
						{userFlowInputs.length === 0 ? (
							<ListItem>
								<ListItemText secondary="No members assigned to this node." />
							</ListItem>
						) : (
							userFlowInputs.map((flow, _index) => (
								<ListItem
									key={flow.uid}
									sx={{
										alignItems: "center",
										py: 0.5,
									}}
								>
									<ListItemText
										primary={flow.displayName}
										primaryTypographyProps={{ fontWeight: "medium" }}
										sx={{ minWidth: 120, flexGrow: 1 }}
									/>
									<FormControl sx={{ mx: 1, minWidth: 130 }} size="small">
										<InputLabel>Type</InputLabel>
										<Select
											value={flow.type}
											label="Type"
											onChange={(e) =>
												handleFlowChange(
													flow.uid,
													"type",
													e.target.value as "Produce" | "Consume",
												)
											}
										>
											<MenuItem value="Produce">
												<Factory
													sx={{ mr: 1, color: theme.palette.success.main }}
													fontSize="small"
												/>{" "}
												Produce
											</MenuItem>
											<MenuItem value="Consume">
												<LocalShipping
													sx={{ mr: 1, color: theme.palette.error.main }}
													fontSize="small"
												/>{" "}
												Consume
											</MenuItem>
										</Select>
									</FormControl>

									<TextField
										label="Rate"
										type="text"
										size="small"
										value={flow.rate}
										onChange={(e) =>
											handleFlowChange(flow.uid, "rate", e.target.value)
										}
										sx={{ m: 1, width: 80 }}
									/>
									<Typography
										variant="body2"
										color="text.secondary"
										sx={{ ml: 0.5, minWidth: 30 }}
									>
										{selectedMaterial?.ticker || "k/h"}
									</Typography>

									<IconButton
										edge="end"
										aria-label="delete"
										onClick={() => handleRemoveFlowUser(flow.uid)}
										sx={{ ml: 1 }}
									>
										<DeleteIcon color="error" fontSize="small" />
									</IconButton>
								</ListItem>
							))
						)}
					</List>
				</Box>

				<Box
					sx={{
						p: 2,
						pt: 1,
						borderTop: `1px solid ${theme.palette.divider}`,
						display: "flex",
						gap: 1,
					}}
				>
					<Button
						variant="contained"
						sx={{
							flex: 1, // Takes up equal space
							background: theme.palette.primary.dark,
							"&:hover": {
								background: theme.palette.primary.light,
								opacity: 0.9,
							},
						}}
						onClick={handleSave}
						startIcon={<Save />}
						size="large"
						disabled={
							!selectedSector ||
							!selectedSystem ||
							!selectedPlanet ||
							!materialTicker ||
							!siteName
						}
					>
						{isEdit ? "Save Changes" : "Add Node"}
					</Button>
					<Button
						variant="outlined"
						onClick={onClose}
						sx={{ flex: 1 }} // Takes up equal space
						startIcon={<CloseIcon />}
						size="large"
					>
						Cancel
					</Button>
				</Box>
			</Box>
		</Modal>
	);
};

export const NodeAdditionModal: React.FC<
	Omit<NodeBaseModalProps, "initialData" | "isEdit" | "onSave"> & {
		onAddNode: (nodeData: ChainNodeData) => void;
	}
> = ({ open, onClose, onAddNode, materials, groupMembers }) => (
	<NodeBaseModal
		open={open}
		onClose={onClose}
		onSave={onAddNode}
		materials={materials}
		initialData={null}
		isEdit={false}
		groupMembers={groupMembers}
	/>
);

export const NodeEditModal: React.FC<
	Omit<NodeBaseModalProps, "isEdit" | "onSave"> & {
		onSaveEdit: (nodeData: ChainNodeData) => void;
		nodeData: ChainNodeData | null;
	}
> = ({ open, onClose, onSaveEdit, materials, groupMembers, nodeData }) => (
	<NodeBaseModal
		open={open}
		onClose={onClose}
		onSave={onSaveEdit}
		materials={materials}
		initialData={nodeData}
		isEdit={true}
		groupMembers={groupMembers}
	/>
);
