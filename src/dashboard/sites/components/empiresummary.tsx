import React from "react";
import {
	Box,
	Typography,
	Collapse,
	Chip,
	Paper,
	alpha,
	useTheme,
} from "@mui/material";
import MaterialBadge from "../../../cosm/components/materialbadge";

interface EmpireSummaryProps {
	summaryOpen: boolean;
	processedSites: any[];
	selectedSummarySites: Record<string, boolean>;
	setSelectedSummarySites: React.Dispatch<
		React.SetStateAction<Record<string, boolean>>
	>;
	globalSummary: [string, { prod: number; cons: number; net: number }][];
}

export const EmpireSummary: React.FC<EmpireSummaryProps> = ({
	summaryOpen,
	processedSites,
	selectedSummarySites,
	setSelectedSummarySites,
	globalSummary,
}) => {
	const theme = useTheme();

	return (
		<Collapse in={summaryOpen}>
			<Box
				sx={{
					p: 2,
					borderTop: `1px solid ${theme.palette.divider}`,
					bgcolor: alpha(theme.palette.background.default, 0.95),
					maxHeight: "35vh",
					overflowY: "auto",
				}}
			>
				<Typography
					variant="overline"
					color="text.secondary"
					sx={{ mb: 1, display: "block", lineHeight: 1, fontWeight: 800 }}
				>
					EMPIRE SUMMARY (Select Sites)
				</Typography>

				<Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 2 }}>
					{processedSites
						.filter((s) => !(s.site.isLeased && s.site.type === "Outbound"))
						.map(({ site }) => (
							<Chip
								key={site.siteid}
								label={site.planet_name}
								size="small"
								onClick={() =>
									setSelectedSummarySites((prev) => ({
										...prev,
										[site.siteid]: !prev[site.siteid],
									}))
								}
								color={
									selectedSummarySites[site.siteid] ? "primary" : "default"
								}
								variant={
									selectedSummarySites[site.siteid] ? "filled" : "outlined"
								}
								sx={{ fontSize: "0.65rem", fontWeight: 600, height: 20 }}
							/>
						))}
				</Box>

				<Box
					sx={{
						display: "grid",
						gridTemplateColumns: {
							xs: "repeat(auto-fill, minmax(100px, 1fr))",
							sm: "repeat(auto-fill, minmax(140px, 1fr))",
						},
						gap: 1,
					}}
				>
					{globalSummary.map(([ticker, s]) => {
						const isDeficit = s.net < 0;
						return (
							<Paper
								key={ticker}
								variant="outlined"
								sx={{
									p: 1,
									display: "flex",
									flexDirection: "column",
									gap: 0.5,
									borderColor: isDeficit
										? alpha(theme.palette.error.main, 0.3)
										: "divider",
									bgcolor: isDeficit
										? alpha(theme.palette.error.main, 0.04)
										: "transparent",
									position: "relative",
								}}
							>
								<Box
									sx={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
									}}
								>
									<Typography
										variant="caption"
										color="text.primary"
										sx={{
											fontWeight: 800,
											fontSize: "0.75rem",
										}}
									>
										<MaterialBadge ticker={ticker} />
									</Typography>
									<Typography
										variant="caption"
										sx={{
											fontWeight: 800,
											fontSize: "0.75rem",
											color: isDeficit ? "error.main" : "success.main",
										}}
									>
										{s.net > 0 ? "+" : ""}
										{s.net.toFixed(1)}
									</Typography>
								</Box>
								<Box
									sx={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										opacity: 0.8,
									}}
								>
									<Typography
										variant="caption"
										sx={{
											fontSize: "0.65rem",
											color: "success.main",
											fontWeight: 600,
										}}
									>
										P: {s.prod.toFixed(1)}
									</Typography>
									<Typography
										variant="caption"
										sx={{
											fontSize: "0.65rem",
											color: "warning.main",
											fontWeight: 600,
										}}
									>
										C: {s.cons.toFixed(1)}
									</Typography>
								</Box>
							</Paper>
						);
					})}
				</Box>
			</Box>
		</Collapse>
	);
};
