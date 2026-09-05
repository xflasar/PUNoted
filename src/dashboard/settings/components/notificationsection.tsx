import React, { useState, useEffect } from "react";
import {
	Box,
	Typography,
	Paper,
	Switch,
	FormControlLabel,
	Slider,
	TextField,
	Button,
	IconButton,
	CircularProgress,
	Divider,
	Select,
	MenuItem,
	Grid,
	Chip,
	Stack,
} from "@mui/material";
import {
	NotificationsActive,
	AddCircleOutlineOutlined as AddCircleOutline,
	Delete,
	Save,
	DirectionsBoat,
	Inventory2,
	ShowChart,
	PrecisionManufacturing,
	Description,
} from "@mui/icons-material";
import { fetchClient } from "../../../utils/apiclient";

export interface MarketWatcherRule {
	ticker: string;
	exchange: string;
	target_price: number;
	direction: "below" | "above";
}

export interface NotificationSettings {
	fleet_enabled: boolean;
	health_threshold: number;
	storage_enabled: boolean;
	storage_threshold: number;
	production_enabled: boolean;
	supply_days_threshold: number;
	contracts_enabled: boolean;
	cx_enabled: boolean;
	cx_market_watchers: MarketWatcherRule[];
}

export interface NotificationSectionProps {
	onShowMsg: (
		msg: string,
		severity: "success" | "error" | "warning" | "info",
	) => void;
}

