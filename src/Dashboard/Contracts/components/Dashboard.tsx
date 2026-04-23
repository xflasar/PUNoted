import React, { useEffect, useState } from "react";
import {
	Box,
	Typography,
	List,
	ListItem,
	ListItemText,
	Chip,
	CircularProgress,
	useTheme,
	IconButton,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	TablePagination,
	TableContainer,
	Stack,
	Select,
	MenuItem,
	useMediaQuery,
	Paper,
	Divider,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
	TrendingUp,
	TrendingDown,
	Warning,
	AccessTime,
	CheckCircle,
	ArrowCircleLeft,
	ArrowCircleRight,
	LocalShipping,
	AccountBalance,
	Handshake,
} from "@mui/icons-material";
import { API_BASE } from "../../settings/constants";
import { formatCurrency, getStatusColor, getStatusBg } from "../helpers/helper";
import type {
	DashboardStats,
	DashboardWidgets,
	ContractListItem,
} from "../types";
import dayjs from "dayjs";
import ContractRow from "./ContractRow";

// --- Helper Components ---

const Comparison = ({
	current,
	last,
	inverse = false,
}: {
	current: number;
	last: number;
	inverse?: boolean;
}) => {
	const diff = current - last;
	const percent = last !== 0 ? (diff / last) * 100 : current > 0 ? 100 : 0;
	const isGood = inverse ? diff <= 0 : diff >= 0;

	const color = isGood ? "success.main" : "error.main";
	const Icon = diff >= 0 ? TrendingUp : TrendingDown;

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "row",
				justifyContent: "center",
				alignItems: "center",
				gap: 0.5,
				mt: 0,
			}}
		>
			<Icon sx={{ fontSize: 12, color }} />
			<Typography
				variant="caption"
				sx={{ color, fontWeight: "bold", fontSize: "0.65rem" }}
			>
				{Math.abs(percent).toFixed(1)}%
			</Typography>
			<Typography
				variant="caption"
				color="text.secondary"
				sx={{ opacity: 0.7, fontSize: "0.65rem" }}
			>
				({formatCurrency(last, "ICA")})
			</Typography>
		</Box>
	);
};

const StatCard = ({ title, value, lastValue, type = "neutral" }: any) => {
	const theme = useTheme();
	const color =
		type === "revenue"
			? theme.palette.success.main
			: type === "expense"
				? theme.palette.error.main
				: theme.palette.primary.main;

	return (
		<Box
			sx={{
				p: 1,
				flex: 1,
				minWidth: "100px",
				height: "100%",
				bgcolor: alpha(theme.palette.background.default, 0.4),
				backdropFilter: "blur(12px)",
				border: `1px solid ${theme.palette.divider}`,
				borderRadius: 1,
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
				textAlign: "center",
			}}
		>
			<Typography
				variant="caption"
				color="text.secondary"
				fontWeight={700}
				textTransform="uppercase"
				fontSize="0.65rem"
				sx={{ lineHeight: 1 }}
			>
				{title}
			</Typography>
			<Typography
				variant="body1"
				fontWeight={800}
				sx={{ color, my: 0, fontSize: "0.9rem" }}
			>
				{typeof value === "number" ? formatCurrency(value, "ICA") : value}
			</Typography>
			{lastValue !== undefined && (
				<Comparison
					current={value}
					last={lastValue}
					inverse={type === "expense"}
				/>
			)}
		</Box>
	);
};

