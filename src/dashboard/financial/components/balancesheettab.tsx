import React, { useState, useMemo } from "react";
import {
	Box,
	Typography,
	TextField,
	InputAdornment,
	Chip,
	Collapse,
	IconButton,
	LinearProgress,
	ButtonGroup,
	Button,
	Tooltip,
	useMediaQuery,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import RealEstateAgentIcon from "@mui/icons-material/RealEstateAgent";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import BuildIcon from "@mui/icons-material/Build";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import PublicIcon from "@mui/icons-material/Public";
import { FlexCard } from "./sharedui";
import { formatCurrency, SEMANTIC_COLORS } from "../utils/financeutils";
import MaterialBadge from "../../../cosm/components/materialbadge";
import { useGlobalData } from "../../../context/globaldatacontext";
import type {
	LocationValuation,
	PriceMode,
	PriceSource,
	SiteGroup,
} from "../hooks/usefinancialcalculations";
import { MaterialMarketModal } from "./materialmarketmodal";

interface BalanceSheetTabProps {
	locationValuations: LocationValuation[];
	currency: string;
	currentData: any;
	assetDistribution?: any;
	priceMode?: PriceMode;
	onPriceModeChange?: (mode: PriceMode) => void;
	priceSource?: PriceSource;
	onPriceSourceChange?: (source: PriceSource) => void;
}

interface LocationAuditRowProps {
	loc: LocationValuation;
	currency: string;
	totalAssets: number;
	priceSource: PriceSource;
	onMaterialClick: (ticker: string) => void;
	leasedSiteIds: Record<string, boolean>;
	onToggleLeased: (id: string) => void;
}

const LocationAuditRow: React.FC<LocationAuditRowProps> = ({
	loc,
	currency,
	totalAssets,
	priceSource,
	onMaterialClick,
	leasedSiteIds,
	onToggleLeased,
}) => {
	const { userMetadata } = useGlobalData();
	const [expanded, setExpanded] = useState<boolean>(false);
	const isPlanetLeased = !!leasedSiteIds[loc.id];
	const activeValue = isPlanetLeased ? 0 : loc.totalValue;
	const locPercentOfTotal =
		totalAssets > 0 ? ((activeValue / totalAssets) * 100).toFixed(1) : "0";

	return (
		<React.Fragment>
			{/* Level 1: Planet / Main Location Row */}
			<Box
				component="tr"
				onClick={() => setExpanded(!expanded)}
				className="hover-row"
				sx={{
					borderBottom: "1px solid rgba(255,255,255,0.06)",
					cursor: "pointer",
					backgroundColor: expanded
						? "rgba(123, 104, 238, 0.16)"
						: "transparent",
					transition: "all 0.18s ease-in-out",
				}}
			>
				<Box component="td" sx={{ padding: "6px 8px", width: "40px" }}>
					<IconButton
						size="small"
						sx={{
							p: 0.2,
							color: expanded ? "#7b68ee" : "rgba(255,255,255,0.8)",
						}}
					>
						{expanded ? (
							<KeyboardArrowUpIcon fontSize="small" />
						) : (
							<KeyboardArrowDownIcon fontSize="small" />
						)}
					</IconButton>
				</Box>
				<Box component="td" sx={{ padding: "6px 8px", width: "50%" }}>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<Chip
							icon={
								loc.type === "SHIP" ? (
									<RocketLaunchIcon sx={{ fontSize: "11px !important" }} />
								) : (
									<PublicIcon sx={{ fontSize: "11px !important" }} />
								)
							}
							label={loc.type === "SHIP" ? "SHIP" : "PLANET"}
							size="small"
							sx={{
								height: 18,
								fontSize: "0.58rem",
								fontWeight: 800,
								bgcolor:
									loc.type === "SHIP"
										? "rgba(123, 104, 238, 0.2)"
										: "rgba(34, 197, 94, 0.2)",
								color: loc.type === "SHIP" ? "#7b68ee" : "#22c55e",
								border: `1px solid ${loc.type === "SHIP" ? "rgba(123, 104, 238, 0.35)" : "rgba(34, 197, 94, 0.35)"}`,
							}}
						/>
						<Typography
							sx={{ fontSize: "0.85rem", fontWeight: 800, color: "white" }}
						>
							{loc.name}
						</Typography>
						{loc.type !== "SHIP" && (
							<Chip
								label={`${loc.sites?.length || 1} Sites`}
								size="small"
								sx={{
									height: 16,
									fontSize: "0.58rem",
									fontWeight: 800,
									bgcolor: "rgba(123, 104, 238, 0.15)",
									color: "#7b68ee",
								}}
							/>
						)}
					</Box>
				</Box>
				<Box
					component="td"
					sx={{
						padding: "6px 8px",
						textAlign: "right",
						fontFamily: "monospace",
						fontSize: "0.84rem",
						fontWeight: 800,
						color: isPlanetLeased ? "#f59e0b" : "#4ade80",
						width: "28%",
					}}
				>
					{isPlanetLeased
						? "0.00 " + currency
						: `${formatCurrency(loc.totalValue)} ${currency}`}
				</Box>
				<Box
					component="td"
					sx={{ padding: "6px 8px", textAlign: "right", width: "22%" }}
				>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "flex-end",
							gap: 1,
						}}
					>
						<LinearProgress
							variant="determinate"
							value={Math.min(100, Number(locPercentOfTotal))}
							sx={{
								width: 65,
								height: 5,
								borderRadius: 2,
								bgcolor: "rgba(255,255,255,0.1)",
								"& .MuiLinearProgress-bar": { bgcolor: "#7b68ee" },
							}}
						/>
						<Typography
							sx={{
								fontSize: "0.75rem",
								fontFamily: "monospace",
								fontWeight: 800,
								color: "white",
								minWidth: 40,
							}}
						>
							{locPercentOfTotal}%
						</Typography>
					</Box>
				</Box>
			</Box>

			{/* Level 2: Sites (OWNED vs Leased Sites) & Sub-Storages inside location */}
			<Box component="tr">
				<Box
					component="td"
					colSpan={4}
					sx={{ padding: 0, borderBottom: "1px solid rgba(255,255,255,0.06)" }}
				>
					<Collapse in={expanded} timeout="auto" unmountOnExit>
						<Box
							sx={{
								p: 0.75,
								bgcolor: "rgba(0, 0, 0, 0.45)",
								display: "flex",
								flexDirection: "column",
								gap: 0.75,
							}}
						>
							{(loc.sites || []).map((site: SiteGroup) => {
								const isUserToggledLeased = !!leasedSiteIds[site.id];
								const isOutboundLeased = site.leaseType === "Outbound";
								const isSiteLeased =
									isUserToggledLeased || site.isLeased || isOutboundLeased;
								const isShip = loc.type === "SHIP";

								return (
									<Box
										key={site.id}
										sx={{
											bgcolor: isSiteLeased
												? "rgba(245, 158, 11, 0.05)"
												: "rgba(255,255,255,0.03)",
											p: 0.75,
											borderRadius: "6px",
											border: `1px solid ${isSiteLeased ? "rgba(245, 158, 11, 0.3)" : "rgba(255,255,255,0.06)"}`,
										}}
									>
										{/* Site / Station / Ship Sub-Header */}
										{(() => {
											const isStationHub =
												loc.type === "STATION_WAREHOUSE" ||
												site.categoryType === "STATION_WAREHOUSE" ||
												loc.name.toUpperCase().includes("STATION");
											const isWarehouse =
												loc.type === "WAREHOUSE" ||
												site.categoryType === "WAREHOUSE";
											const labelPrefix = isShip
												? "Fleet Vessel"
												: isStationHub
													? "Owner"
													: isWarehouse
														? "Warehouse Owner"
														: "Site";

											const userCode = (
												userMetadata?.companyCode ||
												userMetadata?.username ||
												""
											).toUpperCase();
											const isOwner =
												site.amOwner !== undefined
													? site.amOwner
													: userCode &&
														site.ownerName.toUpperCase() === userCode;
											const isInboundLeased =
												site.leaseType === "Inbound" ||
												(!isOwner && site.isLeased);
											const isExcluded =
												isUserToggledLeased || isOutboundLeased;

											const badgeLabel = isExcluded
												? `Loaned to ${site.leasedTo ? site.leasedTo.toUpperCase() : "Tenant"}`
												: isInboundLeased
													? `Leased From ${site.leasedFrom ? site.leasedFrom.toUpperCase() : site.ownerName}`
													: "Owned Base";

											return (
												<Box
													sx={{
														display: "flex",
														alignItems: "center",
														justifyContent: "space-between",
														mb: 1,
														pb: 0.5,
														borderBottom: "1px solid rgba(255,255,255,0.06)",
													}}
												>
													<Box
														sx={{
															display: "flex",
															alignItems: "center",
															gap: 1,
															flexWrap: "wrap",
														}}
													>
														<Typography
															sx={{
																fontSize: "0.82rem",
																fontWeight: 800,
																color: "white",
															}}
														>
															{isShip
																? loc.name
																: `${labelPrefix}: ${site.ownerName}`}
														</Typography>
														{!isShip && !isStationHub && !isWarehouse && (
															<Chip
																icon={
																	isExcluded ? (
																		<RealEstateAgentIcon
																			sx={{ fontSize: "12px !important" }}
																		/>
																	) : (
																		<HomeWorkIcon
																			sx={{ fontSize: "12px !important" }}
																		/>
																	)
																}
																label={badgeLabel}
																size="small"
																onClick={() => onToggleLeased(site.id)}
																sx={{
																	height: 18,
																	fontSize: "0.58rem",
																	fontWeight: 800,
																	cursor: "pointer",
																	bgcolor: isExcluded
																		? "rgba(245, 158, 11, 0.2)"
																		: isInboundLeased
																			? "rgba(96, 165, 250, 0.2)"
																			: "rgba(74, 222, 128, 0.15)",
																	color: isExcluded
																		? "#f59e0b"
																		: isInboundLeased
																			? "#60a5fa"
																			: SEMANTIC_COLORS.neonGreen,
																	border: `1px solid ${isExcluded ? "rgba(245, 158, 11, 0.4)" : isInboundLeased ? "rgba(96, 165, 250, 0.4)" : "rgba(74, 222, 128, 0.3)"}`,
																	"&:hover": { opacity: 0.85 },
																}}
															/>
														)}
														{isStationHub && (
															<Chip
																icon={
																	<HomeWorkIcon
																		sx={{ fontSize: "12px !important" }}
																	/>
																}
																label="STATION WAREHOUSE"
																size="small"
																sx={{
																	height: 18,
																	fontSize: "0.58rem",
																	fontWeight: 800,
																	bgcolor: "rgba(123, 104, 238, 0.15)",
																	color: "#7b68ee",
																	border: "1px solid rgba(123, 104, 238, 0.3)",
																}}
															/>
														)}
														{site.buildingAssetValue > 0 && (
															<Chip
																label={
																	isShip
																		? `Chassis Value: ${formatCurrency(site.buildingAssetValue)} ${currency}`
																		: `Bldg Value: ${formatCurrency(site.buildingAssetValue)} ${currency}`
																}
																size="small"
																sx={{
																	height: 16,
																	fontSize: "0.58rem",
																	fontWeight: 700,
																	bgcolor: "rgba(123, 104, 238, 0.15)",
																	color: "#7b68ee",
																}}
															/>
														)}
														{!isShip && site.dailyRepairCost > 0 && (
															<Chip
																label={`Daily Repair: -${formatCurrency(site.dailyRepairCost)} ${currency}`}
																size="small"
																sx={{
																	height: 16,
																	fontSize: "0.58rem",
																	fontWeight: 700,
																	bgcolor: "rgba(248, 113, 113, 0.15)",
																	color: SEMANTIC_COLORS.neonRed,
																}}
															/>
														)}
													</Box>
													<Typography
														variant="caption"
														sx={{
															fontFamily: "monospace",
															fontSize: "0.78rem",
															color: isExcluded
																? "#f59e0b"
																: SEMANTIC_COLORS.neonGreen,
															fontWeight: 800,
														}}
													>
														{isExcluded
															? "0.00 " + currency
															: `${formatCurrency(site.totalValue)} ${currency}`}
													</Typography>
												</Box>
											);
										})()}

										{/* Level 3: Bill of Materials (BOM) Section */}
										{site.buildingBomItems &&
											site.buildingBomItems.length > 0 && (
												<Box sx={{ mb: 1 }}>
													<Box
														sx={{
															display: "flex",
															alignItems: "center",
															justifyContent: "space-between",
															mb: 0.5,
															px: 0.5,
														}}
													>
														<Chip
															label={
																isShip
																	? "Ship Chassis BOM"
																	: "Site Bill of Materials (BOM)"
															}
															size="small"
															sx={{
																height: 16,
																fontSize: "0.62rem",
																fontWeight: 800,
																bgcolor: "rgba(123, 104, 238, 0.15)",
																color: "#7b68ee",
															}}
														/>
														<Typography
															variant="caption"
															sx={{
																fontFamily: "monospace",
																fontSize: "0.72rem",
																color: "rgba(255,255,255,0.6)",
																fontWeight: 700,
															}}
														>
															{site.buildingBomItems.length} Materials |{" "}
															{isShip
																? "Chassis Valuation:"
																: "Structure BOM Valuation:"}{" "}
															{formatCurrency(site.buildingAssetValue)}{" "}
															{currency}
														</Typography>
													</Box>
													<Box
														component="table"
														sx={{
															width: "100%",
															borderCollapse: "collapse",
															textAlign: "left",
															tableLayout: "auto",
														}}
													>
														<Box component="thead">
															<Box
																component="tr"
																sx={{
																	color: "rgba(255,255,255,0.45)",
																	fontSize: "0.62rem",
																	textTransform: "uppercase",
																	borderBottom:
																		"1px solid rgba(255,255,255,0.08)",
																}}
															>
																<Box
																	component="th"
																	sx={{ padding: "4px 6px", width: "15%" }}
																>
																	Material
																</Box>
																<Box
																	component="th"
																	sx={{
																		padding: "4px 6px",
																		textAlign: "right",
																		width: "18%",
																	}}
																>
																	BOM Quantity
																</Box>
																<Box
																	component="th"
																	sx={{
																		padding: "4px 6px",
																		textAlign: "right",
																		width: "25%",
																	}}
																>
																	Unit Price ({priceSource})
																</Box>
																<Box
																	component="th"
																	sx={{
																		padding: "4px 6px",
																		textAlign: "right",
																		width: "24%",
																	}}
																>
																	BOM Asset Value
																</Box>
																<Box
																	component="th"
																	sx={{
																		padding: "4px 6px",
																		textAlign: "right",
																		width: "18%",
																	}}
																>
																	BOM Share
																</Box>
															</Box>
														</Box>
														<Box component="tbody">
															{site.buildingBomItems.map((item) => {
																const itemShare =
																	site.buildingAssetValue > 0
																		? (
																				(item.totalValue /
																					site.buildingAssetValue) *
																				100
																			).toFixed(1)
																		: "0";

																return (
																	<Box
																		component="tr"
																		key={`bom_${item.ticker}`}
																		onClick={(e) => {
																			e.stopPropagation();
																			onMaterialClick(item.ticker);
																		}}
																		className="hover-item-row"
																		sx={{
																			borderBottom:
																				"1px solid rgba(255,255,255,0.03)",
																			cursor: "pointer",
																			transition: "all 0.15s ease-in-out",
																			"&:hover": {
																				bgcolor: "rgba(123, 104, 238, 0.08)",
																			},
																		}}
																	>
																		<Box
																			component="td"
																			sx={{ padding: "3px 6px" }}
																		>
																			<MaterialBadge ticker={item.ticker} />
																		</Box>
																		<Box
																			component="td"
																			sx={{
																				padding: "3px 6px",
																				textAlign: "right",
																				fontFamily: "monospace",
																				fontSize: "0.76rem",
																				fontWeight: 700,
																				color: "white",
																			}}
																		>
																			{item.amount.toLocaleString()} u
																		</Box>
																		<Box
																			component="td"
																			sx={{
																				padding: "3px 6px",
																				textAlign: "right",
																				fontFamily: "monospace",
																				fontSize: "0.74rem",
																				color: "rgba(255,255,255,0.7)",
																			}}
																		>
																			{formatCurrency(
																				priceSource === "CORP" &&
																					item.corpPrice > 0
																					? item.corpPrice
																					: item.unitPrice,
																			)}{" "}
																			{currency}
																		</Box>
																		<Box
																			component="td"
																			sx={{
																				padding: "3px 6px",
																				textAlign: "right",
																				fontFamily: "monospace",
																				fontSize: "0.76rem",
																				fontWeight: 800,
																				color: "#4ade80",
																			}}
																		>
																			{`${formatCurrency(item.totalValue)} ${currency}`}
																		</Box>
																		<Box
																			component="td"
																			sx={{
																				padding: "3px 6px",
																				textAlign: "right",
																			}}
																		>
																			<Box
																				sx={{
																					display: "flex",
																					alignItems: "center",
																					justifyContent: "flex-end",
																					gap: 0.75,
																				}}
																			>
																				<LinearProgress
																					variant="determinate"
																					value={Math.min(
																						100,
																						Number(itemShare),
																					)}
																					sx={{
																						flex: 1,
																						minWidth: 35,
																						maxWidth: 90,
																						height: 5,
																						borderRadius: 2,
																						bgcolor: "rgba(255,255,255,0.08)",
																						"& .MuiLinearProgress-bar": {
																							bgcolor: "#7b68ee",
																						},
																					}}
																				/>
																				<Typography
																					sx={{
																						fontSize: "0.70rem",
																						fontFamily: "monospace",
																						fontWeight: 700,
																						color: "rgba(255,255,255,0.6)",
																						minWidth: 32,
																					}}
																				>
																					{itemShare}%
																				</Typography>
																			</Box>
																		</Box>
																	</Box>
																);
															})}
														</Box>
													</Box>
												</Box>
											)}

										{/* Level 3: Sub-Storages & Storage Items (Site Storage first, Site Warehouse last) */}
										{[...site.subUnits]
											.sort((a, b) => {
												if (loc.type === "SHIP") {
													const getOrder = (sub: any) => {
														const name = (sub.name || "").toUpperCase();
														const type = (sub.type || "").toUpperCase();
														if (
															name.includes("CARGO") ||
															type.includes("CARGO") ||
															type.includes("SHIP_STORE") ||
															type.includes("SHIP")
														)
															return 1;
														if (name.includes("STL") || type.includes("STL"))
															return 2;
														if (name.includes("FTL") || type.includes("FTL"))
															return 3;
														return 4;
													};
													return getOrder(a) - getOrder(b);
												}

												const aIsWh =
													a.name.toUpperCase().includes("WAREHOUSE") ||
													(a.type || "").toUpperCase().includes("WAREHOUSE");
												const bIsWh =
													b.name.toUpperCase().includes("WAREHOUSE") ||
													(b.type || "").toUpperCase().includes("WAREHOUSE");
												if (!aIsWh && bIsWh) return -1;
												if (aIsWh && !bIsWh) return 1;
												return 0;
											})
											.map((subUnit) => (
												<Box key={subUnit.id} sx={{ mb: 0.75 }}>
													<Box
														sx={{
															display: "flex",
															alignItems: "center",
															justifyContent: "space-between",
															mb: 0.5,
															px: 0.5,
														}}
													>
														<Chip
															label={subUnit.name}
															size="small"
															sx={{
																height: 16,
																fontSize: "0.62rem",
																fontWeight: 700,
																bgcolor: "rgba(123, 104, 238, 0.15)",
																color: "#7b68ee",
															}}
														/>
														<Typography
															variant="caption"
															sx={{
																fontFamily: "monospace",
																fontSize: "0.72rem",
																color: "rgba(255,255,255,0.6)",
															}}
														>
															{subUnit.itemCount} items | Sub-Total:{" "}
															{isUserToggledLeased || isOutboundLeased
																? "0.00 " + currency
																: `${formatCurrency(subUnit.totalValue)} ${currency}`}
														</Typography>
													</Box>
													<Box
														component="table"
														sx={{
															width: "100%",
															borderCollapse: "collapse",
															textAlign: "left",
															tableLayout: "auto",
														}}
													>
														<Box component="thead">
															<Box
																component="tr"
																sx={{
																	color: "rgba(255,255,255,0.45)",
																	fontSize: "0.62rem",
																	textTransform: "uppercase",
																	borderBottom:
																		"1px solid rgba(255,255,255,0.08)",
																}}
															>
																<Box
																	component="th"
																	sx={{ padding: "4px 6px", width: "15%" }}
																>
																	Material
																</Box>
																<Box
																	component="th"
																	sx={{
																		padding: "4px 6px",
																		textAlign: "right",
																		width: "18%",
																	}}
																>
																	Stock
																</Box>
																<Box
																	component="th"
																	sx={{
																		padding: "4px 6px",
																		textAlign: "right",
																		width: "25%",
																	}}
																>
																	Unit Price ({priceSource})
																</Box>
																<Box
																	component="th"
																	sx={{
																		padding: "4px 6px",
																		textAlign: "right",
																		width: "24%",
																	}}
																>
																	Total Asset Value
																</Box>
																<Box
																	component="th"
																	sx={{
																		padding: "4px 6px",
																		textAlign: "right",
																		width: "18%",
																	}}
																>
																	Storage Share
																</Box>
															</Box>
														</Box>
														<Box component="tbody">
															{subUnit.items.map((item) => {
																const itemShare =
																	subUnit.totalValue > 0
																		? (
																				(item.totalValue / subUnit.totalValue) *
																				100
																			).toFixed(1)
																		: "0";

																return (
																	<Box
																		component="tr"
																		key={item.ticker}
																		onClick={(e) => {
																			e.stopPropagation();
																			onMaterialClick(item.ticker);
																		}}
																		className="hover-item-row"
																		sx={{
																			borderBottom:
																				"1px solid rgba(255,255,255,0.03)",
																			cursor: "pointer",
																			transition: "all 0.15s ease-in-out",
																			"&:hover": {
																				bgcolor: "rgba(123, 104, 238, 0.08)",
																			},
																		}}
																	>
																		<Box
																			component="td"
																			sx={{ padding: "3px 6px" }}
																		>
																			<MaterialBadge ticker={item.ticker} />
																		</Box>
																		<Box
																			component="td"
																			sx={{
																				padding: "3px 6px",
																				textAlign: "right",
																				fontFamily: "monospace",
																				fontSize: "0.76rem",
																				fontWeight: 700,
																				color: "white",
																			}}
																		>
																			{item.amount.toLocaleString()} u
																		</Box>
																		<Box
																			component="td"
																			sx={{
																				padding: "3px 6px",
																				textAlign: "right",
																				fontFamily: "monospace",
																				fontSize: "0.74rem",
																				color: "rgba(255,255,255,0.7)",
																			}}
																		>
																			{formatCurrency(
																				priceSource === "CORP" &&
																					item.corpPrice > 0
																					? item.corpPrice
																					: item.unitPrice,
																			)}{" "}
																			{currency}
																			{priceSource === "CORP"
																				? item.unitPrice > 0 && (
																						<Typography
																							component="span"
																							sx={{
																								fontSize: "0.66rem",
																								color: "rgba(255,255,255,0.45)",
																								ml: 0.5,
																								fontWeight: 700,
																							}}
																						>
																							({formatCurrency(item.unitPrice)}{" "}
																							CX)
																						</Typography>
																					)
																				: item.corpPrice > 0 && (
																						<Typography
																							component="span"
																							sx={{
																								fontSize: "0.66rem",
																								color: "#7b68ee",
																								ml: 0.5,
																								fontWeight: 700,
																							}}
																						>
																							({formatCurrency(item.corpPrice)}{" "}
																							Corp)
																						</Typography>
																					)}
																		</Box>
																		<Box
																			component="td"
																			sx={{
																				padding: "3px 6px",
																				textAlign: "right",
																				fontFamily: "monospace",
																				fontSize: "0.76rem",
																				fontWeight: 800,
																				color: isSiteLeased
																					? "#f59e0b"
																					: "#4ade80",
																			}}
																		>
																			{`${formatCurrency(item.totalValue)} ${currency}`}
																		</Box>
																		<Box
																			component="td"
																			sx={{
																				padding: "3px 6px",
																				textAlign: "right",
																			}}
																		>
																			<Box
																				sx={{
																					display: "flex",
																					alignItems: "center",
																					justifyContent: "flex-end",
																					gap: 0.75,
																				}}
																			>
																				<LinearProgress
																					variant="determinate"
																					value={Math.min(
																						100,
																						Number(itemShare),
																					)}
																					sx={{
																						flex: 1,
																						minWidth: 35,
																						maxWidth: 90,
																						height: 5,
																						borderRadius: 2,
																						bgcolor: "rgba(255,255,255,0.08)",
																						"& .MuiLinearProgress-bar": {
																							bgcolor: "#7b68ee",
																						},
																					}}
																				/>
																				<Typography
																					sx={{
																						fontSize: "0.70rem",
																						fontFamily: "monospace",
																						fontWeight: 700,
																						color: "rgba(255,255,255,0.6)",
																						minWidth: 32,
																					}}
																				>
																					{itemShare}%
																				</Typography>
																			</Box>
																		</Box>
																	</Box>
																);
															})}
														</Box>
													</Box>
												</Box>
											))}
									</Box>
								);
							})}
						</Box>
					</Collapse>
				</Box>
			</Box>
		</React.Fragment>
	);
};

