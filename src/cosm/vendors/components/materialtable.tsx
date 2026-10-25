import React, { memo, useMemo } from "react";
import { Paper, Typography, Box, useTheme, Tooltip } from "@mui/material";
import OrderItemRow from "./orderitemrow";
import type { OrderItem, Location } from "../types";

/**
 * Props for the MaterialTable component.
 */
interface MaterialTableProps {
	/** The list of materials (buy or sell orders) to display in this table. */
	materials: OrderItem[];
	/** The complete list of all orders, used to check if the opposite order type already exists. */
	allOrders: OrderItem[];
	/** Available locations to choose from when adding or editing order locations. */
	locations: Location[];
	/** Callback fired to remove an order item. */
	onRemoveMaterial: (
		frontendId: string | undefined,
		type: "buy" | "sell" | undefined,
	) => void;
	/** Callback fired when editing a specific field of an order item. */
	onEditMaterial: (
		frontendId: string | undefined,
		field: "ordertype" | "fixedprice" | "reserved" | "location" | "priceLock",
		value: string | number | boolean | Location[] | null,
	) => void;
	/** Callback fired to add a new order item. */
	onAddMaterial: (material: OrderItem, type: "buy" | "sell") => void;
	/** Optional title to display above the table. */
	title?: string;
	/** Optional list of available materials for reference when editing locations. */
	availableMaterialsList?: OrderItem[];
}

/**
 * A table component rendering a list of order items (either buy or sell orders).
 * Provides inline editing and removing capabilities via the `OrderItemRow` component.
 *
 * @param {MaterialTableProps} props - The component props.
 * @returns {React.ReactElement} The material table component.
 */
const MaterialTable: React.FC<MaterialTableProps> = memo(
	({
		materials,
		allOrders,
		locations,
		availableMaterialsList,
		onRemoveMaterial,
		onEditMaterial,
		onAddMaterial,
		title,
	}) => {
		const theme = useTheme();

		const headers = [
			{ label: "Material" },
			{ label: "Side" },
			{ label: "Locations" },
			{ label: "Price" },
			{ label: "Inventory" },
			{ label: "Limit", tooltip: "Total Reserve/Demand" },
			{ label: "Market", tooltip: "Quantity the Market shows you have/want" },
			{ label: "Remove" },
		];

		const tickerToOtherOrderTypeMap = useMemo(() => {
			const buyTickers = new Set(
				allOrders
					.filter((o) => o.ordertype === "buy")
					.map((o) => o.materialticker),
			);
			const sellTickers = new Set(
				allOrders
					.filter((o) => o.ordertype === "sell")
					.map((o) => o.materialticker),
			);

			const map = new Map<string, boolean>();
			allOrders.forEach((order) => {
				const key = order.frontendId || order.materialticker;
				let hasOtherType = false;
				if (order.ordertype === "buy") {
					hasOtherType = sellTickers.has(order.materialticker);
				} else {
					hasOtherType = buyTickers.has(order.materialticker);
				}
				map.set(key, hasOtherType);
			});
			return map;
		}, [allOrders]);

		const sortedMaterials = [...materials].sort((a, b) =>
			a.materialticker.localeCompare(b.materialticker),
		);

		return (
			<Paper
				elevation={0}
				sx={{
					display: "flex",
					flexDirection: "column",
					overflow: "hidden",
					height: "100%",
					background: "transparent",
				}}
			>
				{title && (
					<Typography
						variant="subtitle2"
						sx={{
							color: "text.primary",
							fontWeight: "bold",
							p: 1.5,
							bgcolor: "rgba(0,0,0,0.05)",
							borderBottom: `1px solid ${theme.palette.divider}`,
							flexShrink: 0,
							minHeight: 56,
							display: "flex",
							alignItems: "center",
							fontSize: "1.05rem",
						}}
					>
						{title.toUpperCase()}
					</Typography>
				)}

				{/* Table Header (Hidden on Mobile) */}
				<Box
					sx={{
						display: { sm: "grid", xs: "grid" },
						gridTemplateColumns: {
							xs: "40px 30px 40px 40px 40px 40px 40px 40px",
							sm: "1fr 1fr 1.45fr 1.5fr 0.8fr 0.8fr 0.8fr 50px",
						},
						alignItems: "center",
						px: 2,
						py: 0.5,
						color: theme.palette.text.secondary,
						fontWeight: "bold",
						gap: 1,
						borderBottom: `1px solid ${theme.palette.divider}`,
						flexShrink: 0,
						background: "transparent",
					}}
				>
					{headers.map((header) => (
						<Typography
							key={header.label}
							variant="body2"
							color="primary.dark"
							sx={{
								textAlign: "center",
								fontSize: "0.8rem",
								fontWeight: "bold",
								textTransform: "uppercase",
								opacity: 0.8,
							}}
						>
							{header.tooltip ? (
								<Tooltip title={header.tooltip}>
									<Box
										component="span"
										tabIndex={0}
										sx={{ cursor: "help", textDecoration: "underline dotted" }}
									>
										{header.label}
									</Box>
								</Tooltip>
							) : (
								header.label
							)}
						</Typography>
					))}
				</Box>

				{/* Scrollable List */}
				<Box sx={{ flexGrow: 1, overflowY: "auto", background: "transparent" }}>
					{materials.length === 0 ? (
						<Box
							sx={{
								color: "text.disabled",
								width: "100%",
								height: "100%",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								textAlign: "center",
								p: 2,
							}}
						>
							Your store is empty!
						</Box>
					) : (
						sortedMaterials.map((material: OrderItem) => (
							<OrderItemRow
								key={material.frontendId || material.materialticker}
								material={material}
								locations={locations}
								availableMaterialsList={availableMaterialsList}
								isAvailableMaterials={false}
								onRemoveMaterial={onRemoveMaterial}
								onEditMaterial={onEditMaterial}
								onAddMaterial={onAddMaterial}
								hasOtherOrderType={
									tickerToOtherOrderTypeMap.get(
										material.frontendId || material.materialticker,
									) || false
								}
							/>
						))
					)}
				</Box>
			</Paper>
		);
	},
);

export default MaterialTable;
