import {
	Box,
	Paper,
	Table,
	TableContainer,
	TableHead,
	TableRow,
	TableCell,
	TableBody,
} from "@mui/material";
import { format } from "date-fns";
import React from "react";

/**
 * Represents a single part required for a ship type.
 */
export interface Part {
	/** Indicates whether there is enough quantity of this part in storage. */
	isAvailable: boolean;
	/** The ticker symbol or name of the part. */
	name: string;
	/** The required quantity of the part. */
	quantity: number;
}

/**
 * Represents a specific class or type of ship that can be ordered.
 */
export interface ShipType {
	/** The unique identifier for the ship type. */
	id: string;
	/** The display name of the ship type. */
	name: string;
	/** The list of parts required to build this ship. */
	parts: Part[];
	/** The standard price of the ship. */
	price: number;
	/** The corporate price of the ship. */
	priceCorp: number;
}

/**
 * Represents a customer's order for a specific ship.
 */
export interface ShipOrder {
	/** The parts required for this order, evaluated against available storage. */
	processedParts: Part[];
	/** The unique identifier for the order. */
	id: number;
	/** The name of the customer who placed the order. */
	customer: string;
	/** The type of ship being ordered. */
	shipType: ShipType;
	/** The final price agreed upon for the order. */
	price: number;
	/** The number of days the customer is expected to wait. */
	waitTimeDays: number;
	/** The calculated date when the order should be completed. */
	completionDate: Date;
}

/**
 * Props for the ShipOrders component.
 */
export interface ShipOrdersProps {
	/** Indicates whether the application is currently viewed on a mobile device. */
	isMobile: boolean;
	/** The list of ship orders to be displayed. */
	processedOrders: ShipOrder[];
}

/**
 * Static headers for the ship orders table.
 * Declared outside the component to ensure a stable reference across renders.
 */
const TABLE_HEADERS = [
	"Customer",
	"Ship Type",
	"Price",
	"Wait Time",
	"Completion Date",
];

/**
 * Displays a tabular view of all processed ship orders.
 *
 * @param props - The component props.
 * @returns The rendered table of ship orders.
 */
export const ShipOrders: React.FC<ShipOrdersProps> = ({
	isMobile,
	processedOrders,
}) => {
	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				width: "100%",
				height: "100%",
				minHeight: "100%",
				overflow: "hidden",
				borderRadius: "8px",
			}}
		>
			<Paper
				elevation={3}
				sx={{
					borderRadius: "12px",
					background: "transparent",
					height: "100%",
					display: "flex",
					flexDirection: "column",
				}}
			>
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						flexWrap: "nowrap",
						justifyContent: "center",
						overflow: "hidden",
						height: "100%",
					}}
				>
					<Box sx={{ flexGrow: 1, overflowY: "auto", p: 1 }}>
						<TableContainer
							sx={{
								background: "rgba(255,255,255,0.05)",
								borderRadius: "12px",
								height: "100%",
							}}
						>
							<Table
								size="small"
								stickyHeader
								sx={{
									tableLayout: "auto",
									minWidth: 600,
								}}
							>
								<TableHead>
									<TableRow
										sx={{
											backgroundColor: "transparent",
										}}
									>
										{TABLE_HEADERS.map((header) => {
											return (
												<TableCell
													key={header}
													sx={{
														fontWeight: "bold",
														p: 1,
														position: "sticky",
														left: 0,
														zIndex: 4,
														border: "none",
														backgroundColor: "#1c1b27",
														textAlign: "center",
														color: "#7B68EE",
													}}
												>
													{header}
												</TableCell>
											);
										})}
									</TableRow>
								</TableHead>
								<TableBody>
									{processedOrders
										.sort(
											(a: ShipOrder, b: ShipOrder) =>
												Number(a.id) - Number(b.id),
										)
										.map((order: ShipOrder) => (
											<React.Fragment key={order.id}>
												<TableRow
													sx={{
														"&:hover": {
															backgroundColor: "rgba(255, 255, 255, 0.05)",
														},
													}}
												>
													<TableCell sx={{ textAlign: "center" }}>
														{order.customer}
													</TableCell>
													<TableCell sx={{ textAlign: "center" }}>
														{order.shipType.name}
													</TableCell>
													<TableCell sx={{ textAlign: "center" }}>
														${order.price.toLocaleString()}
													</TableCell>
													<TableCell sx={{ textAlign: "center" }}>
														{order.waitTimeDays} days
													</TableCell>
													<TableCell sx={{ textAlign: "center" }}>
														{format(order.completionDate, "P")}
													</TableCell>
												</TableRow>
											</React.Fragment>
										))}
								</TableBody>
							</Table>
						</TableContainer>
					</Box>
				</Box>
			</Paper>
		</Box>
	);
};