interface MobileLocationCardProps {
	loc: LocationValuation;
	currency: string;
	totalAssets: number;
	priceSource: PriceSource;
	onMaterialClick: (ticker: string) => void;
	leasedSiteIds: Record<string, boolean>;
	onToggleLeased: (id: string) => void;
}

const MobileLocationCard: React.FC<MobileLocationCardProps> = ({
	loc,
	currency,
	totalAssets,
	priceSource,
	onMaterialClick,
	leasedSiteIds,
	onToggleLeased,
}) => {
	const { userMetadata } = useGlobalData();
	const [expanded, setExpanded] = useState<boolean>(false);
	const isPlanetLeased = !!leasedSiteIds[loc.id];
	const activeValue = isPlanetLeased ? 0 : loc.totalValue;
	const locPercentOfTotal =
		totalAssets > 0 ? ((activeValue / totalAssets) * 100).toFixed(1) : "0";
	const isShip = loc.type === "SHIP";

	return (
		<Box
			sx={{
				borderRadius: "8px",
				bgcolor: expanded ? "rgba(123, 104, 238, 0.08)" : "rgba(0, 0, 0, 0.45)",
				border: `1px solid ${expanded ? "rgba(123, 104, 238, 0.4)" : "rgba(255, 255, 255, 0.08)"}`,
				p: 1.25,
				transition: "all 0.2s ease-in-out",
			}}
		>
			{/* Card Header (Clickable) */}
			<Box
				onClick={() => setExpanded(!expanded)}
				sx={{
					cursor: "pointer",
					display: "flex",
					flexDirection: "column",
					gap: 0.75,
				}}
			>
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						gap: 1,
					}}
				>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 0.75,
							flexWrap: "wrap",
							minWidth: 0,
						}}
					>
						<Chip
							icon={
								isShip ? (
									<RocketLaunchIcon sx={{ fontSize: "11px !important" }} />
								) : (
									<PublicIcon sx={{ fontSize: "11px !important" }} />
								)
							}
							label={isShip ? "SHIP" : "PLANET"}
							size="small"
							sx={{
								height: 18,
								fontSize: "0.58rem",
								fontWeight: 800,
								bgcolor: isShip
									? "rgba(123, 104, 238, 0.2)"
									: "rgba(34, 197, 94, 0.2)",
								color: isShip ? "#7b68ee" : "#22c55e",
								border: `1px solid ${isShip ? "rgba(123, 104, 238, 0.35)" : "rgba(34, 197, 94, 0.35)"}`,
							}}
						/>
						<Typography
							sx={{ fontSize: "0.85rem", fontWeight: 800, color: "white" }}
						>
							{loc.name}
						</Typography>
						{!isShip && (
							<Chip
								label={`${loc.sites?.length || 1} Sites`}
								size="small"
								sx={{
									height: 16,
									fontSize: "0.58rem",
									fontWeight: 800,
									bgcolor: "rgba(123, 104, 238, 0.15)",
									color: "#7b68ee",
								}}
							/>
						)}
					</Box>

					<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
						<Typography
							sx={{
								fontSize: "0.84rem",
								fontFamily: "monospace",
								fontWeight: 800,
								color: isPlanetLeased ? "#f59e0b" : "#4ade80",
								whiteSpace: "nowrap",
							}}
						>
							{isPlanetLeased
								? "0.00 " + currency
								: `${formatCurrency(loc.totalValue)} ${currency}`}
						</Typography>
						<IconButton
							size="small"
							sx={{
								p: 0.2,
								color: expanded ? "#7b68ee" : "rgba(255,255,255,0.7)",
							}}
						>
							{expanded ? (
								<KeyboardArrowUpIcon fontSize="small" />
							) : (
								<KeyboardArrowDownIcon fontSize="small" />
							)}
						</IconButton>
					</Box>
				</Box>

				{/* Progress & Item Summary */}
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						gap: 1,
					}}
				>
					<Typography
						sx={{
							fontSize: "0.68rem",
							color: "rgba(255,255,255,0.5)",
							fontFamily: "monospace",
						}}
					>
						{loc.itemCount} items stored
					</Typography>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<LinearProgress
							variant="determinate"
							value={Math.min(100, Number(locPercentOfTotal))}
							sx={{
								width: 50,
								height: 4,
								borderRadius: 2,
								bgcolor: "rgba(255,255,255,0.1)",
								"& .MuiLinearProgress-bar": { bgcolor: "#7b68ee" },
							}}
						/>
						<Typography
							sx={{
								fontSize: "0.72rem",
								fontFamily: "monospace",
								fontWeight: 800,
								color: "rgba(255,255,255,0.8)",
							}}
						>
							{locPercentOfTotal}% Share
						</Typography>
					</Box>
				</Box>
			</Box>

			{/* Card Body (Collapsible Expanded Details) */}
			<Collapse in={expanded} timeout="auto" unmountOnExit>
				<Box
					sx={{
						mt: 1.25,
						pt: 1,
						borderTop: "1px solid rgba(255,255,255,0.08)",
						display: "flex",
						flexDirection: "column",
						gap: 1,
					}}
				>
					{(loc.sites || []).map((site: SiteGroup) => {
						const isUserToggledLeased = !!leasedSiteIds[site.id];
						const isOutboundLeased = site.leaseType === "Outbound";
						const isSiteLeased =
							isUserToggledLeased || site.isLeased || isOutboundLeased;

						const isStationHub =
							loc.type === "STATION_WAREHOUSE" ||
							site.categoryType === "STATION_WAREHOUSE" ||
							loc.name.toUpperCase().includes("STATION");
						const isWarehouse =
							loc.type === "WAREHOUSE" || site.categoryType === "WAREHOUSE";
						const labelPrefix = isShip
							? "Fleet Vessel"
							: isStationHub
								? "Owner"
								: isWarehouse
									? "Warehouse Owner"
									: "Site";

						const userCode = (
							userMetadata?.companyCode ||
							userMetadata?.username ||
							""
						).toUpperCase();
						const isOwner =
							site.amOwner !== undefined
								? site.amOwner
								: userCode && site.ownerName.toUpperCase() === userCode;
						const isInboundLeased =
							site.leaseType === "Inbound" || (!isOwner && site.isLeased);
						const isExcluded = isUserToggledLeased || isOutboundLeased;

						const badgeLabel = isExcluded
							? `Loaned to ${site.leasedTo ? site.leasedTo.toUpperCase() : "Tenant"}`
							: isInboundLeased
								? `Leased From ${site.leasedFrom ? site.leasedFrom.toUpperCase() : site.ownerName}`
								: "Owned Base";

						return (
							<Box
								key={site.id}
								sx={{
									bgcolor: "rgba(0,0,0,0.35)",
									p: 1,
									borderRadius: "6px",
									border: `1px solid ${isSiteLeased ? "rgba(245, 158, 11, 0.3)" : "rgba(255,255,255,0.06)"}`,
								}}
							>
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										justifyContent: "space-between",
										mb: 0.75,
										pb: 0.5,
										borderBottom: "1px solid rgba(255,255,255,0.06)",
										flexWrap: "wrap",
										gap: 0.5,
									}}
								>
									<Typography
										sx={{
											fontSize: "0.78rem",
											fontWeight: 800,
											color: "white",
										}}
									>
										{isShip ? loc.name : `${labelPrefix}: ${site.ownerName}`}
									</Typography>
									{!isShip && !isStationHub && !isWarehouse && (
										<Chip
											label={badgeLabel}
											size="small"
											onClick={() => onToggleLeased(site.id)}
											sx={{
												height: 16,
												fontSize: "0.55rem",
												fontWeight: 800,
												cursor: "pointer",
												bgcolor: isExcluded
													? "rgba(245, 158, 11, 0.2)"
													: isInboundLeased
														? "rgba(96, 165, 250, 0.2)"
														: "rgba(74, 222, 128, 0.15)",
												color: isExcluded
													? "#f59e0b"
													: isInboundLeased
														? "#60a5fa"
														: SEMANTIC_COLORS.neonGreen,
											}}
										/>
									)}
									{site.buildingAssetValue > 0 && (
										<Chip
											label={
												isShip
													? `Chassis: ${formatCurrency(site.buildingAssetValue)} ${currency}`
													: `Bldg: ${formatCurrency(site.buildingAssetValue)} ${currency}`
											}
											size="small"
											sx={{
												height: 16,
												fontSize: "0.55rem",
												fontWeight: 700,
												bgcolor: "rgba(123, 104, 238, 0.15)",
												color: "#7b68ee",
											}}
										/>
									)}
								</Box>

								{/* BOM Section */}
								{site.buildingBomItems && site.buildingBomItems.length > 0 && (
									<Box sx={{ mb: 1 }}>
										<Typography
											variant="caption"
											sx={{
												display: "block",
												mb: 0.5,
												fontSize: "0.65rem",
												fontWeight: 800,
												color: "#7b68ee",
											}}
										>
											{isShip ? "Ship Chassis BOM" : "Structure BOM"} (
											{site.buildingBomItems.length} items)
										</Typography>
										<Box
											sx={{
												display: "flex",
												flexDirection: "column",
												gap: 0.75,
											}}
										>
											{site.buildingBomItems.map((item) => {
												const itemShare =
													site.buildingAssetValue > 0
														? (
																(item.totalValue / site.buildingAssetValue) *
																100
															).toFixed(1)
														: "0";
												const effectiveUnitPrice =
													priceSource === "CORP" && item.corpPrice > 0
														? item.corpPrice
														: item.unitPrice;

												return (
													<Box
														key={item.ticker}
														onClick={() => onMaterialClick(item.ticker)}
														sx={{
															display: "flex",
															flexDirection: "column",
															gap: 0.5,
															bgcolor: "rgba(255,255,255,0.03)",
															p: 0.75,
															borderRadius: "6px",
															border: "1px solid rgba(255,255,255,0.05)",
															cursor: "pointer",
															"&:hover": {
																bgcolor: "rgba(123, 104, 238, 0.1)",
															},
														}}
													>
														{/* Row 1: Material Badge & BOM Quantity + Total Value */}
														<Box
															sx={{
																display: "flex",
																alignItems: "center",
																justifyContent: "space-between",
																gap: 1,
															}}
														>
															<Box
																sx={{
																	display: "flex",
																	alignItems: "center",
																	gap: 0.75,
																}}
															>
																<MaterialBadge ticker={item.ticker} />
																<Typography
																	sx={{
																		fontSize: "0.76rem",
																		color: "white",
																		fontFamily: "monospace",
																		fontWeight: 700,
																	}}
																>
																	{item.amount.toLocaleString()} u
																</Typography>
															</Box>
															<Typography
																sx={{
																	fontSize: "0.78rem",
																	color: SEMANTIC_COLORS.neonGreen,
																	fontFamily: "monospace",
																	fontWeight: 800,
																}}
															>
																{formatCurrency(item.totalValue)} {currency}
															</Typography>
														</Box>

														{/* Row 2: Unit Price & BOM Share Progress Bar */}
														<Box
															sx={{
																display: "flex",
																alignItems: "center",
																justifyContent: "space-between",
																gap: 1,
																pt: 0.25,
																borderTop: "1px dashed rgba(255,255,255,0.06)",
															}}
														>
															<Typography
																sx={{
																	fontSize: "0.66rem",
																	color: "rgba(255,255,255,0.6)",
																	fontFamily: "monospace",
																}}
															>
																Unit Price: {formatCurrency(effectiveUnitPrice)}{" "}
																{currency}
															</Typography>

															<Box
																sx={{
																	display: "flex",
																	alignItems: "center",
																	gap: 0.75,
																}}
															>
																<LinearProgress
																	variant="determinate"
																	value={Math.min(100, Number(itemShare))}
																	sx={{
																		width: 45,
																		height: 4,
																		borderRadius: 2,
																		bgcolor: "rgba(255,255,255,0.08)",
																		"& .MuiLinearProgress-bar": {
																			bgcolor: "#7b68ee",
																		},
																	}}
																/>
																<Typography
																	sx={{
																		fontSize: "0.65rem",
																		fontFamily: "monospace",
																		fontWeight: 700,
																		color: "rgba(255,255,255,0.6)",
																	}}
																>
																	{itemShare}%
																</Typography>
															</Box>
														</Box>
													</Box>
												);
											})}
										</Box>
									</Box>
								)}

								{/* Sub Storages */}
								{[...site.subUnits]
									.sort((a, b) => {
										if (loc.type === "SHIP") {
											const getOrder = (sub: any) => {
												const name = (sub.name || "").toUpperCase();
												const type = (sub.type || "").toUpperCase();
												if (
													name.includes("CARGO") ||
													type.includes("CARGO") ||
													type.includes("SHIP_STORE")
												)
													return 1;
												if (name.includes("STL") || type.includes("STL"))
													return 2;
												if (name.includes("FTL") || type.includes("FTL"))
													return 3;
												return 4;
											};
											return getOrder(a) - getOrder(b);
										}
										const aIsWh =
											a.name.toUpperCase().includes("WAREHOUSE") ||
											(a.type || "").toUpperCase().includes("WAREHOUSE");
										const bIsWh =
											b.name.toUpperCase().includes("WAREHOUSE") ||
											(b.type || "").toUpperCase().includes("WAREHOUSE");
										if (!aIsWh && bIsWh) return -1;
										if (aIsWh && !bIsWh) return 1;
										return 0;
									})
									.map((subUnit) => (
										<Box key={subUnit.id} sx={{ mt: 0.75 }}>
											<Box
												sx={{
													display: "flex",
													alignItems: "center",
													justifyContent: "space-between",
													mb: 0.5,
												}}
											>
												<Chip
													label={subUnit.name}
													size="small"
													sx={{
														height: 16,
														fontSize: "0.58rem",
														fontWeight: 700,
														bgcolor: "rgba(123, 104, 238, 0.15)",
														color: "#7b68ee",
													}}
												/>
												<Typography
													variant="caption"
													sx={{
														fontFamily: "monospace",
														fontSize: "0.68rem",
														color: "rgba(255,255,255,0.6)",
													}}
												>
													Sub-Total: {formatCurrency(subUnit.totalValue)}{" "}
													{currency}
												</Typography>
											</Box>
											<Box
												sx={{
													display: "flex",
													flexDirection: "column",
													gap: 0.75,
												}}
											>
												{subUnit.items.map((item) => {
													const itemShare =
														subUnit.totalValue > 0
															? (
																	(item.totalValue / subUnit.totalValue) *
																	100
																).toFixed(1)
															: "0";
													const effectiveUnitPrice =
														priceSource === "CORP" && item.corpPrice > 0
															? item.corpPrice
															: item.unitPrice;

													return (
														<Box
															key={item.ticker}
															onClick={() => onMaterialClick(item.ticker)}
															sx={{
																display: "flex",
																flexDirection: "column",
																gap: 0.5,
																bgcolor: "rgba(255,255,255,0.03)",
																p: 0.75,
																borderRadius: "6px",
																border: "1px solid rgba(255,255,255,0.05)",
																cursor: "pointer",
																"&:hover": {
																	bgcolor: "rgba(123, 104, 238, 0.1)",
																},
															}}
														>
															{/* Row 1: Material Badge & Stock Quantity + Total Value */}
															<Box
																sx={{
																	display: "flex",
																	alignItems: "center",
																	justifyContent: "space-between",
																	gap: 1,
																}}
															>
																<Box
																	sx={{
																		display: "flex",
																		alignItems: "center",
																		gap: 0.75,
																	}}
																>
																	<MaterialBadge ticker={item.ticker} />
																	<Typography
																		sx={{
																			fontSize: "0.76rem",
																			color: "white",
																			fontFamily: "monospace",
																			fontWeight: 700,
																		}}
																	>
																		{item.amount.toLocaleString()} u
																	</Typography>
																</Box>
																<Typography
																	sx={{
																		fontSize: "0.78rem",
																		color: SEMANTIC_COLORS.neonGreen,
																		fontFamily: "monospace",
																		fontWeight: 800,
																	}}
																>
																	{formatCurrency(item.totalValue)} {currency}
																</Typography>
															</Box>

															{/* Row 2: Unit Price & Storage Share Progress Bar */}
															<Box
																sx={{
																	display: "flex",
																	alignItems: "center",
																	justifyContent: "space-between",
																	gap: 1,
																	pt: 0.25,
																	borderTop:
																		"1px dashed rgba(255,255,255,0.06)",
																}}
															>
																<Typography
																	sx={{
																		fontSize: "0.66rem",
																		color: "rgba(255,255,255,0.6)",
																		fontFamily: "monospace",
																	}}
																>
																	Unit Price:{" "}
																	{formatCurrency(effectiveUnitPrice)}{" "}
																	{currency}
																</Typography>

																<Box
																	sx={{
																		display: "flex",
																		alignItems: "center",
																		gap: 0.75,
																	}}
																>
																	<LinearProgress
																		variant="determinate"
																		value={Math.min(100, Number(itemShare))}
																		sx={{
																			width: 45,
																			height: 4,
																			borderRadius: 2,
																			bgcolor: "rgba(255,255,255,0.08)",
																			"& .MuiLinearProgress-bar": {
																				bgcolor: "#7b68ee",
																			},
																		}}
																	/>
																	<Typography
																		sx={{
																			fontSize: "0.65rem",
																			fontFamily: "monospace",
																			fontWeight: 700,
																			color: "rgba(255,255,255,0.6)",
																		}}
																	>
																		{itemShare}%
																	</Typography>
																</Box>
															</Box>
														</Box>
													);
												})}
											</Box>
										</Box>
									))}
							</Box>
						);
					})}
				</Box>
			</Collapse>
		</Box>
	);
};

