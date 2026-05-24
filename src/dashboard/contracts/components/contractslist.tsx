import React, { useState, useEffect } from "react";
import {
	Box,
	Paper,
	TextField,
	InputAdornment,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	TablePagination,
	TableContainer,
	CircularProgress,
	Select,
	MenuItem,
	Typography,
	useTheme,
	useMediaQuery,
	Stack,
	Chip,
	Divider,
} from "@mui/material";
import {
	Search,
	FilterList,
	ArrowCircleLeft,
	ArrowCircleRight,
	LocalShipping,
	AccountBalance,
	Handshake,
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import { API_BASE } from "../../settings/constants";
import ContractRow from "./contractrow";
import { formatCurrency, getStatusColor, getStatusBg } from "../helpers/helper";
import type { ContractListItem } from "../types";
import dayjs from "dayjs";

interface Props {
	category: "ALL" | "TRADE" | "SHIPMENT";
	onViewDetail: (id: string) => void;
}

// ... MobileContractCard Component (Same as before) ...
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
				background: alpha(theme.palette.background.tableCategory, 0.05),
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

// --- Main List Component ---
const ContractsList: React.FC<Props> = ({ category, onViewDetail }) => {
	const theme = useTheme();
	// Cards below 'sm' (600px)
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));

	const [contracts, setContracts] = useState<ContractListItem[]>([]);
	const [totalCount, setTotalCount] = useState(0);
	const [loading, setLoading] = useState(false);

	const [search, setSearch] = useState("");
	const [status, setStatus] = useState("ALL");
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(25);

	useEffect(() => {
		const fetchList = async () => {
			const token = localStorage.getItem("authToken");
			if (!token) return;
			setLoading(true);
			try {
				const res = await fetch(`${API_BASE}/contracts/list`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({
						category,
						status,
						search,
						page: page + 1,
						limit: rowsPerPage,
					}),
				});
				if (res.ok) {
					const data = await res.json();
					setContracts(data.items || []);
					setTotalCount(data.total || 0);
				}
			} finally {
				setLoading(false);
			}
		};
		const timer = setTimeout(fetchList, 300);
		return () => clearTimeout(timer);
	}, [category, status, search, page, rowsPerPage]);

	return (
		<Box
			sx={{
				p: isMobile ? 1 : 2,
				height: "100%",
				display: "flex",
				flexDirection: "column",
				gap: 2,
			}}
		>
			{/* Filter Bar */}
			<Paper
				sx={{
					p: 1,
					display: "flex",
					flexDirection: isMobile ? "column" : "row",
					gap: 1,
					alignItems: isMobile ? "stretch" : "center",
					background: alpha(theme.palette.background.default, 0.6),
					backdropFilter: "blur(10px)",
					border: `1px solid ${theme.palette.divider}`,
				}}
			>
				<TextField
					size="small"
					placeholder={`Search ${category.toLowerCase()}...`}
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					sx={{ flexGrow: 1 }}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<Search fontSize="small" />
							</InputAdornment>
						),
						style: { fontSize: "0.9rem" },
					}}
				/>
				<Select
					size="small"
					value={status}
					onChange={(e) => setStatus(e.target.value)}
					displayEmpty
					startAdornment={
						<InputAdornment position="start">
							<FilterList fontSize="small" />
						</InputAdornment>
					}
					sx={{
						minWidth: 150,
						fontSize: "0.9rem",
						bgcolor: theme.palette.background.default,
					}}
					MenuProps={{
						PaperProps: {
							sx: {
								background: theme.palette.background.default,
								"& .MuiMenuItem-root": { fontSize: "0.9rem" },
							},
						},
					}}
				>
					<MenuItem value="ALL">All Status</MenuItem>
					<MenuItem value="OPEN">Pending</MenuItem>
					<MenuItem value="CLOSED">Active</MenuItem>
					<MenuItem value="PARTIALLY_FULFILLED">PARTIALLY FULFILLED</MenuItem>
					<MenuItem value="FULFILLED">Finished</MenuItem>
					<MenuItem value="BREACHED">Breached</MenuItem>
				</Select>
			</Paper>

			{/* List Area */}
			<Paper
				sx={{
					flexGrow: 1,
					display: "flex",
					flexDirection: "column",
					background: alpha(theme.palette.background.default, 0.4),
					backdropFilter: "blur(10px)",
					border: `1px solid ${theme.palette.divider}`,
					overflow: "hidden",
				}}
			>
				{isMobile ? (
					// MOBILE CARDS
					<Box sx={{ flexGrow: 1, overflowY: "auto", p: 1 }}>
						{loading ? (
							<Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
								<CircularProgress />
							</Box>
						) : contracts.length === 0 ? (
							<Box sx={{ textAlign: "center", p: 5, color: "text.secondary" }}>
								No contracts found.
							</Box>
						) : (
							contracts.map((c) => (
								<MobileContractCard
									key={c.id}
									contract={c}
									onClick={() => onViewDetail(c.id)}
								/>
							))
						)}
					</Box>
				) : (
					// DESKTOP/TABLET TABLE
					<TableContainer sx={{ flexGrow: 1, overflowY: "auto" }}>
						<Table
							stickyHeader
							size="small"
							sx={{ tableLayout: "fixed", width: "100%", minWidth: 600 }}
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
								{loading ? (
									<TableRow>
										<TableCell colSpan={5} align="center" sx={{ py: 10 }}>
											<CircularProgress />
										</TableCell>
									</TableRow>
								) : contracts.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={5}
											align="center"
											sx={{ py: 5, color: "text.secondary" }}
										>
											No contracts found.
										</TableCell>
									</TableRow>
								) : (
									contracts.map((c) => (
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

				<Box
					sx={{
						p: 1,
						borderTop: `1px solid ${theme.palette.divider}`,
						bgcolor: alpha(theme.palette.background.default, 0.5),
					}}
				>
					<TablePagination
						component="div"
						count={totalCount}
						page={page}
						onPageChange={(_, p) => setPage(p)}
						rowsPerPage={rowsPerPage}
						onRowsPerPageChange={(e) => {
							setRowsPerPage(parseInt(e.target.value, 10));
							setPage(0);
						}}
						labelDisplayedRows={({ from, to, count }) =>
							`${from}-${to} of ${count}`
						}
						sx={{ ".MuiTablePagination-toolbar": { minHeight: 35, pl: 0 } }}
					/>
				</Box>
			</Paper>
		</Box>
	);
};

export default ContractsList;
