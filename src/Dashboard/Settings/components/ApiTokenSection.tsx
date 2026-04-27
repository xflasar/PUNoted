import React, { useState, useEffect } from "react";
import {
	Box,
	Typography,
	Paper,
	Button,
	Stack,
	TextField,
	IconButton,
	Chip,
	Tooltip,
	InputAdornment,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	SelectChangeEvent,
	useTheme,
} from "@mui/material";
import {
	VpnKey,
	Add as AddIcon,
	ContentCopy,
	Groups as GroupsIcon,
	Edit as EditIcon,
	Delete as DeleteIcon,
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import type { ApiToken } from "../types";
import {
	MASTER_PERMISSIONS,
	API_BASE,
	apiTokensGuideSteps,
} from "../constants";
import { SectionHeader, transparentCardStyle } from "../styles";

// --- Sub-component: Edit Dialog ---
const TokenEditDialog: React.FC<{
	open: boolean;
	onClose: () => void;
	onSave: (form: { label: string; desc: string; perms: string[] }) => void;
	isEditing: boolean;
	initialData: { label: string; desc: string; perms: string[] };
}> = React.memo(({ open, onClose, onSave, isEditing, initialData }) => {
	const theme = useTheme();
	const [form, setForm] = useState(initialData);

	useEffect(() => {
		setForm(initialData);
	}, [initialData]);

	const handlePermissionsChange = (event: SelectChangeEvent<string[]>) => {
		const {
			target: { value },
		} = event;
		const newValues = typeof value === "string" ? value.split(",") : value;
		if (newValues.includes("all") && !form.perms.includes("all")) {
			setForm({ ...form, perms: ["all"] });
			return;
		}
		if (form.perms.includes("all") && newValues.length > 1) {
			setForm({ ...form, perms: newValues.filter((p) => p !== "all") });
			return;
		}
		setForm({ ...form, perms: newValues });
	};

	const tokenOptions = [
		...MASTER_PERMISSIONS,
		{
			key: "all",
			label: "Full Access",
			desc: "Grants all current and future read permissions",
		},
	];

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="xs"
			fullWidth
			PaperProps={{ sx: { background: theme.palette.background.default } }}
		>
			<DialogTitle sx={{ fontSize: "1rem" }}>
				{isEditing ? "Edit API Token" : "New API Token"}
			</DialogTitle>
			<DialogContent>
				<TextField
					autoFocus
					label="Label"
					fullWidth
					margin="dense"
					size="small"
					value={form.label}
					onChange={(e) => setForm({ ...form, label: e.target.value })}
				/>
				<TextField
					label="Description"
					fullWidth
					margin="dense"
					size="small"
					value={form.desc}
					onChange={(e) => setForm({ ...form, desc: e.target.value })}
				/>
				<FormControl fullWidth margin="dense" size="small">
					<InputLabel>Permissions</InputLabel>
					<Select
						multiple
						value={form.perms}
						onChange={handlePermissionsChange}
						label="Permissions"
						renderValue={(s) => s.join(", ")}
						MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}
					>
						{tokenOptions.map((p) => (
							<MenuItem key={p.key} value={p.key} dense>
								<Box sx={{ display: "flex", flexDirection: "column" }}>
									<Typography variant="body2">{p.label}</Typography>
									<Typography
										variant="caption"
										color="text.secondary"
										sx={{ fontSize: "0.65rem" }}
									>
										{p.desc}
									</Typography>
								</Box>
							</MenuItem>
						))}
					</Select>
				</FormControl>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} size="small">
					Cancel
				</Button>
				<Button onClick={() => onSave(form)} variant="contained" size="small">
					Save
				</Button>
			</DialogActions>
		</Dialog>
	);
});

