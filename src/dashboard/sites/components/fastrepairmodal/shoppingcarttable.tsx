import React from "react";
import {
	Box,
	Typography,
	Table,
	TableHead,
	TableRow,
	TableCell,
	TableBody,
	useTheme,
} from "@mui/material";
import { ShoppingCart } from "lucide-react";
import MaterialBadge from "../../../../cosm/components/materialbadge";

interface ShoppingCartTableProps {
	materialKeys: string[];
	repairMaterials: Record<string, number>;
	getMatPrice: (mat: string) => number;
	getMatMarketInfo: (mat: string) => any;
	selectedExchange: string;
	getCurrencyLabel: (ex: string) => string;
	totalVolume: number;
	totalWeight: number;
}

export const ShoppingCartTable: React.FC<ShoppingCartTableProps> = ({
	materialKeys,
	repairMaterials,
	getMatPrice,
	getMatMarketInfo,
	selectedExchange,
	getCurrencyLabel,
	totalVolume,
	totalWeight,
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
						display: "flex",
						alignItems: "center",
						gap: 0.5,
					}}
				>
					<ShoppingCart size={15} /> SHOPPING CART (REPAIR MATERIALS REQUIRED)
				</Typography>
				<Typography
					variant="caption"
					sx={{
						color: "rgba(255,255,255,0.6)",
						fontSize: "0.7rem",
						fontFamily: "monospace",
					}}
				>
					Payload: {totalVolume.toFixed(1)} m³ &nbsp;|&nbsp;{" "}
					{totalWeight.toFixed(1)} t
				</Typography>
			</Box>

			<Box
				sx={{
					maxHeight: "35vh",
					height: "auto",
					overflowY: "auto",
					border: "1px solid rgba(255,255,255,0.08)",
					borderRadius: "8px",
					bgcolor: "rgba(0,0,0,0.2)",
				}}
			>
				<Table
					size="small"
					stickyHeader
					sx={{
						bgcolor: "transparent",
						"& .MuiTableCell-stickyHeader": {
							bgcolor: "rgba(20, 20, 38, 0.97)",
							borderBottom: "2px solid rgba(255,255,255,0.1)",
						},
					}}
				>
					<TableHead>
						<TableRow>
							<TableCell
								sx={{
									color: theme.palette.primary.main,
									fontWeight: 800,
									py: 0.5,
								}}
							>
								Material
							</TableCell>
							<TableCell
								align="right"
								sx={{
									color: theme.palette.primary.main,
									fontWeight: 800,
									py: 0.5,
								}}
							>
								Required Qty
							</TableCell>
							<TableCell
								align="right"
								sx={{
									color: theme.palette.primary.main,
									fontWeight: 800,
									py: 0.5,
								}}
							>
								Price
							</TableCell>
							<TableCell
								align="right"
								sx={{
									color: theme.palette.primary.main,
									fontWeight: 800,
									py: 0.5,
								}}
							>
								Total Cost
							</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{materialKeys.length > 0 ? (
							materialKeys.map((mat) => {
								const qty = repairMaterials[mat] || 0;
								const unitPrice = getMatPrice(mat);
								const matCost = qty * unitPrice;
								const info = getMatMarketInfo(mat);

								return (
									<TableRow
										key={mat}
										sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.03)" } }}
									>
										<TableCell sx={{ py: 0.4 }}>
											<MaterialBadge ticker={mat} />
										</TableCell>
										<TableCell
											align="right"
											sx={{
												py: 0.4,
												fontFamily: "monospace",
												fontSize: "0.78rem",
												fontWeight: 700,
												color: "white",
											}}
										>
											{qty.toLocaleString()} u
										</TableCell>
										<TableCell
											align="right"
											sx={{
												py: 0.4,
												fontFamily: "monospace",
												fontSize: "0.75rem",
												color: "rgba(255,255,255,0.6)",
												lineHeight: 1.2,
											}}
										>
											<div>
												{unitPrice.toLocaleString()}{" "}
												{getCurrencyLabel(selectedExchange)}{" "}
												<span
													style={{
														color: "rgba(255,255,255,0.45)",
														fontSize: "0.68rem",
													}}
												>
													({info.corpPrice.toLocaleString()} ICA)
												</span>
											</div>
											<div
												style={{
													fontSize: "0.65rem",
													color: theme.palette.primary.main,
												}}
											>
												CX Avail: {info.cxAvail.toLocaleString()} u
											</div>
										</TableCell>
										<TableCell
											align="right"
											sx={{
												py: 0.4,
												fontFamily: "monospace",
												fontSize: "0.78rem",
												fontWeight: 700,
												color: theme.palette.warning.main,
											}}
										>
											<div>
												{matCost.toLocaleString()}{" "}
												{getCurrencyLabel(selectedExchange)}
											</div>
											<div
												style={{
													color: "rgba(255,255,255,0.45)",
													fontSize: "0.68rem",
													fontWeight: 500,
												}}
											>
												({(qty * info.corpPrice).toLocaleString()} ICA)
											</div>
										</TableCell>
									</TableRow>
								);
							})
						) : (
							<TableRow>
								<TableCell
									colSpan={4}
									align="center"
									sx={{
										py: 2,
										color: "rgba(255,255,255,0.5)",
										fontStyle: "italic",
										fontSize: "0.75rem",
									}}
								>
									No repair materials needed for selected buildings!
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</Box>
		</Box>
	);
};
