import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Box,
	Typography,
	TextField,
	Button,
	Paper,
	IconButton,
	Tooltip,
	useTheme,
	useMediaQuery,
	Drawer,
	Collapse,
	alpha,
} from "@mui/material";
import {
	ShoppingBasket,
	X,
	Search,
	PlusCircle,
	Trash2,
	ChevronDown,
	ChevronUp,
	ChevronRight,
	ChevronLeft,
	ArrowUp,
	ArrowDown,
	Truck,
	Store,
} from "lucide-react";
import { ContentCopy } from "@mui/icons-material";
import { v4 as uuidv4 } from "uuid";
import PriceComparisonBadge from "./components/PriceComparisonBadge";
import { getDiffStats } from "./utils/priceComparison";
import { pickPrice } from "./utils/pickPrice";
import MaterialBadge from "../components/MaterialBadge";

// --- Types ---
/**
 * Represents an item in an order.
 */
export interface OrderItem {
	materialid: string;
	materialticker: string;
	ordertype?: "buy" | "sell";
	fixedprice: number;
	quantity: number;
	available?: number;
	vendorname: string;
	gamename: string;
	vendorid: string;
	reserved: number;
	price?: {
		fixedprice: number;
		corpprice?: number;
		cxprice?: number;
	};
	location?: Array<{
		location_name?: string;
		location_code?: string;
		available?: number | null;
		amount?: number | null;
		storage_amount?: number | null;
	}>;
}

/**
 * Represents a vendor's store details and their active orders.
 */
export interface VendorStore {
	vendor: {
		vendorid: string;
		companyname: string;
		gamename: string;
	};
	orders: OrderItem[];
}

/**
 * Represents an item added to the shopping list.
 */
interface ShoppingListItem {
	materialid: string;
	materialticker: string;
	quantity: number;
	fixedprice: number;
	frontendId: string;
	vendorPriority: string[];
}

/**
 * Represents a calculated shopping summary item, assigned to a specific vendor.
 */
interface ShoppingSummaryItem {
	vendorid: string;
	vendorname: string;
	gamename: string;
	ticker: string;
	amount: number;
	price: number;
	totalPrice: number;
}

// --- Formatters ---
/**
 * Formats a numeric price into a localized string with "ICA" appended.
 *
 * @param {number | null | undefined} p - The price to format.
 * @returns {string} The formatted price string.
 */
const formatPrice = (p: number | null | undefined): string =>
	p == null || isNaN(p)
		? "N/A"
		: new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(p) +
			" ICA";

/**
 * Formats a numeric amount into a localized string without fraction digits.
 *
 * @param {number | null | undefined} a - The amount to format.
 * @returns {string} The formatted amount string.
 */
const formatAmount = (a: number | null | undefined): string =>
	a == null || isNaN(a)
		? "N/A"
		: new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(a);

const getOrderPrice = (order: {
	fixedprice?: number;
	price?: { fixedprice?: number; corpprice?: number; cxprice?: number };
}) =>
	pickPrice({
		fixedprice: order.price?.fixedprice ?? order.fixedprice,
		corpprice: order.price?.corpprice,
		cxprice: order.price?.cxprice,
	});

// --- COMPONENT: Debounced Input ---
/**
 * A numeric text input component that debounces changes to its value.
 * Useful for quantity inputs that trigger re-calculations.
 *
 * @param {object} props - Component props.
 * @param {number} props.value - The current numeric value.
 * @param {(val: number) => void} props.onChange - Callback fired when the value changes after the debounce delay.
 * @returns {React.ReactElement} The debounced input component.
 */
const DebouncedInput: React.FC<{
	value: number;
	onChange: (val: number) => void;
}> = React.memo(({ value, onChange }) => {
	const [localValue, setLocalValue] = useState<string>(value.toString());

	useEffect(() => {
		setLocalValue(value === 0 ? "0" : value.toString());
	}, [value]);

	useEffect(() => {
		const handler = setTimeout(() => {
			const valStr = localValue === "" ? "0" : localValue;
			const numVal = parseInt(valStr, 10);
			if (!isNaN(numVal) && numVal !== value) {
				onChange(numVal);
			}
		}, 300);

		return () => clearTimeout(handler);
	}, [localValue, onChange, value]);

	return (
		<TextField
			size="small"
			variant="outlined"
			value={localValue}
			onChange={(e) => {
				if (e.target.value === "" || /^\d+$/.test(e.target.value)) {
					setLocalValue(e.target.value);
				}
			}}
			sx={{
				width: "80px",
				"& .MuiInputBase-input": {
					textAlign: "center",
					py: 1,
					fontSize: "1rem",
					fontWeight: "bold",
				},
				"& .MuiOutlinedInput-root": { bgcolor: "rgba(0,0,0,0.2)" },
			}}
		/>
	);
});

// --- COMPONENT: Vendor Priority Selector ---
/**
 * A component allowing users to reorder the priority of vendors for a specific material.
 *
 * @param {object} props - Component props.
 * @param {string} props.ticker - The material ticker symbol.
 * @param {OrderItem[]} props.availableVendors - List of vendors offering the material.
 * @param {string[]} props.currentPriority - The current ordered list of vendor IDs.
 * @param {(newPriority: string[]) => void} props.onUpdatePriority - Callback when the priority changes.
 * @returns {React.ReactElement} The priority selector component.
 */
