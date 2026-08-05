import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import MaterialBadge from "../../../../cosm/components/materialbadge";

interface BuildingsListProps {
	platformBreakdown: any[];
	timeOffset: number;
	selectedExchange: string;
	getCurrencyLabel: (ex: string) => string;
	getCondColor: (cond: number) => string;
}

export const BuildingsList: React.FC<BuildingsListProps> = ({
	platformBreakdown,
	timeOffset,
	selectedExchange,
	getCurrencyLabel,
	getCondColor,
}) => {
	const theme = useTheme();

	return (
		<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					p: 0.75,
					px: 1.25,
					bgcolor: "rgba(0, 0, 0, 0.4)",
					border: "1px solid rgba(255, 255, 255, 0.06)",
					borderRadius: "6px",
				}}
			>
				<Typography
					variant="subtitle2"
					sx={{
						fontWeight: 800,
						fontSize: "0.8rem",
						color: theme.palette.primary.main,
					}}
				>
					BUILDINGS ({platformBreakdown.length})
				</Typography>
			</Box>

			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					gap: 0.4,
					maxHeight: 210,
					overflowY: "auto",
					pr: 0.5,
				}}
			>
				{platformBreakdown.map((pb, idx) => {
					const bColor = getCondColor(pb.condition);

					return (
						<Box
							key={pb.id || idx}
							sx={{
								py: 0.25,
								px: 0.75,
								bgcolor: "rgba(0, 0, 0, 0.3)",
								borderRadius: "6px",
								border: `1px solid ${bColor}22`,
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								gap: 1.5,
							}}
						>
							<Typography
								variant="body2"
								sx={{
									fontWeight: 900,
									color: "#00e5ff",
									fontFamily: "monospace",
									minWidth: 60,
								}}
							>
								{pb.ticker}
							</Typography>
							<Typography
								variant="caption"
								sx={{
									fontWeight: 700,
									fontSize: "0.72rem",
									color: bColor,
									minWidth: 90,
								}}
							>
								{(pb.condition * 100).toFixed(0)}% (
								{(pb.ageDays + timeOffset).toFixed(0)}d age)
							</Typography>
							<Typography
								variant="caption"
								sx={{
									fontWeight: 800,
									fontSize: "0.75rem",
									color: theme.palette.warning.main,
									fontFamily: "monospace",
									minWidth: 80,
								}}
							>
								{pb.repairCost.toLocaleString()}{" "}
								{getCurrencyLabel(selectedExchange)}
							</Typography>

							{/* Material Badges with amounts */}
							<Box
								sx={{
									display: "flex",
									flexWrap: "wrap",
									gap: 0.5,
									justifyContent: "flex-end",
									flex: 1,
								}}
							>
								{Object.entries(pb.materials).map(([m, q]) => (
									<Box
										key={m}
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 0.25,
											bgcolor: "rgba(255,255,255,0.05)",
											px: 0.35,
											py: 0.1,
											borderRadius: "4px",
											border: "1px solid rgba(255,255,255,0.08)",
										}}
									>
										<span
											style={{
												fontSize: "0.58rem",
												fontWeight: 800,
												color: "rgba(255,255,255,0.75)",
											}}
										>
											{q}
										</span>
										<Box sx={{ fontSize: "0.55em" }}>
											<MaterialBadge ticker={m} />
										</Box>
									</Box>
								))}
							</Box>
						</Box>
					);
				})}
			</Box>
		</Box>
	);
};
