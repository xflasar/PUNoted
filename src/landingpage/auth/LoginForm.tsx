import React, { useState } from "react";
import {
	Box,
	TextField,
	CircularProgress,
	InputAdornment,
	IconButton,
} from "@mui/material";
import { FaSignInAlt, FaEye, FaEyeSlash } from "react-icons/fa";
import { PrimaryButton, LinkButton, textFieldStyles } from "./styles";
import { fetchClient } from "../../utils/apiclient";

interface Props {
	isLoading: boolean;
	setIsLoading: (val: boolean) => void;
	openSnackbar: (msg: string, severity: "success" | "error") => void;
	onLoginSuccess: () => void;
	switchToRegister: () => void;
	switchToForgot: () => void;
}

export const LoginForm: React.FC<Props> = ({
	isLoading,
	setIsLoading,
	openSnackbar,
	onLoginSuccess,
	switchToRegister,
	switchToForgot,
}) => {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			const response = await fetchClient("/auth/login", {
				method: "POST",
				body: JSON.stringify({ username, password, isWebsite: true }),
			});

			if (response.ok) {
				const data = await response.json();

				// Save user data
				localStorage.setItem("authToken", data.token);
				localStorage.setItem("expiresAt", data.expires_at?.toString());
				localStorage.setItem("username", data.username);
				if (data.displayName)
					localStorage.setItem("displayName", data.displayName);
				if (data.companyName)
					localStorage.setItem("companyName", data.companyName);
				if (data.companyCode)
					localStorage.setItem("companyCode", data.companyCode);
				if (data.corpName)
					localStorage.setItem("corporationName", data.corpName);
				if (data.currentUserId)
					localStorage.setItem("currentUserId", data.currentUserId);
				if (data.isSynchronized)
					localStorage.setItem("isSynchronized", data.isSynchronized);

				openSnackbar("Logged in. Redirecting…", "success");
				setTimeout(() => onLoginSuccess(), 200);
			} else {
				const errorData = await response.json();
				openSnackbar(
					errorData.message || "Login failed. Check credentials.",
					"error",
				);
			}
		} catch (error) {
			console.error(error);
			openSnackbar("Network error during login.", "error");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit}>
			<TextField
				label="Username/Email"
				variant="outlined"
				fullWidth
				margin="normal"
				value={username}
				onChange={(e) => setUsername(e.target.value)}
				autoComplete="username"
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
				autoComplete="current-password"
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
				startIcon={!isLoading ? <FaSignInAlt /> : undefined}
				sx={{ mt: 2 }}
			>
				{isLoading ? <CircularProgress size={20} color="inherit" /> : "Login"}
			</PrimaryButton>

			<Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
				<LinkButton onClick={switchToForgot}>Forgot Password?</LinkButton>
				<LinkButton onClick={switchToRegister}>
					Need an account? Register
				</LinkButton>
			</Box>
		</form>
	);
};
