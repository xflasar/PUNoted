import React, {
	useState,
	useMemo,
	memo,
	useDeferredValue,
	useRef,
	useEffect,
	useCallback,
} from "react";
import {
	Box,
	Paper,
	TextField,
	InputAdornment,
	Chip,
	Stack,
	Typography,
	useMediaQuery,
	Tooltip,
} from "@mui/material";
import { Search } from "lucide-react";
import { glassStyle } from "./customcomponents/glassstyle";
import MaterialBadge from "../components/materialbadge";

const MARKETS = ["AI1", "IC1", "CI1", "CI2", "NC1", "NC2"];
const ROW_HEIGHT = 44;
const HEADER_HEIGHT = 32;
const OVERSCAN = 80;

/**
 * Represents the structure of market data records.
 */
type MarketRowData = Record<string, any>;

/**
 * Properties for the MarketPricesTab component.
 */
interface MarketPricesTabProps {
	/**
	 * Indicates whether the user is currently authenticated.
	 */
	isLoggedIn: boolean;
	/**
	 * An array of market data records retrieved from the server.
	 */
	marketData: MarketRowData[];
	/**
	 * The timestamp indicating when the market data was last refreshed.
	 */
	lastUpdated: Date | null;
}

/**
 * Defines the structure for formatting the age of a data record.
 */
interface FreshnessData {
	/** The hex color code representing the age of the data. */
	c: string;
	/** A human-readable string indicating how long ago the data was updated. */
	t: string;
}

const TABLE_STYLES = `
  .virtual-table {
    display: table;
    table-layout: fixed;
    width: 100%;
    min-width: 100%;
    border-collapse: collapse;
  }
  .virtual-row {
    height: ${ROW_HEIGHT}px;
  }
  .virtual-row:hover {
    background-color: rgba(255,255,255,0.05);
  }
  .virtual-cell {
    padding: 0 4px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    border-right: 1px solid rgba(255,255,255,0.08);
    box-sizing: border-box;
    vertical-align: middle;
    min-width: 125px; 
    width: 125px;
  }
  .col-ticker {
    width: 36px;
    min-width: 36px;
    max-width: 36px;
    position: sticky;
    left: 0;
    z-index: 5;
    background-color: #14162e;
    color: #fff;
    font-weight: 700;
    font-size: 0.8rem;
    box-shadow: 2px 0 5px rgba(0,0,0,0.3);
    text-align: left;
    padding-left: 4px;
    overflow: hidden;
    white-space: nowrap;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    border-right: 1px solid rgba(255,255,255,0.08);
  }
  .cell-content {
    display: grid;
    grid-template-columns: 1fr auto; 
    align-items: center;
    width: 100%;
    height: 100%;
  }
  .market-data {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2px;
  }
  .data-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    line-height: 1;
  }
  .ask-lbl { color: #ff5252; font-weight: 700; opacity: 0.8; font-size: 0.65rem; margin-right: 4px; }
  .bid-lbl { color: #69f0ae; font-weight: 700; opacity: 0.8; font-size: 0.65rem; margin-right: 4px; }
  .price-val { font-variant-numeric: tabular-nums; font-weight: 600; text-align: right; font-size: 0.85rem; letter-spacing: -0.02em; white-space: nowrap; }
  .qty-badge { border-radius: 2px; padding: 0 3px; font-size: 0.6rem; min-width: 20px; text-align: center; margin-right: 4px; }
  .status-dot { width: 5px; height: 5px; border-radius: 50%; margin-left: 6px; flex-shrink: 0; }
  .market-header {
    background-color: #0f1126;
    color: #7b68ee;
    font-weight: 700;
    font-size: 0.8rem;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    border-right: 1px solid rgba(255,255,255,0.08);
    text-align: center;
    height: ${HEADER_HEIGHT}px;
    min-width: 125px;
    width: 125px;
  }
  @media (max-width: 600px) {
    .virtual-cell, .market-header { min-width: 115px; width: 115px; }
    .col-ticker { width: 34px; min-width: 34px; font-size: 0.75rem; }
    .price-val { font-size: 0.8rem; }
  }
`;

/**
 * Formats numeric values to a condensed string representation.
 * Handles millions and thousands for quantity types.
 *
 * @param val - The numeric value to format.
 * @param type - Determines formatting logic: 'p' for price, 'q' for quantity.
 * @returns The formatted string representation of the number.
 */
const formatSmartNum = (val: number, type: "p" | "q"): string => {
	if (val >= 1000000)
		return (val / 1000000).toFixed(2).replace(/\.00$/, "") + "m";
	if (type === "q" && val >= 1000)
		return (val / 1000).toFixed(1).replace(/\.0$/, "") + "k";
	if (val % 1 === 0) return val.toLocaleString();
	return val.toLocaleString(undefined, {
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	});
};

/**
 * Evaluates the age of a date string and returns a color code and human-readable duration.
 *
 * @param dateStr - An optional ISO format date string.
 * @returns An object containing the color and formatted time string.
 */
