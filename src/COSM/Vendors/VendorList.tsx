import React, {
	useState,
	useMemo,
	useRef,
	useEffect,
	useCallback,
} from "react";
import { Masonry } from "@mui/lab";
import {
	Typography,
	Box,
	Grid,
	TextField,
	InputAdornment,
	Card,
	CardContent,
	Divider,
	useTheme,
	keyframes,
	Fab,
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
} from "lucide-react";
import VendorCreationModal from "./CreateVendorStoreModal";
import EditVendorStoreModal from "./EditVendorStoreModal";
import ShoppingListModal from "./ShoppingListModal";
import { formatAmount } from "../../utils/formaters";
import type { VendorStore, OrderItem } from "./types";

type CxPriceLookup = Record<string, Record<string, unknown>>;

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
	const formatted = `${diff > 0 ? "+" : ""}${diff.toFixed(1)}%`;

	let isGood = false;
	if (type === "sell") isGood = diff < 0;
	else isGood = diff > 0;

	return {
		value: diff,
		label: formatted,
		isGood,
		color: isGood ? "success" : "error",
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
				label={`${label} ${stats.label}`}
				size="small"
				variant="outlined"
				sx={{
					height: 18,
					fontSize: "0.7rem",
					"& .MuiChip-label": { px: 0.8 },
					backdropFilter: "blur(4px)",
					color: stats.isGood
						? theme.palette.success.light
						: theme.palette.error.light,
					borderColor: stats.isGood
						? alpha(theme.palette.success.main, 0.3)
						: alpha(theme.palette.error.main, 0.3),
					bgcolor: stats.isGood
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
		vendorCx,
		cxPriceLookup,
	}: {
		list: OrderItem[];
		title: string;
		vendorCx: string | undefined;
		cxPriceLookup: CxPriceLookup;
	}) => {
		const theme = useTheme();
		const isBuying = title === "Bid";
		const normalizedExchange = (vendorCx || "IC1").trim().toUpperCase() || "IC1";
		const sortedList = useMemo(
			() =>
				[...list].sort((a, b) =>
					a.materialticker.localeCompare(b.materialticker, undefined, {
						sensitivity: "base",
					}),
				),
			[list],
		);

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
					{sortedList.length > 0 ? (
						sortedList.map((item, index) => {
							const fixedPrice = item.price?.fixedprice ?? item.fixedprice ?? 0;
							const orderType = item.ordertype || (isBuying ? "buy" : "sell");
							const sideKey = `${normalizedExchange}-${orderType === "sell" ? "AskPrice" : "BidPrice"}`;
							const rawCxValue =
								cxPriceLookup[item.materialticker.trim().toUpperCase()]?.[
									sideKey
								];
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

							let locationText = "Unknown";
							let locationCount = 0;
							if (item.location && item.location.length > 0) {
								locationText =
									item.location[0].location_code ||
									item.location[0].location_name;
								locationCount = item.location.length;
							}

							return (
								<Box
									key={item.frontendId || index}
									sx={{
										p: 0,
										borderBottom:
												index === sortedList.length - 1
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
																	{formatAmount(l.available)}
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

									{/* ROW 2: Badges (Middle - Comparisons) */}
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
												{corpStats && (
													<PriceComparisonBadge
														label="COSM"
														stats={corpStats}
													/>
												)}
											</Box>
											<Box
												sx={{ flex: 1, display: "flex", justifyContent: "flex-end" }}
											>
												{cxStats && (
													<PriceComparisonBadge label="CX" stats={cxStats} />
												)}
											</Box>
										</Box>
									) : (
										<Box sx={{ minHeight: "25px" }} />
									)}

									{/* ROW 3: Quantity & Price (Bottom) */}
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
												{formatAmount(item.available || item.quantity)}
											</Typography>
										</Box>

										<Box
											sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}
										>
											<Typography
												variant="body2"
												sx={{
													fontWeight: "bold",
													color: orderType === "buy"
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
	({ vendor, cxPriceLookup }: { vendor: VendorStore; cxPriceLookup: CxPriceLookup }) => {
	const theme = useTheme();

	const buyOrders = useMemo(
		() =>
			vendor.orders
				? vendor.orders.filter((mat) => mat.ordertype === "buy")
				: [],
		[vendor.orders],
	);
	const sellOrders = useMemo(
		() =>
			vendor.orders
				? vendor.orders.filter((mat) => mat.ordertype === "sell")
				: [],
		[vendor.orders],
	);

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
						text={vendor.vendor.companyname}
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
							{vendor.vendor.gamename}
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
							{vendor.vendor.companycode}
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
							Active {vendor.vendor.activity} ago
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
					<VendorProductList
						list={sellOrders}
						title="Ask"
						vendorCx={vendor.vendor.cx}
						cxPriceLookup={cxPriceLookup}
					/>

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

					<VendorProductList
						list={buyOrders}
						title="Bid"
						vendorCx={vendor.vendor.cx}
						cxPriceLookup={cxPriceLookup}
					/>
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
	const [searchQuery, setSearchQuery] = useState<string>("");

	// Modal States
	const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
	const [isShoppingListModalOpen, setIsShoppingListModalOpen] = useState(false);

	// Data States
	const [hasVendorStore, setHasVendorStore] = useState<boolean | null>(null);
	const [isCheckingStore, setIsCheckingStore] = useState<boolean>(true);
	const [vendorStores, setVendorStores] = useState<VendorStore[]>([]);
	const [cxPriceLookup, setCxPriceLookup] = useState<CxPriceLookup>({});
	const [userVendorStore, setUserVendorStore] = useState<VendorStore | null>(
		null,
	);

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
							typeof row.ticker === "string" ? row.ticker.trim().toUpperCase() : "";
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

	// Filter Logic
	const filteredVendors = useMemo(() => {
		const vendorsWithOrders = sortedVendors.filter((vendor) =>
			vendor.orders?.some(
				(order) => order.ordertype === "buy" || order.ordertype === "sell",
			),
		);
		if (!searchQuery) return vendorsWithOrders;
		const lowerCaseQuery = searchQuery.toLowerCase();
		return vendorsWithOrders.filter(
			(vendor) =>
				vendor.vendor.companyname.toLowerCase().includes(lowerCaseQuery) ||
				vendor.vendor.gamename.toLowerCase().includes(lowerCaseQuery) ||
				vendor.vendor.companycode.toLowerCase().includes(lowerCaseQuery) ||
				vendor.orders.some((material) =>
					material.materialticker.toLowerCase().includes(lowerCaseQuery),
				),
		);
	}, [searchQuery, sortedVendors]);

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
						gap: 2,
						px: 1,
					}}
				>
					<TextField
						fullWidth
						variant="outlined"
						size="small"
						placeholder="Search Vendors..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						sx={{
							"& .MuiOutlinedInput-root": {
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
					<Box sx={{ display: "flex", gap: 1 }}>
						<Fab
							color="primary"
							size="medium"
							onClick={handleOpenShoppingListModal}
							sx={{ color: "white", boxShadow: "0 4px 10px rgba(0,0,0,0.5)" }}
						>
							<ShoppingBasket size={24} />
						</Fab>
						{loggedIn && (
							<Fab
								color="primary"
								size="medium"
								onClick={
									hasVendorStore ? handleOpenEditModal : handleOpenCreateModal
								}
								disabled={isCheckingStore}
								sx={{ color: "white", boxShadow: "0 4px 10px rgba(0,0,0,0.5)" }}
							>
								{hasVendorStore ? <Edit size={24} /> : <PlusCircle size={24} />}
							</Fab>
						)}
					</Box>
				</Box>
			</Grid>

			{/* Vendor List Area */}
			<Box
				id="vendors"
				sx={{ flexGrow: 1, overflowY: "auto", minHeight: 0, px: 1, pb: 2 }}
			>
				{filteredVendors.length > 0 ? (
					<Masonry
						columns={{ xs: 1, sm: 1, md: 2, lg: 3, xl: 4, xll: 5 }}
						spacing={2}
					>
						{filteredVendors.map((vendor) => (
							<VendorCard
								key={vendor.vendor.companycode}
								vendor={vendor}
								cxPriceLookup={cxPriceLookup}
							/>
						))}
					</Masonry>
				) : (
					<Box sx={{ textAlign: "center", py: 8, opacity: 0.6 }}>
						<Typography variant="h6">
							No vendors found matching your search.
						</Typography>
					</Box>
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
