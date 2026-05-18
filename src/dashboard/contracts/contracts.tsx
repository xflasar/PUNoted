import React, { useState } from "react";
import { Box, Paper, Tabs, Tab, useTheme, useMediaQuery } from "@mui/material";
import {
	Dashboard,
	Handshake,
	LocalShipping,
	AccountBalance,
	List as ListIcon,
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import { ContractsDashboard } from "./components/dashboard";
import ContractsList from "./components/contractslist";
import { ContractsLoans } from "./components/contractsloans";
import ContractDetailDialog from "./components/contractdetaildialog";

type TabValue = "DASHBOARD" | "ALL" | "TRADE" | "SHIPMENT" | "LOANS";

const ContractsPage: React.FC = () => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));
	const [tab, setTab] = useState<TabValue>("DASHBOARD");
	const [selectedId, setSelectedId] = useState<string | null>(null);

	return (
		<Box
			sx={{
				height: "100vh",
				width: "100%",
				display: "flex",
				flexDirection: "column",
				overflow: "hidden",
			}}
		>
			<Paper
				square
				elevation={0}
				sx={{
					zIndex: 10,
					px: 1,
					bgcolor: alpha(theme.palette.background.default, 0.8),
					backdropFilter: "blur(12px)",
					borderBottom: `1px solid ${theme.palette.divider}`,
					flexShrink: 0,
				}}
			>
				<Tabs
					value={tab}
					onChange={(_, v) => setTab(v)}
					indicatorColor="secondary"
					textColor="secondary"
					variant={isMobile ? "scrollable" : "standard"}
					scrollButtons="auto"
					allowScrollButtonsMobile
					sx={{
						"& .MuiTab-root": {
							minHeight: 40,
							fontWeight: 700,
							fontSize: "0.75rem",
							py: 0,
						},
					}}
				>
					<Tab
						icon={<Dashboard sx={{ fontSize: 18 }} />}
						iconPosition="start"
						label="Dash"
						value="DASHBOARD"
					/>
					<Tab
						icon={<ListIcon sx={{ fontSize: 18 }} />}
						iconPosition="start"
						label="All"
						value="ALL"
					/>
					<Tab
						icon={<Handshake sx={{ fontSize: 18 }} />}
						iconPosition="start"
						label="Trade"
						value="TRADE"
					/>
					<Tab
						icon={<LocalShipping sx={{ fontSize: 18 }} />}
						iconPosition="start"
						label="Ship"
						value="SHIPMENT"
					/>
					<Tab
						icon={<AccountBalance sx={{ fontSize: 18 }} />}
						iconPosition="start"
						label="Loans"
						value="LOANS"
					/>
				</Tabs>
			</Paper>

			<Box
				sx={{
					flexGrow: 1,
					overflow: "hidden",
					position: "relative",
					display: "flex",
					flexDirection: "column",
					bgcolor: alpha(theme.palette.background.default, 1),
					backgroundImage: "none",
				}}
			>
				{tab === "DASHBOARD" && (
					<ContractsDashboard onViewDetail={setSelectedId} />
				)}
				{tab === "ALL" && (
					<ContractsList category="ALL" onViewDetail={setSelectedId} />
				)}
				{tab === "TRADE" && (
					<ContractsList category="TRADE" onViewDetail={setSelectedId} />
				)}
				{tab === "SHIPMENT" && (
					<ContractsList category="SHIPMENT" onViewDetail={setSelectedId} />
				)}
				{tab === "LOANS" && <ContractsLoans onViewDetail={setSelectedId} />}
			</Box>

			<ContractDetailDialog
				open={!!selectedId}
				contractId={selectedId}
				onClose={() => setSelectedId(null)}
			/>
		</Box>
	);
};

export default ContractsPage;
