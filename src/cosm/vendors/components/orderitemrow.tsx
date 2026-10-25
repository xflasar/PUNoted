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
	Button,
	Autocomplete,
	useTheme,
	Collapse,
	Chip,
	Tooltip,
	alpha,
} from "@mui/material";
import { RefreshCw, RefreshCwOff, Trash2 } from "lucide-react";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutlineOutlined";
import type { OrderItem, Location } from "../types";
import { formatCurrency } from "../../../dashboard/financial/utils/financeutils";
import { formatAmount } from "../../../utils/formaters";
import { pickPrice } from "../utils/pickprice";
import { formatLocation } from "../utils/formatlocation";
import MaterialBadge from "../../components/materialbadge";

export const getLocationMarketQuantity = (
	ordertype: OrderItem["ordertype"],
	location: Pick<Location, "amount" | "storage_amount" | "available">,
) => {
	const inventory = Number(location.available ?? location.storage_amount) || 0;
	const limit = Number(location.amount) || 0;
	return Math.max(
		0,
		ordertype === "sell" ? inventory - limit : limit - inventory,
	);
};

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
				width: "auto",
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
			<Box>{children}</Box>
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
	available?: number;
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
		field: "ordertype" | "fixedprice" | "reserved" | "locations" | "priceLock",
		value: any,
	) => void;
	/** Callback to add the material to active orders. */
	onAddMaterial?: (material: OrderItem, type: "buy" | "sell") => void;
	/** Whether another order of the opposite type exists for this material. */
	hasOtherOrderType?: boolean;
	/** Inline styles applied to the row container. */
	style?: React.CSSProperties;
	/** The list of available materials. */
	availableMaterialsList?: OrderItem[];
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
		availableMaterialsList,
	}) => {
		const theme = useTheme();
		const [open, setOpen] = useState(false);
		const [locationInputValue, setLocationInputValue] = useState("");

		const currentLocations = useMemo(() => {
			return Array.isArray(material.locations) ? material.locations : [];
		}, [material.locations]);

		const compareLocations = useCallback((a: Location, b: Location) => {
			if (a.location_code === "HRT") return -1;
			if (b.location_code === "HRT") return 1;
			return `${a.location_name} [${a.location_code}]`.localeCompare(
				`${b.location_name} [${b.location_code}]`,
			);
		}, []);

		const sortedCurrentLocations = useMemo(() => {
			return [...currentLocations].sort(compareLocations);
		}, [currentLocations, compareLocations]);

		const availableLocations = useMemo(() => {
			return [...locations]
				.filter(
					(location) =>
						!currentLocations.some((current) => current.id === location.id),
				)
				.sort(compareLocations);
		}, [locations, currentLocations, compareLocations]);

		const locationStockById = useMemo(() => {
			const stocks = new Map<string, number>();
			(material.locationSource || []).forEach((loc) => {
				stocks.set(
					loc.id,
					loc.available ?? loc.storage_amount ?? loc.amount ?? 0,
				);
			});
			return stocks;
		}, [material.locationSource]);

		const labelText = material.ordertype === "buy" ? "Demand" : "Reserve";
		const labelTooltip =
			material.ordertype === "buy"
				? "Quantity you want to have"
				: "Quantity not for sale";
		const marketTooltip =
			material.ordertype === "buy"
				? "Quantity the market shows you want"
				: "Quantity the market shows you have";
		const isPriceLocked = Boolean(material.isPriceLocked);
		const displayPrice = pickPrice({
			fixedprice: isPriceLocked
				? -1
				: (material.price?.fixedprice ?? material.fixedprice),
			corpprice: material.price?.corpprice,
			cxprice: material.price?.cxprice,
		}).price;
		const displayQuantity = currentLocations.reduce(
			(sum: number, loc: any) =>
				sum + (loc.available ?? loc.storage_amount ?? loc.amount ?? 0),
			0,
		);
		const totalAmount = currentLocations.reduce(
			(sum: number, l: any) => sum + (l.amount || 0),
			0,
		);
		const marketQuantity = currentLocations.reduce(
			(sum: number, location: any) =>
				sum + getLocationMarketQuantity(material.ordertype, location),
			0,
		);
		const marketColor =
			material.ordertype === "sell"
				? theme.palette.warning.light
				: theme.palette.info.light;

		// --- HANDLERS ---
		const handleAddLocation = useCallback(
			(newLocationObj: Location | null) => {
				if (!newLocationObj) return;
				if (currentLocations.some((l: any) => l.id === newLocationObj.id))
					return;
				const sourceLocation = material.locationSource?.find(
					(loc) => loc.id === newLocationObj.id,
				);

				let trueInStock = 0;

				if (availableMaterialsList) {
					const sourceMaterial = availableMaterialsList.find(
						(m) => m.materialid === material.materialid,
					);

					const sourceLocation = sourceMaterial?.locations?.find(
						(loc) => loc.id === newLocationObj.id,
					);

					trueInStock = sourceLocation?.available ?? 0;
				}

				const newEntry = {
					id: newLocationObj.id,
					location_name: newLocationObj.location_name,
					location_code: newLocationObj.location_code,
					amount: 0,
					storage_amount:
						sourceLocation?.available ??
						sourceLocation?.storage_amount ??
						newLocationObj.available ??
						newLocationObj.storage_amount ??
						0,
					available:
						sourceLocation?.available ??
						sourceLocation?.storage_amount ??
						newLocationObj.available ??
						newLocationObj.storage_amount ??
						0,
				};

				onEditMaterial?.(material.frontendId, "locations", [
					...currentLocations,
					newEntry,
				]);
				setOpen(true);
			},
			[
				currentLocations,
				material.frontendId,
				material.materialid,
				material.locationSource,
				onEditMaterial,
			],
		);

		const handleUpdateLocationAmount = useCallback(
			(locId: string, val: number) => {
				const updated = currentLocations.map((l: any) =>
					l.id === locId ? { ...l, amount: val } : l,
				);
				onEditMaterial?.(material.frontendId, "locations", updated);
			},
			[currentLocations, material.frontendId, onEditMaterial],
		);

		const handleRemoveLocation = useCallback(
			(locId: string) => {
				const updated = currentLocations.filter((l: any) => l.id !== locId);
				onEditMaterial?.(material.frontendId, "locations", updated);
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
							display: "flex",
							"& > *": { flex: 1, minWidth: 0 },
							"& > :nth-child(3), & > :nth-child(4)": { flex: 2 },
							"& > :last-child": { flex: "0 0 40px", maxWidth: 40 },
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
							<Box
								role="group"
								aria-label={`Order type for ${material.materialticker}`}
								sx={{ display: "inline-flex" }}
							>
								{(
									[
										{
											type: "sell",
											label: "ASK",
											color: theme.palette.warning.light,
											tooltip: "You sell to COSM members",
										},
										{
											type: "buy",
											label: "BID",
											color: theme.palette.info.light,
											tooltip: "You buy from COSM members",
										},
									] as const
								).map(({ type, label, color, tooltip }, index) => {
									const active = material.ordertype === type;
									return (
										<Tooltip key={type} title={tooltip}>
											<Box component="span" sx={{ display: "flex" }}>
												<Button
													size="small"
													variant="outlined"
													disabled={hasOtherOrderType}
													aria-pressed={active}
													onClick={() =>
														onEditMaterial?.(
															material.frontendId,
															"ordertype",
															type,
														)
													}
													sx={{
														minWidth: 0,
														fontSize: "0.7rem",
														fontWeight: "bold",
														textDecoration: "underline dotted",
														color: "grey.600",
														border: "1px solid",
														borderColor: "grey.600",
														"&:hover": {
															borderColor: "grey.600",
															bgcolor: "action.hover",
														},
														borderRadius:
															index === 0 ? "4px 0 0 4px" : "0 4px 4px 0",
														...(active && {
															color,
															bgcolor: alpha(color, 0.1),
															borderColor: alpha(color, 0.3),
															"&:hover": { bgcolor: alpha(color, 0.1) },
														}),
													}}
												>
													{label}
												</Button>
											</Box>
										</Tooltip>
									);
								})}
							</Box>
						</Cell>

						{/* 3. Location (Full width on mobile) */}
						<Cell label="Location">
							<Box sx={{ display: "flex", alignItems: "center" }}>
								<Tooltip title="Edit locations">
									<Chip
										onClick={() => setOpen(!open)}
										aria-label="Edit locations"
										sx={{
											"& .MuiChip-label": {
												display: "flex",
												alignItems: "center",
												pl: 1,
												pr: 0.5,
												py: 0,
											},
										}}
										label={
											currentLocations.length === 0 ? (
												<>
													Select Location
													<Box
														component="span"
														sx={{
															display: "flex",
															transform: open
																? "rotate(180deg)"
																: "rotate(0deg)",
															transition: "0.2s",
														}}
													>
														<KeyboardArrowDownIcon className="inline-icon" />
													</Box>
												</>
											) : (
												<>
													<Box component="span" sx={{ fontWeight: "bold" }}>
														{sortedCurrentLocations[0].location_name}
													</Box>
													{currentLocations.length > 1 &&
														` +${currentLocations.length - 1}`}
													<Box
														component="span"
														sx={{
															display: "flex",
															transform: open
																? "rotate(180deg)"
																: "rotate(0deg)",
															transition: "0.2s",
														}}
													>
														<KeyboardArrowDownIcon className="inline-icon" />
													</Box>
												</>
											)
										}
										size="small"
									/>
								</Tooltip>
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
									title={
										isPriceLocked
											? "Disable COSM Price Sync to set a custom price"
											: ""
									}
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
											slotProps={{
												input: {
													min: 0,
													style: { textAlign: "center" },
												},
											}}
											sx={{
												width: "100%",
												"& .MuiInputBase-root.Mui-disabled, & .MuiInputBase-input.Mui-disabled":
													{
														cursor: "not-allowed",
													},
											}}
										/>
									</Box>
								</Tooltip>
								<Tooltip
									title={`COSM Price Sync: ${isPriceLocked ? "ENABLED" : "DISABLED"}`}
								>
									<Button
										variant={isPriceLocked ? "contained" : "outlined"}
										size="large"
										aria-label={
											isPriceLocked ? "Disable COSM sync" : "Enable COSM sync"
										}
										sx={{ minWidth: 0, p: 1.4, borderRadius: "50%" }}
										onClick={() =>
											onEditMaterial?.(
												material.frontendId,
												"priceLock",
												!isPriceLocked,
											)
										}
									>
										{isPriceLocked ? (
											<RefreshCw className="inline-icon" />
										) : (
											<RefreshCwOff className="inline-icon" />
										)}
									</Button>
								</Tooltip>
							</Box>
						</Cell>

						{/* 5. Inventory */}
						<Cell
							label="Inventory"
							sx={{ display: { xs: "none", md: "block" } }}
						>
							<Typography variant="body2" align="center">
								{formatAmount(displayQuantity)}
							</Typography>
						</Cell>

						{/* 6. Total (Label text varies) */}
						<Cell label="Limit" sx={{ display: { xs: "none", md: "block" } }}>
							<Typography variant="body2" align="center">
								{formatAmount(totalAmount || 0)}
							</Typography>
						</Cell>

						{/* 7. Quantity listed on the market */}
						<Cell label="Market">
							<Typography
								variant="body2"
								align="center"
								sx={{
									fontWeight: 700,
									color: marketQuantity > 0 ? marketColor : "text.disabled",
								}}
							>
								{formatAmount(marketQuantity)}
							</Typography>
						</Cell>

						{/* 7. Remove (Align right on mobile) */}
						<Cell
							label="Remove"
							sx={{ alignItems: { xs: "flex-end", sm: "center" } }}
						>
							<IconButton
								color="error"
								onClick={() =>
									onRemoveMaterial?.(material?.frontendId, material.ordertype)
								}
							>
								<Trash2 className="inline-icon" />
							</IconButton>
						</Cell>
					</Box>

					{/* COMPACT LOCATION BREAKDOWN */}
					<Collapse in={open} timeout="auto" unmountOnExit>
						<Box
							sx={{
								p: 2,
								bgcolor: "rgba(0,0,0,0.3)",
								borderTop: `1px solid ${theme.palette.divider}`,
							}}
						>
							<Box sx={{ width: "100%", maxWidth: 600, mx: "auto" }}>
								{/* Header for Compact Table */}
								<Box
									sx={{
										display: "flex",
										gap: 2,
										"& > *": { flex: 1, minWidth: 0 },
										"& > :first-child": { flex: 2 },
										"& > :last-child": { flex: "0 0 40px", maxWidth: 40 },
										mb: 1,
										px: 1,
									}}
								>
									<Typography
										variant="caption"
										sx={{
											color: theme.palette.text.secondary,
											fontWeight: "bold",
											textTransform: "uppercase",
											opacity: 0.8,
										}}
									>
										Location
									</Typography>
									<Typography
										variant="caption"
										sx={{
											color: theme.palette.text.secondary,
											fontWeight: "bold",
											textTransform: "uppercase",
											opacity: 0.8,
											textAlign: "right",
										}}
									>
										Inventory
									</Typography>
									<Typography
										variant="caption"
										sx={{
											color: theme.palette.text.secondary,
											fontWeight: "bold",
											textTransform: "uppercase",
											opacity: 0.8,
											textAlign: "right",
										}}
									>
										<Tooltip title={labelTooltip}>
											<Box
												component="span"
												tabIndex={0}
												sx={{
													cursor: "help",
													textDecoration: "underline dotted",
												}}
											>
												{labelText}
											</Box>
										</Tooltip>
									</Typography>
									<Typography
										variant="caption"
										sx={{
											color: theme.palette.text.secondary,
											fontWeight: "bold",
											textTransform: "uppercase",
											opacity: 0.8,
											textAlign: "right",
										}}
									>
										<Tooltip title={marketTooltip}>
											<Box
												component="span"
												tabIndex={0}
												sx={{
													cursor: "help",
													textDecoration: "underline dotted",
												}}
											>
												{material.ordertype === "sell" ? "Have" : "Want"}
											</Box>
										</Tooltip>
									</Typography>
									<Box />
								</Box>

								{/* Location Rows */}
								{sortedCurrentLocations.map((loc: any) => (
									<Box
										key={loc.id}
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 2,
											"& > *": { flex: 1, minWidth: 0 },
											"& > :first-child": { flex: 2 },
											"& > :last-child": { flex: "0 0 40px", maxWidth: 40 },
											mb: 1,
											px: 1,
											"&:hover": {
												bgcolor: "rgba(255,255,255,0.03)",
												borderRadius: 1,
											},
										}}
									>
										<Typography
											variant="caption"
											sx={{
												overflow: "hidden",
												textOverflow: "ellipsis",
												whiteSpace: "nowrap",
											}}
										>
											{formatLocation(loc.location_name, loc.location_code)}
										</Typography>

										<Typography
											variant="body2"
											align="right"
											sx={{
												color:
													(Number(loc.available ?? loc.storage_amount) || 0) ===
													0
														? "text.disabled"
														: undefined,
											}}
										>
											{formatAmount(loc.available ?? loc.storage_amount ?? 0)}
										</Typography>

										<DebouncedInput
											size="small"
											placeholder="0"
											type="text"
											value={loc.amount || ""}
											onChange={(val) =>
												handleUpdateLocationAmount(loc.id, val)
											}
											slotProps={{
												input: {
													sx: {
														bgcolor: theme.palette.background.paper,
														fontSize: "0.85rem",
														height: "32px",
														"& input": { textAlign: "right" },
													},
												},
											}}
										/>

										<Typography
											variant="body2"
											align="right"
											sx={{
												fontWeight: 700,
												color:
													getLocationMarketQuantity(material.ordertype, loc) ===
													0
														? "text.disabled"
														: marketColor,
											}}
										>
											{formatAmount(
												getLocationMarketQuantity(material.ordertype, loc),
											)}
										</Typography>

										{currentLocations.length > 1 ? (
											<IconButton
												size="small"
												onClick={() => handleRemoveLocation(loc.id)}
											>
												<RemoveCircleOutlineIcon
													fontSize="small"
													color="error"
												/>
											</IconButton>
										) : (
											<Box />
										)}
									</Box>
								))}

								<Box sx={{ mt: 1.5, px: 1 }}>
									<Autocomplete
										options={availableLocations}
										getOptionLabel={(option) =>
											typeof option === "string"
												? option
												: `${formatLocation(option.location_name, option.location_code)}: ${formatAmount(locationStockById.get(option.id) ?? 0)}`
										}
										isOptionEqualToValue={(option, value) =>
											option.id === value.id
										}
										renderOption={(props, option) => {
											const quantity = locationStockById.get(option.id) ?? 0;
											const { key, ...optionProps } = props;

											return (
												<li key={key} {...optionProps}>
													{formatLocation(
														option.location_name,
														option.location_code,
													)}
													:&nbsp;
													<Box component="span" sx={{ fontWeight: "bold" }}>
														{formatAmount(quantity)}
													</Box>
												</li>
											);
										}}
										onChange={(event, newValue) => handleAddLocation(newValue)}
										inputValue={locationInputValue}
										onInputChange={(_event, newInputValue, reason) => {
											if (reason === "reset") return;
											setLocationInputValue(newInputValue);
										}}
										onClose={() => setLocationInputValue("")}
										value={null}
										slotProps={{
											paper: {
												sx: {
													bgcolor: "background.default",
													backgroundImage: "none",
												},
											},
										}}
										sx={{
											mt: 1,
										}}
										renderInput={(params) => (
											<TextField
												{...params}
												size="small"
												placeholder="+ Add Location"
												variant="standard"
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
			prev.onEditMaterial === next.onEditMaterial &&
			prev.hasOtherOrderType === next.hasOtherOrderType &&
			prev.style === next.style
		);
	},
);

export default OrderItemRow;
