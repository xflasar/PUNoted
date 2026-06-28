import React, { useState } from "react";
import {
	Box,
	Button,
	Typography,
	TextField,
	CircularProgress,
	useMediaQuery,
	IconButton,
	InputAdornment,
	Snackbar,
	Alert,
	AlertTitle,
} from "@mui/material";
import { styled, useTheme } from "@mui/system";
import { API_BASE_URL } from "../config/api";
import {
	FaUserPlus,
	FaSignInAlt,
	FaEnvelopeOpenText,
	FaCheckCircle,
	FaLock,
	FaTimes,
	FaEye,
	FaEyeSlash,
} from "react-icons/fa";

interface AuthenticationBoxProps {
	onLoginSuccess: () => void;
	onBackToLanding: () => void;
}

const BackgroundBox = styled(Box)(({ theme }) => ({
	width: "100vw",
	minHeight: "100vh",
	display: "flex",
	justifyContent: "center",
	alignItems: "center",
	textAlign: "center",
	color: theme.palette.common.white,
	background:
		"radial-gradient(at 50% 0%, rgba(20,20,40,0.8) 0%, rgba(10,10,20,0.9) 70%, rgba(0,0,0,1) 100%)",
	position: "fixed",
	top: 0,
	left: 0,
	zIndex: 99,
}));

const ContentContainer = styled(Box)(({ theme }) => ({
	width: "100%",
	maxWidth: 760,
	padding: theme.spacing(6),
	display: "flex",
	justifyContent: "center",
	[theme.breakpoints.down("sm")]: {
		padding: theme.spacing(3),
		minHeight: "100vh",
		alignItems: "center",
	},
}));

/* Subtle panel + autofill safety */
const AuthPanel = styled(Box)(({ theme }) => ({
	width: "100%",
	maxWidth: 560,
	padding: theme.spacing(4),
	borderRadius: 12,
	background: "rgba(255,255,255,0.02)",
	border: "1px solid rgba(255,255,255,0.06)",
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(2),
	position: "relative",

	"& .MuiOutlinedInput-input:-webkit-autofill": {
		WebkitBoxShadow: "0 0 0 1000px rgba(255,255,255,0.02) inset !important",
		WebkitTextFillColor: "white !important",
	},
	"& input:-webkit-autofill, textarea:-webkit-autofill": {
		WebkitBoxShadow: "0 0 0 1000px rgba(255,255,255,0.02) inset !important",
		WebkitTextFillColor: "white !important",
	},
	"& .MuiOutlinedInput-input:-webkit-autofill:focus": {
		WebkitBoxShadow: "0 0 0 1000px rgba(255,255,255,0.02) inset !important",
		WebkitTextFillColor: "white !important",
	},
}));

const PrimaryButton = styled(Button)(() => ({
	backgroundColor: "#7b68ee",
	color: "#fff",
	"&:hover": { backgroundColor: "#6a5acd" },
	textTransform: "none",
}));

const LinkButton = styled(Button)(() => ({
	color: "#aaa",
	textTransform: "none",
}));

