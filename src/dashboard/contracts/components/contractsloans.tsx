import { fetchClient } from "../../../utils/apiclient";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
	Box,
	Typography,
	Paper,
	CircularProgress,
	useTheme,
	Chip,
	TextField,
	InputAdornment,
	Tabs,
	Tab,
	Checkbox,
	FormControlLabel,
	FormGroup,
	ToggleButtonGroup,
	ToggleButton,
} from "@mui/material";
import { Search, History, Update } from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import dayjs from "dayjs";
import { MOCK_LOANS } from "../mockdata";
import LoanOutlook from "./loanoutlook";
import LoanTicket from "./loanticket";
import MetricPill from "./metricpill";

// --- CONSTANTS ---
// Split statuses into two buckets
const STATUS_BUCKETS = {
	CURRENT: ["OPEN", "PARTIALLY_FULFILLED", "BREACHED"],
	HISTORY: ["FULFILLED", "CLOSED", "VOID"], // Excludes REJECTED, TERMINATED
};

// Priority Map for Sorting (Lower index = higher priority)
const STATUS_PRIORITY_MAP: Record<string, number> = {
	BREACHED: 0,
	"BREACHED (EXTENDED)": 1,
	OVERDUE: 2,
	PARTIALLY_FULFILLED: 3,
	OPEN: 4,
	CLOSED: 5,
	FULFILLED: 6,
	VOID: 7,
};

interface ExtendedContract {
	id: string;
	partnername?: string;
	localid?: string;
	contracttype: string;
	status: string;
	total_amount: number;
	duedate?: string;
	date: string;
	extension_deadline?: string;
	[key: string]: any;
}

interface DashboardMetrics {
	totalGiven: number;
	totalTaken: number;
	netPosition: number;
}

