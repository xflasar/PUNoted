import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	Box,
	Typography,
	TextField,
	Button,
	Paper,
	IconButton,
	InputAdornment,
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
	ChevronRight,
	ArrowUp,
	ArrowDown,
	Store,
	Warehouse,
	Globe,
} from "lucide-react";
import { ContentCopy } from "@mui/icons-material";
import { v4 as uuidv4 } from "uuid";
import PriceComparisonBadge from "./components/pricecomparisonbadge";
import { getDiffStats } from "./utils/pricecomparison";
import { pickPrice } from "./utils/pickprice";
import MaterialBadge from "../components/materialbadge";
import LocationFilter, {
	HORTUS_LOCATION_CODE,
	matchesLocationFilter,
	type LocationOption,
} from "./components/locationfilter";
import { ConfirmationDialog } from "./confirmationdialog";

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
	companycode?: string;
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
		companycode: string;
		companyname: string;
		gamename: string;
		cx?: string;
	};
	orders: OrderItem[];
}

type CxPriceLookup = Record<string, Record<string, unknown>>;

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

const SHOPPING_LIST_STORAGE_KEY = "cosmShoppingList";
const getStoredShoppingList = (): ShoppingListItem[] => {
	try {
		const list: unknown = JSON.parse(
			localStorage.getItem(SHOPPING_LIST_STORAGE_KEY) || "[]",
		);
		return Array.isArray(list) ? (list as ShoppingListItem[]) : [];
	} catch {
		return [];
	}
};

/**
 * Represents a calculated shopping summary item, assigned to a specific vendor.
 */
interface ShoppingSummaryItem {
	vendorid: string;
	vendorname: string;
	gamename: string;
	companycode?: string;
	amount: number;
	price: number;
	totalPrice: number;
	location?: NonNullable<OrderItem["location"]>[number];
}

// --- Formatters ---
/**
 * Formats a numeric price into a localized string with "ICA" appended.
 *
 * @param {number | null | undefined} p - The price to format.
 * @returns {string} The formatted price string.
 */
const formatPrice = (p: number | null | undefined, unit = "ICA"): string =>
	p == null || isNaN(p)
		? "N/A"
		: new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(p) +
			` ${unit}`;

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
const formatLocationLabel = (name: string, id: string): string =>
	name === id ? name : `${name} (${id})`;
const getSourceId = (order: Pick<OrderItem, "vendorid" | "location">) => {
	const location = order.location?.[0];
	return `${order.vendorid}:${location?.location_code || location?.location_name || "unknown"}`;
};

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
				width: "128px",
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
 * @param {OrderItem[]} props.sortedVendors - Vendors in priority order.
 * @param {(newPriority: string[]) => void} props.onUpdatePriority - Callback when the priority changes.
 * @returns {React.ReactElement} The priority selector component.
 */
