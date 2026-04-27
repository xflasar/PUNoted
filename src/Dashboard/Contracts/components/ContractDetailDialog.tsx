import React, { useEffect, useState } from "react";
import {
	Dialog,
	DialogContent,
	IconButton,
	Typography,
	Box,
	Chip,
	Divider,
	CircularProgress,
	useTheme,
	useMediaQuery,
	Paper,
	Avatar,
	Stack,
	Tooltip,
	Grid,
} from "@mui/material";
import {
	Close,
	CalendarToday,
	MonetizationOn,
	Inventory2,
	Assignment,
	AccessTime,
	CheckCircleOutline,
	RadioButtonUnchecked,
	Description,
	AttachMoney,
	TrendingUp,
	PieChart,
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import { API_BASE } from "../../settings/constants";
import { formatCurrency, getStatusColor, getStatusBg } from "../helpers/helper";
import dayjs from "dayjs";

// --- Types ---
interface Condition {
	id: string;
	index: number;
	type: string;
	status: string;
	// General
	amountmoney?: number;
	currencymoney?: string;
	material_summary?: string;
	deadline?: string;
	// Loan Specific
	repaymentamount?: number;
	interestamount?: number;
	totalamount?: number;
	currency?: string; // Fallback currency for loan calc
}

interface ContractDetailData {
	id: string;
	localid: string;
	name?: string;
	status: string;
	contracttype: string;
	partnername: string;
	partnercode: string;
	date: string;
	preamble?: string;
	total_amount: number;
	currency: string;
	conditions: Condition[];
}

interface Props {
	open: boolean;
	contractId: string | null;
	onClose: () => void;
}

// --- Compact Condition Card ---
const ConditionItem = ({
	condition,
	contractCurrency,
}: {
	condition: Condition;
	contractCurrency: string;
}) => {
	const theme = useTheme();

	// Logic to determine type
	const isMoney = !!condition.amountmoney || !!condition.repaymentamount;
	const isMaterial = !!condition.material_summary;
	const isDone = condition.status === "FULFILLED";
	const isLoanCondition =
		condition.repaymentamount !== undefined ||
		condition.interestamount !== undefined;

	// Currency Resolver
	const curr =
		condition.currencymoney || condition.currency || contractCurrency;

	return (
		<Paper
			elevation={0}
			sx={{
				p: 0.5,
				mb: 0.5,
				border: `1px solid ${theme.palette.divider}`,
				bgcolor: isDone
					? alpha(theme.palette.success.main, 0.04)
					: "background.paper",
				display: "flex",
				alignItems: "center",
				gap: 1,
				transition: "all 0.1s",
				"&:hover": { bgcolor: alpha(theme.palette.action.hover, 0.1) },
			}}
		>
			{/* 1. Index */}
			<Typography variant="caption" color="text.secondary" fontWeight={700}>
				#{condition.index}
			</Typography>

			{/* 2. Icon */}
			<Avatar
				variant="rounded"
				sx={{
					bgcolor: isMoney
						? alpha(theme.palette.success.main, 0.1)
						: alpha(theme.palette.info.main, 0.1),
					color: isMoney ? theme.palette.success.main : theme.palette.info.main,
					width: 32,
					height: 32,
				}}
			>
				{isMoney ? (
					<MonetizationOn sx={{ fontSize: 18 }} />
				) : isMaterial ? (
					<Inventory2 sx={{ fontSize: 18 }} />
				) : (
					<Assignment sx={{ fontSize: 18 }} />
				)}
			</Avatar>

			{/* 3. Main Content Area */}
			<Box sx={{ flex: 1 }}>
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						mb: isLoanCondition ? 1 : 0,
					}}
				>
					<Typography variant="body2" fontWeight={700}>
						{condition.type.replace(/_/g, " ")}
					</Typography>

					{/* Standard Amount (Non-Loan) */}
					{!isLoanCondition && condition.amountmoney && (
						<Typography variant="body2" fontFamily="monospace" fontWeight={600}>
							{formatCurrency(condition.amountmoney, curr)}
						</Typography>
					)}

					{/* Material Summary */}
					{isMaterial && (
						<Typography variant="caption" color="text.secondary">
							{condition.material_summary}
						</Typography>
					)}
				</Box>

				{/* LOAN SPECIFIC DATA GRID */}
				{isLoanCondition && (
					<Box
						sx={{
							display: "flex",
							gap: 2,
							flexDirection: "row",
							justifyContent: "space-between",
							bgcolor: alpha(theme.palette.background.default, 0.5),
							p: 1,
							borderRadius: 1,
							border: `1px dashed ${theme.palette.divider}`,
							fontSize: "0.9rem",
						}}
					>
						{condition.amountmoney && (
							<Box>
								<Typography
									variant="caption"
									display="block"
									color="text.secondary"
									fontSize="0.7rem"
								>
									PRINCIPAL
								</Typography>
								<Typography
									variant="caption"
									fontFamily="monospace"
									fontWeight={400}
								>
									{formatCurrency(condition.amountmoney, curr)}
								</Typography>
							</Box>
						)}
						{condition.interestamount !== undefined && (
							<Box>
								<Typography
									variant="caption"
									display="block"
									color="text.secondary"
									fontSize="0.7rem"
								>
									INTEREST
								</Typography>
								<Stack direction="row" spacing={0.5} alignItems="center">
									<Typography
										variant="caption"
										fontFamily="monospace"
										fontWeight={400}
										color="success.main"
									>
										+{formatCurrency(condition.interestamount, curr)}
									</Typography>
								</Stack>
							</Box>
						)}
						{condition.repaymentamount !== undefined && (
							<Box>
								<Typography
									variant="caption"
									display="block"
									color="text.secondary"
									fontSize="0.7rem"
								>
									BASE REPAYMENT
								</Typography>
								<Typography
									variant="caption"
									fontFamily="monospace"
									fontWeight={400}
								>
									{formatCurrency(condition.repaymentamount, curr)}
								</Typography>
							</Box>
						)}
						{condition.totalamount !== undefined && (
							<Box>
								<Typography
									variant="caption"
									display="block"
									color="text.secondary"
									fontSize="0.7rem"
								>
									TOTAL REPAYMENT
								</Typography>
								<Typography
									variant="caption"
									fontFamily="monospace"
									fontWeight={800}
								>
									{formatCurrency(condition.totalamount, curr)}
								</Typography>
							</Box>
						)}
					</Box>
				)}
			</Box>

			{/* 4. Deadline */}
			{condition.deadline && (
				<Chip
					icon={<AccessTime sx={{ fontSize: "10px !important" }} />}
					label={dayjs(condition.deadline).format("MMM DD HH:MM")}
					size="small"
					variant="outlined"
					sx={{
						height: 32,
						fontSize: "0.75rem",
						border: "none",
						bgcolor: alpha(theme.palette.warning.main, 0.1),
						color: theme.palette.warning.main,
					}}
				/>
			)}

			{/* 5. Checkbox Status */}
			{isDone ? (
				<CheckCircleOutline fontSize="small" color="success" />
			) : (
				<RadioButtonUnchecked fontSize="small" color="disabled" />
			)}
		</Paper>
	);
};