const WidgetList = ({ title, items, icon, emptyMsg, onViewDetail }: any) => {
	const theme = useTheme();
	return (
		<Box
			sx={{
				flex: 1,
				height: "100%",
				minHeight: 180,
				display: "flex",
				flexDirection: "column",
				bgcolor: alpha(theme.palette.background.default, 0.4),
				backdropFilter: "blur(12px)",
				border: `1px solid ${theme.palette.divider}`,
				borderRadius: 1,
				overflow: "hidden",
			}}
		>
			<Box
				sx={{
					p: 0.75,
					px: 1,
					borderBottom: `1px solid ${theme.palette.divider}`,
					display: "flex",
					alignItems: "center",
					gap: 1,
					bgcolor: alpha(theme.palette.background.default, 0.5),
				}}
			>
				{icon}
				<Typography variant="subtitle2" fontWeight={800} fontSize="0.75rem">
					{title}
				</Typography>
				<Chip
					label={items.length}
					size="small"
					sx={{ ml: "auto", height: 16, fontSize: "0.6rem" }}
				/>
			</Box>
			<List dense sx={{ overflowY: "auto", flexGrow: 1, p: 0 }}>
				{items.length === 0 ? (
					<Box sx={{ p: 2, textAlign: "center" }}>
						<Typography
							variant="caption"
							color="text.secondary"
							fontSize="0.7rem"
						>
							{emptyMsg}
						</Typography>
					</Box>
				) : (
					items.map((c: any) => (
						<ListItem
							key={c.id}
							divider
							button
							onClick={() => onViewDetail(c.id)}
							sx={{
								"&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.05) },
								py: 0.25,
								px: 1,
							}}
						>
							<ListItemText
								primary={
									<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
										<Typography
											variant="body2"
											fontWeight={700}
											fontSize="0.75rem"
											sx={{ lineHeight: 1 }}
										>
											{c.localid}
										</Typography>
										<Typography
											variant="caption"
											color="text.secondary"
											noWrap
											sx={{ fontSize: "0.7rem" }}
										>
											{c.name ? `- ${c.name}` : ""}
										</Typography>
									</Box>
								}
								secondary={
									<Box
										sx={{
											display: "flex",
											justifyContent: "space-between",
											alignItems: "center",
										}}
									>
										<Typography
											variant="caption"
											color="text.primary"
											fontSize="0.65rem"
											fontFamily="monospace"
										>
											{formatCurrency(c.total_amount, c.currency)}
										</Typography>
										{c.duedate && (
											<Typography
												variant="caption"
												color={
													dayjs(c.duedate).diff(dayjs(), "hour") < 24
														? "error.main"
														: "text.secondary"
												}
												fontWeight="bold"
												fontSize="0.65rem"
											>
												{dayjs(c.duedate).format("MMM D")}
											</Typography>
										)}
									</Box>
								}
							/>
						</ListItem>
					))
				)}
			</List>
		</Box>
	);
};

// --- Mobile Card Component ---
const MobileContractCard = ({
	contract,
	onClick,
}: {
	contract: ContractListItem;
	onClick: () => void;
}) => {
	const theme = useTheme();

	const getIcon = () => {
		switch (contract.operation_type) {
			case "BUY":
				return <ArrowCircleLeft fontSize="small" color="success" />;
			case "SELL":
				return <ArrowCircleRight fontSize="small" color="warning" />;
			case "SHIPMENT":
				return <LocalShipping fontSize="small" color="info" />;
			case "LOAN":
				return <AccountBalance fontSize="small" color="error" />;
			default:
				return <Handshake fontSize="small" color="secondary" />;
		}
	};

	return (
		<Paper
			onClick={onClick}
			sx={{
				p: 2,
				mb: 1.5,
				bgcolor: alpha(theme.palette.background.default, 0.6),
				border: `1px solid ${theme.palette.divider}`,
				cursor: "pointer",
				display: "flex",
				flexDirection: "column",
				gap: 1.5,
			}}
		>
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					{getIcon()}
					<Typography variant="subtitle2" fontWeight={700}>
						{contract.localid || "No ID"}
					</Typography>
				</Box>
				<Chip
					label={contract.status}
					size="small"
					sx={{
						height: 20,
						fontSize: "0.65rem",
						fontWeight: "800",
						color: getStatusColor(contract.status, theme),
						bgcolor: getStatusBg(contract.status, theme),
						border: `1px solid ${getStatusColor(contract.status, theme)}`,
					}}
				/>
			</Box>
			<Divider sx={{ opacity: 0.5 }} />
			<Box sx={{ display: "flex", justifyContent: "space-between" }}>
				<Box>
					<Typography variant="caption" color="text.secondary" display="block">
						PARTNER
					</Typography>
					<Typography variant="body2" fontWeight={500}>
						{contract.partnername || "Unknown"}
					</Typography>
					<Typography
						variant="caption"
						color="text.secondary"
						fontFamily="monospace"
					>
						{contract.partnercode}
					</Typography>
				</Box>
				<Box sx={{ textAlign: "right" }}>
					<Typography variant="caption" color="text.secondary" display="block">
						DATE
					</Typography>
					<Typography variant="body2">
						{dayjs(contract.date).format("MMM D, YY")}
					</Typography>
					{contract.duedate && (
						<Typography
							variant="caption"
							color={
								dayjs(contract.duedate).diff(dayjs(), "hour") < 24
									? "error.main"
									: "text.secondary"
							}
							fontWeight="bold"
						>
							Due: {dayjs(contract.duedate).format("MMM D")}
						</Typography>
					)}
				</Box>
			</Box>
			<Box
				sx={{
					bgcolor: alpha(theme.palette.background.default, 0.5),
					p: 1,
					borderRadius: 1,
					textAlign: "center",
				}}
			>
				<Typography
					variant="h6"
					fontFamily="monospace"
					fontWeight={700}
					sx={{ fontSize: "1rem" }}
				>
					{formatCurrency(contract.total_amount, contract.currency)}
				</Typography>
			</Box>
		</Paper>
	);
};