const VendorPrioritySelector: React.FC<{
	ticker: string;
	availableVendors: OrderItem[];
	currentPriority: string[];
	onUpdatePriority: (newPriority: string[]) => void;
}> = React.memo(({ availableVendors, currentPriority, onUpdatePriority }) => {
	const theme = useTheme();

	const sortedVendors = useMemo(() => {
		const copy = [...availableVendors];
		const pMap = new Map(currentPriority.map((id, idx) => [id, idx]));

		return copy.sort((a, b) => {
			const pA = pMap.get(a.vendorid);
			const pB = pMap.get(b.vendorid);
			if (pA !== undefined && pB !== undefined) return pA - pB;
			if (pA !== undefined) return -1;
			if (pB !== undefined) return 1;
			return getOrderPrice(a).price - getOrderPrice(b).price;
		});
	}, [availableVendors, currentPriority]);

	const moveVendor = useCallback(
		(index: number, direction: -1 | 1) => {
			const newOrder = sortedVendors.map((v) => v.vendorid);
			const targetIndex = index + direction;
			if (targetIndex < 0 || targetIndex >= newOrder.length) return;
			[newOrder[index], newOrder[targetIndex]] = [
				newOrder[targetIndex],
				newOrder[index],
			];
			onUpdatePriority(newOrder);
		},
		[sortedVendors, onUpdatePriority],
	);

	return (
		<Box
			sx={{
				p: 1.5,
				mt: 0.5,
				bgcolor: alpha(theme.palette.background.default, 0.4),
				borderRadius: 2,
				border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
			}}
		>
			{sortedVendors.map((vendor, index) => {
				const isFirst = index === 0;
				const displayPrice = getOrderPrice(vendor).price;
				const locationEntries = (vendor.location || []).map((loc) => ({
					label:
						loc.location_name === loc.location_code
							? loc.location_name
							: `${loc.location_name} (${loc.location_code})`,
					qty: loc.available ?? loc.amount ?? loc.storage_amount,
				}));
				const corpStats = getDiffStats(
					displayPrice,
					vendor.price?.corpprice,
					"ask",
				);
				const cxStats = getDiffStats(
					displayPrice,
					vendor.price?.cxprice,
					"ask",
				);
				return (
					<Box
						key={vendor.vendorid}
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 1.5,
							mb: 0.5,
							p: 1,
							borderRadius: 1.5,
							bgcolor: isFirst
								? alpha(theme.palette.success.main, 0.1)
								: "transparent",
							border: isFirst
								? `1px solid ${alpha(theme.palette.success.main, 0.2)}`
								: "1px solid transparent",
						}}
					>
						<Typography
							variant="body2"
							color="text.secondary"
							fontWeight="bold"
							sx={{ minWidth: 20 }}
						>
							#{index + 1}
						</Typography>

						<Box sx={{ flex: 1, minWidth: 0 }}>
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 1,
									flexWrap: "wrap",
								}}
							>
								<Typography
									variant="body2"
									sx={{
										fontSize: "0.9rem",
										fontWeight: isFirst ? "bold" : "normal",
										color: isFirst ? theme.palette.success.light : "inherit",
									}}
								>
									{vendor.vendorname}
								</Typography>
								{corpStats && (
									<PriceComparisonBadge label="COSM" stats={corpStats} />
								)}
								{cxStats && <PriceComparisonBadge label="CX" stats={cxStats} />}
							</Box>
							<Box
								sx={{
									display: "flex",
									gap: 2,
									flexWrap: "wrap",
									alignItems: "center",
								}}
							>
								<Typography variant="caption" color="text.secondary">
									Price:{" "}
									<Box
										component="span"
										sx={{
											fontWeight: "bold",
											color: theme.palette.warning.main,
										}}
									>
										{displayPrice}
									</Box>{" "}
									ICA
								</Typography>
								{locationEntries.length > 0 ? (
									locationEntries.map((entry, entryIndex) => (
										<Typography
											key={`${vendor.vendorid}-${entryIndex}`}
											variant="caption"
											color="text.secondary"
										>
											{entry.label}:{" "}
											<Box
												component="span"
												sx={{
													fontWeight: "bold",
													color: theme.palette.primary.light,
												}}
											>
												{formatAmount(entry.qty)}
											</Box>
										</Typography>
									))
								) : (
									<Typography variant="caption" color="text.secondary">
										Stock:{" "}
										<Box
											component="span"
											sx={{
												fontWeight: "bold",
												color: theme.palette.primary.light,
											}}
										>
											{formatAmount(vendor.quantity)}
										</Box>
									</Typography>
								)}
							</Box>
						</Box>

						<Box sx={{ display: "flex", flexDirection: "column" }}>
							<IconButton
								size="small"
								disabled={index === 0}
								onClick={() => moveVendor(index, -1)}
								sx={{ p: 0.5 }}
							>
								<ArrowUp size={14} />
							</IconButton>
							<IconButton
								size="small"
								disabled={index === sortedVendors.length - 1}
								onClick={() => moveVendor(index, 1)}
								sx={{ p: 0.5 }}
							>
								<ArrowDown size={14} />
							</IconButton>
						</Box>
					</Box>
				);
			})}
		</Box>
	);
});

// --- COMPONENT: Compact Shopping List Item ---
/**
 * Represents a single item row in the user's active shopping list selection.
 *
 * @param {object} props - Component props.
 * @param {ShoppingListItem} props.item - The shopping list item data.
 * @param {OrderItem[]} props.availableVendors - Vendors available for this item.
 * @param {(val: number) => void} props.onUpdateQty - Callback to update the desired quantity.
 * @param {() => void} props.onRemove - Callback to remove the item from the list.
 * @param {(p: string[]) => void} props.onUpdatePriority - Callback to update vendor priority.
 * @returns {React.ReactElement} The list item component.
 */
