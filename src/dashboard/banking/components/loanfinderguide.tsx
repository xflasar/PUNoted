import React from "react";
import { Box, Typography, Paper, useTheme, IconButton } from "@mui/material";
import { alpha } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
	CheckCircleOutlineOutlined,
	ErrorOutlineOutlined,
	PieChartOutlineOutlined,
} from "@mui/icons-material";

interface LoanFinderGuideProps {
	onClose?: () => void;
}

export const LoanFinderGuide: React.FC<LoanFinderGuideProps> = ({
	onClose,
}) => {
	const theme = useTheme();

	return (
		<Paper
			elevation={0}
			sx={{
				p: 2,
				borderRadius: 2,
				bgcolor: alpha(theme.palette.background.default, 0.75),
				border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
				boxShadow: `0 4px 20px -4px ${alpha(theme.palette.primary.main, 0.1)}`,
				display: "flex",
				flexDirection: "column",
				gap: 1.5,
				position: "relative",
			}}
		>
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "flex-start",
				}}
			>
				<Box>
					<Typography
						variant="subtitle2"
						sx={{ fontWeight: 800, color: "primary.main", fontSize: "0.85rem" }}
					>
						How the Loan Feasibility Calculator Works
					</Typography>
					<Typography
						variant="caption"
						sx={{
							color: "text.secondary",
							fontSize: "0.75rem",
							display: "block",
							mt: 0.25,
						}}
					>
						Borrowing without cash flow planning risks insolvency. This tool
						models loan repayment speed against your company's actual daily
						earnings.
					</Typography>
				</Box>
				{onClose && (
					<IconButton
						size="small"
						onClick={onClose}
						sx={{ color: "text.secondary", p: 0.5 }}
					>
						<CloseIcon sx={{ fontSize: 16 }} />
					</IconButton>
				)}
			</Box>

			{/* 3 Step Explanation Grid */}
			<Box
				sx={{
					display: "grid",
					gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
					gap: 1.25,
				}}
			>
				{/* Step 1 */}
				<Box
					sx={{
						p: 1.25,
						borderRadius: 1.5,
						bgcolor: alpha(theme.palette.background.paper, 0.5),
						border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
					}}
				>
					<Box
						sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}
					>
						<AttachMoneyIcon sx={{ fontSize: 16, color: "primary.main" }} />
						<Typography
							variant="caption"
							sx={{
								fontWeight: 800,
								color: "text.primary",
								fontSize: "0.75rem",
							}}
						>
							1. Loan Capital
						</Typography>
					</Box>
					<Typography
						variant="caption"
						sx={{
							color: "text.secondary",
							fontSize: "0.7rem",
							lineHeight: 1.4,
							display: "block",
						}}
					>
						Enter the amount of ICA you want to borrow. Banks that lack enough
						vault liquidity or have lower max limits will be automatically
						flagged.
					</Typography>
				</Box>

				{/* Step 2 */}
				<Box
					sx={{
						p: 1.25,
						borderRadius: 1.5,
						bgcolor: alpha(theme.palette.background.paper, 0.5),
						border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
					}}
				>
					<Box
						sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}
					>
						<TrendingUpIcon sx={{ fontSize: 16, color: "#34d399" }} />
						<Typography
							variant="caption"
							sx={{
								fontWeight: 800,
								color: "text.primary",
								fontSize: "0.75rem",
							}}
						>
							2. Daily Net Profit (Optional)
						</Typography>
					</Box>
					<Typography
						variant="caption"
						sx={{
							color: "text.secondary",
							fontSize: "0.7rem",
							lineHeight: 1.4,
							display: "block",
						}}
					>
						Your company's average daily profit from APEX. If left empty, the
						finder shows the <strong>Target Profit</strong> needed to clear the
						debt in 4 weeks.
					</Typography>
				</Box>

				{/* Step 3 */}
				<Box
					sx={{
						p: 1.25,
						borderRadius: 1.5,
						bgcolor: alpha(theme.palette.background.paper, 0.5),
						border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
					}}
				>
					<Box
						sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}
					>
						<PieChartOutlineOutlined sx={{ fontSize: 16, color: "#fbbf24" }} />
						<Typography
							variant="caption"
							sx={{
								fontWeight: 800,
								color: "text.primary",
								fontSize: "0.75rem",
							}}
						>
							3. Repay Budget (%)
						</Typography>
					</Box>
					<Typography
						variant="caption"
						sx={{
							color: "text.secondary",
							fontSize: "0.7rem",
							lineHeight: 1.4,
							display: "block",
						}}
					>
						The % of your daily profit dedicated to paying down the loan. The
						remaining % (e.g. 50%) is preserved for your routine workforce wages
						and raw material restocks.
					</Typography>
				</Box>
			</Box>

			{/* Health Indicators Legend */}
			<Box
				sx={{
					p: 1,
					borderRadius: 1.2,
					bgcolor: alpha(theme.palette.background.paper, 0.3),
					display: "flex",
					alignItems: "center",
					flexWrap: "wrap",
					gap: 1.5,
				}}
			>
				<Typography
					variant="caption"
					sx={{
						fontWeight: 800,
						fontSize: "0.68rem",
						color: "text.secondary",
						textTransform: "uppercase",
					}}
				>
					Status Tiers:
				</Typography>

				<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
					<CheckCircleOutlineOutlined sx={{ fontSize: 14, color: "#34d399" }} />
					<Typography
						variant="caption"
						sx={{ fontWeight: 700, fontSize: "0.7rem", color: "#34d399" }}
					>
						COMFORTABLE
					</Typography>
					<Typography
						variant="caption"
						sx={{ color: "text.secondary", fontSize: "0.68rem" }}
					>
						(Repays &le; 26 weeks within your budget with safe cash reserve)
					</Typography>
				</Box>

				<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
					<WarningAmberIcon sx={{ fontSize: 14, color: "#fbbf24" }} />
					<Typography
						variant="caption"
						sx={{ fontWeight: 700, fontSize: "0.7rem", color: "#fbbf24" }}
					>
						HEAVY LOAD
					</Typography>
					<Typography
						variant="caption"
						sx={{ color: "text.secondary", fontSize: "0.68rem" }}
					>
						(Long payoff &gt; 26 weeks or tight cash buffer)
					</Typography>
				</Box>

				<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
					<ErrorOutlineOutlined sx={{ fontSize: 14, color: "#f87171" }} />
					<Typography
						variant="caption"
						sx={{ fontWeight: 700, fontSize: "0.7rem", color: "#f87171" }}
					>
						OUT OF RANGE / LOW LIQUIDITY
					</Typography>
					<Typography
						variant="caption"
						sx={{ color: "text.secondary", fontSize: "0.68rem" }}
					>
						(Exceeds vault or bank limits)
					</Typography>
				</Box>
			</Box>
		</Paper>
	);
};
