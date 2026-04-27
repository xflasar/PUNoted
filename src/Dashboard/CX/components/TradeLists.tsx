// src/Dashboard/CX/components/TradeLists.tsx
import React, { useState, useMemo } from "react";
import {
	Box,
	Paper,
	Typography,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Chip,
	useTheme,
	alpha,
	Tooltip,
	IconButton,
} from "@mui/material";
import { KeyboardArrowUp, KeyboardArrowDown } from "@mui/icons-material";
import { formatCompactNumber } from "../helpers/formatNumber";
import { format, parseISO } from "date-fns";
import { SectionGuide } from "../helpers/dashboardUtils";

export interface AggregatedTrade {
	ticker: string;
	amount: number;
	value: number;
	time?: string;
}

interface TradeListProps {
	buyList: AggregatedTrade[];
	sellList: AggregatedTrade[];
	showTime?: boolean;
}

type SortKey = "ticker" | "amount" | "value" | "time";

const CompactTable = ({
	data,
	type,
	showTime,
}: {
	data: AggregatedTrade[];
	type: "BUY" | "SELL";
	showTime?: boolean;
}) => {
	const theme = useTheme();
	const isSell = type === "SELL";
	const [sortConfig, setSortConfig] = useState<{ key: SortKey; asc: boolean }>({
		key: showTime ? "time" : "value",
		asc: false,
	});

	const handleSort = (key: SortKey) => {
		setSortConfig((prev) => ({
			key,
			asc: prev.key === key ? !prev.asc : false,
		}));
	};

	const sortedData = useMemo(() => {
		return [...data].sort((a, b) => {
			let valA: any = a[sortConfig.key] ?? 0;
			let valB: any = b[sortConfig.key] ?? 0;
			if (sortConfig.key === "time") {
				valA = new Date(valA).getTime();
				valB = new Date(valB).getTime();
			}
			if (valA < valB) return sortConfig.asc ? -1 : 1;
			if (valA > valB) return sortConfig.asc ? 1 : -1;
			return 0;
		});
	}, [data, sortConfig]);

	const SortIcon = ({ k }: { k: SortKey }) => {
		if (sortConfig.key !== k) return null;
		return sortConfig.asc ? (
			<KeyboardArrowUp fontSize="inherit" />
		) : (
			<KeyboardArrowDown fontSize="inherit" />
		);
	};

	const HeaderCell = ({
		k,
		label,
		align = "left",
	}: {
		k: SortKey;
		label: string;
		align?: "left" | "right";
	}) => (
		<TableCell
			align={align}
			onClick={() => handleSort(k)}
			sx={{
				cursor: "pointer",
				bgcolor: alpha(theme.palette.background.default, 0.95),
				color: alpha(theme.palette.common.white, 0.7),
				fontWeight: "bold",
				fontSize: "0.7rem",
				py: 0.5,
				px: 1,
				"&:hover": { color: theme.palette.primary.main },
			}}
		>
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: align === "right" ? "flex-end" : "flex-start",
					gap: 0.2,
				}}
			>
				<Tooltip title={`Sort by ${label}`} arrow>
					<span style={{ borderBottom: "1px dotted" }}>{label}</span>
				</Tooltip>
				<SortIcon k={k} />
			</Box>
		</TableCell>
	);

	const typeColor = isSell
		? theme.palette.success.main
		: theme.palette.error.main;

	return (
		<TableContainer sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
			<Table stickyHeader size="small" padding="none">
				<TableHead>
					<TableRow>
						{showTime && <HeaderCell k="time" label="TIME" />}
						<HeaderCell k="ticker" label="TICKER" />
						<HeaderCell k="amount" label="AMT" align="right" />
						<HeaderCell k="value" label="TOTAL" align="right" />
					</TableRow>
				</TableHead>
				<TableBody>
					{sortedData.length === 0 ? (
						<TableRow>
							<TableCell
								colSpan={showTime ? 4 : 3}
								align="center"
								sx={{ py: 2, color: "text.disabled", fontSize: "0.75rem" }}
							>
								No trades
							</TableCell>
						</TableRow>
					) : (
						sortedData.map((row, i) => {
							const formattedAmt = formatCompactNumber(row.amount, false);
							const formattedVal = formatCompactNumber(row.value);
							return (
								<TableRow
									key={`${row.ticker}-${i}`}
									hover
									sx={{ "&:last-child td": { borderBottom: 0 } }}
								>
									{showTime && (
										<TableCell
											sx={{
												py: 0.25,
												px: 1,
												fontSize: "0.7rem",
												color: "text.secondary",
												borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
											}}
										>
											{row.time
												? format(parseISO(row.time), "MM/dd HH:mm")
												: "-"}
										</TableCell>
									)}
									<TableCell
										sx={{
											py: 0.25,
											px: 1,
											borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
										}}
									>
										<Typography
											variant="body2"
											fontWeight="700"
											fontSize="0.75rem"
											sx={{ color: typeColor }}
										>
											{row.ticker}
										</Typography>
									</TableCell>
									<TableCell
										align="right"
										sx={{
											py: 0.25,
											px: 1,
											fontSize: "0.75rem",
											borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
											color: isSell ? "success.main" : "error.main",
										}}
									>
										<Tooltip
											title={row.amount.toLocaleString()}
											arrow
											placement="top"
										>
											<span
												style={{
													textDecoration: "underline dotted",
													cursor: "help",
												}}
											>
												{formattedAmt}
											</span>
										</Tooltip>
									</TableCell>
									<TableCell
										align="right"
										sx={{
											py: 0.25,
											px: 1,
											fontSize: "0.75rem",
											fontWeight: "bold",
											color: isSell ? "success.main" : "error.main",
											borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
										}}
									>
										<Tooltip
											title={row.value.toLocaleString()}
											arrow
											placement="top"
										>
											<span
												style={{
													textDecoration: "underline dotted",
													cursor: "help",
												}}
											>
												{formattedVal}
											</span>
										</Tooltip>
									</TableCell>
								</TableRow>
							);
						})
					)}
				</TableBody>
			</Table>
		</TableContainer>
	);
};

