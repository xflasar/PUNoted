import React, { useState, useCallback, useEffect } from "react";
import { Box, Tabs, Tab, Stack } from "@mui/material";
import type { BoxProps } from "@mui/material/Box";

import ShipProductionTable from "./shipproductiontable";
import type {
	ShipType as TableShipType,
	SummaryDataItem,
} from "./shipproductiontable";
import { ShipOrders, type ShipOrdersProps, type ShipOrder } from "./shiporders";
import { ShipBuilder } from "./shipbuilder";
import MaterialBalanceTable, { type BalanceItem } from "./materialbalancetable";

/**
 * Props for the ShipProductionTabs component.
 */
export interface ShipProductionTabsProps {
	isMobile: boolean;
	processedOrders: ShipOrder[];
	MOCK_SHIP_TYPES: TableShipType[];
	handleFilterClick: (shipId: string | number) => void;
	selectedShipTypes: (string | number)[];
	partNames: string[];
	summaryData: SummaryDataItem[];
	mockRole: "ADMIN" | "USER" | "GUEST";
	editingOrderId: string | null;
	onEditOrder: (orderId: string) => void;
	onCancelEdit: () => void;
	onOrderCreated: (pin?: string) => void;
	onDeleteOrder: (orderId: number) => void;
	onUpdateStatus: (
		orderId: number,
		status: "QUEUED" | "APPROVED" | "IN_PRODUCTION" | "COMPLETED",
	) => void;
	materialBalance: BalanceItem[];
	disableActions?: boolean;
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
			sx={{
				width: "100%",
				height: "100%",
				minHeight: 0,
				display: value === index ? "flex" : "none",
				flexDirection: "column",
				...sx,
			}}
			{...other}
		>
			{value === index && (
				<Box
					sx={{
						height: "100%",
						width: "100%",
						display: "flex",
						flexDirection: "column",
						p: 0,
						minHeight: 0,
					}}
				>
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
	const {
		isMobile,
		processedOrders,
		MOCK_SHIP_TYPES,
		handleFilterClick,
		selectedShipTypes,
		partNames,
		summaryData,
		mockRole,
		editingOrderId,
		onEditOrder,
		onCancelEdit,
		onOrderCreated,
		onDeleteOrder,
		onUpdateStatus,
		materialBalance,
	} = props;

	// Default to index 0 (Ship Orders)
	const [value, setValue] = useState(0);

	const handleChange = useCallback(
		(_event: React.SyntheticEvent, newValue: number) => {
			setValue(newValue);
		},
		[],
	);

	const handleOrderFinished = (pin?: string) => {
		onOrderCreated(pin);
		setValue(0); // Return to Ship Orders tab
	};

	return (
		<Box
			sx={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				position: "relative", // Ensure relative for absolute overlay placement
				minHeight: 0,
			}}
		>
			<Box
				sx={{
					borderBottom: 1,
					borderColor: "divider",
					mb: { xs: 0.5, sm: 2 },
					display: "flex",
					justifyContent: "center",
					flexShrink: 0,
				}}
			>
				<Tabs
					value={value}
					onChange={handleChange}
					aria-label="production tabs"
					variant="scrollable"
					scrollButtons="auto"
					allowScrollButtonsMobile
					TabIndicatorProps={{
						style: {
							backgroundColor: "#7b68ee",
						},
					}}
					sx={{
						"& .MuiTabs-flexContainer": {
							justifyContent: "center",
						},
						"& .MuiTab-root": {
							color: "rgba(255,255,255,0.7)",
							fontWeight: "bold",
						},
						"& .Mui-selected": {
							color: "#7b68ee",
						},
					}}
				>
					<Tab label="Ship Orders" {...a11yProps(0)} />
					<Tab label="Ship Production Table" {...a11yProps(1)} />
					<Tab label="Ship Builder" {...a11yProps(2)} />
				</Tabs>
			</Box>

			{/* Tab 0: Ship Orders List (Default) */}
			<TabPanel value={value} index={0} sx={{ flexGrow: 1, minHeight: 0 }}>
				<ShipOrders
					isMobile={isMobile}
					processedOrders={processedOrders}
					mockRole={mockRole}
					onEditOrder={onEditOrder}
					onDeleteOrder={onDeleteOrder}
					onUpdateStatus={onUpdateStatus}
					disableActions={props.disableActions}
					onNavigateToBuilder={() => setValue(2)}
				/>
			</TabPanel>

			{/* Tab 1: Ship Production Table */}
			<TabPanel value={value} index={1} sx={{ flexGrow: 1, minHeight: 0 }}>
				<Stack spacing={2} sx={{ height: "100%", minHeight: 0 }}>
					<Box sx={{ flexShrink: 0 }}>
						<MaterialBalanceTable data={materialBalance} />
					</Box>
					<Box sx={{ flexGrow: 1, minHeight: 0 }}>
						<ShipProductionTable
							MOCK_SHIP_TYPES={MOCK_SHIP_TYPES}
							handleFilterClick={handleFilterClick}
							selectedShipTypes={selectedShipTypes}
							partNames={partNames}
							summaryData={summaryData}
						/>
					</Box>
				</Stack>
			</TabPanel>

			{/* Tab 2: Ship Builder */}
			<TabPanel value={value} index={2} sx={{ flexGrow: 1, minHeight: 0 }}>
				<ShipBuilder mockRole={mockRole} onOrderCreated={handleOrderFinished} />
			</TabPanel>

			{/* Edit Config Full-Page Overlay */}
			{editingOrderId && (
				<Box
					sx={{
						position: "absolute",
						top: 0,
						left: 0,
						width: "100%",
						height: "100%",
						zIndex: 1300,
						backgroundColor: "rgba(19, 18, 25, 0.92)",
						backdropFilter: "blur(25px)",
						display: "flex",
						flexDirection: "column",
						minHeight: 0,
					}}
				>
					<ShipBuilder
						mockRole={mockRole}
						onOrderCreated={handleOrderFinished}
						editingOrderId={editingOrderId}
						onCancelEdit={onCancelEdit}
					/>
				</Box>
			)}
		</Box>
	);
};

export default ShipProductionTabs;
export const ShipProductionTabsComponent = ShipProductionTabs;
export const tabValues = [0, 1, 2];
