import React, {
	memo,
	useState,
	useEffect,
	useCallback,
	useRef,
	useMemo,
} from "react";
import {
	TextFieldProps,
	Box,
	Typography,
	TextField,
	IconButton,
	Select,
	MenuItem,
	FormControl,
	Autocomplete,
	useTheme,
	Collapse,
	Chip,
	Tooltip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutlineOutlined";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import type { OrderItem, Location } from "../types";
import { formatCurrency } from "../../../Dashboard/Financial/utils/financeUtils";
import { formatAmount } from "../../../utils/formaters";
import MaterialBadge from "../../components/MaterialBadge";

/**
 * A debounced text field component used to prevent rapid state updates and potential focus loss.
 *
 * @param {object} props - Component props.
 * @param {string | number} props.value - The current value.
 * @param {(val: number) => void} props.onChange - Callback fired when the debounced value changes.
 * @param {number} [props.delay] - The debounce delay in milliseconds.
 * @returns {React.ReactElement} The debounced input.
 */
const DebouncedInput = ({
	value,
	onChange,
	delay = 300,
	...props
}: {
	value: string | number;
	onChange: (val: number) => void;
	delay?: number;
} & Omit<TextFieldProps, "onChange" | "value" | "InputProps">) => {
	const [localValue, setLocalValue] = useState<string | number>(value);
	const handlerRef = useRef<NodeJS.Timeout>();

	useEffect(() => {
		setLocalValue(value);
	}, [value]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newVal = e.target.value;
		setLocalValue(newVal);

		if (handlerRef.current) clearTimeout(handlerRef.current);

		handlerRef.current = setTimeout(() => {
			onChange(parseFloat(newVal) || 0);
		}, delay);
	};

	return <TextField {...props} value={localValue} onChange={handleChange} />;
};

/**
 * Layout helper component representing a single cell in the grid row.
 * Displays an inline label only on mobile viewports.
 *
 * @param {object} props - Component props.
 * @param {string} props.label - The label for the cell (visible on mobile).
 * @param {React.ReactNode} props.children - The content to display.
 * @param {object} [props.sx] - Additional Material-UI sx styling.
 * @returns {React.ReactElement} The styled cell.
 */
const Cell = ({
	label,
	children,
	sx = {},
}: {
	label: string;
	children: React.ReactNode;
	sx?: object;
}) => {
	const theme = useTheme();
	return (
		<Box
			sx={{
				width: "100%",
				textAlign: { xs: "left", sm: "center" },
				display: "flex",
				flexDirection: { xs: "column", sm: "block" },
				alignItems: { xs: "flex-start", sm: "center" },
				...sx,
			}}
		>
			<Typography
				variant="caption"
				sx={{
					display: { xs: "inline", sm: "none" },
					color: theme.palette.text.secondary,
					mb: 0.5,
					fontWeight: "bold",
					fontSize: "0.7rem",
				}}
			>
				{label}
			</Typography>
			<Box sx={{ width: "100%" }}>{children}</Box>
		</Box>
	);
};

// --- TYPES ---
/**
 * Represents a location assigned to a specific order.
 */
export interface OrderLocationEntry {
	id: string;
	location_name: string;
	location_code: string;
	amount: number;
	storage_amount?: number;
}

/**
 * Props for the OrderItemRow component.
 */
interface OrderItemRowProps {
	/** The order or material to display in this row. */
	material: OrderItem;
	/** If true, renders a simplified row for the "Available Materials" list. */
	isAvailableMaterials: boolean;
	/** List of all possible locations. */
	locations: Location[];
	/** Callback to remove the material. */
	onRemoveMaterial?: (
		frontendId: string | undefined,
		type: "buy" | "sell" | undefined,
	) => void;
	/** Callback to update a field in the material. */
	onEditMaterial?: (
		frontendId: string | undefined,
		field: "ordertype" | "fixedprice" | "reserved" | "location" | "priceLock",
		value: any,
	) => void;
	/** Callback to add the material to active orders. */
	onAddMaterial?: (material: OrderItem, type: "buy" | "sell") => void;
	/** Whether another order of the opposite type exists for this material. */
	hasOtherOrderType?: boolean;
	/** Inline styles applied to the row container. */
	style?: React.CSSProperties;
}

/**
 * Renders a single row representing an order item or an available material.
 * Handled via a responsive CSS grid, supporting inline editing of prices, quantities, and locations.
 *
 * @param {OrderItemRowProps} props - The component props.
 * @returns {React.ReactElement | null} The rendered row component.
 */
const OrderItemRow: React.FC<OrderItemRowProps> = memo(
	({
		material,
		isAvailableMaterials,
		locations,
		onRemoveMaterial,
		onEditMaterial,
		onAddMaterial,
		hasOtherOrderType,
		style,
	}) => {
		const theme = useTheme();
		const [open, setOpen] = useState(false);

		const currentLocations = useMemo(() => {
			return Array.isArray(material.location) ? material.location : [];
		}, [material.location]);

		const labelText = material.ordertype === "buy" ? "Demand" : "Reserve";
		const isPriceLocked = Boolean(material.isPriceLocked);
		const corpPrice = material.price?.corpprice ?? 0;
		const displayPrice = isPriceLocked
			? corpPrice
			: (material.price?.fixedprice ?? material.fixedprice ?? 0);
		const totalAmount = currentLocations.reduce(
			(sum: number, l: any) => sum + (l.amount || 0),
			0,
		);

		// --- HANDLERS ---
		const handleAddLocation = useCallback(
			(newLocationObj: Location | null) => {
				if (!newLocationObj) return;
				if (currentLocations.some((l: any) => l.id === newLocationObj.id))
					return;

				const newEntry = {
					id: newLocationObj.id,
					location_name: newLocationObj.location_name,
					location_code: newLocationObj.location_code,
					amount: 0,
					storage_amount: 0,
				};

				onEditMaterial?.(material.frontendId, "location", [
					...currentLocations,
					newEntry,
				]);
				setOpen(true);
			},
			[currentLocations, material.frontendId, onEditMaterial],
		);

		const handleUpdateLocationAmount = useCallback(
			(locId: string, val: number) => {
				const updated = currentLocations.map((l: any) =>
					l.id === locId ? { ...l, amount: val } : l,
				);
				onEditMaterial?.(material.frontendId, "location", updated);
			},
			[currentLocations, material.frontendId, onEditMaterial],
		);

		const handleRemoveLocation = useCallback(
			(locId: string) => {
				const updated = currentLocations.filter((l: any) => l.id !== locId);
				onEditMaterial?.(material.frontendId, "location", updated);
			},
			[currentLocations, material.frontendId, onEditMaterial],
		);

		const commonBoxSx = {
			display: "grid",
			width: "100%",
			alignItems: "center",
			borderBottom: `1px solid ${theme.palette.divider}`,
			py: { xs: 1.5, sm: 0.5 },
			px: { xs: 1.5, sm: 2 },
			gap: { xs: 1.5, sm: 1 },
			transition: "background-color 0.2s",
			"&:hover": { bgcolor: theme.palette.action.hover },
		};

		// --- BUY / SELL ORDER ROW ---
		if (!isAvailableMaterials) {
			return (
				<Box
					style={style}
					sx={{
						borderBottom: `1px solid ${theme.palette.divider}`,
						background: "transparent",
					}}
				>
					{/* MAIN ROW */}
					<Box
						sx={{
							...commonBoxSx,
							gridTemplateColumns: {
								xs: "1fr 1fr",
								sm: "80px 100px 145px 150px 100px 80px 50px",
							},
							background: open ? theme.palette.background.paper : "transparent",
						}}
					>
						{/* 1. Ticker */}
						<Cell label="Ticker">
							<Typography variant="body2" fontWeight="bold">
								<MaterialBadge ticker={material.materialticker} />
							</Typography>
						</Cell>

						{/* 2. Type */}
						<Cell label="Type">
							<FormControl variant="standard" fullWidth>
								<Select
									size="small"
									variant="outlined"
									value={material.ordertype}
									onChange={(e) =>
										onEditMaterial?.(
											material.frontendId,
											"ordertype",
											e.target.value as "buy" | "sell",
										)
									}
									disabled={hasOtherOrderType}
									sx={{ fontSize: "0.875rem" }}
								>
									<MenuItem value="sell">Ask</MenuItem>
									<MenuItem value="buy">Bid</MenuItem>
								</Select>
							</FormControl>
						</Cell>

						{/* 3. Location (Full width on mobile) */}
						<Cell
							label="Location"
							sx={{ gridColumn: { xs: "1 / -1", sm: "auto" } }}
						>
							<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
								{currentLocations.length === 0 ? (
									<Typography variant="caption" color="error">
										Select Loc
									</Typography>
								) : currentLocations.length === 1 ? (
									<Chip
										label={currentLocations[0].location_code}
										size="small"
									/>
								) : (
									<Chip
										label={`${currentLocations.length} Locs`}
										color="primary"
										size="small"
										variant="outlined"
									/>
								)}
								<IconButton
									size="small"
									onClick={() => setOpen(!open)}
									sx={{
										ml: "auto",
										transform: open ? "rotate(180deg)" : "rotate(0deg)",
										transition: "0.2s",
									}}
								>
									<KeyboardArrowDownIcon />
								</IconButton>
							</Box>
						</Cell>

						{/* 4. Price */}
						<Cell label="Price">
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 0.5,
									width: "100%",
									minWidth: 0,
								}}
							>
								<Tooltip
									title={isPriceLocked ? "Auto COSM Price" : ""}
									disableHoverListener={!isPriceLocked}
								>
									<Box sx={{ flex: 1, minWidth: 0 }}>
										<DebouncedInput
											size="small"
											variant="outlined"
											type="number"
											value={displayPrice}
											onChange={(val) =>
												onEditMaterial?.(material.frontendId, "fixedprice", val)
											}
											disabled={isPriceLocked}
											InputProps={{
												inputProps: {
													min: 0,
													style: { textAlign: "center" },
												},
											}}
											sx={{ width: "100%" }}
										/>
									</Box>
								</Tooltip>
								<Tooltip title={isPriceLocked ? "COSM Price" : "Custom Price"}>
									<IconButton
										size="small"
										sx={{ flexShrink: 0 }}
										onClick={() =>
											onEditMaterial?.(
												material.frontendId,
												"priceLock",
												!isPriceLocked,
											)
										}
									>
										{isPriceLocked ? (
											<LockIcon fontSize="small" />
										) : (
											<LockOpenOutlinedIcon fontSize="small" />
										)}
									</IconButton>
								</Tooltip>
							</Box>
						</Cell>

						{/* 5. Total (Label text varies) */}
						<Cell label={labelText}>
							<Tooltip title={`Total ${labelText}. Expand location to edit.`}>
								<DebouncedInput
									size="small"
									variant="outlined"
									value={totalAmount || 0}
									onChange={() => {}}
									disabled={true}
									InputProps={{
										inputProps: { style: { textAlign: "center" } },
									}}
									sx={{ width: "100%" }}
								/>
							</Tooltip>
						</Cell>

						{/* 6. In Store */}
						<Cell label="In Store">
							<Typography variant="body2">{material.quantity}</Typography>
						</Cell>

						{/* 7. Remove (Align right on mobile) */}
						<Cell
							label="Remove"
							sx={{ alignItems: { xs: "flex-end", sm: "center" } }}
						>
							<IconButton
								onClick={() =>
									onRemoveMaterial?.(material?.frontendId, material.ordertype)
								}
							>
								<DeleteIcon color="error" />
							</IconButton>
						</Cell>
					</Box>

					{/* COMPACT LOCATION BREAKDOWN */}
					<Collapse in={open} timeout="auto" unmountOnExit>
						<Box
							sx={{
								px: { xs: 1, sm: 4 },
								py: 1.5,
								bgcolor: "rgba(0,0,0,0.15)",
								borderTop: `1px solid ${theme.palette.divider}`,
							}}
						>
							{/* Header for Compact Table */}
							<Box
								sx={{
									display: "grid",
									gridTemplateColumns: "1.5fr 1fr 1.5fr 40px",
									gap: 2,
									mb: 1,
									px: 1,
								}}
							>
								<Typography variant="caption" color="text.secondary">
									Location
								</Typography>
								<Typography
									variant="caption"
									color="text.secondary"
									align="right"
								>
									In Stock
								</Typography>
								<Typography variant="caption" color="text.secondary">
									{labelText}
								</Typography>
								<Box />
							</Box>

							{/* Location Rows */}
							{currentLocations.map((loc: any) => (
								<Box
									key={loc.id}
									sx={{
										display: "grid",
										gridTemplateColumns: "1.5fr 1fr 1.5fr 40px",
										alignItems: "center",
										gap: 2,
										mb: 1,
										px: 1,
										"&:hover": {
											bgcolor: "rgba(255,255,255,0.03)",
											borderRadius: 1,
										},
									}}
								>
									<Tooltip title={loc.location_name}>
										<Box
											sx={{
												overflow: "hidden",
												textOverflow: "ellipsis",
												whiteSpace: "nowrap",
											}}
										>
											<Chip
												label={loc.location_code}
												size="small"
												sx={{ mr: 1, cursor: "help" }}
											/>
											<Typography
												variant="caption"
												sx={{ display: { xs: "none", md: "inline" } }}
											>
												{loc.location_name}
											</Typography>
										</Box>
									</Tooltip>

									<Typography
										variant="body2"
										align="right"
										sx={{
											color:
												(loc.storage_amount || 0) > 0
													? theme.palette.success.light
													: theme.palette.text.disabled,
											fontWeight: "bold",
										}}
									>
										{loc.storage_amount || 0}
									</Typography>

									<DebouncedInput
										size="small"
										placeholder="0"
										type="text"
										value={loc.amount || ""}
										onChange={(val) => handleUpdateLocationAmount(loc.id, val)}
										InputProps={{
											sx: {
												bgcolor: theme.palette.background.paper,
												fontSize: "0.85rem",
												height: "32px",
											},
										}}
									/>

									<IconButton
										size="small"
										onClick={() => handleRemoveLocation(loc.id)}
									>
										<RemoveCircleOutlineIcon fontSize="small" color="error" />
									</IconButton>
								</Box>
							))}

							<Box sx={{ mt: 1.5, px: 1 }}>
								<Autocomplete
									options={locations}
									getOptionLabel={(option) =>
										typeof option === "string"
											? option
											: `${option.location_name} [${option.location_code}]`
									}
									isOptionEqualToValue={(option, value) =>
										option.id === value.id
									}
									onChange={(event, newValue) => handleAddLocation(newValue)}
									value={null}
									renderInput={(params) => (
										<TextField
											{...params}
											size="small"
											placeholder="+ Add Location"
											variant="standard"
											InputProps={{
												...params.InputProps,
												disableUnderline: true,
											}}
											sx={{
												bgcolor: "rgba(255,255,255,0.05)",
												px: 1,
												borderRadius: 1,
											}}
										/>
									)}
								/>
							</Box>
						</Box>
					</Collapse>
				</Box>
			);
		}

		// --- AVAILABLE MATERIALS VIEW (Simple Row) ---
		if (isAvailableMaterials) {
			return (
				<Box
					style={style}
					key={material.frontendId || material.materialticker}
					sx={{
						...commonBoxSx,
						// Mobile: 3 columns (Ticker+Price share col 1, InStore Col 2, Add Col 3)
						gridTemplateColumns: { xs: "1fr 1fr 50px", sm: "1fr 1fr 1fr 50px" },
					}}
				>
					<Cell label="Ticker">
						<Box sx={{ display: "flex", flexDirection: "column" }}>
							<Typography variant="body2" fontWeight="bold">
								<MaterialBadge ticker={material.materialticker} />
							</Typography>
							{/* On mobile, show Price under ticker to save horizontal space */}
							<Typography
								variant="caption"
								sx={{
									display: { xs: "block", sm: "none" },
									color: theme.palette.text.secondary,
									textAlign: "right",
								}}
							>
								{formatCurrency(material.fixedprice ?? 0)} ICA
							</Typography>
						</Box>
					</Cell>

					{/* Desktop Price Cell (Hidden on mobile) */}
					<Cell label="Price" sx={{ display: { xs: "none", sm: "block" } }}>
						<Typography variant="body2" sx={{ textAlign: "right" }}>
							{formatCurrency(material.fixedprice ?? 0)}
						</Typography>
					</Cell>

					<Cell label="In Store">
						<Typography variant="body2" sx={{ textAlign: "right" }}>
							{formatAmount(material.instore)}
						</Typography>
					</Cell>

					<Cell label="Add">
						<IconButton
							edge="end"
							onClick={() => onAddMaterial?.(material, "sell")}
							disabled={material.isDisabled}
						>
							<AddCircleIcon
								color={material.isDisabled ? "disabled" : "success"}
							/>
						</IconButton>
					</Cell>
				</Box>
			);
		}
		return null;
	},
	(prev, next) => {
		return (
			prev.material === next.material &&
			prev.locations === next.locations &&
			prev.hasOtherOrderType === next.hasOtherOrderType &&
			prev.style === next.style
		);
	},
);

export default OrderItemRow;
