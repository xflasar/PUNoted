import React from "react";
import {
	TableRow,
	TableCell,
	Chip,
	Box,
	Typography,
	useTheme,
	alpha,
	Stack,
	Skeleton,
} from "@mui/material";
import type { ContractListItem } from "../types";
import { getStatusColor, getStatusBg, formatCurrency } from "../helpers/helper";
import {
	ArrowCircleRight,
	ArrowCircleLeft,
	LocalShipping,
	AccountBalance,
	Handshake,
	Explore,
} from "@mui/icons-material";
import dayjs from "dayjs";

interface Props {
	contract?: ContractListItem;
	onClick?: () => void;
	rowHeight?: string | number;
	loading?: boolean;
}

const ContractRow: React.FC<Props> = ({
	contract,
	onClick,
	rowHeight,
	loading,
}) => {
	const theme = useTheme();

	if (loading || !contract) {
		return (
			<TableRow sx={{ height: rowHeight || 40 }}>
				<TableCell sx={{ py: 0.5, px: 1 }}>
					<Skeleton
						variant="text"
						width="70%"
						height={20}
						sx={{ bgcolor: "rgba(255,255,255,0.08)" }}
					/>
					<Skeleton
						variant="text"
						width="40%"
						height={14}
						sx={{ bgcolor: "rgba(255,255,255,0.05)" }}
					/>
				</TableCell>
				<TableCell sx={{ py: 0.5, px: 1 }}>
					<Skeleton
						variant="rectangular"
						width={60}
						height={20}
						sx={{ borderRadius: 1, bgcolor: "rgba(255,255,255,0.08)" }}
					/>
				</TableCell>
				<TableCell sx={{ py: 0.5, px: 1 }}>
					<Skeleton
						variant="text"
						width="60%"
						height={20}
						sx={{ bgcolor: "rgba(255,255,255,0.08)" }}
					/>
				</TableCell>
				<TableCell align="right" sx={{ py: 0.5, px: 1 }}>
					<Skeleton
						variant="text"
						width="50%"
						height={20}
						sx={{ ml: "auto", bgcolor: "rgba(255,255,255,0.08)" }}
					/>
				</TableCell>
				<TableCell align="right" sx={{ py: 0.5, px: 1 }}>
					<Skeleton
						variant="rectangular"
						width={55}
						height={18}
						sx={{
							ml: "auto",
							borderRadius: 1,
							bgcolor: "rgba(255,255,255,0.08)",
						}}
					/>
				</TableCell>
			</TableRow>
		);
	}

	const getIcon = () => {
		switch (contract.contracttype) {
			case "BUY":
				return <ArrowCircleLeft sx={{ fontSize: 16 }} color="success" />;
			case "SELL":
				return <ArrowCircleRight sx={{ fontSize: 16 }} color="warning" />;
			case "SHIPMENT_GIVEN":
			case "SHIPMENT_TAKEN":
				return <LocalShipping sx={{ fontSize: 16 }} color="info" />;
			case "LOAN_GIVEN":
			case "LOAN_TAKEN":
				return <AccountBalance sx={{ fontSize: 16 }} color="error" />;
			case "EXPLORATION":
				return <Explore sx={{ fontSize: 16 }} color="primary" />;
			default:
				return <Handshake sx={{ fontSize: 16 }} color="secondary" />;
		}
	};

	const hasAmount =
		contract.total_amount !== undefined &&
		contract.total_amount !== null &&
		contract.total_amount !== 0;
	const isPositive =
		contract.contracttype === "SELL" || contract.contracttype === "LOAN_TAKEN";
	const isNegative =
		contract.contracttype === "BUY" || contract.contracttype === "LOAN_GIVEN";
	const sign = isPositive ? "+" : isNegative ? "-" : "";
	const amountColor = isPositive
		? theme.palette.success.main
		: isNegative
			? theme.palette.error.main
			: theme.palette.text.primary;

	return (
		<TableRow
			hover
			onClick={onClick}
			sx={{
				cursor: "pointer",
				height: rowHeight || "auto",
				"&:last-child td, &:last-child th": { border: 0 },
			}}
		>
			{/* 1a. Contract ID & Name */}
			<TableCell sx={{ py: 0.5, px: 1 }}>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					{getIcon()}
					<Box sx={{ display: "flex", flexDirection: "column" }}>
						<Typography
							variant="body2"
							sx={{ fontSize: "0.85rem", lineHeight: 1.1, fontWeight: 700 }}
						>
							{contract.name || contract.localid}
						</Typography>
						<Typography
							variant="caption"
							color="text.secondary"
							sx={{
								fontSize: "0.75rem",
								fontFamily: "monospace",
								lineHeight: 1,
							}}
						>
							{contract.localid}
						</Typography>
					</Box>
				</Box>
			</TableCell>

			{/* 1b. Type Column */}
			<TableCell sx={{ py: 0.5, px: 1 }}>
				{contract.contracttype === "MOTION" ||
				(contract.preamble &&
					(/MOT-\d+-\d+/i.test(contract.preamble) ||
						/^Motion\s+MOT-/i.test(contract.preamble))) ||
				(contract.name &&
					(/MOT-\d+-\d+/i.test(contract.name) ||
						/^Motion\s+MOT-/i.test(contract.name))) ? (
					<Chip
						label={
							(contract as any).motionPlanetName ||
							(contract as any).motion_planet_name
								? `Motion (${(contract as any).motionPlanetName || (contract as any).motion_planet_name})`
								: (contract.preamble || contract.name)?.match(
											/MOT-(\d+)-/i,
									  )?.[1]
									? `Motion (Planet ${(contract.preamble || contract.name)?.match(/MOT-(\d+)-/i)?.[1]})`
									: "Gov Motion"
						}
						size="small"
						sx={{
							height: 20,
							fontSize: "0.68rem",
							fontWeight: 800,
							color: "#7b68ee",
							bgcolor: alpha("#7b68ee", 0.15),
							border: "1px solid rgba(123, 104, 238, 0.4)",
						}}
					/>
				) : (
					<Typography
						variant="body2"
						sx={{
							fontSize: "0.8rem",
							color: amountColor,
							fontWeight: "700",
						}}
					>
						{contract.contracttype === "SELL"
							? "Sell"
							: contract.contracttype === "BUY"
								? "Buy"
								: contract.contracttype === "SHIPMENT_GIVEN"
									? "Ship (Out)"
									: contract.contracttype === "SHIPMENT_TAKEN"
										? "Ship (In)"
										: contract.contracttype === "LOAN_GIVEN"
											? "Lend"
											: contract.contracttype === "LOAN_TAKEN"
												? "Borrow"
												: contract.contracttype === "EXPLORATION"
													? "Exploration"
													: "Other"}
					</Typography>
				)}
			</TableCell>

			{/* 2. Partner */}
			<TableCell sx={{ py: 0.5, px: 1 }}>
				<Box sx={{ display: "flex", flexDirection: "column" }}>
					<Typography
						variant="body2"
						sx={{ fontSize: "0.85rem", lineHeight: 1, fontWeight: "500" }}
					>
						{contract.contracttype === "MOTION" ||
						(contract.preamble && /^Motion\s+MOT-/i.test(contract.preamble))
							? !contract.partnername || contract.partnername === "Unknown"
								? `${(contract as any).motionPlanetName || (contract as any).motion_planet_name || `Planet ${contract.preamble?.match(/^Motion\s+MOT-(\d+)-/i)?.[1] || ""}`} Government`
								: contract.partnername
							: contract.partnername || "Unknown"}
					</Typography>
					<Typography
						variant="caption"
						color="text.secondary"
						sx={{ fontSize: "0.75rem", fontFamily: "monospace", lineHeight: 1 }}
					>
						{contract.partnercode ||
							(contract.contracttype === "MOTION" ||
							(contract.preamble && /^Motion\s+MOT-/i.test(contract.preamble))
								? "GOV"
								: "")}
					</Typography>
				</Box>
			</TableCell>

			{/* 3. Total Value */}
			<TableCell sx={{ py: 0.5, px: 1, textAlign: "right" }}>
				{hasAmount ? (
					<Typography
						variant="subtitle2"
						sx={{
							fontSize: "0.85rem",
							letterSpacing: -0.5,
							color: amountColor,
							fontWeight: "800",
						}}
					>
						{sign}
						{formatCurrency(contract.total_amount, contract.currency)}
					</Typography>
				) : (
					<Typography variant="caption" color="text.disabled">
						-
					</Typography>
				)}
			</TableCell>

			{/* 4. Status / Dates */}
			<TableCell align="right" sx={{ py: 0.5, px: 1 }}>
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						alignItems: "flex-end",
						gap: 0.5,
					}}
				>
					{/* Status Chip */}
					<Chip
						label={contract.status}
						size="small"
						sx={{
							height: 18,
							fontSize: "0.6rem",
							fontWeight: "800",
							color: getStatusColor(contract.status, theme),
							bgcolor: getStatusBg(contract.status, theme),
							border: `1px solid ${getStatusColor(contract.status, theme)}`,
							px: 0.5,
						}}
					/>
					{/* Date Info */}
					<Box sx={{ textAlign: "right", lineHeight: 1 }}>
						<Typography
							variant="caption"
							sx={{
								fontSize: "0.7rem",
								display: "block",
								lineHeight: 1,
								color: "text.primary",
							}}
						>
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
								sx={{ fontSize: "0.65rem", fontWeight: 600 }}
							>
								Due: {dayjs(contract.duedate).format("MMM D")}
							</Typography>
						)}
					</Box>
				</Box>
			</TableCell>
		</TableRow>
	);
};

export default ContractRow;
