import React, { useState } from "react";
import {
	Paper,
	Box,
	Typography,
	Collapse,
	IconButton,
	Divider,
	LinearProgress,
	useTheme,
} from "@mui/material";
import { ExpandMore, ExpandLess, AccountBalance } from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import { formatCurrency, getStatusColor } from "../helpers/helper";

export const LoanCard = ({
	contract,
	type,
}: {
	contract: any;
	type: "LENDER" | "BORROWER";
}) => {
	const theme = useTheme();
	const [expanded, setExpanded] = useState(false);

	// Simplistic progress calc (paid / total) - requires mapping actual condition data
	const progress = 45;

	return (
		<Paper
			sx={{
				mb: 2,
				border: `1px solid ${expanded ? theme.palette.secondary.main : theme.palette.divider}`,
				bgcolor: alpha(theme.palette.background.paper, 0.4),
				transition: "all 0.2s",
			}}
		>
			{/* Header */}
			<Box
				sx={{
					p: 2,
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					cursor: "pointer",
				}}
				onClick={() => setExpanded(!expanded)}
			>
				<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
					<AccountBalance color={type === "LENDER" ? "success" : "error"} />
					<Box>
						<Typography variant="subtitle1" fontWeight={700}>
							{contract.name || "Loan Contract"}
						</Typography>
						<Typography variant="caption" color="text.secondary">
							{type === "LENDER"
								? `Lent to ${contract.partnername}`
								: `Borrowed from ${contract.partnername}`}
						</Typography>
					</Box>
				</Box>
				<Box sx={{ textAlign: "right" }}>
					<Typography variant="h6" fontWeight={700} fontFamily="monospace">
						{formatCurrency(contract.total_amount, contract.currency)}
					</Typography>
					<Typography
						variant="caption"
						color={getStatusColor(contract.status, theme)}
					>
						{contract.status}
					</Typography>
				</Box>
			</Box>

			{/* Expanded Details */}
			<Collapse in={expanded}>
				<Divider />
				<Box
					sx={{ p: 2, bgcolor: alpha(theme.palette.background.default, 0.3) }}
				>
					<Box sx={{ mb: 2 }}>
						<Box
							sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
						>
							<Typography variant="caption">Repayment Progress</Typography>
							<Typography variant="caption">{progress}%</Typography>
						</Box>
						<LinearProgress
							variant="determinate"
							value={progress}
							color={type === "LENDER" ? "success" : "warning"}
						/>
					</Box>

					<Typography
						variant="caption"
						fontWeight="bold"
						sx={{ mb: 1, display: "block" }}
					>
						CONDITIONS
					</Typography>
					{/* Placeholder for conditions list - map real data here */}
					<Typography
						variant="body2"
						color="text.secondary"
						sx={{ fontStyle: "italic" }}
					>
						Expand to see specific repayment installments...
					</Typography>
				</Box>
			</Collapse>
		</Paper>
	);
};