const CompactListItem: React.FC<{
	item: ShoppingListItem;
	availableVendors: OrderItem[];
	onUpdateQty: (val: number) => void;
	onRemove: () => void;
	onUpdatePriority: (p: string[]) => void;
}> = React.memo(
	({ item, availableVendors, onUpdateQty, onRemove, onUpdatePriority }) => {
		const theme = useTheme();
		const [expanded, setExpanded] = useState(false);

		// 1. Calculate Total Available Stock
		const totalAvail = useMemo(
			() => availableVendors.reduce((s, v) => s + (v.quantity || 0), 0),
			[availableVendors],
		);

		// 2. Calculate "Contributing Vendors"
		const contributingVendors = useMemo(() => {
			if (availableVendors.length === 0) return [];

			const pMap = new Map(item.vendorPriority.map((id, idx) => [id, idx]));
			const sorted = [...availableVendors].sort((a, b) => {
				const pA = pMap.get(a.vendorid);
				const pB = pMap.get(b.vendorid);
				if (pA !== undefined && pB !== undefined) return pA - pB;
				if (pA !== undefined) return -1;
				if (pB !== undefined) return 1;
				return getOrderPrice(a).price - getOrderPrice(b).price;
			});

			let remainingNeeded = item.quantity;
			const usedVendors: string[] = [];

			for (const vendor of sorted) {
				if (remainingNeeded <= 0) break;
				if (vendor.quantity > 0) {
					usedVendors.push(vendor.gamename || vendor.vendorname);
					remainingNeeded -= vendor.quantity;
				}
			}
			return usedVendors;
		}, [availableVendors, item.vendorPriority, item.quantity]);

		const viaText =
			contributingVendors.length > 0
				? contributingVendors.join(", ")
				: "No Vendors";

		return (
			<Box
				sx={{
					mb: 1.5,
					borderRadius: 2,
					border: `1px solid ${expanded ? alpha(theme.palette.primary.main, 0.3) : alpha(theme.palette.divider, 0.1)}`,
					bgcolor: expanded
						? alpha(theme.palette.background.default, 0.1)
						: "transparent",
					transition: "all 0.2s",
					"&:last-child": { borderBottom: "none" },
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center", p: 1.5, gap: 2 }}>
					<Typography
						variant="body1"
						fontWeight="900"
						sx={{
							width: 60,
							flexShrink: 0,
							fontSize: "1.1rem",
							color: theme.palette.text.primary,
						}}
					>
						<MaterialBadge ticker={item.materialticker} />
					</Typography>

					<Box
						onClick={() => setExpanded(!expanded)}
						sx={{
							flex: 1,
							display: "flex",
							flexDirection: "column",
							justifyContent: "center",
							p: 1,
							borderRadius: 1.5,
							cursor: "pointer",
							border: `1px solid ${expanded ? theme.palette.primary.main : alpha(theme.palette.text.secondary, 0.2)}`,
							bgcolor: expanded
								? alpha(theme.palette.primary.main, 0.08)
								: alpha(theme.palette.background.default, 0.3),
							minWidth: 0,
							"&:hover": {
								bgcolor: alpha(theme.palette.primary.main, 0.05),
								borderColor: theme.palette.primary.main,
							},
						}}
					>
						<Box
							sx={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								mb: 0.5,
							}}
						>
							<Typography
								variant="caption"
								sx={{
									fontWeight: "bold",
									color: theme.palette.primary.main,
									letterSpacing: 0.5,
									fontSize: "0.7rem",
								}}
							>
								SOURCING PRIORITY{" "}
								{expanded ? (
									<ChevronUp
										size={12}
										style={{ display: "inline", verticalAlign: "middle" }}
									/>
								) : (
									<ChevronDown
										size={12}
										style={{ display: "inline", verticalAlign: "middle" }}
									/>
								)}
							</Typography>
							<Typography
								variant="caption"
								sx={{
									fontSize: "0.75rem",
									fontWeight: "medium",
									whiteSpace: "nowrap",
									ml: 1,
								}}
							>
								Supply:{" "}
								<span
									style={{
										color:
											totalAvail < item.quantity
												? theme.palette.error.main
												: theme.palette.success.main,
										fontWeight: "bold",
									}}
								>
									{formatAmount(totalAvail)}
								</span>
							</Typography>
						</Box>

						{/* VIA ROW */}
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 1,
								width: "100%",
							}}
						>
							<Truck
								size={14}
								color={theme.palette.text.secondary}
								style={{ flexShrink: 0 }}
							/>
							<Typography
								variant="body2"
								noWrap
								sx={{
									fontWeight: "bold",
									fontSize: "0.85rem",
									color: theme.palette.text.primary,
									display: "block",
									width: "100%",
								}}
							>
								Via:{" "}
								<span style={{ color: theme.palette.text.secondary }}>
									{viaText}
								</span>
							</Typography>
						</Box>
					</Box>

					<DebouncedInput value={item.quantity} onChange={onUpdateQty} />

					<IconButton
						onClick={onRemove}
						sx={{
							color: "error.main",
							opacity: 0.7,
							p: 1,
							bgcolor: alpha(theme.palette.error.main, 0.05),
							"&:hover": {
								opacity: 1,
								bgcolor: alpha(theme.palette.error.main, 0.2),
							},
						}}
					>
						<Trash2 size={18} />
					</IconButton>
				</Box>

				<Collapse in={expanded}>
					<Box sx={{ px: 2, pb: 2 }}>
						<VendorPrioritySelector
							ticker={item.materialticker}
							availableVendors={availableVendors}
							currentPriority={item.vendorPriority}
							onUpdatePriority={onUpdatePriority}
						/>
					</Box>
				</Collapse>
			</Box>
		);
	},
);

