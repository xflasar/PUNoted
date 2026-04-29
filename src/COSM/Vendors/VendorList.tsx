import React, {
	useState,
	useMemo,
	useRef,
	useEffect,
	useCallback,
} from "react";
import { Masonry } from "@mui/lab";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import {
	Typography,
	Box,
	Chip,
	TextField,
	InputAdornment,
	ToggleButton,
	ToggleButtonGroup,
	Card,
	CardContent,
	Divider,
	Tooltip,
	useTheme,
	IconButton,
	alpha,
	Autocomplete,
} from "@mui/material";
import {
	Search,
	PlusCircle,
	Edit,
	ShoppingBasket,
	MapPin,
	Minus,
	Target,
	X,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import VendorCreationModal from "./CreateVendorStoreModal";
import EditVendorStoreModal from "./EditVendorStoreModal";
import ShoppingListModal from "./ShoppingListModal";
import { formatAmount } from "../../utils/formaters";
import type { Location, VendorStore } from "./types";
import { getDiffStats } from "./utils/priceComparison";

type CxPriceLookup = Record<string, Record<string, unknown>>;
type LocationOption = { id: string; name: string };
const VENDORS_VIEW_MODE_STORAGE_KEY = "vendorsView";

const isVendorViewMode = (value: string | null): value is "grid" | "table" =>
	value === "grid" || value === "table";

const getStoredVendorViewMode = (): "grid" | "table" | null => {
	const storedValue = localStorage.getItem(VENDORS_VIEW_MODE_STORAGE_KEY);
	return isVendorViewMode(storedValue) ? storedValue : null;
};

const formatLocation = (name?: string, id?: string) => {
	const locationName = name?.trim();
	const locationId = id?.trim();
	let displayName = locationName || locationId || "Unknown";
	let displayId: string | null = null;
	if (locationName && locationId) {
		const sameLabel =
			locationName.localeCompare(locationId, undefined, {
				sensitivity: "base",
			}) === 0;
		displayName = locationName;
		displayId = sameLabel ? null : locationId;
	}
	return displayId ? `${displayName} (${displayId})` : displayName;
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
			.sort((a, b) =>
				a.materialticker.localeCompare(b.materialticker, undefined, {
					sensitivity: "base",
				}),
			)
			.map((item) => {
				const available = Reflect.get(item as object, "available");
				const displayQuantity =
					typeof available === "number" ? available : item.quantity;
				const fixedPrice = item.price?.fixedprice ?? 0;
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
				icon={stats.color === "neutral" ? <Target size={12} /> : undefined}
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
	colour,
	tooltip,
}: {
	text: string;
	colour?: string;
	tooltip?: React.ReactNode;
}) => {
	const theme = useTheme();
	const badgeColour = colour ?? theme.palette.primary.light;

	const badge = (
		<Chip
			size="small"
			label={text}
			sx={{
				height: 18,
				fontSize: "0.65rem",
				fontWeight: "bold",
				color: badgeColour,
				bgcolor: alpha(badgeColour, 0.1),
				border: `1px solid ${alpha(badgeColour, 0.3)}`,
				cursor: tooltip ? "help" : "default",
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
			colour={theme.palette.warning.light}
			tooltip="Buy from the vendor"
		/>
	);
};

const ChipBid = () => {
	const theme = useTheme();
	return (
		<ChipSmall
			text="BID"
			colour={theme.palette.info.light}
			tooltip="Sell to the vendor"
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
		const { vendorStore, buyOrders, sellOrders } = preparedVendor;
		const vendor = vendorStore.vendor;

		const sortedList = useMemo(() => {
			return [...buyOrders, ...sellOrders]
				.map((order) => {
					const activeLocations = order.item.location?.filter(
						(loc: Location) => {
							// FIXME: loc.amount is broken loc.available works...
							const qty = loc.available;
							return typeof qty === "number" && qty > 0;
						},
					);

					return {
						...order,
						item: {
							...order.item,
							location: activeLocations || [],
						},
					};
				})
				.filter(
					(order) =>
						(order.displayQuantity && order.displayQuantity > 0) ||
						(order.item.location && order.item.location.length > 0),
				)
				.sort((a, b) => {
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
					"&:hover": {
						boxShadow: "0 8px 25px rgba(0, 0, 0, 0.5)",
						borderColor: alpha(theme.palette.primary.main, 0.5),
					},
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
								{vendor.companycode}
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
								{vendor.gamename}
							</Typography>

							<Typography
								variant="caption"
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 0.5,
									color: theme.palette.text.secondary,
									bgcolor: alpha(theme.palette.background.default, 0.6),
									px: 1,
									py: 0.25,
									borderRadius: "8px",
									fontWeight: 500,
									lineHeight: 1.2,
								}}
							>
								<Box
									component="span"
									sx={{
										width: 6,
										height: 6,
										borderRadius: "50%",
										bgcolor: theme.palette.success.main,
										boxShadow: `0 0 4px ${alpha(theme.palette.success.main, 0.6)}`,
									}}
								/>
								{(() => {
									const act = String(
										(vendor as typeof vendor & { activity?: unknown })
											.activity || "-",
									).trim();
									if (act === "0 m" || act === "0m") return "Recently Active";
									if (act === "-") return "Active Unknown";
									return `Active ${act} ago`;
								})()}
							</Typography>
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

								return (
									<Box
										key={item.frontendId || index}
										sx={{
											p: 0,
											borderBottom:
												index === sortedList.length - 1
													? "none"
													: `1px solid ${alpha(theme.palette.common.white, 0.15)}`,
											padding: ".5em .5em",
											transition: "background-color 0.2s",
											display: "flex",
											flexDirection: "column",
											gap: 0.5,
											cursor: "default",
											"&:hover": {
												backgroundColor: alpha(
													theme.palette.common.white,
													0.03,
												),
											},
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
													{item.materialticker}
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
													{fixedPrice}
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
												{item.location.map((l, i) => (
													<Box
														key={i}
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
															<MapPin
																size={10}
																color={theme.palette.text.secondary}
																style={{ flexShrink: 0 }}
															/>
															<Typography
																variant="caption"
																sx={{
																	color: theme.palette.text.secondary,
																	fontSize: "0.80rem",
																}}
															>
																{formatLocation(
																	l.location_name,
																	l.location_code,
																)}
															</Typography>
														</Box>
														<Typography
															variant="caption"
															sx={{
																color: theme.palette.primary.light,
																fontSize: "0.75rem",
																fontWeight: "medium",
															}}
														>
															Qty:{" "}
															{formatAmount(
																(
																	l as typeof l & {
																		available?: number;
																	}
																).available ?? displayQuantity,
															)}
														</Typography>
													</Box>
												))}
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
														size={10}
														color={theme.palette.text.secondary}
														style={{ flexShrink: 0 }}
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
														color: theme.palette.primary.light,
														fontSize: "0.75rem",
														fontWeight: "medium",
													}}
												>
													Qty: {formatAmount(displayQuantity)}
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
								<Minus size={20} />
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
const VendorsList = ({ loggedIn }: { loggedIn: boolean }) => {
	const theme = useTheme();
	const [searchParams, setSearchParams] = useSearchParams();
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
	const [locationInputValue, setLocationInputValue] =
		useState<string>("All Locations");
	const [orderTypeFilter, setOrderTypeFilter] = useState<
		"ASK" | "BID" | "BOTH"
	>("BOTH");
	const searchInputRef = useRef<HTMLInputElement>(null);
	const querySubtab = searchParams.get("subtab");
	const vendorViewMode: "grid" | "table" =
		(isVendorViewMode(querySubtab) ? querySubtab : null) ||
		getStoredVendorViewMode() ||
		"grid";

	// Modal States
	const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
	const [isShoppingListModalOpen, setIsShoppingListModalOpen] = useState(false);

	// Data States
	const [hasVendorStore, setHasVendorStore] = useState<boolean | null>(null);
	const [isCheckingStore, setIsCheckingStore] = useState<boolean>(true);
	const [vendorStores, setVendorStores] = useState<VendorStore[]>([]);
	const [isLoadingVendors, setIsLoadingVendors] = useState<boolean>(true);
	const [cxPriceLookup, setCxPriceLookup] = useState<CxPriceLookup>({});
	const [userVendorStore, setUserVendorStore] = useState<VendorStore | null>(
		null,
	);

	useEffect(() => {
		if (querySubtab === vendorViewMode) {
			return;
		}
		const nextParams = new URLSearchParams(searchParams);
		nextParams.set("subtab", vendorViewMode);
		setSearchParams(nextParams, { replace: true });
	}, [querySubtab, searchParams, setSearchParams, vendorViewMode]);

	useEffect(() => {
		if (getStoredVendorViewMode() === vendorViewMode) {
			return;
		}
		localStorage.setItem(VENDORS_VIEW_MODE_STORAGE_KEY, vendorViewMode);
	}, [vendorViewMode]);

	useEffect(() => {
		const frameId = requestAnimationFrame(() => {
			searchInputRef.current?.focus();
		});
		return () => cancelAnimationFrame(frameId);
	}, [vendorViewMode]);

	// Initial Data Fetch
	useEffect(() => {
		if (!loggedIn) return;
		const checkVendorStore = async () => {
			try {
				const response = await fetch(
					"https://api.punoted.net/user_vendor_store",
					{
						method: "GET",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${localStorage.getItem("authToken")}`,
						},
					},
				);
				if (response.ok) {
					const data = await response.json();
					if (data.data) setHasVendorStore(true);
					setUserVendorStore(data.data);
				} else {
					setHasVendorStore(false);
					setUserVendorStore(null);
				}
			} catch {
				setHasVendorStore(false);
				setUserVendorStore(null);
			} finally {
				setIsCheckingStore(false);
			}
		};
		checkVendorStore();
	}, [loggedIn]);

	useEffect(() => {
		const getVendorStores = async () => {
			setIsLoadingVendors(true);
			try {
				const [storesResponse, pricesResponse] = await Promise.all([
					fetch("https://api.punoted.net/vendor_stores"),
					fetch("https://api.punoted.net/market_price_all"),
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
	}, []);

	// Handlers
	const handleOpenCreateModal = useCallback(
		() => setIsCreateModalOpen(true),
		[],
	);
	const handleCloseCreateModal = useCallback(
		() => setIsCreateModalOpen(false),
		[],
	);
	const handleOpenEditModal = useCallback(() => setIsEditModalOpen(true), []);
	const handleCloseEditModal = useCallback(() => setIsEditModalOpen(false), []);
	const handleOpenShoppingListModal = useCallback(
		() => setIsShoppingListModalOpen(true),
		[],
	);
	const handleCloseShoppingListModal = useCallback(
		() => setIsShoppingListModalOpen(false),
		[],
	);
	const handleViewModeChange = useCallback(
		(newValue: "grid" | "table") => {
			const nextParams = new URLSearchParams(searchParams);
			nextParams.set("subtab", newValue);
			setSearchParams(nextParams);
		},
		[searchParams, setSearchParams],
	);

	const handleOnVendorChanged = useCallback(
		(updatedVendorStore: VendorStore) => {
			setVendorStores((prevStores) => {
				const withoutStore = prevStores.filter(
					(store) =>
						store.vendor.vendorid !== updatedVendorStore.vendor.vendorid,
				);
				return updatedVendorStore.orders?.length
					? [updatedVendorStore, ...withoutStore]
					: withoutStore;
			});
			setUserVendorStore(updatedVendorStore);
		},
		[],
	);

	const handleOnVendorCreated = useCallback((newVendorStore: VendorStore) => {
		setVendorStores((prevStores) => [newVendorStore, ...prevStores]);
		setUserVendorStore(newVendorStore);
		setHasVendorStore(true);
	}, []);

	const handleOnStoreDeleted = useCallback((deletedVendorId: string) => {
		setVendorStores((prevStores) =>
			prevStores.filter((store) => store.vendor.vendorid !== deletedVendorId),
		);
		setUserVendorStore(null);
		setHasVendorStore(false);
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

	type SearchScope = "vendor" | "row";

	const matchesVendorSearch = useCallback(
		(vendor: VendorStore["vendor"], query: string) =>
			vendor.companyname.toLowerCase().includes(query) ||
			vendor.companycode.toLowerCase().includes(query) ||
			vendor.gamename.toLowerCase().includes(query),
		[],
	);

	const matchesMaterialSearch = useCallback(
		(materialTicker: string, query: string) =>
			materialTicker.toLowerCase().includes(query),
		[],
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

	// Extract unique locations dynamically based on search and order type filters
	const allLocations = useMemo(() => {
		const locs = new Map<string, LocationOption>();

		const terms = searchQuery
			.split(",")
			.map((t) => t.trim().toLowerCase())
			.filter(Boolean);

		vendorsWithOrders.forEach((v) => {
			const vendorMatchTerms = terms.filter((term) =>
				matchesVendorSearch(v.vendor, term),
			);

			const hasAnyMaterialMatchInVendor = v.orders?.some((o) =>
				terms.some((t) => matchesMaterialSearch(o.materialticker, t)),
			);

			v.orders?.forEach((o) => {
				if (orderTypeFilter === "ASK" && o.ordertype === "buy") return;
				if (orderTypeFilter === "BID" && o.ordertype === "sell") return;

				const matchesMat = terms.some((term) =>
					matchesMaterialSearch(o.materialticker, term),
				);

				const isValidForSearch =
					terms.length === 0 ||
					matchesMat ||
					(vendorMatchTerms.length > 0 && !hasAnyMaterialMatchInVendor);

				if (isValidForSearch) {
					o.location?.forEach((l: Location) => {
						const qty = l.available;
						const hasStock = typeof qty === "number" && qty > 0;

						if (hasStock) {
							const locationId = l.location_code?.trim();
							const locationName = l.location_name?.trim();
							const optionId = locationId || locationName;
							if (optionId) {
								locs.set(optionId, {
									id: optionId,
									name: locationName || optionId,
								});
							}
						}
					});
				}
			});
		});

		return [
			...Array.from(locs.values()).sort((a, b) =>
				formatLocation(a.name, a.id).localeCompare(
					formatLocation(b.name, b.id),
				),
			),
		];
	}, [
		vendorsWithOrders,
		searchQuery,
		orderTypeFilter,
		matchesVendorSearch,
		matchesMaterialSearch,
	]);

	useEffect(() => {
		const selectedOption = allLocations.find(
			(option) => option.id === selectedLocation,
		);
		setLocationInputValue(
			selectedLocation === null
				? ""
				: formatLocation(selectedOption?.name, selectedLocation),
		);
	}, [selectedLocation, allLocations]);

	// Filter Logic for Grid View
	const preparedFilteredVendors = useMemo(() => {
		const terms = searchQuery
			.split(",")
			.map((t) => t.trim().toLowerCase())
			.filter(Boolean);

		const result: ReturnType<typeof prepareVendorStore>[] = [];

		for (const vendorStore of vendorsWithOrders) {
			const preparedVendor = prepareVendorStore(vendorStore, cxPriceLookup);

			// Check which terms match the vendor metadata directly
			const vendorMatchTerms = terms.filter((term) =>
				matchesVendorSearch(vendorStore.vendor, term),
			);

			// Filter the buy/sell orders
			const filterOrders = (orders: typeof preparedVendor.buyOrders) => {
				return orders.filter((order) => {
					// 1. Filter by location (AND ensure it actually has quantity > 0)
					const locMatch =
						selectedLocation === null ||
						order.item.location?.some((l: Location) => {
							const nameMatches =
								l.location_name === selectedLocation ||
								l.location_code === selectedLocation;

							const qty = l.available;
							const hasStock = typeof qty === "number" && qty > 0;

							return nameMatches && hasStock;
						});

					if (!locMatch) return false;

					// 2. Filter by search terms
					if (terms.length === 0) return true;

					// Does this order's material match ANY of the search terms?
					const matchesMat = terms.some((term) =>
						matchesMaterialSearch(order.item.materialticker, term),
					);

					if (matchesMat) return true;

					// Did ANY material in this vendor match ANY of the search terms?
					const allOrders = [
						...preparedVendor.buyOrders,
						...preparedVendor.sellOrders,
					];
					const hasAnyMaterialMatchInVendor = allOrders.some((o) =>
						terms.some((t) => matchesMaterialSearch(o.item.materialticker, t)),
					);

					// If the vendor metadata matched, but we didn't specifically search for any materials
					// that exist in this vendor, then show the order.
					if (vendorMatchTerms.length > 0 && !hasAnyMaterialMatchInVendor) {
						return true;
					}

					return false;
				});
			};

			const filteredBuyOrders =
				orderTypeFilter === "ASK" ? [] : filterOrders(preparedVendor.buyOrders);
			const filteredSellOrders =
				orderTypeFilter === "BID"
					? []
					: filterOrders(preparedVendor.sellOrders);

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
		searchQuery,
		vendorsWithOrders,
		selectedLocation,
		orderTypeFilter,
		cxPriceLookup,
		matchesVendorSearch,
		matchesMaterialSearch,
	]);

	const filteredVendors = useMemo(() => {
		// tableRows uses filteredVendors ? No, it uses preparedVendorsWithOrders
		// but we provide it here just in case it's used elsewhere, or just a dummy array
		return preparedFilteredVendors.map((p) => p.vendorStore);
	}, [preparedFilteredVendors]);

	const preparedVendorsWithOrders = useMemo(
		() =>
			vendorsWithOrders.map((vendorStore) =>
				prepareVendorStore(vendorStore, cxPriceLookup),
			),
		[vendorsWithOrders, cxPriceLookup],
	);

	const tableRows = useMemo(() => {
		const terms = searchQuery
			.split(",")
			.map((t) => t.trim().toLowerCase())
			.filter(Boolean);

		return preparedVendorsWithOrders.flatMap((preparedVendor) => {
			const { vendorStore, buyOrders, sellOrders } = preparedVendor;
			const vendor = vendorStore.vendor;
			const updated = String(
				(vendor as typeof vendor & { activity?: unknown }).activity || "-",
			);
			const user = `${vendor.gamename} (${vendor.companycode}) ${vendor.companyname}`;

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
						updated,
						locCode: location?.location_code,
						locName: location?.location_name,
						rawVendor: vendor,
					};
				});
			};

			const askRows =
				orderTypeFilter === "BID"
					? []
					: sellOrders.flatMap((order) => buildRows(order, "Ask"));
			const bidRows =
				orderTypeFilter === "ASK"
					? []
					: buyOrders.flatMap((order) => buildRows(order, "Bid"));

			return [...askRows, ...bidRows].filter((row) => {
				if (typeof row.quantity === "number" && row.quantity <= 0) return false;

				const locMatch =
					selectedLocation === null ||
					row.locName === selectedLocation ||
					row.locCode === selectedLocation;
				if (!locMatch) return false;

				if (terms.length === 0) return true;

				const materialMatches = terms.some((term) =>
					matchesMaterialSearch(row.material, term),
				);
				const vendorMatches = terms.some((term) =>
					matchesVendorSearch(row.rawVendor, term),
				);

				return materialMatches || vendorMatches;
			});
		});
	}, [
		preparedVendorsWithOrders,
		searchQuery,
		orderTypeFilter,
		selectedLocation,
		matchesVendorSearch,
		matchesMaterialSearch,
	]);

	const tableColumns = useMemo<GridColDef[]>(
		() => [
			{
				field: "material",
				headerName: "Material",
				flex: 1,
				headerAlign: "center",
				align: "center",
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
							color: theme.palette.primary.light,
							fontWeight: "bold",
						}}
					>
						{formatAmount(Number(value))}
					</Typography>
				),
			},
			{
				field: "typeLabel",
				headerName: "Type",
				flex: 1,
				align: "right",
				headerAlign: "right",
				renderCell: ({ row }) =>
					row.orderType === "sell" ? <ChipAsk /> : <ChipBid />,
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
					<Typography variant="body2">
						{formatLocation(row.locName, row.locCode)}
					</Typography>
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
					const match = userText.match(/^(.+)\s\((.+)\)\s(.+)$/);
					if (!match) {
						return <Typography variant="body2">{userText}</Typography>;
					}
					return (
						<Typography variant="body2">
							<Box component="span" sx={{ fontWeight: "bold" }}>
								{match[1]}
							</Box>{" "}
							({match[2]}) {match[3]}
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
				renderCell: ({ value }) => {
					const act = String(value).trim();
					if (act === "0 m" || act === "0m") {
						return (
							<Typography variant="caption" sx={{ opacity: 0.8 }}>
								Recently Active
							</Typography>
						);
					}
					return (
						<Typography variant="caption" sx={{ opacity: 0.8 }}>
							{act === "-" ? "-" : `${act} ago`}
						</Typography>
					);
				},
			},
		],
		[theme],
	);

	return (
		<Box
			sx={{
				boxSizing: "border-box",
				margin: { xs: 0, sm: "0 0rem" },
				height: "100%",
				width: "100%",
				display: "flex",
				flexDirection: "column",
			}}
		>
			{/* Search and Action Bar */}
			<Box sx={{ mb: 2, pt: 1, mx: 1 }}>
				<Box
					sx={{
						width: "100%",
						display: "flex",
						flexDirection: { xs: "column", md: "row" },
						alignItems: { xs: "stretch", md: "center" },
						gap: 1.5,
					}}
				>
					<Box
						sx={{
							display: "flex",
							gap: 1.5,
							flexDirection: { xs: "column", sm: "row" },
						}}
					>
						<ToggleButtonGroup
							value={vendorViewMode}
							exclusive
							fullWidth
							onChange={(_event, newValue: "grid" | "table" | null) => {
								if (newValue) {
									handleViewModeChange(newValue);
								}
							}}
							size="small"
							aria-label="Vendor view mode"
							sx={{
								height: 40,
								borderRadius: "12px",
								"& .MuiToggleButtonGroup-grouped": {
									"&:hover": {
										background: alpha(theme.palette.primary.main, 0.5),
									},
									"&.Mui-selected": {
										background: alpha(theme.palette.background.default, 0.8),
										color: theme.palette.primary.light,
										pointerEvents: "none",
										"&:hover": {
											background: alpha(theme.palette.background.default, 0.9),
										},
									},
								},
							}}
						>
							<ToggleButton
								value="grid"
								size="small"
								aria-label="Grid view"
								sx={{ px: 1.5, textTransform: "none" }}
							>
								Grid
							</ToggleButton>
							<ToggleButton
								value="table"
								size="small"
								aria-label="Table view"
								sx={{ px: 1.5, textTransform: "none" }}
							>
								Table
							</ToggleButton>
						</ToggleButtonGroup>
					</Box>

					<TextField
						fullWidth
						variant="outlined"
						size="small"
						inputRef={searchInputRef}
						placeholder="Search Materials & Vendors…"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						sx={{
							flexGrow: 1,
							"& .MuiOutlinedInput-root": {
								height: 40,
								bgcolor: alpha(theme.palette.background.default, 0.5),
								backdropFilter: "blur(5px)",
								borderRadius: "12px",
								"& fieldset": {
									borderColor: alpha(theme.palette.common.white, 0.1),
								},
								"&:hover fieldset": { borderColor: theme.palette.primary.main },
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
										<Search size={20} color={theme.palette.primary.main} />
									</InputAdornment>
								),
								endAdornment: searchQuery ? (
									<InputAdornment position="end">
										<IconButton
											size="small"
											aria-label="Clear material search"
											onClick={() => setSearchQuery("")}
										>
											<X size={16} />
										</IconButton>
									</InputAdornment>
								) : null,
							},
						}}
					/>

					<Box
						sx={{
							display: "flex",
							gap: 1.5,
							flexDirection: { xs: "column", sm: "row" },
						}}
					>
						<ToggleButtonGroup
							value={orderTypeFilter}
							exclusive
							fullWidth
							onChange={(_event, newValue: "ASK" | "BID" | "BOTH" | null) => {
								if (newValue) {
									setOrderTypeFilter(newValue);
								}
							}}
							size="small"
							aria-label="Order type filter"
							sx={{
								height: 40,
								borderRadius: "12px",
								"& .MuiToggleButtonGroup-grouped": {
									"&:hover": {
										background: alpha(theme.palette.primary.main, 0.5),
									},
									"&.Mui-selected": {
										background: alpha(theme.palette.background.default, 0.8),
										color: theme.palette.primary.light,
										pointerEvents: "none",
										"&:hover": {
											background: alpha(theme.palette.background.default, 1),
										},
									},
								},
							}}
						>
							<ToggleButton
								value="BOTH"
								size="small"
								aria-label="Show both ask and bid"
								sx={{ px: 1.5, textTransform: "none" }}
							>
								Both
							</ToggleButton>
							<ToggleButton
								value="ASK"
								size="small"
								aria-label="Show only ask"
								sx={{ px: 1.5, textTransform: "none" }}
							>
								Ask
							</ToggleButton>
							<ToggleButton
								value="BID"
								size="small"
								aria-label="Show only bid"
								sx={{ px: 1.5, textTransform: "none" }}
							>
								Bid
							</ToggleButton>
						</ToggleButtonGroup>
						<Autocomplete<LocationOption, false, false, false>
							size="small"
							options={allLocations}
							value={
								selectedLocation === null
									? null
									: allLocations.find(
											(option) => option.id === selectedLocation,
										) || null
							}
							onChange={(_e, newValue) =>
								setSelectedLocation(newValue?.id || null)
							}
							inputValue={locationInputValue}
							onInputChange={(_e, newInputValue, reason) => {
								if (reason === "reset") {
									const selectedOption = allLocations.find(
										(option) => option.id === selectedLocation,
									);
									setLocationInputValue(
										selectedLocation === null
											? ""
											: formatLocation(selectedOption?.name, selectedLocation),
									);
								} else {
									setLocationInputValue(newInputValue);
								}
							}}
							disableClearable={false}
							getOptionLabel={(option) =>
								formatLocation(option.name, option.id)
							}
							isOptionEqualToValue={(option, value) => option.id === value.id}
							renderOption={(props, option) => (
								<Box component="li" {...props}>
									<Typography variant="body2">
										{formatLocation(option.name, option.id)}
									</Typography>
								</Box>
							)}
							slotProps={{
								paper: {
									sx: {
										bgcolor: theme.palette.background.default,
										backgroundImage: "none",
									},
								},
							}}
							sx={{
								flexGrow: { xs: 1, sm: 0 },
								minWidth: { sm: 260 },
								"& .MuiAutocomplete-clearIndicator": {
									visibility: selectedLocation ? "visible" : "hidden",
									opacity: selectedLocation ? 1 : 0,
								},
							}}
							renderInput={(params) => (
								<TextField
									{...params}
									variant="outlined"
									placeholder="All Locations"
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
								/>
							)}
						/>
						<Box
							sx={{
								display: "flex",
								gap: 1,
								justifyContent: { xs: "center", sm: "flex-end" },
							}}
						>
							<IconButton
								onClick={handleOpenShoppingListModal}
								sx={{
									height: 40,
									width: 40,
									borderRadius: "50%",
									color: "white",
									bgcolor: "primary.main",
									boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
									"&:hover": {
										bgcolor: "primary.dark",
									},
								}}
							>
								<ShoppingBasket size={24} />
							</IconButton>
							{loggedIn && (
								<IconButton
									onClick={
										hasVendorStore ? handleOpenEditModal : handleOpenCreateModal
									}
									disabled={isCheckingStore}
									sx={{
										height: 40,
										width: 40,
										borderRadius: "50%",
										color: "white",
										bgcolor: "primary.main",
										boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
										"&:hover": {
											bgcolor: "primary.dark",
										},
										"&.Mui-disabled": {
											bgcolor: alpha(theme.palette.primary.main, 0.5),
										},
									}}
								>
									{hasVendorStore ? (
										<Edit size={24} />
									) : (
										<PlusCircle size={24} />
									)}
								</IconButton>
							)}
						</Box>
					</Box>
				</Box>
			</Box>

			{/* Vendor List Area */}
			<Box
				id="vendors"
				sx={{ flexGrow: 1, overflowY: "auto", minHeight: 0, px: 0, pb: 2 }}
			>
				{vendorViewMode === "table" ? (
					<Box sx={{ height: "100%", width: "100%" }}>
						<DataGrid
							rows={tableRows}
							columns={tableColumns}
							density="compact"
							hideFooter
							disableColumnMenu
							disableColumnSorting
							disableRowSelectionOnClick
							sortModel={[{ field: "material", sort: "asc" }]}
							localeText={{ noRowsLabel: "No results" }}
							sx={{
								border: "none",
								"& .MuiDataGrid-row": {
									borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
									"&:hover": {
										backgroundColor: alpha(theme.palette.primary.main, 0.04),
									},
									display: "flex",
									alignItems: "center",
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
								"& .MuiDataGrid-columnSeparator": {
									display: "none",
								},
								"& .MuiDataGrid-virtualScroller": {
									marginTop: "0 !important",
								},
							}}
						/>
					</Box>
				) : (
					<>
						{filteredVendors.length > 0 ? (
							<Masonry
								columns={{ xs: 1, sm: 1, md: 2, lg: 3, xl: 4, xll: 5 }}
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
								<Typography variant="h6">
									{isLoadingVendors ? "Loading…" : "No results"}
								</Typography>
							</Box>
						)}
					</>
				)}
			</Box>

			<VendorCreationModal
				open={isCreateModalOpen}
				handleClose={handleCloseCreateModal}
				onVendorCreated={handleOnVendorCreated}
				vendorStore={null}
			/>
			<EditVendorStoreModal
				open={isEditModalOpen}
				handleClose={handleCloseEditModal}
				vendorStore={userVendorStore}
				setVendorStore={setUserVendorStore}
				onStoreDeleted={handleOnStoreDeleted}
				onVendorChanged={handleOnVendorChanged}
			/>
			<ShoppingListModal
				open={isShoppingListModalOpen}
				handleClose={handleCloseShoppingListModal}
				vendors={vendorStores}
				isLoggedIn={loggedIn}
			/>
		</Box>
	);
};

export default VendorsList;
