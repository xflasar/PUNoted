import React, { useState, useEffect } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Box,
	Typography,
	Switch,
	FormControlLabel,
	CircularProgress,
	Divider,
	IconButton,
	Stack,
} from "@mui/material";
import {
	NotificationsActive,
	Close,
	PrecisionManufacturing,
	Inventory2,
	Group,
	Build,
} from "@mui/icons-material";
import { TextField } from "@mui/material";
import { fetchClient } from "../../../utils/apiclient";

export interface SiteNotificationConfig {
	enabled: boolean;
	workforce_alert: boolean;
	storage_alert: boolean;
	line_idle_alert: boolean;
	repair_alert: boolean;
	target_repair_age_days: number;
}

export interface SiteNotificationModalProps {
	open: boolean;
	onClose: () => void;
	siteId: string;
	planetName: string;
	onShowMsg?: (
		msg: string,
		severity: "success" | "error" | "warning" | "info",
	) => void;
}

export const SiteNotificationModal: React.FC<SiteNotificationModalProps> = ({
	open,
	onClose,
	siteId,
	planetName,
	onShowMsg,
}) => {
	const [loading, setLoading] = useState<boolean>(true);
	const [saving, setSaving] = useState<boolean>(false);
	const [config, setConfig] = useState<SiteNotificationConfig>({
		enabled: true,
		workforce_alert: true,
		storage_alert: true,
		line_idle_alert: true,
		repair_alert: true,
		target_repair_age_days: 60,
	});

	useEffect(() => {
		if (open && siteId) {
			loadSiteNotificationRules();
		}
	}, [open, siteId]);

	const loadSiteNotificationRules = async () => {
		setLoading(true);
		try {
			const res = await fetchClient("/internal/entity-settings?domain=site");
			if (res.ok) {
				const json = await res.json();
				if (json.entities && json.entities[siteId]) {
					const notif = json.entities[siteId].notification_settings || {};
					setConfig({
						enabled: notif.enabled ?? true,
						workforce_alert: notif.workforce_alert ?? true,
						storage_alert: notif.storage_alert ?? true,
						line_idle_alert: notif.line_idle_alert ?? true,
						repair_alert: notif.repair_alert ?? true,
						target_repair_age_days: notif.target_repair_age_days ?? 60,
					});
				}
			}
		} catch {
			// Silent catch
		} finally {
			setLoading(false);
		}
	};

	const handleSave = async () => {
		setSaving(true);
		try {
			const res = await fetchClient("/internal/entity-settings?domain=site");
			let currentSettings: any = {};
			if (res.ok) {
				const json = await res.json();
				if (json.entities && json.entities[siteId]) {
					currentSettings = json.entities[siteId];
				}
			}

			const entityPayload = {
				domain: "site",
				entity_id: siteId,
				settings: {
					...currentSettings,
					notification_settings: {
						enabled: config.enabled,
						workforce_alert: config.workforce_alert,
						storage_alert: config.storage_alert,
						line_idle_alert: config.line_idle_alert,
						repair_alert: config.repair_alert,
						target_repair_age_days: Number(config.target_repair_age_days) || 60,
					},
				},
			};

			const saveRes = await fetchClient("/internal/entity-settings", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(entityPayload),
			});

			if (saveRes.ok) {
				if (onShowMsg)
					onShowMsg(
						`Notification & repair alert rules saved for ${planetName}!`,
						"success",
					);
				onClose();
			} else {
				if (onShowMsg)
					onShowMsg("Failed to save site notification alerts", "error");
			}
		} catch {
			if (onShowMsg) onShowMsg("Error saving notification alerts", "error");
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="xs"
			fullWidth
			PaperProps={{
				sx: {
					bgcolor: "#141424",
					color: "white",
					borderRadius: 2.5,
					border: "1px solid rgba(255, 255, 255, 0.12)",
					boxShadow: "0px 8px 32px rgba(0,0,0,0.6)",
				},
			}}
		>
			<DialogTitle
				sx={{
					p: 2,
					pb: 1,
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					<NotificationsActive sx={{ color: "#7B68EE", fontSize: "1.3rem" }} />
					<Box>
						<Typography
							variant="subtitle1"
							sx={{ fontWeight: 800, lineHeight: 1.2 }}
						>
							Site Notification Alerts
						</Typography>
						<Typography variant="caption" sx={{ color: "#A594FF" }}>
							{planetName}
						</Typography>
					</Box>
				</Box>
				<IconButton
					size="small"
					onClick={onClose}
					sx={{ color: "rgba(255,255,255,0.6)" }}
				>
					<Close fontSize="small" />
				</IconButton>
			</DialogTitle>

			<Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

			<DialogContent
				sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 2 }}
			>
				{loading ? (
					<Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
						<CircularProgress size={24} />
					</Box>
				) : (
					<>
						{/* Master Notification Toggle */}
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								bgcolor: "rgba(255,255,255,0.03)",
								p: 1.25,
								borderRadius: 1.5,
							}}
						>
							<Typography
								variant="body2"
								sx={{ fontWeight: 700, color: "white" }}
							>
								Enable Notification Alerts
							</Typography>
							<FormControlLabel
								control={
									<Switch
										checked={config.enabled}
										onChange={(e) =>
											setConfig({ ...config, enabled: e.target.checked })
										}
										color="primary"
										size="small"
									/>
								}
								label=""
							/>
						</Box>

						{/* Alert Toggles */}
						<Stack
							spacing={1.5}
							sx={{ opacity: config.enabled ? 1 : 0.4, mt: 1 }}
						>
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
								}}
							>
								<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
									<Group sx={{ color: "#FFB74D", fontSize: "1rem" }} />
									<Typography
										variant="caption"
										sx={{ color: "rgba(255,255,255,0.85)" }}
									>
										Workforce Reserve Critical Alerts
									</Typography>
								</Box>
								<Switch
									checked={config.workforce_alert}
									onChange={(e) =>
										setConfig({ ...config, workforce_alert: e.target.checked })
									}
									disabled={!config.enabled}
									size="small"
								/>
							</Box>

							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
								}}
							>
								<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
									<Inventory2 sx={{ color: "#4FC3F7", fontSize: "1rem" }} />
									<Typography
										variant="caption"
										sx={{ color: "rgba(255,255,255,0.85)" }}
									>
										Warehouse Storage Capacity Full Alert
									</Typography>
								</Box>
								<Switch
									checked={config.storage_alert}
									onChange={(e) =>
										setConfig({ ...config, storage_alert: e.target.checked })
									}
									disabled={!config.enabled}
									size="small"
								/>
							</Box>

							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
								}}
							>
								<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
									<PrecisionManufacturing
										sx={{ color: "#BA68C8", fontSize: "1rem" }}
									/>
									<Typography
										variant="caption"
										sx={{ color: "rgba(255,255,255,0.85)" }}
									>
										Line Queue Completion (Line Idle) Alert
									</Typography>
								</Box>
								<Switch
									checked={config.line_idle_alert}
									onChange={(e) =>
										setConfig({ ...config, line_idle_alert: e.target.checked })
									}
									disabled={!config.enabled}
									size="small"
								/>
							</Box>

							<Divider
								sx={{ borderColor: "rgba(255,255,255,0.08)", my: 0.5 }}
							/>

							<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										justifyContent: "space-between",
									}}
								>
									<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
										<Build sx={{ color: "#F43F5E", fontSize: "1rem" }} />
										<Typography
											variant="caption"
											sx={{ color: "rgba(255,255,255,0.85)", fontWeight: 700 }}
										>
											Building Repair Due Alerts
										</Typography>
									</Box>
									<Switch
										checked={config.repair_alert}
										onChange={(e) =>
											setConfig({ ...config, repair_alert: e.target.checked })
										}
										disabled={!config.enabled}
										size="small"
									/>
								</Box>

								{config.repair_alert && (
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											justifyContent: "space-between",
											pl: 3,
											pt: 0.5,
										}}
									>
										<Box>
											<Typography
												variant="caption"
												sx={{
													color: "rgba(255,255,255,0.7)",
													display: "block",
													fontSize: "0.68rem",
												}}
											>
												Target Average Building Age (Days)
											</Typography>
											<Typography
												variant="caption"
												sx={{
													color: "rgba(255,255,255,0.4)",
													display: "block",
													fontSize: "0.60rem",
												}}
											>
												Alerts trigger at 7d, 3d & daily when age is due
											</Typography>
										</Box>
										<TextField
											type="number"
											size="small"
											value={config.target_repair_age_days}
											onChange={(e) =>
												setConfig({
													...config,
													target_repair_age_days: Math.max(
														1,
														Math.min(180, Number(e.target.value) || 60),
													),
												})
											}
											disabled={!config.enabled || !config.repair_alert}
											inputProps={{
												min: 1,
												max: 180,
												style: {
													padding: "4px 8px",
													fontSize: "0.76rem",
													textAlign: "right",
												},
											}}
											sx={{
												width: 75,
												bgcolor: "rgba(255,255,255,0.05)",
												borderRadius: 1,
												"& .MuiOutlinedInput-notchedOutline": {
													borderColor: "rgba(255,255,255,0.15)",
												},
											}}
										/>
									</Box>
								)}
							</Box>
						</Stack>
					</>
				)}
			</DialogContent>

			<DialogActions sx={{ p: 2, pt: 1 }}>
				<Button
					size="small"
					onClick={onClose}
					sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8rem" }}
				>
					Cancel
				</Button>
				<Button
					size="small"
					variant="contained"
					disabled={saving}
					onClick={handleSave}
					sx={{
						bgcolor: "#7B68EE",
						"&:hover": { bgcolor: "#6C5CE7" },
						borderRadius: 1.5,
						fontWeight: 700,
						fontSize: "0.8rem",
						textTransform: "none",
					}}
				>
					{saving ? "Saving..." : "Save Notification Settings"}
				</Button>
			</DialogActions>
		</Dialog>
	);
};