export const NotificationSection: React.FC<NotificationSectionProps> = ({
	onShowMsg,
}) => {
	const [settings, setSettings] = useState<NotificationSettings>({
		fleet_enabled: true,
		health_threshold: 70,
		storage_enabled: true,
		storage_threshold: 90,
		production_enabled: true,
		supply_days_threshold: 1.0,
		contracts_enabled: true,
		cx_enabled: true,
		cx_market_watchers: [],
	});
	const [loading, setLoading] = useState<boolean>(true);
	const [saving, setSaving] = useState<boolean>(false);

	// New Market Watcher Draft
	const [newTicker, setNewTicker] = useState<string>("");
	const [newExchange, setNewExchange] = useState<string>("ICA");
	const [newPrice, setNewPrice] = useState<string>("");
	const [newDirection, setNewDirection] = useState<"below" | "above">("below");

	const loadSettings = async () => {
		setLoading(true);
		try {
			const res = await fetchClient(
				"/internal/notifications/settings-api/settings",
			);
			if (res.ok) {
				const json = await res.json();
				if (json.settings) {
					setSettings(json.settings);
				}
			} else {
				onShowMsg("Failed to load notification settings", "error");
			}
		} catch {
			onShowMsg("Error fetching notification settings", "error");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadSettings();
	}, []);

	const handleSave = async () => {
		setSaving(true);
		try {
			const res = await fetchClient(
				"/internal/notifications/settings-api/settings",
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(settings),
				},
			);
			if (res.ok) {
				const json = await res.json();
				onShowMsg(
					json.message || "Notification rules saved successfully!",
					"success",
				);
			} else {
				onShowMsg("Failed to save notification rules", "error");
			}
		} catch {
			onShowMsg("Network error saving notification settings", "error");
		} finally {
			setSaving(false);
		}
	};

	const handleAddWatcher = () => {
		if (!newTicker.trim() || !newPrice || parseFloat(newPrice) <= 0) {
			onShowMsg("Please enter a valid ticker and target price", "warning");
			return;
		}
		const watcher: MarketWatcherRule = {
			ticker: newTicker.trim().toUpperCase(),
			exchange: newExchange.trim().toUpperCase() || "ICA",
			target_price: parseFloat(newPrice),
			direction: newDirection,
		};
		setSettings((prev) => ({
			...prev,
			cx_market_watchers: [...prev.cx_market_watchers, watcher],
		}));
		setNewTicker("");
		setNewPrice("");
	};

	const handleRemoveWatcher = (index: number) => {
		setSettings((prev) => ({
			...prev,
			cx_market_watchers: prev.cx_market_watchers.filter((_, i) => i !== index),
		}));
	};

	if (loading) {
		return (
			<Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
				<CircularProgress size={32} />
			</Box>
		);
	}

	return (
		<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
			{/* Top Header Card */}
			<Paper
				elevation={0}
				sx={{
					p: 2,
					bgcolor: "rgba(255, 255, 255, 0.02)",
					border: "1px solid rgba(255, 255, 255, 0.08)",
					borderRadius: 2,
				}}
			>
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						flexWrap: "wrap",
						gap: 1.5,
					}}
				>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
						<NotificationsActive
							sx={{ color: "#7B68EE", fontSize: "1.5rem" }}
						/>
						<Box>
							<Typography
								variant="subtitle1"
								sx={{ fontWeight: 700, color: "white", lineHeight: 1.2 }}
							>
								Notification Rules & Real-Time Alerts
							</Typography>
							<Typography
								variant="caption"
								sx={{ color: "rgba(255, 255, 255, 0.55)" }}
							>
								Configure real-time WebSocket alerts, entity threshold limits,
								and CX price watch triggers.
							</Typography>
						</Box>
					</Box>

					<Button
						variant="contained"
						size="small"
						startIcon={
							saving ? <CircularProgress size={14} color="inherit" /> : <Save />
						}
						onClick={handleSave}
						disabled={saving}
						sx={{
							bgcolor: "#7B68EE",
							"&:hover": { bgcolor: "#6C5CE7" },
							borderRadius: 1.5,
							fontWeight: 700,
							fontSize: "0.82rem",
							textTransform: "none",
							px: 2,
						}}
					>
						{saving ? "Saving..." : "Save Preferences"}
					</Button>
				</Box>
			</Paper>

			<Grid container spacing={2}>
				{/* 1. Fleet & Ship Condition Rules */}
				<Grid item xs={12} md={6}>
					<Paper
						elevation={0}
						sx={{
							p: 2,
							height: "100%",
							bgcolor: "rgba(255, 255, 255, 0.02)",
							border: "1px solid rgba(255, 255, 255, 0.08)",
							borderRadius: 2,
						}}
					>
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								mb: 1.5,
							}}
						>
							<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
								<DirectionsBoat sx={{ color: "#4FC3F7" }} />
								<Typography
									variant="subtitle2"
									sx={{ fontWeight: 700, color: "white" }}
								>
									Fleet & Ship Condition Alerts
								</Typography>
							</Box>
							<FormControlLabel
								control={
									<Switch
										checked={settings.fleet_enabled}
										onChange={(e) =>
											setSettings({
												...settings,
												fleet_enabled: e.target.checked,
											})
										}
										color="primary"
										size="small"
									/>
								}
								label=""
							/>
						</Box>
						<Typography
							variant="caption"
							sx={{ color: "rgba(255,255,255,0.5)", display: "block", mb: 2 }}
						>
							Alert when a ship reaches destination or when hull/engine health
							drops below set threshold.
						</Typography>

						<Box sx={{ px: 1 }}>
							<Typography
								variant="caption"
								sx={{ color: "white", fontWeight: 600 }}
							>
								Health Threshold Warning:{" "}
								<span style={{ color: "#4FC3F7" }}>
									{settings.health_threshold}%
								</span>
							</Typography>
							<Slider
								value={settings.health_threshold}
								onChange={(_, v) =>
									setSettings({ ...settings, health_threshold: v as number })
								}
								min={10}
								max={95}
								step={5}
								disabled={!settings.fleet_enabled}
								sx={{ color: "#4FC3F7", mt: 1 }}
							/>
						</Box>
					</Paper>
				</Grid>

				{/* 2. Storage Inventory Rules */}
				<Grid item xs={12} md={6}>
					<Paper
						elevation={0}
						sx={{
							p: 2,
							height: "100%",
							bgcolor: "rgba(255, 255, 255, 0.02)",
							border: "1px solid rgba(255, 255, 255, 0.08)",
							borderRadius: 2,
						}}
					>
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								mb: 1.5,
							}}
						>
							<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
								<Inventory2 sx={{ color: "#FFB74D" }} />
								<Typography
									variant="subtitle2"
									sx={{ fontWeight: 700, color: "white" }}
								>
									Storage & Warehouse Capacity Alerts
								</Typography>
							</Box>
							<FormControlLabel
								control={
									<Switch
										checked={settings.storage_enabled}
										onChange={(e) =>
											setSettings({
												...settings,
												storage_enabled: e.target.checked,
											})
										}
										color="warning"
										size="small"
									/>
								}
								label=""
							/>
						</Box>
						<Typography
							variant="caption"
							sx={{ color: "rgba(255,255,255,0.5)", display: "block", mb: 2 }}
						>
							Alert when a warehouse capacity volume exceeds the designated
							percentage limit.
						</Typography>

						<Box sx={{ px: 1 }}>
							<Typography
								variant="caption"
								sx={{ color: "white", fontWeight: 600 }}
							>
								Capacity Warning Limit:{" "}
								<span style={{ color: "#FFB74D" }}>
									{settings.storage_threshold}% full
								</span>
							</Typography>
							<Slider
								value={settings.storage_threshold}
								onChange={(_, v) =>
									setSettings({ ...settings, storage_threshold: v as number })
								}
								min={50}
								max={99}
								step={1}
								disabled={!settings.storage_enabled}
								sx={{ color: "#FFB74D", mt: 1 }}
							/>
						</Box>
					</Paper>
				</Grid>
			</Grid>

			{/* 3. CX Market Watchers Rules */}
			<Paper
				elevation={0}
				sx={{
					p: 2,
					bgcolor: "rgba(255, 255, 255, 0.02)",
					border: "1px solid rgba(255, 255, 255, 0.08)",
					borderRadius: 2,
				}}
			>
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						mb: 1.5,
					}}
				>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<ShowChart sx={{ color: "#81C784" }} />
						<Typography
							variant="subtitle2"
							sx={{ fontWeight: 700, color: "white" }}
						>
							CX Market Watcher Rules (e.g. RAT &lt; 178 ICA)
						</Typography>
					</Box>
					<FormControlLabel
						control={
							<Switch
								checked={settings.cx_enabled}
								onChange={(e) =>
									setSettings({ ...settings, cx_enabled: e.target.checked })
								}
								color="success"
								size="small"
							/>
						}
						label=""
					/>
				</Box>

				{/* Watcher Input Row */}
				<Box
					sx={{
						display: "flex",
						gap: 1,
						flexWrap: "wrap",
						alignItems: "center",
						mb: 2,
						bgcolor: "rgba(0,0,0,0.2)",
						p: 1.5,
						borderRadius: 1.5,
					}}
				>
					<TextField
						size="small"
						placeholder="Ticker (e.g. RAT)"
						value={newTicker}
						onChange={(e) => setNewTicker(e.target.value)}
						sx={{ width: 130, input: { color: "white", fontSize: "0.82rem" } }}
					/>
					<TextField
						size="small"
						placeholder="Exchange (e.g. ICA)"
						value={newExchange}
						onChange={(e) => setNewExchange(e.target.value)}
						sx={{ width: 110, input: { color: "white", fontSize: "0.82rem" } }}
					/>
					<Select
						size="small"
						value={newDirection}
						onChange={(e) =>
							setNewDirection(e.target.value as "below" | "above")
						}
						sx={{ width: 120, color: "white", fontSize: "0.82rem" }}
					>
						<MenuItem value="below">Drops Below</MenuItem>
						<MenuItem value="above">Rises Above</MenuItem>
					</Select>
					<TextField
						size="small"
						type="number"
						placeholder="Target Price"
						value={newPrice}
						onChange={(e) => setNewPrice(e.target.value)}
						sx={{ width: 120, input: { color: "white", fontSize: "0.82rem" } }}
					/>
					<Button
						variant="outlined"
						color="success"
						size="small"
						startIcon={<AddCircleOutline />}
						onClick={handleAddWatcher}
						sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.78rem" }}
					>
						Add Watcher
					</Button>
				</Box>

				{/* Configured Watchers List */}
				<Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
					{settings.cx_market_watchers.length === 0 ? (
						<Typography
							variant="caption"
							sx={{ color: "rgba(255,255,255,0.4)" }}
						>
							No active CX price watchers configured.
						</Typography>
					) : (
						settings.cx_market_watchers.map((w, idx) => (
							<Chip
								key={idx}
								label={`${w.ticker} (${w.exchange}) ${w.direction} ${w.target_price}`}
								onDelete={() => handleRemoveWatcher(idx)}
								deleteIcon={<Delete sx={{ fontSize: "0.9rem" }} />}
								sx={{
									bgcolor: "rgba(129, 199, 132, 0.15)",
									color: "#A5D6A7",
									border: "1px solid rgba(129, 199, 132, 0.3)",
									fontWeight: 700,
									fontSize: "0.75rem",
								}}
							/>
						))
					)}
				</Stack>
			</Paper>
		</Box>
	);
};
