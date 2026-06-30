import React from "react";
import {
	Box,
	Typography,
	Paper,
	Collapse,
	useTheme,
	alpha,
} from "@mui/material";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ProductionCard } from "../../production/productioncard";
import { DEFAULT_DAYS } from "../utils/constants";

interface LeasedSiteGroupProps {
	groupKey: string;
	sites: any[];
	collapsed: boolean;
	onToggle: () => void;
	siteTargets: Record<string, number>;
	onTargetDaysChange: (siteId: string, val: string) => void;
	onSelectSite: (siteId: string) => void;
}

export const LeasedSiteGroup: React.FC<LeasedSiteGroupProps> = ({
	groupKey,
	sites,
	collapsed,
	onToggle,
	siteTargets,
	onTargetDaysChange,
	onSelectSite,
}) => {
	const theme = useTheme();
	const [rawLeaseType, partnerName] = groupKey.split(" - ");
	const isOutbound = rawLeaseType === "Outbound";

	const displayTypeLabel = isOutbound
		? "OUTBOUND (LOANED TO):"
		: "INBOUND (LEASED FROM):";
	const ownerLabel = isOutbound
		? "OWNER: YOU"
		: `OWNER: ${partnerName.toUpperCase()}`;
	const statusColor = isOutbound
		? theme.palette.warning.main
		: theme.palette.info.main;

	return (
		<Paper
			variant="outlined"
			sx={{
				mt: 3,
				p: 2,
				borderRadius: "10px",
				bgcolor: alpha(theme.palette.background.default, 0.1),
				borderColor: alpha(statusColor, 0.25),
				borderTop: `3px solid ${statusColor}`,
				boxShadow: `0 4px 20px ${alpha("#000000", 0.15)}`,
			}}
		>
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					gap: 2,
					mb: 2,
					cursor: "pointer",
					opacity: 0.9,
					"&:hover": { opacity: 1 },
					userSelect: "none",
				}}
				onClick={onToggle}
			>
				<Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
					<Typography
						variant="subtitle2"
						sx={{
							fontWeight: "bold",
							fontSize: { xs: "0.85rem", sm: "0.95rem" },
							letterSpacing: "0.3px",
							display: "flex",
							alignItems: "center",
							gap: 1,
							lineHeight: 1.2,
						}}
					>
						<span style={{ color: theme.palette.text.secondary }}>
							{displayTypeLabel}
						</span>
						<span style={{ color: statusColor, fontWeight: 800 }}>
							{partnerName.toUpperCase()}
						</span>
					</Typography>
					<Typography
						variant="caption"
						sx={{
							color: alpha(theme.palette.text.secondary, 0.6),
							fontSize: "0.65rem",
							fontWeight: 700,
							letterSpacing: 0.3,
						}}
					>
						{ownerLabel}
					</Typography>
				</Box>

				<Box
					sx={{
						flex: 1,
						height: 1,
						bgcolor: alpha(theme.palette.divider, 0.2),
					}}
				/>

				<Typography
					variant="caption"
					color="text.secondary"
					sx={{ fontWeight: 700, mr: 1 }}
				>
					({sites.length} {sites.length === 1 ? "site" : "sites"})
				</Typography>
				{collapsed ? (
					<ChevronDown
						size={16}
						style={{ color: theme.palette.text.secondary }}
					/>
				) : (
					<ChevronUp size={16} style={{ color: statusColor }} />
				)}
			</Box>

			<Collapse in={!collapsed}>
				<Box
					sx={{
						display: "grid",
						gridTemplateColumns: {
							xs: "1fr",
							sm: "repeat(auto-fill, minmax(400px, 1fr))",
						},
						gap: 2,
						alignItems: "start",
						pt: 0.5,
					}}
				>
					{sites.map(({ site, richFlows }) => (
						<ProductionCard
							key={site.siteid || site.planet_name}
							siteId={site.siteid || ""}
							site={site}
							richFlows={richFlows}
							targetDays={siteTargets[site.siteid || ""] || DEFAULT_DAYS}
							onTargetDaysChange={(val) =>
								onTargetDaysChange(site.siteid || "", val)
							}
							onSelect={(s) => onSelectSite(s)}
						/>
					))}
				</Box>
			</Collapse>
		</Paper>
	);
};
