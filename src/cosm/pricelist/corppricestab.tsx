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
	Link,
	CircularProgress,
	Drawer,
	Tooltip,
	useTheme,
	alpha,
	useMediaQuery,
} from "@mui/material";
import { Search, Trash2, PlusCircle, Copy, X } from "lucide-react";
import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";
import { API_BASE_URL } from "../../config/api";
import MaterialBadge from "../components/materialbadge";
import MaterialPickerHeader from "../components/materialpickerheader";
import InlineConfirmButton from "../components/inlineconfirmbutton";
import PriceComparisonBadge from "../vendors/components/pricecomparisonbadge";
import { formatContd } from "../vendors/shoppinglistmodal";
import { Toast } from "../vendors/toast";
import { Modal } from "../vendors/modal";
import { getDiffStats } from "../vendors/utils/pricecomparison";
import { parseShoppingListImport } from "../vendors/utils/shoppinglistimport";
import { useMaterialSearch } from "../hooks/usematerialsearch";

const ROW_HEIGHT = 52;
const HEADER_HEIGHT = 40;
const OVERSCAN = 25;

const ACTION_COLUMN_WIDTH = 50;

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
  .corp-price-table thead th {
    color: #fff !important;
    font-weight: 400;
    font-size: 0.75rem !important;
    text-transform: uppercase;
  }
  .corp-price-row:hover {
    background-color: rgba(255,255,255,0.05);
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
			setLocalVal("1");
			onCommit(1);
		} else {
			let parsed = parseInt(localVal, 10);
			if (isNaN(parsed)) parsed = 1;
			if (parsed < 1) parsed = 1;
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
				textAlign: "right",
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
		const cxStats = getDiffStats(item.price, cxPrice, "ask");

		return (
			<tr
				className="corp-price-row"
				style={{
					height: ROW_HEIGHT,
					borderBottom: "1px solid rgba(255,255,255,0.15)",
				}}
			>
				<td
					style={{
						padding: "0 8px",
						textAlign: "center",
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
					}}
				>
					{item.price ? (
						<>
							<span style={{ color: "#ffca28", fontWeight: "bold" }}>
								{item.price.toLocaleString()}
							</span>{" "}
							<span style={{ fontSize: "0.75em" }}>ICA</span>
						</>
					) : (
						"—"
					)}
				</td>
				<td
					style={{
						padding: "0 8px",
						textAlign: "right",
					}}
				>
					{cxPrice ? (
						<>
							<span style={{ color: "#ffca28", fontWeight: "bold" }}>
								{Math.round(cxPrice).toLocaleString()}
							</span>{" "}
							<span style={{ fontSize: "0.75em" }}>ICA</span>
						</>
					) : (
						"—"
					)}
				</td>
				<td
					style={{
						padding: "0 8px",
						textAlign: "center",
						verticalAlign: "middle",
					}}
				>
					<div style={{ display: "flex", justifyContent: "center" }}>
						{item.price && cxPrice && cxStats ? (
							<PriceComparisonBadge label="CX" stats={cxStats} />
						) : (
							"—"
						)}
					</div>
				</td>
				<td style={{ textAlign: "center", width: ACTION_COLUMN_WIDTH }}>
					<IconButton size="small" onClick={() => onAdd(item)}>
						<PlusCircle className="inline-icon" color="#69f0ae" />
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
				<td
					style={{
						padding: "8px",
						textAlign: "right",
						fontSize: "0.9rem",
					}}
				>
					{item.price ? (
						<>
							<span style={{ color: "#ffca28", fontWeight: "bold" }}>
								{item.price.toLocaleString()}
							</span>{" "}
							<span style={{ fontSize: "0.75em" }}>ICA</span>
						</>
					) : (
						"—"
					)}
				</td>
				<td style={{ padding: "8px", textAlign: "right" }}>
					<BufferedInput
						value={item.quantity}
						onCommit={(q) => onUpdate(item.id, q)}
					/>
				</td>
				<td
					style={{
						padding: "8px",
						textAlign: "right",
						fontSize: "0.9rem",
					}}
				>
					{item.price ? (
						<>
							<span style={{ color: "#ffca28", fontWeight: "bold" }}>
								{(item.price * item.quantity).toLocaleString()}
							</span>{" "}
							<span style={{ fontSize: "0.75em" }}>ICA</span>
						</>
					) : (
						"—"
					)}
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
					className="corp-price-table"
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
							background: "#0e0e1f",
							borderBottom: "1px solid rgba(255,255,255,0.15)",
							zIndex: 10,
							boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
						}}
					>
						<tr style={{ height: HEADER_HEIGHT }}>
							<th
								style={{
									textAlign: "center",
									padding: "0 8px",
								}}
							>
								Material
							</th>
							<th
								style={{
									textAlign: "right",
									padding: "0 8px",
								}}
							>
								COSM
							</th>
							<th
								style={{
									textAlign: "right",
									padding: "0 8px",
								}}
							>
								CX
							</th>
							<th
								style={{
									textAlign: "center",
									padding: "0 8px",
								}}
							>
								COSMΔ
							</th>
							<th
								style={{ textAlign: "center", width: ACTION_COLUMN_WIDTH }}
							></th>
						</tr>
					</thead>
					<tbody>
						{paddingTop > 0 && (
							<tr style={{ height: paddingTop }}>
								<td colSpan={5} />
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
								<td colSpan={5} />
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
	const theme = useTheme();
	const isCompact = useMediaQuery(theme.breakpoints.down("md"));
	const { searchQuery, exactMatch, setSearchQuery, toggleExactMatch } =
		useMaterialSearch();
	const [materials, setMaterials] = useState<MaterialData[]>([]);
	const [loading, setLoading] = useState(true);
	const [copyToastOpen, setCopyToastOpen] = useState(false);
	const [showImport, setShowImport] = useState(false);
	const [importText, setImportText] = useState("");
	const [importToast, setImportToast] = useState<{
		open: boolean;
		message: string;
		color: "success" | "error";
	}>({ open: false, message: "", color: "success" });
	const [showMaterials, setShowMaterials] = useState(false);
	const isDrawerView = isCompact || showMaterials;
	const deferredSearch = useDeferredValue(searchQuery);

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
				const res = await fetch(`${API_BASE_URL}corp_prices_all`);
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
	 * @param qty - The newly requested quantity amount, bounded to a minimum of 1.
	 */
	const updateQty = useCallback((id: number, qty: number) => {
		setCart((prev) =>
			prev.map((item) =>
				item.id === id ? { ...item, quantity: Math.max(1, qty) } : item,
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

	// Applies the deferred ticker search to the material list.
	const filteredMaterials = useMemo(() => {
		const terms = deferredSearch
			.toLowerCase()
			.split(",")
			.map((t) => t.trim())
			.filter(Boolean);
		return materials
			.filter(
				(material) =>
					!terms.length ||
					terms.some((term) =>
						exactMatch
							? material.ticker.toLowerCase() === term
							: material.ticker.toLowerCase().includes(term),
					),
			)
			.sort((a, b) => a.ticker.localeCompare(b.ticker));
	}, [materials, deferredSearch, exactMatch]);
	const validMaterialTickers = useMemo(
		() => new Set(materials.map(({ ticker }) => ticker)),
		[materials],
	);
	const handleImport = useCallback(() => {
		try {
			const importedMaterials = parseShoppingListImport(
				importText,
				validMaterialTickers,
			);
			setCart(
				importedMaterials.map(({ materialticker, quantity }, index) => ({
					...materials.find(({ ticker }) => ticker === materialticker)!,
					quantity,
					id: Date.now() + index,
				})),
			);
			setShowImport(false);
			setImportText("");
			setShowMaterials(false);
			setImportToast({
				open: true,
				message: `Imported ${importedMaterials.length} materials`,
				color: "success",
			});
		} catch (error) {
			setImportToast({
				open: true,
				message: error instanceof Error ? error.message : "Invalid input",
				color: "error",
			});
		}
	}, [importText, materials, validMaterialTickers]);

	// Aggregates the cumulative total cost of all entries within the shopping cart.
	const totalCost = useMemo(
		() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
		[cart],
	);
	const handleCopy = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(
				formatContd(
					"HRT",
					[...cart]
						.sort((a, b) => a.ticker.localeCompare(b.ticker))
						.map(({ quantity, ticker, price }) => ({
							amount: quantity,
							ticker,
							price,
						})),
				),
			);
			setCopyToastOpen(true);
		} catch (error) {
			console.error("Failed to copy materials", error);
		}
	}, [cart]);
	const panelSx = {
		background: theme.palette.background.paper,
		border: `1px solid ${theme.palette.divider}`,
		borderRadius: 2,
	};

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

	const materialSelection = (
		<Box
			sx={{
				flex: { xs: "1 1 auto", md: "0 0 50%" },
				display: { xs: "none", md: "flex" },
				flexDirection: "column",
				height: "100%",
				minHeight: 0,
			}}
		>
			<Paper
				sx={{
					...panelSx,
					background: isDrawerView ? "transparent" : panelSx.background,
					border: isDrawerView ? "none" : panelSx.border,
					borderRadius: isDrawerView ? 0 : panelSx.borderRadius,
					flex: 1,
					overflow: "hidden",
					display: "flex",
					flexDirection: "column",
					minHeight: 0,
				}}
			>
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						height: "100%",
						p: isDrawerView ? 2 : 0,
					}}
				>
					<MaterialPickerHeader
						title="PRICE LIST"
						isMobile={isDrawerView}
						onImport={() => setShowImport(true)}
						onClose={() => setShowMaterials(false)}
					/>
					<Box sx={{ p: isDrawerView ? 0 : 2, pb: 1 }}>
						<TextField
							fullWidth
							variant="outlined"
							placeholder="Search Materials..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							size="small"
							slotProps={{
								input: {
									startAdornment: (
										<Search
											className="inline-icon"
											style={{ marginRight: 8, opacity: 0.5 }}
										/>
									),
									endAdornment: (
										<InputAdornment position="end">
											{searchQuery && (
												<IconButton
													size="small"
													aria-label="Clear material search"
													onClick={() => setSearchQuery("")}
												>
													<X className="inline-icon" />
												</IconButton>
											)}
											<Tooltip
												title={
													exactMatch ? "Exact Match: ON" : "Exact Match: OFF"
												}
											>
												<IconButton
													size="small"
													onClick={toggleExactMatch}
													sx={{
														color: exactMatch
															? "primary.main"
															: "text.secondary",
														bgcolor: exactMatch
															? alpha(theme.palette.primary.main, 0.15)
															: "transparent",
													}}
												>
													<CenterFocusStrongIcon className="inline-icon" />
												</IconButton>
											</Tooltip>
										</InputAdornment>
									),
								},
							}}
							sx={{
								"& .MuiOutlinedInput-root": {
									bgcolor: "rgba(0,0,0,0.15)",
									borderRadius: "12px",
								},
							}}
						/>
					</Box>
					<Box sx={{ flex: 1, minHeight: 0 }}>
						<VirtualMaterialList
							materials={filteredMaterials}
							marketPrices={marketPrices}
							addToCart={addToCart}
						/>
					</Box>
				</Box>
			</Paper>
		</Box>
	);

	return (
		<Box
			sx={{
				flex: 1,
				display: "flex",
				flexDirection: { xs: "column", md: "row" },
				gap: { xs: 0, md: 1 },
				minHeight: 0,
				height: "100%",
				overflow: "hidden",
			}}
		>
			<style>{SCROLLBAR_STYLES}</style>

			{materialSelection}

			<Paper
				sx={{
					flex: { xs: "0 0 auto", md: 1 },
					...panelSx,
					display: "flex",
					flexDirection: "column",
					height: "100%",
					overflow: "hidden",
				}}
			>
				<Box
					sx={{
						p: 1.5,
						borderBottom: `1px solid ${theme.palette.divider}`,
						bgcolor: "rgba(0,0,0,0.05)",
						display: "flex",
						alignItems: "center",
						gap: 1,
						flexShrink: 0,
					}}
				>
					<Typography
						variant="subtitle2"
						sx={{
							color: "text.primary",
							fontWeight: "bold",
							fontSize: "1.05rem",
						}}
					>
						YOUR MATERIALS
					</Typography>
					{isCompact && (
						<Button
							size="small"
							variant="contained"
							startIcon={<PlusCircle className="inline-icon" />}
							onClick={() => setShowMaterials(true)}
						>
							ADD
						</Button>
					)}
					<Box sx={{ flexGrow: 1 }} />
					<Tooltip
						title={
							cart.length === 0 ? "" : "Paste in Sheets/Excel field in CONTD"
						}
					>
						<span>
							<Button
								size="small"
								variant="contained"
								startIcon={<Copy className="inline-icon" />}
								disabled={cart.length === 0}
								onClick={handleCopy}
								sx={{ fontWeight: "bold" }}
							>
								COPY
							</Button>
						</span>
					</Tooltip>
					<InlineConfirmButton
						buttonText="CLEAR"
						icon={<Trash2 className="inline-icon" />}
						color="error"
						action={clearCart}
						disabled={cart.length === 0}
					/>
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
									MATERIAL
								</th>
								<th
									style={{
										color: "#aaa",
										textAlign: "right",
										fontSize: "0.8rem",
										padding: "8px",
									}}
								>
									<Tooltip title="Price Per Unit">
										<Box
											component="span"
											sx={{
												cursor: "help",
												textDecoration: "underline dotted",
											}}
										>
											PPU
										</Box>
									</Tooltip>
								</th>
								<th
									style={{
										color: "#aaa",
										textAlign: "right",
										fontSize: "0.8rem",
										padding: "8px",
									}}
								>
									QUANTITY
								</th>
								<th
									style={{
										color: "#aaa",
										textAlign: "right",
										fontSize: "0.8rem",
										padding: "8px",
									}}
								>
									PRICE
								</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{[...cart]
								.sort((a, b) => a.ticker.localeCompare(b.ticker))
								.map((item) => (
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
										colSpan={5}
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
						p: 1.5,
						bgcolor: "rgba(0,0,0,0.3)",
						flexShrink: 0,
					}}
				>
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
							<Box
								component="span"
								sx={{ color: theme.palette.warning.main, fontWeight: "bold" }}
							>
								{totalCost.toLocaleString()}
							</Box>{" "}
							<Box
								component="span"
								sx={{ color: "text.primary", fontSize: "0.7rem" }}
							>
								ICA
							</Box>
						</Typography>
					</Box>
				</Box>
			</Paper>
			<Drawer
				anchor="bottom"
				open={showMaterials}
				onClose={() => setShowMaterials(false)}
				sx={{ zIndex: 9999 }}
				slotProps={{
					paper: {
						sx: {
							height: "100%",
							backgroundImage: "none",
							borderTopLeftRadius: 16,
							borderTopRightRadius: 16,
						},
					},
				}}
			>
				{React.cloneElement(materialSelection, {
					sx: {
						...materialSelection.props.sx,
						display: "flex",
						flex: 1,
						height: "100%",
					},
				})}
			</Drawer>
			<Toast
				open={copyToastOpen}
				message={`Copied CONTD for ${cart.length} material${cart.length === 1 ? "" : "s"}!`}
				color="success"
				onClose={() => setCopyToastOpen(false)}
			/>
			<Modal
				open={showImport}
				onClose={() => {
					setShowImport(false);
					setImportText("");
				}}
				title="IMPORT MATERIALS"
				actionLabel="IMPORT"
				onAction={handleImport}
			>
				<TextField
					autoFocus
					fullWidth
					multiline
					minRows={8}
					placeholder="Paste materials + quantities in CSV/TSV or XIT ACT JSON"
					value={importText}
					onChange={(event) => setImportText(event.target.value)}
					sx={{ mt: 1 }}
				/>
				<Link
					component="button"
					type="button"
					variant="body2"
					onClick={() => setImportText("RAT,40\nOVE,4")}
					sx={{ mt: 1 }}
				>
					Example
				</Link>
			</Modal>
			<Toast
				open={importToast.open}
				message={importToast.message}
				color={importToast.color}
				onClose={() =>
					setImportToast((current) => ({ ...current, open: false }))
				}
			/>
		</Box>
	);
};

export default CorpPricesTab;
