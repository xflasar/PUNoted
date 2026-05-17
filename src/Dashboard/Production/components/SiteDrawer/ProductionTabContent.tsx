import React from "react";
import {
	Box,
	Typography,
	Paper,
	Stack,
	Chip,
	useTheme,
	alpha,
} from "@mui/material";
import { Factory, ArrowRight, ArrowDown } from "lucide-react";
import type { SiteSummary } from "../../types";

export const ProductionTabContent = ({ site }: { site: SiteSummary }) => {
	const theme = useTheme();

	if (!site.production_lines.length) {
		return (
			<Box sx={{ textAlign: "center", py: 5, opacity: 0.5 }}>
				<Factory size={48} />
				<Typography variant="h6" mt={2}>
					No Production Lines
				</Typography>
			</Box>
		);
	}

	return (
		<Stack spacing={1.5}>
			{site.production_lines.map((line: any, idx: number) => {
				const effColor =
					line.efficiency > 0.9
						? "success.main"
						: line.efficiency > 0.5
							? "warning.main"
							: "error.main";
				return (
					<Paper
						key={`${line.line_id}-${idx}`}
						variant="outlined"
						sx={{
							p: 0,
							overflow: "hidden",
							bgcolor: alpha(theme.palette.background.default, 0.4),
						}}
					>
						<Box
							sx={{
								p: 1,
								px: 1.5,
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								borderBottom: `1px solid ${theme.palette.divider}`,
								bgcolor: alpha(theme.palette.text.primary, 0.03),
							}}
						>
							<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
								<Factory size={16} color={theme.palette.text.secondary} />
								<Typography variant="subtitle2" fontWeight={800}>
									{line.type}
								</Typography>
							</Box>
							<Chip
								label={`${(line.efficiency * 100).toFixed(0)}%`}
								size="small"
								sx={{
									height: 18,
									fontWeight: 800,
									fontSize: "0.65rem",
									bgcolor: alpha(
										theme.palette[effColor.split(".")[0] as any].main,
										0.15,
									),
									color: effColor,
								}}
							/>
						</Box>
						<Box sx={{ p: 1.5 }}>
							{line.production_orders.length > 0 ? (
								<Stack spacing={1}>
									{line.production_orders.map((order: any, i: number) => (
										<Box
											key={order.order_id}
											sx={{
												display: { xs: "flex", sm: "grid" },
												flexDirection: { xs: "column", sm: "row" },
												gridTemplateColumns: { sm: "20px 1fr 20px 1fr" },
												alignItems: { xs: "flex-start", sm: "center" },
												gap: { xs: 0.5, sm: 1 },
												p: 0.5,
												borderRadius: 1,
												bgcolor: alpha(theme.palette.background.default, 0.5),
											}}
										>
											<Typography
												variant="caption"
												color="text.disabled"
												fontWeight={700}
												sx={{ display: { xs: "none", sm: "block" } }}
											>
												{i + 1}.
											</Typography>
											<Box
												sx={{
													display: "flex",
													flexWrap: "wrap",
													gap: 0.5,
													width: "100%",
												}}
											>
												{order.production_recipe.inputs.map(
													(inMat: any, k: number) => (
														<Typography
															key={k}
															variant="caption"
															sx={{
																bgcolor: alpha(
																	theme.palette.text.secondary,
																	0.1,
																),
																px: 0.5,
																borderRadius: 0.5,
																fontWeight: 600,
															}}
														>
															{inMat.ticker}
														</Typography>
													),
												)}
											</Box>
											<Box
												sx={{
													display: "flex",
													justifyContent: "center",
													width: { xs: "100%", sm: "auto" },
													opacity: 0.5,
												}}
											>
												<Box sx={{ display: { xs: "block", sm: "none" } }}>
													<ArrowDown size={12} />
												</Box>
												<Box sx={{ display: { xs: "none", sm: "block" } }}>
													<ArrowRight size={12} />
												</Box>
											</Box>
											<Box
												sx={{
													display: "flex",
													flexWrap: "wrap",
													gap: 0.5,
													width: "100%",
												}}
											>
												{order.production_recipe.outputs.map(
													(outMat: any, k: number) => (
														<Typography
															key={k}
															variant="caption"
															sx={{
																bgcolor: alpha(theme.palette.primary.main, 0.1),
																color: "primary.main",
																px: 0.5,
																borderRadius: 0.5,
																fontWeight: 800,
															}}
														>
															{outMat.ticker}
														</Typography>
													),
												)}
											</Box>
										</Box>
									))}
								</Stack>
							) : (
								<Typography
									variant="caption"
									fontStyle="italic"
									color="text.disabled"
								>
									Idle
								</Typography>
							)}
						</Box>
					</Paper>
				);
			})}
		</Stack>
	);
};
