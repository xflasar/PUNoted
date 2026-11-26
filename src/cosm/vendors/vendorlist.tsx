import React, {
	useState,
	useMemo,
	useRef,
	useEffect,
	useCallback,
} from "react";
import { API_BASE_URL } from "../../config/api";
import CustomToggleGroup from "../../components/common/customtogglegroup";
import CustomToggleButton from "../../components/common/customtogglebutton";
import { Masonry } from "@mui/lab";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import {
	Typography,
	Box,
	Chip,
	TextField,
	InputAdornment,
	Card,
	CardContent,
	Divider,
	Tooltip,
	useTheme,
	IconButton,
	CircularProgress,
	Button,
	alpha,
} from "@mui/material";
import { Search, MapPin, Minus, Target, X } from "lucide-react";
import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";
import VendorCreationModal from "./createvendorstoremodal";
import EditVendorStoreModal from "./editvendorstoremodal";
import ShoppingListModal from "./shoppinglistmodal";
import MaterialBadge from "../components/materialbadge";
import { formatAmount } from "../../utils/formaters";
import type { Location, OrderItem, VendorStore } from "./types";
import { getDiffStats } from "./utils/pricecomparison";
import {
	formatLocation,
	loadLocationSystemNames,
	useLocationFormatVersion,
} from "./utils/formatlocation";
import { pickPrice } from "./utils/pickprice";
import VendorLastActiveIndicator from "./components/vendorlastactiveindicator";
import LocationIcon from "./components/locationicon";
import LocationFilter, {
	ALL_LOCATIONS_ID,
	HORTUS_LOCATION_CODE,
	matchesLocationFilter,
	type LocationOption,
} from "./components/locationfilter";
import { useMaterialSearch } from "../hooks/usematerialsearch";

type CxPriceLookup = Record<string, Record<string, unknown>>;
type MarketOptions = {
	view: "grid" | "table";
	location: string;
	side: "ask" | "bid" | "both";
	hideUnavailable: boolean;
};
const MARKET_OPTIONS_STORAGE_KEY = "marketOptions";

const compareLocations = (
	a?: Pick<Location, "location_code" | "location_name"> | null,
	b?: Pick<Location, "location_code" | "location_name"> | null,
) => {
	const aIsHortus = a?.location_code === HORTUS_LOCATION_CODE;
	const bIsHortus = b?.location_code === HORTUS_LOCATION_CODE;
	if (aIsHortus !== bIsHortus) return aIsHortus ? -1 : 1;
	return formatLocation(a?.location_name, a?.location_code).localeCompare(
		formatLocation(b?.location_name, b?.location_code),
		undefined,
		{ sensitivity: "base" },
	);
};

const filterLocations = (
	locations: Location[] | undefined,
	selectedLocation: string | null,
) =>
	(locations || []).filter((location) =>
		matchesLocationFilter(location, selectedLocation),
	);

const isUnavailableOrder = (
	quantity: number,
	locations: Location[] | undefined,
) =>
	locations?.length
		? locations.every((location) => location.available === 0)
		: quantity === 0;

const isVendorViewMode = (value: string | null): value is "grid" | "table" =>
	value === "grid" || value === "table";

const DEFAULT_MARKET_OPTIONS: MarketOptions = {
	view: "table",
	location: HORTUS_LOCATION_CODE,
	side: "ask",
	hideUnavailable: true,
};

const getStoredMarketOptions = (): MarketOptions => {
	try {
		const options: unknown = JSON.parse(
			localStorage.getItem(MARKET_OPTIONS_STORAGE_KEY) || "null",
		);
		if (
			typeof options === "object" &&
			options !== null &&
			isVendorViewMode((options as MarketOptions).view) &&
			typeof (options as MarketOptions).location === "string" &&
			["ask", "bid", "both"].includes((options as MarketOptions).side)
		) {
			return {
				...(options as MarketOptions),
				hideUnavailable:
					typeof (options as MarketOptions).hideUnavailable === "boolean"
						? (options as MarketOptions).hideUnavailable
						: true,
			};
		}
	} catch {
		// Use the defaults when storage is unavailable or contains invalid JSON.
	}
	return DEFAULT_MARKET_OPTIONS;
};

// --- HELPER COMPONENTS ---

const activityToMinutes = (activity: unknown) => {
	if (typeof activity !== "string") return Number.POSITIVE_INFINITY;
	const match = activity.trim().match(/^(\d+)\s*([mhd])$/i);
	if (!match) return Number.POSITIVE_INFINITY;
	const value = Number(match[1]);
	const unit = match[2].toLowerCase();
	if (unit === "m") return value;
	if (unit === "h") return value * 60;
	return value * 1440;
};

const prepareVendorStore = (
	vendorStore: VendorStore,
	cxPriceLookup: CxPriceLookup,
) => {
	const normalizedExchange =
		(vendorStore.vendor.cx || "IC1").trim().toUpperCase() || "IC1";

	const prepareOrders = (orderType: "buy" | "sell") =>
		vendorStore.orders
			.filter((order) => order.ordertype === orderType)
			.map((item) => {
				const available = Reflect.get(item as object, "available");
				const displayQuantity =
					typeof available === "number" ? available : item.quantity;
				const resolvedPrice = pickPrice({
					fixedprice: item.price?.fixedprice,
					corpprice: item.price?.corpprice,
					cxprice: item.price?.cxprice,
				});
				const fixedPrice = resolvedPrice.price;
				const sideKey = `${normalizedExchange}-${orderType === "sell" ? "AskPrice" : "BidPrice"}`;
				const rawCxValue =
					cxPriceLookup[item.materialticker.trim().toUpperCase()]?.[sideKey];
				const cxReferencePrice = Number(rawCxValue);
				const cxStats = getDiffStats(
					fixedPrice,
					Number.isFinite(cxReferencePrice) ? cxReferencePrice : undefined,
					orderType === "sell" ? "ask" : "bid",
				);
				const corpStats = getDiffStats(
					fixedPrice,
					item.price?.corpprice,
					orderType === "sell" ? "ask" : "bid",
				);

				return {
					item,
					fixedPrice,
					orderType,
					cxStats,
					corpStats,
					displayQuantity,
				};
			});

	return {
		vendorStore,
		buyOrders: prepareOrders("buy"),
		sellOrders: prepareOrders("sell"),
	};
};

