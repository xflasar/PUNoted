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
	Paper,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Tabs,
	Tab,
	useTheme,
	alpha,
} from "@mui/material";
import {
	CheckCircleOutlineOutlined,
	WarningAmber,
	Person,
	Settings as SettingsIcon,
	VpnKey,
	Security,
	Group,
} from "@mui/icons-material";
import type {
	UserSettings,
	WebPrivacySettings,
	ApiToken,
	GlobalSettings,
} from "../settings/types";
import ProfileSection from "../settings/components/profilesection";
import PasswordSection from "../settings/components/passwordsection";
import PrivacySection from "../settings/components/privacysection";
import GroupsSection from "../settings/components/groupssection";
import ApiTokenSection from "../settings/components/apitokensection";
import GlobalSettingsSection from "./components/globalsettingssection";
import { fetchClient } from "../../utils/apiclient";

const SettingsPage: React.FC<{ userId: string }> = ({ userId }) => {
	const theme = useTheme();
	const [data, setData] = useState<{
		settings: UserSettings | null;
		globalSettings: GlobalSettings | null;
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

	const [refreshTrigger, setRefreshTrigger] = useState(0);
	const [activeTab, setActiveTab] = useState<string>("profile");

	useEffect(() => {
		const loadSettingsConfig = async () => {
			try {
				const [s, gs, t, p] = await Promise.all([
					fetchClient(`/internal/users/settings`),
					fetchClient(`/internal/settings/global`),
					fetchClient(`/internal/settings/tokens`),
					fetchClient(`/internal/settings/privacy`),
				]);

				if (s.ok && gs.ok && t.ok && p.ok) {
					setData({
						settings: await s.json(),
						globalSettings: await gs.json(),
						tokens: await t.json(),
						privacy: await p.json(),
					});
				} else {
					showMsg("Failed to synchronize settings backend profiles", "error");
				}
			} catch {
				showMsg("Load execution lifecycle failure triggered", "error");
			} finally {
				setLoading(false);
			}
		};
		loadSettingsConfig();
	}, [refreshTrigger]);

	const showMsg = (message: string, severity: any) =>
		setSnackbar({ open: true, message, severity });

	const saveProfile = async (d: Partial<UserSettings>) => {
		const res = await fetchClient(`/internal/users/settings`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(d),
		});
		if (res.ok) {
			setData((prev) => ({ ...prev, settings: { ...prev.settings!, ...d } }));
			showMsg("Saved profile successfully", "success");
		} else {
			showMsg("Failed to override targeted profile updates", "error");
		}
	};

	const savePrivacy = async (d: WebPrivacySettings) => {
		const res = await Promise.all(
			Object.entries(d).map(([c, p]) =>
				fetchClient(`/internal/settings/privacy`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ page_context: c, preferences: p }),
				}),
			),
		);
		if (res.every((r) => r.ok)) {
			setData((prev) => ({ ...prev, privacy: d }));
			showMsg("Privacy layouts adjusted successfully", "success");
		} else {
			showMsg("Failed to persist changed profile permissions", "error");
		}
	};

	const reqPass = async () => {
		const res = await fetchClient(`/internal/users/password/challenge`, {
			method: "POST",
		});
		if (res.ok) {
			showMsg("Verification code dispatched to your registered inbox", "info");
			return true;
		}
		showMsg("Failed to dispatch active challenge request", "error");
		return false;
	};

	const saveGlobalSettings = async (updates: Partial<GlobalSettings>) => {
		try {
			const res = await fetchClient(`/internal/settings/global`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(updates),
			});
			if (res.ok) {
				setData((prev) => ({
					...prev,
					globalSettings: { ...prev.globalSettings!, ...updates },
				}));
				showMsg("Configuration persisted flawlessly", "success");
			} else {
				showMsg("Failed to override persistent game settings", "error");
			}
		} catch {
			showMsg("Critical internal settings update execution failure", "error");
		}
	};

	const confPass = async (c: string, n: string, v: string) => {
		const res = await fetchClient(`/internal/users/password`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				currentPassword: c,
				newPassword: n,
				verificationCode: v,
			}),
		});
		if (res.ok) {
			showMsg("Password updated seamlessly", "success");
			return true;
		}
		const txt = await res.text();
		showMsg(txt || "Identity updates dropped by security layers", "error");
		return false;
	};

	if (loading || !data.settings) {
		return (
			<Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
				<CircularProgress />
			</Box>
		);
	}

	const tabs = [
		{ id: "profile", label: "Profile & Security", icon: <Person /> },
		{ id: "global", label: "Game Config", icon: <SettingsIcon /> },
		{ id: "tokens", label: "API Integrations", icon: <VpnKey /> },
		{ id: "privacy", label: "Privacy Settings", icon: <Security /> },
		{ id: "groups", label: "Data Groups", icon: <Group /> },
	];

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
					p: { xs: 2, md: 3 },
					overflow: "hidden",
				}}
			>
				{/* Header Block */}
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						mb: 3,
						borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
						pb: 2,
					}}
				>
					<Box display="flex" alignItems="center" gap={1.5}>
						<Typography variant="h5" fontWeight={850} letterSpacing="-0.5px">
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

				{/* Mobile View Navigation Scroller */}
				<Box
					sx={{
						display: { xs: "block", md: "none" },
						mb: 2,
						borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
					}}
				>
					<Tabs
						value={activeTab}
						onChange={(e, v) => setActiveTab(v)}
						variant="scrollable"
						scrollButtons="auto"
						textColor="primary"
						indicatorColor="primary"
					>
						{tabs.map((tab) => (
							<Tab
								key={tab.id}
								value={tab.id}
								label={tab.label}
								icon={tab.icon}
								iconPosition="start"
								sx={{
									minHeight: 48,
									fontSize: "0.8rem",
									textTransform: "none",
								}}
							/>
						))}
					</Tabs>
				</Box>

				{/* Layout Partition Panels Container */}
				<Box sx={{ flex: 1, display: "flex", gap: 3, overflow: "hidden" }}>
					{/* Desktop Left Anchor Sidebar */}
					<Paper
						elevation={0}
						sx={{
							display: { xs: "none", md: "block" },
							width: 260,
							bgcolor: "rgba(255, 255, 255, 0.02)",
							border: "1px solid rgba(255, 255, 255, 0.05)",
							borderRadius: "12px",
							overflowY: "auto",
							p: 1,
						}}
					>
						<List disablePadding>
							{tabs.map((tab) => {
								const active = activeTab === tab.id;
								return (
									<ListItem key={tab.id} disablePadding sx={{ mb: 0.5 }}>
										<ListItemButton
											selected={active}
											onClick={() => setActiveTab(tab.id)}
											sx={{
												borderRadius: "8px",
												py: 1.25,
												bgcolor: active
													? alpha(theme.palette.primary.main, 0.08)
													: "transparent",
												color: active ? "primary.main" : "text.secondary",
												"&.Mui-selected": {
													bgcolor: alpha(theme.palette.primary.main, 0.08),
													color: "primary.main",
													"&:hover": {
														bgcolor: alpha(theme.palette.primary.main, 0.12),
													},
												},
												"&:hover": {
													bgcolor: "rgba(255, 255, 255, 0.04)",
													color: "text.primary",
												},
											}}
										>
											<ListItemIcon sx={{ color: "inherit", minWidth: 36 }}>
												{tab.icon}
											</ListItemIcon>
											<ListItemText
												primary={tab.label}
												primaryTypographyProps={{
													fontWeight: active ? 700 : 500,
													fontSize: "0.85rem",
												}}
											/>
										</ListItemButton>
									</ListItem>
								);
							})}
						</List>
					</Paper>

					{/* Core Settings Interaction Content Views */}
					<Box
						sx={{
							flex: 1,
							overflowY: "auto",
							p: { xs: 0, md: 1 },
							display: "flex",
							flexDirection: "column",
							gap: 3,
						}}
					>
						{activeTab === "profile" && (
							<Box
								sx={{
									display: "flex",
									flexDirection: "column",
									gap: 3,
									width: "100%",
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
						)}

						{activeTab === "global" && data.globalSettings && (
							<Box sx={{ width: "100%" }}>
								<GlobalSettingsSection
									initialSettings={data.globalSettings}
									headers={undefined}
									onSave={saveGlobalSettings}
									showSnackbar={showMsg}
								/>
							</Box>
						)}

						{activeTab === "tokens" && (
							<Box sx={{ width: "100%" }}>
								<ApiTokenSection
									initialTokens={data.tokens}
									headers={undefined}
									showSnackbar={showMsg}
								/>
							</Box>
						)}

						{activeTab === "privacy" && (
							<Box sx={{ width: "100%" }}>
								<PrivacySection
									initialPrivacy={data.privacy}
									onSave={savePrivacy}
								/>
							</Box>
						)}

						{activeTab === "groups" && (
							<Box sx={{ width: "100%" }}>
								<GroupsSection
									userId={userId}
									headers={undefined}
									showSnackbar={showMsg}
									wsTrigger={refreshTrigger}
								/>
							</Box>
						)}
					</Box>
				</Box>
			</Container>

			{/* Synchronize Contextual Dialog Help Overlay */}
			<Dialog
				open={showInstructions}
				onClose={() => setShowInstructions(false)}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle>Connect Extension</DialogTitle>
				<DialogContent dividers>
					<Typography variant="body2" sx={{ lineHeight: 1.8 }}>
						1. Install browser extension. <br />
						2. Authorize via active system context. <br />
						3. Reload commodity exchange interface tabs to trigger capture
						pools.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setShowInstructions(false)}>Close</Button>
				</DialogActions>
			</Dialog>

			{/* Global Application Messaging Alert Snackbar */}
			<Snackbar
				open={snackbar.open}
				autoHideDuration={4000}
				onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
			>
				<Alert
					severity={snackbar.severity}
					variant="filled"
					sx={{ width: "100%" }}
				>
					{snackbar.message}
				</Alert>
			</Snackbar>
		</Box>
	);
};

export default SettingsPage;
