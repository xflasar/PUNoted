import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Box,
	Typography,
	TextField,
	Button,
	CircularProgress,
	Paper,
	IconButton,
	Select,
	MenuItem,
	FormControl,
	Grid,
	InputLabel,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { Search } from "@mui/icons-material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import { v4 as uuidv4 } from "uuid";
import { PlusCircle } from "lucide-react";
import React from "react";
import MaterialBadge from "../components/materialbadge";
import { pickPrice } from "./utils/pickprice";

// --- INTERFACES ---
interface Material {
	materialid: string;
	ticker: string;
	askprice: number;
	corpprice?: number;
	quantity: number;
}

interface OrderItem {
	orderid?: string;
	materialid: string;
	materialticker: string;
	ordertype?: "buy" | "sell" | undefined;
	fixedprice: number;
	quantity: number;
	frontendId?: string;
	isDisabled?: boolean;
	vendorname: string;
	gamename: string;
	vendorid: string;
	reserved: number;
	instore: number;
}

interface VendorStore {
	vendor: {
		vendorid: string;
		companycode: string;
		companyname: string;
		corpname: string;
		gamename: string;
		isactive: boolean;
		cx: string;
	};
	orders: OrderItem[];
}

// --- LAYOUT STABILITY HELPER ---
const getCellWidth = (index: number, isAvailable: boolean): string => {
	if (isAvailable) {
		// Available Materials Table (4 columns: Ticker, Price, In Store, Add)
		if (index === 0) return "20%"; // Ticker
		if (index === 1) return "25%"; // Price
		if (index === 2) return "25%"; // In Store
		if (index === 3) return "20%"; // Add (Icon button)
	} else {
		// Buy/Sell Orders Table (6 columns: Ticker, Type, Price, Reserve, In Store, Remove)
		if (index === 0) return "10%"; // Ticker
		if (index === 1) return "15%"; // Type
		if (index === 2) return "23%"; // Price (Made wider for TextField)
		if (index === 3) return "17%"; // Reserve
		if (index === 4) return "15%"; // In Store
		if (index === 5) return "10%"; // Remove (Icon button)
	}
	return "auto";
};

// --- MEMOIZED ROW COMPONENT ---
/**
 * Props for the OrderItemRow component.
 */
interface OrderItemRowProps {
	/** The material order to display */
	material: OrderItem;
	/** Indicates if this is in the available materials table vs buy/sell orders */
	isAvailableMaterials: boolean;
	/** Callback to remove a material from orders */
	onRemoveMaterial: (
		frontendId: string | undefined,
		type: "buy" | "sell" | undefined,
	) => void;
	/** Callback to edit a specific field of an order */
	onEditMaterial: (
		frontendId: string | undefined,
		field: "ordertype" | "fixedprice" | "reserved",
		value: string | number,
	) => void;
	/** Callback to add a material to the orders */
	onAddMaterial: (material: OrderItem, type: "buy" | "sell") => void;
	/** Indicates if there is already an order of the opposite type for this material */
	hasOtherOrderType: boolean;
}

/**
 * Highly-memoized row component for rendering a single order or available material.
 *
 * @param {OrderItemRowProps} props - The component props.
 * @returns {React.ReactElement | null} The rendered row.
 */
