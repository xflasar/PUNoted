import React, {
	useState,
	useEffect,
	useMemo,
	memo,
	useRef,
	useCallback,
	useDeferredValue,
} from "react";
import {
	Box,
	Typography,
	Paper,
	TextField,
	InputAdornment,
	IconButton,
	Button,
	Stack,
	CircularProgress,
} from "@mui/material";
import {
	Search,
	Plus,
	Trash2,
	ShoppingCart,
	RefreshCcw,
	TrendingUp,
	TrendingDown,
	Minus,
} from "lucide-react";
import { glassStyle } from "./customcomponents/glassstyle";
import MaterialBadge from "../components/materialbadge";

const ROW_HEIGHT = 52;
const HEADER_HEIGHT = 40;
const OVERSCAN = 25;

const COL_WIDTHS = {
	price: 90,
	cx: 110,
	action: 50,
};

/**
 * Represents the baseline structure for a material's market details.
 */
interface MaterialData {
	/** The unique ticker symbol for the material. */
	ticker: string;
	/** The numeric price value of the material. */
	price: number;
}

/**
 * Extends the baseline material structure to represent an item currently in a shopping cart.
 */
interface CartItem extends MaterialData {
	/** The requested amount of the material. */
	quantity: number;
	/** A unique identifier representing the cart item entry. */
	id: number;
}

/**
 * Defines a mapping between material ticker symbols and their corresponding aggregated market prices.
 */
interface MarketMap {
	[ticker: string]: number;
}

/**
 * Represents the configuration properties for the CorpPricesTab component.
 */
interface CorpPricesTabProps {
	/** An array of raw market data objects containing varying schema details. */
	marketData: Record<string, any>[];
}

const SCROLLBAR_STYLES = `
  .custom-scroll::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .custom-scroll::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
  }
  .custom-scroll::-webkit-scrollbar-thumb {
    background: rgba(123, 104, 238, 0.4); 
    border-radius: 4px;
    border: 2px solid rgba(0,0,0,0.1); 
  }
  .custom-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(123, 104, 238, 0.7);
  }
`;

/**
 * Properties for the BufferedInput component.
 */
interface BufferedInputProps {
	/** The initial or current numeric value to be displayed. */
	value: number;
	/**
	 * Callback invoked when the user confirms their input changes.
	 *
	 * @param val - The newly confirmed numeric value.
	 */
	onCommit: (val: number) => void;
}

/**
 * Provides an input field that handles local state updates while the user types,
 * committing the final parsed value only when the input loses focus.
 */
const BufferedInput = memo(({ value, onCommit }: BufferedInputProps) => {
	const [localVal, setLocalVal] = useState(value.toString());

	useEffect(() => {
		setLocalVal(value.toString());
	}, [value]);

	/**
	 * Handles immediate keystroke updates. Validates that the input only contains digits.
	 *
	 * @param e - The React change event.
	 */
	const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value;
		if (val === "" || /^\d*$/.test(val)) setLocalVal(val);
	}, []);

	/**
	 * Parses the local string state into an integer and triggers the onCommit callback.
	 * Applies boundary limits to ensure sensible data bounds.
	 */
	const handleBlur = useCallback(() => {
		if (localVal === "") {
			setLocalVal("0");
			onCommit(0);
		} else {
			let parsed = parseInt(localVal, 10);
			if (isNaN(parsed)) parsed = 0;
			if (parsed > 999999999) parsed = 999999999;
			setLocalVal(parsed.toString());
			if (parsed !== value) onCommit(parsed);
		}
	}, [localVal, onCommit, value]);

	const handleFocus = useCallback(
		(e: React.FocusEvent<HTMLInputElement>) => e.target.select(),
		[],
	);
	const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
		if (e.key === "Enter") (e.target as HTMLInputElement).blur();
	}, []);

	return (
		<input
			type="text"
			value={localVal}
			onChange={handleChange}
			onBlur={handleBlur}
			onFocus={handleFocus}
			onKeyDown={handleKeyDown}
			style={{
				width: "100%",
				maxWidth: "80px",
				textAlign: "center",
				background: "rgba(255,255,255,0.08)",
				border: "1px solid rgba(255,255,255,0.1)",
				borderRadius: "4px",
				color: "white",
				padding: "6px",
				fontSize: "0.9rem",
				fontWeight: "bold",
				outline: "none",
			}}
		/>
	);
});

BufferedInput.displayName = "BufferedInput";

/**
 * Properties for the MaterialRow component.
 */
