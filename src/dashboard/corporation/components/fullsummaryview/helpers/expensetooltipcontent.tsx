import React from "react";
import { Box, Typography } from "@mui/material";

export const ExpenseTooltipContent: React.FC<{
	ticker: string;
	prod: number;
	cons: number;
	price: number;
	recipeUnitCost: number;
	prodExpense: number;
	consExpense: number;
	totalExpense: number;
}> = ({
	ticker,
	prod,
	cons,
	price,
	recipeUnitCost,
	prodExpense,
	consExpense,
	totalExpense,
}) => (
	<Box sx={{ p: 1, maxWidth: 320 }}>
		<Typography
			variant="caption"
			sx={{
				fontWeight: 800,
				color: "#FF8A80",
				display: "block",
				mb: 0.75,
				textTransform: "uppercase",
			}}
		>
			EST. EXPENSE BREAKDOWN ({ticker})
		</Typography>

		{prod > 0 && recipeUnitCost > 0 && (
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					fontSize: "0.7rem",
					py: 0.3,
				}}
			>
				<Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
					Prod Input Expense: ({prod.toLocaleString()} x{" "}
					{recipeUnitCost.toLocaleString(undefined, {
						maximumFractionDigits: 1,
					})}
					)
				</Typography>
				<Typography variant="caption" sx={{ fontWeight: 700, color: "#FFF" }}>
					{prodExpense.toLocaleString(undefined, { maximumFractionDigits: 0 })}
				</Typography>
			</Box>
		)}

		{cons > 0 && (
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					fontSize: "0.7rem",
					py: 0.3,
				}}
			>
				<Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
					Cons Market Value: ({cons.toLocaleString()} x{" "}
					{price.toLocaleString(undefined, { maximumFractionDigits: 1 })})
				</Typography>
				<Typography variant="caption" sx={{ fontWeight: 700, color: "#FFF" }}>
					{consExpense.toLocaleString(undefined, { maximumFractionDigits: 0 })}
				</Typography>
			</Box>
		)}

		<Box
			sx={{
				display: "flex",
				justifyContent: "space-between",
				fontSize: "0.75rem",
				pt: 0.75,
				mt: 0.5,
				borderTop: "1px solid rgba(255,255,255,0.1)",
			}}
		>
			<Typography variant="caption" sx={{ fontWeight: 800, color: "#FF8A80" }}>
				Total Est. Expense:
			</Typography>
			<Typography variant="caption" sx={{ fontWeight: 800, color: "#FF8A80" }}>
				{totalExpense.toLocaleString(undefined, { maximumFractionDigits: 0 })}
			</Typography>
		</Box>
	</Box>
);
