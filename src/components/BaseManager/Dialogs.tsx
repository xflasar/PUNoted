import React from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Box,
	Typography,
	IconButton,
	Card,
	FormControlLabel,
	Switch,
	Divider,
	ToggleButtonGroup,
	ToggleButton,
	Select,
	MenuItem,
	InputLabel,
	FormControl,
	TextField,
	alpha,
	useTheme,
} from "@mui/material";
import {
	Add as AddIcon,
	Remove as RemoveIcon,
	Settings as SettingsIcon,
	CloudSync as SyncIcon,
} from "@mui/icons-material";
import { EXPERT_CATEGORIES, EXPERT_BONUS, FACTIONS } from "./constants";
import { formatDuration } from "./helpers";

/**
 * Props for the SettingsDialog component.
 */
export interface SettingsDialogProps {
	open: boolean;
	onClose: () => void;
	syncMode: "sync" | "manual";
	setSyncMode: (mode: "sync" | "manual") => void;
	setDraftBaseData: React.Dispatch<React.SetStateAction<any>>;
	planDefaultPricing: "market" | "corp";
	setPlanDefaultPricing: (pricing: "market" | "corp") => void;
	allUniqueMaterials: string[];
	globalMatPrices: Record<string, "market" | "corp">;
	setGlobalMatPrices: React.Dispatch<
		React.SetStateAction<Record<string, "market" | "corp">>
	>;
	activeFaction: string;
	setActiveFaction: (faction: string) => void;
	usedPermits: number;
	setUsedPermits: (permits: number) => void;
	totalPermits: number;
	setTotalPermits: (permits: number) => void;
	experts: Record<string, number>;
	setExperts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

/**
 * SettingsDialog Component
 *
 * Allows the user to configure global base settings such as the operating mode
 * (manual vs API synced), faction bonuses, HQ permits, expert allocations, and
 * default pricing tiers (market vs corporation) for materials.
 */
export const SettingsDialog: React.FC<SettingsDialogProps> = ({
	open,
	onClose,
	syncMode,
	setSyncMode,
	setDraftBaseData,
	planDefaultPricing,
	setPlanDefaultPricing,
	allUniqueMaterials,
	globalMatPrices,
	setGlobalMatPrices,
	activeFaction,
	setActiveFaction,
	usedPermits,
	setUsedPermits,
	totalPermits,
	setTotalPermits,
	experts,
	setExperts,
}) => {
	const theme = useTheme();
	return (
		<Dialog
			open={open}
			onClose={onClose}
			disablePortal
			maxWidth="md"
			fullWidth
			PaperProps={{
				sx: { bgcolor: "background.default", backgroundImage: "none" },
			}}
		>
			<DialogTitle
				sx={{ py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}
			>
				<Box display="flex" alignItems="center" gap={1}>
					<SettingsIcon color="primary" /> Base Plan Settings
				</Box>
			</DialogTitle>
			<DialogContent
				sx={{
					pt: 2,
					display: "flex",
					flexDirection: { xs: "column", md: "row" },
					gap: 3,
				}}
			>
				{/* LEFT COLUMN: Core Settings */}
				<Box sx={{ flex: 1 }}>
					{/* Operation Mode Toggle */}
					<Box sx={{ mb: 3 }}>
						<Typography variant="subtitle2" color="text.secondary" mb={1}>
							Operation Mode
						</Typography>
						<Card
							variant="outlined"
							sx={{
								p: 2,
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								bgcolor:
									syncMode === "sync"
										? alpha(theme.palette.primary.main, 0.05)
										: "background.paper",
							}}
						>
							<Box>
								<Typography variant="subtitle1" fontWeight="bold">
									{syncMode === "sync" ? "Synced to PU API" : "Manual Plan"}
								</Typography>
								{syncMode === "sync" ? (
									<Typography
										variant="body2"
										color="success.main"
										display="flex"
										alignItems="center"
										gap={0.5}
									>
										<SyncIcon fontSize="small" /> Active
									</Typography>
								) : (
									<Typography variant="body2" color="text.secondary">
										Isolated plan.
									</Typography>
								)}
							</Box>
							<FormControlLabel
								control={
									<Switch
										checked={syncMode === "sync"}
										onChange={(e) => {
											setSyncMode(e.target.checked ? "sync" : "manual");
											setDraftBaseData((prev: any) => ({
												...prev,
												status: e.target.checked ? "actual" : "manual",
											}));
										}}
									/>
								}
								label="Sync On"
							/>
						</Card>
					</Box>

					<Divider sx={{ mb: 3 }} />

					{/* Faction and Permits Configuration */}
					<Box sx={{ mb: 3 }}>
						<Typography variant="subtitle2" color="text.secondary" mb={1}>
							HQ Faction & Permits
						</Typography>
						<Card
							variant="outlined"
							sx={{
								p: 2,
								display: "flex",
								flexDirection: "column",
								gap: 2,
								bgcolor: "background.paper",
							}}
						>
							<FormControl fullWidth size="small">
								<InputLabel>Faction Bonus</InputLabel>
								<Select
									value={activeFaction}
									label="Faction Bonus"
									onChange={(e) => setActiveFaction(e.target.value)}
									MenuProps={{
										PaperProps: {
											sx: {
												bgcolor: "background.default",
												backgroundImage: "none",
											},
										},
									}}
								>
									{FACTIONS.map((f) => (
										<MenuItem key={f} value={f}>
											{f}
										</MenuItem>
									))}
								</Select>
							</FormControl>
							<Box
								display="flex"
								alignItems="center"
								justifyContent="space-between"
							>
								<Typography variant="body2" color="text.secondary">
									HQ Permits Used / Total
								</Typography>
								<Box display="flex" alignItems="center" gap={1}>
									<TextField
										type="number"
										size="small"
										value={usedPermits}
										onChange={(e) =>
											setUsedPermits(Math.max(0, parseInt(e.target.value) || 0))
										}
										inputProps={{
											style: { textAlign: "center", width: 45, padding: "6px" },
										}}
									/>
									<Typography variant="body1">/</Typography>
									<TextField
										type="number"
										size="small"
										value={totalPermits}
										onChange={(e) =>
											setTotalPermits(
												Math.max(1, parseInt(e.target.value) || 1),
											)
										}
										inputProps={{
											style: { textAlign: "center", width: 45, padding: "6px" },
										}}
									/>
								</Box>
							</Box>
						</Card>
					</Box>

					<Divider sx={{ mb: 3 }} />

					{/* Base Experts Configuration */}
					<Box>
						<Typography variant="subtitle2" color="text.secondary" mb={1}>
							Base Experts
						</Typography>
						<Card
							variant="outlined"
							sx={{ p: 1.5, bgcolor: "background.paper" }}
						>
							<Box
								sx={{
									mb: 1.5,
									pb: 1,
									borderBottom: "1px solid",
									borderColor: "divider",
									display: "flex",
									justifyContent: "space-between",
								}}
							>
								<Typography variant="body2" color="text.secondary">
									Assigned:
								</Typography>
								<Typography
									variant="body2"
									color={
										Object.values(experts).reduce(
											(a: any, b: any) => a + b,
											0,
										) >= 6
											? "error.main"
											: "success.main"
									}
									fontWeight="bold"
								>
									{Object.values(experts).reduce((a: any, b: any) => a + b, 0)}{" "}
									/ 6 Max
								</Typography>
							</Box>
							<Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 1 }}>
								{EXPERT_CATEGORIES.map((cat) => {
									const val = experts[cat] || 0;
									return (
										<Box
											key={cat}
											sx={{
												display: "flex",
												alignItems: "center",
												justifyContent: "space-between",
											}}
										>
											<Typography variant="body2" sx={{ width: 110 }}>
												{cat}
											</Typography>
											<Box
												display="flex"
												alignItems="center"
												border="1px solid"
												borderColor="divider"
												borderRadius={1}
												bgcolor="background.default"
											>
												<IconButton
													size="small"
													onClick={() =>
														setExperts((p: any) => ({
															...p,
															[cat]: Math.max(0, val - 1),
														}))
													}
													sx={{ p: 0.15 }}
												>
													<RemoveIcon sx={{ fontSize: "0.8rem" }} />
												</IconButton>
												<Typography
													variant="body2"
													sx={{
														minWidth: 20,
														textAlign: "center",
														fontWeight: "bold",
													}}
												>
													{val}
												</Typography>
												<IconButton
													size="small"
													onClick={() => {
														if (
															Object.values(experts).reduce(
																(a: any, b: any) => a + b,
																0,
															) < 6 &&
															val < 5
														)
															setExperts((p: any) => ({
																...p,
																[cat]: val + 1,
															}));
													}}
													sx={{ p: 0.15 }}
												>
													<AddIcon sx={{ fontSize: "0.8rem" }} />
												</IconButton>
											</Box>
											<Typography
												variant="body2"
												sx={{
													width: 45,
													textAlign: "right",
													color: "info.main",
													fontWeight: "bold",
												}}
											>
												+{(EXPERT_BONUS[val] * 100).toFixed(1)}%
											</Typography>
										</Box>
									);
								})}
							</Box>
						</Card>
					</Box>
				</Box>

				{/* RIGHT COLUMN: Pricing Configurations */}
				<Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
					<Box sx={{ mb: 3 }}>
						<Typography variant="subtitle2" color="text.secondary" mb={1}>
							Plan Default Pricing
						</Typography>
						<Card
							variant="outlined"
							sx={{
								p: 1.5,
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								bgcolor: "background.paper",
							}}
						>
							<Box>
								<Typography variant="body2" fontWeight="bold">
									Global Pricing Tier
								</Typography>
							</Box>
							<ToggleButtonGroup
								size="small"
								value={planDefaultPricing}
								exclusive
								onChange={(_, val) => val && setPlanDefaultPricing(val)}
								sx={{ height: 30 }}
							>
								<ToggleButton value="market" sx={{ px: 2 }}>
									<Typography variant="body2" fontWeight="bold">
										Market
									</Typography>
								</ToggleButton>
								<ToggleButton value="corp" sx={{ px: 2 }}>
									<Typography variant="body2" fontWeight="bold">
										Corp
									</Typography>
								</ToggleButton>
							</ToggleButtonGroup>
						</Card>
					</Box>

					{/* Specific Material Price Overrides */}
					<Box
						sx={{
							flexGrow: 1,
							display: "flex",
							flexDirection: "column",
							minHeight: 0,
						}}
					>
						<Typography variant="subtitle2" color="text.secondary" mb={1}>
							Material Specific Overrides
						</Typography>
						<Box
							sx={{
								overflowY: "auto",
								pr: 1,
								maxHeight: 400,
								display: "grid",
								gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
								gap: 1,
							}}
						>
							{allUniqueMaterials.map((ticker: string) => (
								<Card
									key={ticker}
									variant="outlined"
									sx={{
										p: 1,
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										bgcolor: "background.paper",
									}}
								>
									<Typography variant="body2" fontWeight="bold">
										{ticker}
									</Typography>
									<ToggleButtonGroup
										size="small"
										value={globalMatPrices[ticker] || planDefaultPricing}
										exclusive
										onChange={(_, val) =>
											val &&
											setGlobalMatPrices((p: any) => ({ ...p, [ticker]: val }))
										}
										sx={{ height: 26 }}
									>
										<ToggleButton value="market" sx={{ px: 1.5, py: 0 }}>
											<Typography variant="body2">M</Typography>
										</ToggleButton>
										<ToggleButton value="corp" sx={{ px: 1.5, py: 0 }}>
											<Typography variant="body2">C</Typography>
										</ToggleButton>
									</ToggleButtonGroup>
								</Card>
							))}
						</Box>
					</Box>
				</Box>
			</DialogContent>
			<DialogActions
				sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}
			>
				<Button onClick={onClose} variant="contained" color="primary">
					Close
				</Button>
			</DialogActions>
		</Dialog>
	);
};

