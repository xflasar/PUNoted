import React from "react";
import {
	Box,
	Paper,
	Chip,
	TableContainer,
	Table,
	TableHead,
	TableRow,
	TableCell,
	TableBody,
} from "@mui/material";
import MaterialBadge from "../components/materialbadge";

/**
 * Represents the minimal details of a ship type used for filtering.
 */
export interface ShipType {
	/** The unique identifier for the ship type. */
	id: string | number;
	/** The display name of the ship type. */
	name: string;
}

/**
 * Contains the availability status and required quantity for a specific part.
 */
export interface PartData {
	/** The required quantity of the part. */
	value: number;
	/** Indicates whether the required quantity is currently in storage. */
	isAvailable: boolean;
}

/**
 * Represents a summarized data row for a ship order.
 */
export interface SummaryDataItem {
	/** A combined string representing the ship type and customer name. */
	combinedHeader: string | number;
	/** Dynamic keys representing part names, mapped to their required data. */
	[key: string]: PartData | string | number;
}

/**
 * Props for the ShipProductionTable component.
 */
export interface ShipProductionTableProps {
	/** The list of available ship types used for filtering. */
	MOCK_SHIP_TYPES: ShipType[];
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
 * Displays a detailed table showing ship orders and their respective part requirements.
 * Provides filtering capabilities by ship type.
 *
 * @param props - The component props.
 * @returns The rendered production table.
 */
const ShipProductionTable: React.FC<ShipProductionTableProps> = ({
	MOCK_SHIP_TYPES,
	handleFilterClick,
	selectedShipTypes,
	partNames,
	summaryData,
}) => {
	return (
		<Paper
			elevation={3}
			sx={{
				borderRadius: "12px",
				background: "transparent",
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
			}}
		>
			<Box
				sx={{
					display: "flex",
					flexWrap: "wrap",
					gap: 1,
					mb: 2,
					p: 2,
					justifyContent: "center",
					flexShrink: 0,
				}}
			>
				{MOCK_SHIP_TYPES.map((ship) => (
					<Chip
						key={ship.id}
						label={ship.name}
						onClick={() => handleFilterClick(ship.id)}
						variant={
							selectedShipTypes.includes(ship.id) ? "filled" : "outlined"
						}
						sx={{
							cursor: "pointer",
							...(selectedShipTypes.includes(ship.id)
								? {
										backgroundColor: "#7b68ee",
										color: "white",
										borderColor: "#7b68ee",
										"&:hover": {
											backgroundColor: "#6a5acd",
										},
									}
								: {
										backgroundColor: "transparent",
										color: "white",
										borderColor: "#7b68ee",
										"&:hover": {
											backgroundColor: "rgba(123, 104, 238, 0.1)",
										},
									}),
						}}
					/>
				))}
			</Box>

			<TableContainer
				sx={{
					flexGrow: 1,
					height: "100%",
					overflowX: "auto",
					overflowY: "auto",
					background: "rgba(255,255,255,0.05)",
					borderRadius: "12px",
				}}
			>
				<Table
					size="small"
					stickyHeader
					sx={{ tableLayout: "auto", minWidth: 600 }}
				>
					<TableHead>
						<TableRow>
							<TableCell
								sx={{
									fontWeight: "bold",
									maxWidth: "70px",
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
								Ship
							</TableCell>
							{partNames.map((partName) => (
								<TableCell
									key={partName}
									sx={{
										fontWeight: "bold",
										textAlign: "center",
										whiteSpace: "nowrap",
										p: 1,
										minWidth: "25px",
										border: "none",
										backgroundColor: "#1c1b27",
										color: "#7B68EE",
									}}
								>
									<MaterialBadge ticker={partName} />
								</TableCell>
							))}
						</TableRow>
					</TableHead>
					<TableBody>
						{summaryData.map((order, index) => (
							<TableRow
								key={index}
								sx={{
									"&:hover td": {
										backgroundColor: "rgba(123, 104, 238, 0.12)",
									},
								}}
							>
								<TableCell
									sx={{
										fontWeight: "bold",
										wordWrap: "break-word",
										p: 0.5,
										position: "sticky",
										left: 0,
										bgcolor: "#1c1b27",
										zIndex: 3,
										border: "none",
										textAlign: "center",
										color: "rgba(200,200,200,0.9)",
									}}
								>
									{order.combinedHeader.toString()}
								</TableCell>
								{partNames.map((partName) => {
									const partData = order[partName] as PartData;
									const isSatisfied =
										(partData?.value ?? 0) === 0 ||
										Boolean(partData?.isAvailable);
									return (
										<TableCell
											key={partName}
											sx={{
												textAlign: "center",
												backgroundColor: isSatisfied
													? "transparent"
													: "#c0392b !important",
												p: 0,
												overflow: "hidden",
												whiteSpace: "nowrap",
												border: "none",
												color: "rgba(230,230,230,1)",
											}}
										>
											{partData?.value ?? 0}
										</TableCell>
									);
								})}
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>
		</Paper>
	);
};

export default ShipProductionTable;
