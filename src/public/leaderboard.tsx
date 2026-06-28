import { API_BASE_URL } from "../config/api";
import React, { useState, useEffect, useMemo, useTransition } from "react";
import {
	ComposedChart,
	Bar,
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip as RechartsTooltip,
	ResponsiveContainer,
	Cell,
} from "recharts";
import {
	Box,
	Typography,
	CircularProgress,
	alpha,
	useTheme,
	Autocomplete,
	TextField,
	InputAdornment,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import SearchIcon from "@mui/icons-material/Search";

// --- Types ---
interface Producer {
	company_code: string;
	company_name: string;
	score: number;
	estimated_value: number;
}

interface HistoryPoint {
	date: string;
	[key: string]: string | number;
}

interface LeaderboardMaterial {
	ticker: string;
	avg_price_7d: number;
	record_date?: string;
	top_25: Producer[];
	history30d?: HistoryPoint[];
}

// --- Data Visualization Fixed Palette ---
const CHART_PALETTE = [
	"#8B5CF6",
	"#0EA5E9",
	"#10B981",
	"#F59E0B",
	"#EC4899",
	"#EF4444",
	"#14B8A6",
	"#F97316",
	"#84CC16",
	"#3B82F6",
	"#A855F7",
	"#D946EF",
	"#22C55E",
	"#06B6D4",
	"#F43F5E",
	"#8B5CF6",
	"#0EA5E9",
	"#10B981",
	"#F59E0B",
	"#EC4899",
	"#EF4444",
	"#14B8A6",
	"#F97316",
	"#84CC16",
	"#3B82F6",
];

const RANK_COLORS = {
	gold: "#FBBF24",
	silver: "#9CA3AF",
	bronze: "#B45309",
};

const getPaletteColor = (index: number) =>
	CHART_PALETTE[index % CHART_PALETTE.length];

// --- Reusable UI Components ---
const FlexCard = ({ children, sx = {} }: any) => (
	<Box
		sx={{
			display: "flex",
			flexDirection: "column",
			bgcolor: "background.paper",
			borderRadius: "8px",
			border: 1,
			borderColor: "divider",
			overflow: "hidden",
			...sx,
		}}
	>
		{children}
	</Box>
);

const compactFormatter = (value: number) => {
	if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
	if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
	return value.toString();
};

const ProducerRow = React.memo(
	({
		producer,
		rank,
		scoreDiff,
		isHovered,
		onMouseEnter,
	}: {
		producer: Producer;
		rank: number;
		scoreDiff: number;
		isHovered: boolean;
		onMouseEnter: (code: string) => void;
	}) => {
		const theme = useTheme();
		const producerColor = getPaletteColor(rank - 1);

		let RankIcon = null;
		if (rank === 1)
			RankIcon = (
				<EmojiEventsIcon sx={{ fontSize: "1.1rem", color: RANK_COLORS.gold }} />
			);
		else if (rank === 2)
			RankIcon = (
				<EmojiEventsIcon
					sx={{ fontSize: "1.1rem", color: RANK_COLORS.silver }}
				/>
			);
		else if (rank === 3)
			RankIcon = (
				<EmojiEventsIcon
					sx={{ fontSize: "1.1rem", color: RANK_COLORS.bronze }}
				/>
			);

		return (
			<tr
				onMouseEnter={() => onMouseEnter(producer.company_code)}
				style={{
					borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
					backgroundColor: isHovered
						? alpha(producerColor, 0.15)
						: "transparent",
					cursor: "pointer",
					transition: "background-color 0.1s",
				}}
			>
				<td
					style={{
						padding: "8px 12px",
						fontWeight: 800,
						color: RankIcon ? "inherit" : theme.palette.text.secondary,
						fontSize: "0.8rem",
					}}
				>
					{RankIcon ? RankIcon : `#${rank}`}
				</td>
				<td style={{ padding: "8px 12px" }}>
					<Typography
						sx={{ fontWeight: 800, color: producerColor, fontSize: "0.85rem" }}
					>
						{producer.company_code}
					</Typography>
					<Typography
						sx={{
							color: alpha(producerColor, 0.8),
							fontSize: "0.7rem",
							whiteSpace: "nowrap",
							overflow: "hidden",
							textOverflow: "ellipsis",
							maxWidth: "120px",
						}}
					>
						{producer.company_name}
					</Typography>
				</td>
				<td
					style={{
						padding: "8px 12px",
						textAlign: "center",
						verticalAlign: "middle",
					}}
				>
					<Box
						sx={{
							display: "inline-flex",
							alignItems: "center",
							px: 1,
							py: 0.25,
							borderRadius: "4px",
							bgcolor:
								scoreDiff > 0
									? alpha(theme.palette.success.main, 0.1)
									: scoreDiff < 0
										? alpha(theme.palette.error.main, 0.1)
										: alpha(theme.palette.text.secondary, 0.1),
						}}
					>
						{scoreDiff > 0 && (
							<Typography
								sx={{
									color: theme.palette.success.main,
									fontSize: "0.7rem",
									fontWeight: 800,
								}}
							>
								▲ {compactFormatter(scoreDiff)}
							</Typography>
						)}
						{scoreDiff < 0 && (
							<Typography
								sx={{
									color: theme.palette.error.main,
									fontSize: "0.7rem",
									fontWeight: 800,
								}}
							>
								▼ {compactFormatter(Math.abs(scoreDiff))}
							</Typography>
						)}
						{scoreDiff === 0 && (
							<Typography
								sx={{
									color: "text.secondary",
									fontSize: "0.7rem",
									fontWeight: 800,
								}}
							>
								—
							</Typography>
						)}
					</Box>
				</td>
				<td
					style={{
						padding: "8px 12px",
						textAlign: "right",
						fontFamily: "monospace",
						fontWeight: 700,
						color: "text.primary",
						fontSize: "0.85rem",
					}}
				>
					{compactFormatter(producer.score)}
				</td>
			</tr>
		);
	},
	(prev, next) =>
		prev.isHovered === next.isHovered && prev.scoreDiff === next.scoreDiff,
);

// --- MAIN COMPONENT ---
export const ProductionLeaderboard: React.FC = () => {
	const theme = useTheme();
	const [data, setData] = useState<LeaderboardMaterial[]>([]);
	const [selectedTicker, setSelectedTicker] = useState<string>("");
	const [isLoading, setIsLoading] = useState<boolean>(true);

	const [hoveredCompany, setHoveredCompany] = useState<string | null>(null);
	const [, startTransition] = useTransition();

	useEffect(() => {
		const fetchLeaderboard = async () => {
			try {
				const response = await fetch(
					`${API_BASE_URL}internal/leaderboard/production`,
				);
				const result = await response.json();

				const payloadData = result.data || result;

				if (payloadData && payloadData.length > 0) {
					setData(payloadData);
					setSelectedTicker(payloadData[0].ticker);
				}
			} catch (error) {
				console.error("Failed to fetch leaderboard data", error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchLeaderboard();
	}, []);

	const activeData = useMemo(
		() => data.find((d) => d.ticker === selectedTicker) || null,
		[data, selectedTicker],
	);
	const allChartCompanies = useMemo(
		() => activeData?.top_25.map((p) => p.company_code) || [],
		[activeData],
	);

	const handleHover = (code: string | null) => {
		startTransition(() => setHoveredCompany(code));
	};

	if (isLoading) {
		return (
			<Box
				display="flex"
				justifyContent="center"
				alignItems="center"
				height="100vh"
				bgcolor="background.default"
			>
				<CircularProgress
					size={50}
					thickness={4}
					sx={{ color: "primary.main" }}
				/>
			</Box>
		);
	}

	if (!data.length || !activeData) {
		return (
			<Box
				display="flex"
				justifyContent="center"
				alignItems="center"
				height="100vh"
				bgcolor="background.default"
			>
				<Typography color="text.secondary">
					No Leaderboard Data Available.
				</Typography>
			</Box>
		);
	}

	return (
		<Box
			sx={{
				height: "100vh",
				width: "100%",
				display: "flex",
				flexDirection: "column",
				bgcolor: "background.default",
				overflow: "hidden",
				boxSizing: "border-box",
			}}
		>
			{/* Compact Header & Autocomplete Search */}
			<Box
				sx={{
					display: "flex",
					flexWrap: "wrap",
					justifyContent: "space-between",
					alignItems: "center",
					gap: 2,
					px: 3,
					py: 1.5,
					borderBottom: 1,
					borderColor: "divider",
					flexShrink: 0,
				}}
			>
				<Typography
					variant="body2"
					sx={{ color: "text.secondary", fontWeight: 600 }}
				>
					Top 25 Producers •{" "}
					{activeData.record_date
						? new Date(activeData.record_date).toLocaleDateString()
						: "Today"}
				</Typography>

				<Autocomplete
					options={data}
					getOptionLabel={(option) => option.ticker}
					value={activeData}
					disableClearable
					onChange={(event, newValue) => {
						if (newValue) setSelectedTicker(newValue.ticker);
					}}
					renderInput={(params) => (
						<TextField
							{...params}
							placeholder="Search commodity..."
							size="small"
							InputProps={{
								...params.InputProps,
								startAdornment: (
									<InputAdornment position="start">
										<SearchIcon
											sx={{ color: "primary.main", fontSize: 18, ml: 0.5 }}
										/>
									</InputAdornment>
								),
							}}
							sx={{
								bgcolor: alpha(theme.palette.background.default, 0.5),
								borderRadius: "8px",
								"& .MuiOutlinedInput-root": {
									fontWeight: 700,
									borderRadius: "8px",
								},
								"& .MuiOutlinedInput-notchedOutline": {
									borderColor: "divider",
								},
								"&:hover .MuiOutlinedInput-notchedOutline": {
									borderColor: alpha(theme.palette.primary.main, 0.5),
								},
								"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
									borderColor: "primary.main",
								},
							}}
						/>
					)}
					renderOption={(props, option) => (
						<Box
							component="li"
							{...props}
							sx={{
								display: "flex",
								justifyContent: "space-between",
								width: "100%",
							}}
						>
							<Typography sx={{ fontWeight: 700 }}>{option.ticker}</Typography>
							<Typography
								sx={{
									color: "text.secondary",
									fontSize: "0.8rem",
									fontWeight: 500,
								}}
							>
								${option.avg_price_7d.toFixed(2)}
							</Typography>
						</Box>
					)}
					sx={{ width: 240 }}
				/>
			</Box>

			{/* Main Grid Area - Compacted Gap and Paddings */}
			<Box
				sx={{
					flex: 1,
					p: { xs: 1.5, md: 2 },
					display: "grid",
					gridTemplateColumns: { xs: "1fr", lg: "6.5fr 5.5fr" },
					gap: 2,
					minHeight: 0,
				}}
			>
				{/* LEFT COLUMN: Stacked Charts */}
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						gap: 2,
						minHeight: 0,
					}}
				>
					<FlexCard sx={{ flex: 1, minHeight: 0 }}>
						<Box px={2} py={1} borderBottom={1} borderColor="divider">
							<Typography
								variant="subtitle2"
								sx={{
									fontWeight: 700,
									color: "primary.main",
									textTransform: "uppercase",
									fontSize: "0.75rem",
								}}
							>
								Current 7-Day Distribution
							</Typography>
						</Box>
						<Box sx={{ flex: 1, p: 1, minHeight: 0 }}>
							<ResponsiveContainer width="100%" height="100%">
								<ComposedChart
									data={activeData.top_25}
									margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
								>
									<CartesianGrid
										strokeDasharray="3 3"
										stroke={theme.palette.divider}
										vertical={false}
									/>

									<XAxis
										dataKey="company_code"
										stroke={theme.palette.text.secondary}
										tick={{
											fill: theme.palette.text.secondary,
											fontSize: 10,
											fontWeight: 700,
										}}
										angle={-45}
										textAnchor="end"
										interval={0}
										dy={10}
										axisLine={false}
										tickLine={false}
									/>

									<YAxis
										yAxisId="left"
										orientation="left"
										stroke={theme.palette.text.secondary}
										tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
										tickFormatter={compactFormatter}
										axisLine={false}
										tickLine={false}
										label={{
											value: `${activeData.ticker} Units`,
											angle: -90,
											position: "insideLeft",
											offset: -5,
											fill: theme.palette.text.secondary,
											fontSize: 11,
											fontWeight: 700,
										}}
									/>

									<YAxis
										yAxisId="right"
										orientation="right"
										stroke={theme.palette.success.main}
										tick={{
											fill: theme.palette.success.main,
											fontSize: 10,
											fontWeight: 600,
										}}
										tickFormatter={(val) => `$${compactFormatter(val)}`}
										axisLine={false}
										tickLine={false}
										label={{
											value: "Est. Profit",
											angle: 90,
											position: "insideRight",
											offset: -5,
											fill: theme.palette.success.main,
											fontSize: 11,
											fontWeight: 700,
										}}
									/>

									<RechartsTooltip
										cursor={{ fill: alpha(theme.palette.text.primary, 0.05) }}
										content={({ active, payload }) => {
											if (active && payload && payload.length) {
												const chartData = payload[0].payload as Producer;
												const rank =
													activeData.top_25.findIndex(
														(p) => p.company_code === chartData.company_code,
													) + 1;
												const hoverColor = getPaletteColor(rank - 1);
												return (
													<Box
														sx={{
															p: 1.5,
															bgcolor: alpha(
																theme.palette.background.default,
																0.95,
															),
															border: `1px solid ${hoverColor}`,
															borderRadius: "8px",
															boxShadow: `0 8px 24px ${alpha("#000", 0.5)}`,
														}}
													>
														<Typography
															variant="subtitle2"
															sx={{
																fontWeight: 800,
																mb: 0.5,
																color: hoverColor,
																fontSize: "0.8rem",
															}}
														>
															#{rank} {chartData.company_name}{" "}
															<Typography
																component="span"
																sx={{
																	color: "text.secondary",
																	ml: 0.5,
																	fontSize: "0.75rem",
																}}
															>
																({chartData.company_code})
															</Typography>
														</Typography>
														<Typography
															variant="body2"
															sx={{
																color: "text.secondary",
																mb: 0.25,
																fontSize: "0.75rem",
															}}
														>
															Prod:{" "}
															<Typography
																component="span"
																sx={{
																	color: theme.palette.info.main,
																	fontWeight: 700,
																	ml: 1,
																}}
															>
																{chartData.score.toLocaleString()}
															</Typography>
														</Typography>
														<Typography
															variant="body2"
															sx={{
																color: "text.secondary",
																fontSize: "0.75rem",
															}}
														>
															Value:{" "}
															<Typography
																component="span"
																sx={{
																	color: theme.palette.success.main,
																	fontWeight: 700,
																	ml: 1,
																}}
															>
																$
																{chartData.estimated_value.toLocaleString(
																	undefined,
																	{ maximumFractionDigits: 0 },
																)}
															</Typography>
														</Typography>
													</Box>
												);
											}
											return null;
										}}
									/>

									<Bar
										yAxisId="left"
										dataKey="score"
										radius={[2, 2, 0, 0]}
										maxBarSize={28}
									>
										{activeData.top_25.map((entry, index) => {
											const barColor = getPaletteColor(index);
											const isDimmed =
												hoveredCompany !== null &&
												hoveredCompany !== entry.company_code;
											return (
												<Cell
													key={`cell-${index}`}
													fill={barColor}
													fillOpacity={isDimmed ? 0.2 : 1}
													style={{ transition: "fill-opacity 0.2s" }}
												/>
											);
										})}
									</Bar>

									<Line
										yAxisId="right"
										type="monotone"
										dataKey="estimated_value"
										stroke={theme.palette.success.main}
										strokeWidth={2}
										strokeOpacity={hoveredCompany !== null ? 0.2 : 1}
										dot={{
											r: 3,
											fill: theme.palette.background.default,
											stroke: theme.palette.success.main,
											strokeWidth: 2,
										}}
										activeDot={{
											r: 5,
											fill: theme.palette.success.main,
											stroke: "#fff",
										}}
									/>
								</ComposedChart>
							</ResponsiveContainer>
						</Box>
					</FlexCard>

					<FlexCard sx={{ flex: 1, minHeight: 0 }}>
						<Box
							px={2}
							py={1}
							borderBottom={1}
							borderColor="divider"
							display="flex"
							justifyContent="space-between"
							alignItems="center"
						>
							<Typography
								variant="subtitle2"
								sx={{
									fontWeight: 700,
									color: "primary.main",
									textTransform: "uppercase",
									fontSize: "0.75rem",
								}}
							>
								30-Day History (Top 25)
							</Typography>
						</Box>
						<Box sx={{ flex: 1, p: 1, minHeight: 0 }}>
							{activeData.history30d && activeData.history30d.length > 0 ? (
								<ResponsiveContainer width="100%" height="100%">
									<LineChart
										data={activeData.history30d}
										margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
										onMouseLeave={() => handleHover(null)}
									>
										<CartesianGrid
											strokeDasharray="3 3"
											stroke={theme.palette.divider}
											vertical={false}
										/>
										<XAxis
											dataKey="date"
											stroke={theme.palette.text.secondary}
											tick={{
												fill: theme.palette.text.secondary,
												fontSize: 10,
											}}
											tickFormatter={(tick) =>
												new Date(tick).toLocaleDateString(undefined, {
													month: "short",
													day: "numeric",
												})
											}
											axisLine={false}
											tickLine={false}
											dy={5}
										/>
										<YAxis
											stroke={theme.palette.text.secondary}
											tick={{
												fill: theme.palette.text.secondary,
												fontSize: 10,
											}}
											tickFormatter={compactFormatter}
											axisLine={false}
											tickLine={false}
										/>
										<RechartsTooltip
											contentStyle={{
												backgroundColor: alpha(
													theme.palette.background.default,
													0.95,
												),
												borderColor: theme.palette.divider,
												color: theme.palette.text.primary,
												borderRadius: "8px",
											}}
											labelFormatter={(label) =>
												new Date(label).toLocaleDateString()
											}
											itemStyle={{ fontWeight: 700, fontSize: "0.8rem" }}
											filterNull={false}
											itemSorter={(item) =>
												hoveredCompany && item.dataKey !== hoveredCompany
													? { ...item, value: null }
													: item
											}
										/>
										{allChartCompanies.map((companyCode, idx) => {
											const isHovered = hoveredCompany === companyCode;
											const isDimmed = hoveredCompany !== null && !isHovered;
											return (
												<Line
													key={companyCode}
													type="linear"
													dataKey={companyCode}
													name={companyCode}
													stroke={getPaletteColor(idx)}
													strokeWidth={isHovered ? 4 : 2}
													strokeOpacity={isDimmed ? 0.1 : 1}
													dot={
														isHovered
															? {
																	r: 4,
																	fill: theme.palette.background.default,
																	strokeWidth: 2,
																}
															: false
													}
													activeDot={
														isDimmed ? false : { r: 5, strokeWidth: 0 }
													}
													onMouseEnter={() => handleHover(companyCode)}
													style={{
														transition:
															"stroke-opacity 0.2s, stroke-width 0.2s",
													}}
												/>
											);
										})}
									</LineChart>
								</ResponsiveContainer>
							) : (
								<Box
									display="flex"
									justifyContent="center"
									alignItems="center"
									height="100%"
									color="text.secondary"
									fontSize="0.8rem"
								>
									No historical snapshots available.
								</Box>
							)}
						</Box>
					</FlexCard>
				</Box>

				{/* RIGHT COLUMN: Compact Table */}
				<FlexCard
					sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}
				>
					<Box px={2} py={1} borderBottom={1} borderColor="divider">
						<Typography
							variant="subtitle2"
							sx={{
								fontWeight: 700,
								color: "primary.main",
								textTransform: "uppercase",
								fontSize: "0.75rem",
							}}
						>
							Current Rankings
						</Typography>
					</Box>
					<Box
						sx={{
							flex: 1,
							overflowY: "auto",
							p: 0,
							"&::-webkit-scrollbar": { width: "6px" },
							"&::-webkit-scrollbar-thumb": {
								backgroundColor: theme.palette.divider,
								borderRadius: "4px",
							},
						}}
						onMouseLeave={() => handleHover(null)}
					>
						<table
							style={{
								width: "100%",
								borderCollapse: "collapse",
								textAlign: "left",
							}}
						>
							<thead
								style={{
									position: "sticky",
									top: 0,
									zIndex: 2,
									backgroundColor: alpha(
										theme.palette.background.default,
										0.95,
									),
								}}
							>
								<tr style={{ fontSize: "0.65rem", textTransform: "uppercase" }}>
									<th
										style={{
											padding: "10px 12px",
											fontWeight: 800,
											borderBottom: `1px solid ${theme.palette.divider}`,
											color: theme.palette.primary.main,
											width: "40px",
										}}
									>
										Rk
									</th>
									<th
										style={{
											padding: "10px 12px",
											fontWeight: 800,
											borderBottom: `1px solid ${theme.palette.divider}`,
											color: theme.palette.primary.main,
										}}
									>
										Company
									</th>
									<th
										style={{
											padding: "10px 12px",
											fontWeight: 800,
											borderBottom: `1px solid ${theme.palette.divider}`,
											color: theme.palette.primary.main,
											textAlign: "center",
											width: "90px",
										}}
									>
										1W Δ
									</th>
									<th
										style={{
											padding: "10px 12px",
											fontWeight: 800,
											borderBottom: `1px solid ${theme.palette.divider}`,
											color: theme.palette.primary.main,
											textAlign: "right",
											width: "80px",
										}}
									>
										Score
									</th>
								</tr>
							</thead>
							<tbody>
								{activeData.top_25.map((producer, idx) => {
									const rawHistory = activeData.history30d || [];
									const producerHistory = rawHistory
										.filter(
											(point) => point[producer.company_code] !== undefined,
										)
										.map((point) => ({
											score: point[producer.company_code] as number,
										}));

									let scoreDiff = 0;
									if (producerHistory.length > 1) {
										scoreDiff =
											producerHistory[producerHistory.length - 1].score -
											producerHistory[producerHistory.length - 2].score;
									}

									return (
										<ProducerRow
											key={producer.company_code}
											producer={producer}
											rank={idx + 1}
											scoreDiff={scoreDiff}
											isHovered={hoveredCompany === producer.company_code}
											onMouseEnter={handleHover}
										/>
									);
								})}
							</tbody>
						</table>
					</Box>
				</FlexCard>
			</Box>
		</Box>
	);
};