export const TradeLists = ({
	buyList,
	sellList,
	showTime = false,
}: TradeListProps) => {
	const theme = useTheme();
	const paperStyle = {
		flex: 1,
		overflow: "hidden",
		display: "flex",
		flexDirection: "column",
		backgroundColor: alpha(theme.palette.background.default, 0.2),
		border: `1px solid ${alpha(theme.palette.primary.light, 0.1)}`,
		borderRadius: 1,
		boxShadow: "none",
	};

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: { xs: "column", md: "row" },
				gap: 1,
				width: "100%",
				height: "100%",
				minHeight: 0,
			}}
		>
			<Paper sx={paperStyle}>
				<Box
					sx={{
						p: 0.5,
						px: 1,
						borderBottom: 1,
						borderColor: alpha(theme.palette.common.white, 0.05),
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						bgcolor: alpha(theme.palette.background.default, 0.4),
					}}
				>
					<Box display="flex" alignItems="center">
						<Typography
							variant="caption"
							fontWeight="bold"
							fontSize="0.7rem"
							color="success.light"
						>
							SELLING
						</Typography>
					</Box>
					<Chip
						label={sellList.length}
						size="small"
						sx={{
							height: 16,
							fontSize: "0.6rem",
							bgcolor: alpha(theme.palette.success.main, 0.2),
							color: "success.light",
							fontWeight: "bold",
						}}
					/>
				</Box>
				<CompactTable data={sellList} type="SELL" showTime={showTime} />
			</Paper>

			<Paper sx={paperStyle}>
				<Box
					sx={{
						p: 0.5,
						px: 1,
						borderBottom: 1,
						borderColor: alpha(theme.palette.common.white, 0.05),
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						bgcolor: alpha(theme.palette.background.default, 0.4),
					}}
				>
					<Typography
						variant="caption"
						fontWeight="bold"
						fontSize="0.7rem"
						color="error.light"
					>
						BUYING
					</Typography>
					<Chip
						label={buyList.length}
						size="small"
						sx={{
							height: 16,
							fontSize: "0.6rem",
							bgcolor: alpha(theme.palette.error.main, 0.2),
							color: "error.light",
							fontWeight: "bold",
						}}
					/>
				</Box>
				<CompactTable data={buyList} type="BUY" showTime={showTime} />
			</Paper>
		</Box>
	);
};
