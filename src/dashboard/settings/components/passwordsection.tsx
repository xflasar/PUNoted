import React, { useState } from "react";
import {
	Box,
	TextField,
	Button,
	Paper,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogContentText,
	DialogActions,
	IconButton,
	useTheme,
} from "@mui/material";
import {
	Lock,
	Visibility,
	VisibilityOff,
	MarkEmailRead,
} from "@mui/icons-material";
import { SectionHeader, transparentCardStyle } from "../styles";
import { securityGuideSteps } from "../constants";
import { fetchClient } from "../../../utils/apiclient";

const PasswordSection: React.FC = () => {
	const theme = useTheme();
	const [form, setForm] = useState({ current: "", new: "", confirm: "" });
	const [show, setShow] = useState({ current: false, new: false });
	const [isVerifying, setIsVerifying] = useState(false);
	const [code, setCode] = useState("");
	const [loading, setLoading] = useState(false);

	const handleInitiate = async () => {
		if (form.new !== form.confirm) return alert("Passwords do not match.");
		setLoading(true);
		try {
			const res = await fetchClient("/auth/change-password", {
				method: "POST",
			});
			if (res.ok) {
				setIsVerifying(true);
			} else {
				const err = await res.json();
				alert(err.detail || "Failed to initiate password change.");
			}
		} catch (e) {
			alert("Network error occurred.");
		} finally {
			setLoading(false);
		}
	};

	const handleConfirm = async () => {
		setLoading(true);
		try {
			const res = await fetchClient("/auth/change-password-final", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					currentPassword: form.current,
					newPassword: form.new,
					verificationCode: code,
				}),
			});

			if (res.ok) {
				alert("Password updated successfully.");
				setIsVerifying(false);
				setForm({ current: "", new: "", confirm: "" });
				setCode("");
			} else {
				const err = await res.json();
				alert(err.detail || "Update failed.");
			}
		} catch (e) {
			alert("Network error.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Paper sx={transparentCardStyle(theme)}>
			<SectionHeader
				icon={<Lock />}
				title="Security"
				color={theme.palette.warning.main}
				guideSteps={securityGuideSteps}
			/>
			<Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, flex: 1 }}>
				<TextField
					label="Current Password"
					type={show.current ? "text" : "password"}
					value={form.current}
					onChange={(e) => setForm({ ...form, current: e.target.value })}
					fullWidth
					size="small"
					variant="outlined"
					slotProps={{
						input: {
							endAdornment: (
								<IconButton
									size="small"
									onClick={() => setShow({ ...show, current: !show.current })}
								>
									{show.current ? (
										<VisibilityOff fontSize="small" />
									) : (
										<Visibility fontSize="small" />
									)}
								</IconButton>
							),
						},
					}}
				/>
				<Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
					<TextField
						label="New Password"
						type={show.new ? "text" : "password"}
						value={form.new}
						onChange={(e) => setForm({ ...form, new: e.target.value })}
						size="small"
						variant="outlined"
						sx={{ flex: "1 1 150px" }}
						slotProps={{
							input: {
								endAdornment: (
									<IconButton
										size="small"
										onClick={() => setShow({ ...show, new: !show.new })}
									>
										{show.new ? (
											<VisibilityOff fontSize="small" />
										) : (
											<Visibility fontSize="small" />
										)}
									</IconButton>
								),
							},
						}}
					/>
					<TextField
						label="Confirm Password"
						type={show.new ? "text" : "password"}
						value={form.confirm}
						onChange={(e) => setForm({ ...form, confirm: e.target.value })}
						size="small"
						variant="outlined"
						sx={{ flex: "1 1 150px" }}
					/>
				</Box>
			</Box>

			<Box sx={{ mt: 1.5, display: "flex", justifyContent: "flex-end" }}>
				<Button
					variant="outlined"
					size="small"
					color="warning"
					onClick={handleInitiate}
					startIcon={<Lock />}
					disabled={loading}
					sx={{ height: 28, fontSize: "0.75rem" }}
				>
					Update
				</Button>
			</Box>

			<Dialog open={isVerifying} onClose={() => setIsVerifying(false)}>
				<DialogTitle
					sx={{
						display: "flex",
						alignItems: "center",
						gap: 1,
						fontSize: "1rem",
					}}
				>
					<MarkEmailRead color="primary" fontSize="small" /> Verify Identity
				</DialogTitle>
				<DialogContent>
					<DialogContentText sx={{ mb: 2, fontSize: "0.85rem" }}>
						Enter the code sent to your email.
					</DialogContentText>
					<TextField
						autoFocus
						fullWidth
						label="Verification Code"
						size="small"
						value={code}
						onChange={(e) => setCode(e.target.value)}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setIsVerifying(false)} size="small">
						Cancel
					</Button>
					<Button
						onClick={handleConfirm}
						variant="contained"
						size="small"
						disabled={loading}
					>
						Confirm
					</Button>
				</DialogActions>
			</Dialog>
		</Paper>
	);
};

export default PasswordSection;