// --- Main Dashboard Component ---

export const ContractsDashboard: React.FC<{
	onViewDetail: (id: string) => void;
}> = ({ onViewDetail }) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));

	const [stats, setStats] = useState<DashboardStats | null>(null);
	const [widgets, setWidgets] = useState<DashboardWidgets | null>(null);
	const [loading, setLoading] = useState(true);

	const [allContracts, setAllContracts] = useState<ContractListItem[]>([]);
	const [totalCount, setTotalCount] = useState(0);
	const [listLoading, setListLoading] = useState(false);
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);

	useEffect(() => {
		const load = async () => {
			const token = localStorage.getItem("authToken");
			if (!token) return;
			try {
				const [sRes, wRes] = await Promise.all([
					fetch(`${API_BASE}/contracts/dashboard-stats`, {
						headers: { Authorization: `Bearer ${token}` },
					}),
					fetch(`${API_BASE}/contracts/dashboard-widgets`, {
						headers: { Authorization: `Bearer ${token}` },
					}),
				]);
				if (sRes.ok) setStats(await sRes.json());
				if (wRes.ok) setWidgets(await wRes.json());
			} catch (e) {
				console.error(e);
			} finally {
				setLoading(false);
			}
		};
		load();
	}, []);

	useEffect(() => {
		const fetchList = async () => {
			const token = localStorage.getItem("authToken");
			if (!token) return;
			setListLoading(true);
			try {
				const res = await fetch(`${API_BASE}/contracts/list`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({
						category: "ALL",
						status: "ALL",
						page: page + 1,
						limit: rowsPerPage,
					}),
				});
				if (res.ok) {
					const data = await res.json();
					setAllContracts(data.items || []);
					setTotalCount(data.total || 0);
				}
			} finally {
				setListLoading(false);
			}
		};
		fetchList();
	}, [page, rowsPerPage]);

	if (loading)
		return (
			<Box
				sx={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					height: "100%",
				}}
			>
				<CircularProgress />
			</Box>
		);

	return (
		<Box
			sx={{
				p: 0.5,
				height: "100%",
				display: "flex",
				flexDirection: "column",
				overflowY: isMobile ? "auto" : "hidden",
				overflowX: "hidden",
				gap: 1,
			}}
		>
			{/* ROW 1: Statistics */}
			<Box
				sx={{
					display: "flex",
					gap: 1,
					flexDirection: { xs: "column", sm: "row" },
					flex: isMobile ? "none" : "0 1 auto",
				}}
			>
				<Box sx={{ display: "flex", flexDirection: "row", gap: 1, flex: 1 }}>
					<StatCard
						title="Revenue"
						value={stats?.current_week.revenue || 0}
						lastValue={stats?.last_week.revenue || 0}
						type="revenue"
					/>
					<StatCard
						title="Expenses"
						value={stats?.current_week.expenses || 0}
						lastValue={stats?.last_week.expenses || 0}
						type="expense"
					/>
				</Box>
				<Box sx={{ display: "flex", flexDirection: "row", gap: 1, flex: 1 }}>
					<StatCard
						title="Net Income"
						value={stats?.current_week.net || 0}
						lastValue={stats?.last_week.net || 0}
						type="net"
					/>
					<Box
						sx={{
							flex: 1,
							p: 0.5,
							minWidth: "100px",
							height: "100%",
							minHeight: isMobile ? 80 : "auto",
							bgcolor: alpha("#1e1e1e", 0.8),
							border: "1px solid #333",
							borderRadius: 1,
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<Typography variant="h5" fontWeight={800} color="primary.main">
							{stats?.total_active}
						</Typography>
						<Typography
							variant="caption"
							color="text.secondary"
							textTransform="uppercase"
							fontSize="0.65rem"
						>
							Active
						</Typography>
					</Box>
				</Box>
			</Box>

			{/* ROW 2: Widgets */}
			<Box
				sx={{
					display: "flex",
					gap: 1,
					flexDirection: { xs: "column", sm: "row" },
					flex: isMobile ? "none" : "0 1 auto",
					maxHeight: isMobile ? "none" : "40%",
					minHeight: 180,
				}}
			>
				<WidgetList
					title="Immediate"
					items={widgets?.immediate || []}
					icon={<AccessTime color="error" fontSize="small" />}
					emptyMsg="No deadlines."
					onViewDetail={onViewDetail}
				/>
				<WidgetList
					title="Active"
					items={widgets?.active || []}
					icon={<CheckCircle color="success" fontSize="small" />}
					emptyMsg="No active."
					onViewDetail={onViewDetail}
				/>
				<WidgetList
					title="Breached"
					items={widgets?.breached || []}
					icon={<Warning color="warning" fontSize="small" />}
					emptyMsg="No breached."
					onViewDetail={onViewDetail}
				/>
			</Box>

			{/* ROW 3: Table / Mobile List */}
			<Box
				sx={{
					flexGrow: 1,
					minHeight: isMobile ? 500 : 0,
					display: "flex",
					flexDirection: "column",
					bgcolor: alpha(theme.palette.background.default, 0.4),
					backdropFilter: "blur(12px)",
					border: `1px solid ${theme.palette.divider}`,
					borderRadius: 1,
					overflow: "hidden",
				}}
			>
				<Box
					sx={{
						p: 0.5,
						px: 1,
						borderBottom: `1px solid ${theme.palette.divider}`,
						bgcolor: alpha(theme.palette.background.default, 0.5),
					}}
				>
					<Typography variant="subtitle2" fontWeight={700} fontSize="0.8rem">
						All Contracts
					</Typography>
				</Box>

				{isMobile ? (
					// MOBILE VIEW: CARDS
					<Box sx={{ flexGrow: 1, overflowY: "auto", p: 1 }}>
						{listLoading ? (
							<Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
								<CircularProgress />
							</Box>
						) : allContracts.length === 0 ? (
							<Box sx={{ textAlign: "center", p: 5, color: "text.secondary" }}>
								No contracts found.
							</Box>
						) : (
							allContracts.map((c) => (
								<MobileContractCard
									key={c.id}
									contract={c}
									onClick={() => onViewDetail(c.id)}
								/>
							))
						)}
					</Box>
				) : (
					<TableContainer
						sx={{ flexGrow: 1, overflowY: "auto", overflowX: "auto" }}
					>
						{/* minWidth ensures horizontal scroll on very small tablet screens before switching to mobile view */}
						<Table
							stickyHeader
							size="small"
							sx={{ height: "100%", tableLayout: "fixed", minWidth: 600 }}
						>
							<TableHead>
								<TableRow sx={{ height: 35 }}>
									<TableCell sx={{ fontWeight: "bold", width: "35%" }}>
										Contract
									</TableCell>
									<TableCell sx={{ fontWeight: "bold", width: "25%" }}>
										Partner
									</TableCell>
									<TableCell
										align="right"
										sx={{ fontWeight: "bold", width: "20%" }}
									>
										Value
									</TableCell>
									<TableCell
										align="right"
										sx={{ fontWeight: "bold", width: "30%" }}
									>
										Status / Date
									</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{listLoading ? (
									<TableRow>
										<TableCell colSpan={5} align="center">
											<CircularProgress size={20} />
										</TableCell>
									</TableRow>
								) : (
									allContracts.map((c) => (
										<ContractRow
											key={c.id}
											contract={c}
											onClick={() => onViewDetail(c.id)}
											rowHeight={`max(45px, calc(100% / ${rowsPerPage}))`}
										/>
									))
								)}
							</TableBody>
						</Table>
					</TableContainer>
				)}

				{/* Pagination (Shared) */}
				<Box
					sx={{
						p: 0.5,
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						borderTop: `1px solid ${theme.palette.divider}`,
						bgcolor: alpha(theme.palette.background.default, 0.3),
					}}
				>
					<Stack direction="row" spacing={1} alignItems="center">
						<Select
							size="small"
							value={rowsPerPage}
							onChange={(e) => {
								setRowsPerPage(Number(e.target.value));
								setPage(0);
							}}
							sx={{
								height: 24,
								fontSize: "0.75rem",
								bgcolor: alpha(theme.palette.background.default, 0.5),
							}}
						>
							{[10, 25, 50, 100].map((n) => (
								<MenuItem key={n} value={n}>
									{n}
								</MenuItem>
							))}
						</Select>
						<Typography
							variant="caption"
							color="text.secondary"
							fontSize="0.75rem"
						>
							/ {totalCount}
						</Typography>
					</Stack>
					<TablePagination
						component="div"
						count={totalCount}
						page={page}
						onPageChange={(_, p) => setPage(p)}
						rowsPerPage={rowsPerPage}
						rowsPerPageOptions={[]}
						labelDisplayedRows={() => null}
						sx={{ ".MuiTablePagination-toolbar": { minHeight: 30, pl: 0 } }}
					/>
				</Box>
			</Box>
		</Box>
	);
};