/**
 * Props for the AddPlatformDialog component.
 */
export interface AddPlatformDialogProps {
	open: boolean;
	onClose: () => void;
	newTicker: string;
	setNewTicker: (ticker: string) => void;
	newAmount: number;
	setNewAmount: (amount: number) => void;
	activeBuildings: any[];
	onAdd: () => void;
}

/**
 * AddPlatformDialog Component
 *
 * Provides an interface to add a new production building (platform) to the base.
 * Users can select the building type and specify the initial quantity.
 */
export const AddPlatformDialog: React.FC<AddPlatformDialogProps> = ({
	open,
	onClose,
	newTicker,
	setNewTicker,
	newAmount,
	setNewAmount,
	activeBuildings,
	onAdd,
}) => (
	<Dialog
		open={open}
		onClose={onClose}
		disablePortal
		PaperProps={{
			sx: { bgcolor: "background.default", backgroundImage: "none" },
		}}
	>
		<DialogTitle
			sx={{ py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}
		>
			Add Production Line
		</DialogTitle>
		<DialogContent sx={{ pt: 2, minWidth: 250 }}>
			<Select
				fullWidth
				size="small"
				value={newTicker}
				onChange={(e) => setNewTicker(e.target.value)}
				sx={{ mb: 2 }}
				MenuProps={{
					PaperProps: {
						sx: { bgcolor: "background.default", backgroundImage: "none" },
					},
				}}
			>
				{activeBuildings
					.filter((b: any) => b.type === "production")
					.map((b: any) => (
						<MenuItem key={b.ticker} value={b.ticker}>
							{b.name} ({b.ticker})
						</MenuItem>
					))}
			</Select>
			<TextField
				label="Amount"
				type="number"
				size="small"
				fullWidth
				value={newAmount}
				onChange={(e) => setNewAmount(parseInt(e.target.value) || 1)}
			/>
		</DialogContent>
		<DialogActions
			sx={{ p: 1.5, borderTop: "1px solid", borderColor: "divider" }}
		>
			<Button onClick={onClose}>Cancel</Button>
			<Button variant="contained" color="primary" onClick={onAdd}>
				Add
			</Button>
		</DialogActions>
	</Dialog>
);

/**
 * Props for the AddRecipeDialog component.
 */
export interface AddRecipeDialogProps {
	open: boolean;
	onClose: () => void;
	selected: string;
	setSelected: (recipeId: string) => void;
	available: any[];
	onAdd: () => void;
}

/**
 * AddRecipeDialog Component
 *
 * Allows the user to select and add a specific production recipe to the selected
 * platform's production queue. It only shows recipes compatible with the platform.
 */
export const AddRecipeDialog: React.FC<AddRecipeDialogProps> = ({
	open,
	onClose,
	selected,
	setSelected,
	available,
	onAdd,
}) => (
	<Dialog
		open={open}
		onClose={onClose}
		disablePortal
		maxWidth="sm"
		fullWidth
		PaperProps={{
			sx: { bgcolor: "background.default", backgroundImage: "none" },
		}}
	>
		<DialogTitle
			sx={{ py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}
		>
			Add Recipe to Queue
		</DialogTitle>
		<DialogContent sx={{ pt: 2, minWidth: 350 }}>
			<Select
				fullWidth
				size="small"
				value={selected || ""}
				onChange={(e) => setSelected(e.target.value)}
				MenuProps={{
					PaperProps: {
						sx: { bgcolor: "background.default", backgroundImage: "none" },
					},
				}}
			>
				{available.length === 0 ? (
					<MenuItem value="" disabled>
						No recipes available
					</MenuItem>
				) : (
					available.map((r: any) => (
						<MenuItem key={r.id} value={r.id}>
							{r.inStr} ➔ {r.outStr} |{" "}
							{formatDuration(r.modifiedDuration || r.duration)}
						</MenuItem>
					))
				)}
			</Select>
		</DialogContent>
		<DialogActions
			sx={{ borderTop: "1px solid", borderColor: "divider", p: 1.5 }}
		>
			<Button onClick={onClose}>Cancel</Button>
			<Button
				variant="contained"
				color="secondary"
				disabled={!selected}
				onClick={onAdd}
			>
				Add to Queue
			</Button>
		</DialogActions>
	</Dialog>
);