const getFreshness = (dateStr?: string): FreshnessData => {
	if (!dateStr) return { c: "#ff5252", t: "Unknown" };
	const diff = Date.now() - new Date(dateStr).getTime();
	const c =
		diff < 3600000 ? "#69f0ae" : diff < 86400000 ? "#ffab40" : "#ff5252";

	const m = Math.floor(diff / 60000);
	let t = "Just now";
	if (m >= 1440) t = `${Math.floor(m / 1440)}d ago`;
	else if (m >= 60) t = `${Math.floor(m / 60)}h ago`;
	else if (m >= 1) t = `${m}m ago`;

	return { c, t };
};

/**
 * Determines the background color for the quantity badge based on the provided amount.
 *
 * @param amt - The quantity amount.
 * @returns The string representation of the CSS background color.
 */
const getQtyBg = (amt: number): string =>
	amt <= 0 ? "#3d1c1c" : amt < 100 ? "#3d321c" : "rgba(255,255,255,0.05)";

/**
 * Properties for the FastCell component.
 */
interface FastCellProps {
	/** The data record corresponding to the current row. */
	row: MarketRowData;
	/** The identifier of the specific market. */
	market: string;
}

/**
 * Renders an optimized cell containing the ask and bid data for a specific market.
 * Omits rendering details if no relevant pricing data exists.
 */