const OrderItemRow: React.FC<OrderItemRowProps> = memo(
	({
		material,
		isAvailableMaterials,
		onRemoveMaterial,
		onEditMaterial,
		onAddMaterial,
		hasOtherOrderType,
	}) => {
		const theme = useTheme();

		// Logic for Buy/Sell table rows
		if (!isAvailableMaterials) {
			const isOrderTypeDisabled = hasOtherOrderType;

			return (
				<Box
					key={material.frontendId || material.materialticker}
					sx={{
						display: "flex",
						width: "100%",
						alignItems: "center",
						borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
						padding: "8px 0px",
						gap: "10px",
						"&:hover": {
							bgcolor: "rgba(255,255,255,0.02)",
						},
					}}
				>
					<Box
						sx={{
							color: theme.palette.text.primary,
							width: getCellWidth(0, false),
							textAlign: "center",
						}}
					>
						<Typography variant="body2">
							<MaterialBadge ticker={material.materialticker} />
						</Typography>
					</Box>
					<Box
						sx={{
							color: theme.palette.text.primary,
							width: getCellWidth(1, false),
							textAlign: "center",
						}}
					>
						<FormControl variant="standard" fullWidth>
							<Select
								size="small"
								variant="outlined"
								value={material.ordertype}
								onChange={(e) =>
									onEditMaterial(
										material.frontendId,
										"ordertype",
										e.target.value as "buy" | "sell",
									)
								}
								disabled={isOrderTypeDisabled}
								sx={{
									color: theme.palette.text.primary,
									".MuiSelect-icon": { color: theme.palette.primary.light },
									"& .MuiOutlinedInput-notchedOutline": {
										borderColor: theme.palette.primary.dark,
									},
									"&:hover .MuiOutlinedInput-notchedOutline": {
										borderColor: theme.palette.primary.light,
									},
									"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
										borderColor: "rgb(123, 104, 238)",
									},
								}}
								MenuProps={{
									PaperProps: {
										sx: {
											background: theme.palette.background.paper,
											border: "1px solid rgba(123, 104, 238, 0.5)",
											boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
											zIndex: 9999,
										},
									},
								}}
							>
								<MenuItem
									value="buy"
									sx={{
										color: theme.palette.text.primary,
										"&:hover": {
											color: "white",
											bgcolor: "rgba(123, 104, 238, 0.2)",
										},
									}}
								>
									Buy
								</MenuItem>
								<MenuItem
									value="sell"
									sx={{
										color: theme.palette.text.primary,
										"&:hover": {
											color: "white",
											bgcolor: "rgba(123, 104, 238, 0.2)",
										},
									}}
								>
									Sell
								</MenuItem>
							</Select>
						</FormControl>
					</Box>
					<Box
						sx={{
							color: theme.palette.text.primary,
							width: getCellWidth(2, false),
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<TextField
							size="small"
							variant="outlined"
							type="text"
							value={material.fixedprice}
							onChange={(e) =>
								onEditMaterial(
									material.frontendId,
									"fixedprice",
									parseFloat(e.target.value) || 0,
								)
							}
							InputProps={{
								inputProps: {
									style: { textAlign: "center" },
								},
							}}
							sx={{
								width: "100%",
								"& .MuiOutlinedInput-root": {
									color: theme.palette.text.primary,
									borderColor: theme.palette.primary.light,
								},
								"& .MuiOutlinedInput-notchedOutline": {
									borderColor: theme.palette.primary.dark,
								},
								"&:hover .MuiOutlinedInput-notchedOutline": {
									borderColor: theme.palette.primary.light,
								},
							}}
						/>
					</Box>
					<Box
						sx={{
							color: theme.palette.text.primary,
							width: getCellWidth(3, false),
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<TextField
							size="small"
							variant="outlined"
							type="text"
							value={material.reserved}
							onChange={(e) =>
								onEditMaterial(
									material.frontendId,
									"reserved",
									parseFloat(e.target.value) || 0,
								)
							}
							InputProps={{
								inputProps: {
									style: { textAlign: "center" },
								},
							}}
							sx={{
								width: "100%",
								"& .MuiOutlinedInput-root": {
									color: theme.palette.text.primary,
									borderColor: theme.palette.primary.light,
								},
								"& .MuiOutlinedInput-notchedOutline": {
									borderColor: theme.palette.primary.dark,
								},
								"&:hover .MuiOutlinedInput-notchedOutline": {
									borderColor: theme.palette.primary.light,
								},
							}}
						/>
					</Box>
					<Box sx={{ width: getCellWidth(4, false), textAlign: "center" }}>
						<Typography variant="body2">{material.instore}</Typography>
					</Box>
					<Box sx={{ width: getCellWidth(5, false), textAlign: "center" }}>
						<IconButton
							aria-label="remove"
							onClick={() =>
								onRemoveMaterial(material?.frontendId, material.ordertype)
							}
						>
							<DeleteIcon sx={{ color: theme.palette.error.main }} />
						</IconButton>
					</Box>
				</Box>
			);
		}

		// Logic for Available Materials table rows
		if (isAvailableMaterials) {
			return (
				<Box
					key={material.frontendId || material.materialticker}
					sx={{
						display: "flex",
						width: "100%",
						alignItems: "center",
						borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
						padding: "8px 0px",
						gap: "10px",
						"&:hover": {
							bgcolor: "rgba(255,255,255,0.02)",
						},
					}}
				>
					<Box
						sx={{
							color: theme.palette.text.primary,
							width: getCellWidth(0, true),
							textAlign: "center",
						}}
					>
						<Typography variant="body2">
							<MaterialBadge ticker={material.materialticker} />
						</Typography>
					</Box>
					<Box sx={{ width: getCellWidth(1, true), textAlign: "center" }}>
						<Typography variant="body2">{material.fixedprice}</Typography>
					</Box>
					<Box sx={{ width: getCellWidth(2, true), textAlign: "center" }}>
						<Typography variant="body2">{material.instore}</Typography>
					</Box>
					<Box
						sx={{
							width: getCellWidth(3, true),
							textAlign: "center",
							display: "flex",
							justifyContent: "center",
						}}
					>
						<IconButton
							edge="end"
							aria-label="add-buy"
							onClick={() => onAddMaterial(material, "buy")}
							disabled={material.isDisabled}
						>
							<AddCircleIcon
								sx={{
									color: material.isDisabled
										? theme.palette.error.dark
										: theme.palette.success.light,
								}}
							/>
						</IconButton>
					</Box>
				</Box>
			);
		}

		return null;
	},
	(prevProps, nextProps) => {
		// 1. Check if the core material data changed (using JSON.stringify as a deep-ish check for simplicity)
		const materialChanged =
			JSON.stringify(prevProps.material) !== JSON.stringify(nextProps.material);

		// 2. Check if the status affecting the button/select changed
		const isDisabledChanged =
			prevProps.material.isDisabled !== nextProps.material.isDisabled;
		const hasOtherOrderTypeChanged =
			prevProps.hasOtherOrderType !== nextProps.hasOtherOrderType;

		return !(materialChanged || isDisabledChanged || hasOtherOrderTypeChanged);
	},
);

interface MaterialTableProps {
	materials: OrderItem[];
	allOrders: OrderItem[]; // Needed only for the context of determining disabled state
	onRemoveMaterial: (
		frontendId: string | undefined,
		type: "buy" | "sell" | undefined,
	) => void;
	onEditMaterial: (
		frontendId: string | undefined,
		field: "ordertype" | "fixedprice" | "reserved",
		value: string | number,
	) => void;
	onAddMaterial: (material: OrderItem, type: "buy" | "sell") => void;
	isAvailableMaterials: boolean;
	title: string;
}

const MaterialTable: React.FC<MaterialTableProps> = memo(
	({
		materials,
		allOrders,
		onRemoveMaterial,
		onEditMaterial,
		onAddMaterial,
		isAvailableMaterials,
		title,
	}) => {
		const theme = useTheme();

		const orderHeaders = [
			{ label: "Ticker", widthIndex: 0 },
			{ label: "Type", widthIndex: 1 },
			{ label: "Price", widthIndex: 2 },
			{ label: title === "Buy Orders" ? "Max Buy" : "Reserve", widthIndex: 3 },
			{ label: "In Store", widthIndex: 4 },
			{ label: "Remove", widthIndex: 5 },
		];

		const availableHeaders = [
			{ label: "Ticker", widthIndex: 0 },
			{ label: "Price", widthIndex: 1 },
			{ label: "In Store", widthIndex: 2 },
			{ label: "Add", widthIndex: 3 },
		];

		const headers = isAvailableMaterials ? availableHeaders : orderHeaders;

		const tickerToOtherOrderTypeMap = useMemo(() => {
			const map = new Map<string, boolean>();
			if (!isAvailableMaterials) {
				materials.forEach((m) => {
					const otherTypeExists = allOrders.some(
						(o) =>
							o.materialticker === m.materialticker &&
							o.ordertype !== m.ordertype,
					);
					map.set(m.frontendId || m.materialticker, otherTypeExists);
				});
			}
			return map;
		}, [materials, allOrders, isAvailableMaterials]);

		return (
			<Paper
				sx={{
					p: 2,
					background: theme.palette.background.paper,
					boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
					borderRadius: "15px",
					display: "flex",
					flexDirection: "column",
					flexGrow: 1,
					minHeight: isAvailableMaterials ? "auto" : "calc(50% - 8px)",
					overflow: "hidden",
				}}
			>
				{title !== "" && (
					<Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
						<Typography
							variant="h6"
							sx={{ color: theme.palette.primary.main, textAlign: "center" }}
						>
							{title}
						</Typography>
					</Box>
				)}

				{/* Table Header */}
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						padding: "8px 0px",
						color: theme.palette.primary.main,
						fontWeight: "bold",
						position: "sticky",
						top: 0,
						zIndex: 1,
						borderRadius: "4px 4px 0 0",
						gap: "10px",
					}}
				>
					{headers.map((header) => (
						<Box
							key={header.label}
							sx={{
								width: getCellWidth(header.widthIndex, isAvailableMaterials),
								textAlign: "center",
								whiteSpace: "nowrap",
								flexShrink: 0,
							}}
						>
							<Typography
								variant="body2"
								sx={{ color: theme.palette.primary.main, fontWeight: "bold" }}
							>
								{header.label}
							</Typography>
						</Box>
					))}
				</Box>
				<Box sx={{ flexGrow: 1, overflowY: "auto" }}>
					{materials.length === 0 ? (
						<Box
							sx={{
								color: "rgba(255, 255, 255, 0.6)",
								width: "100%",
								textAlign: "center",
								padding: "16px",
							}}
						>
							No materials found.
						</Box>
					) : (
						materials.map((material: OrderItem) => (
							<OrderItemRow
								key={material.frontendId || material.materialticker}
								material={material}
								isAvailableMaterials={isAvailableMaterials}
								onRemoveMaterial={onRemoveMaterial}
								onEditMaterial={onEditMaterial}
								onAddMaterial={onAddMaterial}
								hasOtherOrderType={
									tickerToOtherOrderTypeMap.get(
										material.frontendId || material.materialticker,
									) || false
								}
							/>
						))
					)}
				</Box>
			</Paper>
		);
	},
	(prevProps, nextProps) => {
		return (
			prevProps.materials === nextProps.materials &&
			prevProps.allOrders === nextProps.allOrders
		);
	},
);

/**
 * Parses the FIO inventory CSV based on the fixed column format provided:
 * [0: User], [1: ShortCode], [2: Location], [3: StoreType], [4: Ticker], [5: Amount]
 * and returns a map of Ticker (Col 4) to Quantity (Col 5).
 */
const parseFioInventoryCsv = (
	csvText: string,
	//locationFilter: string
): Map<string, number> => {
	// Split into lines, filter out empty lines
	const lines = csvText.split("\n").filter((line) => line.trim() !== "");
	if (lines.length === 0) return new Map();

	const inventoryMap = new Map<string, number>();

	// Location filter can be 'HRT' or 'Hortus Station'
	const shortCodeFilter = "HRT";
	const locationNameFilter = "Hortus Station";

	// The data rows start from the first line (since the FIO output often doesn't have a header line)
	for (let i = 0; i < lines.length; i++) {
		// Use a simple split since your data doesn't seem to contain quoted commas
		const values = lines[i].split(",");
		if (values.length >= 6) {
			const shortCode = values[1].trim();
			const locationName = values[2].trim();
			const ticker = values[4].trim();
			const amount = parseFloat(values[5].trim());

			// Check if the material is at Hortus Station (using either short code or full name)
			const isHortus =
				shortCode === shortCodeFilter || locationName === locationNameFilter;

			// Filter by location and ensure valid data
			if (isHortus && ticker && !isNaN(amount)) {
				// FIO often lists fractional amounts (e.g. 5.0), we store the integer amount
				inventoryMap.set(ticker, Math.floor(amount));
			}
		}
	}

	return inventoryMap;
};

const cleanLocalStorageString = (value: string | null): string => {
	if (value === null || value === "null" || value === "undefined") {
		return "";
	}
	return value;
};

const VendorCreationModal: React.FC<{
	open: boolean;
	handleClose: () => void;
	setVendorStore: React.Dispatch<React.SetStateAction<VendorStore | null>>;
	vendorStore: VendorStore | null;
	onVendorCreated: (vendorStore: VendorStore) => void;
}> = ({ vendorStore, open, handleClose, setVendorStore, onVendorCreated }) => {
	const theme = useTheme();
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [materials, setMaterials] = useState<OrderItem[]>([]);
	const [buyOrders, setBuyOrders] = useState<OrderItem[]>([]);
	const [sellOrders, setSellOrders] = useState<OrderItem[]>([]);
	const [searchQuery, setSearchQuery] = useState("");

	const [localCompanyName, setLocalCompanyName] = useState(
		vendorStore?.vendor.companyname || "",
	);
	const [localCompanyCode, setLocalCompanyCode] = useState(
		vendorStore?.vendor.companycode || "",
	);
	const [localCorpName, setLocalCorpName] = useState(
		vendorStore?.vendor.corpname || "",
	);
	const [localGameName, setLocalGameName] = useState(
		vendorStore?.vendor.gamename || "",
	);
	const [localCx, setLocalCx] = useState(vendorStore?.vendor.cx || "IC1");
	const CX_OPTIONS = ["AI1", "CI2", "CI1", "IC1", "NC2", "NC1"];

	// 1. Initialize local buy/sell states and vendor fields from vendorStore
	useEffect(() => {
		// Initialize local vendor fields
		setLocalCompanyName(
			cleanLocalStorageString(localStorage.getItem("companyName")),
		);
		setLocalCompanyCode(
			cleanLocalStorageString(localStorage.getItem("companyCode")),
		);
		setLocalCorpName(
			cleanLocalStorageString(localStorage.getItem("corporationName")),
		);
		setLocalGameName(
			cleanLocalStorageString(localStorage.getItem("displayName")),
		);
		setLocalCx("IC1");
	}, []);

	// 2. Memoize all orders to create a stable reference for MaterialTable and OrderItemRow
	const allOrders = useMemo(
		() => [...buyOrders, ...sellOrders],
		[buyOrders, sellOrders],
	);

	// 3. Fetch materials and update instore quantity
	useEffect(() => {
		const fetchMaterials = async () => {
			if (!open) return;

			try {
				// --- STEP 1: Fetch materials from your internal API ---
				const response = await fetch(
					"https://api.punoted.net/materials_price_list",
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${localStorage.getItem("authToken")}`,
						},
						body: JSON.stringify({ cx: localCx }),
					},
				);

				if (response.ok) {
					const data = await response.json();

					// Initialize maps and available materials list from internal API data
					const instoreMap = new Map<string, number>();
					const availablematerials: OrderItem[] = data.materials.map(
						(mat: Material) => {
							const resolvedCorpPrice = pickPrice({
								fixedprice: -1,
								corpprice: mat.corpprice,
								cxprice: mat.askprice,
							}).price;
							instoreMap.set(mat.materialid, mat.quantity); // Material ID -> Quantity
							return {
								materialid: mat.materialid,
								materialticker: mat.ticker,
								fixedprice: resolvedCorpPrice,
								frontendId: uuidv4(),
								isDisabled: false,
								instore: mat.quantity, // Initial quantity
								reserved: 0,
								quantity: 0,
								vendorname: vendorStore?.vendor.companyname,
								gamename: vendorStore?.vendor.gamename,
								vendorid: vendorStore?.vendor.vendorid,
							};
						},
					);

					// --- STEP 2: Check and Fetch FIO Data ---
					// TODO: Get rid of this and use only PUNoted data "Does this even work???"
					const fioApiKey = localStorage.getItem("fioApiKey");
					const displayName = localStorage.getItem("displayName");
					let finalInstoreMap = instoreMap;

					if (fioApiKey && displayName) {
						console.log("FIO credentials found. Fetching inventory...");
						const fioUrl = `https://rest.fnar.net/csv/inventory?apikey=${fioApiKey}&username=${displayName}`;

						try {
							const fioResponse = await fetch(fioUrl);
							if (fioResponse.ok) {
								const csvText = await fioResponse.text();
								// Filter for Hortus Station and get Ticker -> Quantity map
								const fioInventoryMap = parseFioInventoryCsv(
									csvText,
									//"Hortus Station"
								);

								// Merge FIO inventory into the map, overriding internal data
								finalInstoreMap = new Map(instoreMap);
								fioInventoryMap.forEach((fioQuantity, materialTicker) => {
									// Find the corresponding materialid from the internal list using the ticker
									const materialToUpdate = availablematerials.find(
										(m) => m.materialticker === materialTicker,
									);
									if (materialToUpdate) {
										// Override the instore quantity using material ID as the key
										finalInstoreMap.set(
											materialToUpdate.materialid,
											fioQuantity,
										);
									}
								});
								console.log("FIO data successfully merged for Hortus Station.");
							} else {
								console.warn(
									"Failed to fetch FIO inventory:",
									fioResponse.status,
								);
							}
						} catch (fioErr) {
							console.error("Error fetching or processing FIO data:", fioErr);
						}
					}

					// --- STEP 3: Update State using the finalInstoreMap ---

					// 1. Update existing orders in vendorStore
					setVendorStore((prevStore) => {
						if (!prevStore) return null;

						const updatedOrders = prevStore.orders.map((order) => {
							const instoreQuantity =
								finalInstoreMap.get(order.materialid) || 0;
							return {
								...order,
								instore: instoreQuantity,
							};
						});

						return {
							...prevStore,
							orders: updatedOrders,
						};
					});

					// 2. Update available materials list
					const finalAvailableMaterials = availablematerials.map((mat) => {
						const instoreQuantity = finalInstoreMap.get(mat.materialid) || 0;
						return {
							...mat,
							instore: instoreQuantity,
						};
					});
					setMaterials(finalAvailableMaterials);
				} else {
					// Handle case where internal API fetch failed
					setMaterials([]);
					console.error(
						"Failed to fetch materials with status:",
						response.status,
					);
				}
			} catch (err) {
				console.error("Failed to fetch materials:", err);
			}
		};

		if (localCx && open) {
			fetchMaterials();
		}
	}, [open, localCx]);

	// 4. Handle Adding Materials
	const handleAddMaterial = useCallback(
		(material: OrderItem, type: "buy" | "sell" = "buy") => {
			// Check for existing order of the requested type in the combined list
			const existingOrder = allOrders.find(
				(mat) =>
					mat.materialticker === material.materialticker &&
					mat.ordertype === type,
			);

			if (existingOrder) {
				console.warn(
					`Attempted to add duplicate ${type} order for ${material.materialticker}`,
				);
				return;
			}

			const newOrder: OrderItem = {
				...material,
				ordertype: type,
				frontendId: uuidv4(),
				// New orders start with default price and reserved
				fixedprice: material.fixedprice || 100,
				reserved: 0,
				orderid: undefined, // Explicitly set to undefined for new local orders
			};

			if (type === "buy") {
				setBuyOrders((prev) => [...prev, newOrder]);
			} else {
				setSellOrders((prev) => [...prev, newOrder]);
			}
		},
		[allOrders],
	);

	// 5. Handle Editing Materials
	const handleEditMaterial = useCallback(
		(
			frontendId: string | undefined,
			field: "ordertype" | "fixedprice" | "reserved",
			value: string | number,
		) => {
			if (field === "ordertype") {
				const newType = value as "buy" | "sell";
				const oldType = newType === "buy" ? "sell" : "buy";

				// Determine which list currently holds the item (the list with the old type)
				const listToFilter = oldType === "buy" ? buyOrders : sellOrders;
				const setterToFilter = oldType === "buy" ? setBuyOrders : setSellOrders;
				const setterToAdd = newType === "buy" ? setBuyOrders : setSellOrders;

				// 1. Find the item to move from the current state
				const orderToMove = listToFilter.find(
					(o) => o.frontendId === frontendId,
				);

				if (orderToMove) {
					// 2. Remove the item from the old list
					setterToFilter((prevOrders) =>
						prevOrders.filter((o) => o.frontendId !== frontendId),
					);

					// 3. Add the item to the new list with the updated type
					setterToAdd((prev) => [
						...prev,
						{ ...orderToMove, ordertype: newType },
					]);
				}
			} else {
				// Update price or reserved fields in both lists (only one will contain the ID)
				setBuyOrders((prev) =>
					prev.map((order) =>
						order.frontendId === frontendId
							? { ...order, [field]: value as number }
							: order,
					),
				);
				setSellOrders((prev) =>
					prev.map((order) =>
						order.frontendId === frontendId
							? { ...order, [field]: value as number }
							: order,
					),
				);
			}
		},
		[buyOrders, sellOrders, setBuyOrders, setSellOrders],
	);

	// 6. Handle Removing Materials
	const handleRemoveMaterial = useCallback(
		(frontendId: string | undefined, type: "buy" | "sell" | undefined) => {
			if (type === "buy") {
				setBuyOrders((prev) => {
					return prev.filter((o) => o.frontendId !== frontendId);
				});
			} else if (type === "sell") {
				setSellOrders((prev) => {
					return prev.filter((o) => o.frontendId !== frontendId);
				});
			}
		},
		[],
	);

	// 7. Filter and Mark Available Materials
	const filteredAndMarkedMaterials: OrderItem[] = useMemo(() => {
		const lowerCaseQuery = searchQuery.toLowerCase();

		return materials
			.filter((m) => m.materialticker.toLowerCase().includes(lowerCaseQuery))
			.map((m) => {
				const hasBuyOrder = buyOrders.some(
					(mat) => mat.materialticker === m.materialticker,
				);
				const hasSellOrder = sellOrders.some(
					(mat) => mat.materialticker === m.materialticker,
				);

				return {
					...m,
					// Disable if both buy and sell orders exist for the material
					isDisabled: hasBuyOrder && hasSellOrder,
				};
			});
	}, [searchQuery, materials, buyOrders, sellOrders]);

	// 8. Handle Save Action
	const handleSave = async () => {
		setIsSaving(true);
		setError(null);

		// 1. Trim all local state variables before validation and payload creation
		const trimmedCompanyName = localCompanyName ? localCompanyName.trim() : "";
		const trimmedGameName = localGameName ? localGameName.trim() : "";
		const trimmedCompanyCode = localCompanyCode ? localCompanyCode.trim() : "";
		const trimmedCorpName = localCorpName ? localCorpName.trim() : "";
		const trimmedCx = localCx ? localCx.trim() : "";

		// 2. CLIENT-SIDE VALIDATION using trimmed values
		const requiredFields = [
			{ value: trimmedCompanyName, name: "Company Name" },
			{ value: trimmedGameName, name: "Game Name" },
			{ value: trimmedCompanyCode, name: "Company Code" },
			{ value: trimmedCx, name: "CX" },
		];

		for (const field of requiredFields) {
			if (field.value === "") {
				setError(`${field.name} is required.`);
				setIsSaving(false);
				return;
			}
		}
		// --- END VALIDATION ---

		// 3. Use trimmed values in the payload
		const payload = {
			vendor_data: {
				companyname: trimmedCompanyName,
				companycode: trimmedCompanyCode,
				corpname: trimmedCorpName,
				gamename: trimmedGameName,
				cx: trimmedCx,
			},
			materials: allOrders.map((order) => ({
				//orderid: order.orderid ? order.orderid : undefined,
				ticker: order.materialticker,
				orderType: order.ordertype,
				fixedprice: order.fixedprice,
				materialid: order.materialid,
				reserved: order.reserved,
			})),
		};

		try {
			const response = await fetch(
				"https://api.punoted.net/create_vendor_store",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${localStorage.getItem("authToken")}`,
					},
					body: JSON.stringify(payload),
				},
			);

			const result = await response.json();
			if (!response.ok || !result.success) {
				throw new Error(result.message || "Failed to save changes.");
			}

			// Extract the complete vendor store object from the server response
			const newVendorStore = result.vendor_store;

			// Use the complete, server-generated data to update the state.
			onVendorCreated(newVendorStore);

			handleClose();
		} catch (err) {
			console.error("Failed to save vendor store:", err);
			setError(
				`Failed to save changes. ${err instanceof Error ? err.message : ""}`,
			);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<React.Fragment>
			<Dialog
				open={open}
				onClose={handleClose}
				maxWidth="xl"
				slotProps={{
					backdrop: {
						sx: {
							backdropFilter: "blur(5px)",
						},
					},
					paper: {
						sx: {
							background: "transparent",
							backgroundImage: "none",
							boxShadow: "none",
						},
					},
				}}
				fullWidth
			>
				<DialogTitle sx={{ color: theme.palette.primary.main, py: 2 }}>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<PlusCircle />
						Create Vendor Store
					</Box>
				</DialogTitle>
				<DialogContent
					sx={{
						color: theme.palette.primary.main,
						display: "flex",
						flexDirection: "column",
						height: "90vh",
					}}
				>
					{/* Vendor Details Editing Section */}
					<Paper
						sx={{
							p: 3,
							mb: 2,
							background: theme.palette.background.paper,
							boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
							borderRadius: "15px",
						}}
					>
						<Typography
							variant="h6"
							sx={{ color: theme.palette.primary.main, mb: 2 }}
						>
							Vendor Details
						</Typography>
						<Grid container spacing={2}>
							<Box>
								<TextField
									fullWidth
									label="Company Name"
									variant="outlined"
									size="small"
									value={localCompanyName}
									onChange={(e) => setLocalCompanyName(e.target.value)}
									sx={{
										"& .MuiOutlinedInput-root": {
											color: theme.palette.text.primary,
											"& fieldset": { borderColor: theme.palette.primary.dark },
											"&:hover fieldset": {
												borderColor: theme.palette.primary.light,
											},
											"&.Mui-focused fieldset": {
												borderColor: "rgb(123, 104, 238)",
											},
										},
									}}
									InputLabelProps={{
										sx: { color: theme.palette.primary.light },
									}}
								/>
							</Box>
							<Box>
								<TextField
									fullWidth
									label="Game Name"
									variant="outlined"
									size="small"
									value={localGameName}
									onChange={(e) => setLocalGameName(e.target.value)}
									sx={{
										"& .MuiOutlinedInput-root": {
											color: theme.palette.text.primary,
											"& fieldset": { borderColor: theme.palette.primary.dark },
											"&:hover fieldset": {
												borderColor: theme.palette.primary.light,
											},
											"&.Mui-focused fieldset": {
												borderColor: "rgb(123, 104, 238)",
											},
										},
									}}
									InputLabelProps={{
										sx: { color: theme.palette.primary.light },
									}}
								/>
							</Box>
							<Box>
								<TextField
									fullWidth
									label="Company Code"
									variant="outlined"
									size="small"
									value={localCompanyCode}
									onChange={(e) => setLocalCompanyCode(e.target.value)}
									sx={{
										"& .MuiOutlinedInput-root": {
											color: theme.palette.text.primary,
											"& fieldset": { borderColor: theme.palette.primary.dark },
											"&:hover fieldset": {
												borderColor: theme.palette.primary.light,
											},
											"&.Mui-focused fieldset": {
												borderColor: "rgb(123, 104, 238)",
											},
										},
									}}
									InputLabelProps={{
										sx: { color: theme.palette.primary.light },
									}}
								/>
							</Box>
							<Box>
								<TextField
									fullWidth
									label="Corp Name"
									variant="outlined"
									size="small"
									value={localCorpName}
									onChange={(e) => setLocalCorpName(e.target.value)}
									sx={{
										"& .MuiOutlinedInput-root": {
											color: theme.palette.text.primary,
											"& fieldset": { borderColor: theme.palette.primary.dark },
											"&:hover fieldset": {
												borderColor: theme.palette.primary.light,
											},
											"&.Mui-focused fieldset": {
												borderColor: "rgb(123, 104, 238)",
											},
										},
									}}
									InputLabelProps={{
										sx: { color: theme.palette.primary.light },
									}}
								/>
							</Box>
							<Box>
								<FormControl fullWidth variant="outlined" size="small">
									<InputLabel
										id="cx-select-label"
										sx={{ color: theme.palette.primary.light }}
									>
										CX
									</InputLabel>
									<Select
										labelId="cx-select-label"
										value={localCx}
										onChange={(e) => setLocalCx(e.target.value as string)}
										label="CX"
										sx={{
											color: theme.palette.text.primary,
											"& .MuiOutlinedInput-notchedOutline": {
												borderColor: theme.palette.primary.dark,
											},
											"&:hover .MuiOutlinedInput-notchedOutline": {
												borderColor: theme.palette.primary.light,
											},
											"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
												borderColor: "rgb(123, 104, 238)",
											},
										}}
										MenuProps={{
											PaperProps: {
												sx: {
													background: theme.palette.background.paper,
													border: "1px solid rgba(123, 104, 238, 0.5)",
												},
											},
										}}
									>
										{CX_OPTIONS.map((cx) => (
											<MenuItem
												key={cx}
												value={cx}
												sx={{
													color: theme.palette.text.primary,
													"&:hover": {
														color: "white",
														bgcolor: "rgba(123, 104, 238, 0.2)",
													},
												}}
											>
												{cx}
											</MenuItem>
										))}
									</Select>
								</FormControl>
							</Box>
						</Grid>
					</Paper>

					<Box
						sx={{
							display: "flex",
							gap: 2,
							flexWrap: { xs: "wrap", md: "nowrap" },
							flexGrow: 1,
							overflow: "hidden",
							height: "100%",
						}}
					>
						{/* Left Column (Buy Orders, Sell Orders) */}
						<Box
							sx={{
								display: "flex",
								flexDirection: "column",
								gap: 2,
								flexGrow: 1,
								minWidth: { xs: "100%", md: "40%" },
								maxHeight: { xs: "auto", md: "100%" },
							}}
						>
							{/* Buy Orders */}
							<MaterialTable
								materials={buyOrders}
								allOrders={allOrders}
								onRemoveMaterial={handleRemoveMaterial}
								onEditMaterial={handleEditMaterial}
								onAddMaterial={handleAddMaterial}
								isAvailableMaterials={false}
								title="Bid Orders"
							/>

							{/* Sell Orders */}
							<MaterialTable
								materials={sellOrders}
								allOrders={allOrders}
								onRemoveMaterial={handleRemoveMaterial}
								onEditMaterial={handleEditMaterial}
								onAddMaterial={handleAddMaterial}
								isAvailableMaterials={false}
								title="Ask Orders"
							/>
						</Box>

						{/* Right Column (Available Materials) */}
						<Box
							sx={{
								flexGrow: 1,
								minWidth: { xs: "100%", md: "45%" },
								display: "flex",
								flexDirection: "column",
								maxHeight: { xs: "auto", md: "100%" },
							}}
						>
							<Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
								<Typography
									variant="h6"
									sx={{
										color: theme.palette.primary.main,
										textAlign: "center",
									}}
								>
									Available Materials
								</Typography>
							</Box>
							<TextField
								fullWidth
								variant="outlined"
								placeholder="Search by Tickers"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								size="small"
								InputProps={{
									startAdornment: (
										<Search
											style={{
												marginRight: theme.spacing(1),
												color: theme.palette.primary.main,
											}}
										/>
									),
									sx: {
										background: theme.palette.background.paper,
										color: theme.palette.text.primary,
										py: 0.5,
										mb: 2,
										borderRadius: "24px",
										"& .MuiOutlinedInput-notchedOutline": {
											borderColor: theme.palette.primary.dark,
										},
										"&:hover .MuiOutlinedInput-notchedOutline": {
											borderColor: theme.palette.primary.dark,
										},
										"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
											borderColor: theme.palette.primary.main,
										},
									},
								}}
							/>
							<MaterialTable
								materials={filteredAndMarkedMaterials}
								onAddMaterial={handleAddMaterial}
								isAvailableMaterials={true}
								allOrders={allOrders}
								onRemoveMaterial={handleRemoveMaterial}
								onEditMaterial={handleEditMaterial}
								title={""}
							/>
						</Box>
					</Box>

					{error && (
						<Box
							sx={{
								color: theme.palette.error.main,
								mt: 2,
								textAlign: "center",
							}}
						>
							<Typography variant="body2">{error}</Typography>
						</Box>
					)}
					<DialogActions
						sx={{ bgcolor: "transparent", mt: 2, justifyContent: "center" }}
					>
						<Button
							onClick={handleClose}
							disabled={isSaving}
							color="inherit"
							sx={{
								color: "white",
							}}
						>
							Cancel
						</Button>
						<Button
							onClick={handleSave}
							variant="contained"
							disabled={isSaving}
							sx={{
								background: theme.palette.primary.dark,
								"&:hover": { background: theme.palette.primary.light },
							}}
						>
							{isSaving ? (
								<CircularProgress size={24} color="inherit" />
							) : (
								"Create Store"
							)}
						</Button>
					</DialogActions>
				</DialogContent>
			</Dialog>
		</React.Fragment>
	);
};

export default VendorCreationModal;
