import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
	Box,
	Typography,
	Button,
	CircularProgress,
	useTheme,
	Paper,
} from "@mui/material";
import { API_BASE_URL } from "../../config/api";
import { DeleteIcon } from "lucide-react";
import AvailableMaterialsList from "./components/availablematerialslist";
import MaterialTable from "./components/materialtable";
import { Modal } from "./modal";

import { useVendorStoreManager } from "./hooks/usevendorstoremanager";
import { useAvailableMaterials } from "./hooks/useavailablematerials";

import type { Location, OrderItem, VendorStore } from "./types";

/**
 * Props for the EditVendorStoreModal component.
 */
interface EditVendorStoreModalProps {
	/** State setter for the currently selected vendor store */
	/** The vendor store being edited */
	vendorStore: VendorStore | null;
	/** Callback fired when a store is successfully deleted */
	onStoreDeleted: (vendorId: string) => void;
	/** Callback fired when the vendor details or orders are updated */
	onVendorChanged: (vendorStore: VendorStore) => void;
}

/**
 * Modal component to edit the details and orders of an existing vendor store.
 *
 * @param {EditVendorStoreModalProps} props - The component props.
 * @returns {React.ReactElement} The rendered modal.
 */
const EditVendorStoreModal: React.FC<EditVendorStoreModalProps> = ({
	vendorStore,
	onStoreDeleted,
	onVendorChanged,
}) => {
	const theme = useTheme();

	const [isSaving, setIsSaving] = useState<boolean>(false);
	const [isDeleting, setIsDeleting] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
	const [locations, setLocations] = useState<Location[]>([]);

	// Custom hook to manage form state and orders for the vendor store
	const {
		localVendorDetails,
		buyOrders,
		sellOrders,
		allOrders,
		ordersToDelete,
		handleAddMaterial,
		handleEditMaterial,
		handleRemoveMaterial,
		setOrdersToDelete,
		reset,
		hydrateAvailableMaterials,
		normalizeVendorStore,
	} = useVendorStoreManager(vendorStore);

	// Custom hook to fetch available materials based on current CX
	const { materials } = useAvailableMaterials(localVendorDetails.cx, true);

	useEffect(() => {
		if (materials.length === 0) return;
		hydrateAvailableMaterials(materials);
	}, [materials, hydrateAvailableMaterials]);

	/**
	 * Fetches the available locations when the modal opens.
	 */
	useEffect(() => {
		let isMounted = true;

		const fetchLocations = async () => {
			try {
				const response = await fetch(
					`${API_BASE_URL}internal/vendor/locations_list`,
					{
						method: "GET",
						headers: {
							Authorization: `Bearer ${localStorage.getItem("authToken")}`,
						},
					},
				);

				const result = await response.json();
				if (!response.ok || !result.success) {
					throw new Error(result.message || "Failed to fetch locations.");
				}

				if (isMounted) {
					setLocations(result.locations);
				}
			} catch (err) {
				console.error(
					`Failed to fetch locations. ${err instanceof Error ? err.message : ""}`,
				);
			}
		};

		fetchLocations();

		return () => {
			isMounted = false;
		};
	}, []);

	const isDirty = useMemo(() => {
		if (!vendorStore) return false;

		const comparableState = (
			details: typeof localVendorDetails,
			orders: OrderItem[],
			deleted: string[] = [],
		) =>
			JSON.stringify({
				details,
				orders: orders
					.map((order) => ({
						orderid: order.orderid || null,
						materialticker: order.materialticker,
						ordertype: order.ordertype,
						fixedprice: order.isPriceLocked ? -1 : order.price?.fixedprice,
						materialid: order.materialid,
						reserved: order.reserved,
						location: (order.locations || order.location || []).map(
							(location) => ({ id: location.id, amount: location.amount }),
						),
					}))
					.sort((a, b) =>
						`${a.orderid}:${a.materialticker}:${a.ordertype}`.localeCompare(
							`${b.orderid}:${b.materialticker}:${b.ordertype}`,
						),
					),
				deleted: [...deleted].sort(),
			});

		return (
			comparableState(localVendorDetails, allOrders, ordersToDelete) !==
			comparableState(
				{
					companyName: vendorStore.vendor.companyname || "",
					gameName: vendorStore.vendor.gamename || "",
					companyCode: vendorStore.vendor.companycode || "",
					corpName: vendorStore.vendor.corpname || "",
					cx: vendorStore.vendor.cx || "IC1",
				},
				vendorStore.orders,
			)
		);
	}, [allOrders, localVendorDetails, ordersToDelete, vendorStore]);

	/**
	 * Saves the modified vendor details and orders to the backend.
	 */
	const handleSave = useCallback(async () => {
		if (!vendorStore) return;
		setIsSaving(true);
		setError(null);

		const payload = {
			vendorid: vendorStore.vendor.vendorid,
			vendor_to_update: localVendorDetails,
			orders_to_update: allOrders.map((order) => ({
				orderid: order.orderid ? order.orderid : undefined,
				materialticker: order.materialticker,
				ordertype: order.ordertype,
				fixedprice: order.isPriceLocked ? -1 : order.price.fixedprice,
				materialid: order.materialid,
				reserved: order.reserved,
				location: order.locations.map((loc) => ({
					id: loc.id,
					amount: loc.amount,
				})),
			})),
			order_ids_to_delete: ordersToDelete,
		};

		try {
			const response = await fetch(`${API_BASE_URL}vendor_stores/edit_orders`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("authToken")}`,
				},
				body: JSON.stringify(payload),
			});
			const result = await response.json();

			if (!response.ok || !result.success) {
				throw new Error(result.message || "Failed to save changes.");
			}

			if (!result.vendor_store) {
				throw new Error("Save response missing updated store.");
			}

			onVendorChanged(normalizeVendorStore(result.vendor_store));
		} catch (err) {
			setError(
				`Failed to save changes. ${err instanceof Error ? err.message : ""}`,
			);
		} finally {
			setIsSaving(false);
			setOrdersToDelete([]);
		}
	}, [
		vendorStore,
		localVendorDetails,
		allOrders,
		ordersToDelete,
		onVendorChanged,
		setOrdersToDelete,
		normalizeVendorStore,
	]);

	/**
	 * Confirms and deletes the vendor store permanently.
	 */
	const handleDeleteVendorStore = useCallback(async () => {
		if (!vendorStore) return;

		setDeleteConfirmOpen(false);
		setIsDeleting(true);
		setError(null);

		try {
			const response = await fetch(
				`${API_BASE_URL}vendor_stores/${vendorStore.vendor.vendorid}`,
				{
					method: "DELETE",
					headers: {
						Authorization: `Bearer ${localStorage.getItem("authToken")}`,
					},
				},
			);

			if (!response.ok) {
				const errorResult = await response.json();
				throw new Error(errorResult.message || "Failed to delete store.");
			}

			onStoreDeleted(vendorStore.vendor.vendorid);
		} catch (err) {
			setError(
				`Failed to delete store. ${err instanceof Error ? err.message : ""}`,
			);
		} finally {
			setIsDeleting(false);
		}
	}, [vendorStore, onStoreDeleted]);

	return (
		<>
			<Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
				<Box
					sx={{
						p: 0,
						m: 1,
						display: "flex",
						flexDirection: "column",
						flex: 1,
						minHeight: 0,
						overflow: "hidden",
						gap: 1,
						zIndex: 2,
						background: "transparent",
					}}
				>
					{/* Middle: Buy & Sell Orders */}
					<Box
						sx={{
							flex: 1,
							display: "flex",
							flexDirection: { xs: "column", sm: "row" },
							gap: { xs: 0, sm: 1 },
							px: { xs: 0, sm: 1 },
							minHeight: 0,
							justifyContent: { xs: "auto", sm: "center" },
							overflowY: "auto",
						}}
					>
						<Box
							sx={{
								display: "flex",
								flexDirection: "column",
								gap: 1,
								width: { xs: "100%", sm: "auto", md: "50%" },
								px: 1,
								pb: 1,
							}}
						>
							{/* Sell Orders */}
							<Paper
								sx={{
									flex: 1,
									display: "flex",
									flexDirection: "column",
									background: theme.palette.background.paper,
									overflow: "hidden",
									border: `1px solid ${theme.palette.divider}`,
									borderRadius: 2,
								}}
							>
								<MaterialTable
									title="Ask Orders"
									materials={sellOrders}
									allOrders={allOrders}
									locations={locations}
									availableMaterialsList={materials}
									onAddMaterial={handleAddMaterial}
									onEditMaterial={handleEditMaterial}
									onRemoveMaterial={handleRemoveMaterial}
									isBuyOrders={false}
								/>
							</Paper>

							{/* Buy Orders */}
							<Paper
								sx={{
									flex: 1,
									display: "flex",
									flexDirection: "column",
									background: theme.palette.background.paper,
									overflow: "hidden",
									border: `1px solid ${theme.palette.divider}`,
									borderRadius: 2,
								}}
							>
								<MaterialTable
									title="Bid Orders"
									materials={buyOrders}
									allOrders={allOrders}
									locations={locations}
									availableMaterialsList={materials}
									onAddMaterial={handleAddMaterial}
									onEditMaterial={handleEditMaterial}
									onRemoveMaterial={handleRemoveMaterial}
									isBuyOrders={true}
								/>
							</Paper>
						</Box>

						{/* Bottom: Available Materials */}
						<Box
							sx={{
								px: 1,
								pb: 1,
								display: "flex",
								flexDirection: "column",
							}}
						>
							<Paper
								sx={{
									flex: 1,
									display: "flex",
									flexDirection: "column",
									background: theme.palette.background.paper,
									overflow: "hidden",
									border: `1px solid ${theme.palette.divider}`,
									borderRadius: 2,
								}}
							>
								<AvailableMaterialsList
									materials={materials}
									allOrders={allOrders}
									onAddMaterial={handleAddMaterial}
								/>
							</Paper>
						</Box>
					</Box>
				</Box>

				{/* 3. FOOTER */}
				<Box
					sx={{
						p: 1.5,
						borderTop: `1px solid ${theme.palette.divider}`,
						background: theme.palette.background.paper,
						flexShrink: 0,
						zIndex: 2,
						position: "relative",
						display: "flex",
						flexDirection: "row",
						justifyContent: "center",
						alignItems: "center",
						gap: 1,
					}}
				>
					{error && (
						<Typography
							variant="body2"
							color="error"
							sx={{
								position: "absolute",
								left: 0,
								right: 0,
								textAlign: "center",
								px: 2,
							}}
						>
							{error}
						</Typography>
					)}
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							gap: 1,
							width: "100%",
						}}
					>
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							<Button
								variant="outlined"
								color="error"
								size="small"
								onClick={() => setDeleteConfirmOpen(true)}
								disabled={isSaving || isDeleting}
								startIcon={
									isDeleting ? (
										<CircularProgress className="inline-icon" color="inherit" />
									) : (
										<DeleteIcon className="inline-icon" />
									)
								}
								sx={{ height: "40px", whiteSpace: "nowrap", minWidth: 120 }}
							>
								Delete Store
							</Button>
						</Box>
						<Box sx={{ display: "flex", alignItems: "center", gap: 5 }}>
							<Button
								onClick={reset}
								disabled={!isDirty || isSaving || isDeleting}
								color="inherit"
							>
								DISCARD
							</Button>
							<Button
								onClick={handleSave}
								variant="contained"
								disabled={!isDirty || isSaving || isDeleting}
							>
								{isSaving ? (
									<CircularProgress className="inline-icon" color="inherit" />
								) : (
									"SAVE"
								)}
							</Button>
						</Box>
					</Box>
				</Box>
			</Box>

			<Modal
				open={deleteConfirmOpen}
				onClose={() => setDeleteConfirmOpen(false)}
				title="Delete Store?"
				actionLabel="Delete"
				onAction={handleDeleteVendorStore}
				color="error"
			>
				<Typography>
					You can create a new store later but existing orders will be deleted.
				</Typography>
			</Modal>
		</>
	);
};

export default EditVendorStoreModal;
