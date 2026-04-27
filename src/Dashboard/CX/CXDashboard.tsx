import React, { useEffect, useState, useRef, useMemo } from "react";
import {
	Box,
	Typography,
	Paper,
	ToggleButton,
	ToggleButtonGroup,
	IconButton,
	useTheme,
	CircularProgress,
	Container,
	Slider,
	Collapse,
	alpha,
	useMediaQuery,
	MenuItem,
	Select,
	FormControl,
	Tabs,
	Tab,
	TextField,
	Popover,
	Button,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Fade,
	Tooltip,
} from "@mui/material";
import {
	KeyboardArrowDown,
	KeyboardArrowUp,
	Warehouse,
	SwapHoriz,
	ListAlt,
	DateRange,
	ShowChart,
	TableRows,
	History,
	RestartAlt,
} from "@mui/icons-material";
import { format, parseISO, subDays } from "date-fns";

// --- IMPORTS ---
import { useGlobalData } from "../../context/GlobalDataContext";
import { KPICards } from "../CX/components/KPICards";
import { ActiveOrdersTable } from "../CX/components/OrdersTable";
import { TradeLists, AggregatedTrade } from "../CX/components/TradeLists";
import { StorageValuationTable } from "../CX/components/StorageValuationTable";
import { PriceWatcher } from "../CX/components/PriceWatcher";
import { RevenueChart } from "../CX/components/RevenueChart";
import { TimeRange } from "../CX/types";
import { formatCompactNumber } from "../CX/helpers/formatNumber";
import { getRangeDates } from "./helpers/getRangeDates";
import { SectionGuide, type GuideStep } from "./helpers/dashboardUtils";

// --- CONSTANTS ---
const STORAGE_LOCATIONS = [
	{ id: "IC1", name: "IC1" },
	{ id: "AI1", name: "AI1" },
	{ id: "NC1", name: "NC1" },
	{ id: "NC2", name: "NC2" },
	{ id: "CI1", name: "CI1" },
	{ id: "CI2", name: "CI2" },
];

const smartFormat = (num: number, currency: boolean = false) => {
	if (num === 0 || num === undefined || num === null)
		return currency ? "0.00" : "0";
	if (Math.abs(num) >= 1000000 || (Math.abs(num) < 0.01 && Math.abs(num) > 0)) {
		return formatCompactNumber(num, currency);
	}
	return num.toLocaleString(undefined, {
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	});
};

// --- HELPER COMPONENTS ---

const LoadingWrapper = ({
	loading,
	children,
}: {
	loading: boolean;
	children: React.ReactNode;
}) => {
	if (loading) {
		return (
			<Fade in={true} timeout={500}>
				<Box
					sx={{
						display: "flex",
						flex: 1,
						height: "100%",
						minHeight: 200,
						alignItems: "center",
						justifyContent: "center",
						flexDirection: "column",
						gap: 2,
						opacity: 0.7,
						position: "absolute",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						zIndex: 10,
						bgcolor: "rgba(0,0,0,0.05)",
						backdropFilter: "blur(2px)",
					}}
				>
					<CircularProgress size={30} thickness={4} />
					<Typography variant="caption" color="text.secondary">
						Syncing Market Data...
					</Typography>
				</Box>
			</Fade>
		);
	}
	return <>{children}</>;
};

