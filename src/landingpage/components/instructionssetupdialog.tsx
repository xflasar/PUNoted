import React from "react";
import {
	Box,
	Dialog,
	DialogTitle,
	Typography,
	DialogContent,
	DialogActions,
	Button,
	Link,
	useTheme,
	alpha,
} from "@mui/material";

interface InstructionsSetupDialogProps {
	open: boolean;
	setShowInstructionsDialog: React.Dispatch<React.SetStateAction<boolean>>;
	targetExtensionUrl: string;
	setTargetExtensionUrl: React.Dispatch<React.SetStateAction<string>>;
}

export const InstructionsSetupDialog: React.FC<
	InstructionsSetupDialogProps
> = ({
	open,
	setShowInstructionsDialog,
	targetExtensionUrl,
	setTargetExtensionUrl,
}) => {
	const theme = useTheme();

	return (
		<Dialog
			open={open}
			onClose={() => setShowInstructionsDialog(false)}
			maxWidth="sm"
			fullWidth
			slotProps={{
				paper: {
					sx: {
						background: theme.palette.background.paper,
						border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
						borderRadius: 3,
						boxShadow: `0 0 50px ${alpha(theme.palette.primary.main, 0.2)}`,
						color: theme.palette.text.primary,
						overflow: "hidden",
					},
				},
			}}
		>
			<DialogTitle
				sx={{
					background: theme.palette.background.default,
					color: theme.palette.text.primary,
					textAlign: "center",
					py: 2.5,
					px: 3,
					borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
				}}
			>
				<Typography
					variant="h6"
					sx={{
						fontSize: "1.4rem",
						fontWeight: "bold",
						color: theme.palette.primary.main,
						letterSpacing: "0.02em",
					}}
				>
					Extension Setup Instructions
				</Typography>
			</DialogTitle>

			<DialogContent
				dividers
				sx={{
					background: theme.palette.background.paper,
					color: theme.palette.text.primary,
					borderColor: alpha(theme.palette.primary.main, 0.2),
					p: 3,
				}}
			>
				<Typography
					variant="subtitle1"
					sx={{
						textAlign: "center",
						fontWeight: "bold",
						color: theme.palette.error.main,
						mb: 2,
					}}
				>
					⚠️ Please Read Before Installing!
				</Typography>

				<Typography
					variant="body2"
					sx={{
						color: theme.palette.text.secondary,
						mb: 2.5,
						lineHeight: 1.6,
					}}
				>
					To ensure the{" "}
					<b style={{ color: theme.palette.text.primary }}>
						PUNoted Data Forwarder
					</b>{" "}
					extension securely captures your in-game APEX dashboard data, please
					follow these steps:
				</Typography>

				<Box
					component="ol"
					sx={{
						pl: 2.5,
						mt: 1,
						mb: 3,
						fontSize: "0.875rem",
						color: theme.palette.text.primary,
						display: "flex",
						flexDirection: "column",
						gap: 1.2,
					}}
				>
					<Box component="li">Add the extension from your browser's store.</Box>
					<Box component="li">
						<b style={{ color: theme.palette.text.primary }}>
							Register an account:
						</b>{" "}
						Create a PUNoted account on this website using the "Account" button.
					</Box>
					<Box component="li">
						Open the{" "}
						<b style={{ color: theme.palette.text.primary }}>
							PUNoted Data Forwarder
						</b>{" "}
						from your browser's extension list and log in with your PUNoted
						details.
					</Box>
					<Box component="li">
						Navigate to your active in-game character tab on{" "}
						<b>
							<Link
								href="https://apex.prosperousuniverse.com"
								sx={{
									color: theme.palette.primary.main,
									textDecoration: "none",
									"&:hover": { textDecoration: "underline" },
								}}
							>
								apex.prosperousuniverse.com
							</Link>
						</b>{" "}
						and refresh (F5).
					</Box>
					<Box component="li">
						<b style={{ color: theme.palette.text.primary }}>
							Keep the tab open:
						</b>{" "}
						Keep the game tab open (even in the background) for the extension to
						continuously capture and forward metrics.
					</Box>
				</Box>

				<Box
					sx={{
						p: 2,
						borderRadius: 2,
						background: alpha(theme.palette.warning.main, 0.08),
						border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
					}}
				>
					<Typography
						variant="body2"
						sx={{
							color: theme.palette.warning.main,
							fontWeight: 500,
							fontSize: "0.8rem",
							lineHeight: 1.5,
						}}
					>
						Note for Firefox users: You may need to right-click the extension
						icon in the toolbar and select "Always Allow on
						apex.prosperousuniverse.com ".
					</Typography>
				</Box>
			</DialogContent>

			<DialogActions
				sx={{
					background: theme.palette.background.default,
					borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
					px: 3,
					py: 2,
					gap: 1.5,
				}}
			>
				<Button
					onClick={() => setShowInstructionsDialog(false)}
					sx={{
						color: theme.palette.text.secondary,
						border: `1px solid ${theme.palette.divider}`,
						borderRadius: 2,
						textTransform: "none",
						px: 2.5,
						py: 0.8,
						"&:hover": {
							color: theme.palette.text.primary,
							borderColor: alpha(theme.palette.text.primary, 0.3),
							bgcolor: theme.palette.action.hover,
						},
					}}
				>
					Cancel
				</Button>
				<Button
					onClick={() => {
						if (targetExtensionUrl) {
							window.open(targetExtensionUrl, "_blank");
							setTargetExtensionUrl("");
						}
						setShowInstructionsDialog(false);
					}}
					variant="contained"
					sx={{
						bgcolor: theme.palette.primary.main,
						color:
							theme.palette.primary.contrastText || theme.palette.common.white,
						fontWeight: "bold",
						borderRadius: 2,
						textTransform: "none",
						px: 3,
						py: 0.8,
						boxShadow: `0 0 15px ${alpha(theme.palette.primary.main, 0.4)}`,
						"&:hover": {
							bgcolor: theme.palette.primary.dark || theme.palette.primary.main,
							boxShadow: `0 0 25px ${alpha(theme.palette.primary.main, 0.6)}`,
						},
					}}
				>
					Proceed to Store
				</Button>
			</DialogActions>
		</Dialog>
	);
};