// --- MEMOIZED SUB-COMPONENTS ---

const PriceComparisonBadge = ({
	label,
	stats,
}: {
	label: string;
	stats: NonNullable<ReturnType<typeof getDiffStats>>;
}) => {
	const theme = useTheme();
	if (!stats) return <Box sx={{ width: 40 }} />;

	return (
		<Tooltip
			title={
				<Box sx={{ textAlign: "center" }}>
					<Typography
						variant="caption"
						sx={{ display: "block", fontWeight: "bold" }}
					>
						{label} Price Difference
					</Typography>
					<Typography
						variant="caption"
						sx={{ color: theme.palette.text.secondary }}
					>
						{label} Price: {stats.refPrice} ICA
					</Typography>
				</Box>
			}
			slotProps={{
				tooltip: {
					sx: {
						backdropFilter: "blur(8px)",
						background: alpha(theme.palette.background.default, 0.95),
						border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
						color: theme.palette.text.primary,
					},
				},
			}}
		>
			<Chip
				icon={
					stats.color === "neutral" ? (
						<Target className="inline-icon" />
					) : undefined
				}
				label={stats.color === "neutral" ? label : `${label} ${stats.label}`}
				size="small"
				variant="outlined"
				sx={{
					fontSize: "0.7rem",
					"& .MuiChip-icon": { color: "inherit" },
					color:
						stats.color === "neutral"
							? theme.palette.primary.light
							: stats.isGood
								? theme.palette.success.light
								: theme.palette.error.light,
					borderColor:
						stats.color === "neutral"
							? alpha(theme.palette.primary.main, 0.3)
							: stats.isGood
								? alpha(theme.palette.success.main, 0.3)
								: alpha(theme.palette.error.main, 0.3),
					bgcolor:
						stats.color === "neutral"
							? alpha(theme.palette.primary.main, 0.06)
							: stats.isGood
								? alpha(theme.palette.success.main, 0.05)
								: alpha(theme.palette.error.main, 0.05),
				}}
			/>
		</Tooltip>
	);
};

const ChipSmall = ({
	text,
	color,
	tooltip,
}: {
	text: string;
	color?: string;
	tooltip?: React.ReactNode;
}) => {
	const theme = useTheme();
	const badgeColor = color ?? theme.palette.primary.light;

	const badge = (
		<Chip
			size="small"
			label={text}
			sx={{
				fontSize: "0.7rem",
				fontWeight: "bold",
				color: badgeColor,
				bgcolor: alpha(badgeColor, 0.1),
				border: `1px solid ${alpha(badgeColor, 0.3)}`,
				cursor: tooltip ? "help" : "default",
				textDecoration: tooltip ? "underline dotted" : "none",
			}}
		/>
	);

	if (!tooltip) return badge;

	return (
		<Tooltip
			title={
				<Typography variant="caption" sx={{ fontWeight: "bold" }}>
					{tooltip}
				</Typography>
			}
			slotProps={{
				tooltip: {
					sx: {
						backdropFilter: "blur(8px)",
						background: alpha(theme.palette.background.default, 0.95),
						border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
						color: theme.palette.text.primary,
					},
				},
			}}
		>
			{badge}
		</Tooltip>
	);
};

const ChipAsk = () => {
	const theme = useTheme();
	return (
		<ChipSmall
			text="ASK"
			color={theme.palette.warning.light}
			tooltip="You buy from the vendor"
		/>
	);
};

const ChipBid = () => {
	const theme = useTheme();
	return (
		<ChipSmall
			text="BID"
			color={theme.palette.info.light}
			tooltip="You sell to the vendor"
		/>
	);
};

