import React from "react";
import { Stack, Card, CardContent, Typography } from "@mui/material";

export interface StatsBarProps {
	total: number;
	delivered: number;
	inProduction: number;
	totalValue: number;
}

export const StatsBar: React.FC<StatsBarProps> = ({
	total,
	delivered,
	inProduction,
	totalValue,
}) => {
	return (
		<Stack
			direction="row"
			spacing={1}
			sx={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				width: "100%",
				flexWrap: "wrap",
				gap: 1,
				mb: 0.2,
			}}
		>
			<Card
				sx={{
					background: "rgba(30, 29, 45, 0.45)",
					backdropFilter: "blur(12px)",
					color: "white",
					borderRadius: "10px",
					border: "1px solid rgba(255,255,255,0.08)",
					width: 100,
					height: 48,
					textAlign: "center",
					boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
				}}
			>
				<CardContent sx={{ p: 0.6, "&:last-child": { pb: 0.6 } }}>
					<Typography
						variant="caption"
						color="rgba(255,255,255,0.4)"
						sx={{ fontSize: "12px", fontWeight: "bold", display: "block" }}
					>
						TOTAL
					</Typography>
					<Typography
						variant="body2"
						sx={{ fontSize: "12.5px", fontWeight: "bold" }}
					>
						{total}
					</Typography>
				</CardContent>
			</Card>
			<Card
				sx={{
					background: "rgba(30, 29, 45, 0.45)",
					backdropFilter: "blur(12px)",
					color: "white",
					borderRadius: "10px",
					border: "1px solid rgba(255,255,255,0.08)",
					width: 100,
					height: 48,
					textAlign: "center",
					boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
				}}
			>
				<CardContent sx={{ p: 0.6, "&:last-child": { pb: 0.6 } }}>
					<Typography
						variant="caption"
						color="rgba(255,255,255,0.4)"
						sx={{ fontSize: "12px", fontWeight: "bold", display: "block" }}
					>
						DELIVERED
					</Typography>
					<Typography
						variant="body2"
						sx={{ color: "#ff9800", fontSize: "12.5px", fontWeight: "bold" }}
					>
						{delivered}
					</Typography>
				</CardContent>
			</Card>
			<Card
				sx={{
					background: "rgba(30, 29, 45, 0.45)",
					backdropFilter: "blur(12px)",
					color: "white",
					borderRadius: "10px",
					border: "1px solid rgba(255,255,255,0.08)",
					width: 100,
					height: 48,
					textAlign: "center",
					boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
				}}
			>
				<CardContent sx={{ p: 0.6, "&:last-child": { pb: 0.6 } }}>
					<Typography
						variant="caption"
						color="rgba(255,255,255,0.4)"
						sx={{ fontSize: "12px", fontWeight: "bold", display: "block" }}
					>
						QUEUED
					</Typography>
					<Typography
						variant="body2"
						sx={{ color: "#2196f3", fontSize: "12.5px", fontWeight: "bold" }}
					>
						{inProduction}
					</Typography>
				</CardContent>
			</Card>
			<Card
				sx={{
					background: "rgba(30, 29, 45, 0.45)",
					backdropFilter: "blur(12px)",
					color: "white",
					borderRadius: "10px",
					border: "1px solid rgba(255,255,255,0.08)",
					width: 120,
					height: 48,
					textAlign: "center",
					boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
				}}
			>
				<CardContent sx={{ p: 0.6, "&:last-child": { pb: 0.6 } }}>
					<Typography
						variant="caption"
						color="rgba(255,255,255,0.4)"
						sx={{ fontSize: "12px", fontWeight: "bold", display: "block" }}
					>
						Total value
					</Typography>
					<Typography
						variant="body2"
						sx={{ color: "#2196f3", fontSize: "12.5px", fontWeight: "bold" }}
					>
						${totalValue.toLocaleString()}
					</Typography>
				</CardContent>
			</Card>
		</Stack>
	);
};
