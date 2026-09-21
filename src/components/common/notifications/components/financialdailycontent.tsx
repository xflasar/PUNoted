import React from "react";
import { Box, Paper, Typography } from "@mui/material";

interface FinancialDailyContentProps {
	data: {
		currencies?: Array<{
			code?: string;
			balancecurrencycode?: string;
			balance?: number;
			balanceamount?: number;
			income_24h?: number;
			expense_24h?: number;
		}>;
		balances?: Array<{
			balancecurrencycode?: string;
			code?: string;
			balanceamount?: number;
			balance?: number;
		}>;
	};
}

export const FinancialDailyContent: React.FC<FinancialDailyContentProps> = ({
	data,
}) => {
	const currencies = data?.currencies || [];

	if (!currencies || currencies.length === 0) {
		const fallbackBalances = data?.balances || [];
		return (
			<Box
				sx={{
					display: "grid",
					gridTemplateColumns: "repeat(2, 1fr)",
					gap: 0.75,
					width: "100%",
				}}
			>
				{fallbackBalances.slice(0, 4).map((b, idx) => (
					<Paper
						key={idx}
						variant="outlined"
						sx={{
							p: 0.75,
							bgcolor: "rgba(0, 0, 0, 0.4)",
							borderColor: "rgba(123, 104, 238, 0.25)",
							borderRadius: 1.5,
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
								sx={{ fontWeight: 800, fontSize: "0.68rem", color: "#9F8EFF" }}
							>
								{b.balancecurrencycode || b.code}
							</Typography>
							<Typography
								variant="caption"
								sx={{ fontWeight: 700, fontSize: "0.7rem", color: "#FFFFFF" }}
							>
								{Number(b.balanceamount || b.balance || 0).toLocaleString()}
							</Typography>
						</Box>
					</Paper>
				))}
			</Box>
		);
	}

	return (
		<Box
			sx={{
				display: "grid",
				gridTemplateColumns: "repeat(2, 1fr)",
				gap: 0.75,
				width: "100%",
			}}
		>
			{currencies.slice(0, 4).map((c, idx) => {
				const income = Number(c.income_24h || 0);
				const expense = Number(c.expense_24h || 0);
				const net = income - expense;

				return (
					<Paper
						key={idx}
						variant="outlined"
						sx={{
							p: 0.75,
							bgcolor: "rgba(0, 0, 0, 0.4)",
							borderColor: "rgba(123, 104, 238, 0.25)",
							borderRadius: 1.5,
							display: "flex",
							flexDirection: "column",
							gap: 0.5,
						}}
					>
						{/* Header: Currency Code & Current Balance */}
						<Box
							sx={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
								pb: 0.25,
							}}
						>
							<Typography
								variant="caption"
								sx={{ fontWeight: 800, fontSize: "0.68rem", color: "#9F8EFF" }}
							>
								{c.code || c.balancecurrencycode}
							</Typography>
							<Typography
								variant="caption"
								sx={{ fontWeight: 700, fontSize: "0.7rem", color: "#FFFFFF" }}
							>
								{Number(c.balance || c.balanceamount || 0).toLocaleString()}
							</Typography>
						</Box>

						{/* Telemetry Columns: Income (Left) vs Expense (Right) */}
						<Box
							sx={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "flex-start",
							}}
						>
							{/* Income Column */}
							<Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
								<Typography
									variant="caption"
									sx={{ fontSize: "0.55rem", color: "rgba(255, 255, 255, 0.55)", lineHeight: 1 }}
								>
									Income
								</Typography>
								<Typography
									variant="caption"
									sx={{ fontSize: "0.65rem", fontWeight: 700, color: "#64FFDA" }}
								>
									+{income.toLocaleString()}
								</Typography>
							</Box>

							{/* Expense Column */}
							<Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
								<Typography
									variant="caption"
									sx={{ fontSize: "0.55rem", color: "rgba(255, 255, 255, 0.55)", lineHeight: 1 }}
								>
									Expense
								</Typography>
								<Typography
									variant="caption"
									sx={{ fontSize: "0.65rem", fontWeight: 700, color: "#FF5252" }}
								>
									-{expense.toLocaleString()}
								</Typography>
							</Box>
						</Box>

						{/* Centered Middle Net Row */}
						<Box
							sx={{
								display: "flex",
								justifyContent: "center",
								alignItems: "center",
								pt: 0.25,
								borderTop: "1px dashed rgba(255, 255, 255, 0.08)",
							}}
						>
							<Typography
								variant="caption"
								sx={{
									fontSize: "0.62rem",
									fontWeight: 800,
									color: net >= 0 ? "#64FFDA" : "#FF5252",
								}}
							>
								Net: {net >= 0 ? `+${net.toLocaleString()}` : net.toLocaleString()}
							</Typography>
						</Box>
					</Paper>
				);
			})}
		</Box>
	);
};

export default FinancialDailyContent;
