import React, {
	useState,
	useEffect,
	useCallback,
	useTransition,
	useMemo,
} from "react";
import {
	Box,
	TextField,
	InputAdornment,
	Stack,
	Tooltip,
	IconButton,
	ToggleButtonGroup,
	ToggleButton,
	Collapse,
	Paper,
	Table,
	TableHead,
	TableRow,
	TableCell,
	TableBody,
	alpha,
	useTheme,
	type Theme,
	TableContainer,
	CircularProgress,
	FormControl,
	Select,
	MenuItem,
	type SelectChangeEvent,
	OutlinedInput,
	Checkbox,
	ListItemText,
	ListSubheader,
	Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";
import FilterListIcon from "@mui/icons-material/FilterList";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import ViewListIcon from "@mui/icons-material/ViewList";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import CloseIcon from "@mui/icons-material/Close";
import { TableVirtuoso } from "react-virtuoso";

import type {
	ProductionSummaryItem,
	CorpMember,
	CustomCategory,
} from "./types";
import { ALL_CATEGORIES, getCategory } from "./production/constants";
import { CategoryCard } from "./production/categorycard";
import { CategoryHeaderRow } from "./production/categoryheaderrow";
import { CompactProductionRow } from "./production/compactproductionrow";

interface Props {
	productionSummary: ProductionSummaryItem[];
	members?: CorpMember[];
	isLoading?: boolean;
	hideZeroFlow?: boolean;
	onHideZeroFlowChange?: (val: boolean) => void;
}

const MemberFilterSelect = React.memo(
	({
		members,
		selectedMembers,
		onChange,
		theme,
	}: {
		members: CorpMember[];
		selectedMembers: string[];
		onChange: (vals: string[]) => void;
		theme: Theme;
	}) => {
		const [searchText, setSearchText] = useState("");

		const handleMemberChange = (event: SelectChangeEvent<string[]>) => {
			const {
				target: { value },
			} = event;
			onChange(typeof value === "string" ? value.split(",") : value);
		};

		const filteredOptions = useMemo(() => {
			const list = members || [];
			if (!searchText) return list;
			const lower = searchText.toLowerCase();
			return list.filter(
				(m) =>
					(m.companyName || "").toLowerCase().includes(lower) ||
					(m.companyCode || "").toLowerCase().includes(lower),
			);
		}, [members, searchText]);

		const glassyInputStyle = {
			backgroundColor: alpha(theme.palette.background.default, 0.4),
			backdropFilter: "blur(12px)",
			WebkitBackdropFilter: "blur(12px)",
			border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
			boxShadow: "none",
			borderRadius: 1,
			height: 40,
			fontSize: "0.85rem",
		};

		const MenuProps = {
			PaperProps: {
				sx: {
					maxHeight: 400,
					width: 280,
					bgcolor: alpha(theme.palette.background.default, 0.8),
					backdropFilter: "blur(16px)",
					WebkitBackdropFilter: "blur(16px)",
					border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
					boxShadow: theme.shadows[8],
					"& .MuiList-root": { pt: 0 },
				},
			},
			autoFocus: false,
		};

		return (
			<FormControl size="small" sx={{ minWidth: 200, flexShrink: 0 }}>
				<Select
					multiple
					displayEmpty
					value={selectedMembers}
					onChange={handleMemberChange}
					input={<OutlinedInput sx={glassyInputStyle} />}
					onClose={() => setSearchText("")}
					MenuProps={MenuProps}
					renderValue={(selected) => {
						if (selected.length === 0) {
							return (
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										gap: 1,
										color: "text.secondary",
									}}
								>
									<PersonSearchIcon fontSize="small" />
									All Members
								</Box>
							);
						}
						return (
							<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
								<PersonSearchIcon fontSize="small" color="primary" />
								<Typography variant="caption" sx={{ fontWeight: "bold" }}>
									{selected.length} Selected
								</Typography>
							</Box>
						);
					}}
				>
					<ListSubheader sx={{ bgcolor: "transparent", p: 1 }}>
						<TextField
							size="small"
							autoFocus
							placeholder="Search Member..."
							fullWidth
							value={searchText}
							onChange={(e) => setSearchText(e.target.value)}
							onKeyDown={(e) => e.stopPropagation()}
							slotProps={{
								input: {
									startAdornment: (
										<InputAdornment position="start">
											<SearchIcon fontSize="small" />
										</InputAdornment>
									),
									sx: {
										fontSize: "0.85rem",
										bgcolor: alpha(theme.palette.background.default, 0.6),
									},
								},
							}}
						/>
					</ListSubheader>

					<MenuItem disabled value="">
						<Typography
							variant="caption"
							sx={{ fontWeight: "bold", color: "text.secondary" }}
						>
							Select Members to Filter
						</Typography>
					</MenuItem>

					{filteredOptions.length > 0 ? (
						filteredOptions.map((member) => (
							<MenuItem
								key={member.companyCode}
								value={member.companyCode || ""}
							>
								<Checkbox
									checked={
										selectedMembers.indexOf(member.companyCode || "") > -1
									}
									size="small"
								/>
								<ListItemText
									primary={member.companyName}
									secondary={member.companyCode}
									slotProps={{
										primary: {
											fontSize: "0.85rem",
											fontWeight: 600,
										},
										secondary: { fontSize: "0.7rem" },
									}}
								/>
							</MenuItem>
						))
					) : (
						<MenuItem disabled>
							<Typography
								variant="caption"
								sx={{ fontStyle: "italic", color: "text.secondary" }}
							>
								No matches found
							</Typography>
						</MenuItem>
					)}
				</Select>
			</FormControl>
		);
	},
);