interface MaterialRowProps {
	/** The data specific to the material being rendered. */
	item: MaterialData;
	/** The aggregated reference market price for the material. */
	cxPrice: number;
	/** Callback triggered when the user requests to add the material to their cart. */
	onAdd: (i: MaterialData) => void;
}

/**
 * Renders a single row representing a material's price comparison within the virtualized list.
 */
const MaterialRow = memo(
	({ item, cxPrice, onAdd }: MaterialRowProps) => {
		const diff = cxPrice ? item.price - cxPrice : 0;
		const pct = cxPrice ? (diff / cxPrice) * 100 : 0;

		const isCheaper = diff < 0;
		const isExpensive = diff > 0;

		const color = isCheaper
			? "#69f0ae"
			: isExpensive
				? "#ff5252"
				: "rgba(255,255,255,0.5)";
		const badgeBg = isCheaper
			? "rgba(105, 240, 174, 0.1)"
			: isExpensive
				? "rgba(255, 82, 82, 0.1)"
				: "rgba(255,255,255,0.05)";
		const Icon = isCheaper ? TrendingDown : isExpensive ? TrendingUp : Minus;

		return (
			<tr
				style={{
					height: ROW_HEIGHT,
					borderBottom: "1px solid rgba(255,255,255,0.05)",
				}}
			>
				<td
					style={{
						padding: "0 8px",
						color: "white",
						fontWeight: "bold",
						fontSize: "0.9rem",
						overflow: "hidden",
						whiteSpace: "nowrap",
						textOverflow: "ellipsis",
					}}
				>
					<MaterialBadge ticker={item.ticker} />
				</td>
				<td
					style={{
						padding: "0 8px",
						textAlign: "right",
						color: "#7b68ee",
						width: COL_WIDTHS.price,
						fontWeight: 600,
						fontSize: "0.9rem",
					}}
				>
					{item.price.toLocaleString()} ICA
				</td>
				<td
					style={{
						padding: "0 8px",
						width: COL_WIDTHS.cx,
						verticalAlign: "middle",
					}}
				>
					{cxPrice ? (
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								alignItems: "flex-end",
								justifyContent: "center",
								gap: 2,
							}}
						>
							<span
								style={{
									fontSize: "0.75rem",
									color: "rgba(255,255,255,0.4)",
									lineHeight: 1,
								}}
							>
								{cxPrice.toLocaleString(undefined, {
									maximumFractionDigits: 2,
								})}{" "}
								ICA
							</span>
							<div
								style={{
									display: "inline-flex",
									alignItems: "center",
									gap: 4,
									padding: "2px 8px",
									borderRadius: "50px",
									backgroundColor: badgeBg,
									border: `1px solid ${color}40`,
									minWidth: "55px",
									justifyContent: "center",
									height: "20px",
								}}
							>
								{Icon && <Icon size={10} color={color} />}
								<span
									style={{
										fontSize: "0.7rem",
										fontWeight: 700,
										color: color,
										lineHeight: 1,
									}}
								>
									{Math.abs(pct).toFixed(1)}%
								</span>
							</div>
						</div>
					) : (
						<div style={{ textAlign: "right", color: "rgba(255,255,255,0.2)" }}>
							-
						</div>
					)}
				</td>
				<td style={{ textAlign: "center", width: COL_WIDTHS.action }}>
					<IconButton
						size="small"
						onClick={() => onAdd(item)}
						sx={{
							color: "#4caf50",
							padding: "4px",
							bgcolor: "rgba(76, 175, 80, 0.1)",
							"&:hover": { bgcolor: "rgba(76, 175, 80, 0.3)" },
						}}
					>
						<Plus size={18} />
					</IconButton>
				</td>
			</tr>
		);
	},
	(prev, next) => prev.item === next.item && prev.cxPrice === next.cxPrice,
);

MaterialRow.displayName = "MaterialRow";

/**
 * Properties for the CartRow component.
 */
interface CartRowProps {
	/** The specific configuration of the item in the cart. */
	item: CartItem;
	/**
	 * Callback invoked when the user adjusts the desired quantity of the item.
	 *
	 * @param id - The unique identifier of the cart item.
	 * @param q - The newly requested quantity amount.
	 */
	onUpdate: (id: number, q: number) => void;
	/**
	 * Callback invoked when the user removes the item from the cart entirely.
	 *
	 * @param id - The unique identifier of the cart item to be removed.
	 */
	onRemove: (id: number) => void;
}

/**
 * Renders a single row representing an item within the user's shopping cart.
 */
