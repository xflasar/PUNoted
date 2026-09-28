import React from "react";
import {
	Box,
	useTheme,
	alpha,
	Collapse,
	IconButton,
	Chip,
} from "@mui/material";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ProductionCard } from "../../../production/productioncard";
import { DEFAULT_DAYS } from "../../utils/constants";
import type { LeasedSiteGroupProps } from "./types";

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
	const partnerName = (groupKey || "").includes(" - ")
		? groupKey.split(" - ")[1] || groupKey
		: groupKey || "PARTNER";
	const statusColor = theme.palette.primary.main;

	return (
		<Box sx={{ mt: 2, mb: 1 }}>
			{/* Clean Section Header */}
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: 1.5,
					py: 0.75,
					px: 0.5,
					cursor: "pointer",
					userSelect: "none",
					mb: 1,
				}}
				onClick={onToggle}
			>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					<Box
						sx={{ width: 4, height: 20, bgcolor: statusColor, borderRadius: 1 }}
					/>
					<Box
						sx={{
							fontWeight: 900,
							fontSize: "1.1rem",
							letterSpacing: "0.5px",
							color: "text.primary",
							display: "flex",
							alignItems: "center",
							gap: 1,
						}}
					>
						<span style={{ color: "white", fontWeight: 900 }}>
							{partnerName}
						</span>
						<Chip
							label={`${sites.length} ${sites.length === 1 ? "SITE" : "SITES"}`}
							size="small"
							sx={{
								height: 20,
								fontSize: "0.7rem",
								fontWeight: 800,
								bgcolor: alpha(statusColor, 0.15),
								color: statusColor,
								border: `1px solid ${alpha(statusColor, 0.3)}`,
							}}
						/>
					</Box>
				</Box>

				<IconButton
					size="small"
					sx={{ color: "rgba(255,255,255,0.6)", p: 0.25 }}
				>
					{collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
				</IconButton>
			</Box>

			{/* Cards Grid */}
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
		</Box>
	);
};
