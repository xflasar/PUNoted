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
import { useGlobalData } from "../../../context/globaldatacontext";
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

	const hasAmount =
		contract.total_amount !== undefined && contract.total_amount !== null && contract.total_amount !== 0;
	const isPositive = contract.contracttype === "SELL" || contract.contracttype === "LOAN_TAKEN";
	const isNegative = contract.contracttype === "BUY" || contract.contracttype === "LOAN_GIVEN";
	const sign = isPositive ? "+" : isNegative ? "-" : "";
	const amountColor = isPositive
		? theme.palette.success.main
		: isNegative
			? theme.palette.error.main
			: theme.palette.text.primary;

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
						color: amountColor,
					}}
				>
					{sign}
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
	const [rowsPerPage, setRowsPerPage] = useState(25);
	const [totalCount, setTotalCount] = useState(0);

	const { dashboardData } = useGlobalData();

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
				if (res.ok) {
					const data = await res.json();
					const rawItems = data.items || [];
					const seen = new Set();
					const uniqueItems = rawItems.filter((item: any) => {
						const key = item.id || item.localid;
						if (!key) return true;
						if (seen.has(key)) return false;
						seen.add(key);
						return true;
					});
					setContracts(uniqueItems);
					setTotalCount(data.total !== undefined ? data.total : uniqueItems.length);
				}
			} catch (err) {
				console.error("Failed to fetch contracts:", err);
			} finally {
				setLoading(false);
			}
		};
		const timer = setTimeout(fetchList, 300);
		return () => clearTimeout(timer);
	}, [category, status, search, page, rowsPerPage, dashboardData]);

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
				elevation={0}
				sx={{
					p: 1.5,
					display: "flex",
					flexDirection: isMobile ? "column" : "row",
					gap: 1.5,
					alignItems: isMobile ? "stretch" : "center",
					bgcolor: "rgba(4, 4, 10, 0.75)",
					border: "1px solid rgba(123, 104, 238, 0.2)",
					borderRadius: "14px",
					boxShadow: "0 0 30px rgba(123, 104, 238, 0.08)",
					backdropFilter: "blur(20px)",
				}}
			>
				<TextField
					size="small"
					placeholder={`Search ${category.toLowerCase()}...`}
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					sx={{
						flexGrow: 1,
						"& .MuiOutlinedInput-root": {
							bgcolor: "rgba(2, 2, 8, 0.6)",
							borderRadius: "10px",
							border: "1px solid rgba(123, 104, 238, 0.2)",
							"&:hover fieldset": { borderColor: "rgba(123, 104, 238, 0.4)" },
							"&.Mui-focused fieldset": { borderColor: "#7b68ee" },
						},
					}}
					slotProps={{
						input: {
							startAdornment: (
								<InputAdornment position="start">
									<Search fontSize="small" sx={{ color: "rgba(255,255,255,0.6)" }} />
								</InputAdornment>
							),
							style: { fontSize: "0.85rem", color: "#ffffff" },
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
							sx={{ pl: 1, color: "rgba(255,255,255,0.6)" }}
						>
							<FilterList fontSize="small" />
						</InputAdornment>
					}
					sx={{
						minWidth: 160,
						fontSize: "0.85rem",
						bgcolor: "rgba(2, 2, 8, 0.6)",
						borderRadius: "10px",
						border: "1px solid rgba(123, 104, 238, 0.2)",
						color: "#ffffff",
						"& .MuiSelect-select": {
							display: "flex",
							alignItems: "center",
							gap: 1,
						},
					}}
					MenuProps={{
						slotProps: {
							paper: {
								sx: {
									bgcolor: "#080816",
									backgroundImage: "none",
									border: "1px solid rgba(123, 104, 238, 0.3)",
									color: "#ffffff",
									"& .MuiMenuItem-root": {
										fontSize: "0.85rem",
										"&:hover": { bgcolor: "rgba(123, 104, 238, 0.15)" },
										"&.Mui-selected": { bgcolor: "rgba(123, 104, 238, 0.25)" },
									},
								},
							}
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
				elevation={0}
				sx={{
					flexGrow: 1,
					display: "flex",
					flexDirection: "column",
					bgcolor: "rgba(4, 4, 10, 0.75)",
					border: "1px solid rgba(123, 104, 238, 0.2)",
					borderRadius: "16px",
					boxShadow: "0 0 30px rgba(123, 104, 238, 0.08)",
					backdropFilter: "blur(20px)",
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
									Array.from({ length: 6 }).map((_, i) => (
										<ContractRow key={`skel-${i}`} loading={true} />
									))
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
						rowsPerPageOptions={[25, 50, 100, 250]}
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
