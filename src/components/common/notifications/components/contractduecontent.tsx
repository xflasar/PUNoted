import React from "react";
import { Box, Chip, Typography } from "@mui/material";

interface ContractDueContentProps {
	data: {
		contract_id?: string;
		contractid?: string;
		amount?: number;
		currency?: string;
		currencymoney?: string;
		due_days?: number;
		overdue_days?: number;
		party?: string;
	};
	type?: string;
}

export const ContractDueContent: React.FC<ContractDueContentProps> = ({
	data,
	type,
}) => {
	const isOverdue =
		type === "contract_payment_overdue" ||
		(data.overdue_days && data.overdue_days > 0);
	const contractId = data.contract_id || data.contractid || "N/A";
	const amount = data.amount
		? `${Number(data.amount).toLocaleString()} ${data.currency || data.currencymoney || ""}`
		: null;
	const party = data.party || "Counterparty";
	const statusLabel = isOverdue
		? `Overdue by ${data.overdue_days || 1}d`
		: data.due_days === 0
			? "Due Today"
			: `Due in ${data.due_days || 1}d`;

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				gap: 0.5,
				width: "100%",
				p: 0.75,
				bgcolor: "rgba(0, 0, 0, 0.3)",
				borderRadius: 1.5,
				border: isOverdue
					? "1px solid rgba(255, 82, 82, 0.3)"
					: "1px solid rgba(255, 183, 77, 0.3)",
			}}
		>
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<Typography
					variant="caption"
					sx={{ fontWeight: 700, color: "#9F8EFF", fontSize: "0.7rem" }}
				>
					Contract: {contractId}
				</Typography>
				<Chip
					size="small"
					label={statusLabel}
					sx={{
						height: 18,
						fontSize: "0.6rem",
						fontWeight: 700,
						bgcolor: isOverdue
							? "rgba(255, 82, 82, 0.2)"
							: "rgba(255, 183, 77, 0.2)",
						color: isOverdue ? "#FF5252" : "#FFB74D",
					}}
				/>
			</Box>
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<Typography
					variant="caption"
					sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.65rem" }}
				>
					Party: {party}
				</Typography>
				{amount && (
					<Typography
						variant="caption"
						sx={{ fontWeight: 700, color: "#64FFDA", fontSize: "0.68rem" }}
					>
						{amount}
					</Typography>
				)}
			</Box>
		</Box>
	);
};
