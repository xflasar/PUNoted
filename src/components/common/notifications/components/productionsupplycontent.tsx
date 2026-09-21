import React from "react";
import { Box, Chip, Paper, Typography } from "@mui/material";
import type { MaterialSupplyItem } from "../types";

interface ProductionSupplyContentProps {
	data: {
		siteid?: string;
		sitename?: string;
		ticker?: string;
		target_days?: number;
		amount?: number;
		materials?: MaterialSupplyItem[];
	};
}

export const ProductionSupplyContent: React.FC<ProductionSupplyContentProps> = ({
	data,
}) => {
	const materials: MaterialSupplyItem[] =
		data.materials && Array.isArray(data.materials) && data.materials.length > 0
			? data.materials
			: [
				{
					ticker: data.ticker || "N/A",
					amount: data.amount !== undefined ? data.amount : 0,
					target_days: data.target_days || 1,
				},
			];

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				gap: 0.75,
				width: "100%",
			}}
		>
			<Box
				sx={{
					display: "grid",
					gridTemplateColumns: materials.length > 1 ? "repeat(2, 1fr)" : "1fr",
					gap: 0.75,
					width: "100%",
				}}
			>
				{materials.map((m, idx) => {
					const amountStr = Math.round(m.amount || 0).toLocaleString();
					const targetStr = `${m.target_days || 1}d`;
					const daysLeftStr = m.days_left !== undefined ? `${m.days_left}d left` : null;

					return (
						<Paper
							key={idx}
							variant="outlined"
							sx={{
								p: 0.75,
								bgcolor: "rgba(0, 0, 0, 0.4)",
								borderColor: "rgba(255, 82, 82, 0.3)",
								borderRadius: 1.5,
								display: "flex",
								flexDirection: "column",
								gap: 0.25,
							}}
						>
							<Box
								sx={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
								}}
							>
								<Chip
									size="small"
									label={m.ticker}
									sx={{
										height: 18,
										fontSize: "0.62rem",
										fontWeight: 800,
										bgcolor: "rgba(255, 82, 82, 0.2)",
										color: "#FF5252",
									}}
								/>
								<Typography
									variant="caption"
									sx={{
										fontSize: "0.6rem",
										fontWeight: 600,
										color: "rgba(255,255,255,0.6)",
									}}
								>
									Target: {targetStr}
								</Typography>
							</Box>
							<Box
								sx={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									mt: 0.2,
								}}
							>
								<Typography
									variant="caption"
									sx={{ fontWeight: 700, color: "#64FFDA", fontSize: "0.68rem" }}
								>
									{amountStr} units
								</Typography>
								{daysLeftStr && (
									<Typography
										variant="caption"
										sx={{
											fontWeight: 700,
											color: "#FFB74D",
											fontSize: "0.62rem",
										}}
									>
										{daysLeftStr}
									</Typography>
								)}
							</Box>
						</Paper>
					);
				})}
			</Box>
		</Box>
	);
};

export default ProductionSupplyContent;
