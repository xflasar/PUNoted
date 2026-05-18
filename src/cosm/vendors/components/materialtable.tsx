import React, { memo, useMemo, useState } from "react";
import { Paper, Typography, Box, useTheme, Pagination } from "@mui/material";
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
	/** Whether this table specifically displays buy orders (adjusts columns and labels). */
	isBuyOrders?: boolean;
	/** Optional title to display above the table. */
	title?: string;
}

const ITEMS_PER_PAGE = 15;

/**
 * A paginated table component rendering a list of order items (either buy or sell orders).
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
		onRemoveMaterial,
		onEditMaterial,
		onAddMaterial,
		isBuyOrders,
		title,
	}) => {
		const theme = useTheme();
		const [page, setPage] = useState(1);

		const buyHeaders = [
			{ label: "Ticker" },
			{ label: "Type" },
			{ label: "Location" },
			{ label: "Price" },
			{ label: "Buy Limit" },
			{ label: "In Store" },
			{ label: "Remove" },
		];
		const sellHeaders = [
			{ label: "Ticker" },
			{ label: "Type" },
			{ label: "Location" },
			{ label: "Price" },
			{ label: "Reserve" },
			{ label: "In Store" },
			{ label: "Remove" },
		];

		const headers = isBuyOrders ? buyHeaders : sellHeaders;

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

		const count = Math.ceil(materials.length / ITEMS_PER_PAGE);
		const paginatedMaterials = materials.slice(
			(page - 1) * ITEMS_PER_PAGE,
			page * ITEMS_PER_PAGE,
		);

		const handlePageChange = (
			_event: React.ChangeEvent<unknown>,
			value: number,
		) => {
			setPage(value);
		};

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
						variant="h6"
						sx={{
							color: theme.palette.primary.main,
							textAlign: "center",
							p: 0.5,
							borderBottom: `1px solid ${theme.palette.divider}`,
						}}
					>
						{title}
					</Typography>
				)}

				{/* Table Header (Hidden on Mobile) */}
				<Box
					sx={{
						display: { sm: "grid", xs: "grid" },
						gridTemplateColumns: {
							xs: "40px 30px 40px 40px 40px 40px 40px",
							sm: "80px 100px 145px 150px 100px 80px 50px",
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
							sx={{ textAlign: "center", fontWeight: "bold" }}
						>
							{header.label}
						</Typography>
					))}
				</Box>

				{/* Scrollable List */}
				<Box sx={{ flexGrow: 1, overflowY: "auto", background: "transparent" }}>
					{materials.length === 0 ? (
						<Box
							sx={{
								color: "text.secondary",
								width: "100%",
								textAlign: "center",
								p: 2,
							}}
						>
							No materials found.
						</Box>
					) : (
						paginatedMaterials.map((material: OrderItem) => (
							<OrderItemRow
								key={material.frontendId || material.materialticker}
								material={material}
								locations={locations}
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

				{count > 1 && (
					<Box
						sx={{
							display: "flex",
							justifyContent: "center",
							pt: 1,
							mt: "auto",
							borderTop: `1px solid ${theme.palette.divider}`,
							pb: 1,
						}}
					>
						<Pagination
							count={count}
							page={page}
							onChange={handlePageChange}
							color="primary"
							size="small"
						/>
					</Box>
				)}
			</Paper>
		);
	},
);

export default MaterialTable;
