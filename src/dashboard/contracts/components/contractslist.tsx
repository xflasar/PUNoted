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
	Explore,
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import { fetchClient } from "../../../utils/apiclient";
import ContractRow from "./contractrow";
import { formatCurrency, getStatusColor, getStatusBg } from "../helpers/helper";
import type { ContractListItem } from "../types";
import dayjs from "dayjs";

interface Props {
	category: "ALL" | "TRADE" | "SHIPMENT";
	onViewDetail: (id: string) => void;
}

const MobileContractCard = ({
	contract,
	onClick,
}: {
	contract: ContractListItem;
	onClick: () => void;
}) => {
	const theme = useTheme();

	const getIcon = () => {
		switch (contract.contracttype) {
			case "BUY":
				return <ArrowCircleLeft fontSize="small" color="success" />;
			case "SELL":
				return <ArrowCircleRight fontSize="small" color="warning" />;
			case "SHIPMENT_GIVEN":
			case "SHIPMENT_TAKEN":
				return <LocalShipping fontSize="small" color="info" />;
			case "LOAN_GIVEN":
			case "LOAN_TAKEN":
				return <AccountBalance fontSize="small" color="error" />;
			case "EXPLORATION":
				return <Explore fontSize="small" color="primary" />;
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
				background: alpha(theme.palette.background.default, 0.05),
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
					<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
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
					}}
				/>
			</Box>
			<Divider sx={{ opacity: 0.5 }} />

			<Box sx={{ display: "flex", justifyContent: "space-between" }}>
				<Box>
					<Typography
						variant="caption"
						color="text.secondary"
						sx={{ display: "block" }}
					>
						PARTNER
					</Typography>
					<Typography variant="body2" sx={{ fontWeight: 500 }}>
						{contract.partnername || "Unknown"}
					</Typography>
					<Typography
						variant="caption"
						color="text.secondary"
						sx={{ fontFamily: "monospace" }}
					>
						{contract.partnercode}
					</Typography>
				</Box>
				<Box sx={{ textAlign: "right" }}>
					<Typography
						variant="caption"
						color="text.secondary"
						sx={{ display: "block" }}
					>
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
							sx={{ fontWeight: "bold" }}
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
					sx={{
						fontFamily: "monospace",
						fontWeight: 700,
						fontSize: "1rem",
						color:
							contract.total_amount > 0
								? contract.is_income
									? "success.main"
									: "error.main"
								: "text.primary",
					}}
				>
					{contract.total_amount > 0 ? (contract.is_income ? "+" : "-") : ""}
					{formatCurrency(contract.total_amount, contract.currency)}
				</Typography>
			</Box>
		</Paper>
	);
};

// --- Main List Component ---
const ContractsList: React.FC<Props> = ({ category, onViewDetail }) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));

	const [contracts, setContracts] = useState<ContractListItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState("ALL");
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [totalCount, setTotalCount] = useState(0);

	useEffect(() => {
		const fetchList = async () => {
			setLoading(true);
			try {
				const res = await fetchClient("/internal/contracts/list", {
					method: "POST",
					body: JSON.stringify({
						category,
						status,
						search,
						page: page + 1,
						limit: rowsPerPage,
					}),
				});
				const data = await res.json();
				setContracts(data.items || []);
				setTotalCount(data.total || 0);
			} catch (err) {
				console.error("Failed to fetch contracts:", err);
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
					slotProps={{
						input: {
							startAdornment: (
								<InputAdornment position="start">
									<Search fontSize="small" />
								</InputAdornment>
							),
							style: { fontSize: "0.9rem" },
						},
					}}
				/>
				<Select
					size="small"
					value={status}
					onChange={(e) => setStatus(e.target.value)}
					displayEmpty
					startAdornment={
						<InputAdornment
							position="start"
							sx={{ pl: 1, color: "text.secondary" }}
						>
							<FilterList fontSize="small" />
						</InputAdornment>
					}
					sx={{
						minWidth: 150,
						fontSize: "0.9rem",
						bgcolor: theme.palette.background.default,
						"& .MuiSelect-select": {
							display: "flex",
							alignItems: "center",
							gap: 1,
						},
					}}
					MenuProps={{
						PaperProps: {
							sx: {
								bgcolor: theme.palette.background.default,
								backgroundImage: "none",
								border: `1px solid ${theme.palette.divider}`,
								"& .MuiMenuItem-root": {
									fontSize: "0.9rem",
								},
							},
						},
					}}
				>
					<MenuItem value="ALL">All Statuses</MenuItem>
					<MenuItem value="OPEN">OPEN</MenuItem>
					<MenuItem value="CLOSED">CLOSED</MenuItem>
					<MenuItem value="PARTIALLY_FULFILLED">PARTIALLY FULFILLED</MenuItem>
					<MenuItem value="FULFILLED">FULFILLED</MenuItem>
					<MenuItem value="CANCELLED">CANCELLED</MenuItem>
					<MenuItem value="TERMINATED">TERMINATED</MenuItem>
					<MenuItem value="BREACHED">BREACHED</MenuItem>
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
					<TableContainer
						sx={{ flexGrow: 1, overflowY: "auto", overflowX: "auto" }}
					>
						<Table
							stickyHeader
							size="small"
							sx={{ tableLayout: "fixed", width: "100%", minWidth: 600 }}
						>
							<TableHead>
								<TableRow sx={{ height: 35 }}>
									<TableCell sx={{ fontWeight: "bold", width: "25%" }}>
										Contract
									</TableCell>
									<TableCell sx={{ fontWeight: "bold", width: "15%" }}>
										Type
									</TableCell>
									<TableCell sx={{ fontWeight: "bold", width: "25%" }}>
										Partner
									</TableCell>
									<TableCell
										align="right"
										sx={{ fontWeight: "bold", width: "15%" }}
									>
										Value
									</TableCell>
									<TableCell
										align="right"
										sx={{ fontWeight: "bold", width: "20%" }}
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
						slotProps={{
							select: {
								MenuProps: {
									slotProps: {
										paper: {
											sx: {
												bgcolor: "background.default",
												backgroundImage: "none",
											},
										},
									},
								},
							},
						}}
						sx={{
							".MuiToolbar-root": { justifyContent: "center" },
							".MuiTablePagination-toolbar": { minHeight: 35, pl: 0, flex: 1 },
							".MuiTablePagination-spacer": { display: "none" },
							width: "100%",
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					/>
				</Box>
			</Paper>
		</Box>
	);
};

export default ContractsList;
