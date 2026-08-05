import React from "react";
import { Box, Paper, Typography, Grid } from "@mui/material";
import type { OrderBookEntry } from "./types";

export interface OrderBookProps {
	bids: OrderBookEntry[];
	asks: OrderBookEntry[];
}

export const OrderBook: React.FC<OrderBookProps> = ({ bids, asks }) => {
	const topBids = bids.slice(0, 8);
	const topAsks = asks.slice(0, 8);

	return (
		<Paper
			elevation={3}
			sx={{
				p: 2,
				background: "rgba(16, 16, 32, 0.5)",
				border: "1px solid rgba(123, 104, 238, 0.35)",
				boxShadow:
					"0 0 35px rgba(123, 104, 238, 0.18), inset 0 0 20px rgba(123, 104, 238, 0.06)",
				backdropFilter: "blur(25px)",
				borderRadius: "16px",
				height: "100%",
				display: "flex",
				flexDirection: "column",
			}}
		>
			<Typography
				variant="subtitle2"
				sx={{
					fontWeight: 800,
					color: "#7B68EE",
					textTransform: "uppercase",
					fontSize: "0.75rem",
					letterSpacing: "0.15em",
					mb: 1.5,
				}}
			>
				Order Book
			</Typography>

			<Box
				sx={{
					display: "flex",
					flexDirection: "row",
					gap: 2,
					justifyContent: "space-between",
				}}
			>
				{/* BIDS (Buying) */}
				<Box sx={{ display: "flex", flexDirection: "column" }}>
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							borderBottom: "1px solid rgba(255,255,255,0.08)",
							pb: 0.75,
							mb: 1,
							px: 0.5,
						}}
					>
						<Typography
							variant="caption"
							sx={{
								color: "#69f0ae",
								fontWeight: 700,
								fontSize: "0.7rem",
								letterSpacing: "0.05em",
							}}
						>
							BUY ORDERS (BIDS)
						</Typography>
						<Typography
							variant="caption"
							sx={{
								color: "rgba(255,255,255,0.5)",
								fontWeight: 700,
								fontSize: "0.7rem",
							}}
						>
							QTY
						</Typography>
					</Box>

					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							gap: 0.75,
							px: 0.5,
							flex: 1,
						}}
					>
						{topBids.map((b, idx) => (
							<Box
								key={idx}
								sx={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									fontSize: "0.75rem",
									fontVariantNumeric: "tabular-nums",
								}}
							>
								<Typography
									variant="body2"
									sx={{
										color: "#69f0ae",
										fontWeight: 600,
										fontSize: "0.75rem",
									}}
								>
									{b.price.toLocaleString(undefined, {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									})}
								</Typography>
								<Typography
									variant="body2"
									sx={{
										color: "rgba(255,255,255,0.8)",
										fontSize: "0.75rem",
										textAlign: "right",
									}}
								>
									{b.amount.toLocaleString()}
								</Typography>
							</Box>
						))}

						{topBids.length === 0 && (
							<Typography
								variant="caption"
								sx={{
									color: "rgba(255,255,255,0.3)",
									textAlign: "center",
									py: 2,
									display: "block",
								}}
							>
								No bids available
							</Typography>
						)}
					</Box>
				</Box>

				{/* ASKS (Selling) */}
				<Box sx={{ display: "flex", flexDirection: "column" }}>
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							borderBottom: "1px solid rgba(255,255,255,0.08)",
							pb: 0.75,
							mb: 1,
							px: 0.5,
						}}
					>
						<Typography
							variant="caption"
							sx={{
								color: "#ff5252",
								fontWeight: 700,
								fontSize: "0.7rem",
								letterSpacing: "0.05em",
							}}
						>
							SELL ORDERS (ASKS)
						</Typography>
						<Typography
							variant="caption"
							sx={{
								color: "rgba(255,255,255,0.5)",
								fontWeight: 700,
								fontSize: "0.7rem",
							}}
						>
							QTY
						</Typography>
					</Box>

					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							gap: 0.75,
							px: 0.5,
							flex: 1,
						}}
					>
						{topAsks.map((a, idx) => (
							<Box
								key={idx}
								sx={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									fontSize: "0.75rem",
									fontVariantNumeric: "tabular-nums",
								}}
							>
								<Typography
									variant="body2"
									sx={{
										color: "#ff5252",
										fontWeight: 600,
										fontSize: "0.75rem",
									}}
								>
									{a.price.toLocaleString(undefined, {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									})}
								</Typography>
								<Typography
									variant="body2"
									sx={{
										color: "rgba(255,255,255,0.8)",
										fontSize: "0.75rem",
										textAlign: "right",
									}}
								>
									{a.amount.toLocaleString()}
								</Typography>
							</Box>
						))}

						{topAsks.length === 0 && (
							<Typography
								variant="caption"
								sx={{
									color: "rgba(255,255,255,0.3)",
									textAlign: "center",
									py: 2,
									display: "block",
								}}
							>
								No asks available
							</Typography>
						)}
					</Box>
				</Box>
			</Box>
		</Paper>
	);
};
