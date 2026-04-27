import React from "react";
import {
	TableRow,
	TableCell,
	Chip,
	Box,
	Typography,
	useTheme,
	alpha,
} from "@mui/material";
import type { ContractListItem } from "../types";
import { getStatusColor, getStatusBg, formatCurrency } from "../helpers/helper";
import {
	ArrowCircleRight,
	ArrowCircleLeft,
	LocalShipping,
	AccountBalance,
	Handshake,
} from "@mui/icons-material";
import dayjs from "dayjs";

interface Props {
	contract: ContractListItem;
	onClick?: () => void;
	rowHeight?: string | number;
}

const ContractRow: React.FC<Props> = ({ contract, onClick, rowHeight }) => {
	const theme = useTheme();

	const getIcon = () => {
		switch (contract.operation_type) {
			case "BUY":
				return <ArrowCircleLeft sx={{ fontSize: 16 }} color="success" />;
			case "SELL":
				return <ArrowCircleRight sx={{ fontSize: 16 }} color="warning" />;
			case "SHIPMENT":
				return <LocalShipping sx={{ fontSize: 16 }} color="info" />;
			case "LOAN":
				return <AccountBalance sx={{ fontSize: 16 }} color="error" />;
			default:
				return <Handshake sx={{ fontSize: 16 }} color="secondary" />;
		}
	};

	return (
		<TableRow
			hover
			onClick={onClick}
			sx={{
				bgcolor: alpha(theme.palette.background.default, 0.05), // Matches your snippet
				backgroundImage: "none",
				"&:last-child td, &:last-child th": { border: 0 },
				cursor: "pointer",
				transition: "background-color 0.1s",
				height: rowHeight || "auto",
			}}
		>
			{/* 1. Contract Identity */}
			<TableCell component="th" scope="row" sx={{ py: 0.5, px: 1 }}>
				<Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
					<Box sx={{ mt: 0.2 }}>{getIcon()}</Box>
					<Box sx={{ display: "flex", flexDirection: "column" }}>
						<Typography
							variant="body2"
							fontWeight={700}
							sx={{ fontSize: "0.8rem", lineHeight: 1 }}
						>
							{contract.localid || "No ID"}
						</Typography>
						{contract.name && (
							<Typography
								variant="caption"
								color="text.secondary"
								sx={{ fontSize: "0.7rem", lineHeight: 1, mt: 0.2 }}
							>
								{contract.name}
							</Typography>
						)}
					</Box>
				</Box>
			</TableCell>

			{/* 2. Partner */}
			<TableCell sx={{ py: 0.5, px: 1 }}>
				<Box sx={{ display: "flex", flexDirection: "column" }}>
					<Typography
						variant="body2"
						fontWeight={500}
						sx={{ fontSize: "0.85rem", lineHeight: 1 }}
					>
						{contract.partnername || "Unknown"}
					</Typography>
					<Typography
						variant="caption"
						color="text.secondary"
						sx={{ fontSize: "0.75rem", fontFamily: "monospace", lineHeight: 1 }}
					>
						{contract.partnercode}
					</Typography>
				</Box>
			</TableCell>

			{/* 3. Value */}
			<TableCell sx={{ py: 0.5, px: 1, textAlign: "right" }}>
				{" "}
				{/* Changed to Right Align for numbers */}
				{contract.total_amount > 0 ? (
					<Typography
						variant="body2"
						fontWeight={600}
						sx={{
							fontFamily: "monospace",
							fontSize: "0.85rem",
							letterSpacing: -0.5,
						}}
					>
						{formatCurrency(contract.total_amount, contract.currency)}
					</Typography>
				) : (
					<Typography variant="caption" color="text.disabled">
						-
					</Typography>
				)}
			</TableCell>

			{/* 4. Status / Dates (Merged) */}
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