// The Main Card Component
const VendorCard = React.memo(
	({
		preparedVendor,
	}: {
		preparedVendor: ReturnType<typeof prepareVendorStore>;
	}) => {
		const theme = useTheme();
		useLocationFormatVersion();
		const { vendorStore, buyOrders, sellOrders } = preparedVendor;
		const vendor = vendorStore.vendor;

		const sortedList = useMemo(() => {
			return [...buyOrders, ...sellOrders].sort((a, b) => {
				const tickerCmp = a.item.materialticker.localeCompare(
					b.item.materialticker,
					undefined,
					{ sensitivity: "base" },
				);
				if (tickerCmp !== 0) return tickerCmp;
				return (a.orderType || "sell").localeCompare(b.orderType || "sell");
			});
		}, [buyOrders, sellOrders]);

		return (
			<Card
				sx={{
					bgcolor: alpha(theme.palette.background.default, 0.9),
					backgroundImage: "none",
					color: theme.palette.text.primary,
					borderRadius: "16px",
					display: "flex",
					flexDirection: "column",
					border: `1px solid ${alpha(theme.palette.common.white, 0.05)}`,
					backdropFilter: "blur(6px)",
					WebkitBackdropFilter: "blur(6px)",
					boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
					transition: "box-shadow 0.2s, border-color 0.2s",
					borderColor: alpha(theme.palette.primary.main, 0.5),
				}}
			>
				<CardContent
					sx={{
						p: "12px !important",
						display: "flex",
						flexDirection: "column",
						height: "100%",
					}}
				>
					<Box sx={{ textAlign: "center", mb: 1 }}>
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								gap: 1,
								mb: 0.5,
								flexWrap: "wrap",
							}}
						>
							<Typography
								variant="subtitle2"
								sx={{
									fontWeight: 600,
									letterSpacing: "0.5px",
									fontSize: "1.1rem",
								}}
							>
								{vendor.companyname}
							</Typography>
						</Box>

						<Box
							sx={{
								display: "flex",
								justifyContent: "center",
								alignItems: "center",
								gap: 1,
								flexWrap: "wrap",
							}}
						>
							<Typography
								variant="caption"
								sx={{
									color: theme.palette.text.secondary,
									bgcolor: alpha(theme.palette.background.default, 0.6),
									px: 1,
									py: 0.25,
									borderRadius: "8px",
									fontWeight: 500,
									lineHeight: 1.2,
								}}
							>
								{vendor.companycode}
							</Typography>

							<Typography
								variant="caption"
								sx={{
									color: theme.palette.primary.light,
									bgcolor: alpha(theme.palette.primary.main, 0.1),
									border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
									px: 1,
									py: 0.25,
									borderRadius: "4px",
									fontWeight: "bold",
									lineHeight: 1.2,
								}}
							>
								{vendor.gamename}
							</Typography>

							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									color: theme.palette.text.secondary,
									px: 1,
								}}
							>
								<VendorLastActiveIndicator vendor={vendor} />
							</Box>
						</Box>
					</Box>

					<Divider
						sx={{ my: 0.5, bgcolor: alpha(theme.palette.common.white, 0.08) }}
					/>

					<Box
						sx={{
							flex: 1,
							overflowY: "auto",
							px: 0,
							maxHeight: "450px",
							minHeight: "50px",
							display: "flex",
							flexDirection: "column",
							scrollbarWidth: "thin",
							"&::-webkit-scrollbar": {
								width: "4px",
							},
							"&::-webkit-scrollbar-track": {
								background: "transparent",
							},
							"&::-webkit-scrollbar-thumb": {
								background: alpha(theme.palette.common.white, 0.1),
								borderRadius: "4px",
							},
							"&::-webkit-scrollbar-thumb:hover": {
								background: alpha(theme.palette.primary.main, 0.5),
							},
						}}
					>
						{sortedList.length > 0 ? (
							sortedList.map((preparedOrder, index) => {
								const {
									item,
									fixedPrice,
									orderType,
									cxStats,
									corpStats,
									displayQuantity,
								} = preparedOrder;
								const isBuying = orderType === "buy";
								const quantityLabel = isBuying ? "Wants" : "Has";
								const isUnavailable = isUnavailableOrder(
									displayQuantity,
									item.location,
								);

								return (
									<Box
										key={item.frontendId || index}
										className={isUnavailable ? "unavailable-order" : undefined}
										sx={{
											p: 0,
											backgroundColor: alpha(
												isBuying
													? theme.palette.info.light
													: theme.palette.warning.light,
												0.06,
											),
											borderBottom:
												index === sortedList.length - 1
													? "none"
													: `1px solid ${alpha(theme.palette.common.white, 0.15)}`,
											padding: ".5em .5em",
											transition: "background-color 0.2s",
											display: "flex",
											flexDirection: "column",
											gap: 0.5,
										}}
									>
										{/* Main Row: Ticker, Price */}
										<Box
											sx={{
												display: "flex",
												justifyContent: "space-between",
												alignItems: "center",
											}}
										>
											<Box
												sx={{ display: "flex", alignItems: "center", gap: 1 }}
											>
												{isBuying ? <ChipBid /> : <ChipAsk />}
												<Typography
													variant="subtitle2"
													sx={{
														fontWeight: "bold",
														color: theme.palette.text.primary,
														fontSize: "0.85rem",
													}}
												>
													<MaterialBadge ticker={item.materialticker} />
												</Typography>
											</Box>

											<Box
												sx={{
													display: "flex",
													alignItems: "baseline",
													gap: 0.5,
												}}
											>
												<Typography
													variant="body2"
													sx={{
														fontWeight: "bold",
														color: isBuying
															? theme.palette.info.main
															: theme.palette.warning.main,
													}}
												>
													{formatAmount(fixedPrice)}
												</Typography>
												<Typography
													variant="caption"
													sx={{
														color: theme.palette.text.secondary,
														fontSize: "0.7rem",
													}}
												>
													ICA
												</Typography>
											</Box>
										</Box>

										{/* Sub Rows: Locations and Quantities */}
										{item.location && item.location.length > 0 ? (
											<Box
												sx={{
													pl: 0,
													display: "flex",
													flexDirection: "column",
													gap: 0.25,
												}}
											>
												{[...item.location]
													.sort(compareLocations)
													.map((l, i) => {
														const isUnavailableLocation =
															(l.available ?? displayQuantity) === 0;
														return (
															<Box
																key={i}
																className={
																	isUnavailableLocation
																		? "unavailable-order"
																		: undefined
																}
																sx={{
																	display: "flex",
																	justifyContent: "space-between",
																	alignItems: "center",
																}}
															>
																<Box
																	sx={{
																		display: "flex",
																		alignItems: "center",
																		gap: 0.5,
																	}}
																>
																	<LocationIcon
																		locationCode={l.location_code}
																	/>
																	<Typography
																		variant="caption"
																		sx={{
																			fontSize: "0.80rem",
																		}}
																	>
																		{formatLocation(
																			l.location_name,
																			l.location_code,
																		)}
																	</Typography>
																</Box>
																<Typography variant="caption">
																	{quantityLabel}{" "}
																	<Typography
																		variant="caption"
																		sx={{
																			color:
																				(l.available ?? displayQuantity) === 0
																					? theme.palette.error.main
																					: theme.palette.primary.light,
																			fontWeight: "bold",
																		}}
																	>
																		{formatAmount(
																			l.available ?? displayQuantity,
																		)}
																	</Typography>
																</Typography>
															</Box>
														);
													})}
											</Box>
										) : (
											<Box
												sx={{
													pl: 2,
													display: "flex",
													justifyContent: "space-between",
													alignItems: "center",
												}}
											>
												<Box
													sx={{
														display: "flex",
														alignItems: "center",
														gap: 0.5,
													}}
												>
													<MapPin
														className="inline-icon"
														color={theme.palette.text.secondary}
													/>
													<Typography
														variant="caption"
														sx={{
															color: theme.palette.text.secondary,
															fontSize: "0.8rem",
														}}
													>
														Unknown
													</Typography>
												</Box>
												<Typography
													variant="caption"
													sx={{
														color: isUnavailable
															? theme.palette.error.main
															: theme.palette.primary.light,
														fontSize: "0.75rem",
														fontWeight: "medium",
													}}
												>
													{quantityLabel}: {formatAmount(displayQuantity)}
												</Typography>
											</Box>
										)}

										{/* Badges Row */}
										{(cxStats || corpStats) && (
											<Box
												sx={{
													display: "flex",
													justifyContent: "space-between",
													mt: 0.5,
												}}
											>
												<Box sx={{ display: "flex", gap: 1 }}>
													{corpStats && (
														<PriceComparisonBadge
															label="COSM"
															stats={corpStats}
														/>
													)}
												</Box>
												<Box sx={{ display: "flex", gap: 1 }}>
													{cxStats && (
														<PriceComparisonBadge label="CX" stats={cxStats} />
													)}
												</Box>
											</Box>
										)}
									</Box>
								);
							})
						) : (
							<Box
								sx={{
									height: "100%",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									opacity: 0.2,
									py: 3,
									flexDirection: "column",
								}}
							>
								<Minus className="inline-icon" />
							</Box>
						)}
					</Box>
				</CardContent>
			</Card>
		);
	},
);

