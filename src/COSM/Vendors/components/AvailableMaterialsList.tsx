import React, { useState, useMemo, useRef, useEffect } from "react";
import {
	Paper,
	Typography,
	TextField,
	Box,
	useTheme,
	Pagination,
	Checkbox,
	FormControlLabel,
} from "@mui/material";
import { Search } from "@mui/icons-material";
import OrderItemRow from "./OrderItemRow";
import { useDebounce } from "../hooks/useDebounce";
import type { OrderItem } from "../types";
import { pickPrice } from "../utils/pickPrice";

/**
 * Props for the AvailableMaterialsList component.
 */
interface AvailableMaterialsListProps {
	/** The complete list of available materials */
	materials: OrderItem[];
	/** The user's active current orders, used to disable adding duplicates */
	allOrders: OrderItem[];
	/** Callback to handle adding a new material as a buy or sell order */
	onAddMaterial: (material: OrderItem, type: "buy" | "sell") => void;
}

// Estimated height of a single row in pixels (40px icon + padding + border)
const ESTIMATED_ROW_HEIGHT = 50;

/**
 * A component displaying a paginated list of available materials to add to a store.
 * Allows filtering by ticker.
 *
 * @param {AvailableMaterialsListProps} props - The component props.
 * @returns {React.ReactElement} The available materials list component.
 */
const AvailableMaterialsList: React.FC<AvailableMaterialsListProps> = ({
	materials,
	allOrders,
	onAddMaterial,
}) => {
	const theme = useTheme();
	const [page, setPage] = useState(1);
	const [searchQuery, setSearchQuery] = useState("");
	const [showUnavailable, setShowUnavailable] = useState(false);
	const [itemsPerPage, setItemsPerPage] = useState(10); // Default start
	const listRef = useRef<HTMLDivElement>(null); // Ref for the container

	const debouncedSearchQuery = useDebounce(searchQuery, 300);

	// 1. Dynamic Height Calculation using ResizeObserver
	useEffect(() => {
		if (!listRef.current) return;

		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const height = entry.contentRect.height;
				// Calculate how many rows fit, ensuring at least 1 item
				const calculatedItems = Math.floor(height / ESTIMATED_ROW_HEIGHT);
				setItemsPerPage(Math.max(1, calculatedItems));
			}
		});

		observer.observe(listRef.current);

		return () => {
			observer.disconnect();
		};
	}, []);

	// 2. Filter and mark materials based on search and existing orders
	const filteredAndMarkedMaterials = useMemo(() => {
		const lowerCaseQuery = debouncedSearchQuery.toLowerCase();
		return materials
			.filter((m) => m.materialticker.toLowerCase().includes(lowerCaseQuery))
			.filter((m) => showUnavailable || m.instore > 0)
			.map((m) => ({
				...m,
				// Disable adding if the user already has both a buy and a sell order for this ticker
				isDisabled:
					allOrders.filter((o) => o.materialticker === m.materialticker)
						.length >= 2,
			}));
	}, [debouncedSearchQuery, materials, allOrders, showUnavailable]);

	// Ensure page doesn't get stuck out of bounds if itemsPerPage changes
	const count = Math.ceil(filteredAndMarkedMaterials.length / itemsPerPage);

	useEffect(() => {
		if (page > count && count > 0) {
			setPage(count);
		}
	}, [count, page]);

	const paginatedMaterials = filteredAndMarkedMaterials.slice(
		(page - 1) * itemsPerPage,
		page * itemsPerPage,
	);

	const headers = [
		{ label: "Ticker" },
		{ label: "Price" },
		{ label: "Available" },
		{ label: "Add" },
	];

	const handlePageChange = (
		_event: React.ChangeEvent<unknown>,
		value: number,
	) => {
		setPage(value);
	};

	return (
		<Paper
			sx={{
				p: 0,
				display: "flex",
				flexDirection: "column",
				height: "100%",
				border: "none",
				background: "transparent",
			}}
		>
			<Typography
				variant="h6"
				sx={{
					color: theme.palette.primary.main,
					mb: 1,
					px: 0.5,
					textAlign: "center",
				}}
			>
				Available Materials
			</Typography>
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					px: 0.5,
					mb: 1,
				}}
			>
				<TextField
					fullWidth
					variant="outlined"
					placeholder="Search by Ticker..."
					value={searchQuery}
					onChange={(e) => {
						setSearchQuery(e.target.value);
						setPage(1);
					}}
					size="small"
					InputProps={{
						startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} />,
						sx: { borderRadius: "24px" },
					}}
				/>
				<FormControlLabel
					control={
						<Checkbox
							size="small"
							checked={showUnavailable}
							onChange={(e) => {
								setShowUnavailable(e.target.checked);
								setPage(1);
							}}
						/>
					}
					label="Show unavailable"
					sx={{ mt: 0.5, ml: 0.5 }}
				/>
			</Box>

			{/* Header Row */}
			<Box
				sx={{
					display: { xs: "none", sm: "grid" },
					gridTemplateColumns: "70px 70px 80px 40px",
					alignItems: "center",
					px: 2,
					py: 0.5,
					color: theme.palette.text.secondary,
					fontWeight: "bold",
					gap: 1,
					borderBottom: `1px solid ${theme.palette.divider}`,
					flexShrink: 0,
				}}
			>
				{headers.map((header) => (
					<Typography
						key={header.label}
						variant="body2"
						sx={{ textAlign: "center", fontWeight: "bold" }}
					>
						{header.label}
					</Typography>
				))}
			</Box>

			{/* List Container - We attach the ref here to measure available height */}
			<Box ref={listRef} sx={{ flexGrow: 1, overflowY: "auto" }}>
				{paginatedMaterials.length === 0 ? (
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
					paginatedMaterials.map((material) => {
						const corpPrice = pickPrice({
							fixedprice: -1,
							corpprice: material.price?.corpprice ?? material.corpprice,
							cxprice: material.price?.cxprice,
						}).price;
						const displayMaterial = {
							...material,
							fixedprice: corpPrice,
							price: {
								...material.price,
								fixedprice: corpPrice,
							},
						};

						return (
							<OrderItemRow
								key={material.frontendId}
								material={displayMaterial}
								isAvailableMaterials={true}
								onAddMaterial={onAddMaterial}
								locations={[]} // Pass empty or full locations list if needed
							/>
						);
					})
				)}
			</Box>

			{/* Pagination */}
			{count > 1 && (
				<Box
					sx={{
						display: "flex",
						justifyContent: "center",
						pt: 1,
						pb: 1,
						mt: "auto",
						borderTop: `1px solid ${theme.palette.divider}`,
					}}
				>
					<Pagination
						count={count}
						page={page}
						onChange={handlePageChange}
						color="primary"
						size="small"
						siblingCount={0}
					/>
				</Box>
			)}
		</Paper>
	);
};

export default React.memo(AvailableMaterialsList);
