import React, { useState } from "react";
import {
	Box,
	TextField,
	CircularProgress,
	Alert,
	AlertTitle,
} from "@mui/material";
import { FaEnvelopeOpenText, FaCheckCircle, FaLock } from "react-icons/fa";
import { PrimaryButton, LinkButton, textFieldStyles } from "./styles";
import { fetchClient } from "../../utils/apiclient";

interface Props {
	isLoading: boolean;
	setIsLoading: (val: boolean) => void;
	openSnackbar: (msg: string, severity: "success" | "error") => void;
	switchToLogin: () => void;
}

export const ForgotPasswordForm: React.FC<Props> = ({
	isLoading,
	setIsLoading,
	openSnackbar,
	switchToLogin,
}) => {
	const [step, setStep] = useState<"email" | "code" | "newPassword">("email");
	const [email, setEmail] = useState("");
	const [verificationCode, setVerificationCode] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmNewPassword, setConfirmNewPassword] = useState("");

	const handleSendEmail = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		try {
			const res = await fetchClient("/auth/forget_password", {
				method: "POST",
				body: JSON.stringify({ email }),
			});
			if (res.ok) {
				openSnackbar("Verification code sent to email.", "success");
				setStep("code");
			} else {
				const data = await res.json();
				openSnackbar(data.message || "Failed to send code.", "error");
			}
		} catch {
			openSnackbar("Network error.", "error");
		} finally {
			setIsLoading(false);
		}
	};

	const handleVerifyCode = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		try {
			const res = await fetchClient("/auth/code_verification", {
				method: "POST",
				body: JSON.stringify({ code: verificationCode }),
			});
			if (res.ok) {
				openSnackbar("Code verified. Set your new password.", "success");
				setStep("newPassword");
			} else {
				const data = await res.json();
				openSnackbar(data.message || "Invalid code.", "error");
			}
		} catch {
			openSnackbar("Network error.", "error");
		} finally {
			setIsLoading(false);
		}
	};

	const handleSetPassword = async (e: React.FormEvent) => {
		e.preventDefault();
		if (newPassword !== confirmNewPassword) {
			openSnackbar("New passwords do not match.", "error");
			return;
		}
		setIsLoading(true);
		try {
			const res = await fetchClient("/auth/forget_password_set_new_password", {
				method: "POST",
				body: JSON.stringify({ code: verificationCode, newPassword }),
			});
			if (res.ok) {
				openSnackbar("Password changed. Redirecting to login...", "success");
				setTimeout(() => switchToLogin(), 1500);
			} else {
				const data = await res.json();
				openSnackbar(data.message || "Failed to change password.", "error");
			}
		} catch {
			openSnackbar("Network error.", "error");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Box>
			{step === "email" && (
				<form onSubmit={handleSendEmail}>
					<TextField
						label="Email"
						type="email"
						variant="outlined"
						fullWidth
						margin="normal"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						sx={textFieldStyles}
					/>
					<PrimaryButton
						type="submit"
						variant="contained"
						fullWidth
						disabled={isLoading}
						startIcon={<FaEnvelopeOpenText />}
						sx={{ mt: 2 }}
					>
						{isLoading ? (
							<CircularProgress size={20} color="inherit" />
						) : (
							"Send Code"
						)}
					</PrimaryButton>
				</form>
			)}

			{step === "code" && (
				<form onSubmit={handleVerifyCode}>
					<Alert severity="info" sx={{ mt: 2, mb: 3 }}>
						<AlertTitle>Check your email</AlertTitle>
						Please enter the code sent to your email address.
					</Alert>
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
							"Verify Code"
						)}
					</PrimaryButton>
				</form>
			)}

			{step === "newPassword" && (
				<form onSubmit={handleSetPassword}>
					<TextField
						label="New Password"
						type="password"
						variant="outlined"
						fullWidth
						margin="normal"
						value={newPassword}
						onChange={(e) => setNewPassword(e.target.value)}
						required
						sx={textFieldStyles}
					/>
					<TextField
						label="Confirm New Password"
						type="password"
						variant="outlined"
						fullWidth
						margin="normal"
						value={confirmNewPassword}
						onChange={(e) => setConfirmNewPassword(e.target.value)}
						required
						sx={textFieldStyles}
					/>
					<PrimaryButton
						type="submit"
						variant="contained"
						fullWidth
						disabled={isLoading}
						startIcon={<FaLock />}
						sx={{ mt: 2 }}
					>
						{isLoading ? (
							<CircularProgress size={20} color="inherit" />
						) : (
							"Change Password"
						)}
					</PrimaryButton>
				</form>
			)}

			<LinkButton onClick={switchToLogin} sx={{ mt: 2 }}>
				Back to Login
			</LinkButton>
		</Box>
	);
};
