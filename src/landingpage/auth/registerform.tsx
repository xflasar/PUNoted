import React, { useState } from "react";
import {
	Box,
	TextField,
	CircularProgress,
	InputAdornment,
	IconButton,
	Alert,
	AlertTitle,
} from "@mui/material";
import { FaUserPlus, FaCheckCircle, FaEye, FaEyeSlash } from "react-icons/fa";
import { PrimaryButton, LinkButton, textFieldStyles } from "./styles";
import { fetchClient } from "../../utils/apiclient";

interface Props {
	isLoading: boolean;
	setIsLoading: (val: boolean) => void;
	openSnackbar: (msg: string, severity: "success" | "error") => void;
	switchToLogin: () => void;
}

export const RegisterForm: React.FC<Props> = ({
	isLoading,
	setIsLoading,
	openSnackbar,
	switchToLogin,
}) => {
	const [step, setStep] = useState<"form" | "verification">("form");
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [verificationCode, setVerificationCode] = useState("");
	const [showPassword, setShowPassword] = useState(false);

	const handleRegister = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!username || !email || !password) {
			openSnackbar("Please fill in all registration fields.", "error");
			return;
		}

		setIsLoading(true);
		try {
			const response = await fetchClient("/auth/register", {
				method: "POST",
				body: JSON.stringify({ username, email, password }),
			});
			const data = await response.json();

			if (response.ok && data.success) {
				openSnackbar(
					data.message || "Registration successful. Check your email.",
					"success",
				);
				setStep("verification");
			} else {
				openSnackbar(
					data.detail || data.message || "Registration failed.",
					"error",
				);
			}
		} catch (error) {
			openSnackbar("Network error during registration.", "error");
		} finally {
			setIsLoading(false);
		}
	};

	const handleVerify = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!verificationCode) {
			openSnackbar("Please enter the verification code.", "error");
			return;
		}

		setIsLoading(true);
		try {
			const response = await fetchClient("/auth/verify_email", {
				method: "POST",
				body: JSON.stringify({ email, code: verificationCode }),
			});
			const data = await response.json();

			if (response.ok && data.success) {
				openSnackbar(
					data.message || "Account verified. You can log in now.",
					"success",
				);
				switchToLogin();
			} else {
				openSnackbar(
					data.detail || data.message || "Invalid verification code.",
					"error",
				);
			}
		} catch (error) {
			openSnackbar("Network error during verification.", "error");
		} finally {
			setIsLoading(false);
		}
	};

	if (step === "verification") {
		return (
			<form onSubmit={handleVerify}>
				<Alert severity="info" sx={{ mt: 2, mb: 3 }}>
					<AlertTitle>Verification Required</AlertTitle>
					Please check your email and enter the 6-digit code below to continue.
				</Alert>
				<TextField
					label="Email (for verification)"
					type="email"
					variant="outlined"
					fullWidth
					margin="normal"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
					sx={textFieldStyles}
				/>
				<TextField
					label="Verification Code"
					variant="outlined"
					fullWidth
					margin="normal"
					value={verificationCode}
					onChange={(e) => setVerificationCode(e.target.value)}
					required
					sx={textFieldStyles}
				/>
				<PrimaryButton
					type="submit"
					variant="contained"
					fullWidth
					disabled={isLoading}
					startIcon={<FaCheckCircle />}
					sx={{ mt: 2 }}
				>
					{isLoading ? (
						<CircularProgress size={20} color="inherit" />
					) : (
						"Verify Account"
					)}
				</PrimaryButton>
				<LinkButton onClick={switchToLogin} sx={{ mt: 2 }}>
					Back to Login
				</LinkButton>
			</form>
		);
	}

	return (
		<form onSubmit={handleRegister}>
			<TextField
				label="Username"
				variant="outlined"
				fullWidth
				margin="normal"
				value={username}
				onChange={(e) => setUsername(e.target.value)}
				sx={textFieldStyles}
			/>
			<TextField
				label="Email"
				type="email"
				variant="outlined"
				fullWidth
				margin="normal"
				value={email}
				onChange={(e) => setEmail(e.target.value)}
				sx={textFieldStyles}
			/>
			<TextField
				label="Password"
				type={showPassword ? "text" : "password"}
				variant="outlined"
				fullWidth
				margin="normal"
				value={password}
				onChange={(e) => setPassword(e.target.value)}
				sx={textFieldStyles}
				slotProps={{
					input: {
						endAdornment: (
							<InputAdornment position="end">
								<IconButton
									onClick={() => setShowPassword((s) => !s)}
									edge="end"
									sx={{ color: "rgba(255,255,255,0.7)" }}
								>
									{showPassword ? <FaEyeSlash /> : <FaEye />}
								</IconButton>
							</InputAdornment>
						),
					},
				}}
			/>
			<PrimaryButton
				type="submit"
				variant="contained"
				fullWidth
				disabled={isLoading}
				startIcon={<FaUserPlus />}
				sx={{ mt: 2 }}
			>
				{isLoading ? (
					<CircularProgress size={20} color="inherit" />
				) : (
					"Register"
				)}
			</PrimaryButton>
			<LinkButton onClick={switchToLogin} sx={{ mt: 2 }}>
				Already have an account? Login
			</LinkButton>
		</form>
	);
};
