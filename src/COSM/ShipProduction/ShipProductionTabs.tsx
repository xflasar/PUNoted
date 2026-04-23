import React, { useState, useCallback } from "react";
import { Box, Tabs, Tab } from "@mui/material";
import type { BoxProps } from "@mui/material/Box";

import ShipProductionTable from "./ShipProductionTable";
import type {
	ShipType as TableShipType,
	SummaryDataItem,
} from "./ShipProductionTable";
import { ShipOrders, type ShipOrdersProps } from "./ShipOrders";

/**
 * Props for the ShipProductionTabs component.
 * Combines the requirements for both the production table and the orders view.
 */
export interface ShipProductionTabsProps extends ShipOrdersProps {
	/** The list of available ship types used for filtering. */
	MOCK_SHIP_TYPES: TableShipType[];
	/** Callback fired when a ship type filter chip is clicked. */
	handleFilterClick: (shipId: string | number) => void;
	/** The currently active ship type filters. */
	selectedShipTypes: (string | number)[];
	/** The unique part names across all displayed orders, used as table columns. */
	partNames: string[];
	/** The summarized data rows for each order, including part availabilities. */
	summaryData: SummaryDataItem[];
}

/**
 * Props for the internal TabPanel helper component.
 */
interface TabPanelProps {
	/** The content to be rendered within the panel. */
	children?: React.ReactNode;
	/** The index of this specific panel. */
	index: number;
	/** The currently selected tab value. */
	value: number;
	/** Optional styling properties for the panel container. */
	sx?: BoxProps["sx"];
}

/**
 * Renders the content container for a specific tab.
 * Hides its content if it is not the currently active tab.
 *
 * @param props - The properties for the panel.
 * @returns The rendered tab panel.
 */
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
				<Box
					sx={{
						height: "100%",
						width: "100%",
						overflow: "hidden",
						p: 0,
					}}
				>
					{children}
				</Box>
			)}
		</Box>
	);
}

/**
 * Generates the required accessibility attributes for a tab header.
 *
 * @param index - The index of the tab.
 * @returns An object containing the accessibility properties.
 */
function a11yProps(index: number) {
	return {
		id: `simple-tab-${index}`,
		"aria-controls": `simple-tabpanel-${index}`,
	};
}

/**
 * A container component that provides a tabbed interface to switch between
 * the detailed production table and the high-level ship orders list.
 *
 * @param props - The properties required for rendering both views.
 * @returns The rendered tabbed interface.
 */
const ShipProductionTabs: React.FC<ShipProductionTabsProps> = (props) => {
	const { isMobile, processedOrders, ...tableProps } = props;
	const [value, setValue] = useState(0);

	/**
	 * Handles the tab switching event.
	 *
	 * @param _event - The React synthetic event.
	 * @param newValue - The index of the newly selected tab.
	 */
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
					<Tab label="Ship Production Table" {...a11yProps(0)} />
					<Tab label="Ship Orders" {...a11yProps(1)} />
				</Tabs>
			</Box>

			<TabPanel value={value} index={0} sx={{ flexGrow: 1 }}>
				<ShipProductionTable {...tableProps} />
			</TabPanel>

			<TabPanel value={value} index={1} sx={{ flexGrow: 1 }}>
				<ShipOrders isMobile={isMobile} processedOrders={processedOrders} />
			</TabPanel>
		</Box>
	);
};

export default ShipProductionTabs;