const FastCell = memo(
	({ row, market }: FastCellProps) => {
		const askPrice = row[`${market}-AskPrice`];
		const bidPrice = row[`${market}-BidPrice`];

		if (!askPrice && !bidPrice) {
			return (
				<td className="virtual-cell" style={{ textAlign: "center" }}>
					<span style={{ color: "rgba(255,255,255,0.05)", fontSize: "0.8rem" }}>
						-
					</span>
				</td>
			);
		}

		const askAmt = row[`${market}-AskAmt`] || 0;
		const bidAmt = row[`${market}-BidAmt`] || 0;
		const updateTime =
			row[`${market}-UpdatedAt`] ||
			row[`${market}-last_update`] ||
			row.last_update;
		const { c: color, t: time } = getFreshness(updateTime);

		return (
			<td className="virtual-cell" align="right">
				<div className="cell-content">
					<div className="market-data">
						<div className="data-row">
							<div style={{ display: "flex", alignItems: "center" }}>
								<span className="ask-lbl">ASK</span>
								{askPrice && (
									<div
										className="qty-badge"
										style={{ backgroundColor: getQtyBg(askAmt), color: "#bbb" }}
									>
										{formatSmartNum(askAmt, "q")}
									</div>
								)}
							</div>
							<div className="price-val" style={{ color: "#ff5252" }}>
								{askPrice ? (
									formatSmartNum(askPrice, "p")
								) : (
									<span style={{ opacity: 0.1 }}>-</span>
								)}
							</div>
						</div>
						<div className="data-row">
							<div style={{ display: "flex", alignItems: "center" }}>
								<span className="bid-lbl">BID</span>
								{bidPrice && (
									<div
										className="qty-badge"
										style={{ backgroundColor: getQtyBg(bidAmt), color: "#bbb" }}
									>
										{formatSmartNum(bidAmt, "q")}
									</div>
								)}
							</div>
							<div className="price-val" style={{ color: "#69f0ae" }}>
								{bidPrice ? (
									formatSmartNum(bidPrice, "p")
								) : (
									<span style={{ opacity: 0.1 }}>-</span>
								)}
							</div>
						</div>
					</div>

					<Tooltip
						title={`Updated: ${time}`}
						placement="left"
						arrow
						enterDelay={200}
					>
						<div
							className="status-dot"
							style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}` }}
						/>
					</Tooltip>
				</div>
			</td>
		);
	},
	(prev, next) => prev.row === next.row,
);

FastCell.displayName = "FastCell";

/**
 * A highly optimized virtualized table component for rendering large sets of market data.
 * Includes text search and market filtering capabilities.
 */
const MarketPricesTab: React.FC<MarketPricesTabProps> = ({
	marketData,
	lastUpdated,
}) => {
	const isMobile = useMediaQuery("(max-width:600px)");
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedMarkets, setSelectedMarkets] = useState<string[]>(MARKETS);
	const deferredSearch = useDeferredValue(searchQuery);

	const containerRef = useRef<HTMLDivElement>(null);
	const [scrollTop, setScrollTop] = useState(0);
	const [viewportH, setViewportH] = useState(800);

	// Derives an indexed representation of the market data to facilitate faster text searching.
	const indexedData = useMemo(
		() =>
			marketData.map((r) => ({
				...r,
				_s: (r.Ticker || r.ticker || r.TIC || "").toLowerCase(),
			})),
		[marketData],
	);

	// Filters the indexed dataset based on the deferred search string.
	const filteredData = useMemo(() => {
		if (!indexedData.length) return [];
		const terms = deferredSearch
			.toLowerCase()
			.split(/[\s,]+/)
			.filter(Boolean);
		if (!terms.length) return indexedData;
		return indexedData.filter((r: MarketRowData) =>
			terms.some((t) => r._s.includes(t)),
		);
	}, [indexedData, deferredSearch]);

	useEffect(() => {
		if (!containerRef.current) return;
		const obs = new ResizeObserver((entries) => {
			for (const e of entries) setViewportH(e.contentRect.height);
		});
		obs.observe(containerRef.current);
		return () => obs.disconnect();
	}, []);

	/**
	 * Tracks the scrolling position of the virtualized container.
	 *
	 * @param e - The scroll event triggered on the container.
	 */
	const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
		setScrollTop(e.currentTarget.scrollTop);
	}, []);

	const totalCount = filteredData.length;
	const startIdx = Math.floor(scrollTop / ROW_HEIGHT);
	const visibleCount = Math.ceil(viewportH / ROW_HEIGHT);

	const renderStart = Math.max(0, startIdx - OVERSCAN);
	const renderEnd = Math.min(totalCount, startIdx + visibleCount + OVERSCAN);

	const visibleRows = filteredData.slice(renderStart, renderEnd);
	const paddingTop = renderStart * ROW_HEIGHT;
	const paddingBottom = (totalCount - renderEnd) * ROW_HEIGHT;

	const containerSx = useMemo(
		() => ({
			display: "flex",
			flexDirection: "column",
			height: "100%",
			width: "100%",
			maxWidth: "100vw",
			overflow: "hidden",
			p: isMobile ? 0 : 1,
			gap: isMobile ? 0 : 1,
		}),
		[isMobile],
	);

	const paperSx = useMemo(
		() => ({
			...glassStyle,
			p: 1,
			borderRadius: isMobile ? 0 : 2,
			flexShrink: 0,
			display: "flex",
			flexDirection: "column",
			gap: 1,
			borderBottom: isMobile ? "1px solid rgba(255,255,255,0.1)" : undefined,
		}),
		[isMobile],
	);

	const tablePaperSx = useMemo(
		() => ({
			...glassStyle,
			flex: 1,
			minHeight: 0,
			borderRadius: isMobile ? 0 : 2,
			overflow: "auto",
			position: "relative",
			contain: "strict",
		}),
		[isMobile],
	);

	return (
		<Box sx={containerSx}>
			<style>{TABLE_STYLES}</style>

			<Paper sx={paperSx}>
				<Stack
					direction={{ xs: "column", sm: "row" }}
					spacing={1}
					alignItems="center"
				>
					<TextField
						placeholder="Search..."
						variant="outlined"
						size="small"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						sx={{
							flexGrow: 1,
							width: "100%",
							maxWidth: { xs: "100%", sm: 300 },
							"& .MuiOutlinedInput-root": {
								height: 32,
								fontSize: "0.9rem",
								bgcolor: "rgba(255,255,255,0.05)",
								"& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
							},
						}}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<Search size={14} color="rgba(255,255,255,0.5)" />
								</InputAdornment>
							),
						}}
					/>
					<Stack
						direction="row"
						spacing={0.5}
						sx={{ overflowX: "auto", scrollbarWidth: "none" }}
					>
						{MARKETS.map((m) => (
							<Chip
								key={m}
								label={m}
								size="small"
								onClick={() =>
									setSelectedMarkets((p) =>
										p.includes(m) ? p.filter((x) => x !== m) : [...p, m],
									)
								}
								sx={{
									height: 24,
									fontSize: "0.75rem",
									fontWeight: 700,
									bgcolor: selectedMarkets.includes(m)
										? "#7b68ee"
										: "rgba(255,255,255,0.05)",
									color: selectedMarkets.includes(m)
										? "white"
										: "rgba(255,255,255,0.4)",
								}}
							/>
						))}
					</Stack>
					{!isMobile && <Box sx={{ flexGrow: 1 }} />}
					{!isMobile && (
						<Typography
							variant="caption"
							sx={{ color: "rgba(255,255,255,0.4)" }}
						>
							{filteredData.length} Items • {lastUpdated?.toLocaleTimeString()}
						</Typography>
					)}
				</Stack>
			</Paper>

			<Paper ref={containerRef} onScroll={onScroll} sx={tablePaperSx}>
				<table className="virtual-table">
					<thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
						<tr style={{ height: HEADER_HEIGHT }}>
							<th className="col-ticker">TIC</th>
							{selectedMarkets.map((m) => (
								<th key={m} className="market-header">
									{m}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{paddingTop > 0 && (
							<tr style={{ height: paddingTop }}>
								<td colSpan={selectedMarkets.length + 1} />
							</tr>
						)}

						{visibleRows.map((row) => (
							<tr key={row.Ticker || row.ticker} className="virtual-row">
								<td className="col-ticker">
									<MaterialBadge ticker={row.Ticker || row.ticker} />
								</td>
								{selectedMarkets.map((m) => (
									<FastCell key={m} row={row} market={m} />
								))}
							</tr>
						))}

						{paddingBottom > 0 && (
							<tr style={{ height: paddingBottom }}>
								<td colSpan={selectedMarkets.length + 1} />
							</tr>
						)}
						{filteredData.length === 0 && (
							<tr>
								<td
									colSpan={10}
									style={{ textAlign: "center", padding: 20, color: "#aaa" }}
								>
									No data found
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</Paper>
		</Box>
	);
};

export default MarketPricesTab;