const CartRow = memo(
	({ item, onUpdate, onRemove }: CartRowProps) => {
		return (
			<tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
				<td
					style={{
						padding: "8px",
						color: "white",
						fontWeight: 500,
						fontSize: "0.9rem",
					}}
				>
					<MaterialBadge ticker={item.ticker} />
				</td>
				<td style={{ padding: "8px", textAlign: "center" }}>
					<BufferedInput
						value={item.quantity}
						onCommit={(q) => onUpdate(item.id, q)}
					/>
				</td>
				<td
					style={{
						padding: "8px",
						textAlign: "right",
						color: "#7b68ee",
						fontSize: "0.9rem",
					}}
				>
					{(item.price * item.quantity).toLocaleString()}
				</td>
				<td style={{ padding: "8px", textAlign: "center" }}>
					<IconButton
						size="small"
						onClick={() => onRemove(item.id)}
						sx={{ "&:hover": { bgcolor: "rgba(255,100,100,0.1)" } }}
					>
						<Trash2 size={16} color="#ff6b6b" />
					</IconButton>
				</td>
			</tr>
		);
	},
	(prev, next) => prev.item === next.item,
);

CartRow.displayName = "CartRow";

/**
 * Properties for the VirtualMaterialList component.
 */
interface VirtualMaterialListProps {
	/** The subset of material records currently matching the active filters. */
	materials: MaterialData[];
	/** A dictionary mapping material tickers to their respective aggregated reference prices. */
	marketPrices: MarketMap;
	/** Callback passed down to handle the addition of materials to the shopping cart. */
	addToCart: (item: MaterialData) => void;
}

/**
 * A highly optimized list view component that only renders the DOM elements
 * currently visible within the user's scroll viewport, significantly reducing
 * rendering overhead for large datasets.
 */
const VirtualMaterialList = memo(
	({ materials, marketPrices, addToCart }: VirtualMaterialListProps) => {
		const [scrollTop, setScrollTop] = useState(0);
		const [viewportH, setViewportH] = useState(600);
		const containerRef = useRef<HTMLDivElement>(null);

		useEffect(() => {
			if (!containerRef.current) return;
			const obs = new ResizeObserver((entries) => {
				for (const e of entries) {
					if (e.contentRect.height > 0) setViewportH(e.contentRect.height);
				}
			});
			obs.observe(containerRef.current);
			return () => obs.disconnect();
		}, []);

		/**
		 * Tracks the vertical scrolling position within the container.
		 *
		 * @param e - The UI scroll event.
		 */
		const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
			setScrollTop(e.currentTarget.scrollTop);
		}, []);

		const totalCount = materials.length;
		const startIdx = Math.floor(scrollTop / ROW_HEIGHT);
		const visibleCount = Math.ceil(viewportH / ROW_HEIGHT);
		const renderStart = Math.max(0, startIdx - OVERSCAN);
		const renderEnd = Math.min(totalCount, startIdx + visibleCount + OVERSCAN);
		const visibleItems = materials.slice(renderStart, renderEnd);

		const paddingTop = renderStart * ROW_HEIGHT;
		const paddingBottom = (totalCount - renderEnd) * ROW_HEIGHT;

		return (
			<div
				ref={containerRef}
				onScroll={onScroll}
				className="custom-scroll"
				style={{ height: "100%", overflowY: "auto", overflowX: "hidden" }}
			>
				<table
					style={{
						width: "100%",
						borderCollapse: "collapse",
						tableLayout: "fixed",
					}}
				>
					<thead
						style={{
							position: "sticky",
							top: 0,
							background: "#1a1d42",
							zIndex: 10,
							boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
						}}
					>
						<tr style={{ height: HEADER_HEIGHT }}>
							<th
								style={{
									textAlign: "left",
									padding: "0 8px",
									color: "#fff",
									fontSize: "0.8rem",
								}}
							>
								Ticker
							</th>
							<th
								style={{
									textAlign: "right",
									padding: "0 8px",
									color: "#fff",
									width: COL_WIDTHS.price,
									fontSize: "0.8rem",
								}}
							>
								Price
							</th>
							<th
								style={{
									textAlign: "right",
									padding: "0 8px",
									color: "#fff",
									width: COL_WIDTHS.cx,
									fontSize: "0.8rem",
								}}
							>
								CX Ask
							</th>
							<th
								style={{ textAlign: "center", width: COL_WIDTHS.action }}
							></th>
						</tr>
					</thead>
					<tbody>
						{paddingTop > 0 && (
							<tr style={{ height: paddingTop }}>
								<td colSpan={4} />
							</tr>
						)}

						{visibleItems.map((item: MaterialData) => (
							<MaterialRow
								key={item.ticker}
								item={item}
								cxPrice={marketPrices[item.ticker] || 0}
								onAdd={addToCart}
							/>
						))}

						{paddingBottom > 0 && (
							<tr style={{ height: paddingBottom }}>
								<td colSpan={4} />
							</tr>
						)}
					</tbody>
				</table>
			</div>
		);
	},
);