const AuthenticationBox: React.FC<AuthenticationBoxProps> = ({
	onLoginSuccess,
	onBackToLanding,
}) => {
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [newPassword, setNewPassword] = useState("");
	const [confirmNewPassword, setConfirmNewPassword] = useState("");
	const [verificationCode, setVerificationCode] = useState("");
	const [registrationStep, setRegistrationStep] = useState<
		"form" | "verification"
	>("form");
	const [authFlow, setAuthFlow] = useState<
		"login" | "register" | "forgotPassword"
	>("login");
	const [forgotPasswordStep, setForgotPasswordStep] = useState<
		"email" | "code" | "newPassword"
	>("email");
	const [isLoading, setIsLoading] = useState(false);
	//const [serverCode, setServerCode] = useState("");

	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		severity: "success" | "error" | "info" | "warning";
	}>({
		open: false,
		message: "",
		severity: "info",
	});

	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

	const openSnackbar = (
		message: string,
		severity: "success" | "error" | "info" | "warning" = "info",
	) => {
		setSnackbar({ open: true, message, severity });
	};

	const handleCloseSnackbar = (event?: React.SyntheticEvent | Event) => {
		if (event?.type === "") return;
		setSnackbar({ ...snackbar, open: false });
	};

	const handleAuthSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			if (authFlow === "login") {
				const response = await fetch(`${API_BASE_URL}auth/login`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ username, password, isWebsite: "true" }),
				});

				if (response.ok) {
					const data = await response.json();
					localStorage.setItem("authToken", data.token);
					localStorage.setItem("expiresAt", data.expires_at.toString());
					localStorage.setItem("username", data.username);
					localStorage.setItem("displayName", data.displayName);
					localStorage.setItem("companyName", data.companyName);
					localStorage.setItem("companyCode", data.companyCode);
					localStorage.setItem("corporationName", data.corpName);
					localStorage.setItem("currentUserId", data.currentUserId);
					localStorage.setItem("isSynchronized", data.isSynchronized);
					console.log(data);

					openSnackbar("Logged in. Redirecting…", "success");
					setTimeout(() => onLoginSuccess(), 200);
				} else {
					const errorData = await response.json();
					openSnackbar(
						errorData.message || "Login failed. Check credentials.",
						"error",
					);
				}
			} else if (authFlow === "register") {
				if (registrationStep === "form") {
					if (!username || !email || !password) {
						openSnackbar("Please fill in all registration fields.", "error");
						return;
					}

					try {
						const response = await fetch(`${API_BASE_URL}auth/register`, {
							method: "POST",
							headers: {
								"Content-Type": "application/json",
							},
							body: JSON.stringify({
								username,
								email,
								password,
							}),
						});

						const data = await response.json();

						if (response.ok && data.success) {
							// Backend confirmed registration and sent the email
							openSnackbar(
								data.message ||
									"Registration successful. Check email for verification/Use discord to verify.",
								"success",
							);
							//setServerCode(data.servercode);
							setRegistrationStep("verification");
						} else {
							// Handle backend validation errors (e.g., email already exists)
							openSnackbar(
								data.detail ||
									data.message ||
									"Registration failed. Please try again.",
								"error",
							);
						}
					} catch (error) {
						console.error("Registration Fetch Error:", error);
						openSnackbar(
							"Network error during registration. Please check your connection.",
							"error",
						);
					}
				} else {
					if (!verificationCode) {
						openSnackbar("Please enter the verification code.", "error");
						return;
					}

					try {
						const response = await fetch(`${API_BASE_URL}auth/verify_email`, {
							method: "POST",
							headers: {
								"Content-Type": "application/json",
							},
							body: JSON.stringify({
								email: email,
								code: verificationCode,
							}),
						});

						const data = await response.json();

						if (response.ok && data.success) {
							openSnackbar(
								data.message || "Account verified. You can log in now.",
								"success",
							);

							setRegistrationStep("form");
							setAuthFlow("login");
							setUsername("");
							setEmail("");
							setPassword("");
							setVerificationCode("");
						} else {
							// Handle invalid/expired token error
							openSnackbar(
								data.detail || data.message || "Invalid verification code.",
								"error",
							);
						}
					} catch (error) {
						console.error("Verification Fetch Error:", error);
						openSnackbar(
							"Network error during verification. Please check your connection.",
							"error",
						);
					}
				}
			} else if (authFlow === "forgotPassword") {
				if (forgotPasswordStep === "email") {
					const response = await fetch(`${API_BASE_URL}auth/forget_password`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ email }),
					});
					if (response.ok) {
						const data = await response.json();
						openSnackbar(
							data.message || "Verification code sent to email.",
							"success",
						);
						//setServerCode(data.servercode);
						setForgotPasswordStep("code");
					} else {
						const eData = await response.json();
						openSnackbar(eData.message || "Failed to send code.", "error");
					}
				} else if (forgotPasswordStep === "code") {
					const response = await fetch(
						`${API_BASE_URL}auth/code_verification`,
						{
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ code: verificationCode }),
						},
					);
					if (response.ok) {
						openSnackbar("Code verified. Set your new password.", "success");
						setForgotPasswordStep("newPassword");
					} else {
						const eData = await response.json();
						openSnackbar(eData.message || "Invalid code.", "error");
					}
				} else {
					if (newPassword !== confirmNewPassword) {
						openSnackbar("New passwords do not match.", "error");
						setIsLoading(false);
						return;
					}
					const response = await fetch(
						`${API_BASE_URL}auth/forget_password_set_new_password`,
						{
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ code: verificationCode, newPassword }),
						},
					);
					if (response.ok) {
						openSnackbar(
							"Password changed. Redirecting to login...",
							"success",
						);
						setTimeout(() => {
							setAuthFlow("login");
							setForgotPasswordStep("email");
							setUsername("");
							setEmail("");
							setPassword("");
							setNewPassword("");
							setConfirmNewPassword("");
							setVerificationCode("");
						}, 200);
					} else {
						const eData = await response.json();
						openSnackbar(
							eData.message || "Failed to change password.",
							"error",
						);
					}
				}
			}
		} catch (err) {
			openSnackbar("Network error. Please try again.", "error");
			console.error(err);
		} finally {
			setIsLoading(false);
		}
	};

	const switchToRegister = () => {
		setAuthFlow("register");
		setRegistrationStep("form");
		setUsername("");
		setEmail("");
		setPassword("");
		setVerificationCode("");
	};

	const switchToLogin = () => {
		setAuthFlow("login");
		setRegistrationStep("form");
		setUsername("");
		setEmail("");
		setPassword("");
		setVerificationCode("");
	};

	const switchToForgot = () => {
		setAuthFlow("forgotPassword");
		setForgotPasswordStep("email");
		setUsername("");
		setEmail("");
		setPassword("");
		setNewPassword("");
		setConfirmNewPassword("");
		setVerificationCode("");
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
						{/* Top row: dynamic header + close X */}
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

						<form onSubmit={handleAuthSubmit}>
							{authFlow === "login" && (
								<>
									<TextField
										label="Username/Email"
										variant="outlined"
										fullWidth
										margin="normal"
										value={username}
										onChange={(e) => setUsername(e.target.value)}
										autoComplete="username"
										sx={{
											input: { color: "white" },
											"& .MuiInputLabel-root": {
												color: "rgba(255,255,255,0.7)",
											},
											"& .MuiOutlinedInput-root": {
												"& fieldset": { borderColor: "rgba(255,255,255,0.06)" },
												"&:hover fieldset": { borderColor: "#7b68ee" },
												"&.Mui-focused fieldset": { borderColor: "#7b68ee" },
											},
										}}
									/>

									<TextField
										label="Password"
										type={showPassword ? "text" : "password"}
										variant="outlined"
										fullWidth
										margin="normal"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										autoComplete="current-password"
										InputProps={{
											endAdornment: (
												<InputAdornment position="end">
													<IconButton
														aria-label={
															showPassword ? "Hide password" : "Show password"
														}
														onClick={() => setShowPassword((s) => !s)}
														edge="end"
														sx={{ color: "rgba(255,255,255,0.7)" }}
													>
														{showPassword ? <FaEyeSlash /> : <FaEye />}
													</IconButton>
												</InputAdornment>
											),
										}}
										sx={{
											input: { color: "white" },
											"& .MuiInputLabel-root": {
												color: "rgba(255,255,255,0.7)",
											},
											"& .MuiOutlinedInput-root": {
												"& fieldset": { borderColor: "rgba(255,255,255,0.06)" },
												"&:hover fieldset": { borderColor: "#7b68ee" },
												"&.Mui-focused fieldset": { borderColor: "#7b68ee" },
											},
										}}
									/>

									<PrimaryButton
										type="submit"
										variant="contained"
										fullWidth
										disabled={isLoading}
										startIcon={!isLoading ? <FaSignInAlt /> : undefined}
									>
										{isLoading ? (
											<CircularProgress size={20} color="inherit" />
										) : (
											"Login"
										)}
									</PrimaryButton>

									<Box
										sx={{
											display: "flex",
											justifyContent: "space-between",
											mt: 1,
										}}
									>
										<LinkButton onClick={switchToForgot}>
											Forgot Password?
										</LinkButton>
										<LinkButton onClick={switchToRegister}>
											Need an account? Register
										</LinkButton>
									</Box>
								</>
							)}

							{authFlow === "register" && (
								<>
									{registrationStep === "form" ? (
										<>
											<TextField
												label="Username"
												variant="outlined"
												fullWidth
												margin="normal"
												value={username}
												onChange={(e) => setUsername(e.target.value)}
												autoComplete="username"
											/>
											<TextField
												label="Email"
												type="email"
												variant="outlined"
												fullWidth
												margin="normal"
												value={email}
												onChange={(e) => setEmail(e.target.value)}
												autoComplete="email"
											/>
											<TextField
												label="Password"
												type={showPassword ? "text" : "password"}
												variant="outlined"
												fullWidth
												margin="normal"
												value={password}
												onChange={(e) => setPassword(e.target.value)}
												autoComplete="new-password"
												InputProps={{
													endAdornment: (
														<InputAdornment position="end">
															<IconButton
																aria-label="toggle password"
																onClick={() => setShowPassword((s) => !s)}
																edge="end"
																sx={{ color: "rgba(255,255,255,0.7)" }}
															>
																{showPassword ? <FaEyeSlash /> : <FaEye />}
															</IconButton>
														</InputAdornment>
													),
												}}
											/>
											<PrimaryButton
												type="submit"
												variant="contained"
												fullWidth
												disabled={isLoading}
												startIcon={<FaUserPlus />}
											>
												{isLoading ? (
													<CircularProgress size={20} color="inherit" />
												) : (
													"Register"
												)}
											</PrimaryButton>
											<LinkButton onClick={switchToLogin}>
												Already have an account? Login
											</LinkButton>
										</>
									) : (
										<>
											<Alert severity="info" sx={{ mt: 2, mb: 3 }}>
												<AlertTitle>Verification Required</AlertTitle>
												<Box component="span" sx={{ fontWeight: "bold" }}>
													To proceed, you must use your email:
												</Box>
												<ol
													style={{
														paddingLeft: "20px",
														margin: "8px 0 12px 0",
													}}
												>
													<li>
														Search your email address for "punotedpu@gmail.com"
														email.
													</li>
													<li>
														Copy the provided code from email
														<code
															style={{
																background: "#3f51b51a",
																color: "#3f51b5",
																fontWeight: "bold",
																padding: "4px 6px",
																borderRadius: "4px",
																userSelect: "all",
																display: "inline-block",
																marginTop: "4px",
																marginBottom: "4px",
															}}
														>
															6-character code
														</code>
													</li>
													<li>
														Enter that code into the verification code field
														below to continue the reset.
													</li>
												</ol>
											</Alert>

											{/* --- Input Fields --- */}

											{/* Email Field */}
											<TextField
												label="Email (for verification)"
												type="email"
												variant="outlined"
												fullWidth
												margin="normal"
												value={email}
												onChange={(e) => setEmail(e.target.value)}
												required
											/>

											{/* Verification Code (User Input) */}
											<TextField
												label="Verification Code from Email"
												variant="outlined"
												fullWidth
												margin="normal"
												value={verificationCode}
												onChange={(e) => setVerificationCode(e.target.value)}
												required
												helperText="Enter the 6-digit code received privately from the Discord bot."
											/>

											{/* --- Buttons --- */}
											<Box sx={{ display: "flex", gap: 2, mt: 2 }}>
												<PrimaryButton
													type="submit"
													fullWidth
													variant="contained"
													disabled={isLoading}
													startIcon={<FaCheckCircle />}
												>
													{isLoading ? (
														<CircularProgress size={20} color="inherit" />
													) : (
														"Verify Account"
													)}
												</PrimaryButton>
											</Box>

											<LinkButton onClick={switchToLogin}>
												Back to Login
											</LinkButton>
										</>
									)}
								</>
							)}

							{authFlow === "forgotPassword" && (
								<>
									{forgotPasswordStep === "email" && (
										<>
											<TextField
												label="Email"
												type="email"
												variant="outlined"
												fullWidth
												margin="normal"
												value={email}
												onChange={(e) => setEmail(e.target.value)}
												autoComplete="email"
											/>
											<PrimaryButton
												type="submit"
												variant="contained"
												fullWidth
												disabled={isLoading}
												startIcon={<FaEnvelopeOpenText />}
											>
												{isLoading ? (
													<CircularProgress size={20} color="inherit" />
												) : (
													"Send Code"
												)}
											</PrimaryButton>
											<LinkButton onClick={switchToLogin}>
												Back to Login
											</LinkButton>
										</>
									)}

									{forgotPasswordStep === "code" && (
										<>
											<Alert severity="info" sx={{ mt: 2, mb: 3 }}>
												<AlertTitle>Verification Required</AlertTitle>
												<Box component="span" sx={{ fontWeight: "bold" }}>
													To proceed, you must use your email:
												</Box>
												<ol
													style={{
														paddingLeft: "20px",
														margin: "8px 0 12px 0",
													}}
												>
													<li>
														Search your email address for "punotedpu@gmail.com"
														email.
													</li>
													<li>
														Copy the provided code from email
														<code
															style={{
																background: "#3f51b51a",
																color: "#3f51b5",
																fontWeight: "bold",
																padding: "4px 6px",
																borderRadius: "4px",
																userSelect: "all",
																display: "inline-block",
																marginTop: "4px",
																marginBottom: "4px",
															}}
														>
															6-character code
														</code>
													</li>
													<li>
														Enter that code into the verification code field
														below to continue the reset.
													</li>
												</ol>
											</Alert>

											{/* --- Input Fields --- */}

											{/* Verification Code (For User Input) */}
											<TextField
												label="Verification Code from Email"
												variant="outlined"
												fullWidth
												margin="normal"
												value={verificationCode}
												onChange={(e) => setVerificationCode(e.target.value)}
												required
											/>

											{/* --- Buttons --- */}
											<Box sx={{ display: "flex", gap: 2, mt: 2 }}>
												<PrimaryButton
													type="submit"
													variant="contained"
													fullWidth
													disabled={isLoading}
													startIcon={<FaCheckCircle />}
												>
													{isLoading ? (
														<CircularProgress size={20} color="inherit" />
													) : (
														"Verify Code"
													)}
												</PrimaryButton>
											</Box>

											<LinkButton onClick={switchToLogin}>
												Back to Login
											</LinkButton>
										</>
									)}

									{forgotPasswordStep === "newPassword" && (
										<>
											<TextField
												label="New Password"
												type={showPassword ? "text" : "password"}
												variant="outlined"
												fullWidth
												margin="normal"
												value={newPassword}
												onChange={(e) => setNewPassword(e.target.value)}
												autoComplete="new-password"
												InputProps={{
													endAdornment: (
														<InputAdornment position="end">
															<IconButton
																aria-label="toggle password"
																onClick={() => setShowPassword((s) => !s)}
																edge="end"
																sx={{ color: "rgba(255,255,255,0.7)" }}
															>
																{showPassword ? <FaEyeSlash /> : <FaEye />}
															</IconButton>
														</InputAdornment>
													),
												}}
											/>
											<TextField
												label="Confirm New Password"
												type={showPassword ? "text" : "password"}
												variant="outlined"
												fullWidth
												margin="normal"
												value={confirmNewPassword}
												onChange={(e) => setConfirmNewPassword(e.target.value)}
												autoComplete="new-password"
											/>
											<PrimaryButton
												type="submit"
												variant="contained"
												fullWidth
												disabled={isLoading}
												startIcon={<FaLock />}
											>
												{isLoading ? (
													<CircularProgress size={20} color="inherit" />
												) : (
													"Change Password"
												)}
											</PrimaryButton>
											<LinkButton onClick={switchToLogin}>
												Back to Login
											</LinkButton>
										</>
									)}
								</>
							)}
						</form>
					</AuthPanel>
				</ContentContainer>
			</BackgroundBox>

			<Snackbar
				open={snackbar.open}
				autoHideDuration={3000}
				onClose={handleCloseSnackbar}
				anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
			>
				<Alert
					onClose={handleCloseSnackbar}
					severity={snackbar.severity}
					sx={{ width: "100%" }}
				>
					{snackbar.message}
				</Alert>
			</Snackbar>
		</>
	);
};

export default AuthenticationBox;
