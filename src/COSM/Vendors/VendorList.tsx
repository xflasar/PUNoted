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
	Grid,
	TextField,
	InputAdornment,
	ToggleButton,
	ToggleButtonGroup,
	Card,
	CardContent,
	Divider,
	useTheme,
	keyframes,
	IconButton,
	Tooltip,
	Chip,
	alpha,
} from "@mui/material";
import {
	Search,
	PlusCircle,
	Edit,
	ShoppingBasket,
	MapPin,
	Minus,
	Target,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import VendorCreationModal from "./CreateVendorStoreModal";
import EditVendorStoreModal from "./EditVendorStoreModal";
import ShoppingListModal from "./ShoppingListModal";
import { formatAmount } from "../../utils/formaters";
import type { VendorStore } from "./types";

type CxPriceLookup = Record<string, Record<string, unknown>>;
const VENDORS_VIEW_MODE_STORAGE_KEY = "vendorsView";

const isVendorViewMode = (value: string | null): value is "grid" | "table" =>
	value === "grid" || value === "table";

const getStoredVendorViewMode = (): "grid" | "table" | null => {
	const storedValue = localStorage.getItem(VENDORS_VIEW_MODE_STORAGE_KEY);
	return isVendorViewMode(storedValue) ? storedValue : null;
};

// --- ANIMATIONS ---
const scroll = keyframes`
  0% { transform: translateX(0); }
  25% { transform: translateX(-100%); }
  75% { transform: translateX(-100%); }
  100% { transform: translateX(0); }
`;

// --- HELPER COMPONENTS ---

const ScrollingText: React.FC<{ text: string; variant: any; sx?: any }> =
	React.memo(({ text, variant, sx }) => {
		const textRef = useRef<HTMLDivElement>(null);
		const [overflowing, setOverflowing] = useState(false);

		useEffect(() => {
			const checkOverflow = () => {
				if (textRef.current) {
					setOverflowing(
						textRef.current.scrollWidth > textRef.current.clientWidth,
					);
				}
			};
			checkOverflow();
			window.addEventListener("resize", checkOverflow);
			return () => window.removeEventListener("resize", checkOverflow);
		}, [text]);

		return (
			<Box
				sx={{
					overflow: "hidden",
					whiteSpace: "nowrap",
					display: "inline-block",
					maxWidth: "100%",
					verticalAlign: "middle",
				}}
			>
				<Typography
					ref={textRef}
					variant={variant}
					component="div"
					sx={{
						...sx,
						display: "inline-block",
						whiteSpace: "nowrap",
						pr: overflowing ? "16px" : 0,
						animation: overflowing
							? `${scroll} 10s linear infinite alternate`
							: "none",
					}}
				>
					{text}
				</Typography>
			</Box>
		);
	});

const getDiffStats = (
	vendorPrice: number,
	refPrice: number | undefined,
	type: "buy" | "sell",
) => {
	if (!refPrice || refPrice === 0 || !vendorPrice) return null;

	const diff = ((vendorPrice - refPrice) / refPrice) * 100;
	const roundedDiff = Number(diff.toFixed(1));
	const normalizedDiff = Object.is(roundedDiff, -0) ? 0 : roundedDiff;
	const formatted = `${normalizedDiff > 0 ? "+" : ""}${normalizedDiff.toFixed(1)}%`;

	const isNeutral = normalizedDiff === 0;
	let isGood = false;
	if (!isNeutral) {
		if (type === "sell") isGood = normalizedDiff < 0;
		else isGood = normalizedDiff > 0;
	}

	return {
		value: normalizedDiff,
		label: formatted,
		isGood,
		color: isNeutral ? "neutral" : isGood ? "success" : "error",
	};
};

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
				const fixedPrice = item.price?.fixedprice ?? item.fixedprice ?? 0;
				const sideKey = `${normalizedExchange}-${orderType === "sell" ? "AskPrice" : "BidPrice"}`;
				const rawCxValue =
					cxPriceLookup[item.materialticker.trim().toUpperCase()]?.[sideKey];
				const cxReferencePrice = Number(rawCxValue);
				const cxStats = getDiffStats(
					fixedPrice,
					Number.isFinite(cxReferencePrice) ? cxReferencePrice : undefined,
					orderType,
				);
				const corpStats = getDiffStats(
					fixedPrice,
					item.price?.corpprice,
					orderType,
				);
				const hasLocation = Boolean(item.location?.length);
				const locationText = hasLocation
					? item.location[0].location_code || item.location[0].location_name
					: "Unknown";
				const locationCount = hasLocation ? item.location.length : 0;

				return {
					item,
					fixedPrice,
					orderType,
					cxStats,
					corpStats,
					locationText,
					locationCount,
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
	stats: any;
}) => {
	const theme = useTheme();
	if (!stats) return <Box sx={{ width: 40 }} />;

	return (
		<Tooltip title={`${label} Price Difference`}>
			<Chip
				// icon={stats.color === "neutral" ? <Target size={12} /> : undefined}
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

// Renders the list of products
const VendorProductList = React.memo(
	({
		list,
		title,
	}: {
		list: ReturnType<typeof prepareVendorStore>["buyOrders"];
		title: string;
	}) => {
		const theme = useTheme();
		const isBuying = title === "Bid";

		return (
			<Box
				sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}
			>
				<Typography
					variant="caption"
					sx={{
						mb: 0.5,
						color: isBuying
							? theme.palette.info.light
							: theme.palette.warning.light,
						fontWeight: "bold",
						textAlign: "center",
						letterSpacing: 1,
						fontSize: "0.7rem",
						borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
						pb: 0.2,
					}}
				>
					{title.toUpperCase()}
				</Typography>

				<Box
					sx={{
						overflowY: "auto",
						px: 0,
						maxHeight: "300px",
						minHeight: "50px",
						display: "flex",
						flexDirection: "column",
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
					{list.length > 0 ? (
						list.map((preparedOrder, index) => {
							const {
								item,
								fixedPrice,
								orderType,
								cxStats,
								corpStats,
								locationText,
								locationCount,
								displayQuantity,
							} = preparedOrder;

							return (
								<Box
									key={item.frontendId || index}
									sx={{
										p: 0,
										borderBottom:
											index === list.length - 1
												? "none"
												: `1px solid ${alpha(theme.palette.common.white, 0.15)}`,
										padding: ".5em 0",
										transition: "background-color 0.2s",
										display: "flex",
										flexDirection: "column",
										cursor: "default",
										"&:hover": {
											backgroundColor: alpha(theme.palette.common.white, 0.03),
										},
									}}
								>
									{/* ROW 1: Ticker (Left) -- Location (Right, Max 50%) */}
									<Box
										sx={{
											display: "flex",
											justifyContent: "space-between",
											alignItems: "center",
										}}
									>
										<Typography
											variant="subtitle2"
											sx={{
												fontWeight: "bold",
												color: theme.palette.text.primary,
												fontSize: "0.85rem",
												lineHeight: 1,
											}}
										>
											{item.materialticker}
										</Typography>

										{item.location && item.location.length > 0 && (
											<Tooltip
												title={
													<Box sx={{ p: 0.5 }}>
														{item.location.map((l, i) => (
															<Box
																key={i}
																sx={{
																	display: "flex",
																	justifyContent: "space-between",
																	gap: 2,
																	minWidth: 120,
																}}
															>
																<Typography variant="caption">
																	{l.location_name}
																</Typography>
																<Typography
																	variant="caption"
																	color="success.light"
																>
																	{formatAmount(
																		(
																			l as typeof l & {
																				available?: number;
																			}
																		).available,
																	)}
																</Typography>
															</Box>
														))}
													</Box>
												}
												slotProps={{
													tooltip: {
														sx: {
															backdropFilter: "blur(8px)",
															background: alpha(
																theme.palette.background.default,
																0.95,
															),
															border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
														},
													},
												}}
											>
												<Box
													sx={{
														display: "flex",
														alignItems: "center",
														gap: 0.5,
														opacity: 0.8,
														cursor: "help",
														maxWidth: "50%",
														justifyContent: "flex-end",
													}}
												>
													<MapPin
														size={10}
														color={theme.palette.text.secondary}
														style={{ flexShrink: 0 }}
													/>
													<Typography
														variant="caption"
														noWrap
														sx={{
															fontSize: "0.75rem",
															color: theme.palette.text.secondary,
														}}
													>
														{locationText}
													</Typography>
													{locationCount > 1 && (
														<span
															style={{
																fontSize: "0.75rem",
																fontWeight: "bold",
																color: theme.palette.primary.main,
																flexShrink: 0,
															}}
														>
															+{locationCount - 1}
														</span>
													)}
												</Box>
											</Tooltip>
										)}
									</Box>

									{/* ROW 2: Quantity & Price (Middle) */}
									<Box
										sx={{
											display: "flex",
											justifyContent: "space-between",
											alignItems: "flex-end",
											mt: 0.2,
										}}
									>
										<Box
											sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}
										>
											<Typography
												variant="caption"
												sx={{
													color: theme.palette.text.secondary,
													fontSize: "0.75rem",
												}}
											>
												Qty:
											</Typography>
											<Typography
												variant="body2"
												sx={{
													fontWeight: "bold",
													color: theme.palette.primary.light,
												}}
											>
												{formatAmount(displayQuantity)}
											</Typography>
										</Box>

										<Box
											sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}
										>
											<Typography
												variant="body2"
												sx={{
													fontWeight: "bold",
													color:
														orderType === "buy"
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
													fontSize: "0.75rem",
												}}
											>
												ICA
											</Typography>
										</Box>
									</Box>

									{/* ROW 3: Badges (Bottom - Comparisons) */}
									{cxStats || corpStats ? (
										<Box
											sx={{
												display: "flex",
												gap: 1,
												flexWrap: "nowrap",
												mt: 0.2,
												minHeight: "25px",
												justifyContent: "space-between",
												alignItems: "center",
											}}
										>
											<Box sx={{ flex: 1, display: "flex" }}>
												{cxStats && (
													<PriceComparisonBadge label="CX" stats={cxStats} />
												)}
											</Box>
											<Box
												sx={{
													flex: 1,
													display: "flex",
													justifyContent: "flex-end",
												}}
											>
												{corpStats && (
													<PriceComparisonBadge
														label="COSM"
														stats={corpStats}
													/>
												)}
											</Box>
										</Box>
									) : (
										<Box sx={{ minHeight: "25px" }} />
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
			</Box>
		);
	},
);

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

		return (
			<Card
				sx={{
					bgcolor: alpha(theme.palette.background.default, 0.7),
					backgroundImage: "none",
					color: theme.palette.text.primary,
					borderRadius: "16px",
					display: "flex",
					flexDirection: "column",
					border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
					backdropFilter: "blur(12px)",
					WebkitBackdropFilter: "blur(12px)",
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
					<Box sx={{ textAlign: "center", mb: 1.5 }}>
						<ScrollingText
							text={vendor.companyname}
							variant="subtitle1"
							sx={{ fontWeight: 600, letterSpacing: "0.5px", mb: 1 }}
						/>

						<Box
							sx={{
								display: "flex",
								justifyContent: "center",
								alignItems: "center",
								gap: 1.5,
								flexWrap: "wrap",
							}}
						>
							{/* Game Name Badge: Soft, pill-shaped background for standard metadata */}
							<Typography
								variant="caption"
								sx={{
									color: theme.palette.text.secondary,
									bgcolor: alpha(theme.palette.background.default, 0.6),
									px: 1.5,
									py: 0.5,
									borderRadius: "12px",
									fontWeight: 500,
								}}
							>
								{vendor.gamename}
							</Typography>

							{/* Company Code Badge: Ticker style, primary colors, sharp radius */}
							<Typography
								variant="caption"
								sx={{
									color: theme.palette.primary.light,
									bgcolor: alpha(theme.palette.primary.main, 0.1),
									border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
									px: 1.5,
									py: 0.5,
									borderRadius: "4px",
									fontWeight: "bold",
									letterSpacing: "0.5px",
								}}
							>
								{vendor.companycode}
							</Typography>

							{/* Activity Status: Flex container to hold the text and the status dot */}
							<Typography
								variant="caption"
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 0.75,
									color: theme.palette.text.secondary,
									bgcolor: alpha(theme.palette.background.default, 0.6),
									px: 1.5,
									py: 0.5,
									borderRadius: "12px",
									fontWeight: 500,
								}}
							>
								{/* Status Indicator Dot */}
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
								Updated{" "}
								{(vendor as typeof vendor & { activity?: unknown }).activity}{" "}
								ago
							</Typography>
						</Box>
					</Box>

					<Divider
						sx={{ my: 1, bgcolor: alpha(theme.palette.common.white, 0.08) }}
					/>

					{/* Product Columns - Responsive Layout: Row on Desktop, Column on Mobile */}
					<Box
						sx={{
							display: "flex",
							flexDirection: { xs: "column", sm: "row" },
							gap: 1,
						}}
					>
						<VendorProductList list={sellOrders} title="Ask" />

						{/* Divider Logic: Horizontal on Mobile, Vertical on Desktop */}
						<Divider
							orientation="vertical"
							flexItem
							sx={{
								bgcolor: alpha(theme.palette.common.white, 0.08),
								display: { xs: "none", sm: "block" },
							}}
						/>
						<Divider
							orientation="horizontal"
							flexItem
							sx={{
								bgcolor: alpha(theme.palette.common.white, 0.08),
								display: { xs: "block", sm: "none" },
								width: "100%",
							}}
						/>

						<VendorProductList list={buyOrders} title="Bid" />
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
					fetch("https://punoted.ddns.net/dev/api/vendor_stores"),
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

	// Handlers (Memoized to stay stable)
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

	const vendorStoreMatchesSearch = useCallback(
		(vendorStore: VendorStore, query: string) =>
			matchesVendorSearch(vendorStore.vendor, query) ||
			vendorStore.orders.some((order) =>
				matchesMaterialSearch(order.materialticker, query),
			),
		[matchesVendorSearch, matchesMaterialSearch],
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

	// Filter Logic
	const filteredVendors = useMemo(() => {
		if (!searchQuery) return vendorsWithOrders;
		const lowerCaseQuery = normalizeSearchQuery(searchQuery);
		return vendorsWithOrders.filter((vendor) =>
			vendorStoreMatchesSearch(vendor, lowerCaseQuery),
		);
	}, [
		searchQuery,
		vendorsWithOrders,
		normalizeSearchQuery,
		vendorStoreMatchesSearch,
	]);

	const preparedFilteredVendors = useMemo(
		() =>
			filteredVendors.map((vendorStore) =>
				prepareVendorStore(vendorStore, cxPriceLookup),
			),
		[filteredVendors, cxPriceLookup],
	);

	const preparedVendorsWithOrders = useMemo(
		() =>
			vendorsWithOrders.map((vendorStore) =>
				prepareVendorStore(vendorStore, cxPriceLookup),
			),
		[vendorsWithOrders, cxPriceLookup],
	);

	const tableRows = useMemo(() => {
		const lowerCaseQuery = normalizeSearchQuery(searchQuery);
		const searchScope: SearchScope = "row";
		return preparedVendorsWithOrders.flatMap((preparedVendor) => {
			const { vendorStore, buyOrders, sellOrders } = preparedVendor;
			const vendor = vendorStore.vendor;
			const vendorMatches =
				!lowerCaseQuery || matchesVendorSearch(vendor, lowerCaseQuery);
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
				return locations.map((location, index) => {
					const locationQuantity =
						location &&
						typeof Reflect.get(location as object, "available") === "number"
							? Number(Reflect.get(location as object, "available"))
							: (location?.amount ?? preparedOrder.displayQuantity);
					const locationLabel = (() => {
						if (!location) return "Unknown";
						const code = location.location_code?.trim();
						const name = location.location_name?.trim();
						if (code && name) {
							const sameLabel =
								code.localeCompare(name, undefined, {
									sensitivity: "base",
								}) === 0;
							return sameLabel ? name : `${name} (${code})`;
						}
						return code || name || "Unknown";
					})();
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
					};
				});
			};
			return [
				...sellOrders.flatMap((order) => buildRows(order, "Ask")),
				...buyOrders.flatMap((order) => buildRows(order, "Bid")),
			].filter((row) => {
				if (row.quantity <= 0) return false;
				if (!lowerCaseQuery) return true;
				if (searchScope === "vendor") {
					return vendorMatches;
				}
				return (
					vendorMatches || matchesMaterialSearch(row.material, lowerCaseQuery)
				);
			});
		});
	}, [
		preparedVendorsWithOrders,
		searchQuery,
		normalizeSearchQuery,
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
				renderCell: ({ row }) => (
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
						{row.typeLabel}
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
				renderCell: ({ value }) => {
					const locationText = String(value || "");
					const match = locationText.match(/^(.+)\s\((.+)\)$/);
					if (!match) {
						return (
							<Typography variant="body2" sx={{ fontWeight: "bold" }}>
								{locationText}
							</Typography>
						);
					}
					return (
						<Typography variant="body2">
							<Box component="span" sx={{ fontWeight: "bold" }}>
								{match[1]}
							</Box>{" "}
							({match[2]})
						</Typography>
					);
				},
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
				headerName: "Updated",
				flex: 1,
				headerAlign: "left",
				align: "left",
				renderCell: ({ value }) => (
					<Typography variant="caption" sx={{ opacity: 0.8 }}>
						{value === "-" ? "-" : `${value} ago`}
					</Typography>
				),
			},
		],
		[theme],
	);

	return (
		<Box
			sx={{
				boxSizing: "border-box",
				margin: { xs: 0, sm: "0 1rem" },
				height: "100%",
				width: "100%",
				display: "flex",
				flexDirection: "column",
			}}
		>
			{/* Search and Action Bar */}
			<Grid container spacing={2} alignItems="center" sx={{ mb: 2, pt: 1 }}>
				<Box
					sx={{
						width: "100%",
						display: "flex",
						flexDirection: "row",
						alignItems: "center",
						gap: 2,
						px: 1,
					}}
				>
					<ToggleButtonGroup
						value={vendorViewMode}
						exclusive
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
					<TextField
						fullWidth
						variant="outlined"
						size="small"
						inputRef={searchInputRef}
						placeholder="Search Materials & Vendors…"
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
								"&:hover fieldset": { borderColor: theme.palette.primary.main },
								"&.Mui-focused fieldset": {
									borderColor: theme.palette.primary.main,
								},
								color: theme.palette.text.primary,
							},
						}}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<Search size={20} color={theme.palette.primary.main} />
								</InputAdornment>
							),
						}}
					/>
					<Box
						sx={{
							display: "flex",
							gap: 1,
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
								{hasVendorStore ? <Edit size={24} /> : <PlusCircle size={24} />}
							</IconButton>
						)}
					</Box>
				</Box>
			</Grid>

			{/* Vendor List Area */}
			<Box
				id="vendors"
				sx={{ flexGrow: 1, overflowY: "auto", minHeight: 0, px: 1, pb: 2 }}
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
				// @ts-ignore
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