// --- COMPONENT: Summary Group Row ---
/**
 * Renders a group of summary items assigned to a single vendor.
 *
 * @param {object} props - Component props.
 * @param {string} props.vendorName - Vendor's company name.
 * @param {string} props.gameName - Vendor's game name.
 * @param {ShoppingSummaryItem[]} props.items - The list of items calculated to be bought from this vendor.
 * @param {number} props.total - The total cost for this vendor.
 * @returns {React.ReactElement} The vendor summary group component.
 */
const SummaryVendorGroup: React.FC<{
	vendorName: string;
	gameName: string;
	items: ShoppingSummaryItem[];
	total: number;
}> = ({ vendorName, gameName, items, total }) => {
	const theme = useTheme();

	return (
		<Box
			sx={{
				mb: 1.5,
				border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
				borderRadius: 2,
				overflow: "hidden",
				bgcolor: alpha(theme.palette.background.default, 0.2),
			}}
		>
			{/* Header: Vendor Name & Group Total */}
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					p: 1.25,
					bgcolor: alpha(theme.palette.background.default, 0.4),
					borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					<Typography variant="subtitle2" fontWeight="bold">
						{vendorName}
						<Typography
							component="span"
							variant="caption"
							color="text.secondary"
							sx={{ ml: 1 }}
						>
							({gameName})
						</Typography>
					</Typography>
				</Box>
				<Typography variant="subtitle2" fontWeight="bold" color="primary.main">
					{formatPrice(total)}
				</Typography>
			</Box>

			{/* List of Items */}
			<Box sx={{ p: 1 }}>
				{items.map((item, idx) => (
					<Box
						key={idx}
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							mb: 0.8,
							pl: 1.5,
							borderLeft: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
							ml: 0.5,
						}}
					>
						{/* Left: Ticker & Amount */}
						<Typography
							variant="body2"
							color="text.primary"
							sx={{ fontSize: "0.75rem" }}
						>
							<MaterialBadge ticker={item.ticker} />{" "}
							<span style={{ opacity: 0.8, fontWeight: 600 }}>
								x{formatAmount(item.amount)}
							</span>
						</Typography>

						{/* Right: Total Price & Unit Price */}
						<Box sx={{ textAlign: "right" }}>
							<Typography
								variant="body2"
								color="text.secondary"
								sx={{
									fontSize: "0.75rem",
									fontWeight: "bold",
									lineHeight: 1.1,
								}}
							>
								{formatPrice(item.totalPrice)}
							</Typography>
							<Typography
								variant="caption"
								sx={{
									color: theme.palette.text.secondary,
									fontSize: "0.7rem",
									display: "block",
									marginTop: "-1px",
									opacity: 0.5,
								}}
							>
								@ {formatPrice(item.price)}
							</Typography>
						</Box>
					</Box>
				))}
			</Box>
		</Box>
	);
};

// --- COMPONENT: Available Item Row (Price Range + Vendor Count) ---
/**
 * Renders a row indicating a material available for purchase across all vendors.
 *
 * @param {object} props - Component props.
 * @param {any} props.mat - Aggregated material data including price ranges and total stock.
 * @param {(m: any) => void} props.onAdd - Callback to add this material to the shopping list.
 * @param {boolean} [props.isMobile] - Whether the view is currently mobile-sized.
 * @param {() => void} [props.onCloseMobile] - Callback to close the mobile drawer.
 * @returns {React.ReactElement} The available item row component.
 */
const AvailableItemRow: React.FC<{
	mat: any;
	onAdd: (m: any) => void;
	isMobile?: boolean;
	onCloseMobile?: () => void;
}> = React.memo(({ mat, onAdd, isMobile, onCloseMobile }) => {
	// Format price range
	const priceDisplay = useMemo(() => {
		const min = mat.minPrice || mat.fixedprice;
		const max = mat.maxPrice || mat.fixedprice;

		if (min !== max) {
			return (
				<span>
					{new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(
						min,
					)}{" "}
					-{" "}
					{new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(
						max,
					)}{" "}
					ICA
				</span>
			);
		}
		return formatPrice(min);
	}, [mat]);

	return (
		<Box
			sx={{
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				p: 1.5,
				px: 2,
				borderBottom: `1px solid rgba(255,255,255,0.1)`,
				"&:hover": { bgcolor: "rgba(255,255,255,0.03)" },
			}}
		>
			<Box>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					<Typography variant="body2" fontWeight="bold">
						<MaterialBadge ticker={mat.materialticker} />
					</Typography>
					{/* VENDOR COUNT BADGE */}
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 0.5,
							opacity: 0.6,
						}}
					>
						<Store size={12} />
						<Typography variant="caption">
							{mat.vendorCount > 1
								? `${mat.vendorCount} Vendors`
								: `${mat.vendorCount} Vendor`}
						</Typography>
					</Box>
				</Box>
				<Typography variant="caption" color="text.secondary">
					{formatAmount(mat.total_instore)} available
				</Typography>
			</Box>
			<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
				<Typography
					variant="body2"
					color="success.main"
					sx={{ fontWeight: "bold", fontSize: "0.85rem" }}
				>
					{priceDisplay}
				</Typography>
				<IconButton
					size="small"
					onClick={() => {
						onAdd(mat);
						if (isMobile && onCloseMobile) onCloseMobile();
					}}
				>
					<PlusCircle size={20} color="#66bb6a" />
				</IconButton>
			</Box>
		</Box>
	);
});

