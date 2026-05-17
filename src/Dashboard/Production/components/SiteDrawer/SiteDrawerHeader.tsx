import React, { useMemo } from "react";
import {
	Box,
	Typography,
	Paper,
	IconButton,
	useTheme,
	alpha,
	Chip,
} from "@mui/material";
import { X, Cpu, Zap, Activity, Handshake } from "lucide-react";
import type { SiteSummary } from "../../types";

interface Props {
	site: SiteSummary;
	onClose: () => void;
}

export const SiteDrawerHeader: React.FC<Props> = ({ site, onClose }) => {
	const theme = useTheme();

	const avgEff = useMemo(() => {
		if (!site.production_lines?.length) return 0;
		return (
			site.production_lines.reduce(
				(acc: number, l: any) => acc + l.efficiency,
				0,
			) / site.production_lines.length
		);
	}, [site.production_lines]);

	return (
		<Paper
			square
			elevation={2}
			sx={{
				p: 1,
				px: 1.5,
				borderBottom: `1px solid ${theme.palette.divider}`,
				bgcolor: alpha(theme.palette.background.default, 0.95),
				backdropFilter: "blur(10px)",
				zIndex: 10,
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				gap: 1,
			}}
		>
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					gap: 1.5,
					flexWrap: "wrap",
					flex: 1,
				}}
			>
				<Typography
					variant="subtitle1"
					fontWeight={900}
					sx={{ letterSpacing: -0.5, lineHeight: 1, whiteSpace: "nowrap" }}
				>
					{site.planet_name}
				</Typography>

				{site.isLeased && site.tenant && (
					<Chip
						icon={<Handshake size={12} style={{ marginLeft: 4 }} />}
						label={site.tenant}
						size="small"
						color="info"
						variant="outlined"
						sx={{
							height: 20,
							fontSize: "0.65rem",
							fontWeight: 800,
							bgcolor: alpha(theme.palette.info.main, 0.1),
							border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
						}}
					/>
				)}

				<Box
					sx={{
						display: "flex",
						gap: 1,
						alignItems: "center",
						flexWrap: "nowrap",
					}}
				>
					<Box
						sx={{
							px: 0.75,
							py: 0.25,
							borderRadius: 1,
							bgcolor: alpha(theme.palette.primary.main, 0.1),
							border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
							display: "flex",
							alignItems: "center",
							gap: 0.5,
						}}
					>
						<Cpu size={12} color={theme.palette.primary.main} />
						<Typography variant="caption" fontWeight={800} color="primary">
							{(avgEff * 100).toFixed(0)}%
						</Typography>
					</Box>

					<Box
						sx={{
							px: 0.75,
							py: 0.25,
							borderRadius: 1,
							bgcolor: alpha(theme.palette.warning.main, 0.1),
							border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
							display: "flex",
							alignItems: "center",
							gap: 0.5,
						}}
					>
						<Zap size={12} color={theme.palette.warning.main} />
						<Typography variant="caption" fontWeight={800} color="warning.main">
							{site.invested_permits}/{site.maximum_permits}
						</Typography>
					</Box>

					<Box
						sx={{
							px: 0.75,
							py: 0.25,
							borderRadius: 1,
							bgcolor: alpha(theme.palette.success.main, 0.1),
							border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
							display: "flex",
							alignItems: "center",
							gap: 0.5,
						}}
					>
						<Activity size={12} color={theme.palette.success.main} />
						<Typography variant="caption" fontWeight={800} color="success.main">
							{(site.overall_platform_condition * 100).toFixed(0)}%
						</Typography>
					</Box>
				</Box>
			</Box>

			<IconButton
				onClick={onClose}
				size="small"
				sx={{ bgcolor: alpha(theme.palette.text.primary, 0.05), p: 0.5 }}
			>
				<X size={16} />
			</IconButton>
		</Paper>
	);
};
