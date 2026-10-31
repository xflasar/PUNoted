import React, { useState, useMemo } from "react";
import {
	Paper,
	Typography,
	TextField,
	Box,
	CircularProgress,
	useTheme,
	Checkbox,
	FormControlLabel,
	InputAdornment,
	Tooltip,
	IconButton,
} from "@mui/material";
import { PlusCircle, Search, X } from "lucide-react";
import { useDebounce } from "../hooks/usedebounce";
import type { OrderItem } from "../types";
import { pickPrice } from "../utils/pickprice";
import MaterialBadge from "../../components/materialbadge";
import { formatAmount } from "../../../utils/formaters";

/**
 * Props for the AvailableMaterialsList component.
 */
interface AvailableMaterialsListProps {
	/** The complete list of available materials */
	materials: OrderItem[];
	/** Whether the available materials request is pending */
	isLoading: boolean;
	/** The user's active current orders, excluded from the available list */
	allOrders: OrderItem[];
	/** Callback to handle adding a new material as a buy or sell order */
	onAddMaterial: (material: OrderItem, type: "buy" | "sell") => void;
	/** Optional callback to close the list when rendered in a drawer. */
	onClose?: () => void;
}

const priceFormatter = new Intl.NumberFormat("en-US", {
	maximumFractionDigits: 2,
});

const AvailableMaterialRow: React.FC<{
	material: OrderItem;
	onAddMaterial: (material: OrderItem, type: "buy" | "sell") => void;
}> = React.memo(({ material, onAddMaterial }) => {
	const theme = useTheme();
	const price = pickPrice({
		fixedprice: -1,
		corpprice: material.price?.corpprice ?? material.corpprice,
		cxprice: material.price?.cxprice,
	}).price;

	return (
		<Box
			className={material.instore === 0 ? "unavailable-order" : undefined}
			sx={{
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				p: 1.25,
				px: 2,
				borderBottom: "1px solid rgba(255,255,255,0.1)",
				"&.unavailable-order": {
					opacity: 0.5,
					filter: "grayscale(100%)",
				},
				"&:hover": { bgcolor: "rgba(255,255,255,0.03)" },
			}}
		>
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					gap: 0.75,
					minWidth: 0,
					whiteSpace: "nowrap",
				}}
			>
				<Box component="span" sx={{ fontSize: "0.85rem" }}>
					<MaterialBadge ticker={material.materialticker} />
				</Box>
				<Typography
					variant="caption"
					color="text.secondary"
					sx={{ fontSize: "0.85rem" }}
				>
					×
					<Box component="span" sx={{ fontWeight: "bold" }}>
						{formatAmount(material.instore)}
					</Box>
				</Typography>
			</Box>
			<Box
				sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}
			>
				<Typography
					variant="body2"
					sx={{ color: "warning.main", fontSize: "0.85rem" }}
				>
					<Box component="span" sx={{ fontWeight: "bold" }}>
						{priceFormatter.format(price)}
					</Box>{" "}
					<Box
						component="span"
						sx={{ color: "text.primary", fontSize: "0.75rem" }}
					>
						ICA
					</Box>
				</Typography>
				<IconButton
					size="small"
					aria-label={`Add ${material.materialticker} to orders`}
					onClick={() => onAddMaterial(material, "sell")}
				>
					<PlusCircle
						className="inline-icon"
						color={theme.palette.success.main}
					/>
				</IconButton>
			</Box>
		</Box>
	);
});

/**
 * A component displaying a filterable list of available materials to add to a store.
 * Allows filtering by ticker.
 *
 * @param {AvailableMaterialsListProps} props - The component props.
 * @returns {React.ReactElement} The available materials list component.
 */
const AvailableMaterialsList: React.FC<AvailableMaterialsListProps> = ({
	materials,
	isLoading,
	allOrders,
	onAddMaterial,
	onClose,
}) => {
	const theme = useTheme();
	const [searchQuery, setSearchQuery] = useState("");
	const [showUnavailable, setShowUnavailable] = useState(false);

	const debouncedSearchQuery = useDebounce(searchQuery, 300);

	const filteredMaterials = useMemo(() => {
		const lowerCaseQuery = debouncedSearchQuery.toLowerCase();
		const orderedTickers = new Set(
			allOrders.map((order) => order.materialticker),
		);
		return materials
			.filter((m) => m.materialticker.toLowerCase().includes(lowerCaseQuery))
			.filter((m) => showUnavailable || m.instore > 0)
			.filter((m) => !orderedTickers.has(m.materialticker));
	}, [debouncedSearchQuery, materials, allOrders, showUnavailable]);

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
			<Box
				sx={{
					p: 1.5,
					bgcolor: "rgba(0,0,0,0.05)",
					borderBottom: `1px solid ${theme.palette.divider}`,
					flexShrink: 0,
					minHeight: 56,
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
				}}
			>
				<Typography
					variant="subtitle2"
					sx={{
						color: "text.primary",
						fontWeight: "bold",
						fontSize: "1.05rem",
					}}
				>
					AVAILABLE MATERIALS
				</Typography>
				{onClose && (
					<IconButton aria-label="Close available materials" onClick={onClose}>
						<X className="inline-icon" />
					</IconButton>
				)}
			</Box>
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					p: 2,
					pb: 1,
				}}
			>
				<TextField
					fullWidth
					variant="outlined"
					placeholder="Search Materials..."
					value={searchQuery}
					disabled={isLoading}
					onChange={(e) => {
						setSearchQuery(e.target.value);
					}}
					size="small"
					slotProps={{
						input: {
							startAdornment: (
								<Search
									className="inline-icon"
									style={{ marginRight: 8, opacity: 0.5 }}
								/>
							),
							endAdornment: searchQuery ? (
								<InputAdornment position="end">
									<Tooltip title="Clear Search">
										<IconButton
											size="small"
											aria-label="Clear material search"
											onClick={() => {
												setSearchQuery("");
											}}
										>
											<X className="inline-icon" />
										</IconButton>
									</Tooltip>
								</InputAdornment>
							) : null,
						},
					}}
					sx={{
						"& .MuiOutlinedInput-root": {
							bgcolor: "rgba(0,0,0,0.15)",
							borderRadius: "12px",
						},
					}}
				/>
				<FormControlLabel
					control={
						<Checkbox
							size="small"
							disabled={isLoading}
							checked={showUnavailable}
							onChange={(e) => {
								setShowUnavailable(e.target.checked);
							}}
						/>
					}
					label="Show unavailable"
					sx={{ mt: 0.5, ml: 0.5 }}
				/>
			</Box>

			<Box sx={{ flexGrow: 1, overflowY: "auto" }}>
				{isLoading ? (
					<Box
						sx={{
							display: "flex",
							height: "100%",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<CircularProgress size={24} />
					</Box>
				) : filteredMaterials.length === 0 ? (
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
					filteredMaterials.map((material) => (
						<AvailableMaterialRow
							key={material.frontendId || material.materialticker}
							material={material}
							onAddMaterial={onAddMaterial}
						/>
					))
				)}
			</Box>
		</Paper>
	);
};

export default React.memo(AvailableMaterialsList);