const VendorPrioritySelector: React.FC<{
	sortedVendors: OrderItem[];
	sourcedVendorIds: Set<string>;
	onUpdatePriority: (newPriority: string[]) => void;
}> = React.memo(({ sortedVendors, sourcedVendorIds, onUpdatePriority }) => {
	const theme = useTheme();

	const moveVendor = useCallback(
		(index: number, direction: -1 | 1) => {
			const newOrder = sortedVendors.map(getSourceId);
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
				const isSourced = sourcedVendorIds.has(getSourceId(vendor));
				const displayPrice = getOrderPrice(vendor).price;
				const formattedPrice = formatPrice(displayPrice);
				const location = vendor.location?.[0];
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
						key={getSourceId(vendor)}
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 1.5,
							mb: 0.5,
							p: 1,
							borderRadius: 1.5,
							bgcolor: isSourced
								? alpha(theme.palette.success.main, 0.1)
								: "transparent",
							border: isSourced
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

						<Box
							sx={{
								display: "flex",
								flex: 1,
								gap: 1,
								justifyContent: "space-between",
								minWidth: 0,
							}}
						>
							<Box sx={{ flex: 1, minWidth: 0 }}>
								<Typography
									variant="body2"
									sx={{
										color: isSourced ? theme.palette.success.light : "inherit",
										fontSize: "0.9rem",
									}}
								>
									<Box component="span" sx={{ fontWeight: "bold" }}>
										{vendor.gamename}
									</Box>{" "}
									<Box component="span" sx={{ fontFamily: "monospace" }}>
										[{vendor.companycode || "—"}]
									</Box>{" "}
									{vendor.vendorname}
								</Typography>
								<Typography variant="caption" color="text.secondary">
									{location ? (
										<>
											{location.location_code === "HRT" ? (
												<Warehouse
													className="inline-icon"
													color={theme.palette.success.light}
												/>
											) : (
												<Globe
													className="inline-icon"
													color={theme.palette.warning.main}
												/>
											)}{" "}
											{formatLocationLabel(
												location.location_name ||
													location.location_code ||
													"Unknown",
												location.location_code ||
													location.location_name ||
													"Unknown",
											)}
											:{" "}
											<Box
												component="span"
												sx={{
													color: theme.palette.primary.light,
													fontWeight: "bold",
												}}
											>
												{formatAmount(vendor.quantity)}
											</Box>
										</>
									) : (
										<>Stock: {formatAmount(vendor.quantity)}</>
									)}
								</Typography>
							</Box>
							<Box
								sx={{
									alignItems: "flex-end",
									display: "flex",
									flexDirection: "column",
								}}
							>
								<Typography variant="caption" color="text.secondary">
									{formattedPrice === "N/A" ? (
										formattedPrice
									) : (
										<>
											<Box
												component="span"
												sx={{
													color: theme.palette.warning.main,
													fontWeight: "bold",
												}}
											>
												{formattedPrice.slice(0, -4)}
											</Box>{" "}
											<Box
												component="span"
												sx={{ color: "text.primary", fontSize: "0.7rem" }}
											>
												ICA
											</Box>
										</>
									)}
								</Typography>
								<Box sx={{ display: "flex", gap: 0.5 }}>
									{corpStats && (
										<PriceComparisonBadge label="COSM" stats={corpStats} />
									)}
									{cxStats && (
										<PriceComparisonBadge label="CX" stats={cxStats} />
									)}
								</Box>
							</Box>
						</Box>

						<Box sx={{ display: "flex", flexDirection: "column" }}>
							<IconButton
								size="small"
								disabled={index === 0}
								onClick={() => moveVendor(index, -1)}
								sx={{ p: 0.5 }}
							>
								<ArrowUp className="inline-icon" />
							</IconButton>
							<IconButton
								size="small"
								disabled={index === sortedVendors.length - 1}
								onClick={() => moveVendor(index, 1)}
								sx={{ p: 0.5 }}
							>
								<ArrowDown className="inline-icon" />
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
		const sortedVendors = useMemo(() => {
			const pMap = new Map(item.vendorPriority.map((id, idx) => [id, idx]));
			return [...availableVendors].sort((a, b) => {
				const pA = pMap.get(getSourceId(a));
				const pB = pMap.get(getSourceId(b));
				if (pA !== undefined && pB !== undefined) return pA - pB;
				if (pA !== undefined) return -1;
				if (pB !== undefined) return 1;
				return getOrderPrice(a).price - getOrderPrice(b).price;
			});
		}, [availableVendors, item.vendorPriority]);

		// 2. Allocate the requested quantity in sourcing-priority order.
		const sourcing = useMemo(() => {
			const vendors = new Set<string>();
			const sourcedVendorIds = new Set<string>();
			const locations = new Map<string, { label: string; isHortus: boolean }>();
			let remainingNeeded = item.quantity;

			for (const vendor of sortedVendors) {
				if (remainingNeeded <= 0) break;
				const vendorAmount = Math.min(remainingNeeded, vendor.quantity);
				if (vendorAmount <= 0) continue;
				let remainingVendorAmount = vendorAmount;
				for (const location of vendor.location || []) {
					if (remainingVendorAmount <= 0) break;
					const id = location.location_code || location.location_name;
					const available =
						location.available ?? location.amount ?? location.storage_amount;
					if (!id || typeof available !== "number" || available <= 0) continue;
					const locationAmount = Math.min(remainingVendorAmount, available);
					vendors.add(vendor.gamename || vendor.vendorname);
					sourcedVendorIds.add(getSourceId(vendor));
					locations.set(id, {
						label: formatLocationLabel(location.location_name || id, id),
						isHortus: location.location_code === "HRT",
					});
					remainingVendorAmount -= locationAmount;
				}
				remainingNeeded -= vendorAmount;
			}

			return {
				vendors: [...vendors],
				sourcedVendorIds,
				locations: [...locations.values()].sort((a, b) => {
					if (a.isHortus !== b.isHortus) return a.isHortus ? -1 : 1;
					return a.label.localeCompare(b.label);
				}),
			};
		}, [item.quantity, sortedVendors]);

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
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						p: 1.5,
						gap: 2,
						flexWrap: { xs: "wrap", md: "nowrap" },
					}}
				>
					<Typography
						variant="body1"
						fontWeight="900"
						sx={{
							flexShrink: 0,
							fontSize: "1.1rem",
							color: theme.palette.text.primary,
						}}
					>
						<MaterialBadge ticker={item.materialticker} />
					</Typography>
					<Typography
						variant="caption"
						sx={{
							display: { xs: "block", md: "none" },
							fontSize: "0.75rem",
							whiteSpace: "nowrap",
							marginLeft: { xs: "auto", md: 0 },
						}}
					>
						Supply:{" "}
						<Box
							component="span"
							sx={{
								color:
									totalAvail < item.quantity
										? theme.palette.error.main
										: theme.palette.success.main,
								fontWeight: "bold",
							}}
						>
							{formatAmount(totalAvail)}
						</Box>
					</Typography>

					<Box
						onClick={() => setExpanded(!expanded)}
						sx={{
							flex: { xs: "1 1 calc(100% - 56px)", md: 1 },
							order: { xs: 1, md: 0 },
							display: "flex",
							alignItems: "center",
							gap: 0.5,
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
						<Box sx={{ display: "flex", alignItems: "center", pr: 0.5 }}>
							{expanded ? (
								<ChevronDown className="inline-icon" />
							) : (
								<ChevronRight className="inline-icon" />
							)}
						</Box>
						<Box
							sx={{
								display: "flex",
								flexDirection: "column",
								gap: 0.25,
								flex: 1,
								minWidth: 0,
							}}
						>
							<Typography
								variant="body2"
								sx={{ minWidth: 0, fontSize: "0.85rem" }}
							>
								<Box
									component="span"
									sx={{ color: theme.palette.primary.dark, fontWeight: "bold" }}
								>
									From:
								</Box>{" "}
								{sourcing.vendors.length > 0
									? sourcing.vendors.map((vendor) => (
											<Box
												component="span"
												key={vendor}
												sx={{
													"& + &::before": {
														content: '"•"',
														margin: "0 0.5em",
													},
												}}
											>
												<Store
													className="inline-icon"
													color={theme.palette.primary.main}
												/>{" "}
												{vendor}
											</Box>
										))
									: "—"}
							</Typography>
							<Typography
								variant="body2"
								sx={{ minWidth: 0, fontSize: "0.85rem" }}
							>
								<Box
									component="span"
									sx={{ color: theme.palette.primary.dark, fontWeight: "bold" }}
								>
									At:
								</Box>{" "}
								{sourcing.locations.length > 0
									? sourcing.locations.map((location) => (
											<Box
												component="span"
												key={location.label}
												sx={{
													"& + &::before": {
														content: '"•"',
														margin: "0 0.5em",
													},
												}}
											>
												{location.isHortus ? (
													<Warehouse
														className="inline-icon"
														color={theme.palette.success.light}
													/>
												) : (
													<Globe
														className="inline-icon"
														color={theme.palette.warning.main}
													/>
												)}{" "}
												{location.label}
											</Box>
										))
									: "—"}
							</Typography>
						</Box>
					</Box>

					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							flexShrink: 0,
						}}
					>
						<DebouncedInput value={item.quantity} onChange={onUpdateQty} />
						<Typography
							variant="caption"
							sx={{
								display: { xs: "none", md: "block" },
								fontSize: "0.75rem",
								position: "relative",
								top: "0.25em",
								whiteSpace: "nowrap",
							}}
						>
							Supply:{" "}
							<Box
								component="span"
								sx={{
									color:
										totalAvail < item.quantity
											? theme.palette.error.main
											: theme.palette.success.main,
									fontWeight: "bold",
								}}
							>
								{formatAmount(totalAvail)}
							</Box>
						</Typography>
					</Box>

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
						<Trash2 className="inline-icon" />
					</IconButton>
				</Box>

				<Collapse in={expanded}>
					<Box sx={{ px: 2, pb: 2 }}>
						<VendorPrioritySelector
							sortedVendors={sortedVendors}
							sourcedVendorIds={sourcing.sourcedVendorIds}
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
 * @param {string} props.gameName - Vendor's game name.
 * @param {ShoppingSummaryItem[]} props.items - The list of items calculated to be bought from this vendor.
 * @param {number} props.total - The total cost for this vendor.
 * @returns {React.ReactElement} The vendor summary group component.
 */
const SummaryVendorGroup: React.FC<{
	gameName: string;
	items: ShoppingSummaryItem[];
	total: number;
}> = ({ gameName, items, total }) => {
	const theme = useTheme();
	const formattedTotal = formatPrice(total);

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
				<Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
					<Store className="inline-icon" color={theme.palette.primary.main} />{" "}
					{gameName}
				</Typography>
				<Typography variant="subtitle2">
					{formattedTotal === "N/A" ? (
						formattedTotal
					) : (
						<>
							<Box
								component="span"
								sx={{ color: theme.palette.warning.main, fontWeight: "bold" }}
							>
								{formattedTotal.slice(0, -4)}
							</Box>{" "}
							<Box
								component="span"
								sx={{ color: "text.primary", fontSize: "0.7rem" }}
							>
								ICA
							</Box>
						</>
					)}
				</Typography>
			</Box>

			{/* List of Items */}
			<Box sx={{ p: 1 }}>
				{items.map((item, idx) => {
					const unitPrice = formatPrice(item.price);
					const totalPrice = formatPrice(item.totalPrice);
					return (
						<Box
							key={idx}
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 0.5,
								fontSize: "0.75rem",
								mb: idx < items.length - 1 ? 0.5 : 0,
							}}
						>
							<Box sx={{ flex: "0 0 2.75rem" }}>
								<MaterialBadge ticker={item.ticker} />
							</Box>
							<Typography
								variant="body2"
								sx={{
									flex: "0 0 3.5rem",
									fontSize: "inherit",
									textAlign: "right",
								}}
							>
								×
								<Box component="span" sx={{ fontWeight: "bold" }}>
									{formatAmount(item.amount)}
								</Box>
							</Typography>
							<Typography
								variant="body2"
								sx={{
									flex: 1,
									fontSize: "inherit",
									textAlign: "right",
									whiteSpace: "nowrap",
								}}
							>
								<Box component="span" sx={{ fontWeight: "bold" }}>
									{unitPrice === "N/A" ? unitPrice : unitPrice.slice(0, -4)}
								</Box>{" "}
								ppu
							</Typography>
							<Typography
								variant="body2"
								sx={{
									flex: 1,
									fontSize: "inherit",
									textAlign: "right",
									whiteSpace: "nowrap",
								}}
							>
								<Box component="span" sx={{ fontWeight: "bold" }}>
									{totalPrice === "N/A" ? totalPrice : totalPrice.slice(0, -4)}
								</Box>{" "}
								ICA
							</Typography>
						</Box>
					);
				})}
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
	const min = mat.minPrice || mat.fixedprice;
	const max = mat.maxPrice || mat.fixedprice;
	const format = (price: number) =>
		new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(price);
	const priceDisplay =
		min !== max ? `${format(min)}–${format(max)}` : format(min);

	return (
		<Box
			sx={{
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				p: 1.25,
				px: 2,
				borderBottom: `1px solid rgba(255,255,255,0.1)`,
				"&:hover": { bgcolor: "rgba(255,255,255,0.03)" },
			}}
		>
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					gap: 0.75,
					minWidth: 0,
					whiteSpace: "nowrap",
				}}
			>
				<Box component="span" sx={{ fontSize: "0.85rem" }}>
					<MaterialBadge ticker={mat.materialticker} />
				</Box>
				<Typography
					variant="caption"
					color="text.secondary"
					sx={{ fontSize: "0.85rem" }}
				>
					×
					<Box component="span" sx={{ fontWeight: "bold" }}>
						{formatAmount(mat.total_instore)}
					</Box>
				</Typography>
				<Tooltip title={mat.vendorNames.join(", ")}>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 0.25,
							opacity: 0.6,
							cursor: "help",
							borderBottom: "1px dotted currentColor",
						}}
					>
						<Store className="inline-icon" />
						<Typography variant="caption" sx={{ fontSize: "0.85rem" }}>
							{mat.vendorCount}
						</Typography>
					</Box>
				</Tooltip>
			</Box>
			<Box
				sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}
			>
				<Typography
					variant="body2"
					sx={{ color: "warning.main", fontSize: "0.85rem" }}
				>
					<Box component="span" sx={{ fontWeight: "bold" }}>
						{priceDisplay}
					</Box>{" "}
					<Box
						component="span"
						sx={{ color: "text.primary", fontSize: "0.75rem" }}
					>
						ICA
					</Box>
				</Typography>
				<IconButton
					size="small"
					onClick={() => {
						onAdd(mat);
						if (isMobile && onCloseMobile) onCloseMobile();
					}}
				>
					<PlusCircle className="inline-icon" color="#66bb6a" />
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
 * @returns {React.ReactElement} The available materials panel.
 */
