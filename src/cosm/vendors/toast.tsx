import React from "react";
import { createPortal } from "react-dom";
import { Alert, type ButtonProps, Snackbar } from "@mui/material";

interface ToastProps {
	open: boolean;
	onClose: () => void;
	message: React.ReactNode;
	color?: ButtonProps["color"];
	duration?: number | null;
}

export const Toast: React.FC<ToastProps> = ({
	open,
	onClose,
	message,
	color = "primary",
	duration = 3000,
}) =>
	createPortal(
		<Snackbar
			open={open}
			autoHideDuration={duration}
			anchorOrigin={{ vertical: "top", horizontal: "right" }}
			onClose={onClose}
			sx={{ zIndex: (theme) => theme.zIndex.modal + 2 }}
		>
			<Alert
				onClose={onClose}
				severity={color === "success" || color === "error" ? color : "info"}
				icon={color === "primary" ? false : undefined}
				variant="filled"
				sx={{
					bgcolor: `${color}.main`,
					color: `${color}.contrastText`,
				}}
			>
				{message}
			</Alert>
		</Snackbar>,
		document.body,
	);
