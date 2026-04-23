// src/Dashboard/CX/components/StorageValuationTable.tsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
	Box,
	Typography,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Tooltip,
	InputBase,
	useTheme,
	alpha,
	FormControl,
	MenuItem,
	Select,
} from "@mui/material";
import { KeyboardArrowUp, KeyboardArrowDown } from "@mui/icons-material";
import { StorageValuationItem, type StorageValuation } from "../types";
import { formatCompactNumber } from "../helpers/formatNumber";
import { getStorageValuation } from "../api";
import {
	SectionGuide,
	getCurrencySymbol,
	GuideStep,
} from "../helpers/dashboardUtils";

export const StorageValuationTable = ({ exchange }: { exchange: string }) => {
	const theme = useTheme();
	const [items, setItems] = useState<StorageValuationItem[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	// Performance: Local state for target price input
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editValue, setEditValue] = useState("");

	const [targetPriceMap, setTargetPriceMap] = useState<Record<string, number>>(
		() => {
			try {
				return JSON.parse(
					localStorage.getItem("cx_storage_target_prices") || "{}",
				);
			} catch {
				return {};
			}
		},
	);

	// --- 1. SORTING STATE ---
	const [sortConfig, setSortConfig] = useState<{
		key: string | null;
		direction: "asc" | "desc" | null;
	}>({
		key: "totalValue", // Default sort by Value
		direction: "desc",
	});

	// --- 2. DATA ENRICHMENT (Add totalValue for sorting) ---
	const processedItems = useMemo(() => {
		return items.map((item) => ({
			...item,
			totalValue: item.amount * item.marketAsk,
		}));
	}, [items]);

	// --- 3. SORTING LOGIC (3-State Cycle) ---
	const sortedData = useMemo(() => {
		if (!sortConfig.key || !sortConfig.direction) return processedItems;

		return [...processedItems].sort((a, b) => {
			const aVal = (a as any)[sortConfig.key!];
			const bVal = (b as any)[sortConfig.key!];

			// String sort
			if (typeof aVal === "string") {
				return sortConfig.direction === "asc"
					? aVal.localeCompare(bVal)
					: bVal.localeCompare(aVal);
			}

			// Numeric sort
			if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
			if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
			return 0;
		});
	}, [processedItems, sortConfig]);

	const handleSort = (key: string) => {
		setSortConfig((prev) => {
			// Cycle: None -> Desc -> Asc -> None
			if (prev.key === key) {
				if (prev.direction === "desc") return { key, direction: "asc" };
				if (prev.direction === "asc") return { key: null, direction: null };
			}
			return { key, direction: "desc" };
		});
	};

	// --- 4. RENDER HELPERS ---
	const SortArrows = ({
		active,
		direction,
	}: {
		active: boolean;
		direction: "asc" | "desc" | null;
	}) => (
		<Box sx={{ display: "flex", flexDirection: "column", ml: 0.5 }}>
			<KeyboardArrowUp
				sx={{
					fontSize: 10,
					lineHeight: 1,
					color:
						active && direction === "asc" ? "primary.main" : "text.disabled",
					opacity: active && direction === "asc" ? 1 : 0.3,
				}}
			/>
			<KeyboardArrowDown
				sx={{
					fontSize: 10,
					lineHeight: 1,
					mt: "-2px",
					color:
						active && direction === "desc" ? "primary.main" : "text.disabled",
					opacity: active && direction === "desc" ? 1 : 0.3,
				}}
			/>
		</Box>
	);

	const HeaderCell = ({ label, sortKey, align = "left", tooltip }: any) => {
		const isActive = sortConfig.key === sortKey;
		return (
			<TableCell
				align={align}
				onClick={() => handleSort(sortKey)}
				sx={{
					cursor: "pointer",
					fontSize: "0.7rem",
					fontWeight: "bold",
					userSelect: "none",
				}}
			>
				<Box
					display="flex"
					alignItems="center"
					justifyContent={align === "right" ? "flex-end" : "flex-start"}
				>
					<Tooltip title={tooltip || label} arrow>
						<span style={{ borderBottom: "1px dotted" }}>{label}</span>
					</Tooltip>
					<SortArrows active={isActive} direction={sortConfig.direction} />
				</Box>
			</TableCell>
		);
	};

	const handleEditSave = (ticker: string) => {
		const val = parseFloat(editValue);
		setTargetPriceMap((prev) => {
			const next = { ...prev };
			if (!isNaN(val)) next[`${exchange}-${ticker}`] = val;
			else delete next[`${exchange}-${ticker}`];
			localStorage.setItem("cx_storage_target_prices", JSON.stringify(next));
			return next;
		});
		setEditingId(null);
	};

	const totalValue = useMemo(
		() => items.reduce((acc, i) => acc + i.amount * i.marketAsk, 0),
		[items],
	);
	const [selectedStorage, setSelectedStorage] = useState<StorageValuation>([]);
	const [storageLocations, setStorageLocations] = useState<StorageValuation[]>(
		[],
	);
	const [selectedStorageId, setSelectedStorageId] = useState<string>("");

	const handleStorageLocationChange = (e: any) => {
		const newId = e.target.value;
		setSelectedStorageId(newId);

		// Pass the new ID directly to your fetch function
		fetchData(newId);
	};

	const fetchData = useCallback(
		async (overrideId?: string) => {
			setIsLoading(true);
			try {
				// Use overrideId if provided (from dropdown), otherwise use current state
				const idToFetch =
					overrideId !== undefined ? overrideId : selectedStorageId;

				// Pass the ID to your API wrapper (handle undefined logic there)
				const data = await getStorageValuation(
					exchange,
					idToFetch || undefined,
				);

				setItems(data.items);
				setStorageLocations(data.storages || []);

				// If no ID is currently selected, select the first one returned by the API
				if (!idToFetch && data.storages && data.storages.length > 0) {
					// Find the one that matches the storageName returned or just the first one
					setSelectedStorageId(data.storages[0].storageid);
				}
			} catch {
				setItems([]);
			} finally {
				setIsLoading(false);
			}
		},
		[exchange, selectedStorageId],
	); // Add dependencies

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	return (
		<Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					p: 1,
					bgcolor: alpha(theme.palette.background.default, 0.3),
				}}
			>
				<Box display="flex" alignItems="center">
					<Typography variant="caption" fontWeight="bold">
						STORAGE VALUATION
					</Typography>
					<FormControl size="small" sx={{ ml: 2,minWidth: 120 }}>
						<Select
							// Control by ID
							value={selectedStorageId}
							onChange={handleStorageLocationChange}
							variant="outlined"
							displayEmpty // Allows showing a placeholder if needed
							sx={{
								height: 32,
								fontSize: "0.8rem",
								bgcolor: alpha(theme.palette.background.default, 0.5),
								borderRadius: 1,
								"& .MuiOutlinedInput-notchedOutline": {
									borderColor: alpha(theme.palette.divider, 0.2),
								},
							}}
						>
							{/* Map through options */}
							{storageLocations.map((s) => (
								<MenuItem key={s.storageid} value={s.storageid}>
									{s.storagelocation}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				</Box>
				<Tooltip
					title={`Total value of storage: ${totalValue.toLocaleString()} ICA`}
					arrow
				>
					<Typography
						variant="caption"
						sx={{ borderBottom: "1px dotted", cursor: "help" }}
						color="primary.light"
						fontWeight="bold"
					>
						{formatCompactNumber(totalValue, true, getCurrencySymbol(exchange))}
					</Typography>
				</Tooltip>
			</Box>

			<TableContainer sx={{ flex: 1, overflowY: "auto" }}>
				<Table stickyHeader size="small">
					<TableHead>
						<TableRow>
							<HeaderCell label="TICKER" sortKey="ticker" tooltip="Item Code" />
                            <HeaderCell label="AMT" sortKey="amount" />
							<TableCell
								align="right"
								sx={{ cursor: "help", fontSize: "0.7rem", fontWeight: "bold" }}
							>
								<Tooltip title="Target price for sell">
									<span style={{ borderBottom: "1px dotted" }}>TARGET</span>
								</Tooltip>
							</TableCell>
							<HeaderCell
								label="MKT ASK"
								sortKey="marketAsk"
								align="right"
								tooltip="Current lowest market sell price"
							/>
							<HeaderCell
								label={`VALUE (${getCurrencySymbol(exchange)})`}
								sortKey="totalValue"
								align="right"
								tooltip="Total value of storage"
							/>
						</TableRow>
					</TableHead>
					<TableBody>
						{sortedData.map((row) => {
							const target = targetPriceMap[`${exchange}-${row.ticker}`] || 0;
							const isGoodToSell = target > 0 && row.marketAsk >= target;
							return (
								<TableRow
									key={row.ticker}
									sx={{
										bgcolor: isGoodToSell
											? alpha(theme.palette.success.main, 0.1)
											: "transparent",
									}}
								>
									<TableCell>
										<Typography variant="caption" fontWeight="600">
											{row.ticker}
										</Typography>
									</TableCell>

                                    <TableCell>
                                        <Typography variant="caption" fontWeight="600">{row.amount}</Typography>
                                    </TableCell>

									{/* Editable Target (Not Sortable via Header) */}
									<TableCell
										align="right"
										onClick={() => {
											setEditingId(row.ticker);
											setEditValue(target ? target.toString() : "");
										}}
									>
										{editingId === row.ticker ? (
											<InputBase
												autoFocus
												value={editValue}
												onChange={(e) => setEditValue(e.target.value)}
												onBlur={() => handleEditSave(row.ticker)}
												onKeyDown={(e) =>
													e.key === "Enter" && handleEditSave(row.ticker)
												}
												sx={{
													fontSize: "0.75rem",
													width: 50,
													border: "1px solid grey",
													borderRadius: 0.5,
													px: 0.5,
													textAlign: "right",
												}}
											/>
										) : (
											<Typography
												variant="caption"
												sx={{
													cursor: "pointer",
													"&:hover": { color: "primary.main" },
												}}
											>
												{target || "-"}
											</Typography>
										)}
									</TableCell>

									<TableCell
										align="right"
										sx={{
											fontWeight: isGoodToSell ? "bold" : "normal",
											color: isGoodToSell ? "success.main" : "text.primary",
										}}
									>
										{row.marketAsk.toLocaleString()}
									</TableCell>
									<TableCell align="right" sx={{ cursor: "help" }}>
										<Tooltip
											title={`${row.totalValue.toLocaleString()} ${getCurrencySymbol(exchange)}`}
											arrow
										>
											<span style={{ borderBottom: "1px dotted" }}>
												{formatCompactNumber(row.totalValue)}
											</span>
										</Tooltip>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</TableContainer>
		</Box>
	);
};
