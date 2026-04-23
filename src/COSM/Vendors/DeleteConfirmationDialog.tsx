import React from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Typography,
	Button,
} from "@mui/material";

/**
 * Props for the DeleteConfirmationDialog component.
 */
interface DeleteConfirmationDialogProps {
	/** Indicates if the dialog is open */
	open: boolean;
	/** Callback fired when the dialog requests to be closed */
	onClose: () => void;
	/** Callback fired when the user confirms the deletion */
	onConfirm: () => void;
	/** The name of the vendor being deleted, displayed in the confirmation message */
	vendorName: string;
}

/**
 * A dialog component that prompts the user to confirm the deletion of a vendor store.
 *
 * @param {DeleteConfirmationDialogProps} props - The component props.
 * @returns {React.ReactElement} The rendered dialog component.
 */
export const DeleteConfirmationDialog: React.FC<
	DeleteConfirmationDialogProps
> = ({ open, onClose, onConfirm, vendorName }) => {
	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="sm"
			fullWidth
			PaperProps={{ sx: { borderRadius: 2 } }}
		>
			<DialogTitle sx={{ color: "error.main" }}>Confirm Deletion</DialogTitle>
			<DialogContent>
				<Typography>
					Are you sure you want to permanently delete the vendor store for **
					{vendorName}**? This action cannot be undone.
				</Typography>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} color="inherit">
					Cancel
				</Button>
				<Button onClick={onConfirm} variant="contained" color="error">
					Delete Permanently
				</Button>
			</DialogActions>
		</Dialog>
	);
};