// --- COMPONENT: Available Materials Panel ---
/**
 * Renders the panel displaying all aggregated available materials.
 *
 * @param {object} props - Component props.
 * @param {any[]} props.materials - Aggregated available materials list.
 * @param {Set<string>} props.selectedTickers - Set of already selected material tickers.
 * @param {(m: any) => void} props.onAdd - Callback to add material to the shopping list.
 * @param {boolean} [props.isMobile] - Whether the view is mobile.
 * @param {() => void} [props.onCloseMobile] - Callback to close the mobile view.
 * @param {boolean} [props.isCollapsed] - Whether the panel is currently collapsed (desktop).
 * @param {() => void} [props.onToggleCollapse] - Callback to toggle the collapse state.
 * @returns {React.ReactElement} The available materials panel.
 */
const AvailableMaterialsPanel: React.FC<{
	materials: any[];
	selectedTickers: Set<string>;
	onAdd: (m: any) => void;
	isMobile?: boolean;
	onCloseMobile?: () => void;
	isCollapsed?: boolean;
	onToggleCollapse?: () => void;
}> = React.memo(
	({
		materials,
		selectedTickers,
		onAdd,
		isMobile,
		onCloseMobile,
		isCollapsed,
		onToggleCollapse,
	}) => {
		const [search, setSearch] = useState("");

		const filtered = useMemo(() => {
			const terms = search
				.toLowerCase()
				.split(",")
				.map((t) => t.trim())
				.filter((t) => t);
			return materials.filter((m) => {
				if (selectedTickers.has(m.materialticker)) return false;
				if (terms.length === 0) return true;
				return terms.some((t) => m.materialticker.toLowerCase().includes(t));
			});
		}, [search, materials, selectedTickers]);

		if (!isMobile && isCollapsed) {
			return (
				<Box
					sx={{
						width: "100%",
						height: "100%",
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						pt: 1,
						gap: 2,
					}}
				>
					<IconButton onClick={onToggleCollapse} sx={{ mb: 1 }}>
						<ChevronLeft />
					</IconButton>
					<Typography
						variant="caption"
						sx={{
							writingMode: "vertical-rl",
							textOrientation: "mixed",
							letterSpacing: 2,
							fontWeight: "bold",
							color: "text.secondary",
							userSelect: "none",
						}}
					>
						ADD ITEMS
					</Typography>
					<Search size={20} style={{ opacity: 0.5, marginTop: 10 }} />
				</Box>
			);
		}

		return (
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					height: "100%",
					p: isMobile ? 2 : 0,
				}}
			>
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						p: isMobile ? 0 : 1.5,
						pb: isMobile ? 2 : 1.5,
						borderBottom: isMobile ? 0 : `1px solid rgba(255,255,255,0.1)`,
					}}
				>
					<Typography
						variant="subtitle2"
						fontWeight="bold"
						color="primary.main"
					>
						AVAILABLE MATERIALS
					</Typography>
					<Box>
						{isMobile ? (
							<IconButton onClick={onCloseMobile}>
								<X size={20} />
							</IconButton>
						) : (
							<IconButton size="small" onClick={onToggleCollapse}>
								<ChevronRight size={18} />
							</IconButton>
						)}
					</Box>
				</Box>

				<Box sx={{ p: isMobile ? 0 : 2, pb: 1 }}>
					<TextField
						fullWidth
						variant="outlined"
						placeholder="Search ticker..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						size="small"
						InputProps={{
							startAdornment: (
								<Search size={16} style={{ marginRight: 8, opacity: 0.5 }} />
							),
							sx: { borderRadius: 4, bgcolor: "rgba(0,0,0,0.2)" },
						}}
					/>
				</Box>

				<Box sx={{ flex: 1, overflowY: "auto" }}>
					{filtered.map((mat) => (
						<AvailableItemRow
							key={mat.frontendId}
							mat={mat}
							onAdd={onAdd}
							isMobile={isMobile}
							onCloseMobile={onCloseMobile}
						/>
					))}
					{filtered.length === 0 && (
						<Typography
							variant="body2"
							color="text.secondary"
							align="center"
							sx={{ mt: 2, opacity: 0.7 }}
						>
							{materials.length === 0
								? "No materials available"
								: "No items found"}
						</Typography>
					)}
				</Box>
			</Box>
		);
	},
);

// --- MAIN COMPONENT ---
/**
 * Modal providing a shopping interface across multiple vendors' sell orders.
 * Computes optimal sourcing and summarizes costs automatically.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.open - Whether the modal is visible.
 * @param {() => void} props.handleClose - Callback to close the modal.
 * @param {VendorStore[]} props.vendors - The list of all known vendor stores to source from.
 * @param {boolean} props.isLoggedIn - Whether the current user is logged in.
 * @returns {React.ReactElement} The shopping list modal component.
 */
