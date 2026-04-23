import React, { useState, useEffect } from "react";
import {
	Box,
	Typography,
	Paper,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Stack,
	Autocomplete,
	TextField,
	Chip,
	IconButton,
	Button,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	List,
	ListItem,
	ListItemText,
	useTheme,
} from "@mui/material";
import {
	SettingsApplications,
	Add as AddIcon,
	Delete as DeleteIcon,
	Block,
	Handshake,
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import type {
	GlobalSettings,
	CommodityExchange,
	UserSite,
	LeasedSite,
} from "../types";
import { API_BASE, globalConfigurationGuideSteps } from "../constants";
import { SectionHeader, transparentCardStyle } from "../styles";

interface Props {
	initialSettings: GlobalSettings;
	headers: any;
	onSave: (settings: Partial<GlobalSettings>) => Promise<void>;
	showSnackbar: (msg: string, type: any) => void;
}

const GlobalSettingsSection: React.FC<Props> = ({
	initialSettings,
	headers,
	onSave,
}) => {
	const theme = useTheme();

	// State
	const [form, setForm] = useState<GlobalSettings>(initialSettings);
	const [hasChanges, setHasChanges] = useState(false);
	const [exchanges, setExchanges] = useState<CommodityExchange[]>([]);
	const [sites, setSites] = useState<UserSite[]>([]);

	// State for Excluded Sites Autocomplete (Controlled to allow clearing)
	const [excludedSiteValue, setExcludedSiteValue] = useState<UserSite | null>(
		null,
	);

	// Dialogs
	const [leasedDialogOpen, setLeasedDialogOpen] = useState(false);
	const [newLease, setNewLease] = useState<{
		site: UserSite | null;
		desc: string;
	}>({ site: null, desc: "" });

	// 1. Fetch Reference Data
	useEffect(() => {
		const fetchRefs = async () => {
			try {
				const [cxRes, siteRes] = await Promise.all([
					fetch(`${API_BASE}/settings/refs/commodity-exchanges`, { headers }),
					fetch(`${API_BASE}/settings/user/sites`, { headers }),
				]);

				if (cxRes.ok) setExchanges(await cxRes.json());
				if (siteRes.ok) setSites(await siteRes.json());
			} catch (e) {
				console.error("Failed to load reference data", e);
			}
		};
		fetchRefs();
	}, []);

	// Sync props
	useEffect(() => {
		setForm(initialSettings);
		setHasChanges(false);
	}, [initialSettings]);

	const handleChange = (field: keyof GlobalSettings, value: any) => {
		setForm((prev) => ({ ...prev, [field]: value }));
		setHasChanges(true);
	};

	const handleSave = async () => {
		await onSave(form);
		setHasChanges(false);
	};

	// Exclusions Handler
	const handleAddExcluded = (_: any, value: UserSite | null) => {
		if (value) {
			// Only add if not already in the list
			if (!form.internal_excluded_sites.includes(value.siteId)) {
				handleChange("internal_excluded_sites", [
					...form.internal_excluded_sites,
					value.siteId,
				]);
			}
			// 3. THIS LINE CLEARS THE INPUT
			setExcludedSiteValue(null);
		}
	};

	const handleRemoveExcluded = (siteId: string) => {
		handleChange(
			"internal_excluded_sites",
			form.internal_excluded_sites.filter((id) => id !== siteId),
		);
	};

	// Leased Sites Logic
	const handleAddLeased = () => {
		if (newLease.site && newLease.desc) {
			const entry: LeasedSite = {
				siteId: newLease.site.siteId,
				description: newLease.desc,
			};
			handleChange("internal_leased_sites", [
				...form.internal_leased_sites,
				entry,
			]);
			setLeasedDialogOpen(false);
			setNewLease({ site: null, desc: "" });
		}
	};
	const handleRemoveLeased = (siteId: string) => {
		handleChange(
			"internal_leased_sites",
			form.internal_leased_sites.filter((item) => item.siteId !== siteId),
		);
	};

	// Helpers
	const getSiteName = (id: string) => {
		const site = sites.find((s) => s.siteId === id);
		return site ? `${site.name} (${site.systemName})` : id;
	};

	const availableSitesForExclusion = sites.filter(
		(s) => !form.internal_excluded_sites.includes(s.siteId),
	);
	const availableSitesForLease = sites.filter(
		(s) => !form.internal_leased_sites.some((l) => l.siteId === s.siteId),
	);

	return (
		<Paper sx={transparentCardStyle(theme)}>
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					mb: 2,
				}}
			>
				<SectionHeader
					icon={<SettingsApplications />}
					title="Global Configuration"
					color={theme.palette.secondary.main}
					guideSteps={globalConfigurationGuideSteps}
				/>
				<Button
					variant="contained"
					size="small"
					disabled={!hasChanges}
					onClick={handleSave}
					color="secondary"
				>
					Save Changes
				</Button>
			</Box>

			<Stack spacing={3}>
				{/* Defaults */}
				<Box>
					<Box sx={{ display: "flex", gap: 2 }}>
						<FormControl fullWidth size="small">
							<InputLabel>Default CX</InputLabel>
							<Select
								value={form.default_cx_code || ""}
								label="Default CX"
								onChange={(e) =>
									handleChange("default_cx_code", e.target.value)
								}
								MenuProps={{
									PaperProps: {
										sx: {
											bgcolor: theme.palette.background.default,
											backgroundImage: "none",
										},
									},
								}}
							>
								{exchanges.map((cx) => (
									<MenuItem key={cx.code} value={cx.code}>
										{cx.code} - {cx.name}
									</MenuItem>
								))}
							</Select>
						</FormControl>
						<FormControl fullWidth size="small">
							<InputLabel>Default Currency</InputLabel>
							<Select
								value={form.default_currency || ""}
								label="Default Currency"
								onChange={(e) =>
									handleChange("default_currency", e.target.value)
								}
								MenuProps={{
									PaperProps: {
										sx: {
											bgcolor: theme.palette.background.default,
											backgroundImage: "none",
										},
									},
								}}
							>
								{Array.from(
									new Set(exchanges.map((cx) => cx.currencyCode)),
								).map((curr) => (
									<MenuItem key={curr} value={curr}>
										{curr}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</Box>
				</Box>

				{/* Excluded Sites */}
				<Box>
					<Typography
						variant="caption"
						fontWeight="bold"
						color="text.secondary"
						sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}
					>
						<Block fontSize="inherit" /> EXCLUDED SITES
					</Typography>
					<Autocomplete
						value={excludedSiteValue}
						options={availableSitesForExclusion}
						getOptionLabel={(option) => `${option.name} (${option.systemName})`}
						onChange={handleAddExcluded}
						isOptionEqualToValue={(option, value) =>
							option.siteId === value.siteId
						}
						renderInput={(params) => (
							<TextField
								{...params}
								size="small"
								placeholder="Select site to exclude..."
								sx={{
									bgcolor: alpha(theme.palette.background.default, 0.3),
									borderRadius: 1,
									"& .MuiOutlinedInput-notchedOutline": {
										borderColor: alpha(theme.palette.divider, 0.3),
									},
								}}
							/>
						)}
						size="small"
						sx={{ mb: 1 }}
						slotProps={{
							paper: {
								sx: {
									bgcolor: theme.palette.background.default,
									backgroundImage: "none",
								},
							},
						}}
					/>
					<Box
						sx={{
							display: "flex",
							flexWrap: "wrap",
							gap: 0.5,
							p: 1,
							bgcolor: alpha(theme.palette.background.default, 0.2),
							borderRadius: 1,
							minHeight: 40,
							border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
						}}
					>
						{form.internal_excluded_sites.map((id) => (
							<Chip
								key={id}
								label={getSiteName(id)}
								onDelete={() => handleRemoveExcluded(id)}
								size="small"
								color="error"
								variant="outlined"
							/>
						))}
						{form.internal_excluded_sites.length === 0 && (
							<Typography
								variant="caption"
								color="text.disabled"
								sx={{ fontStyle: "italic", m: "auto 0" }}
							>
								None
							</Typography>
						)}
					</Box>
				</Box>

				{/* Leased Sites */}
				<Box>
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							mb: 1,
						}}
					>
						<Typography
							variant="caption"
							fontWeight="bold"
							color="text.secondary"
							sx={{ display: "flex", alignItems: "center", gap: 1 }}
						>
							<Handshake fontSize="inherit" /> LEASED SITES
						</Typography>
						<Button
							size="small"
							startIcon={<AddIcon />}
							onClick={() => setLeasedDialogOpen(true)}
							sx={{ fontSize: "0.7rem" }}
						>
							Add
						</Button>
					</Box>
					<List
						dense
						disablePadding
						sx={{
							border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
							borderRadius: 1,
							bgcolor: alpha(theme.palette.background.default, 0.2),
						}}
					>
						{form.internal_leased_sites.length === 0 ? (
							<ListItem>
								<ListItemText
									secondary="No leased sites configured."
									secondaryTypographyProps={{
										sx: { fontStyle: "italic", opacity: 0.7 },
									}}
								/>
							</ListItem>
						) : (
							form.internal_leased_sites.map((item) => (
								<ListItem
									key={item.siteId}
									divider
									secondaryAction={
										<IconButton
											size="small"
											edge="end"
											onClick={() => handleRemoveLeased(item.siteId)}
										>
											<DeleteIcon fontSize="small" />
										</IconButton>
									}
								>
									<ListItemText
										primary={getSiteName(item.siteId)}
										secondary={item.description}
										primaryTypographyProps={{
											fontSize: "0.85rem",
											fontWeight: 500,
										}}
										secondaryTypographyProps={{
											fontSize: "0.75rem",
											color: "info.main",
										}}
									/>
								</ListItem>
							))
						)}
					</List>
				</Box>
			</Stack>

			<Dialog
				open={leasedDialogOpen}
				onClose={() => setLeasedDialogOpen(false)}
				maxWidth="xs"
				fullWidth
			>
				<DialogTitle sx={{ bgcolor: theme.palette.background.default }}>
					Add Leased Site
				</DialogTitle>
				<DialogContent sx={{ bgcolor: theme.palette.background.default }}>
					<Stack spacing={2} sx={{ mt: 1 }}>
						<Autocomplete
							options={availableSitesForLease}
							getOptionLabel={(option) =>
								`${option.name} (${option.systemName})`
							}
							onChange={(_, val) =>
								setNewLease((prev) => ({ ...prev, site: val }))
							}
							renderInput={(params) => (
								<TextField {...params} label="Select Site" size="small" />
							)}
							slotProps={{
								paper: {
									sx: {
										bgcolor: theme.palette.background.default,
										backgroundImage: "none",
									},
								},
							}}
						/>
						<TextField
							label="Description"
							placeholder="e.g. Leased to Corp"
							fullWidth
							size="small"
							value={newLease.desc}
							onChange={(e) =>
								setNewLease((prev) => ({ ...prev, desc: e.target.value }))
							}
						/>
					</Stack>
				</DialogContent>
				<DialogActions sx={{ bgcolor: theme.palette.background.default }}>
					<Button onClick={() => setLeasedDialogOpen(false)}>Cancel</Button>
					<Button
						variant="contained"
						onClick={handleAddLeased}
						disabled={!newLease.site || !newLease.desc}
					>
						Add
					</Button>
				</DialogActions>
			</Dialog>
		</Paper>
	);
};

export default GlobalSettingsSection;
