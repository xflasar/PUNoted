import React, { useState } from "react";
import {
	Box,
	Typography,
	IconButton,
	Snackbar,
	Alert,
	useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/system";
import { FaTimes } from "react-icons/fa";

import { BackgroundBox, ContentContainer, AuthPanel } from "./styles";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

interface AuthenticationBoxProps {
	onLoginSuccess: () => void;
	onBackToLanding: () => void;
}

const AuthenticationBox: React.FC<AuthenticationBoxProps> = ({
	onLoginSuccess,
	onBackToLanding,
}) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

	// Main UI State
	const [authFlow, setAuthFlow] = useState<
		"login" | "register" | "forgotPassword"
	>("login");
	const [isLoading, setIsLoading] = useState(false);
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		severity: "success" | "error" | "info" | "warning";
	}>({ open: false, message: "", severity: "info" });

	const openSnackbar = (
		message: string,
		severity: "success" | "error" | "info" | "warning" = "info",
	) => {
		setSnackbar({ open: true, message, severity });
	};

	const headerText =
		authFlow === "login"
			? "Login"
			: authFlow === "register"
				? "Register"
				: "Forgot Password";

	return (
		<>
			<BackgroundBox>
				<ContentContainer>
					<AuthPanel>
						{/* Header row */}
						<Box
							sx={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
							}}
						>
							<Typography
								variant={isMobile ? "h5" : "h4"}
								sx={{ fontWeight: 700 }}
							>
								{headerText}
							</Typography>
							<IconButton
								aria-label="close"
								onClick={onBackToLanding}
								sx={{ color: "rgba(255,255,255,0.6)" }}
							>
								<FaTimes />
							</IconButton>
						</Box>

						{/* Sub-Components handle their own internal data/api logic */}
						{authFlow === "login" && (
							<LoginForm
								isLoading={isLoading}
								setIsLoading={setIsLoading}
								openSnackbar={openSnackbar}
								onLoginSuccess={onLoginSuccess}
								switchToRegister={() => setAuthFlow("register")}
								switchToForgot={() => setAuthFlow("forgotPassword")}
							/>
						)}

						{authFlow === "register" && (
							<RegisterForm
								isLoading={isLoading}
								setIsLoading={setIsLoading}
								openSnackbar={openSnackbar}
								switchToLogin={() => setAuthFlow("login")}
							/>
						)}

						{authFlow === "forgotPassword" && (
							<ForgotPasswordForm
								isLoading={isLoading}
								setIsLoading={setIsLoading}
								openSnackbar={openSnackbar}
								switchToLogin={() => setAuthFlow("login")}
							/>
						)}
					</AuthPanel>
				</ContentContainer>
			</BackgroundBox>

			{/* Global Snackbar for the Auth Modal */}
			<Snackbar
				open={snackbar.open}
				autoHideDuration={3000}
				onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
				anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
			>
				<Alert severity={snackbar.severity} sx={{ width: "100%" }}>
					{snackbar.message}
				</Alert>
			</Snackbar>
		</>
	);
};

export default AuthenticationBox;
