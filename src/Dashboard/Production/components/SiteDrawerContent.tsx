import React, { useState } from "react";
import { Box, Snackbar, Tabs, Tab, useTheme, alpha } from "@mui/material";
import { Factory, Globe, Wrench } from "lucide-react";
import type { SiteSummary } from "../../types";

import {
	useSiteInfrastructure,
	useLogisticsManager,
	useCargoPlanner,
} from "./SiteDrawer/hooks";
import { SiteDrawerHeader } from "./SiteDrawer/SiteDrawerHeader";
import { ProductionTabContent } from "./SiteDrawer/ProductionTabContent";
import { LogisticsTabContent } from "./SiteDrawer/LogisticsTabContent";
import { InfraTabContent } from "./SiteDrawer/InfraTabContent";

interface Props {
	siteFlow?: SiteSummary;
	globalTargetDays: number;
	onClose: () => void;
}

export const SiteDrawerContent: React.FC<Props> = ({
	siteFlow,
	globalTargetDays,
	onClose,
}) => {
	const theme = useTheme();
	const site = siteFlow?.site;

	const [tabValue, setTabValue] = useState(0);
	const [shipOverride, setShipOverride] = useState<string>("auto");
	const [snackbar, setSnackbar] = useState({ open: false, message: "" });

	const {
		platforms,
		repairs,
		loading: infraLoading,
	} = useSiteInfrastructure(site?.siteid);

	const logistics = useLogisticsManager(
		site,
		siteFlow?.richFlows || {},
		globalTargetDays,
	);

	const cargoPlan = useCargoPlanner(
		logistics.logisticsRows,
		logistics.selectedMaterials,
		logistics.materialPriorities,
		shipOverride,
		logistics.allowedShipTypes,
		logistics.allocationStrategy,
		logistics.maxShips,
	);

	if (!site) return null;

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				height: "100%",
				bgcolor: "background.default",
				overflow: "hidden",
			}}
		>
			<SiteDrawerHeader site={site} onClose={onClose} />

			<Tabs
				value={tabValue}
				onChange={(_, v) => setTabValue(v)}
				centered
				sx={{
					minHeight: 40,
					borderBottom: 1,
					borderColor: "divider",
					bgcolor: "background.paper",
					"& .MuiTab-root": {
						fontWeight: 700,
						fontSize: "0.8rem",
						minHeight: 40,
						p: 1,
					},
				}}
			>
				<Tab
					icon={<Factory size={14} />}
					iconPosition="start"
					label="Production"
				/>
				<Tab
					icon={<Globe size={14} />}
					iconPosition="start"
					label="Logistics"
				/>
				<Tab icon={<Wrench size={14} />} iconPosition="start" label="Infra" />
			</Tabs>

			<Box
				sx={{
					flex: 1,
					overflow: "hidden",
					display: "flex",
					flexDirection: "column",
					bgcolor: alpha(theme.palette.background.default, 0.5),
				}}
			>
				{tabValue === 0 && (
					<Box sx={{ flex: 1, overflowY: "auto", p: { xs: 1.5, sm: 2 } }}>
						<ProductionTabContent site={site} />
					</Box>
				)}

				{tabValue === 1 && (
					<Box
						sx={{
							flex: 1,
							overflow: "hidden",
							p: { xs: 1.5, sm: 2 },
							display: "flex",
							flexDirection: "column",
						}}
					>
						<LogisticsTabContent
							siteName={site.planet_name}
							{...logistics}
							cargoPlan={cargoPlan}
							shipOverride={shipOverride}
							setShipOverride={setShipOverride}
							onShowSnackbar={(msg: string) =>
								setSnackbar({ open: true, message: msg })
							}
						/>
					</Box>
				)}

				{tabValue === 2 && (
					<Box sx={{ flex: 1, overflowY: "auto", p: { xs: 1.5, sm: 2 } }}>
						<InfraTabContent
							loading={infraLoading}
							repairs={repairs}
							platforms={platforms}
							onShowSnackbar={(msg: string) =>
								setSnackbar({ open: true, message: msg })
							}
						/>
					</Box>
				)}
			</Box>

			<Snackbar
				open={snackbar.open}
				autoHideDuration={3000}
				onClose={() => setSnackbar({ ...snackbar, open: false })}
				message={snackbar.message}
			/>
		</Box>
	);
};