// --- Main Dialog ---
const ContractDetailDialog: React.FC<Props> = ({
	open,
	contractId,
	onClose,
}) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));
	const [data, setData] = useState<ContractDetailData | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (open && contractId) {
			setLoading(true);
			const token = localStorage.getItem("authToken");
			fetch(`${API_BASE}/contracts/detail?contract_id=${contractId}`, {
				headers: { Authorization: `Bearer ${token}` },
			})
				.then((res) => res.json())
				.then((json) =>
					setData(
						json.contract
							? { ...json.contract, conditions: json.conditions }
							: json,
					),
				)
				.catch(console.error)
				.finally(() => setLoading(false));
		} else {
			setData(null);
		}
	}, [open, contractId]);

	if (!contractId) return null;
	const c = data;

	return (
		<Dialog
			open={open}
			onClose={onClose}
			fullScreen={isMobile}
			maxWidth="lg"
			fullWidth
			PaperProps={{
				sx: {
					bgcolor: theme.palette.background.default,
					backgroundImage: "none",
					borderRadius: isMobile ? 0 : 2,
					height: isMobile ? "100%" : "80vh",
				},
			}}
		>
			{/* 1. SLIM HEADER */}
			<Box
				sx={{
					bgcolor: theme.palette.primary.main,
					color: "primary.contrastText",
					p: 1,
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<Stack direction="row" alignItems="center" spacing={2}>
					<Assignment />
					<Box>
						<Typography variant="subtitle1" fontWeight={800} lineHeight={1.1}>
							{c?.name || "Contract Details"}
						</Typography>
						<Typography variant="caption" sx={{ opacity: 0.8 }}>
							{c?.localid} • {c?.contracttype}
						</Typography>
					</Box>
				</Stack>
				<IconButton
					onClick={onClose}
					size="small"
					sx={{ color: "inherit", bgcolor: "rgba(0,0,0,0.1)" }}
				>
					<Close />
				</IconButton>
			</Box>

			<DialogContent
				sx={{ p: 0, display: "flex", flexDirection: "column", height: "100%" }}
			>
				{loading || !c ? (
					<Box
						sx={{
							flex: 1,
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
						}}
					>
						<CircularProgress />
					</Box>
				) : (
					<Box
						sx={{
							flex: 1,
							display: "flex",
							flexDirection: "column",
							p: 2,
							gap: 2,
						}}
					>
						{/* 2. INFO BAR (Space Between Alignment) */}
						<Paper
							variant="outlined"
							sx={{
								p: 1.5,
								bgcolor: alpha(theme.palette.background.default, 0.5),
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								flexWrap: "wrap",
								gap: 1,
							}}
						>
							{/* Value */}
							<Box
								sx={{
									flex: 1,
									minWidth: "fit-content",
									justifyContent: "center",
								}}
							>
								<Typography
									variant="caption"
									color="text.secondary"
									fontWeight={700}
								>
									TOTAL VALUE
								</Typography>
								<Stack direction="row" spacing={0.5} alignItems="center">
									<Typography
										variant="h6"
										fontFamily="monospace"
										fontWeight={700}
										lineHeight={1}
									>
										{formatCurrency(c.total_amount || 0, c.currency || "ICA")}
									</Typography>
								</Stack>
							</Box>

							<Divider orientation="vertical" flexItem />

							{/* Partner */}
							<Box sx={{ flex: 1, minWidth: "fit-content" }}>
								<Typography
									variant="caption"
									color="text.secondary"
									fontWeight={700}
								>
									PARTNER
								</Typography>
								<Stack direction="row" spacing={1} alignItems="center">
									<Avatar
										sx={{
											width: 20,
											height: 20,
											fontSize: 10,
											bgcolor: theme.palette.secondary.main,
										}}
									>
										{c.partnercode ? c.partnercode.substring(0, 2) : "?"}
									</Avatar>
									<Box>
										<Typography variant="body2" fontWeight={700} lineHeight={1}>
											{c.partnername}
										</Typography>
										<Typography
											variant="caption"
											color="text.secondary"
											fontFamily="monospace"
										>
											{c.partnercode}
										</Typography>
									</Box>
								</Stack>
							</Box>

							<Divider orientation="vertical" flexItem />

							{/* Status */}
							<Box sx={{ flex: 1, minWidth: "fit-content" }}>
								<Typography
									variant="caption"
									color="text.secondary"
									fontWeight={700}
								>
									STATUS
								</Typography>
								<Chip
									label={c.status}
									size="small"
									sx={{
										height: 20,
										fontSize: "0.65rem",
										fontWeight: 800,
										mt: 0.5,
										display: "flex",
										width: "fit-content",
										bgcolor: getStatusBg(c.status, theme),
										color: getStatusColor(c.status, theme),
									}}
								/>
							</Box>

							<Divider orientation="vertical" flexItem />

							{/* Date */}
							<Box
								sx={{ flex: 1, minWidth: "fit-content", textAlign: "right" }}
							>
								<Typography
									variant="caption"
									color="text.secondary"
									fontWeight={700}
								>
									DATE
								</Typography>
								<Stack
									direction="row"
									spacing={0.5}
									alignItems="center"
									justifyContent="flex-end"
								>
									<CalendarToday
										fontSize="inherit"
										sx={{ fontSize: 14, color: "text.secondary" }}
									/>
									<Typography variant="body2" fontWeight={600}>
										{dayjs(c.date).format("MMM D, YYYY")}
									</Typography>
								</Stack>
							</Box>
						</Paper>

						{/* 3. PREAMBLE (Conditional) */}
						{c.preamble && (
							<Paper
								variant="outlined"
								sx={{
									p: 1,
									bgcolor: alpha(theme.palette.info.main, 0.05),
									border: `1px dashed ${alpha(theme.palette.info.main, 0.3)}`,
								}}
							>
								<Stack direction="row" spacing={1}>
									<Description
										fontSize="small"
										color="info"
										sx={{ opacity: 0.7 }}
									/>
									<Typography
										variant="body2"
										sx={{
											fontStyle: "italic",
											fontSize: "0.8rem",
											color: "text.secondary",
										}}
									>
										{c.preamble}
									</Typography>
								</Stack>
							</Paper>
						)}

						{/* 4. CONDITIONS LIST */}
						<Box sx={{ flex: 1, overflowY: "auto", pr: 0.5 }}>
							<Box
								sx={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									mb: 1,
								}}
							>
								<Typography
									variant="caption"
									color="text.secondary"
									fontWeight={800}
								>
									CONDITIONS ({c.conditions?.length || 0})
								</Typography>
							</Box>

							{!c.conditions || c.conditions.length === 0 ? (
								<Typography
									variant="body2"
									color="text.secondary"
									fontStyle="italic"
								>
									No conditions.
								</Typography>
							) : (
								c.conditions.map((cond) => (
									<ConditionItem
										key={cond.id}
										condition={cond}
										contractCurrency={c.currency}
									/>
								))
							)}
						</Box>
					</Box>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default ContractDetailDialog;
