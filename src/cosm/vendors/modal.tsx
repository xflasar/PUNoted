import React from "react";
import {
	Button,
	type ButtonProps,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
} from "@mui/material";

interface ModalProps {
	open: boolean;
	onClose: () => void;
	title: string;
	children: React.ReactNode;
	actionLabel?: string;
	onAction?: () => void;
	color?: ButtonProps["color"];
	cancelLabel?: string;
}

export const Modal: React.FC<ModalProps> = ({
	open,
	onClose,
	title,
	children,
	actionLabel,
	onAction,
	color = "primary",
	cancelLabel = "Cancel",
}) => (
	<Dialog
		open={open}
		onClose={onClose}
		maxWidth="sm"
		fullWidth
		slotProps={{
			paper: {
				sx: {
					borderRadius: 2,
					bgcolor: "background.default",
					backgroundImage: "none",
					padding: "1.6em",
				},
			},
		}}
	>
		<DialogTitle sx={{ fontWeight: "bold", padding: 0, marginBottom: "1em" }}>
			{title}
		</DialogTitle>
		<DialogContent sx={{ padding: 0 }}>{children}</DialogContent>
		<DialogActions sx={{ padding: 0, marginTop: "1.6em" }}>
			<Button
				onClick={onClose}
				variant="outlined"
				color="inherit"
				sx={{ fontWeight: "bold" }}
			>
				{cancelLabel}
			</Button>
			{onAction && actionLabel && (
				<Button
					onClick={onAction}
					variant="contained"
					color={color}
					sx={{ fontWeight: "bold" }}
				>
					{actionLabel}
				</Button>
			)}
		</DialogActions>
	</Dialog>
);