export const CorpProductionView = React.memo(
	({
		productionSummary,
		members,
		isLoading = false,
		hideZeroFlow = false,
		onHideZeroFlowChange,
	}: Props) => {
		const theme = useTheme();
		const isMobile = false;
		const [isPending, startTransition] = useTransition();

		const [inputValue, setInputValue] = useState("");
		const [searchTerm, setSearchTerm] = useState("");
		const [exactMatch, setExactMatch] = useState(false);

		const [selectedCategories, setSelectedCategories] = useState<string[]>([
			"ALL",
		]);
		const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

		const [customCategories, setCustomCategories] = useState<CustomCategory[]>(
			[],
		);
		const [filterOpen, setFilterOpen] = useState(false);
		const [layoutMode, setLayoutMode] = useState<"masonry" | "list">(
			() =>
				(localStorage.getItem("corpProductionLayout") as "masonry" | "list") ||
				"masonry",
		);

		const [isProcessing, setIsProcessing] = useState(false);
		const [processedList, setProcessedList] = useState<
			Array<{
				type: "header" | "row";
				data:
					| ProductionSummaryItem
					| {
							category: string;
							count: number;
							id?: string;
							isDrilldown?: boolean;
					  };
				drillType?: "prod" | "cons";
				isDrilldown?: boolean;
			}>
		>([]);
		const [processedGroups, setProcessedGroups] = useState<
			Record<string, ProductionSummaryItem[]>
		>({});
		const [processedSortedCats, setProcessedSortedCats] = useState<string[]>(
			[],
		);

		useEffect(() => {
			const handler = setTimeout(() => {
				startTransition(() => {
					setSearchTerm(inputValue);
				});
			}, 300);
			return () => clearTimeout(handler);
		}, [inputValue]);

		const handleLayoutChange = (
			event: React.MouseEvent<HTMLElement>,
			newAlignment: "masonry" | "list" | null,
		) => {
			if (newAlignment !== null) {
				startTransition(() => {
					setLayoutMode(newAlignment);
				});
				localStorage.setItem("corpProductionLayout", newAlignment);
			}
		};

		const toggleCategory = useCallback((cat: string) => {
			setSelectedCategories((prev) => {
				if (cat === "ALL") return ["ALL"];
				let newCats = prev.includes("ALL") ? [] : [...prev];
				if (newCats.includes(cat)) {
					newCats = newCats.filter((c) => c !== cat);
				} else {
					newCats.push(cat);
				}
				return newCats.length === 0 ? ["ALL"] : newCats;
			});
		}, []);

		const hideCategory = useCallback((cat: string) => {
			if (cat.startsWith("drill-")) {
				setCustomCategories((prev) => prev.filter((c) => c.id !== cat));
				return;
			}
			setSelectedCategories((prev) => {
				if (prev.includes("ALL")) {
					return ALL_CATEGORIES.filter((c) => c !== cat);
				}
				const newCats = prev.filter((c) => c !== cat);
				return newCats.length === 0 ? ["ALL"] : newCats;
			});
		}, []);

		const handleDrilldown = useCallback(
			(item: ProductionSummaryItem, type: "prod" | "cons") => {
				setCustomCategories((prev) => {
					const categoryId = `drill-${item.ticker}-${type}`;
					const existingIndex = prev.findIndex((c) => c.id === categoryId);
					const updatedCat: CustomCategory = {
						id: categoryId,
						title: `${item.ticker} (${type === "prod" ? "Producers" : "Consumers"})`,
						items: [item],
						isDrilldown: true,
						drillType: type,
					};

					if (existingIndex >= 0) {
						// Move existing drilldown category to top and update item data
						const newCats = [...prev];
						newCats.splice(existingIndex, 1);
						return [updatedCat, ...newCats];
					}

					return [updatedCat, ...prev];
				});
			},
			[],
		);

		useEffect(() => {
			if (isLoading) return;

			// eslint-disable-next-line react-hooks/set-state-in-effect
			setIsProcessing(true);
			const timer = setTimeout(() => {
				let filtered = productionSummary;

				// 0. Filter by hideZeroFlow
				if (hideZeroFlow) {
					filtered = filtered.filter(
						(row) =>
							(row.productionTotal || 0) > 0 || (row.consumptionTotal || 0) > 0,
					);
				}

				// 1. Filter by selected members and recalculate totals/nets
				if (selectedMembers.length > 0) {
					filtered = filtered
						.map((row) => {
							const filteredProducers = row.producers.filter((p) =>
								selectedMembers.includes(p.player),
							);
							const filteredConsumers = row.consumers.filter((c) =>
								selectedMembers.includes(c.player),
							);

							if (
								filteredProducers.length === 0 &&
								filteredConsumers.length === 0
							)
								return null;

							const pTotal = filteredProducers.reduce(
								(acc, curr) => acc + curr.amount,
								0,
							);
							const cTotal = filteredConsumers.reduce(
								(acc, curr) => acc + curr.amount,
								0,
							);

							return {
								...row,
								producers: filteredProducers,
								consumers: filteredConsumers,
								productionTotal: pTotal,
								productionAccurate: filteredProducers
									.filter((x) => x.isAccurate)
									.reduce((s, x) => s + x.amount, 0),
								productionEstimated: filteredProducers
									.filter((x) => !x.isAccurate)
									.reduce((s, x) => s + x.amount, 0),
								consumptionTotal: cTotal,
								consumptionAccurate: filteredConsumers
									.filter((x) => x.isAccurate)
									.reduce((s, x) => s + x.amount, 0),
								consumptionEstimated: filteredConsumers
									.filter((x) => !x.isAccurate)
									.reduce((s, x) => s + x.amount, 0),
								net: pTotal - cTotal,
							};
						})
						.filter((item): item is ProductionSummaryItem => item !== null);
				}

				// 2. Filter by search term (ticker name)
				const terms = searchTerm
					.toLowerCase()
					.split(/[, ]+/)
					.map((t) => t.trim())
					.filter((t) => t);

				if (terms.length > 0) {
					filtered = filtered.filter((row) => {
						const tickerLower = row.ticker.toLowerCase();
						if (exactMatch) {
							return terms.some((t) => tickerLower === t);
						}
						return terms.some((t) => tickerLower.includes(t));
					});
				}

				// 3. Filter by selected categories
				const catFiltered = filtered.filter((row) => {
					if (selectedCategories.includes("ALL")) return true;
					const cat = getCategory(row.ticker);
					return selectedCategories.includes(cat);
				});

				// 4. Group results by category for display
				const groups: Record<string, ProductionSummaryItem[]> = {};
				catFiltered.forEach((row) => {
					const cat = getCategory(row.ticker);
					if (!groups[cat]) groups[cat] = [];
					groups[cat].push(row);
				});

				const sortedCats = Object.keys(groups).sort();
				Object.keys(groups).forEach((key) => {
					groups[key].sort((a, b) => a.ticker.localeCompare(b.ticker));
				});

				// 5. Flatten structure for virtualized list view, injecting category headers
				const list: Array<{
					type: "header" | "row";
					data:
						| ProductionSummaryItem
						| {
								category: string;
								count: number;
								id?: string;
								isDrilldown?: boolean;
						  };
					drillType?: "prod" | "cons";
					isDrilldown?: boolean;
				}> = [];

				customCategories.forEach((cat) => {
					list.push({
						type: "header",
						data: {
							category: cat.title,
							count: cat.items.length,
							id: cat.id,
							isDrilldown: true,
						},
						isDrilldown: true,
					});
					cat.items.forEach((item) => {
						list.push({
							type: "row",
							data: item,
							drillType: cat.drillType,
							isDrilldown: true,
						});
					});
				});

				sortedCats.forEach((cat) => {
					list.push({
						type: "header",
						data: { category: cat, count: groups[cat].length },
					});
					groups[cat].forEach((item) => {
						list.push({ type: "row", data: item });
					});
				});

				setProcessedGroups(groups);
				setProcessedSortedCats(sortedCats);
				setProcessedList(list);
				setIsProcessing(false);
			}, 50);

			return () => clearTimeout(timer);
		}, [
			productionSummary,
			searchTerm,
			exactMatch,
			selectedCategories,
			customCategories,
			selectedMembers,
			isLoading,
			hideZeroFlow,
		]);

		const glassyStyle = {
			backgroundColor: "#06060e",
			backdropFilter: "blur(16px)",
			WebkitBackdropFilter: "blur(16px)",
			border: "1px solid rgba(123, 104, 238, 0.2)",
			boxShadow: "0 12px 32px rgba(0, 0, 0, 0.6)",
		};

		return (
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					flexGrow: 1,
					minHeight: 0,
					p: 0,
					gap: 1.5,
					height: "100%",
				}}
			>
				{/* TOOLBAR */}
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						gap: 1,
						px: isMobile ? 1 : 0,
						flexShrink: 0,
					}}
				>
					{/* Single Compact Top Search Bar */}
					<Box
						sx={{
							display: "flex",
							flexDirection: "row",
							gap: 1,
							alignItems: "center",
							width: "100%",
							flexShrink: 0,
						}}
					>
						<TextField
							placeholder="Search Ticker (e.g. C, CAF)..."
							disabled={isLoading}
							variant="outlined"
							size="small"
							value={inputValue}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
								setInputValue(e.target.value)
							}
							sx={{
								flexGrow: 1,
								"& .MuiOutlinedInput-root": { pr: 0.5 },
							}}
							slotProps={{
								input: {
									startAdornment: (
										<InputAdornment position="start">
											<SearchIcon fontSize="small" />
										</InputAdornment>
									),
									endAdornment: (
										<InputAdornment position="end">
											<Stack
												sx={{
													flexDirection: "row",
													alignItems: "center",
													gap: 0.5,
												}}
											>
												<Tooltip
													title={
														exactMatch ? "Exact Match: ON" : "Exact Match: OFF"
													}
												>
													<IconButton
														onClick={() => setExactMatch(!exactMatch)}
														sx={{
															p: 0.5,
															color: exactMatch
																? "primary.main"
																: "text.secondary",
															bgcolor: exactMatch
																? alpha(theme.palette.primary.main, 0.15)
																: "transparent",
															borderRadius: 1,
															"&:hover": {
																bgcolor: alpha(
																	theme.palette.primary.main,
																	0.25,
																),
															},
														}}
													>
														<CenterFocusStrongIcon fontSize="small" />
													</IconButton>
												</Tooltip>
												<Box
													sx={{
														width: "1px",
														height: 20,
														bgcolor: alpha(theme.palette.divider, 0.3),
													}}
												/>
												<Tooltip title="Toggle Filters Drawer">
													<IconButton
														onClick={() => setFilterOpen(!filterOpen)}
														sx={{
															p: 0.5,
															color:
																filterOpen ||
																!selectedCategories.includes("ALL") ||
																selectedMembers.length > 0
																	? "primary.main"
																	: "text.secondary",
															bgcolor: filterOpen
																? alpha(theme.palette.primary.main, 0.15)
																: "transparent",
															borderRadius: 1,
															"&:hover": {
																bgcolor: alpha(
																	theme.palette.primary.main,
																	0.25,
																),
															},
														}}
													>
														<FilterListIcon fontSize="small" />
													</IconButton>
												</Tooltip>
											</Stack>
										</InputAdornment>
									),
									sx: {
										...glassyStyle,
										borderRadius: 1,
										fontSize: "0.85rem",
										height: 36,
									},
								} as any,
							}}
						/>
					</Box>

					{/* FLOATING ABSOLUTE FILTER CONTROLS OVERLAY DRAWER */}
					<Collapse in={filterOpen} sx={{ position: "relative", zIndex: 200 }}>
						<Paper
							elevation={12}
							sx={{
								...glassyStyle,
								position: "absolute",
								top: 4,
								left: 0,
								right: 0,
								zIndex: 200,
								maxHeight: "65vh",
								overflowY: "auto",
								p: 1.5,
								borderRadius: 2,
								border: "1px solid rgba(100, 255, 218, 0.3)",
								boxShadow: "0 12px 36px rgba(0, 0, 0, 0.8)",
								display: "flex",
								flexDirection: "column",
								gap: 1.25,
								bgcolor: "#141424",
							}}
						>
							{/* Filter Drawer Title Bar */}
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
									pb: 0.5,
									borderBottom: "1px solid rgba(255,255,255,0.08)",
								}}
							>
								<Typography
									variant="caption"
									sx={{
										fontWeight: 800,
										color: "#64FFDA",
										textTransform: "uppercase",
										letterSpacing: "0.04em",
									}}
								>
									FILTER & VIEW OPTIONS
								</Typography>
								<IconButton
									size="small"
									onClick={() => setFilterOpen(false)}
									sx={{ color: "rgba(255,255,255,0.6)", p: 0.25 }}
								>
									<CloseIcon fontSize="small" />
								</IconButton>
							</Box>

							{/* Filter Controls Row */}
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 1,
									flexWrap: "wrap",
									justifyContent: "space-between",
								}}
							>
								<MemberFilterSelect
									members={members || []}
									selectedMembers={selectedMembers}
									onChange={setSelectedMembers}
									theme={theme}
								/>

								<Stack direction="row" spacing={1} alignItems="center">
									{onHideZeroFlowChange && (
										<ToggleButton
											size="small"
											value="hideZero"
											selected={hideZeroFlow}
											onChange={() => onHideZeroFlowChange(!hideZeroFlow)}
											sx={{
												height: 32,
												fontSize: "0.68rem",
												fontWeight: 700,
												px: 1,
												whiteSpace: "nowrap",
												color: hideZeroFlow
													? "#FFB74D"
													: "rgba(255,255,255,0.5)",
												bgcolor: hideZeroFlow
													? "rgba(255, 183, 77, 0.15)"
													: "rgba(255, 255, 255, 0.03)",
												border: "1px solid rgba(255, 183, 77, 0.3) !important",
												borderRadius: 1,
											}}
										>
											HIDE 0-FLOW
										</ToggleButton>
									)}

									<ToggleButtonGroup
										value={layoutMode}
										exclusive
										onChange={handleLayoutChange}
										size="small"
										disabled={isLoading}
										sx={{
											...glassyStyle,
											borderRadius: 1,
											flexShrink: 0,
											height: 32,
										}}
									>
										<ToggleButton
											value="masonry"
											size="small"
											sx={{ px: 0.75 }}
										>
											<ViewModuleIcon fontSize="small" />
										</ToggleButton>
										<ToggleButton value="list" size="small" sx={{ px: 0.75 }}>
											<ViewListIcon fontSize="small" />
										</ToggleButton>
									</ToggleButtonGroup>
								</Stack>
							</Box>

							{/* Category Filter Chips */}
							<Box
								sx={{
									display: "flex",
									flexWrap: "wrap",
									gap: 0.75,
									pt: 0.5,
									borderTop: "1px solid rgba(255,255,255,0.08)",
								}}
							>
								<ToggleButton
									value="ALL"
									selected={selectedCategories.includes("ALL")}
									onClick={() => toggleCategory("ALL")}
									size="small"
									sx={{
										py: 0.25,
										px: 1.25,
										fontSize: "0.65rem",
										fontWeight: "bold",
										borderRadius: 1,
										border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
										"&.Mui-selected": {
											bgcolor: alpha(theme.palette.primary.main, 0.2),
											color: "primary.light",
											borderColor: "primary.main",
										},
									}}
								>
									ALL
								</ToggleButton>
								{ALL_CATEGORIES.map((cat) => (
									<ToggleButton
										key={cat}
										value={cat}
										selected={selectedCategories.includes(cat)}
										onClick={() => toggleCategory(cat)}
										size="small"
										sx={{
											py: 0.25,
											px: 1.25,
											fontSize: "0.65rem",
											borderRadius: 1,
											border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
											"&.Mui-selected": {
												bgcolor: alpha(theme.palette.primary.main, 0.2),
												color: "primary.light",
												borderColor: "primary.main",
											},
										}}
									>
										{cat.toUpperCase()}
									</ToggleButton>
								))}
							</Box>
						</Paper>
					</Collapse>
				</Box>

				<Box
					sx={{
						flexGrow: 1,
						overflowY: "auto",
						overflowX: "hidden",
						display: "flex",
						flexDirection: "column",
						position: "relative",
					}}
				>
					{(isLoading || isProcessing || isPending) && (
						<Box
							sx={{
								position: "absolute",
								inset: 0,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(theme.palette.background.default, 0.5),
								zIndex: 20,
								backdropFilter: "blur(2px)",
							}}
						>
							<CircularProgress />
						</Box>
					)}

					<Box
						sx={{
							display: layoutMode === "masonry" ? "block" : "none",
							flexGrow: 1,
						}}
					>
						<Box
							sx={{
								columnCount: { xs: 1, md: 2, lg: 3, xl: 4 },
								columnGap: 2,
								"& > *": { breakInside: "avoid", marginBottom: 2 },
							}}
						>
							{customCategories.map((cat) => (
								<Box key={cat.id} sx={{ mb: 2 }}>
									<CategoryCard
										category={cat.title}
										items={cat.items}
										isMobile={isMobile}
										onHide={() => hideCategory(cat.id)}
										isDrilldown={true}
										drillType={cat.drillType}
										onDrilldown={handleDrilldown}
										members={members}
									/>
								</Box>
							))}

							{!isLoading &&
								processedSortedCats.map((cat) => (
									<Box key={cat}>
										<CategoryCard
											category={cat}
											items={processedGroups[cat]}
											isMobile={isMobile}
											onHide={hideCategory}
											onDrilldown={handleDrilldown}
											members={members}
										/>
									</Box>
								))}
						</Box>
					</Box>

					<Box
						sx={{
							display: layoutMode === "list" ? "block" : "none",
							flexGrow: 1,
							height: "100%",
						}}
					>
						<Paper
							sx={{
								...glassyStyle,
								height: "100%",
								overflow: "hidden",
								borderRadius: 2,
							}}
						>
							<TableVirtuoso
								data={isLoading ? [] : processedList}
								components={{
									Scroller: React.forwardRef((props, ref) => (
										<TableContainer
											component={Paper}
											{...props}
											ref={ref}
											sx={{
												height: "100%",
												boxShadow: "none",
												bgcolor: "transparent",
												overflowX: "auto",
											}}
										/>
									)),
									Table: (props) => (
										<Table
											{...props}
											size="small"
											sx={{
												tableLayout: "fixed",
												width: isMobile ? "600px" : "100%",
												borderCollapse: "separate",
											}}
											stickyHeader
										/>
									),
									TableHead: TableHead,
									TableRow: (props) => {
										const rest = { ...props };
										delete (rest as Record<string, unknown>).item;
										return <TableRow {...rest} />;
									},
									TableBody: React.forwardRef((props, ref) => (
										<TableBody {...props} ref={ref} />
									)),
								}}
								fixedHeaderContent={() => (
									<TableRow>
										<TableCell
											sx={{
												fontSize: "0.75rem",
												fontWeight: "bold",
												color: "text.secondary",
												bgcolor: theme.palette.background.paper,
												width: "80px",
											}}
										>
											ITEM
										</TableCell>
										<TableCell
											align="right"
											sx={{
												fontSize: "0.75rem",
												fontWeight: "bold",
												color: "text.secondary",
												bgcolor: theme.palette.background.paper,
											}}
										>
											PROD
										</TableCell>
										<TableCell
											align="right"
											sx={{
												fontSize: "0.75rem",
												fontWeight: "bold",
												color: "text.secondary",
												bgcolor: theme.palette.background.paper,
											}}
										>
											CONS
										</TableCell>
										<TableCell
											align="right"
											sx={{
												fontSize: "0.75rem",
												fontWeight: "bold",
												color: "text.secondary",
												bgcolor: theme.palette.background.paper,
											}}
										>
											NET
										</TableCell>
										<TableCell
											align="right"
											sx={{
												fontSize: "0.75rem",
												fontWeight: "bold",
												color: "text.secondary",
												bgcolor: theme.palette.background.paper,
											}}
										>
											RATIO
										</TableCell>
										<TableCell
											align="right"
											sx={{
												fontSize: "0.75rem",
												fontWeight: "bold",
												color: "text.secondary",
												bgcolor: theme.palette.background.paper,
											}}
										>
											PRICE
										</TableCell>
										<TableCell
											align="right"
											sx={{
												fontSize: "0.75rem",
												fontWeight: "bold",
												color: "text.secondary",
												bgcolor: theme.palette.background.paper,
											}}
										>
											NET VALUE
										</TableCell>
										<TableCell
											align="right"
											sx={{
												fontSize: "0.75rem",
												fontWeight: "bold",
												color: "#64FFDA",
												bgcolor: theme.palette.background.paper,
											}}
										>
											CORP STOCK
										</TableCell>
										<TableCell
											align="right"
											sx={{
												fontSize: "0.75rem",
												fontWeight: "bold",
												color: "#A594FF",
												bgcolor: theme.palette.background.paper,
											}}
										>
											SHARE %
										</TableCell>
									</TableRow>
								)}
								itemContent={(_index, data) => {
									if (data.type === "header") {
										return (
											<CategoryHeaderRow
												category={data.data.category}
												count={data.data.count}
												onHide={
													data.isDrilldown
														? () => hideCategory(data.data.id)
														: hideCategory
												}
												isDrilldown={data.isDrilldown}
												colSpan={9}
												noWrapper={true}
											/>
										);
									} else {
										return (
											<CompactProductionRow
												row={data.data}
												isMobile={isMobile}
												useFullNumbers={true}
												isGridMode={false}
												onDrilldown={handleDrilldown}
												members={members}
												isDrilldown={data.isDrilldown}
												drillType={data.drillType}
												noWrapper={true}
											/>
										);
									}
								}}
							/>
						</Paper>
					</Box>
				</Box>
			</Box>
		);
	},
);