VirtualMaterialList.displayName = "VirtualMaterialList";

/**
 * The core component interface for displaying the corporate pricing list and managing
 * an interactive shopping cart for material requisitions.
 */
const CorpPricesTab: React.FC<CorpPricesTabProps> = ({ marketData }) => {
	const [materials, setMaterials] = useState<MaterialData[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const deferredSearch = useDeferredValue(searchTerm);

	const [cart, setCart] = useState<CartItem[]>(() => {
		try {
			return JSON.parse(localStorage.getItem("corpShoppingCart") || "[]");
		} catch {
			return [];
		}
	});

	// Derives a mapping of the most relevant ask price across predefined market identifiers.
	const marketPrices: MarketMap = useMemo(() => {
		const map: MarketMap = {};
		if (!marketData) return map;
		marketData.forEach((row) => {
			const ticker = row.Ticker || row.ticker;
			if (!ticker) return;
			let sum = 0,
				count = 0;
			["IC1"].forEach((m) => {
				const val = row[`${m}-AskPrice`];
				if (typeof val === "number" && val > 0) {
					sum += val;
					count++;
				}
			});
			if (count > 0) map[ticker] = sum / count;
		});
		return map;
	}, [marketData]);

	useEffect(() => {
		const fetchCorpPrices = async () => {
			try {
				const res = await fetch("https://api.punoted.net/corp_prices_all");
				const json = await res.json();
				if (json.success && Array.isArray(json.data)) setMaterials(json.data);
			} catch (err) {
				console.error("Corp Price Fetch Error", err);
			} finally {
				setLoading(false);
			}
		};
		fetchCorpPrices();
	}, []);

	useEffect(() => {
		localStorage.setItem("corpShoppingCart", JSON.stringify(cart));
	}, [cart]);

	/**
	 * Appends a newly selected material to the current cart. If the material already exists,
	 * it intelligently increments the corresponding quantity.
	 *
	 * @param item - The selected material to add to the cart.
	 */
	const addToCart = useCallback((item: MaterialData) => {
		setCart((prev) => {
			const exists = prev.find((p) => p.ticker === item.ticker);
			return exists
				? prev.map((p) =>
						p.ticker === item.ticker ? { ...p, quantity: p.quantity + 1 } : p,
					)
				: [...prev, { ...item, quantity: 1, id: Date.now() }];
		});
	}, []);

	/**
	 * Modifies the explicit quantity requested for a specific cart item entry.
	 *
	 * @param id - The unique identifier of the target cart item.
	 * @param qty - The newly requested quantity amount, bounded to a minimum of 0.
	 */
	const updateQty = useCallback((id: number, qty: number) => {
		setCart((prev) =>
			prev.map((item) =>
				item.id === id ? { ...item, quantity: Math.max(0, qty) } : item,
			),
		);
	}, []);

	/**
	 * Extracts a specific item from the shopping cart based on its identifier.
	 *
	 * @param id - The unique identifier of the target cart item to be removed.
	 */
	const removeFromCart = useCallback((id: number) => {
		setCart((prev) => prev.filter((item) => item.id !== id));
	}, []);

	/**
	 * Empties the current state of the shopping cart entirely.
	 */
	const clearCart = useCallback(() => setCart([]), []);

	// Applies the user's deferred textual search input to filter the overall material list.
	const filteredMaterials = useMemo(() => {
		if (!deferredSearch) return materials;
		const terms = deferredSearch
			.toLowerCase()
			.split(",")
			.map((t) => t.trim())
			.filter(Boolean);
		return materials.filter((m) =>
			terms.some((t) => m.ticker.toLowerCase().startsWith(t)),
		);
	}, [materials, deferredSearch]);

	// Aggregates the cumulative total cost of all entries within the shopping cart.
	const totalCost = useMemo(
		() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
		[cart],
	);

	if (loading)
		return (
			<Box
				sx={{
					display: "flex",
					height: "100%",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<CircularProgress color="primary" />
			</Box>
		);

	return (
		<Box
			sx={{
				flex: 1,
				display: "flex",
				flexDirection: { xs: "column-reverse", md: "row" },
				p: 2,
				gap: 2,
				minHeight: 0,
				height: "100%",
				overflow: "hidden",
			}}
		>
			<style>{SCROLLBAR_STYLES}</style>

			<Box
				sx={{
					flex: { xs: "1 1 auto", md: "0 0 60%" },
					display: "flex",
					flexDirection: "column",
					gap: 2,
					height: "100%",
					minHeight: 0,
				}}
			>
				<Paper sx={{ ...glassStyle, p: 2, borderRadius: 2, flexShrink: 0 }}>
					<TextField
						fullWidth
						placeholder="Filter (e.g. BBH, O)..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						size="small"
						slotProps={{
							input: {
								startAdornment: (
									<InputAdornment position="start">
										<Search color="rgba(255,255,255,0.7)" size={20} />
									</InputAdornment>
								),
							},
						}}
						sx={{
							"& .MuiOutlinedInput-root": {
								color: "white",
								"& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
							},
						}}
					/>
				</Paper>

				<Paper
					sx={{
						...glassStyle,
						flex: 1,
						borderRadius: 2,
						overflow: "hidden",
						display: "flex",
						flexDirection: "column",
						minHeight: 0,
					}}
				>
					<VirtualMaterialList
						materials={filteredMaterials}
						marketPrices={marketPrices}
						addToCart={addToCart}
					/>
				</Paper>
			</Box>

			<Paper
				sx={{
					flex: { xs: "0 0 auto", md: 1 },
					...glassStyle,
					borderRadius: 2,
					display: "flex",
					flexDirection: "column",
					height: { xs: "40vh", md: "100%" },
					overflow: "hidden",
				}}
			>
				<Box
					sx={{
						p: 2,
						borderBottom: "1px solid rgba(255,255,255,0.1)",
						display: "flex",
						alignItems: "center",
						gap: 1,
						flexShrink: 0,
					}}
				>
					<ShoppingCart size={20} color="#7b68ee" />
					<Typography variant="h6" sx={{ color: "white", fontWeight: 600 }}>
						Req Order
					</Typography>
					<Box sx={{ flexGrow: 1 }} />
					{cart.length > 0 && (
						<IconButton
							size="small"
							onClick={clearCart}
							sx={{ color: "rgba(255,100,100,0.8)" }}
						>
							<RefreshCcw size={16} />
						</IconButton>
					)}
				</Box>

				<Box
					className="custom-scroll"
					sx={{ flex: 1, overflowY: "auto", p: 1 }}
				>
					<table style={{ width: "100%", borderCollapse: "collapse" }}>
						<thead>
							<tr>
								<th
									style={{
										color: "#aaa",
										textAlign: "left",
										fontSize: "0.8rem",
										padding: "8px",
									}}
								>
									Item
								</th>
								<th
									style={{
										color: "#aaa",
										textAlign: "center",
										fontSize: "0.8rem",
										padding: "8px",
									}}
								>
									Qty
								</th>
								<th
									style={{
										color: "#aaa",
										textAlign: "right",
										fontSize: "0.8rem",
										padding: "8px",
									}}
								>
									Total
								</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{cart.map((item) => (
								<CartRow
									key={item.id}
									item={item}
									onUpdate={updateQty}
									onRemove={removeFromCart}
								/>
							))}
							{cart.length === 0 && (
								<tr>
									<td
										colSpan={4}
										style={{ textAlign: "center", padding: 20, color: "#666" }}
									>
										Cart is empty
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</Box>

				<Box
					sx={{
						p: 2,
						borderTop: "1px solid rgba(255,255,255,0.1)",
						bgcolor: "rgba(0,0,0,0.2)",
						flexShrink: 0,
					}}
				>
					<Stack
						direction="row"
						sx={{ mb: 2, justifyContent: "space-between" }}
					>
						<Typography sx={{ color: "#aaa" }}>Total</Typography>
						<Typography
							variant="h5"
							sx={{ color: "#7b68ee", fontWeight: "bold" }}
						>
							{totalCost.toLocaleString()} ICA
						</Typography>
					</Stack>
					<Button
						fullWidth
						variant="contained"
						disabled={cart.length === 0}
						sx={{ bgcolor: "#7b68ee" }}
					>
						Copy Order
					</Button>
				</Box>
			</Paper>
		</Box>
	);
};

export default CorpPricesTab;