/* Main BalanceSheetTabComponent */
const BalanceSheetTabComponent: React.FC<BalanceSheetTabProps> = ({
	locationValuations,
	currency,
	currentData,
	priceSource = "MARKET",
}) => {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedMaterialTicker, setSelectedMaterialTicker] = useState<
		string | null
	>(null);

	const [leasedSiteIds, setLeasedSiteIds] = useState<Record<string, boolean>>(
		() => {
			try {
				const saved = localStorage.getItem("financial_leased_sites");
				return saved ? JSON.parse(saved) : {};
			} catch {
				return {};
			}
		},
	);

	const toggleLeasedSite = (id: string) => {
		setLeasedSiteIds((prev) => {
			const updated = { ...prev, [id]: !prev[id] };
			try {
				localStorage.setItem("financial_leased_sites", JSON.stringify(updated));
			} catch (e) {
				console.error(e);
			}
			return updated;
		});
	};

	const totalAssets = currentData?.TotalAssets || 0;

	const isMobile = useMediaQuery("(max-width:670px)");

	const [categoryFilter, setCategoryFilter] = useState<
		"ALL" | "SITES" | "SHIPS"
	>("ALL");

	const filteredLocations = locationValuations.filter((loc) => {
		if (categoryFilter === "SITES" && loc.type === "SHIP") return false;
		if (categoryFilter === "SHIPS" && loc.type !== "SHIP") return false;
		if (!searchTerm) return true;
		const query = searchTerm.toLowerCase();
		const nameMatch = loc.name.toLowerCase().includes(query);
		const itemMatch = loc.items.some((i) =>
			i.ticker.toLowerCase().includes(query),
		);
		return nameMatch || itemMatch;
	});

	return (
		<FlexCard
			sx={{ height: "100%", p: 1.25, display: "flex", flexDirection: "column" }}
		>
			<style>{`
				.hover-row:hover {
					background-color: rgba(123, 104, 238, 0.22) !important;
					box-shadow: inset 0 0 15px rgba(123, 104, 238, 0.25);
				}
				.hover-item-row:hover {
					background-color: rgba(123, 104, 238, 0.18) !important;
					box-shadow: inset 0 0 12px rgba(123, 104, 238, 0.22);
				}
			`}</style>

			{/* Filter Controls Row */}
			<Box
				sx={{
					pb: 1,
					borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
					display: "flex",
					flexDirection: { xs: "column", sm: "row" },
					justifyContent: "space-between",
					alignItems: { xs: "stretch", sm: "center" },
					gap: 1,
				}}
			>
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						gap: 1,
						flexWrap: "wrap",
					}}
				>
					<Chip
						label={`${filteredLocations.length} Locations`}
						size="small"
						sx={{
							height: 20,
							fontSize: "0.65rem",
							fontWeight: 800,
							bgcolor: "rgba(123, 104, 238, 0.2)",
							color: "#7b68ee",
							flexShrink: 0,
						}}
					/>

					<ButtonGroup
						size="small"
						variant="outlined"
						sx={{ borderColor: "rgba(123, 104, 238, 0.3)" }}
					>
						<Button
							onClick={() => setCategoryFilter("ALL")}
							sx={{
								fontSize: "0.62rem",
								fontWeight: 800,
								py: 0.2,
								px: 1,
								bgcolor: categoryFilter === "ALL" ? "#7b68ee" : "transparent",
								color:
									categoryFilter === "ALL" ? "white" : "rgba(255,255,255,0.6)",
							}}
						>
							ALL
						</Button>
						<Button
							onClick={() => setCategoryFilter("SITES")}
							sx={{
								fontSize: "0.62rem",
								fontWeight: 800,
								py: 0.2,
								px: 1,
								bgcolor: categoryFilter === "SITES" ? "#7b68ee" : "transparent",
								color:
									categoryFilter === "SITES"
										? "white"
										: "rgba(255,255,255,0.6)",
							}}
						>
							PLANET SITES
						</Button>
						<Button
							onClick={() => setCategoryFilter("SHIPS")}
							sx={{
								fontSize: "0.62rem",
								fontWeight: 800,
								py: 0.2,
								px: 1,
								bgcolor: categoryFilter === "SHIPS" ? "#7b68ee" : "transparent",
								color:
									categoryFilter === "SHIPS"
										? "white"
										: "rgba(255,255,255,0.6)",
							}}
						>
							SHIPS
						</Button>
					</ButtonGroup>
				</Box>

				<TextField
					size="small"
					placeholder="Search location/material..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					sx={{
						width: { xs: "100%", sm: 220 },
						"& .MuiOutlinedInput-root": {
							bgcolor: "rgba(0, 0, 0, 0.5)",
							borderRadius: "6px",
							color: "white",
							fontSize: "0.74rem",
							py: 0,
							"& fieldset": { borderColor: "rgba(123, 104, 238, 0.3)" },
							"&:hover fieldset": { borderColor: "rgba(123, 104, 238, 0.7)" },
						},
						"& .MuiInputBase-input": { py: 0.25, px: 1 },
					}}
					slotProps={{
						input: {
							startAdornment: (
								<InputAdornment position="start">
									<SearchIcon
										sx={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}
									/>
								</InputAdornment>
							),
						},
					}}
				/>
			</Box>

			{/* Main Content: Mobile Cards or Desktop Table */}
			<Box
				sx={{
					flex: 1,
					overflowY: "auto",
					overflowX: isMobile ? "hidden" : "auto",
					mt: 1,
					"&::-webkit-scrollbar": { width: "4px", height: "4px" },
					"&::-webkit-scrollbar-thumb": {
						backgroundColor: "rgba(255,255,255,0.1)",
						borderRadius: "4px",
					},
				}}
			>
				{isMobile ? (
					<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
						{filteredLocations.map((loc) => (
							<MobileLocationCard
								key={loc.id}
								loc={loc}
								currency={currency}
								totalAssets={totalAssets}
								priceSource={priceSource}
								onMaterialClick={(ticker) => setSelectedMaterialTicker(ticker)}
								leasedSiteIds={leasedSiteIds}
								onToggleLeased={toggleLeasedSite}
							/>
						))}
					</Box>
				) : (
					<Box
						component="table"
						sx={{
							width: "100%",
							borderCollapse: "collapse",
							textAlign: "left",
							tableLayout: "auto",
						}}
					>
						<Box component="thead">
							<Box
								component="tr"
								sx={{
									color: "rgba(255,255,255,0.4)",
									fontSize: "0.62rem",
									textTransform: "uppercase",
									borderBottom: "1px solid rgba(255,255,255,0.06)",
								}}
							>
								<Box
									component="th"
									sx={{ padding: "6px 8px", width: "32px" }}
								/>
								<Box component="th" sx={{ padding: "6px 8px", width: "40%" }}>
									Location
								</Box>
								<Box
									component="th"
									sx={{ padding: "6px 8px", textAlign: "right", width: "35%" }}
								>
									Active Valuation ({priceSource})
								</Box>
								<Box
									component="th"
									sx={{ padding: "6px 8px", textAlign: "right", width: "25%" }}
								>
									Asset Share
								</Box>
							</Box>
						</Box>
						<Box component="tbody">
							{filteredLocations.map((loc) => (
								<LocationAuditRow
									key={loc.id}
									loc={loc}
									currency={currency}
									totalAssets={totalAssets}
									priceSource={priceSource}
									onMaterialClick={(ticker) =>
										setSelectedMaterialTicker(ticker)
									}
									leasedSiteIds={leasedSiteIds}
									onToggleLeased={toggleLeasedSite}
								/>
							))}
						</Box>
					</Box>
				)}
			</Box>

			{/* Interactive Material Market Modal */}
			{selectedMaterialTicker && (
				<MaterialMarketModal
					ticker={selectedMaterialTicker}
					onClose={() => setSelectedMaterialTicker(null)}
					currency={""}
				/>
			)}
		</FlexCard>
	);
};

export const BalanceSheetTab = React.memo(BalanceSheetTabComponent);
