import React from "react";
import { Box, Paper, Typography } from "@mui/material";
import MaterialBadge from "../../../../cosm/components/materialbadge";

interface ComexOrderFilledContentProps {
	data: {
		ticker?: string;
		type?: string;
		quantity?: number;
		count?: number;
		amount?: number;
		price?: number;
		currency?: string;
		exchange?: string;
	};
}

export const ComexOrderFilledContent: React.FC<
	ComexOrderFilledContentProps
> = ({ data }) => {
	if (!data || typeof data !== "object") return null;

	const ticker = data.ticker || "N/A";
	const quantity = data.quantity ?? data.count ?? data.amount ?? 0;
	const formattedQuantity = typeof quantity === "number" ? quantity.toLocaleString() : quantity;
	const price = data.price !== undefined ? data.price : 0;
	const currency = data.currency || "NCC";
	const orderType = (data.type || "BUY").toUpperCase();
	const isBuy = orderType.includes("BUY");

	return (
		<Paper
			sx={{
				display: "flex",
				flexDirection: "row",
				width: "100%",
				gap: 1,
				alignItems: "center",
				justifyContent: "space-between",
				p: 0.75,
				bgcolor: "rgba(0, 0, 0, 0.3)",
				borderRadius: 1.5,
				border: isBuy
					? "1px solid rgba(100, 255, 218, 0.3)"
					: "1px solid rgba(255, 138, 101, 0.3)",
			}}
		>
			<Box
				sx={{
					display: "flex",
					flexDirection: "row",
					alignItems: "center",
					gap: 1,
				}}
			>
				<MaterialBadge ticker={ticker} />
				<Box sx={{ display: "flex", flexDirection: "column" }}>
					<Typography
						variant="caption"
						sx={{
							fontSize: "0.65rem",
							fontWeight: 700,
							color: isBuy ? "#64FFDA" : "#FF8A65",
						}}
					>
						{orderType} {data.exchange ? `(${data.exchange})` : ""}
					</Typography>
					<Typography variant="caption" sx={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.6)" }}>
						Ticker: {ticker}
					</Typography>
				</Box>
			</Box>

			<Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
				<Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
					<Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.6rem" }}>
						Amount
					</Typography>
					<Typography variant="caption" sx={{ fontWeight: 700, color: "#FFFFFF", fontSize: "0.7rem" }}>
						{formattedQuantity}
					</Typography>
				</Box>

				<Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
					<Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.6rem" }}>
						Price
					</Typography>
					<Typography variant="caption" sx={{ fontWeight: 700, color: "#64FFDA", fontSize: "0.7rem" }}>
						{price} {currency}
					</Typography>
				</Box>
			</Box>
		</Paper>
	);
};

export default ComexOrderFilledContent;
