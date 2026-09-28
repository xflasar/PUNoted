import React from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Typography,
	Button,
	Stack,
	Paper,
	Box,
	FormControl,
	Select,
	MenuItem,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import MaterialBadge from "../../../../../cosm/components/materialbadge";

interface RecipeDialogProps {
	open: boolean;
	onClose: () => void;
	multiRecipeMaterials: Array<{ ticker: string; recipes: any[] }>;
	recipeOverrides: Record<string, number>;
	onRecipeOverrideChange?: (ticker: string, idx: number) => void;
	setInternalRecipeOverrides: React.Dispatch<
		React.SetStateAction<Record<string, number>>
	>;
}

export const RecipeDialog: React.FC<RecipeDialogProps> = ({
	open,
	onClose,
	multiRecipeMaterials,
	recipeOverrides,
	onRecipeOverrideChange,
	setInternalRecipeOverrides,
}) => (
	<Dialog
		open={open}
		onClose={onClose}
		maxWidth="sm"
		fullWidth
		slotProps={{
			paper: {
				sx: {
					bgcolor: "#141424",
					backgroundImage: "none",
					border: "1px solid rgba(186, 104, 200, 0.3)",
					borderRadius: 2.5,
					color: "#FFF",
				},
			},
		}}
	>
		<DialogTitle
			sx={{
				fontWeight: 800,
				color: "#BA68C8",
				display: "flex",
				alignItems: "center",
				gap: 1,
			}}
		>
			<SettingsIcon /> Material Recipe Overrides
		</DialogTitle>
		<DialogContent dividers sx={{ borderColor: "rgba(255,255,255,0.1)" }}>
			<Typography
				variant="body2"
				sx={{ color: "rgba(255,255,255,0.7)", mb: 2 }}
			>
				Configure preferred production recipes for materials with multiple
				variants. Selection is saved locally.
			</Typography>
			{multiRecipeMaterials.length === 0 ? (
				<Typography variant="body2" sx={{ color: "rgba(255,255,255,0.4)" }}>
					No multi-recipe materials detected.
				</Typography>
			) : (
				<Stack spacing={2}>
					{multiRecipeMaterials.map(({ ticker, recipes: recList }) => {
						const selectedIdx = recipeOverrides[ticker] ?? 0;
						return (
							<Paper
								key={ticker}
								sx={{
									p: 1.5,
									bgcolor: "rgba(255,255,255,0.03)",
									border: "1px solid rgba(255,255,255,0.08)",
									borderRadius: 2,
								}}
							>
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										justifyContent: "space-between",
										mb: 1,
									}}
								>
									<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
										<MaterialBadge ticker={ticker} />
										<Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
											{ticker} ({recList.length} Recipes)
										</Typography>
									</Box>
								</Box>
								<FormControl size="small" fullWidth>
									<Select
										value={selectedIdx}
										onChange={(e) => {
											const idx = Number(e.target.value);
											if (onRecipeOverrideChange)
												onRecipeOverrideChange(ticker, idx);
											else
												setInternalRecipeOverrides((prev) => ({
													...prev,
													[ticker]: idx,
												}));
										}}
										variant="outlined"
										sx={{
											fontSize: "0.8rem",
											color: "#FFF",
											bgcolor: "rgba(255,255,255,0.04)",
											"& .MuiOutlinedInput-notchedOutline": {
												borderColor: "rgba(186, 104, 200, 0.3)",
											},
										}}
									>
										{recList.map((rec, rIdx) => {
											const inpStr = rec.inputs
												.map((i: any) => `${i.amount} ${i.ticker}`)
												.join(" + ");
											return (
												<MenuItem
													key={rIdx}
													value={rIdx}
													sx={{ fontSize: "0.78rem" }}
												>
													{rec.building ? `[${rec.building}] ` : ""}
													{inpStr} ➔ {rec.outputAmount} {ticker}
												</MenuItem>
											);
										})}
									</Select>
								</FormControl>
							</Paper>
						);
					})}
				</Stack>
			)}
		</DialogContent>
		<DialogActions sx={{ p: 2 }}>
			<Button
				onClick={onClose}
				variant="contained"
				sx={{ bgcolor: "#7B68EE", fontWeight: 700 }}
			>
				Done
			</Button>
		</DialogActions>
	</Dialog>
);