const FinancialDataTable = ({ data }: { data: any[] }) => {
	const theme = useTheme();
	return (
		<TableContainer
			sx={{
				flex: 1,
				minHeight: 0,
				height: "100%",
				overflowY: "auto",
				bgcolor: "transparent",
			}}
		>
			<Table stickyHeader size="small" padding="none">
				<TableHead>
					<TableRow
						sx={{
							"& th": {
								fontSize: "0.75rem",
								fontWeight: "bold",
								bgcolor: alpha(theme.palette.background.default, 0.1),
								color: "text.primary",
								py: 1,
								px: 1.5,
								borderBottom: "1px solid rgba(255,255,255,0.1)",
							},
						}}
					>
						<TableCell>DATE</TableCell>
						<TableCell align="right">REVENUE</TableCell>
						<TableCell align="right">EXPENSES</TableCell>
						<TableCell align="right">VOLUME</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{data.length === 0 ? (
						<TableRow>
							<TableCell
								colSpan={4}
								align="center"
								sx={{ py: 4, color: "text.disabled", fontSize: "0.8rem" }}
							>
								No data in selected range
							</TableCell>
						</TableRow>
					) : (
						[...data].reverse().map((row, i) => (
							<TableRow
								key={i}
								hover
								sx={{ "&:last-child td": { borderBottom: 0 } }}
							>
								<TableCell
									sx={{
										px: 1.5,
										py: 0.75,
										fontSize: "0.8rem",
										color: "text.secondary",
									}}
								>
									{format(parseISO(row.time), "MMM dd, yyyy HH:mm")}
								</TableCell>
								<TableCell
									align="right"
									sx={{
										px: 1.5,
										py: 0.75,
										fontSize: "0.8rem",
										color: "success.light",
										fontWeight: 600,
									}}
								>
									{smartFormat(row.revenue)}
								</TableCell>
								<TableCell
									align="right"
									sx={{
										px: 1.5,
										py: 0.75,
										fontSize: "0.8rem",
										color: "error.light",
										fontWeight: 600,
									}}
								>
									{smartFormat(row.expenses)}
								</TableCell>
								<TableCell
									align="right"
									sx={{
										px: 1.5,
										py: 0.75,
										fontSize: "0.8rem",
										color: "primary.light",
									}}
								>
									{smartFormat(row.volume)}
								</TableCell>
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
		</TableContainer>
	);
};

const DashboardSection = ({
	title,
	children,
	rightElement,
	expanded: controlledExpanded,
	onToggle,
	defaultExpanded = true,
	flexWeight,
	fixedHeight,
	mobileHeight = 500,
	sx = {},
	elevation = 0,
}: any) => {
	const isMobile = useMediaQuery((theme: any) => theme.breakpoints.down("md"));
	const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
	const isExpanded =
		controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
	const handleToggle = () => {
		if (onToggle) onToggle();
		else setInternalExpanded(!internalExpanded);
	};

	return (
		<Paper
			elevation={elevation}
			sx={{
				p: 0.5,
				display: "flex",
				flexDirection: "column",
				transition: "all 0.3s ease",
				overflow: "hidden",
				...sx,
				...(isExpanded
					? {
							flexGrow: isMobile ? 0 : fixedHeight ? 0 : flexWeight || 1,
							flexShrink: isMobile ? 0 : 1,
							flexBasis: isMobile ? "auto" : 0,
							height: isMobile ? mobileHeight : fixedHeight || "100%",
							width: "100%",
							mb: isMobile ? 1 : 0,
						}
					: {
							flexGrow: 0,
							flexShrink: 0,
							height: "auto !important",
							minHeight: "0 !important",
							mb: isMobile ? 1 : 0,
						}),
			}}
		>
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					mb: isExpanded ? 0.5 : 0,
					cursor: "pointer",
					flexShrink: 0,
					px: 0.5,
				}}
				onClick={handleToggle}
			>
				<Box onClick={(e: any) => e.stopPropagation()}>{title}</Box>
				<Box display="flex" alignItems="center" gap={0.5}>
					{rightElement}
					<IconButton
						size="small"
						onClick={(e) => {
							e.stopPropagation();
							handleToggle();
						}}
						sx={{ p: 0 }}
					>
						{isExpanded ? (
							<KeyboardArrowUp fontSize="small" />
						) : (
							<KeyboardArrowDown fontSize="small" />
						)}
					</IconButton>
				</Box>
			</Box>
			<Collapse
				in={isExpanded}
				timeout="auto"
				sx={{
					flexGrow: 1,
					display: "flex",
					flexDirection: "column",
					width: "100%",
					minHeight: 0,
					"& .MuiCollapse-wrapper": {
						flexGrow: 1,
						display: "flex",
						flexDirection: "column",
						minHeight: 0,
					},
					"& .MuiCollapse-wrapperInner": {
						flexGrow: 1,
						display: "flex",
						flexDirection: "column",
						minHeight: 0,
					},
				}}
			>
				<Box
					sx={{
						flex: 1,
						display: "flex",
						flexDirection: "column",
						width: "100%",
						position: "relative",
						height: "100%",
						minHeight: 0,
					}}
				>
					<Box
						sx={{
							position: "absolute",
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							overflow: "hidden",
							display: "flex",
							flexDirection: "column",
						}}
					>
						{children}
					</Box>
				</Box>
			</Collapse>
		</Paper>
	);
};

// --- GUIDE DEFINITIONS ---
const recentTradeSteps: GuideStep[] = [
	{
		title: "Aggregated Data",
		description:
			"Shows total amount and value for items traded in the selected period.",
		type: "info",
	},
	{
		title: "Sorting",
		description:
			"Click any header (TICKER, AMT, TOTAL) to sort. Default sort is by Total Value.",
		type: "action",
	},
	{
		title: "Hover Details",
		description:
			"Hover over the AMT or TOTAL to see exact, unformatted numbers.",
		type: "feature",
	},
	{
		title: "Color Legend",
		description:
			"Green indicates Selling (Revenue). Red indicates Buying (Expense).",
		type: "feature",
	},
];
const storageValuationSteps: GuideStep[] = [
	{
		title: "Ticker",
		description: "The unique code for the material on the exchange.",
		type: "info",
	},
	{
		title: "Target Price",
		description:
			"Click to set your desired sell price. Rows turn green when MKT ASK exceeds this value.",
		type: "action",
	},
	{
		title: "MKT ASK",
		description: "The current lowest sell offer available globally.",
		type: "info",
	},
	{
		title: "Value",
		description: "Total estimated ICA value (Amount × MKT ASK).",
		type: "feature",
	},
];
const kpiGuideSteps: GuideStep[] = [
	{
		title: "Net Profit",
		description: "Total Revenue minus Total Expenses for the selected period.",
		type: "feature",
	},
	{
		title: "Total Revenue",
		description: "Total Revenue for the selected period.",
		type: "feature",
	},
	{
		title: "Total Expenses",
		description: "Total Expenses for the selected period.",
		type: "feature",
	},
	{
		title: "Trade Volume",
		description:
			"Total number of trades for the selected period. Top Blue sell volume. Bottom Red buy volume.",
		type: "feature",
	},
	{
		title: "Best Selling Ticker",
		description:
			"Best selling ticker for the selected period based on total value.",
		type: "feature",
	},
	{
		title: "Most Bought Ticker",
		description:
			"Most bought ticker for the selected period based on total value.",
		type: "feature",
	},
];
const activeOrdersSteps: GuideStep[] = [
	{
		title: "Live Status",
		description: "Real-time view of your open market orders.",
		type: "info",
	},
	{
		title: "Progress Bar",
		description: "Visual indicator of how much of your order has been filled.",
		type: "feature",
	},
	{
		title: "Type",
		description:
			"SELL orders are green (Revenue). BUY orders are red (Expense).",
		type: "info",
	},
	{
		title: "Sorting",
		description: "Click headers to sort by Progress.",
		type: "action",
	},
];
const orderHistorySteps: GuideStep[] = [
	{
		title: "Transaction Log",
		description:
			"A permanent record of all your completed or cancelled orders within the selected period.",
		type: "info",
	},
	{
		title: "Sorting",
		description: "Default sort is by most recent. Click headers to sort.",
		type: "action",
	},
	{
		title: "Total Value",
		description: "The final settled value of the order after all fills.",
		type: "feature",
	},
];
const priceWatcherSteps: GuideStep[] = [
	{
		title: "Setup Alert",
		description:
			"Enter Ticker and Target Price, then click (+) to start watching.",
		type: "action",
	},
	{
		title: "Trigger Logic",
		description:
			"Alerts trigger when the Market Ask is lower than or equal to your Target.",
		type: "info",
	},
	{
		title: "Quick Edit",
		description:
			"Click the Target Price on any active watcher to update it instantly.",
		type: "feature",
	},
	{
		title: "Notifications",
		description:
			"Desktop notifications will fire if the browser permission is granted.",
		type: "info",
	},
];
const financialPerformanceSteps: GuideStep[] = [
	{
		title: "Revenue/Expenses",
		description:
			"The green/red lines & area represents your Revenue/Expenses over selected period.",
		type: "info",
	},
	{
		title: "Interactive Selection",
		description:
			"Click and drag across the chart to select specific time range from the selected period range.",
		type: "action",
	},
	{
		title: "View Toggle",
		description:
			"Use the icons in the header to switch between the Visual Graph and a detailed Data List.",
		type: "feature",
	},
	{
		title: "Time Slider",
		description:
			"Drag the slider handles at the bottom to adjust specific time range.",
		type: "action",
	},
	{
		title: "Data Adjustment",
		description:
			"Using Slider/Interactive Selection will adjust all other dashboard data (KPIs, Tables) to the selected time range.",
		type: "feature",
	},
];

const CXDashboard = () => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));
	const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));

	// --- CONTEXT DATA ---
	const { dashboardData, isLoading, fetchDashboard } = useGlobalData();
	const data = dashboardData;

	// --- STATE ---
	const [globalExchange, setGlobalExchange] = useState("IC1");
	const [dateRange, setDateRange] = useState<[string, string] | null>(null);
	const [timeFilterMode, setTimeFilterMode] = useState<TimeRange>("7D");

	// Date Picker
	const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
	const handleDateClick = (event: React.MouseEvent<HTMLButtonElement>) =>
		setAnchorEl(event.currentTarget);
	const handleDateClose = () => setAnchorEl(null);
	const openDate = Boolean(anchorEl);

	// Chart
	const [chartRange, setChartRange] = useState<TimeRange>("7D");
	const [chartViewMode, setChartViewMode] = useState<"GRAPH" | "LIST">("GRAPH");

	// Layout Collapsibles
	const [chartExpanded, setChartExpanded] = useState(true);
	const [middleSectionExpanded, setMiddleSectionExpanded] = useState(true);
	const [middleTab, setMiddleTab] = useState(0);
	const [storageExpanded, setStorageExpanded] = useState(true);
	const [tradesExpanded, setTradesExpanded] = useState(true);
	const [bottomSectionExpanded, setBottomSectionExpanded] = useState(true);
	const [bottomTab, setBottomTab] = useState(0);
	const [activeOrdersExpanded, setActiveOrdersExpanded] = useState(true);
	const [watcherExpanded, setWatcherExpanded] = useState(true);

	// Chart Interactive Filtering
	const [isDragging, setIsDragging] = useState(false);
	const [refAreaLeft, setRefAreaLeft] = useState<string | null>(null);
	const [refAreaRight, setRefAreaRight] = useState<string | null>(null);
	const [selection, setSelection] = useState<number[] | null>(null); // [startTs, endTs]
	const [sliderValue, setSliderValue] = useState<number[] | null>(null); // [startTs, endTs]

	const rangeRef = useRef<TimeRange>("7D");
	useEffect(() => {
		rangeRef.current = timeFilterMode;
	}, [timeFilterMode]);

	// --- LAYOUT ---
	const getFlexWeights = () => {
		const chartW = chartExpanded ? 4 : 0;
		if (isLargeScreen) {
			return {
				chart: chartW,
				storage: storageExpanded ? 2 : 0,
				trades: tradesExpanded ? 2 : 0,
				orders: activeOrdersExpanded ? 3 : 0,
				watcher: watcherExpanded ? 2 : 0,
			};
		}
		return {
			chart: chartW,
			middle: middleSectionExpanded ? 4 : 0,
			bottom: bottomSectionExpanded ? 3 : 0,
		};
	};
	const weights = getFlexWeights();

	const glassyStyle = useMemo(
		() => ({
			backgroundColor: alpha(theme.palette.background.default, 0.4),
			backdropFilter: "blur(12px)",
			border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
			backgroundImage: "none",
			boxShadow: "none",
		}),
		[theme],
	);

	// --- FILTERING & FETCHING ---
	const sendFilter = (
		mode: TimeRange,
		exchange: string,
		start?: string,
		end?: string,
	) => {
		const filters: any = { range: mode, exchange };
		if (mode === "CUSTOM" && start && end) {
			filters.startDate = start;
			filters.endDate = end;
		} else if (mode !== "CUSTOM") {
			if (mode === "ALL") {
				filters.startDate = null;
				filters.endDate = null;
			} else {
				const dates = getRangeDates(mode);
				filters.startDate = dates.startDate;
				filters.endDate = dates.endDate;
			}
		}
		fetchDashboard(filters);
	};

	const handleExchangeChange = (e: any) => {
		const newEx = e.target.value;
		setGlobalExchange(newEx);
		sendFilter(timeFilterMode, newEx, dateRange?.[0], dateRange?.[1]);
	};

	const handleGlobalTimeChange = (_: any, val: TimeRange | null) => {
		if (!val) return;
		setTimeFilterMode(val);
		setChartRange(val);
		setDateRange(null);
		setSelection(null);
		setSliderValue(null);
		sendFilter(val, globalExchange);
	};

	const handleCustomDateChange = (start: string | null, end: string | null) => {
		if (start && end) {
			setDateRange([start, end]);
			setTimeFilterMode("CUSTOM");
			setChartRange("CUSTOM");
			setSelection(null);
			setSliderValue(null);
			sendFilter("CUSTOM", globalExchange, start, end);
		}
	};

	// --- CLIENT-SIDE DATA PROCESSING ---

	// 1. Full Data (Chart Source)
	const fullChartData = useMemo(() => data?.chartData || [], [data]);

	// 2. Timeline Bounds (Full Range)
	const timelineBounds = useMemo(() => {
		if (!fullChartData.length) return { min: 0, max: 0 };
		const timestamps = fullChartData.map((d: any) =>
			new Date(d.time).getTime(),
		);
		return { min: Math.min(...timestamps), max: Math.max(...timestamps) };
	}, [fullChartData]);

	// 3. Slider Step
	const sliderStep = useMemo(
		() => (chartRange === "24H" ? 900000 : 3600000),
		[chartRange],
	);

	// 4. Reset Slider on New Data / Global Change
	// FIX: This now strictly updates the slider if there is NO active selection and data is ready.
	// We rely on isLoading to prevent latching onto stale data during transitions.
	useEffect(() => {
		if (!isLoading && !selection && timelineBounds.max > timelineBounds.min) {
			setSliderValue([timelineBounds.min, timelineBounds.max]);
		}
	}, [timelineBounds, selection, isLoading]);

	// 5. Active Time Window
	const activeTimeWindow = useMemo(() => {
		if (selection) return { start: selection[0], end: selection[1] };
		if (timelineBounds.max > 0)
			return { start: timelineBounds.min, end: timelineBounds.max };
		return { start: 0, end: 0 };
	}, [selection, timelineBounds]);

	// 6. Filter Dependent Data (KPIs, Tables)
	const {
		displayedKPIs,
		buyList,
		sellList,
		historyListBuy,
		historyListSell,
		filteredActiveOrders,
		filteredChartData,
	} = useMemo(() => {
		if (!data)
			return {
				displayedKPIs: null,
				buyList: [],
				sellList: [],
				historyListBuy: [],
				historyListSell: [],
				filteredActiveOrders: [],
				filteredChartData: [],
			};

		const { start, end } = activeTimeWindow;
		const isFiltered = !!selection;

		// Filter Raw Data Arrays
		const filteredTrades = (data.trades || []).filter((t: any) => {
			const time = new Date(t.time).getTime();
			return time >= start && time <= end;
		});
		const filteredHistory = (data.userHistory || []).filter((h: any) => {
			const time = new Date(h.date).getTime();
			return time >= start && time <= end;
		});
		const filteredActive = data.activeOrders; //(data.activeOrders || []).filter((o: any) => { if (!o.created) return true; const time = new Date(o.created).getTime(); return time >= start && time <= end; });
		const filteredChart = fullChartData.filter((d: any) => {
			const time = new Date(d.time).getTime();
			return time >= start && time <= end;
		});

		// Recalculate KPIs if filtered
		let kpiData = data.kpi;
		if (isFiltered) {
			const revenue = filteredTrades
				.filter((t: any) => t.type === "SELLING")
				.reduce((acc: number, t: any) => acc + t.value, 0);
			const expenses = filteredTrades
				.filter((t: any) => t.type === "BUYING")
				.reduce((acc: number, t: any) => acc + t.value, 0);
			const volSold = filteredTrades
				.filter((t: any) => t.type === "SELLING")
				.reduce((acc: number, t: any) => acc + t.amount, 0);
			const volBought = filteredTrades
				.filter((t: any) => t.type === "BUYING")
				.reduce((acc: number, t: any) => acc + t.amount, 0);

			const sellMap: any = {};
			const buyMap: any = {};
			filteredTrades.forEach((t: any) => {
				if (t.type === "SELLING")
					sellMap[t.ticker] = (sellMap[t.ticker] || 0) + t.value;
				else buyMap[t.ticker] = (buyMap[t.ticker] || 0) + t.amount;
			});
			const bestSeller =
				Object.entries(sellMap).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] ||
				"N/A";
			const mostBought =
				Object.entries(buyMap).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] ||
				"N/A";

			kpiData = {
				revenue,
				expenses,
				profit: revenue - expenses,
				volumeSold: volSold,
				volumeBought: volBought,
				totalTrades: filteredTrades.length,
				bestSellingItem: bestSeller,
				mostBoughtItem: mostBought,
			};
		}

		// Build Trade Lists
		const buys: any = {};
		const sells: any = {};
		filteredTrades.forEach((t: any) => {
			const map = t.type === "SELLING" ? sells : buys;
			if (!map[t.ticker])
				map[t.ticker] = { ticker: t.ticker, amount: 0, value: 0 };
			map[t.ticker].amount += t.amount;
			map[t.ticker].value += t.value;
		});

		const histBuy: any[] = [];
		const histSell: any[] = [];
		filteredHistory.forEach((item: any) => {
			const hItem = { ...item, time: item.date };
			if (item.type === "SELL" || item.type === "SELLING") histSell.push(hItem);
			else histBuy.push(hItem);
		});

		return {
			displayedKPIs: kpiData,
			buyList: Object.values(buys),
			sellList: Object.values(sells),
			historyListBuy: histBuy,
			historyListSell: histSell,
			filteredActiveOrders: filteredActive,
			filteredChartData: filteredChart,
		};
	}, [data, activeTimeWindow, selection, fullChartData]);

	// --- CHART HANDLERS ---
	const handleMouseDown = (e: any) => {
		if (e?.activeLabel) {
			setRefAreaLeft(e.activeLabel);
			setRefAreaRight(e.activeLabel);
			setIsDragging(true);
		}
	};
	const handleMouseMove = (e: any) => {
		if (isDragging && e?.activeLabel) setRefAreaRight(e.activeLabel);
	};
	const handleMouseUp = () => {
		setIsDragging(false);
		if (refAreaLeft && refAreaRight) {
			const t1 = new Date(refAreaLeft).getTime();
			const t2 = new Date(refAreaRight).getTime();
			if (t1 !== t2) {
				const newSel = [Math.min(t1, t2), Math.max(t1, t2)];
				setSelection(newSel);
				setSliderValue(newSel);
			}
			setRefAreaLeft(null);
			setRefAreaRight(null);
		}
	};
	const handleSliderChange = (event: Event, newValue: number | number[]) =>
		setSliderValue(newValue as number[]);
	const handleSliderCommit = (
		event: Event | React.SyntheticEvent,
		newValue: number | number[],
	) => setSelection(newValue as number[]);
	const handleResetZoom = () => {
		setSelection(null);
		if (timelineBounds.max > 0)
			setSliderValue([timelineBounds.min, timelineBounds.max]);
	};
	const sliderLabelFormat = (value: number) =>
		format(value, chartRange === "24H" ? "HH:mm" : "MMM dd");

	return (
		<Box
			sx={{
				height: "100vh",
				overflowY: isMobile ? "auto" : "hidden",
				bgcolor: "background.default",
				display: "flex",
				flexDirection: "column",
			}}
		>
			<Container
				maxWidth={false}
				disableGutters
				sx={{ height: "100%", display: "flex", flexDirection: "column", p: 0 }}
			>
				<Box
					sx={{
						flex: 1,
						display: "flex",
						flexDirection: "column",
						gap: 1,
						minHeight: 0,
					}}
				>
					{/* --- TOP: KPIs & CONTROLS --- */}
					<Box sx={{ flexShrink: 0 }}>
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<LoadingWrapper loading={isLoading}>
								<KPICards data={displayedKPIs} />
							</LoadingWrapper>
							<SectionGuide title="KPIs" steps={kpiGuideSteps} />
						</Box>

						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 1,
								width: "100%",
								justifyContent: "center",
								mt: 1,
							}}
						>
							<FormControl size="small" sx={{ minWidth: 80 }}>
								<Select
									value={globalExchange}
									onChange={handleExchangeChange}
									variant="outlined"
									sx={{
										height: 32,
										fontSize: "0.8rem",
										bgcolor: alpha(theme.palette.background.default, 0.5),
									}}
								>
									{STORAGE_LOCATIONS.map((s) => (
										<MenuItem key={s.id} value={s.id}>
											{s.name}
										</MenuItem>
									))}
								</Select>
							</FormControl>
							<Paper
								elevation={0}
								sx={{
									display: "flex",
									border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
									borderRadius: 1,
									bgcolor: alpha(theme.palette.background.default, 0.3),
									overflow: "hidden",
								}}
							>
								<ToggleButtonGroup
									value={timeFilterMode}
									exclusive
									onChange={handleGlobalTimeChange}
									size="small"
									sx={{ height: 32 }}
								>
									<ToggleButton value="24H">24h</ToggleButton>
									<ToggleButton value="7D">7d</ToggleButton>
									<ToggleButton value="30D">30d</ToggleButton>
									<ToggleButton value="ALL">All</ToggleButton>
								</ToggleButtonGroup>
							</Paper>
							<Button
								size="small"
								variant="outlined"
								onClick={handleDateClick}
								startIcon={<DateRange fontSize="small" />}
								sx={{
									height: 32,
									fontSize: "0.7rem",
									color: "text.primary",
									bgcolor: alpha(theme.palette.background.default, 0.3),
									borderColor: alpha(theme.palette.divider, 0.2),
								}}
							>
								{dateRange
									? `${format(parseISO(dateRange[0]), "MMM dd")} - ${format(parseISO(dateRange[1]), "MMM dd")}`
									: "Custom Range"}
							</Button>
						</Box>
						<Popover
							open={openDate}
							anchorEl={anchorEl}
							onClose={handleDateClose}
							anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
							PaperProps={{
								sx: {
									bgcolor: theme.palette.background.default,
									border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
								},
							}}
						>
							<Box p={2} display="flex" gap={2} alignItems="center">
								<TextField
									label="Start"
									type="date"
									size="small"
									InputLabelProps={{ shrink: true }}
									onChange={(e) => {
										if (e.target.value)
											handleCustomDateChange(
												e.target.value,
												dateRange?.[1] || new Date().toISOString(),
											);
									}}
									sx={{ "& input": { fontSize: "0.8rem" } }}
								/>
								<Typography variant="caption">TO</Typography>
								<TextField
									label="End"
									type="date"
									size="small"
									InputLabelProps={{ shrink: true }}
									onChange={(e) => {
										if (e.target.value)
											handleCustomDateChange(
												dateRange?.[0] || subDays(new Date(), 7).toISOString(),
												e.target.value,
											);
									}}
									sx={{ "& input": { fontSize: "0.8rem" } }}
								/>
							</Box>
						</Popover>
					</Box>

					{/* --- MIDDLE: FINANCIAL CHART --- */}
					<DashboardSection
						title={
							<Box display="flex" alignItems="center" gap={2}>
								<Typography variant="subtitle2" fontWeight="bold">
									Financial Performance
								</Typography>
								<ToggleButtonGroup
									value={chartViewMode}
									exclusive
									onChange={(_, v) => v && setChartViewMode(v)}
									size="small"
									sx={{ height: 24 }}
								>
									<ToggleButton value="GRAPH" sx={{ px: 1 }}>
										<ShowChart fontSize="small" sx={{ fontSize: "1rem" }} />
									</ToggleButton>
									<ToggleButton value="LIST" sx={{ px: 1 }}>
										<TableRows fontSize="small" sx={{ fontSize: "1rem" }} />
									</ToggleButton>
								</ToggleButtonGroup>

								{/* Reset Zoom Button */}
								{selection && (
									<Tooltip title="Reset Zoom" arrow>
										<IconButton
											size="small"
											onClick={(e) => {
												e.stopPropagation();
												handleResetZoom();
											}}
											sx={{
												ml: 1,
												bgcolor: alpha(theme.palette.primary.main, 0.1),
												color: "primary.main",
												"&:hover": {
													bgcolor: alpha(theme.palette.primary.main, 0.2),
												},
											}}
										>
											<RestartAlt fontSize="small" />
										</IconButton>
									</Tooltip>
								)}

								<Box sx={{ position: "absolute", right: "5%" }}>
									<SectionGuide
										title="Financial Performance"
										steps={financialPerformanceSteps}
									/>
								</Box>
							</Box>
						}
						expanded={chartExpanded}
						onToggle={() => setChartExpanded(!chartExpanded)}
						flexWeight={weights.chart}
						sx={glassyStyle}
						mobileHeight={400}
					>
						<LoadingWrapper loading={isLoading}>
							<Box
								sx={{
									display: "flex",
									flexDirection:
										isLargeScreen && chartViewMode === "LIST"
											? "row"
											: "column",
									height: "100%",
									width: "100%",
									overflow: "hidden",
								}}
							>
								{(chartViewMode === "GRAPH" ||
									(isLargeScreen && chartViewMode === "LIST")) && (
									<Box
										sx={{
											flex: 1,
											minWidth: 0,
											display: "flex",
											flexDirection: "column",
											height: "100%",
										}}
									>
										<Box sx={{ flexGrow: 1, width: "100%", minHeight: 0 }}>
											{fullChartData.length > 0 && (
												<RevenueChart
													data={fullChartData} // Always pass full data
													range={chartRange}
													onMouseDown={handleMouseDown}
													onMouseMove={handleMouseMove}
													onMouseUp={handleMouseUp}
													refAreaLeft={refAreaLeft}
													refAreaRight={refAreaRight}
												/>
											)}
										</Box>
										{timelineBounds.max > timelineBounds.min && (
											<Box
												sx={{
													px: 2,
													pt: 0,
													pb: isMobile ? 2 : 0,
													flexShrink: 0,
												}}
											>
												<Slider
													value={
														sliderValue || [
															timelineBounds.min,
															timelineBounds.max,
														]
													}
													min={timelineBounds.min}
													max={timelineBounds.max}
													step={sliderStep}
													onChange={handleSliderChange}
													onChangeCommitted={handleSliderCommit}
													valueLabelDisplay="auto"
													valueLabelFormat={sliderLabelFormat}
													size="small"
													sx={{ color: "#8884d8" }}
												/>
												<Box display="flex" justifyContent="space-between">
													<Typography variant="caption" color="text.secondary">
														{format(
															timelineBounds.min,
															chartRange === "24H" ? "HH:mm" : "MM/dd",
														)}
													</Typography>
													<Typography variant="caption" color="text.secondary">
														{format(
															timelineBounds.max,
															chartRange === "24H" ? "HH:mm" : "MM/dd",
														)}
													</Typography>
												</Box>
											</Box>
										)}
									</Box>
								)}
								{chartViewMode === "LIST" && (
									<Box
										sx={{
											flex: isLargeScreen ? 1 : "auto",
											height: "100%",
											minHeight: 0,
											overflow: "hidden",
										}}
									>
										<FinancialDataTable data={filteredChartData} />
									</Box>
								)}
							</Box>
						</LoadingWrapper>
					</DashboardSection>

					{/* --- BOTTOM: DETAILS GRID --- */}
					{isLargeScreen ? (
						<>
							<Box
								sx={{
									display: "flex",
									gap: 1,
									flex: weights.storage + weights.trades,
									minHeight: 0,
								}}
							>
								<DashboardSection
									title={
										<Box display="flex" alignItems="center" gap={1}>
											<Warehouse fontSize="small" />
											<Typography variant="subtitle2" fontWeight="bold">
												Storage Valuation
											</Typography>
											<SectionGuide
												title="Storage Valuation"
												steps={storageValuationSteps}
											/>
										</Box>
									}
									expanded={storageExpanded}
									onToggle={() => setStorageExpanded(!storageExpanded)}
									flexWeight={weights.storage}
									sx={glassyStyle}
								>
									{/* Storage loads independently */}
									<StorageValuationTable exchange={globalExchange} />
								</DashboardSection>
								<DashboardSection
									title={
										<Box display="flex" alignItems="center" gap={1}>
											<SwapHoriz fontSize="small" />
											<Typography variant="subtitle2" fontWeight="bold">
												Recent Trades
											</Typography>
											<SectionGuide
												title="Recent Trades"
												steps={recentTradeSteps}
											/>
										</Box>
									}
									expanded={tradesExpanded}
									onToggle={() => setTradesExpanded(!tradesExpanded)}
									flexWeight={weights.trades}
									sx={glassyStyle}
								>
									<LoadingWrapper loading={isLoading}>
										<TradeLists buyList={buyList} sellList={sellList} />
									</LoadingWrapper>
								</DashboardSection>
							</Box>
							<Box
								sx={{
									display: "flex",
									gap: 1,
									flex: weights.orders + weights.watcher,
									minHeight: 0,
								}}
							>
								<DashboardSection
									title={
										<Box
											sx={{
												display: "flex",
												flexDirection: "row",
												width: "100%",
											}}
										>
											<Tabs
												value={bottomTab}
												onChange={(_, v) => setBottomTab(v)}
												sx={{ minHeight: 30 }}
											>
												<Tab
													icon={<ListAlt sx={{ fontSize: 16, mr: 1 }} />}
													iconPosition="start"
													label="Active Orders"
												/>
												<Tab
													icon={<History sx={{ fontSize: 16, mr: 1 }} />}
													iconPosition="start"
													label="Order History"
												/>
											</Tabs>
											<Box sx={{ position: "absolute", right: "5%" }}>
												<SectionGuide
													title={
														bottomTab === 0 ? "Active Orders" : "Order History"
													}
													steps={
														bottomTab === 0
															? activeOrdersSteps
															: orderHistorySteps
													}
												/>
											</Box>
										</Box>
									}
									expanded={activeOrdersExpanded}
									onToggle={() =>
										setActiveOrdersExpanded(!activeOrdersExpanded)
									}
									flexWeight={weights.orders}
									sx={glassyStyle}
								>
									<LoadingWrapper loading={isLoading}>
										{bottomTab === 0 ? (
											<ActiveOrdersTable orders={filteredActiveOrders} />
										) : (
											<TradeLists
												buyList={historyListBuy}
												sellList={historyListSell}
												showTime={true}
											/>
										)}
									</LoadingWrapper>
								</DashboardSection>
								<DashboardSection
									title={
										<Box
											sx={{
												display: "flex",
												flexDirection: "row",
												width: "100%",
											}}
										>
											<Typography variant="subtitle2" fontWeight="bold">
												Price Watcher
											</Typography>
											<SectionGuide
												title="Price Watcher"
												steps={priceWatcherSteps}
											/>
										</Box>
									}
									expanded={watcherExpanded}
									onToggle={() => setWatcherExpanded(!watcherExpanded)}
									flexWeight={weights.watcher}
									sx={glassyStyle}
								>
									<PriceWatcher exchange={globalExchange} />
								</DashboardSection>
							</Box>
						</>
					) : (
						<>
							{/* MOBILE: STACKED LAYOUT */}
							<DashboardSection
								title={
									<Box
										sx={{
											display: "flex",
											flexDirection: "row",
											width: "100%",
										}}
									>
										<Tabs
											value={middleTab}
											onChange={(_, v) => setMiddleTab(v)}
											sx={{
												minHeight: 30,
												"& .MuiTab-root": {
													minHeight: 30,
													py: 0,
													fontSize: "0.8rem",
												},
											}}
										>
											<Tab label="Recent Trades" />
											<Tab label="Storage Valuation" />
										</Tabs>
										<Box sx={{ position: "absolute", right: "5%" }}>
											<SectionGuide
												title={
													middleTab === 0
														? "Recent Trades"
														: "Storage Valuation"
												}
												steps={
													middleTab === 0
														? recentTradeSteps
														: storageValuationSteps
												}
											/>
										</Box>
									</Box>
								}
								expanded={middleSectionExpanded}
								onToggle={() =>
									setMiddleSectionExpanded(!middleSectionExpanded)
								}
								flexWeight={weights.middle}
								sx={glassyStyle}
								mobileHeight={500}
							>
								<LoadingWrapper loading={isLoading}>
									{middleTab === 0 ? (
										<TradeLists buyList={buyList} sellList={sellList} />
									) : (
										<StorageValuationTable exchange={globalExchange} />
									)}
								</LoadingWrapper>
							</DashboardSection>

							<DashboardSection
								title={
									<Box
										sx={{
											display: "flex",
											flexDirection: "row",
											width: "100%",
										}}
									>
										<Tabs
											value={bottomTab}
											onChange={(_, v) => setBottomTab(v)}
											sx={{
												minHeight: 30,
												"& .MuiTab-root": {
													minHeight: 30,
													py: 0,
													fontSize: "0.8rem",
												},
											}}
										>
											<Tab label="Orders" />
											<Tab label="History" />
											<Tab label="Watcher" />
										</Tabs>
										<Box sx={{ position: "absolute", right: "5%" }}>
											<SectionGuide
												title={
													bottomTab === 0
														? "Active Orders"
														: bottomTab === 1
															? "Order History"
															: "Price Watcher"
												}
												steps={
													bottomTab === 0
														? activeOrdersSteps
														: bottomTab === 1
															? orderHistorySteps
															: priceWatcherSteps
												}
											/>
										</Box>
									</Box>
								}
								expanded={bottomSectionExpanded}
								onToggle={() =>
									setBottomSectionExpanded(!bottomSectionExpanded)
								}
								flexWeight={weights.bottom}
								sx={glassyStyle}
								mobileHeight={500}
							>
								<LoadingWrapper loading={isLoading}>
									{bottomTab === 0 && (
										<ActiveOrdersTable orders={filteredActiveOrders} />
									)}
									{bottomTab === 1 && (
										<TradeLists
											buyList={historyListBuy}
											sellList={historyListSell}
											showTime={true}
										/>
									)}
									{bottomTab === 2 && (
										<PriceWatcher exchange={globalExchange} />
									)}
								</LoadingWrapper>
							</DashboardSection>
						</>
					)}
				</Box>
			</Container>
		</Box>
	);
};

export default CXDashboard;