const ContractsLoans: React.FC<{ onViewDetail: (id: string) => void }> = ({
	onViewDetail,
}) => {
	const theme = useTheme();
	const isMobile = window.innerWidth < 900;

	// --- STATE ---
	const [allLoans, setAllLoans] = useState<ExtendedContract[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");

	// View Controls
	const [viewMode, setViewMode] = useState<"CURRENT" | "HISTORY">("CURRENT");
	const [mobileListTab, setMobileListTab] = useState(0); // 0 = Assets, 1 = Liabilities (Mobile only)

	// Filters (checkboxes)
	// Initialize with all valid statuses for the current view mode
	const [selectedStatuses, setSelectedStatuses] = useState<string[]>(
		STATUS_BUCKETS.CURRENT,
	);

	const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
		try {
			return JSON.parse(localStorage.getItem("loan_pinned_contracts") || "[]");
		} catch {
			return [];
		}
	});

	// --- HANDLERS ---
	const handleTogglePin = useCallback((id: string, e: React.MouseEvent) => {
		e.stopPropagation();
		setPinnedIds((prev) => {
			const newPinned = prev.includes(id)
				? prev.filter((p) => p !== id)
				: [...prev, id];
			localStorage.setItem("loan_pinned_contracts", JSON.stringify(newPinned));
			return newPinned;
		});
	}, []);

	const handleViewDetail = useCallback(
		(id: string) => {
			onViewDetail(id);
		},
		[onViewDetail],
	);

	const handleStatusChange = useCallback((status: string, checked: boolean) => {
		setSelectedStatuses((prev) =>
			checked ? [...prev, status] : prev.filter((s) => s !== status),
		);
	}, []);

	const handleViewModeChange = (
		event: React.MouseEvent<HTMLElement>,
		newMode: "CURRENT" | "HISTORY" | null,
	) => {
		if (newMode !== null) {
			setViewMode(newMode);
			// Reset filters to default for that mode
			setSelectedStatuses(STATUS_BUCKETS[newMode]);
		}
	};

	// --- FETCH ---
	useEffect(() => {
		const fetchLoans = async () => {
			setLoading(true);
			try {
				const res = await fetchClient("/internal/contracts/loans?status=ALL", {
					method: "POST",
					body: JSON.stringify({
						category: "LOAN",
						search: search,
						page: 1,
						limit: 500,
					}),
				});
				if (res.ok) {
					const data = await res.json();
					setAllLoans(data.items || []);
				} else {
					setAllLoans(MOCK_LOANS as any);
				}
			} catch (error) {
				console.error("Failed to fetch loans", error);
				setAllLoans(MOCK_LOANS as any);
			} finally {
				setLoading(false);
			}
		};
		const timer = setTimeout(fetchLoans, 300);
		return () => clearTimeout(timer);
	}, [search]);

	// --- DATA PROCESSING ---
	const { loansGiven, loansTaken, stats, availableStatuses } = useMemo(() => {
		// 1. Filter by View Mode (Current vs History)
		const bucket = STATUS_BUCKETS[viewMode];
		const modeFiltered = allLoans.filter((c) => bucket.includes(c.status));

		// 2. Filter by Search & Selection
		const finalFiltered = modeFiltered.filter((c) => {
			// Search Text
			const matchText =
				(c.partnername || "").toLowerCase().includes(search.toLowerCase()) ||
				(c.localid || "").toLowerCase().includes(search.toLowerCase());
			if (!matchText) return false;

			// Status Checkbox
			// Handle "OVERDUE" logic if we want a virtual status check,
			// but for now we map direct DB statuses.
			return selectedStatuses.includes(c.status);
		});

		// 3. Sort
		const sorted = [...finalFiltered].sort((a, b) => {
			// Priority A: Pinned
			const aPinned = pinnedIds.includes(a.id);
			const bPinned = pinnedIds.includes(b.id);
			if (aPinned && !bPinned) return -1;
			if (!aPinned && bPinned) return 1;

			// Priority B: Overdue
			const aOverdue =
				a.duedate &&
				dayjs(a.duedate).isBefore(dayjs()) &&
				a.status !== "FULFILLED";
			const bOverdue =
				b.duedate &&
				dayjs(b.duedate).isBefore(dayjs()) &&
				b.status !== "FULFILLED";
			if (aOverdue && !bOverdue) return -1;
			if (!aOverdue && bOverdue) return 1;

			// Priority C: Liabilities (Earliest Due Date)
			if (a.contracttype === "LOAN_TAKEN" && b.contracttype === "LOAN_TAKEN") {
				const dateA = dayjs(a.duedate || "2099-01-01");
				const dateB = dayjs(b.duedate || "2099-01-01");
				if (!dateA.isSame(dateB)) return dateA.diff(dateB);
			}

			// Priority D: Status Priority
			const getSortStatus = (contract: ExtendedContract, isOvd: boolean) => {
				if (isOvd) return "OVERDUE";
				return contract.status;
			};
			const aStat = getSortStatus(a, aOverdue);
			const bStat = getSortStatus(b, bOverdue);

			return (
				(STATUS_PRIORITY_MAP[aStat] ?? 99) - (STATUS_PRIORITY_MAP[bStat] ?? 99)
			);
		});

		// 4. Calculate Stats (Only for visible loans in this tab)
		const metrics: DashboardMetrics = sorted.reduce(
			(acc, loan) => {
				const isGiven = loan.contracttype === "LOAN_GIVEN";
				if (isGiven) acc.totalGiven += loan.total_amount;
				else acc.totalTaken += loan.total_amount;
				return acc;
			},
			{ totalGiven: 0, totalTaken: 0, netPosition: 0 },
		);
		metrics.netPosition = metrics.totalGiven - metrics.totalTaken;

		return {
			loansGiven: sorted.filter((c) => c.contracttype === "LOAN_GIVEN"),
			loansTaken: sorted.filter((c) => c.contracttype === "LOAN_TAKEN"),
			stats: metrics,
			availableStatuses: STATUS_BUCKETS[viewMode], // For the checkbox list
		};
	}, [allLoans, search, pinnedIds, selectedStatuses, viewMode]);

	if (loading)
		return (
			<Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
				<CircularProgress />
			</Box>
		);

	return (
		<Box
			sx={{
				height: "100%",
				display: "flex",
				flexDirection: "column",
				overflow: "hidden",
				p: 1,
				gap: 1,
			}}
		>
			{/* --- Header & Filters --- */}
			<Paper
				elevation={0}
				sx={{
					p: 1,
					mb: 0.5,
					border: `1px solid ${theme.palette.divider}`,
					bgcolor: alpha(theme.palette.background.default, 0.6),
					borderRadius: 1.5,
				}}
			>
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						flexWrap: "wrap",
						gap: 2,
					}}
				>
					{/* Left: Title & Mode Switch */}
					<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
						<Typography
							variant="h6"
							fontWeight={900}
							color="primary.main"
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 1,
								minWidth: 150,
							}}
						>
							LOAN MANAGER
						</Typography>
						<ToggleButtonGroup
							value={viewMode}
							exclusive
							onChange={handleViewModeChange}
							size="small"
							sx={{ height: 32 }}
						>
							<ToggleButton value="CURRENT" sx={{ fontWeight: 700, px: 2 }}>
								<Update sx={{ fontSize: 16, mr: 1 }} /> CURRENT
							</ToggleButton>
							<ToggleButton value="HISTORY" sx={{ fontWeight: 700, px: 2 }}>
								<History sx={{ fontSize: 16, mr: 1 }} /> HISTORY
							</ToggleButton>
						</ToggleButtonGroup>
					</Box>

					{/* Right: Filters & Search */}
					<Box
						sx={{
							flex: 1,
							display: "flex",
							alignItems: "center",
							justifyContent: "flex-end",
							flexWrap: "wrap",
							gap: 2,
						}}
					>
						{/* Status Checkboxes */}
						<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
							<Typography
								variant="caption"
								color="text.secondary"
								fontWeight={700}
								sx={{ mr: 1, display: { xs: "none", md: "block" } }}
							>
								FILTER:
							</Typography>
							<FormGroup row>
								{availableStatuses.map((status) => (
									<FormControlLabel
										key={status}
										control={
											<Checkbox
												checked={selectedStatuses.includes(status)}
												onChange={(e) =>
													handleStatusChange(status, e.target.checked)
												}
												size="small"
												sx={{ p: 0.5 }}
											/>
										}
										label={
											<Typography
												variant="caption"
												fontWeight={600}
												color={
													selectedStatuses.includes(status)
														? "text.primary"
														: "text.disabled"
												}
											>
												{status}
											</Typography>
										}
										sx={{ mr: 1.5, ml: 0 }}
									/>
								))}
							</FormGroup>
						</Box>

						<TextField
							size="small"
							placeholder="Search..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							sx={{
								width: 180,
								"& .MuiInputBase-root": { fontSize: "0.85rem" },
							}}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<Search sx={{ fontSize: 18 }} />
									</InputAdornment>
								),
							}}
						/>
					</Box>
				</Box>
			</Paper>

			{/* --- Dashboard (Only for Current View) --- */}
			{!isMobile && viewMode === "CURRENT" && (
				<LoanOutlook loans={loansGiven.concat(loansTaken)} />
			)}

			{/* --- High Level Metrics --- */}
			<Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 1 }}>
				<MetricPill
					label="TOTAL ASSETS"
					value={stats.totalGiven}
					color="success"
					sub="Incoming loans repayments"
				/>
				<MetricPill
					label="TOTAL LIABILITIES"
					value={stats.totalTaken}
					color="error"
					sub="Outgoing debt repayments"
				/>
				<MetricPill
					label="NET POSITION"
					value={stats.netPosition}
					color={stats.netPosition >= 0 ? "primary" : "warning"}
					sub="Assets - Liabilities"
				/>
			</Box>

			{/* --- Mobile Tabs (Assets vs Liabilities) --- */}
			{isMobile && (
				<Paper
					square
					elevation={0}
					sx={{
						borderBottom: 1,
						borderColor: "divider",
						bgcolor: "background.default",
						minHeight: 40,
					}}
				>
					<Tabs
						value={mobileListTab}
						onChange={(e, v) => setMobileListTab(v)}
						variant="fullWidth"
						indicatorColor="primary"
						textColor="primary"
					>
						<Tab
							label={`Assets (${loansGiven.length})`}
							sx={{ fontWeight: 700 }}
						/>
						<Tab
							label={`Debts (${loansTaken.length})`}
							sx={{ fontWeight: 700 }}
						/>
					</Tabs>
				</Paper>
			)}

			{/* --- Main List Columns --- */}
			<Box
				sx={{
					flexGrow: 1,
					overflowY: "hidden",
					display: "flex",
					flexDirection: "row",
					gap: 2,
				}}
			>
				{/* Assets Column */}
				{(!isMobile || mobileListTab === 0) && (
					<Paper
						sx={{
							flex: 1,
							display: "flex",
							flexDirection: "column",
							overflow: "hidden",
							bgcolor: alpha(theme.palette.background.default, 0.4),
							border: `1px solid ${theme.palette.divider}`,
							borderRadius: 2,
						}}
					>
						<Box
							sx={{
								p: 1.5,
								bgcolor: alpha(theme.palette.success.main, 0.08),
								borderBottom: `1px solid ${theme.palette.divider}`,
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
							}}
						>
							<Typography
								variant="subtitle2"
								fontWeight={800}
								color="success.main"
							>
								ASSETS (LENDING)
							</Typography>
							<Chip
								label={loansGiven.length}
								size="small"
								color="success"
								sx={{ height: 20, fontWeight: 800 }}
							/>
						</Box>
						<Box sx={{ flex: 1, overflowY: "auto", p: 0.5 }}>
							{loansGiven.map((c) => (
								<LoanTicket
									key={c.id}
									contract={c}
									isLender={true}
									isPinned={pinnedIds.includes(c.id)}
									onTogglePin={handleTogglePin}
									onClick={handleViewDetail}
								/>
							))}
							{loansGiven.length === 0 && (
								<Typography
									variant="caption"
									color="text.secondary"
									sx={{ display: "block", textAlign: "center", mt: 4 }}
								>
									No contracts found.
								</Typography>
							)}
						</Box>
					</Paper>
				)}

				{/* Liabilities Column */}
				{(!isMobile || mobileListTab === 1) && (
					<Paper
						sx={{
							flex: 1,
							display: "flex",
							flexDirection: "column",
							overflow: "hidden",
							bgcolor: alpha(theme.palette.background.default, 0.4),
							border: `1px solid ${theme.palette.divider}`,
							borderRadius: 2,
						}}
					>
						<Box
							sx={{
								p: 1.5,
								bgcolor: alpha(theme.palette.error.main, 0.08),
								borderBottom: `1px solid ${theme.palette.divider}`,
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
							}}
						>
							<Typography
								variant="subtitle2"
								fontWeight={800}
								color="error.main"
							>
								LIABILITIES (BORROWING)
							</Typography>
							<Chip
								label={loansTaken.length}
								size="small"
								color="error"
								sx={{ height: 20, fontWeight: 800 }}
							/>
						</Box>
						<Box sx={{ flex: 1, overflowY: "auto", p: 0.5 }}>
							{loansTaken.map((c) => (
								<LoanTicket
									key={c.id}
									contract={c}
									isLender={false}
									isPinned={pinnedIds.includes(c.id)}
									onTogglePin={handleTogglePin}
									onClick={handleViewDetail}
								/>
							))}
							{loansTaken.length === 0 && (
								<Typography
									variant="caption"
									color="text.secondary"
									sx={{ display: "block", textAlign: "center", mt: 4 }}
								>
									No contracts found.
								</Typography>
							)}
						</Box>
					</Paper>
				)}
			</Box>
		</Box>
	);
};

export { ContractsLoans };
