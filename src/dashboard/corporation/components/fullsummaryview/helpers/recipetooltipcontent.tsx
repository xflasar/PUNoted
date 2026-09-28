import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import MaterialBadge from "../../../../../cosm/components/materialbadge";

export const RecipeTooltipContent: React.FC<{
	targetTicker: string;
	recipe?: {
		inputs: Array<{ ticker: string; amount: number }>;
		outputAmount: number;
		building?: string;
	} | null;
	userRecipesUsed?: Array<{
		recipeKey: string;
		building?: string;
		dailyOutput: number;
		dailyCycles: number;
		outputAmount: number;
		inputs: Record<string, number>;
		users?: Array<{
			player: string;
			loc: string;
			dailyOutput: number;
			dailyCycles: number;
		}>;
	}> | null;
	getPriceFn: (t: string) => number;
	currSymbol?: string;
}> = ({
	targetTicker,
	recipe,
	userRecipesUsed,
	getPriceFn,
	currSymbol = "",
}) => {
	// If active user recipes exist, display all active user recipes breakdown
	if (userRecipesUsed && userRecipesUsed.length > 0) {
		return (
			<Box sx={{ p: 1, maxWidth: 380, maxHeight: 400, overflowY: "auto" }}>
				<Typography
					variant="caption"
					sx={{
						fontWeight: 800,
						color: "#BA68C8",
						display: "block",
						mb: 0.75,
						textTransform: "uppercase",
						letterSpacing: "0.04em",
					}}
				>
					ACTIVE USER RECIPES ({userRecipesUsed.length})
				</Typography>

				{userRecipesUsed.map((rec, rIdx) => {
					const inputList = Object.entries(rec.inputs || {}).map(([t, amt]) => {
						return { ticker: t, amount: amt };
					});
					const recipeTotalInputCost = inputList.reduce(
						(sum, inp) => sum + inp.amount * getPriceFn(inp.ticker),
						0,
					);
					const recipeUnitCost =
						rec.outputAmount > 0 ? recipeTotalInputCost / rec.outputAmount : 0;
					const userCount = rec.users ? rec.users.length : 0;

					return (
						<Paper
							key={rIdx}
							sx={{
								p: 1,
								bgcolor: "rgba(13, 13, 25, 0.85)",
								border: "1px solid rgba(186, 104, 200, 0.3)",
								borderRadius: 1.5,
								mb: rIdx < userRecipesUsed.length - 1 ? 1 : 0,
							}}
						>
							<Box
								sx={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									mb: 0.5,
								}}
							>
								<Typography
									variant="caption"
									sx={{
										fontWeight: 800,
										color: "#BA68C8",
										fontSize: "0.72rem",
									}}
								>
									{rec.building ? `RECIPE (${rec.building})` : "RECIPE"}
								</Typography>
								<Typography
									variant="caption"
									sx={{
										color: "#64FFDA",
										fontWeight: 700,
										fontSize: "0.68rem",
									}}
								>
									{userCount} User{userCount !== 1 ? "s" : ""}
								</Typography>
							</Box>

							{/* Formula row */}
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 0.5,
									flexWrap: "wrap",
									mb: 0.75,
								}}
							>
								{inputList.map((inp, idx) => (
									<React.Fragment key={idx}>
										{idx > 0 && (
											<Typography
												variant="caption"
												sx={{
													color: "#BA68C8",
													fontWeight: 800,
													px: 0.1,
													fontSize: "0.65rem",
												}}
											>
												+
											</Typography>
										)}
										<Box
											sx={{ display: "flex", alignItems: "center", gap: 0.4 }}
										>
											<MaterialBadge ticker={inp.ticker} />
											<Typography
												variant="caption"
												sx={{
													fontWeight: 700,
													color: "#FFF",
													fontSize: "0.68rem",
												}}
											>
												x
												{inp.amount < 1
													? inp.amount.toFixed(2)
													: Math.round(inp.amount)}
											</Typography>
										</Box>
									</React.Fragment>
								))}

								<ArrowForwardIcon
									sx={{ color: "#BA68C8", fontSize: 14, mx: 0.25 }}
								/>

								<Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
									<MaterialBadge ticker={targetTicker} />
									<Typography
										variant="caption"
										sx={{
											fontWeight: 800,
											color: "#64FFDA",
											fontSize: "0.68rem",
										}}
									>
										x{rec.outputAmount}
									</Typography>
								</Box>
							</Box>

							{/* Input Costs */}
							<Typography
								variant="caption"
								sx={{
									color: "rgba(255,255,255,0.6)",
									display: "block",
									fontSize: "0.62rem",
									mb: 0.25,
								}}
							>
								Input Unit Cost:{" "}
								{recipeUnitCost.toLocaleString(undefined, {
									maximumFractionDigits: 2,
								})}{" "}
								/ unit
							</Typography>

							{inputList.map((inp, idx) => {
								const price = getPriceFn(inp.ticker);
								const cost = inp.amount * price;
								const unitContrib =
									rec.outputAmount > 0 ? cost / rec.outputAmount : cost;
								return (
									<Box
										key={idx}
										sx={{
											display: "flex",
											justifyContent: "space-between",
											fontSize: "0.65rem",
											py: 0.1,
										}}
									>
										<Typography
											variant="caption"
											sx={{
												color: "rgba(255,255,255,0.6)",
												fontSize: "0.64rem",
											}}
										>
											{inp.amount < 1
												? inp.amount.toFixed(2)
												: Math.round(inp.amount)}
											x {inp.ticker} @{" "}
											{price.toLocaleString(undefined, {
												maximumFractionDigits: 1,
											})}
										</Typography>
										<Typography
											variant="caption"
											sx={{
												fontWeight: 700,
												color: "#FFF",
												fontSize: "0.64rem",
											}}
										>
											{cost.toLocaleString(undefined, {
												maximumFractionDigits: 1,
											})}
											{rec.outputAmount > 1 && (
												<span
													style={{
														color: "rgba(255,255,255,0.4)",
														fontWeight: 400,
														marginLeft: 4,
													}}
												>
													(
													{unitContrib.toLocaleString(undefined, {
														maximumFractionDigits: 2,
													})}
													/u)
												</span>
											)}
										</Typography>
									</Box>
								);
							})}

							{/* Users List Sub-Box */}
							{rec.users && rec.users.length > 0 && (
								<Box
									sx={{
										mt: 0.5,
										pt: 0.5,
										borderTop: "1px dashed rgba(255,255,255,0.1)",
									}}
								>
									{rec.users.map((u, uIdx) => (
										<Box
											key={uIdx}
											sx={{
												display: "flex",
												justifyContent: "space-between",
												alignItems: "center",
												fontSize: "0.62rem",
											}}
										>
											<Typography
												variant="caption"
												sx={{
													color: "#81C784",
													fontWeight: 700,
													fontSize: "0.62rem",
												}}
											>
												{u.player} ({u.loc})
											</Typography>
											<Typography
												variant="caption"
												sx={{
													color: "rgba(255,255,255,0.5)",
													fontSize: "0.62rem",
												}}
											>
												{u.dailyOutput.toLocaleString(undefined, {
													maximumFractionDigits: 1,
												})}
												/d ({u.dailyCycles.toFixed(1)} cyc/d)
											</Typography>
										</Box>
									))}
								</Box>
							)}
						</Paper>
					);
				})}
			</Box>
		);
	}

	if (!recipe || !recipe.inputs || recipe.inputs.length === 0) {
		return (
			<Box sx={{ p: 1 }}>
				<Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
					No Recipe Data
				</Typography>
			</Box>
		);
	}

	const totalInputCost = recipe.inputs.reduce(
		(sum, inp) => sum + inp.amount * getPriceFn(inp.ticker),
		0,
	);

	return (
		<Box sx={{ p: 1, maxWidth: 360 }}>
			<Typography
				variant="caption"
				sx={{
					fontWeight: 800,
					color: "#BA68C8",
					display: "block",
					mb: 0.75,
					textTransform: "uppercase",
				}}
			>
				{recipe.building && recipe.building.length < 10
					? `RECIPE (${recipe.building})`
					: "RECIPE"}
			</Typography>

			<Paper
				sx={{
					p: 1,
					bgcolor: "rgba(13, 13, 25, 0.8)",
					border: "1px solid rgba(186, 104, 200, 0.3)",
					borderRadius: 1.5,
					mb: 1,
				}}
			>
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						gap: 0.75,
						flexWrap: "wrap",
					}}
				>
					{recipe.inputs.map((inp, idx) => (
						<React.Fragment key={idx}>
							{idx > 0 && (
								<Typography
									variant="caption"
									sx={{ color: "#BA68C8", fontWeight: 800, px: 0.2 }}
								>
									+
								</Typography>
							)}
							<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
								<MaterialBadge ticker={inp.ticker} />
								<Typography
									variant="caption"
									sx={{ fontWeight: 700, color: "#FFF" }}
								>
									x
									{inp.amount < 1
										? inp.amount.toFixed(2)
										: Math.round(inp.amount)}
								</Typography>
							</Box>
						</React.Fragment>
					))}

					<ArrowForwardIcon sx={{ color: "#BA68C8", fontSize: 16, mx: 0.5 }} />

					<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
						<MaterialBadge ticker={targetTicker} />
						<Typography
							variant="caption"
							sx={{ fontWeight: 800, color: "#64FFDA" }}
						>
							x{recipe.outputAmount}
						</Typography>
					</Box>
				</Box>
			</Paper>

			<Typography
				variant="caption"
				sx={{ color: "rgba(255,255,255,0.7)", display: "block", mb: 0.5 }}
			>
				Cost Breakdown:
			</Typography>
			{recipe.inputs.map((inp, idx) => {
				const price = getPriceFn(inp.ticker);
				const cost = inp.amount * price;
				const unitCostContrib =
					recipe.outputAmount > 0 ? cost / recipe.outputAmount : cost;
				return (
					<Box
						key={idx}
						sx={{
							display: "flex",
							justifyContent: "space-between",
							fontSize: "0.68rem",
							py: 0.2,
						}}
					>
						<Typography
							variant="caption"
							sx={{ color: "rgba(255,255,255,0.6)" }}
						>
							{inp.amount < 1 ? inp.amount.toFixed(2) : Math.round(inp.amount)}x{" "}
							{inp.ticker} @{" "}
							{price.toLocaleString(undefined, { maximumFractionDigits: 1 })}
						</Typography>
						<Typography
							variant="caption"
							sx={{ fontWeight: 700, color: "#FFF" }}
						>
							{cost.toLocaleString(undefined, { maximumFractionDigits: 1 })}
							{recipe.outputAmount > 1 && (
								<span
									style={{
										color: "rgba(255,255,255,0.4)",
										fontWeight: 400,
										marginLeft: 4,
									}}
								>
									(
									{unitCostContrib.toLocaleString(undefined, {
										maximumFractionDigits: 2,
									})}
									/unit)
								</span>
							)}
						</Typography>
					</Box>
				);
			})}
		</Box>
	);
};