const AvailableMaterialsPanel: React.FC<{
	materials: any[];
	selectedTickers: Set<string>;
	onAdd: (m: any) => void;
	allLocations: LocationOption[];
	selectedLocation: string | null;
	onChangeLocation: (next: string | null) => void;
	isMobile?: boolean;
	onCloseMobile?: () => void;
}> = React.memo(
	({
		materials,
		selectedTickers,
		onAdd,
		allLocations,
		selectedLocation,
		onChangeLocation,
		isMobile,
		onCloseMobile,
	}) => {
		const [search, setSearch] = useState("");

		const filtered = useMemo(() => {
			const terms = search
				.toLowerCase()
				.split(",")
				.map((t) => t.trim())
				.filter((t) => t);
			return materials
				.filter((m) => {
					if (selectedTickers.has(m.materialticker)) return false;
					if (terms.length === 0) return true;
					return terms.some((t) => m.materialticker.toLowerCase().includes(t));
				})
				.sort((a, b) => a.materialticker.localeCompare(b.materialticker));
		}, [search, materials, selectedTickers]);

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
						sx={{ color: "text.primary", fontWeight: "bold" }}
					>
						AVAILABLE MATERIALS
					</Typography>
					{isMobile && (
						<IconButton onClick={onCloseMobile}>
							<X className="inline-icon" />
						</IconButton>
					)}
				</Box>

				<Box sx={{ p: isMobile ? 0 : 2, pb: 1 }}>
					<TextField
						fullWidth
						variant="outlined"
						placeholder="Search Materials..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						size="small"
						slotProps={{
							input: {
								startAdornment: (
									<Search
										className="inline-icon"
										style={{ marginRight: 8, opacity: 0.5 }}
									/>
								),
								endAdornment: search ? (
									<InputAdornment position="end">
										<Tooltip title="Clear Search">
											<IconButton
												size="small"
												aria-label="Clear material search"
												onClick={() => setSearch("")}
											>
												<X className="inline-icon" />
											</IconButton>
										</Tooltip>
									</InputAdornment>
								) : null,
							},
						}}
						sx={{
							"& .MuiOutlinedInput-root": {
								bgcolor: "rgba(0,0,0,0.15)",
								borderRadius: "12px",
							},
						}}
					/>
					<LocationFilter
						locations={allLocations}
						value={selectedLocation}
						onChange={onChangeLocation}
						sx={{ mt: 1 }}
						popperSx={isMobile ? { zIndex: 10000 } : undefined}
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
	cxPriceLookup: CxPriceLookup;
}> = ({ open, handleClose, vendors, isLoggedIn, cxPriceLookup }) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
	const isCompact = useMediaQuery(theme.breakpoints.down("xl"));

	// State management
	const [insufficientStock, setInsufficientStock] = useState(false);
	const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>(
		getStoredShoppingList,
	);
	const [shoppingSummary, setShoppingSummary] = useState<ShoppingSummaryItem[]>(
		[],
	);
	const [isCopied, setIsCopied] = useState(false);
	const [confirmClear, setConfirmClear] = useState(false);

	// UI states
	const [showAddItems, setShowAddItems] = useState(false);
	const [selectedLocation, setSelectedLocation] = useState<string | null>(
		HORTUS_LOCATION_CODE,
	);

	useEffect(() => {
		localStorage.setItem(
			SHOPPING_LIST_STORAGE_KEY,
			JSON.stringify(shoppingList),
		);
	}, [shoppingList]);

	// 1. Memoize All Sell Orders
	const allSellOrders = useMemo(() => {
		return vendors.flatMap((v) =>
			v.orders
				.filter((o) => o.ordertype === "sell")
				.flatMap((o) => {
					const rawStock = o.available !== undefined ? o.available : o.quantity;
					const reserved = o.reserved || 0;
					const actualAvailable = Math.max(0, rawStock - reserved);
					const sideKey = "IC1-AskPrice";
					const rawCxValue =
						cxPriceLookup[o.materialticker.trim().toUpperCase()]?.[sideKey];
					const cxReferencePrice = Number(rawCxValue);

					const order = {
						...o,
						quantity: actualAvailable,
						fixedprice: getOrderPrice(o).price,
						vendorid: v.vendor.vendorid,
						vendorname: v.vendor.companyname,
						gamename: v.vendor.gamename,
						companycode: v.vendor.companycode,
						price: {
							...o.price,
							cxprice: Number.isFinite(cxReferencePrice)
								? cxReferencePrice
								: o.price?.cxprice,
						},
					};
					const locations = (o.location || []).filter(
						(location) =>
							typeof location.available === "number" && location.available > 0,
					);
					if (locations.length === 0) return [order];

					let remainingAvailable = actualAvailable;
					return locations.flatMap((location) => {
						const quantity = Math.min(
							remainingAvailable,
							location.available || 0,
						);
						remainingAvailable -= quantity;
						if (quantity <= 0) return [];
						return [{ ...order, location: [location], quantity }];
					});
				}),
		);
	}, [vendors, cxPriceLookup]);

	const allLocations = useMemo(() => {
		const locs = new Map<string, LocationOption>();
		allSellOrders.forEach((order) => {
			order.location?.forEach((loc) => {
				if (!(typeof loc.available === "number" && loc.available > 0)) return;
				const optionId = loc.location_code || loc.location_name;
				if (!optionId) return;
				locs.set(optionId, {
					id: optionId,
					name: loc.location_name || optionId,
				});
			});
		});
		return [...locs.values()];
	}, [allSellOrders]);

	const locationFilteredSellOrders = useMemo(() => {
		if (selectedLocation === null) return allSellOrders;
		return allSellOrders.filter((order) =>
			order.location?.some(
				(loc) =>
					typeof loc.available === "number" &&
					loc.available > 0 &&
					matchesLocationFilter(loc, selectedLocation),
			),
		);
	}, [allSellOrders, selectedLocation]);

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
		const agg = locationFilteredSellOrders.reduce(
			(acc, order) => {
				const orderPrice = getOrderPrice(order).price;
				if (!acc[order.materialticker]) {
					acc[order.materialticker] = {
						...order,
						total_instore: 0,
						frontendId: uuidv4(),
						minPrice: orderPrice,
						maxPrice: orderPrice,
						vendors: new Map(), // Track unique vendor usernames
					};
				}
				// Update Totals & Vendor Set
				acc[order.materialticker].total_instore += order.quantity;
				acc[order.materialticker].vendors.set(order.vendorid, order.gamename);

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

		return Object.values(agg).map((item) => ({
			...item,
			vendorCount: item.vendors.size,
			vendorNames: [...item.vendors.values()].sort(),
		}));
	}, [locationFilteredSellOrders]);

	// 4. Selected Tickers Set
	const selectedTickers = useMemo(
		() => new Set(shoppingList.map((i) => i.materialticker)),
		[shoppingList],
	);

	// --- ACTIONS ---

	const handleAdd = useCallback((mat: any) => {
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
	}, []);

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
						const pA = pMap.get(getSourceId(a));
						const pB = pMap.get(getSourceId(b));
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
						companycode: order.companycode,
						ticker: order.materialticker,
						amount: take,
						price: displayPrice,
						totalPrice: take * displayPrice,
						location: order.location?.[0],
					});
					order.quantity -= take;
					needed -= take;
				}
				if (needed > 0) insufficient = true;
			}

			setShoppingSummary(summary);
			setInsufficientStock(insufficient);
		}, 75);

		return () => clearTimeout(timer);
	}, [shoppingList, inventoryMap]);

	// Calculate Grouped Summary for Display
	const groupedSummary = useMemo(() => {
		const groups: Record<
			string,
			{
				location?: ShoppingSummaryItem["location"];
				vendors: Record<
					string,
					{
						vendorId: string;
						gameName: string;
						items: ShoppingSummaryItem[];
						total: number;
					}
				>;
			}
		> = {};

		shoppingSummary.forEach((item) => {
			const locationKey =
				item.location?.location_code ||
				item.location?.location_name ||
				"unknown";
			const locationGroup = (groups[locationKey] ||= {
				location: item.location,
				vendors: {},
			});
			const vendor = (locationGroup.vendors[item.vendorid] ||= {
				vendorId: item.vendorid,
				gameName: item.gamename,
				items: [],
				total: 0,
			});
			vendor.items.push(item);
			vendor.total += item.totalPrice;
		});

		return Object.values(groups)
			.sort((a, b) => {
				const aIsHrt = a.location?.location_code === "HRT";
				const bIsHrt = b.location?.location_code === "HRT";
				if (aIsHrt !== bIsHrt) return aIsHrt ? -1 : 1;
				return (
					a.location?.location_name ||
					a.location?.location_code ||
					""
				).localeCompare(
					b.location?.location_name || b.location?.location_code || "",
				);
			})
			.map(({ location, vendors }) => ({
				location,
				vendors: Object.values(vendors),
			}));
	}, [shoppingSummary]);

	// --- UTILS ---
	const handleCopy = async () => {
		const text = [
			...groupedSummary.map(({ location, vendors }) => {
				const locationName =
					location?.location_name || location?.location_code || "Unknown";
				const locationCode = location?.location_code || locationName;
				return [
					`-- ${formatLocationLabel(locationName, locationCode).toUpperCase()} --`,
					...vendors.flatMap((vendor) => [
						"",
						`Vendor: ${vendor.gameName}${vendor.items[0].companycode ? ` [${vendor.items[0].companycode}]` : ""} ${vendor.items[0].vendorname}`,
						...vendor.items.map(
							(item) =>
								`- ${formatAmount(item.amount)} × [${item.ticker}] @ ${formatPrice(item.price, "ppu")} = ${formatPrice(item.totalPrice)}`,
						),
						`Total: ${formatPrice(vendor.total)}`,
					]),
				].join("\n");
			}),
			`GRAND TOTAL: ${formatPrice(grandTotal)}`,
		].join("\n\n");

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
					<ShoppingBasket className="inline-icon" />
					<Typography variant="h6">Shopping List</Typography>
				</Box>
				<Button
					variant="outlined"
					size="small"
					startIcon={<X className="inline-icon" />}
					onClick={handleClose}
					sx={{ fontWeight: "bold" }}
				>
					CLOSE
				</Button>
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
						gap: isMobile ? 0 : 1,
						p: isMobile ? 0 : 1,
						width: "100%",
						height: "100%",
						overflow: "hidden",
					}}
				>
					{/* LEFT COLUMN */}
					<Box
						sx={{
							flex: 1,
							display: isMobile ? "flex" : "contents",
							flexDirection: "column",
							p: isMobile ? 1 : 0,
							gap: isMobile ? 1 : 0,
							minHeight: 0,
							maxWidth: "100%",
						}}
					>
						{/* SELECTION */}
						<Paper
							sx={{
								flex: isMobile ? 1 : "1 1 0",
								order: isMobile ? 0 : 2,
								minWidth: 0,
								height: isMobile ? "auto" : "100%",
								minHeight: 0,
								background: theme.palette.background.paper,
								border: `1px solid ${theme.palette.divider}`,
								display: "flex",
								flexDirection: "column",
								overflow: "hidden",
								borderRadius: 2,
							}}
						>
							<Box
								sx={{
									p: 1.5,
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
									borderBottom: `1px solid ${theme.palette.divider}`,
									bgcolor: "rgba(0,0,0,0.05)",
								}}
							>
								<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
									<Typography
										variant="subtitle2"
										sx={{ color: "text.primary", fontWeight: "bold" }}
									>
										YOUR SELECTION
									</Typography>
								</Box>
								<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
									<Typography variant="caption" color="text.secondary">
										{shoppingList.length}{" "}
										{shoppingList.length === 1 ? "material" : "materials"}
									</Typography>
									<Button
										size="small"
										variant="outlined"
										color="error"
										startIcon={<Trash2 className="inline-icon" />}
										disabled={shoppingList.length === 0}
										onClick={() => setConfirmClear(true)}
										sx={{ fontWeight: "bold" }}
									>
										CLEAR
									</Button>
								</Box>
							</Box>
							<Box sx={{ flex: 1, overflowY: "auto", p: 1 }}>
								{shoppingList.length === 0 ? (
									<Box sx={{ p: 4, textAlign: "center", opacity: 0.5, mt: 4 }}>
										<ShoppingBasket className="inline-icon" />
										<Typography variant="body1">Your list is empty</Typography>
										<Typography variant="caption">
											{isCompact
												? "Use 'Add Materials' below"
												: "Select materials from the left panel"}
										</Typography>
									</Box>
								) : (
									shoppingList.map((item) => (
										<CompactListItem
											key={item.frontendId}
											item={item}
											availableVendors={inventoryMap[item.materialticker] || []}
											onUpdateQty={(q) => handleUpdateQty(item.frontendId, q)}
											onRemove={() => handleRemove(item.frontendId)}
											onUpdatePriority={(p) =>
												handleUpdatePriority(item.frontendId, p)
											}
										/>
									))
								)}
							</Box>
							{isCompact && (
								<Box
									sx={{
										p: 2,
										borderTop: `1px solid ${theme.palette.divider}`,
									}}
								>
									<Button
										fullWidth
										variant="contained"
										startIcon={<PlusCircle className="inline-icon" />}
										onClick={(e) => {
											e.stopPropagation();
											setShowAddItems(true);
										}}
									>
										Add Materials
									</Button>
								</Box>
							)}
						</Paper>

						{/* SUMMARY */}
						<Paper
							sx={{
								flex: isMobile ? 1 : "0 0 380px",
								height: isMobile ? "auto" : "100%",
								order: isMobile ? 0 : 3,
								minWidth: 0,
								background: theme.palette.background.paper,
								border: `1px solid ${theme.palette.divider}`,
								display: "flex",
								flexDirection: "column",
								borderRadius: 2,
								overflow: "hidden",
							}}
						>
							<Box
								sx={{
									p: 1.5,
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									borderBottom: `1px solid ${theme.palette.divider}`,
									bgcolor: "rgba(0,0,0,0.05)",
								}}
							>
								<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
									<Typography
										variant="subtitle2"
										sx={{ color: "text.primary", fontWeight: "bold" }}
									>
										ORDER SUMMARY
									</Typography>
								</Box>
								<Tooltip title="Copy to Clipboard">
									<Button
										size="small"
										variant="contained"
										color={isCopied ? "success" : "primary"}
										startIcon={<ContentCopy className="inline-icon" />}
										disabled={shoppingList.length === 0}
										sx={{ fontWeight: "bold" }}
										onClick={(e) => {
											e.stopPropagation();
											handleCopy();
										}}
									>
										COPY
									</Button>
								</Tooltip>
							</Box>
							<Box
								sx={{
									flex: 1,
									overflowY: "auto",
									p: 1.5,
									minHeight: "100px",
								}}
							>
								{groupedSummary.length > 0 ? (
									groupedSummary.map((group) => {
										const location = group.location;
										const locationName =
											location?.location_name ||
											location?.location_code ||
											"Unknown";
										const locationCode =
											location?.location_code || locationName;

										return (
											<Box key={locationCode} sx={{ mb: 2 }}>
												<Box
													sx={{
														display: "flex",
														alignItems: "center",
														gap: 0.5,
														mb: 0.75,
													}}
												>
													{location?.location_code === "HRT" ? (
														<Warehouse
															className="inline-icon"
															color={theme.palette.success.light}
														/>
													) : (
														<Globe
															className="inline-icon"
															color={theme.palette.warning.main}
														/>
													)}
													<Typography variant="subtitle2" fontWeight="bold">
														{formatLocationLabel(locationName, locationCode)}
													</Typography>
												</Box>
												{group.vendors.map((vendor) => (
													<SummaryVendorGroup
														key={vendor.vendorId}
														gameName={vendor.gameName}
														items={vendor.items}
														total={vendor.total}
													/>
												))}
											</Box>
										);
									})
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
									flexDirection: "column",
									gap: 0.5,
								}}
							>
								{insufficientStock && (
									<Typography
										variant="caption"
										sx={{ color: "error.dark", textAlign: "center" }}
									>
										<Box component="span" sx={{ fontWeight: "bold" }}>
											Warning: Not enough stock for full order.
										</Box>
									</Typography>
								)}
								<Box
									sx={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "flex-end",
									}}
								>
									<Typography variant="caption" color="text.secondary">
										TOTAL PRICE
									</Typography>
									<Typography variant="h6" sx={{ lineHeight: 1 }}>
										{formatPrice(grandTotal) === "N/A" ? (
											"N/A"
										) : (
											<>
												<Box
													component="span"
													sx={{
														color: theme.palette.warning.main,
														fontWeight: "bold",
													}}
												>
													{formatPrice(grandTotal).slice(0, -4)}
												</Box>{" "}
												<Box
													component="span"
													sx={{ color: "text.primary", fontSize: "0.7rem" }}
												>
													ICA
												</Box>
											</>
										)}
									</Typography>
								</Box>
							</Box>
						</Paper>
					</Box>

					{/* RIGHT COLUMN */}
					{!isCompact && (
						<Box
							sx={{
								width: 380,
								flex: "0 0 380px",
								order: 1,
								p: 0,
								display: "flex",
								flexDirection: "column",
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
									allLocations={allLocations}
									selectedLocation={selectedLocation}
									onChangeLocation={setSelectedLocation}
								/>
							</Paper>
						</Box>
					)}
				</Box>

				{/* ADD MATERIALS DRAWER */}
				<Drawer
					anchor="bottom"
					open={showAddItems}
					onClose={() => setShowAddItems(false)}
					slotProps={{
						paper: {
							sx: {
								height: "100%",
								borderTopLeftRadius: 16,
								borderTopRightRadius: 16,
								background: theme.palette.background.paper,
								backgroundImage: "none",
								borderTop: `1px solid ${theme.palette.divider}`,
							},
						},
						backdrop: {
							sx: { backgroundColor: theme.palette.background.default },
						},
					}}
					sx={{ zIndex: 9999 }}
				>
					<AvailableMaterialsPanel
						materials={availableMaterials}
						selectedTickers={selectedTickers}
						onAdd={handleAdd}
						allLocations={allLocations}
						selectedLocation={selectedLocation}
						onChangeLocation={setSelectedLocation}
						isMobile
						onCloseMobile={() => setShowAddItems(false)}
					/>
				</Drawer>
				<ConfirmationDialog
					open={confirmClear}
					onClose={() => setConfirmClear(false)}
					title="Clear your Shopping List?"
					confirmLabel="YES"
					cancelLabel="NO"
					type="negative"
					onConfirm={() => {
						setShoppingList([]);
						setConfirmClear(false);
					}}
				>
					<Typography>
						You can add materials again from the panel to the left.
					</Typography>
				</ConfirmationDialog>
			</DialogContent>
		</Dialog>
	);
};

export default ShoppingListModal;
