import React from "react";
import {
	Box,
	Typography,
	Paper,
	Stack,
	Grid,
	Chip,
	Button,
	Alert,
	CircularProgress,
	useTheme,
	alpha,
} from "@mui/material";
import { AlertTriangle, Activity } from "lucide-react";
import { copyToClipboard } from "./utils";

interface Props {
	loading: boolean;
	repairs: any[];
	platforms: any[];
	onShowSnackbar: (msg: string) => void;
}

export const InfraTabContent: React.FC<Props> = ({
	loading,
	repairs,
	platforms,
	onShowSnackbar,
}) => {
	const theme = useTheme();

	const handleCopyRepairs = (mode: "transfer" | "buy") => {
		if (!repairs.length) return;
		const materials: Record<string, number> = {};
		repairs.forEach((r) => (materials[r.ticker] = r.total_amount));

		const action =
			mode === "transfer"
				? {
						type: "MTRA",
						name: "Repair Transfer",
						group: "A1",
						origin: "Configure on Execution",
						dest: "Configure on Execution",
					}
				: {
						type: "CX Buy",
						name: "Repair Buy",
						group: "A1",
						origin: "Configure on Execution",
						exchange: "IC1",
						priceLimits: {},
						buyPartial: false,
						useCXInv: true,
					};

		const xit = {
			actions: [action],
			global: { name: "Repair" },
			groups: [{ type: "Manual", name: "A1", materials }],
		};
		copyToClipboard(JSON.stringify(xit));
		onShowSnackbar(`Copied ${mode === "transfer" ? "MTRA" : "CX Buy"} XIT`);
	};

	if (loading)
		return (
			<Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
				<CircularProgress />
			</Box>
		);

	const RepairRow = ({ label, value }: { label: string; value: string }) => (
		<Box
			sx={{
				display: "flex",
				justifyContent: "space-between",
				fontSize: "0.85rem",
				py: 0.5,
				borderBottom: "1px dashed rgba(255,255,255,0.1)",
			}}
		>
			<Typography color="text.secondary">{label}</Typography>
			<Typography fontWeight={600} color="text.primary">
				{value}
			</Typography>
		</Box>
	);

	return (
		<Stack spacing={3}>
			{repairs.length > 0 ? (
				<Paper
					variant="outlined"
					sx={{
						p: 2,
						borderColor: "warning.main",
						bgcolor: alpha(theme.palette.warning.main, 0.05),
					}}
				>
					<Box
						sx={{
							display: "flex",
							flexDirection: { xs: "column", sm: "row" },
							justifyContent: "space-between",
							alignItems: { xs: "flex-start", sm: "center" },
							gap: 2,
							mb: 2,
						}}
					>
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							<AlertTriangle color={theme.palette.warning.main} />
							<Typography
								variant="subtitle2"
								fontWeight={800}
								color="warning.main"
							>
								REPAIRS REQUIRED
							</Typography>
						</Box>
						<Box
							sx={{
								display: "flex",
								gap: 1,
								width: { xs: "100%", sm: "auto" },
							}}
						>
							<Button
								size="small"
								fullWidth
								sx={{ flex: 1 }}
								onClick={() => handleCopyRepairs("transfer")}
							>
								Transfer
							</Button>
							<Button
								size="small"
								variant="contained"
								color="warning"
								fullWidth
								sx={{ flex: 1 }}
								onClick={() => handleCopyRepairs("buy")}
							>
								Buy
							</Button>
						</Box>
					</Box>
					<Stack spacing={0.5}>
						{repairs.map((r: any, i: number) => (
							<RepairRow
								key={i}
								label={r.ticker}
								value={r.total_amount.toLocaleString()}
							/>
						))}
					</Stack>
				</Paper>
			) : (
				<Alert severity="success" variant="outlined" icon={<Activity />}>
					All platforms operational.
				</Alert>
			)}

			<Box>
				<Typography
					variant="caption"
					fontWeight={700}
					color="text.secondary"
					sx={{ mb: 1, display: "block" }}
				>
					INSTALLED PLATFORMS
				</Typography>
				<Grid container spacing={1}>
					{platforms.map((p: any, i: number) => (
						<Grid item xs={12} sm={6} key={i}>
							<Paper
								variant="outlined"
								sx={{
									p: 1,
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
								}}
							>
								<Typography variant="body2" fontWeight={600} fontSize="0.8rem">
									{p.ticker}
								</Typography>
								<Chip
									label={`${(p.condition * 100).toFixed(0)}%`}
									size="small"
									sx={{
										height: 18,
										fontSize: "0.65rem",
										fontWeight: 800,
										bgcolor:
											p.condition < 0.8
												? theme.palette.error.main
												: theme.palette.success.main,
										color: "white",
									}}
								/>
							</Paper>
						</Grid>
					))}
				</Grid>
			</Box>
		</Stack>
	);
};
