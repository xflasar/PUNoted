import React, { useEffect, useState } from "react";
import {
	Box,
	Typography,
	Chip,
	Button,
	Container,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Snackbar,
	Alert,
	CircularProgress,
} from "@mui/material";
import { CheckCircleOutlineOutlined, WarningAmber } from "@mui/icons-material";
import type {
	UserSettings,
	WebPrivacySettings,
	ApiToken,
	GlobalSettings,
} from "../settings/types";
import { API_BASE, WS_URL } from "../settings/constants";
import ProfileSection from "../settings/components/ProfileSection";
import PasswordSection from "../settings/components/PasswordSection";
import PrivacySection from "../settings/components/PrivacySection";
import GroupsSection from "../settings/components/GroupsSection";
import ApiTokenSection from "../settings/components/ApiTokenSection";
import GlobalSettingsSection from "./components/GlobalSettingsSection";

const SettingsPage: React.FC<{ userId: string }> = ({ userId }) => {
	const [data, setData] = useState<{
		settings: UserSettings | null;
		globalSettings: GlobalSettings | null; // NEW STATE
		privacy: WebPrivacySettings;
		tokens: ApiToken[];
	}>({ settings: null, globalSettings: null, privacy: {}, tokens: [] });
	const [loading, setLoading] = useState(true);
	const [showInstructions, setShowInstructions] = useState(false);
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		severity: "success" | "error" | "warning" | "info";
	}>({ open: false, message: "", severity: "info" });
	const [wsTrigger, setWsTrigger] = useState(0);

	const headers = {
		Authorization: `Bearer ${localStorage.getItem("authToken")}`,
	};

	// WebSocket for Instant Invites
	useEffect(() => {
		const ws = new WebSocket(
			`${WS_URL}?token=${localStorage.getItem("authToken")}`,
		);
		ws.onmessage = (event) => {
			try {
				const msg = JSON.parse(event.data);
				if (msg.type === "INVITE") {
					setSnackbar({
						open: true,
						message: `New Invite: ${msg.group_name}`,
						severity: "info",
					});
					setWsTrigger((prev) => prev + 1);
				}
			} catch {}
		};
		return () => ws.close();
	}, []);

	useEffect(() => {
		const load = async () => {
			try {
				const [s, gs, t, p] = await Promise.all([
					fetch(`${API_BASE}/users/settings`, { headers }),
					fetch(`${API_BASE}/settings/global`, { headers }), // Fetch Global
					fetch(`${API_BASE}/settings/tokens`, { headers }),
					fetch(`${API_BASE}/settings/privacy`, { headers }),
				]);

				if (s.ok && gs.ok && t.ok && p.ok) {
					setData({
						settings: await s.json(),
						globalSettings: await gs.json(), // Set Global
						tokens: await t.json(),
						privacy: await p.json(),
					});
				}
			} catch {
				showMsg("Load failed", "error");
			} finally {
				setLoading(false);
			}
		};
		load();
	}, [wsTrigger]);

	const showMsg = (message: string, severity: any) =>
		setSnackbar({ open: true, message, severity });

	const saveProfile = async (d: Partial<UserSettings>) => {
		const res = await fetch(`${API_BASE}/users/settings`, {
			method: "PUT",
			headers: { ...headers, "Content-Type": "application/json" },
			body: JSON.stringify(d),
		});
		if (res.ok) {
			setData((prev) => ({ ...prev, settings: { ...prev.settings!, ...d } }));
			showMsg("Saved", "success");
		} else showMsg("Failed", "error");
	};

	const savePrivacy = async (d: WebPrivacySettings) => {
		const res = await Promise.all(
			Object.entries(d).map(([c, p]) =>
				fetch(`${API_BASE}/settings/privacy`, {
					method: "POST",
					headers: { ...headers, "Content-Type": "application/json" },
					body: JSON.stringify({ page_context: c, preferences: p }),
				}),
			),
		);
		if (res.every((r) => r.ok)) {
			setData((prev) => ({ ...prev, privacy: d }));
			showMsg("Saved", "success");
		} else showMsg("Failed", "error");
	};

	const reqPass = async () => {
		const res = await fetch(`${API_BASE}/users/password/challenge`, {
			method: "POST",
			headers,
		});
		if (res.ok) {
			showMsg("Code sent to email", "info");
			return true;
		}
		showMsg("Failed to send code", "error");
		return false;
	};

	const saveGlobalSettings = async (updates: Partial<GlobalSettings>) => {
		try {
			const res = await fetch(`${API_BASE}/settings/global`, {
				method: "PUT",
				headers: { ...headers, "Content-Type": "application/json" },
				body: JSON.stringify(updates),
			});
			if (res.ok) {
				setData((prev) => ({
					...prev,
					globalSettings: { ...prev.globalSettings!, ...updates },
				}));
				showMsg("Configuration saved", "success");
			} else {
				showMsg("Failed to save configuration", "error");
			}
		} catch {
			showMsg("Error saving", "error");
		}
	};

	const confPass = async (c: string, n: string, v: string) => {
		const res = await fetch(`${API_BASE}/users/password`, {
			method: "PUT",
			headers: { ...headers, "Content-Type": "application/json" },
			body: JSON.stringify({
				currentPassword: c,
				newPassword: n,
				verificationCode: v,
			}),
		});
		if (res.ok) {
			showMsg("Password changed", "success");
			return true;
		}
		const txt = await res.text();
		showMsg(txt || "Failed", "error");
		return false;
	};

	if (loading || !data.settings)
		return (
			<Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
				<CircularProgress />
			</Box>
		);

	return (
		<Box
			sx={{
				height: "100vh",
				overflow: "hidden",
				display: "flex",
				flexDirection: "column",
				bgcolor: "background.default",
			}}
		>
			<Container
				maxWidth={false}
				sx={{
					flexGrow: 1,
					display: "flex",
					flexDirection: "column",
					p: 1,
					overflow: "hidden",
				}}
			>
				{/* Header */}
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						mb: 1.5,
					}}
				>
					<Box display="flex" alignItems="center" gap={1.5}>
						<Typography variant="h5" fontWeight={800} letterSpacing="-0.5px">
							Settings
						</Typography>
						<Chip
							icon={
								data.settings.isSynchronized ? (
									<CheckCircleOutlineOutlined style={{ fontSize: 16 }} />
								) : (
									<WarningAmber style={{ fontSize: 16 }} />
								)
							}
							label={data.settings.isSynchronized ? "SYNCED" : "NOT SYNCED"}
							color={data.settings.isSynchronized ? "success" : "warning"}
							variant="outlined"
							size="small"
							sx={{ fontWeight: "bold", height: 24, fontSize: "0.7rem" }}
						/>
					</Box>
					{!data.settings.isSynchronized && (
						<Button
							variant="outlined"
							size="small"
							onClick={() => setShowInstructions(true)}
							sx={{ height: 28 }}
						>
							Setup Sync
						</Button>
					)}
				</Box>

				{/* Content */}
				<Box sx={{ flex: 1, overflowY: "auto", pr: 0.5 }}>
					<Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
						<Box
							sx={{
								flex: "1 1 350px",
								minWidth: "300px",
								display: "flex",
								flexDirection: "column",
								gap: 1.5,
							}}
						>
							<ProfileSection
								initialSettings={data.settings}
								onSave={saveProfile}
							/>
							<PasswordSection
								onRequestChallenge={reqPass}
								onConfirmChange={confPass}
							/>
						</Box>
						<Box
							sx={{
								flex: "1 1 300px",
								minWidth: "300px",
								display: "flex",
								flexDirection: "column",
								gap: 1.5,
							}}
						>
							<PrivacySection
								initialPrivacy={data.privacy}
								onSave={savePrivacy}
							/>
							<GroupsSection
								userId={userId}
								headers={headers}
								showSnackbar={showMsg}
								wsTrigger={wsTrigger}
							/>
						</Box>
						<Box sx={{ flex: "1 1 350px", minWidth: "300px" }}>
							<ApiTokenSection
								initialTokens={data.tokens}
								headers={headers}
								showSnackbar={showMsg}
							/>
						</Box>
					</Box>
					<Box
						sx={{
							flex: "1 1 350px",
							minWidth: "300px",
							mt: 2,
							display: "flex",
							flexDirection: "column",
							gap: 1.5,
							overflowY: "auto",
						}}
					>
						{data.globalSettings && (
							<GlobalSettingsSection
								initialSettings={data.globalSettings}
								headers={headers}
								onSave={saveGlobalSettings}
								showSnackbar={showMsg}
							/>
						)}
					</Box>
				</Box>
			</Container>

			<Dialog
				open={showInstructions}
				onClose={() => setShowInstructions(false)}
				maxWidth="sm"
			>
				<DialogTitle>Connect Extension</DialogTitle>
				<DialogContent dividers>
					<Typography>
						1. Install extension.
						<br />
						2. Login.
						<br />
						3. Refresh game tab.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setShowInstructions(false)}>Close</Button>
				</DialogActions>
			</Dialog>

			<Snackbar
				open={snackbar.open}
				autoHideDuration={4000}
				onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
			>
				<Alert severity={snackbar.severity} variant="filled">
					{snackbar.message}
				</Alert>
			</Snackbar>
		</Box>
	);
};

export default SettingsPage;
