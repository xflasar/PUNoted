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
	Card,
} from "@mui/material";
import {
	Save,
	Close as CloseIcon,
	Add as AddIcon,
	Delete as DeleteIcon,
	Search as SearchIcon,
} from "@mui/icons-material";
import {
	type NodeBaseModalProps,
	type ChainNodeData,
	type GroupMember,
	type SectorOption,
	type PlanetOption,
	type SystemOption,
	type InputRecipe,
	type NodeType,
	type NodeAssignedUser,
} from "./types";
import { COLOR_CONSTANTS, getTickerColor, debounce } from "./helpers";
import { v4 as uuidv4 } from "uuid";
import { RecipeSelector } from "./components/inputrecipe";
import { BaseManager } from "../../components/basemanager/basemanager";

interface SearchResultPlanet {
	planetid: string;
	name: string;
	naturalid: string;
	system: {
		systemid: string;
		name: string;
		sector: { externalsectorid: string; name: string };
	};
}

const NodeBaseModal: React.FC<NodeBaseModalProps> = ({
	open,
	onClose,
	onSave,
	materials,
	initialData,
	isEdit,
	groupMembers,
	staticData,
}) => {
	const [materialTicker, setMaterialTicker] = useState(
		initialData?.materialTicker || "",
	);
	const [siteName, setSiteName] = useState(initialData?.siteName || "New-Site");
	const [description, setDescription] = useState(
		initialData?.description || "",
	);
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

	const [nodeType, setNodeType] = useState<NodeType>(
		initialData?.nodeType || "Normal",
	);

	const [assignedUsers, setAssignedUsers] = useState<NodeAssignedUser[]>(
		initialData?.assignedUsers || [],
	);
	const [assignedUserToAdd, setAssignedUserToAdd] =
		useState<GroupMember | null>(null);
	const [assignedManualInputText, setAssignedManualInputText] =
		useState<string>("");

	const [selectedSector, setSelectedSector] = useState<SectorOption | null>(
		null,
	);
	const [selectedSystem, setSelectedSystem] = useState<SystemOption | null>(
		null,
	);
	const [selectedPlanet, setSelectedPlanet] = useState<PlanetOption | null>(
		null,
	);

	const [searchTerm, setSearchTerm] = useState<string>("");
	const [searchResults, setSearchResults] = useState<SearchResultPlanet[]>([]);
	const [isSearching, setIsSearching] = useState<boolean>(false);
	const [selectedRecipe, setSelectedRecipe] = useState<InputRecipe | null>(
		null,
	);

	const [manualTons, setManualTons] = useState<number>(
		initialData?.transport?.manualTons || 0,
	);
	const [manualVolume, setManualVolume] = useState<number>(
		initialData?.transport?.manualVolume || 0,
	);
	const [userShips, setUserShips] = useState<any[]>(
		initialData?.transport?.userShips || [],
	);
	const [newShipUser, setNewShipUser] = useState("");
	const [newShipName, setNewShipName] = useState("");
	const [newShipTons, setNewShipTons] = useState("");
	const [newShipVolume, setNewShipVolume] = useState("");

	const handleSelectRecipe = (
		recipe: React.SetStateAction<InputRecipe | null>,
	) => setSelectedRecipe(recipe);

	const materialOptions = useMemo(
		() => materials.map((m) => m.ticker),
		[materials],
	);
	const selectedMaterial = useMemo(
		() => materials.find((m) => m.ticker === materialTicker),
		[materials, materialTicker],
	);
	const accentColor = useMemo(
		() =>
			selectedMaterial
				? getTickerColor(selectedMaterial.ticker)
				: theme.palette.secondary.main,
		[selectedMaterial, theme.palette.secondary.main],
	);

	const MOCK_RECIPES = [
		{
			id: "R-FEO",
			name: "Extract FEO",
			duration: 1000,
			ticker: "FEO",
			inputs: [],
			outputs: [{ ticker: "FEO", amount: 1 }],
		},
		{
			id: "R-FE",
			name: "Smelt FE",
			duration: 1000,
			ticker: "FE",
			inputs: [{ ticker: "FEO", amount: 10 }],
			outputs: [{ ticker: "FE", amount: 1 }],
		},
		{
			id: "R-STL",
			name: "Make STL",
			duration: 1000,
			ticker: "STL",
			inputs: [{ ticker: "FE", amount: 5 }],
			outputs: [{ ticker: "STL", amount: 1 }],
		},
		{
			id: "R-AIR",
			name: "Assemble AIR",
			duration: 1000,
			ticker: "AIR",
			inputs: [{ ticker: "STL", amount: 10 }],
			outputs: [{ ticker: "AIR", amount: 1 }],
		},
	];

	useEffect(() => {
		if (initialData) {
			setMaterialTicker(initialData.materialTicker);
			setSiteName(initialData.siteName);
			setDescription(initialData.description || "");
			setNodeType(initialData.nodeType || "Normal");
			setAssignedUsers(initialData.assignedUsers || []);
			setError("");

			setManualTons(initialData.transport?.manualTons || 0);
			setManualVolume(initialData.transport?.manualVolume || 0);
			setUserShips(initialData.transport?.userShips || []);

			const recipe =
				materials
					.find((mat) => mat.ticker === initialData.materialTicker)
					?.inputRecipes.find(
						(recipe) => recipe.processid === initialData.recipe?.processid,
					) ||
				initialData.recipe ||
				null;
			setSelectedRecipe(recipe);

			setSelectedSector(initialData.sector || null);
			setSelectedSystem(initialData.system || null);
			setSelectedPlanet(initialData.planet || null);
		} else {
			setMaterialTicker("");
			setSiteName("New-Site");
			setDescription("");
			setProductionRate("0.0");
			setNodeType("Normal");
			setAssignedUsers([]);
			setManualTons(0);
			setManualVolume(0);
			setUserShips([]);
			setSelectedSector(null);
			setSelectedSystem(null);
			setSelectedPlanet(null);
			setError("");
		}
	}, [initialData, open, groupMembers, materials]);

	useEffect(() => {
		if (selectedMaterial) {
			const hasInputs = selectedMaterial.inputRecipes.some(
				(r) => r.inputs.length > 0,
			);
			if (!hasInputs) setNodeType("Starter");
			else if (!isEdit) setNodeType("Normal");
		}
	}, [selectedMaterial, isEdit]);

	useEffect(() => {
		if (!selectedRecipe) return;

		let totalProd = 0;
		let totalCons = 0;

		assignedUsers.forEach((user) => {
			if (user.baseData.status === "uninitialized") return;

			user.baseData.platforms.forEach((p) => {
				if (!p.activeRecipes || p.activeRecipes.length === 0) return;

				const validRecipes = p.activeRecipes
					.map((id) => {
						if (
							selectedRecipe &&
							(selectedRecipe.id === id ||
								(selectedRecipe as any).processid === id)
						)
							return selectedRecipe;
						const r = materials
							.find((m) => m.ticker === materialTicker)
							?.inputRecipes.find((r) => r.processid === id || r.id === id);
						if (r) return r;
						return MOCK_RECIPES.find((mr) => mr.id === id);
					})
					.filter(Boolean);

				if (validRecipes.length === 0) return;

				let totalLoopDuration = 0;
				validRecipes.forEach(
					(r: any) =>
						(totalLoopDuration +=
							r.duration || (r.durationmillis ? r.durationmillis / 1000 : 1)),
				);

				if (totalLoopDuration > 0) {
					const loopsPerDay = (86400 / totalLoopDuration) * p.amount;
					validRecipes.forEach((recipe: any) => {
						recipe.inputs?.forEach((input: any) => {
							if (
								selectedRecipe.inputs[0] &&
								input.ticker === selectedRecipe.inputs[0].ticker
							)
								totalCons += input.amount * loopsPerDay;
						});
						recipe.outputs?.forEach((output: any) => {
							if (output.ticker === materialTicker)
								totalProd += output.amount * loopsPerDay;
						});
					});
				}
			});
		});

		setProductionRate(totalProd.toFixed(1));
		setConsumptionRate(totalCons.toFixed(1));
		setNetRate((totalProd - totalCons).toFixed(1));
	}, [assignedUsers, materialTicker, selectedRecipe, materials]);

	const searchPlanets = useCallback(async (query: string) => {
		if (query.length < 2) {
			setSearchResults([]);
			return;
		}
		setIsSearching(true);
		setTimeout(() => {
			setSearchResults([
				{
					planetid: `mock-planet-${query}-1`,
					name: `${query.toUpperCase()} Prime`,
					naturalid: `${query.substring(0, 2).toUpperCase()}-01`,
					system: {
						systemid: "sys-1",
						name: "Dev System Alpha",
						sector: { externalsectorid: "sec-1", name: "Dev Sector One" },
					},
				},
				{
					planetid: `mock-planet-${query}-2`,
					name: `${query.toUpperCase()} Secundus`,
					naturalid: `${query.substring(0, 2).toUpperCase()}-02`,
					system: {
						systemid: "sys-2",
						name: "Dev System Beta",
						sector: { externalsectorid: "sec-2", name: "Dev Sector Two" },
					},
				},
			]);
			setIsSearching(false);
		}, 400);
	}, []);

	const debouncedSearchPlanets = useMemo(
		() =>
			debounce((q: string) => {
				searchPlanets(q);
			}, 500),
		[searchPlanets],
	);

	const handleSearchPlanetSelection = useCallback(
		(planet: SearchResultPlanet) => {
			setSelectedSector({
				externalsectorid: planet.system.sector.externalsectorid,
				name: planet.system.sector.name,
			});
			setSelectedSystem({
				systemid: planet.system.systemid,
				name: planet.system.name,
			});
			setSelectedPlanet({
				planetid: planet.planetid,
				name: planet.name,
				naturalid: planet.naturalid,
			});
			setSearchTerm("");
			setSearchResults([]);
		},
		[],
	);

	const handleAddAssignedUserInit = useCallback(
		(user: GroupMember | null, isManual: boolean, manualName: string) => {
			if (!user && !isManual) return;
			const uid = isManual ? `manual-${Date.now()}` : user!.uid;
			const username = isManual ? manualName : user!.username;
			const displayName = isManual
				? manualName
				: user!.displayName || user!.username;
			if (assignedUsers.some((u) => u.uid === uid || u.username === username))
				return;

			setAssignedUsers((prev) => [
				...prev,
				{
					uid,
					username,
					displayName,
					isRegistered: !isManual,
					baseData: {
						status: "uninitialized",
						permitLevel: 1,
						orderQueue: [],
						platforms: [],
						infrastructure: [],
						plannedEdits: [],
					},
				},
			]);
		},
		[assignedUsers],
	);

	const handleRemoveAssignedUser = (uid: string) =>
		setAssignedUsers((prev) => prev.filter((u) => u.uid !== uid));
	const handleUpdateAssignedUser = (updatedUser: NodeAssignedUser) =>
		setAssignedUsers((prev) =>
			prev.map((u) => (u.uid === updatedUser.uid ? updatedUser : u)),
		);

	const handleSave = () => {
		if (!materialTicker || !selectedMaterial) {
			setError("Material Ticker is required.");
			return;
		}
		if (!siteName) {
			setError("Site Name is required.");
			return;
		}
		if (!selectedSector || !selectedSystem || !selectedPlanet) {
			setError("Location is required.");
			return;
		}
		if (!selectedRecipe) {
			setError("A recipe must be selected.");
			return;
		}

		const finalNodeId = isEdit ? initialData!.nodeId : uuidv4();

		const newNodeData: ChainNodeData = {
			nodeId: finalNodeId,
			nodeType,
			assignedUsers,
			materialTicker,
			description,
			locked: false,
			recipe: selectedRecipe,
			isResource: selectedMaterial!.resource,
			isEndMaterial: selectedMaterial!.requiredFor.length > 0 ? false : true,
			siteName: siteName.trim() || "Untitled-Site",
			sector: selectedSector,
			system: selectedSystem,
			planet: selectedPlanet,
			productionRate: parseFloat(productionRate),
			productionUnit: `${materialTicker}/d`,
			statusColor: COLOR_CONSTANTS.GREY_TEXT,
			netFlow: parseFloat(netRate),
			consumptionRatio: parseFloat(consumptionRate),
			productionBuilding: selectedMaterial!.production_building,
			transport: { manualTons, manualVolume, userShips },
			userFlows: [],
			userStorage: [],
			position: initialData?.position,
			supply: {},
			inputStatus: false,
		};

		onSave(newNodeData);
		onClose();
	};

	const modalStyle = {
		position: "absolute" as const,
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		width: "100%",
		height: "100%",
		bgcolor: "background.default",
		borderTop: `4px solid ${accentColor}`,
		display: "flex",
		flexDirection: "column",
		overflow: "hidden",
		zIndex: 1300,
	};

	const renderSearchTab = () => (
		<Box>
			<TextField
				fullWidth
				size="small"
				label="Search Planet Name or Natural ID (min 2 chars)"
				value={searchTerm}
				onChange={(e) => {
					const val = e.target.value;
					setSearchTerm(val);
					if (val.length >= 2) {
						setIsSearching(true);
						debouncedSearchPlanets(val);
					} else {
						setSearchResults([]);
						setIsSearching(false);
					}
				}}
				margin="normal"
				sx={{ mb: 1 }}
				InputProps={{
					endAdornment: isSearching ? (
						<CircularProgress color="inherit" size={20} />
					) : (
						<IconButton disabled color="primary">
							<SearchIcon />
						</IconButton>
					),
				}}
			/>

			{searchTerm.length >= 2 ? (
				searchResults.length > 0 ? (
					<List sx={{ maxHeight: 200, overflowY: "auto", p: 0, mb: 2 }}>
						<Typography
							variant="subtitle2"
							sx={{
								ml: 1,
								mb: 1,
								color: "text.secondary",
								fontSize: "0.75rem",
							}}
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
									"&:hover": { bgcolor: theme.palette.action.selected },
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
												variant="body2"
												sx={{ fontWeight: "bold", color: accentColor }}
											>
												{planet.name} ({planet.naturalid})
											</Typography>
											<Typography variant="caption" color="textSecondary">
												{planet.system.sector.name} / {planet.system.name}
											</Typography>
										</Box>
									}
								/>
							</ListItem>
						))}
					</List>
				) : !isSearching ? (
					<Typography
						color="textSecondary"
						sx={{ textAlign: "center", py: 2, fontSize: "0.8rem" }}
					>
						No planets found matching your query.
					</Typography>
				) : null
			) : !selectedPlanet ? (
				<Typography
					color="textSecondary"
					sx={{ textAlign: "center", py: 2, fontSize: "0.8rem" }}
				>
					Type at least 2 characters to find a planet by name or ID.
				</Typography>
			) : null}
		</Box>
	);

	return (
		<Modal
			open={open}
			onClose={onClose}
			disablePortal
			sx={{ position: "absolute", pointerEvents: "auto" }}
			slotProps={{
				backdrop: {
					sx: { position: "absolute", backgroundColor: "background.default" },
				},
			}}
		>
			<Box sx={modalStyle} id="node-modal-root">
				<Box
					sx={{
						borderBottom: 1,
						borderColor: "divider",
						px: 3,
						py: 1.5,
						bgcolor: "background.paper",
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<Typography
						variant="h6"
						component="h2"
						sx={{ fontWeight: "bold", color: theme.palette.primary.light }}
					>
						{isEdit ? "Edit Production Node" : "Add New Production Node"}
					</Typography>
					<IconButton onClick={onClose} size="small">
						<CloseIcon />
					</IconButton>
				</Box>

				<Box
					sx={{
						display: "flex",
						flexGrow: 1,
						overflow: "hidden",
						flexDirection: { xs: "column", md: "row" },
					}}
				>
					{/* LEFT COLUMN: Details & Location */}
					<Box
						sx={{
							flex: 1,
							p: 3,
							borderRight: { md: "1px solid" },
							borderBottom: { xs: "1px solid", md: "none" },
							borderColor: "divider",
							overflowY: "auto",
							display: "flex",
							flexDirection: "column",
							gap: 3,
						}}
					>
						<Box>
							<Typography
								variant="subtitle1"
								fontWeight="bold"
								color="primary.light"
								mb={2}
							>
								Node Details
							</Typography>
							<Box sx={{ display: "flex", gap: 2, mb: 2 }}>
								<Autocomplete
									options={materialOptions}
									value={materialTicker}
									onChange={(_e, v) => {
										setMaterialTicker(v || "");
										setError("");
									}}
									renderInput={(params) => (
										<TextField
											{...params}
											label="Material Ticker"
											variant="outlined"
											size="small"
											fullWidth
											required
										/>
									)}
									sx={{ flex: 1 }}
									disabled={isEdit}
								/>
								<FormControl fullWidth size="small" sx={{ flex: 1 }}>
									<InputLabel>Node Type</InputLabel>
									<Select
										value={nodeType}
										label="Node Type"
										onChange={(e) => setNodeType(e.target.value as NodeType)}
									>
										<MenuItem value="Starter">Starter Node</MenuItem>
										<MenuItem value="Normal">Normal Node</MenuItem>
										<MenuItem value="End">End Node</MenuItem>
									</Select>
								</FormControl>
							</Box>
							<Box sx={{ display: "flex", gap: 2 }}>
								<TextField
									label="Site name"
									variant="outlined"
									size="small"
									fullWidth
									type="text"
									onChange={(e) => setSiteName(e.target.value)}
									value={siteName}
									error={!!error}
									sx={{ flex: 1 }}
								/>
								<TextField
									label="Description (Optional)"
									variant="outlined"
									size="small"
									fullWidth
									type="text"
									onChange={(e) => setDescription(e.target.value)}
									value={description}
									sx={{ flex: 1 }}
								/>
							</Box>
						</Box>

						<Divider />

						<Box>
							<Typography
								variant="subtitle1"
								fontWeight="bold"
								color="primary.light"
								mb={1}
							>
								Location & Recipe
							</Typography>
							{renderSearchTab()}

							{selectedPlanet && (
								<Card
									variant="outlined"
									sx={{
										p: 1.5,
										mb: 2,
										borderLeft: `4px solid ${accentColor}`,
										bgcolor: "action.hover",
									}}
								>
									<Typography
										variant="caption"
										color="textSecondary"
										display="block"
									>
										Selected Location:
									</Typography>
									<Typography variant="body1" sx={{ fontWeight: "bold" }}>
										{selectedSector?.name} / {selectedSystem?.name} /{" "}
										{selectedPlanet.name}
									</Typography>
								</Card>
							)}
							<RecipeSelector
								material={selectedMaterial}
								selectedRecipe={selectedRecipe}
								onSelectRecipe={handleSelectRecipe}
							/>
						</Box>
					</Box>

					{/* RIGHT COLUMN: Assigned Bases & Transport */}
					<Box
						sx={{
							flex: 1,
							overflowY: "auto",
							display: "flex",
							flexDirection: "column",
						}}
					>
						<Box sx={{ p: 3, flexShrink: 0 }}>
							<Typography
								variant="subtitle1"
								fontWeight="bold"
								color="primary.light"
								mb={2}
							>
								Assigned Users & Bases
							</Typography>
							{!selectedPlanet || !selectedRecipe ? (
								<Box
									sx={{
										p: 3,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										border: `1px dashed ${theme.palette.divider}`,
										borderRadius: 1,
									}}
								>
									<Typography color="textSecondary" variant="body2">
										Please select a Location & Recipe first.
									</Typography>
								</Box>
							) : (
								<>
									<Box sx={{ display: "flex", gap: 1, mb: 2 }}>
										<Autocomplete
											freeSolo
											options={groupMembers.filter(
												(m) => !assignedUsers.some((au) => au.uid === m.uid),
											)}
											getOptionLabel={(member) =>
												typeof member === "string"
													? member
													: member.displayName || member.username
											}
											value={assignedUserToAdd}
											onInputChange={(_e, v) => setAssignedManualInputText(v)}
											onChange={(_e, v) => {
												if (typeof v === "string") {
													const un = v.trim();
													setAssignedUserToAdd(
														un
															? {
																	uid: un,
																	username: un,
																	displayName: un,
																	role: "viewer",
																}
															: null,
													);
												} else if (v) setAssignedUserToAdd(v);
												else setAssignedUserToAdd(null);
											}}
											inputValue={assignedManualInputText}
											renderInput={(params) => (
												<TextField
													{...params}
													label="Select or Type Username"
													variant="outlined"
													size="small"
													fullWidth
												/>
											)}
											isOptionEqualToValue={(option, value) =>
												option.uid === value.uid
											}
											sx={{ flexGrow: 1 }}
										/>
										<Button
											variant="contained"
											disabled={!assignedManualInputText.trim()}
											startIcon={<AddIcon />}
											size="medium"
											color="secondary"
											onClick={() => {
												const userObj = assignedUserToAdd;
												let isManual = false;
												const manualName = assignedManualInputText.trim();
												if (!userObj && manualName) isManual = true;
												if (userObj || isManual) {
													handleAddAssignedUserInit(
														userObj as GroupMember,
														isManual,
														manualName,
													);
													setAssignedManualInputText("");
													setAssignedUserToAdd(null);
												}
											}}
										>
											Assign
										</Button>
									</Box>

									<Box
										sx={{
											maxHeight: 300,
											overflowY: "auto",
											border: `1px solid ${theme.palette.divider}`,
											borderRadius: 1,
											bgcolor: "background.default",
										}}
									>
										{assignedUsers.length === 0 ? (
											<Box p={2} textAlign="center">
												<Typography color="textSecondary" variant="body2">
													No bases assigned yet.
												</Typography>
											</Box>
										) : (
											assignedUsers.map((user) => (
												<Box
													key={user.uid}
													sx={{
														borderBottom: `1px solid ${theme.palette.divider}`,
														p: 1.5,
													}}
												>
													<Box
														sx={{
															display: "flex",
															justifyContent: "space-between",
															alignItems: "center",
															mb: 1,
														}}
													>
														<Typography
															variant="subtitle2"
															fontWeight="bold"
															color="primary"
														>
															{user.displayName}'s Base{" "}
															{!user.isRegistered && "(Guest)"}
														</Typography>
														<IconButton
															onClick={() => handleRemoveAssignedUser(user.uid)}
															color="error"
															size="small"
															sx={{ p: 0.5 }}
														>
															<DeleteIcon fontSize="small" />
														</IconButton>
													</Box>
													<BaseManager
														user={user}
														onUpdateUser={handleUpdateAssignedUser}
														currentUserId={
															localStorage.getItem("currentUserId") || ""
														}
														isGroupOwner={true}
														planetName={selectedPlanet?.name}
														materials={materials}
														staticData={staticData}
													/>
												</Box>
											))
										)}
									</Box>
								</>
							)}
						</Box>

						<Divider />

						{selectedPlanet && selectedRecipe && (
							<Box sx={{ p: 3, flexGrow: 1, bgcolor: "background.default" }}>
								<Typography
									variant="subtitle1"
									fontWeight="bold"
									color="primary.light"
									mb={2}
								>
									Logistics & Transport
								</Typography>

								<Box sx={{ display: "flex", gap: 2, mb: 3 }}>
									<TextField
										label="Global Manual Tonnage (t)"
										variant="outlined"
										size="small"
										type="number"
										fullWidth
										value={manualTons}
										onChange={(e) => setManualTons(Number(e.target.value))}
									/>
									<TextField
										label="Global Manual Volume (m³)"
										variant="outlined"
										size="small"
										type="number"
										fullWidth
										value={manualVolume}
										onChange={(e) => setManualVolume(Number(e.target.value))}
									/>
								</Box>

								<Card variant="outlined" sx={{ p: 2 }}>
									<Typography variant="subtitle2" fontWeight="bold" mb={1}>
										Assign User Ships
									</Typography>
									<Box
										sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}
									>
										<Select
											size="small"
											value={newShipUser}
											onChange={(e) => setNewShipUser(e.target.value)}
											displayEmpty
											sx={{ flex: 1, minWidth: 120 }}
										>
											<MenuItem value="" disabled>
												Select User
											</MenuItem>
											{assignedUsers.map((u) => (
												<MenuItem key={u.uid} value={u.username}>
													{u.displayName}
												</MenuItem>
											))}
										</Select>
										<TextField
											size="small"
											label="Ship Name"
											value={newShipName}
											onChange={(e) => setNewShipName(e.target.value)}
											sx={{ flex: 1, minWidth: 100 }}
										/>
										<TextField
											size="small"
											label="Tons"
											type="number"
											value={newShipTons}
											onChange={(e) => setNewShipTons(e.target.value)}
											sx={{ width: 80 }}
										/>
										<TextField
											size="small"
											label="m³"
											type="number"
											value={newShipVolume}
											onChange={(e) => setNewShipVolume(e.target.value)}
											sx={{ width: 80 }}
										/>
										<Button
											variant="contained"
											size="small"
											color="secondary"
											onClick={() => {
												if (
													newShipUser &&
													newShipName &&
													newShipTons &&
													newShipVolume
												) {
													setUserShips([
														...userShips,
														{
															id: uuidv4(),
															username: newShipUser,
															shipName: newShipName,
															tons: Number(newShipTons),
															volume: Number(newShipVolume),
														},
													]);
													setNewShipName("");
													setNewShipTons("");
													setNewShipVolume("");
												}
											}}
										>
											<AddIcon />
										</Button>
									</Box>
									<List
										dense
										disablePadding
										sx={{ borderTop: `1px solid ${theme.palette.divider}` }}
									>
										{userShips.length === 0 ? (
											<ListItem sx={{ py: 1, px: 0 }}>
												<Typography
													variant="caption"
													color="textSecondary"
													sx={{ fontStyle: "italic" }}
												>
													No ships assigned.
												</Typography>
											</ListItem>
										) : (
											userShips.map((s) => (
												<ListItem
													key={s.id}
													sx={{
														borderBottom: `1px solid ${theme.palette.divider}`,
														py: 0.5,
														px: 0,
													}}
												>
													<ListItemText
														primary={`${s.username} - ${s.shipName}`}
														secondary={`${s.tons}t / ${s.volume}m³`}
														primaryTypographyProps={{
															fontSize: "0.8rem",
															fontWeight: "bold",
														}}
														secondaryTypographyProps={{ fontSize: "0.7rem" }}
													/>
													<IconButton
														size="small"
														color="error"
														onClick={() =>
															setUserShips(
																userShips.filter((us) => us.id !== s.id),
															)
														}
													>
														<DeleteIcon fontSize="small" />
													</IconButton>
												</ListItem>
											))
										)}
									</List>
								</Card>
							</Box>
						)}
					</Box>
				</Box>

				<Box
					sx={{
						p: 2,
						borderTop: `1px solid ${theme.palette.divider}`,
						display: "flex",
						justifyContent: "flex-end",
						gap: 2,
						bgcolor: "background.paper",
					}}
				>
					{error && (
						<Typography
							color="error"
							variant="body2"
							sx={{ alignSelf: "center", mr: "auto", fontWeight: "bold" }}
						>
							{error}
						</Typography>
					)}
					<Button variant="outlined" onClick={onClose} size="large">
						Cancel
					</Button>
					<Button
						variant="contained"
						sx={{
							px: 4,
							background: theme.palette.primary.dark,
							"&:hover": { background: theme.palette.primary.light },
						}}
						onClick={handleSave}
						startIcon={<Save />}
						size="large"
						disabled={
							!selectedSector ||
							!selectedSystem ||
							!selectedPlanet ||
							!materialTicker ||
							!siteName ||
							!selectedRecipe
						}
					>
						{isEdit ? "Save Changes" : "Create Node"}
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
> = ({ open, onClose, onAddNode, materials, groupMembers, staticData }) => (
	<NodeBaseModal
		open={open}
		onClose={onClose}
		onSave={onAddNode}
		materials={materials}
		initialData={null}
		isEdit={false}
		groupMembers={groupMembers}
		staticData={staticData}
	/>
);

export const NodeEditModal: React.FC<
	Omit<NodeBaseModalProps, "isEdit" | "onSave"> & {
		onSaveEdit: (nodeData: ChainNodeData) => void;
		nodeData: ChainNodeData | null;
	}
> = ({
	open,
	onClose,
	onSaveEdit,
	materials,
	groupMembers,
	nodeData,
	staticData,
}) => (
	<NodeBaseModal
		open={open}
		onClose={onClose}
		onSave={onSaveEdit}
		materials={materials}
		initialData={nodeData}
		isEdit={true}
		groupMembers={groupMembers}
		staticData={staticData}
	/>
);
