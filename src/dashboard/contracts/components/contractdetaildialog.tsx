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
	CheckCircleOutlined,
	RadioButtonUnchecked,
	Description,
	AttachMoney,
	TrendingUp,
	PieChart,
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import { fetchClient } from "../../../utils/apiClient";
import MaterialBadge from "../../../cosm/components/materialbadge";
import { formatCurrency, getStatusColor, getStatusBg } from "../helpers/helper";
import dayjs from "dayjs";

// --- Types ---
interface Condition {
	id: string;
	type: string;
	status: string;
	index: number;
	party?: string;
	deadline?: string;
	amountmoney?: number;
	currencymoney?: string;
	interestamount?: number;
	currency?: string;
	repaymentamount?: number;
	totalamount?: number;
	implied_interest_rate?: number;
	material_summary?: string;
	addresssystemid?: string;
	addressplanetid?: string;
	addressstationid?: string;
	destinationsystemid?: string;
	destinationplanetid?: string;
	destinationstationid?: string;
	reputationchange?: number;
	addresssystemname?: string;
	addressplanetname?: string;
	addressstationname?: string;
	destinationsystemname?: string;
	destinationplanetname?: string;
	destinationstationname?: string;
}

interface ContractDetailData {
	id: string;
	localid?: string;
	name?: string;
	date: string;
	status: string;
	contracttype?: string;
	partnername?: string;
	partnercode?: string;
	duedate?: string;
	preamble?: string;
	party?: string;
	is_income?: boolean;
	total_amount?: number;
	currency?: string;
	conditions: Condition[];
}

interface Props {
	open: boolean;
	contractId: string | null;
	onClose: () => void;
}

