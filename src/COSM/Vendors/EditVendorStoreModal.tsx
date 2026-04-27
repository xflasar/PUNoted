import React, { useState, useEffect, useCallback } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Box,
	Typography,
	Button,
	CircularProgress,
	IconButton,
	useTheme,
	Paper,
} from "@mui/material";
import { DeleteIcon, PlusCircle, X } from "lucide-react";
import AvailableMaterialsList from "./components/AvailableMaterialsList";
import MaterialTable from "./components/MaterialTable";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";

import { useVendorStoreManager } from "./hooks/useVendorStoreManager";
import { useAvailableMaterials } from "./hooks/useAvailableMaterials";

import type { Location, VendorStore } from "./types";

/**
 * Props for the EditVendorStoreModal component.
 */
interface EditVendorStoreModalProps {
	/** Indicates if the modal is open */
	open: boolean;
	/** Callback to close the modal */
	handleClose: () => void;
	/** State setter for the currently selected vendor store */
	setVendorStore: React.Dispatch<React.SetStateAction<VendorStore | null>>;
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
	open,
	handleClose,
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
		setStoreInstoreAmounts,
	} = useVendorStoreManager(vendorStore);

	// Custom hook to fetch available materials based on current CX
	const { materials } = useAvailableMaterials(
		localVendorDetails.cx,
		open,
		setStoreInstoreAmounts,
	);

	/**
	 * Fetches the available locations when the modal opens.
	 */
	useEffect(() => {
		if (!open) return;

		let isMounted = true;

		const fetchLocations = async () => {
			try {
				const response = await fetch(
					"https://api.punoted.net/vendor/locations_list",
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
	}, [open]);

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
				fixedprice: order.price.fixedprice,
				materialid: order.materialid,
				reserved: order.reserved,
				location: order.location.map((loc) => ({
					id: loc.id,
					amount: loc.amount,
				})),
			})),
			order_ids_to_delete: ordersToDelete,
		};

		try {
			const response = await fetch(
				`https://api.punoted.net/vendor_stores/edit_orders`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${localStorage.getItem("authToken")}`,
					},
					body: JSON.stringify(payload),
				},
			);
			const result = await response.json();

			if (!response.ok || !result.success) {
				throw new Error(result.message || "Failed to save changes.");
			}

			onVendorChanged(result.vendor_store);
			handleClose();
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
		handleClose,
		setOrdersToDelete,
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
				`https://api.punoted.net/vendor_stores/${vendorStore.vendor.vendorid}`,
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
			handleClose();
		} catch (err) {
			setError(
				`Failed to delete store. ${err instanceof Error ? err.message : ""}`,
			);
		} finally {
			setIsDeleting(false);
		}
	}, [vendorStore, onStoreDeleted, handleClose]);

	return (
		<>
			<Dialog
				open={open}
				onClose={handleClose}
				maxWidth={false}
				fullScreen
				slotProps={{
					paper: {
						sx: { display: "flex", flexDirection: "column" },
					},
				}}
			>
				<Box
					sx={{
						position: "absolute",
						width: "100%",
						height: "100%",
						background: "rgba(0,0,0,0.8)",
						backdropFilter: "blur(1px)",
						WebkitBackdropFilter: "blur(1px)",
					}}
				/>

				{/* 1. HEADER */}
				<DialogTitle
					sx={{
						p: 1.5,
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						borderBottom: `1px solid ${theme.palette.divider}`,
						flexShrink: 0,
						zIndex: 2,
						background: theme.palette.background.default,
					}}
				>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<PlusCircle />
						<Typography variant="h6">Edit Vendor Store</Typography>
					</Box>
					<IconButton onClick={handleClose}>
						<X size={20} />
					</IconButton>
				</DialogTitle>

				{/* 2. CONTENT */}
				<DialogContent
					sx={{
						p: 0,
						m: 1,
						display: "flex",
						flexDirection: "column",
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
								width: { xs: "100%", sm: "auto" },
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
									background: theme.palette.background.default,
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
									background: theme.palette.background.default,
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
									background: theme.palette.background.default,
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
				</DialogContent>

				{/* 3. FOOTER */}
				<DialogActions
					sx={{
						p: 1.5,
						borderTop: `1px solid ${theme.palette.divider}`,
						background: theme.palette.background.default,
						flexShrink: 0,
						zIndex: 2,
					}}
				>
					{error && (
						<Typography
							variant="body2"
							color="error"
							sx={{ mr: "auto", px: 2 }}
						>
							{error}
						</Typography>
					)}
					<Box sx={{ flexGrow: 1 }}>
						<Button
							fullWidth
							variant="outlined"
							color="error"
							size="small"
							onClick={handleDeleteVendorStore}
							disabled={isSaving || isDeleting}
							startIcon={
								isDeleting ? (
									<CircularProgress size={16} color="inherit" />
								) : (
									<DeleteIcon fontSize="small" />
								)
							}
							sx={{ height: "40px", whiteSpace: "nowrap" }}
						>
							Delete Store
						</Button>
					</Box>

					<Button
						onClick={handleClose}
						disabled={isSaving || isDeleting}
						color="inherit"
					>
						Cancel
					</Button>
					<Button
						onClick={handleSave}
						variant="contained"
						disabled={isSaving || isDeleting}
					>
						{isSaving ? (
							<CircularProgress size={20} color="inherit" />
						) : (
							"Save Changes"
						)}
					</Button>
				</DialogActions>
			</Dialog>

			<DeleteConfirmationDialog
				open={deleteConfirmOpen}
				onClose={() => setDeleteConfirmOpen(false)}
				onConfirm={handleDeleteVendorStore}
				vendorName={vendorStore?.vendor.companyname || "this store"}
			/>
		</>
	);
};

export default EditVendorStoreModal;