// --- MAIN LIST COMPONENT ---

/**
 * The main view for listing all available vendor stores.
 * Allows searching, filtering, and opening creation/editing modals.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.loggedIn - Indicates if the user is currently logged in.
 * @returns {React.ReactElement} The vendors list component.
 */
const VendorsList = ({
	loggedIn,
	activeTab,
	onLoginRequest,
}: {
	loggedIn: boolean;
	activeTab: "vendors" | "cart" | "store";
	onLoginRequest: () => void;
}) => {
	const theme = useTheme();
	const { searchQuery, exactMatch, setSearchQuery, toggleExactMatch } =
		useMaterialSearch();
	const locationFormatVersion = useLocationFormatVersion();
	const [marketOptions] = useState(getStoredMarketOptions);
	const [vendorViewMode, setVendorViewMode] = useState<"grid" | "table">(
		marketOptions.view,
	);
	const [hideUnavailable, setHideUnavailable] = useState(
		marketOptions.hideUnavailable,
	);
	const [selectedLocation, setSelectedLocation] = useState<string | null>(
		marketOptions.location === ALL_LOCATIONS_ID ? null : marketOptions.location,
	);
	const [orderTypeFilter, setOrderTypeFilter] = useState<
		"ASK" | "BID" | "BOTH"
	>(marketOptions.side.toUpperCase() as "ASK" | "BID" | "BOTH");
	const searchInputRef = useRef<HTMLInputElement>(null);
	// Data States
	const [vendorStores, setVendorStores] = useState<VendorStore[]>([]);
	const [isLoadingVendors, setIsLoadingVendors] = useState<boolean>(true);
	const [cxPriceLookup, setCxPriceLookup] = useState<CxPriceLookup>({});
	const [userVendorStore, setUserVendorStore] = useState<
		VendorStore | null | undefined
	>(loggedIn ? undefined : null);
	const [vendorsRefreshTick, setVendorsRefreshTick] = useState(0);
	const [hasVisitedStore, setHasVisitedStore] = useState(activeTab === "store");

	useEffect(() => {
		if (activeTab === "store") setHasVisitedStore(true);
	}, [activeTab]);

	useEffect(() => {
		localStorage.setItem(
			MARKET_OPTIONS_STORAGE_KEY,
			JSON.stringify({
				view: vendorViewMode,
				location: selectedLocation || ALL_LOCATIONS_ID,
				side: orderTypeFilter.toLowerCase(),
				hideUnavailable,
			}),
		);
	}, [vendorViewMode, selectedLocation, orderTypeFilter, hideUnavailable]);

	useEffect(() => {
		const frameId = requestAnimationFrame(() => {
			searchInputRef.current?.focus();
		});
		return () => cancelAnimationFrame(frameId);
	}, [vendorViewMode]);

	// Initial Data Fetch
	useEffect(() => {
		if (!loggedIn) {
			setUserVendorStore(null);
			return;
		}

		setUserVendorStore(undefined);
		const checkVendorStore = async () => {
			try {
				const response = await fetch(`${API_BASE_URL}user_vendor_store`, {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${localStorage.getItem("authToken")}`,
					},
				});
				if (response.ok) {
					const data = await response.json();
					setUserVendorStore(data.data);
				} else {
					setUserVendorStore(null);
				}
			} catch {
				setUserVendorStore(null);
			}
		};
		checkVendorStore();
	}, [loggedIn]);

	useEffect(() => {
		const getVendorStores = async () => {
			setIsLoadingVendors(true);
			try {
				const [storesResponse, pricesResponse] = await Promise.all([
					fetch(`${API_BASE_URL}vendor_stores`),
					fetch(`${API_BASE_URL}market_price_all`),
					loadLocationSystemNames(),
				]);
				if (storesResponse.ok) {
					const data = await storesResponse.json();
					setVendorStores(data.vendors);
				} else {
					setVendorStores([]);
				}
				if (pricesResponse.ok) {
					const payload = await pricesResponse.json();
					const rows = Array.isArray(payload) ? payload : payload?.data || [];
					const lookup: CxPriceLookup = {};
					rows.forEach((row) => {
						const ticker =
							typeof row.ticker === "string"
								? row.ticker.trim().toUpperCase()
								: "";
						if (ticker) lookup[ticker] = row;
					});
					setCxPriceLookup(lookup);
				} else {
					setCxPriceLookup({});
				}
			} catch (error) {
				console.error("Failed to get vendor stores:", error);
				setVendorStores([]);
				setCxPriceLookup({});
			} finally {
				setIsLoadingVendors(false);
			}
		};
		getVendorStores();
	}, [vendorsRefreshTick]);

	// Handlers
	const handleViewModeChange = useCallback(
		(newValue: "grid" | "table") => setVendorViewMode(newValue),
		[],
	);

	const handleOnVendorChanged = useCallback(
		(updatedVendorStore: VendorStore) => {
			setUserVendorStore(updatedVendorStore);
			setVendorsRefreshTick((prev) => prev + 1);
		},
		[],
	);
	const handleOnVendorCreated = useCallback((newVendorStore: VendorStore) => {
		setVendorStores((prevStores) => [newVendorStore, ...prevStores]);
		setUserVendorStore(newVendorStore);
	}, []);

	const handleOnStoreDeleted = useCallback((deletedVendorId: string) => {
		setVendorStores((prevStores) =>
			prevStores.filter((store) => store.vendor.vendorid !== deletedVendorId),
		);
		setUserVendorStore(null);
	}, []);

	const sortedVendors = useMemo(() => {
		return [...vendorStores].sort((a, b) => {
			const aMinutes = activityToMinutes(
				(a.vendor as VendorStore["vendor"] & { activity?: unknown }).activity,
			);
			const bMinutes = activityToMinutes(
				(b.vendor as VendorStore["vendor"] & { activity?: unknown }).activity,
			);
			return aMinutes - bMinutes;
		});
	}, [vendorStores]);

	const normalizeSearchQuery = useCallback(
		(query: string) => query.trim().toLowerCase(),
		[],
	);

	const matchesSearchValue = useCallback(
		(value: string, query: string) => {
			const normalizedQuery = normalizeSearchQuery(query);
			if (!normalizedQuery) return false;
			const normalizedValue = normalizeSearchQuery(value);
			return exactMatch
				? normalizedValue === normalizedQuery
				: normalizedValue.includes(normalizedQuery);
		},
		[exactMatch, normalizeSearchQuery],
	);

	const matchesVendorSearch = useCallback(
		(vendor: VendorStore["vendor"], query: string) =>
			[vendor.companyname, vendor.companycode, vendor.gamename].some((value) =>
				matchesSearchValue(value, query),
			),
		[matchesSearchValue],
	);

	const matchesMaterialSearch = useCallback(
		(materialTicker: string, query: string) =>
			matchesSearchValue(materialTicker, query),
		[matchesSearchValue],
	);

	const searchTerms = useMemo(
		() =>
			searchQuery
				.split(",")
				.map((term) => term.trim().toLowerCase())
				.filter(Boolean),
		[searchQuery],
	);

	const matchesOrderFilters = useCallback(
		(
			vendor: VendorStore["vendor"],
			order: Pick<OrderItem, "materialticker" | "ordertype">,
		) => {
			if (orderTypeFilter === "ASK" && order.ordertype === "buy") return false;
			if (orderTypeFilter === "BID" && order.ordertype === "sell") return false;
			return (
				searchTerms.length === 0 ||
				searchTerms.some(
					(term) =>
						matchesMaterialSearch(order.materialticker, term) ||
						matchesVendorSearch(vendor, term),
				)
			);
		},
		[orderTypeFilter, searchTerms, matchesMaterialSearch, matchesVendorSearch],
	);

	const vendorsWithOrders = useMemo(
		() =>
			sortedVendors.filter((vendor) =>
				vendor.orders?.some(
					(order) => order.ordertype === "buy" || order.ordertype === "sell",
				),
			),
		[sortedVendors],
	);

	const visibleVendorsWithOrders = useMemo(
		() =>
			vendorsWithOrders
				.map((vendor) => ({
					...vendor,
					orders: hideUnavailable
						? vendor.orders.flatMap((order) => {
								if (!order.location?.length) {
									return isUnavailableOrder(
										order.available ?? order.quantity,
										undefined,
									)
										? []
										: [order];
								}
								const locations = order.location.filter(
									(location) => location.available !== 0,
								);
								return locations.length
									? [{ ...order, location: locations }]
									: [];
							})
						: vendor.orders,
				}))
				.filter((vendor) => vendor.orders.length > 0),
		[vendorsWithOrders, hideUnavailable],
	);

	// Extract unique locations dynamically based on search and order type filters
	const allLocations = useMemo(() => {
		const locs = new Map<string, LocationOption>();

		visibleVendorsWithOrders.forEach((v) => {
			v.orders?.forEach((o) => {
				if (matchesOrderFilters(v.vendor, o)) {
					o.location?.forEach((l: Location) => {
						const locationId = l.location_code?.trim();
						const locationName = l.location_name?.trim();
						const optionId = locationId || locationName;
						if (optionId) {
							locs.set(optionId, {
								id: optionId,
								name: locationName || optionId,
							});
						}
					});
				}
			});
		});

		return Array.from(locs.values());
	}, [visibleVendorsWithOrders, matchesOrderFilters]);

	// Filter Logic for Grid View
	const preparedFilteredVendors = useMemo(() => {
		const result: ReturnType<typeof prepareVendorStore>[] = [];

		for (const vendorStore of visibleVendorsWithOrders) {
			const preparedVendor = prepareVendorStore(vendorStore, cxPriceLookup);

			const filterOrders = (orders: typeof preparedVendor.buyOrders) => {
				return orders
					.filter((order) =>
						matchesOrderFilters(vendorStore.vendor, order.item),
					)
					.filter(
						(order) =>
							selectedLocation === null ||
							filterLocations(order.item.location, selectedLocation).length > 0,
					)
					.map((order) =>
						selectedLocation === null
							? order
							: {
									...order,
									item: {
										...order.item,
										location: filterLocations(
											order.item.location,
											selectedLocation,
										),
									},
								},
					);
			};

			const filteredBuyOrders = filterOrders(preparedVendor.buyOrders);
			const filteredSellOrders = filterOrders(preparedVendor.sellOrders);

			if (filteredBuyOrders.length > 0 || filteredSellOrders.length > 0) {
				result.push({
					...preparedVendor,
					buyOrders: filteredBuyOrders,
					sellOrders: filteredSellOrders,
				});
			}
		}

		return result;
	}, [
		visibleVendorsWithOrders,
		selectedLocation,
		cxPriceLookup,
		matchesOrderFilters,
	]);

	const tableRows = useMemo(() => {
		return preparedFilteredVendors
			.flatMap((preparedVendor) => {
				const { vendorStore, buyOrders, sellOrders } = preparedVendor;
				const vendor = vendorStore.vendor;
				const user = `${vendor.gamename} [${vendor.companycode}] ${vendor.companyname}`;

				const buildRows = (
					preparedOrder: (typeof buyOrders)[number],
					typeLabel: "Ask" | "Bid",
				) => {
					const locations =
						preparedOrder.item.location?.length > 0
							? preparedOrder.item.location
							: [null];

					// FIXME: location.available is broken but works
					return locations.map((location: Location, index: number) => {
						const locationQuantity = location
							? location.available
							: preparedOrder.displayQuantity;

						const locationLabel = formatLocation(
							location?.location_name,
							location?.location_code,
						);

						return {
							id: `${vendor.vendorid}-${preparedOrder.orderType}-${preparedOrder.item.orderid || preparedOrder.item.frontendId || preparedOrder.item.materialid}-${location?.id || locationLabel}-${index}`,
							typeLabel,
							orderType: preparedOrder.orderType,
							material: preparedOrder.item.materialticker,
							user,
							ica: preparedOrder.fixedPrice,
							location: locationLabel,
							quantity: locationQuantity,
							cxStats: preparedOrder.cxStats,
							corpStats: preparedOrder.corpStats,
							locCode: location?.location_code,
							locName: location?.location_name,
							rawVendor: vendor,
						};
					});
				};

				const askRows = sellOrders.flatMap((order) => buildRows(order, "Ask"));
				const bidRows = buyOrders.flatMap((order) => buildRows(order, "Bid"));

				return [...askRows, ...bidRows];
			})
			.sort((a, b) => {
				const materialComparison = a.material.localeCompare(
					b.material,
					undefined,
					{
						sensitivity: "base",
					},
				);
				if (materialComparison !== 0) return materialComparison;

				const sideComparison = a.typeLabel.localeCompare(b.typeLabel);
				return sideComparison !== 0
					? sideComparison
					: compareLocations(
							{
								location_code: a.locCode ?? "",
								location_name: a.locName ?? "",
							},
							{
								location_code: b.locCode ?? "",
								location_name: b.locName ?? "",
							},
						);
			});
	}, [preparedFilteredVendors, locationFormatVersion]);

	const tableColumns = useMemo<GridColDef[]>(
		() => [
			{
				field: "typeLabel",
				headerName: "Side",
				flex: 1,
				align: "center",
				headerAlign: "center",
				renderCell: ({ row }) =>
					row.orderType === "sell" ? <ChipAsk /> : <ChipBid />,
			},
			{
				field: "material",
				headerName: "Material",
				flex: 1,
				headerAlign: "center",
				align: "center",
				renderCell: ({ value }) => (
					<MaterialBadge ticker={String(value ?? "")} />
				),
			},
			{
				field: "quantity",
				headerName: "Quantity",
				type: "number",
				flex: 1,
				headerAlign: "right",
				align: "right",
				renderCell: ({ value }) => (
					<Typography
						variant="body2"
						sx={{
							fontWeight: "bold",
							color: theme.palette.primary.main,
						}}
					>
						{formatAmount(Number(value))}
					</Typography>
				),
			},
			{
				field: "ica",
				headerName: "ICA",
				type: "number",
				flex: 1,
				headerAlign: "right",
				align: "right",
				renderCell: ({ value, row }) => (
					<Typography
						variant="body2"
						sx={{
							fontWeight: "bold",
							color:
								row.orderType === "sell"
									? theme.palette.warning.main
									: theme.palette.info.main,
						}}
					>
						{Number(value).toLocaleString(undefined, {
							maximumFractionDigits: 2,
						})}
					</Typography>
				),
			},
			{
				field: "price",
				headerName: "Price",
				flex: 2,
				headerAlign: "center",
				align: "center",
				valueGetter: (_, row) => row.ica,
				renderCell: ({ row }) => (
					<Box sx={{ display: "flex", alignItems: "right", gap: 0.5 }}>
						{row.corpStats && (
							<PriceComparisonBadge label="COSM" stats={row.corpStats} />
						)}
						{row.cxStats && (
							<PriceComparisonBadge label="CX" stats={row.cxStats} />
						)}
					</Box>
				),
			},
			{
				field: "location",
				headerName: "Location",
				flex: 2,
				headerAlign: "left",
				align: "left",
				renderCell: ({ row }) => (
					<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
						<LocationIcon locationCode={row.locCode} />
						<Typography variant="body2">
							<Box component="span" sx={{ display: { lg: "none" } }}>
								{row.locCode === HORTUS_LOCATION_CODE
									? "Hortus"
									: row.locName || row.locCode}
							</Box>
							<Box
								component="span"
								sx={{ display: { xs: "none", lg: "inline" } }}
							>
								{formatLocation(row.locName, row.locCode)}
							</Box>
						</Typography>
					</Box>
				),
			},
			{
				field: "user",
				headerName: "User",
				flex: 3,
				headerAlign: "left",
				align: "left",
				renderCell: ({ value }) => {
					const userText = String(value || "");
					const match = userText.match(/^(.+)\s\[(.+)]\s(.+)$/);
					if (!match) {
						return <Typography variant="body2">{userText}</Typography>;
					}
					return (
						<Typography variant="body2">
							<Box
								component="span"
								sx={{ display: { lg: "none" }, fontWeight: "bold" }}
							>
								{match[1]}
							</Box>
							<Box
								component="span"
								sx={{ display: { xs: "none", lg: "inline" } }}
							>
								<Box component="span" sx={{ fontWeight: "bold" }}>
									{match[1]}
								</Box>{" "}
								<Box component="span" sx={{ fontFamily: "monospace" }}>
									[{match[2]}]
								</Box>{" "}
								{match[3]}
							</Box>
						</Typography>
					);
				},
			},
			{
				field: "updated",
				headerName: "Active",
				flex: 1,
				headerAlign: "left",
				align: "left",
				renderCell: ({ row }) => (
					<VendorLastActiveIndicator vendor={row.rawVendor} />
				),
			},
		],
		[theme],
	);
	const compactTableColumns = useMemo(
		() =>
			tableColumns
				.filter(({ field }) => field !== "updated")
				.map((column) =>
					column.field === "user" || column.field === "location"
						? { ...column, flex: 1 }
						: column,
				),
		[tableColumns],
	);
	const narrowTableColumns = useMemo(
		() => compactTableColumns.filter(({ field }) => field !== "price"),
		[compactTableColumns],
	);
	const renderTable = (columns: GridColDef[]) => (
		<DataGrid
			rows={tableRows}
			columns={columns}
			density="compact"
			initialState={{
				pagination: {
					paginationModel: { page: 0, pageSize: -1 },
				},
			}}
			hideFooter
			disableColumnMenu
			disableColumnSorting
			disableRowSelectionOnClick
			localeText={{ noRowsLabel: "No results" }}
			getRowClassName={({ row }) =>
				`${row.orderType === "sell" ? "ask-order" : "bid-order"}${
					row.quantity === 0 ? " unavailable-order" : ""
				}`
			}
			sx={{
				border: "none",
				"& .MuiDataGrid-row": {
					borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
					display: "flex",
					alignItems: "center",
				},
				"& .MuiDataGrid-row.ask-order": {
					backgroundColor: alpha(theme.palette.warning.light, 0.05),
				},
				"& .MuiDataGrid-row.bid-order": {
					backgroundColor: alpha(theme.palette.info.light, 0.05),
				},
				"& .MuiDataGrid-cell": {
					borderBottom: "none",
					display: "flex",
					alignItems: "center",
					padding: "0 8px",
					"&:focus": { outline: "none" },
					"&:focus-within": { outline: "none" },
				},
				"& .MuiDataGrid-columnHeaders": {
					backgroundColor: theme.palette.background.default,
					color: theme.palette.primary.contrastText,
					fontSize: "0.7rem",
					fontWeight: "bold",
					textTransform: "uppercase",
					letterSpacing: "0.05em",
					borderBottom: "none",
					minHeight: "40px !important",
					maxHeight: "40px !important",
				},
				"& .MuiDataGrid-columnHeader": {
					padding: "0 10px",
					"&:focus": { outline: "none" },
					"&:focus-within": { outline: "none" },
				},
				"& .MuiDataGrid-columnSeparator": { display: "none" },
				"& .MuiDataGrid-virtualScroller": { marginTop: "0 !important" },
			}}
		/>
	);

	const store = (activeTab === "store" || hasVisitedStore) && (
		<Box
			key="store"
			sx={{
				display: activeTab === "store" ? "block" : "none",
				height: "100%",
			}}
		>
			{!loggedIn ? (
				<Box
					sx={{
						height: "100%",
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						gap: 2,
						textAlign: "center",
					}}
				>
					<Typography variant="h6">
						Create your own store and list materials on the PUNoted Market
					</Typography>
					<Button variant="contained" onClick={onLoginRequest}>
						Login / Register
					</Button>
				</Box>
			) : userVendorStore === undefined ? (
				<Box
					sx={{
						height: "100%",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<CircularProgress color="primary" />
				</Box>
			) : userVendorStore ? (
				<EditVendorStoreModal
					vendorStore={userVendorStore}
					onStoreDeleted={handleOnStoreDeleted}
					onVendorChanged={handleOnVendorChanged}
				/>
			) : (
				<VendorCreationModal onVendorCreated={handleOnVendorCreated} />
			)}
		</Box>
	);

	if (activeTab === "cart") {
		return [
			store,
			<ShoppingListModal
				key="cart"
				isLoading={isLoadingVendors}
				vendors={vendorStores}
				cxPriceLookup={cxPriceLookup}
			/>,
		];
	}

	if (activeTab === "store") {
		return [store];
	}

	return [
		store,
		<Box
			key="market"
			sx={{
				boxSizing: "border-box",
				margin: { xs: 0, sm: "0 0rem" },
				height: "100%",
				width: "100%",
				display: "flex",
				flexDirection: "column",
				"& .unavailable-order": {
					opacity: 0.5,
					filter: "grayscale(100%)",
				},
			}}
		>
			{isLoadingVendors ? (
				<Box
					sx={{
						flexGrow: 1,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<CircularProgress color="primary" />
				</Box>
			) : (
				<>
					{/* Search and Filter Bar */}
					<Box sx={{ mb: 2 }}>
						<Box
							sx={{
								width: "100%",
								display: "grid",
								gridTemplateColumns: {
									xs: "minmax(0, 1fr)",
									lg: "auto auto minmax(0, 1fr) minmax(0, 1fr) auto",
								},
								alignItems: "center",
								gap: 1.5,
							}}
						>
							<Box
								sx={{
									display: { xs: "flex", lg: "contents" },
									alignItems: "center",
									gap: 1.5,
								}}
							>
								<Box
									sx={{
										display: "flex",
									}}
								>
									<CustomToggleGroup
										value={vendorViewMode}
										exclusive
										onChange={(_event, newValue: "grid" | "table" | null) => {
											if (newValue) {
												handleViewModeChange(newValue);
											}
										}}
										aria-label="Vendor view mode"
									>
										<CustomToggleButton
											value="table"
											showIcon={false}
											aria-label="Table view"
										>
											Table
										</CustomToggleButton>
										<CustomToggleButton
											value="grid"
											showIcon={false}
											aria-label="Grid view"
										>
											Grid
										</CustomToggleButton>
									</CustomToggleGroup>
								</Box>
								<Box sx={{ display: "flex" }}>
									<CustomToggleGroup
										value={orderTypeFilter}
										exclusive
										onChange={(
											_event,
											newValue: "ASK" | "BID" | "BOTH" | null,
										) => {
											if (newValue) setOrderTypeFilter(newValue);
										}}
										aria-label="Order type filter"
									>
										<CustomToggleButton
											value="ASK"
											showIcon={false}
											tooltip="You buy from the vendor"
											aria-label="Show only ask"
											activeColor={theme.palette.warning.main}
										>
											Ask
										</CustomToggleButton>
										<CustomToggleButton
											value="BID"
											showIcon={false}
											tooltip="You sell to the vendor"
											aria-label="Show only bid"
											activeColor={theme.palette.secondary.main}
										>
											Bid
										</CustomToggleButton>
										<CustomToggleButton
											value="BOTH"
											showIcon={false}
											tooltip="Asks and Bids together"
											aria-label="Show both ask and bid"
										>
											All
										</CustomToggleButton>
									</CustomToggleGroup>
								</Box>
								<Box sx={{ flex: "1 1 0", minWidth: 0 }}>
									<LocationFilter
										locations={allLocations}
										value={selectedLocation}
										onChange={setSelectedLocation}
										sx={{ width: "100%" }}
									/>
								</Box>
							</Box>
							<Box
								sx={{
									display: { xs: "flex", lg: "contents" },
									alignItems: "center",
									gap: 1.5,
								}}
							>
								<Box sx={{ flex: "1 1 0", minWidth: 0 }}>
									<TextField
										fullWidth
										variant="outlined"
										size="small"
										inputRef={searchInputRef}
										placeholder="Search…"
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										sx={{
											"& .MuiOutlinedInput-root": {
												height: 40,
												bgcolor: alpha(theme.palette.background.default, 0.5),
												backdropFilter: "blur(5px)",
												borderRadius: "12px",
												"& fieldset": {
													borderColor: alpha(theme.palette.common.white, 0.1),
												},
												"&:hover fieldset": {
													borderColor: theme.palette.primary.main,
												},
												"&.Mui-focused fieldset": {
													borderColor: theme.palette.primary.main,
												},
												color: theme.palette.text.primary,
											},
										}}
										slotProps={{
											input: {
												startAdornment: (
													<InputAdornment position="start">
														<Search
															className="inline-icon"
															color={theme.palette.primary.main}
														/>
													</InputAdornment>
												),
												endAdornment: (
													<InputAdornment position="end">
														<Box
															sx={{
																display: "flex",
																alignItems: "center",
																gap: 0.5,
															}}
														>
															{searchQuery ? (
																<>
																	<Tooltip title="Clear Search">
																		<IconButton
																			size="small"
																			aria-label="Clear material search"
																			onClick={() => setSearchQuery("")}
																		>
																			<X className="inline-icon" />
																		</IconButton>
																	</Tooltip>
																</>
															) : null}
															<Tooltip
																title={
																	exactMatch
																		? "Exact Match: ON"
																		: "Exact Match: OFF"
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
														</Box>
													</InputAdornment>
												),
											},
										}}
									/>
								</Box>
								<Box>
									<CustomToggleButton
										value="hide-unavailable"
										selected={hideUnavailable}
										onChange={() => setHideUnavailable((prev) => !prev)}
										tooltip="Hide materials if vendor has/wants 0"
										aria-label="Hide Unavailable"
									>
										Hide Unavailable
									</CustomToggleButton>
								</Box>
							</Box>
						</Box>
					</Box>

					{/* Vendor List Area */}
					<Box
						id="vendors"
						sx={{ flexGrow: 1, overflowY: "auto", minHeight: 0, px: 0 }}
					>
						{vendorViewMode === "table" ? (
							<Box sx={{ height: "100%", width: "100%" }}>
								<Box
									sx={{ display: { xs: "block", md: "none" }, height: "100%" }}
								>
									{renderTable(narrowTableColumns)}
								</Box>
								<Box
									sx={{
										display: { xs: "none", md: "block", lg: "none" },
										height: "100%",
									}}
								>
									{renderTable(compactTableColumns)}
								</Box>
								<Box
									sx={{ display: { xs: "none", lg: "block" }, height: "100%" }}
								>
									{renderTable(tableColumns)}
								</Box>
							</Box>
						) : (
							<>
								{preparedFilteredVendors.length > 0 ? (
									<Masonry
										columns={{ xs: 1, sm: 2, md: 3, lg: 4, xl: 5, xll: 6 }}
										spacing={2}
									>
										{preparedFilteredVendors.map((preparedVendor) => (
											<VendorCard
												key={preparedVendor.vendorStore.vendor.companycode}
												preparedVendor={preparedVendor}
											/>
										))}
									</Masonry>
								) : (
									<Box sx={{ textAlign: "center", py: 8, opacity: 0.6 }}>
										<Typography variant="h6">No results</Typography>
									</Box>
								)}
							</>
						)}
					</Box>
				</>
			)}
		</Box>,
	];
};

export default VendorsList;
