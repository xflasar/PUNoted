import React, { useState } from "react";
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
import { apiTokensGuideSteps } from "../constants";
import { SectionHeader, transparentCardStyle } from "../styles";
import { useTokens } from "./apitokensection/hooks/usetokens";
import { TokenEditDialog } from "./apitokensection/components/tokeneditdialog";

const ApiTokenSection: React.FC<{
	initialTokens: ApiToken[];
	showSnackbar: (msg: string, type: any) => void;
}> = ({ initialTokens, showSnackbar }) => {
	const theme = useTheme();
	const { tokens, saveToken, deleteToken } = useTokens(
		initialTokens,
		showSnackbar,
	);
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

	const handleSave = async (form: {
		label: string;
		desc: string;
		perms: string[];
	}) => {
		if (!form.label || form.perms.length === 0)
			return showSnackbar("Label & permissions required", "warning");
		const success = await saveToken(form, dialogData.id);
		if (success) setDialogOpen(false);
	};

	const openDialog = (token?: ApiToken) => {
		setDialogData(
			token
				? {
						isEditing: true,
						id: token.id,
						initialData: {
							label: token.label,
							desc: token.description || "",
							perms: token.permissions,
						},
					}
				: {
						isEditing: false,
						id: null,
						initialData: { label: "", desc: "", perms: [] },
					},
		);
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
					display: "flex",
					flexDirection: "column",
				}}
			>
				{tokens.length === 0 ? (
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
						{tokens.map((token) => (
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
											onClick={() => deleteToken(token.id)}
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
											sx={{ height: 16, fontSize: "0.6rem" }}
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