const ContractConditionRow = ({
	condition,
	contractParty,
	contractCurrency,
}: {
	condition: Condition;
	contractParty?: string;
	contractCurrency?: string;
}) => {
	const theme = useTheme();
	const isDone = condition.status === "FULFILLED";
	const isMaterial =
		condition.type === "PROVISION" ||
		condition.type === "DEPOSIT" ||
		condition.type === "WITHDRAW" ||
		condition.type === "PROVISION_SHIPMENT" ||
		condition.type === "PICKUP_SHIPMENT" ||
		condition.type === "DELIVERY_SHIPMENT" ||
		condition.type === "COMEX_PURCHASE_PICKUP";

	const isLoanCondition =
		condition.type === "LOAN_PAYOUT" || condition.type === "LOAN_INSTALLMENT";

	const isMoney = !!condition.amountmoney || !!condition.repaymentamount;
	const isMyCondition = condition.party === contractParty;

	// Currency Resolver
	const curr =
		condition.currencymoney || condition.currency || contractCurrency;

	return (
		<Paper
			elevation={0}
			sx={{
				px: 1,
				py: 0.75,
				mb: 0.5,
				border: `1px solid ${theme.palette.divider}`,
				bgcolor: isDone
					? alpha(theme.palette.success.main, 0.04)
					: "background.paper",
				display: "flex",
				alignItems: "center",
				gap: 1,
				transition: "all 0.1s",
				"&:hover": { bgcolor: alpha(theme.palette.action.hover, 0.05) },
			}}
		>
			{/* 1. Index number */}
			<Typography
				variant="caption"
				color="text.disabled"
				fontWeight={700}
				sx={{ minWidth: 20, textAlign: "center", flexShrink: 0 }}
			>
				#{condition.index}
			</Typography>

			{/* 2. Type icon */}
			<Avatar
				variant="rounded"
				sx={{
					bgcolor: isMoney
						? alpha(theme.palette.success.main, 0.1)
						: isMaterial
							? alpha(theme.palette.info.main, 0.1)
							: alpha(theme.palette.action.selected, 0.3),
					color: isMoney
						? "success.main"
						: isMaterial
							? "info.main"
							: "text.secondary",
					width: 24,
					height: 24,
					flexShrink: 0,
				}}
			>
				{isMoney ? (
					<MonetizationOn sx={{ fontSize: 14 }} />
				) : isMaterial ? (
					<Inventory2 sx={{ fontSize: 14 }} />
				) : (
					<Assignment sx={{ fontSize: 14 }} />
				)}
			</Avatar>

			{/* 3. Left content: type label + YOU/PARTNER chip + location/rep sub-info */}
			<Box sx={{ flexGrow: 1, minWidth: 0 }}>
				{/* Type label row */}
				<Stack
					direction="row"
					spacing={0.75}
					alignItems="center"
					flexWrap="wrap"
				>
					<Typography
						variant="subtitle2"
						fontWeight={700}
						fontSize="0.75rem"
						noWrap
					>
						{condition.type.replace(/_/g, " ")}
					</Typography>
					<Chip
						label={isMyCondition ? "YOU" : "PARTNER"}
						size="small"
						sx={{
							height: 16,
							fontSize: "0.55rem",
							fontWeight: 800,
							bgcolor: isMyCondition
								? alpha(theme.palette.info.main, 0.1)
								: alpha(theme.palette.warning.main, 0.1),
							color: isMyCondition ? "info.main" : "warning.main",
							border: `1px solid ${
								isMyCondition
									? alpha(theme.palette.info.main, 0.25)
									: alpha(theme.palette.warning.main, 0.25)
							}`,
						}}
					/>
				</Stack>

				{/* Location / Destination sub-row */}
				{(condition.addresssystemid ||
					condition.addressplanetid ||
					condition.addressstationid) && (
					<Typography
						variant="caption"
						color="text.secondary"
						sx={{ fontSize: "0.65rem", display: "block", mt: 0.25 }}
					>
						📍{" "}
						{condition.addressstationname ||
							condition.addressplanetname ||
							condition.addressstationid ||
							condition.addressplanetid ||
							condition.addresssystemid}
						{condition.addresssystemname && ` [${condition.addresssystemname}]`}
						{(condition.destinationsystemid ||
							condition.destinationplanetid ||
							condition.destinationstationid) && (
							<>
								{" ➔ "}
								{condition.destinationstationname ||
									condition.destinationplanetname ||
									condition.destinationstationid ||
									condition.destinationplanetid ||
									condition.destinationsystemid}
								{condition.destinationsystemname &&
									` [${condition.destinationsystemname}]`}
							</>
						)}
					</Typography>
				)}

				{/* Reputation */}
				{condition.reputationchange != null && (
					<Chip
						label={`${condition.reputationchange > 0 ? "+" : ""}${condition.reputationchange} Rep`}
						size="small"
						color={condition.reputationchange >= 0 ? "success" : "error"}
						variant="outlined"
						sx={{ height: 14, fontSize: "0.55rem", fontWeight: 700, mt: 0.25 }}
					/>
				)}
			</Box>

			{/* 4. Right content: payment value / material badges / loan data */}
			<Box sx={{ textAlign: "right", flexShrink: 0, maxWidth: "45%" }}>
				{/* Standard payment */}
				{!isLoanCondition && condition.amountmoney && (
					<Typography
						variant="body2"
						fontFamily="monospace"
						fontWeight={700}
						sx={{
							color: isMyCondition ? "error.main" : "success.main",
							fontSize: "0.85rem",
						}}
					>
						{isMyCondition ? "-" : "+"}
						{formatCurrency(condition.amountmoney, curr)}
					</Typography>
				)}

				{/* Material badges */}
				{isMaterial && condition.material_summary && (
					<Box
						sx={{
							display: "flex",
							flexWrap: "wrap",
							gap: 0.4,
							justifyContent: "flex-end",
						}}
					>
						{condition.material_summary.split(", ").map((entry, i) => {
							const match = entry.match(/^(\d+)x\s+(.+)$/);
							if (!match)
								return (
									<Typography
										key={i}
										variant="caption"
										color="text.secondary"
										sx={{ fontSize: "0.6rem" }}
									>
										{entry}
									</Typography>
								);
							const [, qty, ticker] = match;
							return (
								<Box
									key={i}
									sx={{
										display: "inline-flex",
										alignItems: "center",
										gap: 0.2,
									}}
								>
									<Typography
										variant="caption"
										color="text.secondary"
										sx={{ fontSize: "0.6rem", lineHeight: 1 }}
									>
										{qty}x
									</Typography>
									<span style={{ fontSize: "0.6rem" }}>
										<MaterialBadge ticker={ticker} />
									</span>
								</Box>
							);
						})}
					</Box>
				)}

				{/* Loan installment data */}
				{isLoanCondition && (
					<Box
						sx={{
							display: "flex",
							gap: 1.5,
							flexDirection: "row",
							alignItems: "flex-end",
							justifyContent: "flex-end",
						}}
					>
						{condition.repaymentamount !== undefined && (
							<Box sx={{ textAlign: "right" }}>
								<Typography
									variant="caption"
									display="block"
									color="text.secondary"
									sx={{ fontSize: "0.6rem" }}
								>
									PRINCIPAL
								</Typography>
								<Typography
									variant="caption"
									fontFamily="monospace"
									fontWeight={600}
									sx={{ fontSize: "0.72rem" }}
								>
									{formatCurrency(condition.repaymentamount, curr)}
								</Typography>
							</Box>
						)}
						{condition.interestamount !== undefined && (
							<Box sx={{ textAlign: "right" }}>
								<Typography
									variant="caption"
									display="block"
									color="text.secondary"
									sx={{ fontSize: "0.6rem" }}
								>
									INTEREST
								</Typography>
								<Typography
									variant="caption"
									fontFamily="monospace"
									fontWeight={600}
									color="success.main"
									sx={{ fontSize: "0.72rem" }}
								>
									+{formatCurrency(condition.interestamount, curr)}
								</Typography>
							</Box>
						)}
						{condition.totalamount !== undefined && (
							<Box sx={{ textAlign: "right" }}>
								<Typography
									variant="caption"
									display="block"
									color="text.secondary"
									sx={{ fontSize: "0.6rem" }}
								>
									TOTAL
								</Typography>
								<Typography
									variant="caption"
									fontFamily="monospace"
									fontWeight={800}
									sx={{ fontSize: "0.72rem" }}
								>
									{formatCurrency(condition.totalamount, curr)}
								</Typography>
							</Box>
						)}
					</Box>
				)}

				{/* Deadline chip */}
				{condition.deadline && (
					<Chip
						icon={<AccessTime sx={{ fontSize: "10px !important" }} />}
						label={dayjs(condition.deadline).format("MMM D, HH:mm")}
						size="small"
						variant="outlined"
						sx={{
							mt: 0.25,
							height: 18,
							fontSize: "0.6rem",
							border: "none",
							bgcolor: alpha(theme.palette.warning.main, 0.1),
							color: theme.palette.warning.main,
						}}
					/>
				)}
			</Box>

			{/* 5. Status icon */}
			{isDone ? (
				<CheckCircleOutlined
					fontSize="small"
					color="success"
					sx={{ flexShrink: 0 }}
				/>
			) : (
				<RadioButtonUnchecked
					fontSize="small"
					color="disabled"
					sx={{ flexShrink: 0 }}
				/>
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
			fetchClient(`/internal/contracts/detail?contract_id=${contractId}`)
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
			slotProps={{
				paper: {
					sx: {
						bgcolor: theme.palette.background.default,
						backgroundImage: "none",
						borderRadius: isMobile ? 0 : 2,
						height: isMobile ? "100%" : "80vh",
					},
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
										sx={{
											color: c.is_income ? "success.main" : "error.main",
										}}
									>
										{c.is_income ? "+" : "-"}
										{formatCurrency(
											c.conditions
												.filter(
													(cond) =>
														cond.type === "PAYMENT" ||
														cond.type === "LOAN_INSTALLMENT" ||
														cond.type === "LOAN_PAYOUT",
												)
												.reduce(
													(acc, cond) =>
														acc + (cond.amountmoney || cond.totalamount || 0),
													0,
												) ||
												c.total_amount ||
												0,
											c.currency || "ICA",
										)}
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
									<ContractConditionRow
										key={cond.id}
										condition={cond}
										contractCurrency={c.currency}
										contractParty={c.party}
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
