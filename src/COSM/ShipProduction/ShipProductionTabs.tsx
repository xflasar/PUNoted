import React, { useState, useCallback } from "react";
import { Box, Tabs, Tab } from "@mui/material";
import type { BoxProps } from "@mui/material/Box";

import ShipProductionTable from "./ShipProductionTable";
import type {
	ShipType as TableShipType,
	SummaryDataItem,
} from "./ShipProductionTable";
import { ShipOrders, type ShipOrdersProps } from "./ShipOrders";
import BuilderOrdersDashboard from "./Dashboard/ShipProductionDashboard";

export interface ShipProductionTabsProps extends ShipOrdersProps {
	MOCK_SHIP_TYPES: TableShipType[];
	handleFilterClick: (shipId: string | number) => void;
	selectedShipTypes: (string | number)[];
	partNames: string[];
	summaryData: SummaryDataItem[];
}

interface TabPanelProps {
	children?: React.ReactNode;
	index: number;
	value: number;
	sx?: BoxProps["sx"];
}

function TabPanel(props: TabPanelProps) {
	const { children, value, index, sx, ...other } = props;

	return (
		<Box
			role="tabpanel"
			hidden={value !== index}
			id={`simple-tabpanel-${index}`}
			aria-labelledby={`simple-tab-${index}`}
			sx={{ width: "100%", minHeight: 0, ...sx }}
			{...other}
		>
			{value === index && (
				<Box sx={{ height: "100%", width: "100%", overflow: "hidden", p: 0 }}>
					{children}
				</Box>
			)}
		</Box>
	);
}

function a11yProps(index: number) {
	return {
		id: `simple-tab-${index}`,
		"aria-controls": `simple-tabpanel-${index}`,
	};
}

const ShipProductionTabs: React.FC<ShipProductionTabsProps> = (props) => {
	const { isMobile, processedOrders, ...tableProps } = props;
	const [value, setValue] = useState(0);

	const handleChange = useCallback(
		(_event: React.SyntheticEvent, newValue: number) => {
			setValue(newValue);
		},
		[],
	);

	return (
		<Box
			sx={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
			}}
		>
			<Box
				sx={{
					borderBottom: 1,
					borderColor: "divider",
					mb: 2,
					display: "flex",
					justifyContent: "center",
					flexShrink: 0,
				}}
			>
				<Tabs
					value={value}
					onChange={handleChange}
					aria-label="production tabs"
					TabIndicatorProps={{
						sx: { backgroundColor: "#7b68ee" },
					}}
					sx={{
						"& .MuiTabs-flexContainer": { justifyContent: "center" },
						"& .MuiTab-root": {
							color: "rgba(255,255,255,0.7)",
							fontWeight: "bold",
						},
						"& .Mui-selected": { color: "#7b68ee" },
					}}
				>
					<Tab label="Ship Production Table" {...a11yProps(0)} />
					<Tab label="Builder Orders (New)" {...a11yProps(1)} />
					<Tab label="Legacy Ship Orders" {...a11yProps(2)} />
				</Tabs>
			</Box>

			{/* Tab 0: Original Data Matrix */}
			<TabPanel value={value} index={0} sx={{ flexGrow: 1 }}>
				<ShipProductionTable {...tableProps} />
			</TabPanel>

			{/* Tab 1: New Builder Dashboard */}
			<TabPanel value={value} index={1} sx={{ flexGrow: 1 }}>
				<BuilderOrdersDashboard />
			</TabPanel>

			{/* Tab 2: Original List View */}
			<TabPanel value={value} index={2} sx={{ flexGrow: 1 }}>
				<ShipOrders isMobile={isMobile} processedOrders={processedOrders} />
			</TabPanel>
		</Box>
	);
};

export default ShipProductionTabs;