// --- Main Section Component ---
const ApiTokenSection: React.FC<{
	initialTokens: ApiToken[];
	headers: any;
	showSnackbar: (msg: string, type: any) => void;
}> = ({ initialTokens, headers, showSnackbar }) => {
	const theme = useTheme();
	const [apiTokens, setApiTokens] = useState<ApiToken[]>(initialTokens);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [dialogData, setDialogData] = useState<{
		isEditing: boolean;
		id: string | null;
		initialData: { label: string; desc: string; perms: string[] };
	}>({
		isEditing: false,
		id: null,
		initialData: { label: "", desc: "", perms: [] },
	});

	useEffect(() => {
		setApiTokens(initialTokens);
	}, [initialTokens]);

	const handleSave = async (form: {
		label: string;
		desc: string;
		perms: string[];
	}) => {
		if (!form.label || form.perms.length === 0)
			return showSnackbar("Label & permissions required", "warning");
		try {
			const { isEditing, id } = dialogData;
			const url = isEditing
				? `${API_BASE}/settings/tokens/${id}`
				: `${API_BASE}/settings/tokens`;
			const method = isEditing ? "PATCH" : "POST";
			const res = await fetch(url, {
				method,
				headers: { ...headers, "Content-Type": "application/json" },
				body: JSON.stringify({
					label: form.label,
					description: form.desc,
					permissions: form.perms,
				}),
			});
			if (!res.ok) throw new Error("Request failed");

			if (isEditing) {
				setApiTokens((prev) =>
					prev.map((t) =>
						t.id === id
							? {
									...t,
									...form,
									description: form.desc,
									permissions: form.perms,
								}
							: t,
					),
				);
			} else {
				const newToken = await res.json();
				setApiTokens((prev) => [newToken, ...prev]);
			}
			setDialogOpen(false);
			showSnackbar("Token saved", "success");
		} catch {
			showSnackbar("Failed to save token", "error");
		}
	};

	const handleDelete = async (id: string) => {
		if (!window.confirm("Revoke this token? This action cannot be undone."))
			return;
		try {
			await fetch(`${API_BASE}/settings/tokens/${id}`, {
				method: "DELETE",
				headers,
			});
			setApiTokens((prev) => prev.filter((t) => t.id !== id));
			showSnackbar("Token revoked", "info");
		} catch {
			showSnackbar("Failed", "error");
		}
	};

	const openDialog = (token?: ApiToken) => {
		if (token) {
			setDialogData({
				isEditing: true,
				id: token.id,
				initialData: {
					label: token.label,
					desc: token.description || "",
					perms: token.permissions,
				},
			});
		} else {
			setDialogData({
				isEditing: false,
				id: null,
				initialData: { label: "", desc: "", perms: [] },
			});
		}
		setDialogOpen(true);
	};

	return (
		<Paper sx={transparentCardStyle(theme)}>
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					mb: 1.5,
				}}
			>
				<SectionHeader
					icon={<VpnKey />}
					title="API Tokens"
					color={theme.palette.info.main}
					guideSteps={apiTokensGuideSteps}
				/>
				<Button
					size="small"
					variant="outlined"
					color="info"
					startIcon={<AddIcon />}
					onClick={() => openDialog()}
					sx={{ height: 24, fontSize: "0.7rem", px: 1 }}
				>
					Create
				</Button>
			</Box>

			<Box
				sx={{
					flexGrow: 1,
					overflowY: "auto",
					pr: 0.5,
					minHeight: 0, // Crucial for nested flex scrolling
					display: "flex",
					flexDirection: "column",
				}}
			>
				{apiTokens.length === 0 ? (
					<Box
						sx={{
							height: "100%",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							minHeight: 80,
							border: `1px dashed ${theme.palette.divider}`,
							borderRadius: 1,
						}}
					>
						<Typography
							variant="caption"
							color="text.secondary"
							sx={{ fontStyle: "italic" }}
						>
							No active tokens.
						</Typography>
					</Box>
				) : (
					<Stack spacing={1}>
						{apiTokens.map((token) => (
							<Paper
								key={token.id}
								variant="outlined"
								sx={{
									p: 1,
									bgcolor: "transparent",
									borderColor: alpha(theme.palette.text.primary, 0.1),
								}}
							>
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										gap: 1,
										mb: 0.5,
									}}
								>
									<Tooltip title={token.description || ""}>
										<Typography
											variant="body2"
											fontWeight="bold"
											sx={{ width: 100, flexShrink: 0, fontSize: "0.75rem" }}
											noWrap
										>
											{token.label}
										</Typography>
									</Tooltip>
									<TextField
										variant="standard"
										fullWidth
										size="small"
										value={token.token || token.token_prefix}
										InputProps={{
											disableUnderline: true,
											readOnly: true,
											sx: {
												fontFamily: "monospace",
												fontSize: "0.75rem",
												bgcolor: theme.palette.action.hover,
												px: 0.5,
												borderRadius: 1,
											},
											endAdornment: (
												<InputAdornment position="end">
													<IconButton
														size="small"
														onClick={() => {
															navigator.clipboard.writeText(
																token.token || token.token_prefix,
															);
															showSnackbar("Copied", "success");
														}}
														sx={{ p: 0.5 }}
													>
														<ContentCopy sx={{ fontSize: 14 }} />
													</IconButton>
												</InputAdornment>
											),
										}}
									/>
									<Box sx={{ display: "flex", flexShrink: 0 }}>
										{token.group_id && (
											<Tooltip title="Group Token">
												<GroupsIcon
													sx={{
														fontSize: 14,
														mr: 0.5,
														color: theme.palette.secondary.main,
													}}
												/>
											</Tooltip>
										)}
										<IconButton
											size="small"
											color="primary"
											onClick={() => openDialog(token)}
											sx={{ p: 0.5 }}
										>
											<EditIcon sx={{ fontSize: 14 }} />
										</IconButton>
										<IconButton
											size="small"
											color="error"
											onClick={() => handleDelete(token.id)}
											sx={{ p: 0.5 }}
										>
											<DeleteIcon sx={{ fontSize: 14 }} />
										</IconButton>
									</Box>
								</Box>
								<Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
									{token.permissions.map((perm) => (
										<Chip
											key={perm}
											label={perm}
											size="small"
											variant="outlined"
											sx={{
												height: 16,
												fontSize: "0.6rem",
												"& .MuiChip-label": { px: 0.5 },
											}}
										/>
									))}
								</Box>
							</Paper>
						))}
					</Stack>
				)}
			</Box>
			<TokenEditDialog
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				onSave={handleSave}
				isEditing={dialogData.isEditing}
				initialData={dialogData.initialData}
			/>
		</Paper>
	);
};

export default ApiTokenSection;