const ShoppingListModal: React.FC<{
	open: boolean;
	handleClose: () => void;
	vendors: VendorStore[];
	isLoggedIn: boolean;
}> = ({ open, handleClose, vendors, isLoggedIn }) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));

	// State management
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
	const [shoppingSummary, setShoppingSummary] = useState<ShoppingSummaryItem[]>(
		[],
	);
	const [isCopied, setIsCopied] = useState(false);

	// UI states
	const [showMobileAdd, setShowMobileAdd] = useState(false);
	const [isSelectionOpen, setIsSelectionOpen] = useState(true);
	const [isSummaryOpen, setIsSummaryOpen] = useState(true);
	const [isMaterialsOpen, setIsMaterialsOpen] = useState(true);

	// 1. Memoize All Sell Orders
	const allSellOrders = useMemo(() => {
		return vendors.flatMap((v) =>
			v.orders
				.filter((o) => o.ordertype === "sell")
				.map((o) => {
					const rawStock = o.available !== undefined ? o.available : o.quantity;
					const reserved = o.reserved || 0;
					const actualAvailable = Math.max(0, rawStock - reserved);

					return {
						...o,
						quantity: actualAvailable,
						fixedprice: getOrderPrice(o).price,
						vendorid: v.vendor.vendorid,
						vendorname: v.vendor.companyname,
						gamename: v.vendor.gamename,
					};
				}),
		);
	}, [vendors]);

	// 2. Inventory Map Cache
	const inventoryMap = useMemo(() => {
		const map: { [ticker: string]: OrderItem[] } = {};
		allSellOrders.forEach((o) => {
			if (!map[o.materialticker]) map[o.materialticker] = [];
			map[o.materialticker].push(o);
		});
		Object.values(map).forEach((list) =>
			list.sort((a, b) => getOrderPrice(a).price - getOrderPrice(b).price),
		);
		return map;
	}, [allSellOrders]);

	// 3. Aggregate for Available Materials (Min/Max + Vendor Count)
	const availableMaterials = useMemo(() => {
		const agg = allSellOrders.reduce(
			(acc, order) => {
				const orderPrice = getOrderPrice(order).price;
				if (!acc[order.materialticker]) {
					acc[order.materialticker] = {
						...order,
						total_instore: 0,
						frontendId: uuidv4(),
						minPrice: orderPrice,
						maxPrice: orderPrice,
						vendors: new Set(), // Track unique vendors
					};
				}
				// Update Totals & Vendor Set
				acc[order.materialticker].total_instore += order.quantity;
				acc[order.materialticker].vendors.add(order.vendorid);

				// Update Price Range
				if (orderPrice < acc[order.materialticker].minPrice) {
					acc[order.materialticker].minPrice = orderPrice;
				}
				if (orderPrice > acc[order.materialticker].maxPrice) {
					acc[order.materialticker].maxPrice = orderPrice;
				}

				// Keep "fixedprice" as cheapest for default add
				if (orderPrice < acc[order.materialticker].fixedprice) {
					acc[order.materialticker].fixedprice = orderPrice;
				}
				return acc;
			},
			{} as { [key: string]: any },
		);

		// Convert Set to count before returning
		return Object.values(agg).map((item) => ({
			...item,
			vendorCount: item.vendors.size,
		}));
	}, [allSellOrders]);

	// 4. Selected Tickers Set
	const selectedTickers = useMemo(
		() => new Set(shoppingList.map((i) => i.materialticker)),
		[shoppingList],
	);

	// --- ACTIONS ---

	const handleAdd = useCallback(
		(mat: any) => {
			setShoppingList((prev) => {
				if (prev.some((i) => i.materialticker === mat.materialticker))
					return prev;
				return [
					...prev,
					{
						materialid: mat.materialid,
						materialticker: mat.materialticker,
						quantity: 1,
						fixedprice: mat.fixedprice, // Defaults to lowest
						frontendId: uuidv4(),
						vendorPriority: [],
					},
				];
			});
			if (!isSelectionOpen && !isMobile) setIsSelectionOpen(true);
		},
		[isSelectionOpen, isMobile],
	);

	const handleUpdateQty = useCallback((id: string, qty: number) => {
		setShoppingList((prev) => {
			if (qty < 0) qty = 0;
			return prev.map((i) =>
				i.frontendId === id ? { ...i, quantity: qty } : i,
			);
		});
	}, []);

	const handleUpdatePriority = useCallback(
		(id: string, newPriority: string[]) => {
			setShoppingList((prev) =>
				prev.map((i) =>
					i.frontendId === id ? { ...i, vendorPriority: newPriority } : i,
				),
			);
		},
		[],
	);

	const handleRemove = useCallback((id: string) => {
		setShoppingList((prev) => prev.filter((i) => i.frontendId !== id));
	}, []);

	// --- DEBOUNCED CALCULATION ENGINE ---
	useEffect(() => {
		const timer = setTimeout(() => {
			const summary: ShoppingSummaryItem[] = [];
			let insufficient = false;

			for (const item of shoppingList) {
				if (item.quantity <= 0) continue;

				const sourceOrders = inventoryMap[item.materialticker];
				if (!sourceOrders || sourceOrders.length === 0) {
					insufficient = true;
					continue;
				}

				const orders = sourceOrders.map((o) => ({ ...o }));

				if (item.vendorPriority.length > 0) {
					const pMap = new Map(item.vendorPriority.map((id, idx) => [id, idx]));
					orders.sort((a, b) => {
						const pA = pMap.get(a.vendorid);
						const pB = pMap.get(b.vendorid);
						if (pA !== undefined && pB !== undefined) return pA - pB;
						if (pA !== undefined) return -1;
						if (pB !== undefined) return 1;
						return getOrderPrice(a).price - getOrderPrice(b).price;
					});
				}

				let needed = item.quantity;
				for (const order of orders) {
					if (needed <= 0) break;
					if (order.quantity <= 0) continue;

					const take = Math.min(needed, order.quantity);
					const displayPrice = getOrderPrice(order).price;
					summary.push({
						vendorid: order.vendorid,
						vendorname: order.vendorname,
						gamename: order.gamename,
						ticker: order.materialticker,
						amount: take,
						price: displayPrice,
						totalPrice: take * displayPrice,
					});
					order.quantity -= take;
					needed -= take;
				}
				if (needed > 0) insufficient = true;
			}

			setShoppingSummary(summary);
			setError(
				insufficient ? "Warning: Not enough stock for full order." : null,
			);
		}, 75);

		return () => clearTimeout(timer);
	}, [shoppingList, inventoryMap]);

	// Calculate Grouped Summary for Display
	const groupedSummary = useMemo(() => {
		const groups: {
			[vendorId: string]: {
				vendorName: string;
				gameName: string;
				items: ShoppingSummaryItem[];
				total: number;
			};
		} = {};

		shoppingSummary.forEach((item) => {
			if (!groups[item.vendorid]) {
				groups[item.vendorid] = {
					vendorName: item.vendorname,
					gameName: item.gamename,
					items: [],
					total: 0,
				};
			}
			groups[item.vendorid].items.push(item);
			groups[item.vendorid].total += item.totalPrice;
		});

		return Object.values(groups);
	}, [shoppingSummary]);

	// --- UTILS ---
	const handleCopy = async () => {
		const grouped = shoppingSummary.reduce((acc, i) => {
			if (!acc[i.vendorid]) acc[i.vendorid] = { ...i, items: [], total: 0 };
			acc[i.vendorid].items.push(i);
			acc[i.vendorid].total += i.totalPrice;
			return acc;
		}, {} as any);

		const total = shoppingSummary.reduce((s, i) => s + i.totalPrice, 0);
		let text = "--- Shopping Summary ---\n";
		Object.values(grouped).forEach((g: any) => {
			text += `\nVendor: ${g.vendorname} (${g.gamename})\n`;
			g.items.forEach(
				(i: any) =>
					(text += ` - ${i.ticker}: ${formatAmount(i.amount)} @ ${formatPrice(i.price)} = ${formatPrice(i.totalPrice)}\n`),
			);
			text += ` Vendor Total: ${formatPrice(g.total)}\n`;
		});
		text += `\nGrand Total: ${formatPrice(total)}`;

		try {
			await navigator.clipboard.writeText(text);
			setIsCopied(true);
			setTimeout(() => setIsCopied(false), 2000);
		} catch (e) {
			console.error(e);
		}
	};

	const grandTotal = shoppingSummary.reduce((s, i) => s + i.totalPrice, 0);

	return (
		<Dialog
			open={open}
			onClose={handleClose}
			maxWidth={false}
			fullScreen
			PaperProps={{
				sx: {
					background: theme.palette.background.paper,
					backgroundImage: "none",
				},
			}}
		>
			<Box
				sx={{
					position: "absolute",
					width: "100%",
					height: "100%",
					bgcolor: "rgba(0,0,0,0.2)",
					backdropFilter: "blur(2px)",
					zIndex: 1,
				}}
			/>

			<DialogTitle
				sx={{
					p: 1.5,
					display: "flex",
					justifyContent: "space-between",
					borderBottom: `1px solid ${theme.palette.divider}`,
					zIndex: 2,
					background: theme.palette.background.paper,
				}}
			>
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						gap: 1,
						color: theme.palette.primary.main,
					}}
				>
					<ShoppingBasket size={24} />
					<Typography variant="h6">Shopping List</Typography>
				</Box>
				<IconButton onClick={handleClose}>
					<X />
				</IconButton>
			</DialogTitle>

			<DialogContent
				sx={{
					p: 0,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					zIndex: 2,
					overflow: "hidden",
				}}
			>
				<Box
					sx={{
						display: "flex",
						flexDirection: isMobile ? "column" : "row",
						width: "100%",
						maxWidth: "1400px",
						height: "100%",
						overflow: "hidden",
					}}
				>
					{/* LEFT COLUMN */}
					<Box
						sx={{
							flex: 1,
							display: "flex",
							flexDirection: "column",
							p: 1,
							gap: 1,
							minHeight: 0,
							maxWidth: isMobile ? "100%" : "65%",
						}}
					>
						{/* SELECTION */}
						<Paper
							sx={{
								flex: isSelectionOpen ? 1 : "0 0 auto",
								minHeight: isSelectionOpen ? 0 : "auto",
								background: theme.palette.background.paper,
								border: `1px solid ${theme.palette.divider}`,
								display: "flex",
								flexDirection: "column",
								overflow: "hidden",
								borderRadius: 2,
								transition: "all 0.3s ease",
							}}
						>
							<Box
								sx={{
									p: 1,
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
									borderBottom: isSelectionOpen
										? `1px solid ${theme.palette.divider}`
										: "none",
									cursor: "pointer",
									bgcolor: "rgba(0,0,0,0.05)",
								}}
								onClick={() => setIsSelectionOpen(!isSelectionOpen)}
							>
								<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
									{isSelectionOpen ? (
										<ChevronDown size={16} />
									) : (
										<ChevronRight size={16} />
									)}
									<Typography
										variant="subtitle2"
										fontWeight="bold"
										color="primary.main"
									>
										YOUR SELECTION
									</Typography>
								</Box>
								<Typography variant="caption" color="text.secondary">
									{shoppingList.length} items
								</Typography>
							</Box>
							{isSelectionOpen && (
								<>
									<Box sx={{ flex: 1, overflowY: "auto", p: 1 }}>
										{shoppingList.length === 0 ? (
											<Box
												sx={{ p: 4, textAlign: "center", opacity: 0.5, mt: 4 }}
											>
												<ShoppingBasket
													size={48}
													style={{ margin: "0 auto", marginBottom: 10 }}
												/>
												<Typography variant="body1">
													Your list is empty
												</Typography>
												<Typography variant="caption">
													{isMobile
														? "Tap 'Add Items' below"
														: "Select items from the right panel"}
												</Typography>
											</Box>
										) : (
											shoppingList.map((item) => (
												<CompactListItem
													key={item.frontendId}
													item={item}
													availableVendors={allSellOrders.filter(
														(o) => o.materialticker === item.materialticker,
													)}
													onUpdateQty={(q) =>
														handleUpdateQty(item.frontendId, q)
													}
													onRemove={() => handleRemove(item.frontendId)}
													onUpdatePriority={(p) =>
														handleUpdatePriority(item.frontendId, p)
													}
												/>
											))
										)}
									</Box>
									{isMobile && (
										<Box
											sx={{
												p: 2,
												borderTop: `1px solid ${theme.palette.divider}`,
											}}
										>
											<Button
												fullWidth
												variant="contained"
												startIcon={<PlusCircle />}
												onClick={(e) => {
													e.stopPropagation();
													setShowMobileAdd(true);
												}}
											>
												Add Items
											</Button>
										</Box>
									)}
								</>
							)}
						</Paper>

						{/* SUMMARY */}
						<Paper
							sx={{
								flex: !isSelectionOpen && isSummaryOpen ? 1 : "0 0 auto",
								height: isSummaryOpen
									? isSelectionOpen
										? isMobile
											? "auto"
											: "35%"
										: "auto"
									: "auto",
								background: theme.palette.background.paper,
								border: `1px solid ${theme.palette.divider}`,
								display: "flex",
								flexDirection: "column",
								borderRadius: 2,
								transition: "all 0.3s ease",
								overflow: "hidden",
							}}
						>
							<Box
								sx={{
									p: 1,
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									borderBottom: isSummaryOpen
										? `1px solid ${theme.palette.divider}`
										: "none",
									cursor: "pointer",
									bgcolor: "rgba(0,0,0,0.05)",
								}}
								onClick={() => setIsSummaryOpen(!isSummaryOpen)}
							>
								<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
									{isSummaryOpen ? (
										<ChevronDown size={16} />
									) : (
										<ChevronRight size={16} />
									)}
									<Typography
										variant="subtitle2"
										sx={{ fontWeight: "bold" }}
										color="primary.main"
									>
										SUMMARY
									</Typography>
								</Box>
								<Tooltip title="Copy to Clipboard">
									<IconButton
										size="small"
										onClick={(e) => {
											e.stopPropagation();
											handleCopy();
										}}
									>
										<ContentCopy
											sx={{ fontSize: 16 }}
											color={isCopied ? "success" : "inherit"}
										/>
									</IconButton>
								</Tooltip>
							</Box>
							{isSummaryOpen && (
								<>
									<Box
										sx={{
											flex: 1,
											overflowY: "auto",
											p: 1.5,
											minHeight: "100px",
										}}
									>
										{groupedSummary.length > 0 ? (
											groupedSummary.map((group) => (
												<SummaryVendorGroup
													key={group.vendorName}
													vendorName={group.vendorName}
													gameName={group.gameName}
													items={group.items}
													total={group.total}
												/>
											))
										) : (
											<Box sx={{ opacity: 0.5, textAlign: "center", py: 2 }}>
												<Typography variant="caption">
													No items calculated yet.
												</Typography>
											</Box>
										)}
									</Box>
									<Box
										sx={{
											p: 1.5,
											bgcolor: "rgba(0,0,0,0.3)",
											display: "flex",
											justifyContent: "space-between",
											alignItems: "center",
										}}
									>
										<Typography variant="caption" color="error">
											{error}
										</Typography>
										<Box sx={{ textAlign: "right" }}>
											<Typography
												variant="caption"
												display="block"
												color="text.secondary"
											>
												TOTAL PRICE
											</Typography>
											<Typography
												variant="h6"
												color="primary.main"
												sx={{ lineHeight: 1 }}
											>
												{formatPrice(grandTotal)}
											</Typography>
										</Box>
									</Box>
								</>
							)}
						</Paper>
					</Box>

					{/* RIGHT COLUMN */}
					{!isMobile && (
						<Box
							sx={{
								width: isMaterialsOpen ? 380 : 50,
								p: 1,
								pl: 0,
								display: "flex",
								flexDirection: "column",
								transition: "width 0.3s ease",
							}}
						>
							<Paper
								sx={{
									flex: 1,
									background: theme.palette.background.paper,
									border: `1px solid ${theme.palette.divider}`,
									overflow: "hidden",
									borderRadius: 2,
								}}
							>
								<AvailableMaterialsPanel
									materials={availableMaterials}
									selectedTickers={selectedTickers}
									onAdd={handleAdd}
									isCollapsed={!isMaterialsOpen}
									onToggleCollapse={() => setIsMaterialsOpen(!isMaterialsOpen)}
								/>
							</Paper>
						</Box>
					)}
				</Box>

				{/* MOBILE DRAWER */}
				<Drawer
					anchor="bottom"
					open={showMobileAdd}
					onClose={() => setShowMobileAdd(false)}
					PaperProps={{
						sx: {
							height: "80vh",
							borderTopLeftRadius: 16,
							borderTopRightRadius: 16,
							background: theme.palette.background.paper,
							backgroundImage: "none",
							borderTop: `1px solid ${theme.palette.divider}`,
						},
					}}
					sx={{ zIndex: 9999 }}
				>
					<AvailableMaterialsPanel
						materials={availableMaterials}
						selectedTickers={selectedTickers}
						onAdd={handleAdd}
						isMobile
						onCloseMobile={() => setShowMobileAdd(false)}
					/>
				</Drawer>
			</DialogContent>

			<DialogActions
				sx={{
					p: 1.5,
					borderTop: `1px solid ${theme.palette.divider}`,
					zIndex: 2,
					background: theme.palette.background.paper,
					justifyContent: "center",
				}}
			>
				<Button
					onClick={handleClose}
					color="primary"
					sx={{ border: "1px solid" }}
				>
					Cancel
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default ShoppingListModal;
