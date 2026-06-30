import React, { useState, useEffect } from "react";
import {
	Box,
	Typography,
	Paper,
	Button,
	List,
	ListItem,
	ListItemText,
	ListItemSecondaryAction,
	Stack,
	Chip,
	Dialog,
	DialogTitle,
	DialogContent,
	TextField,
	Autocomplete,
	CircularProgress,
	IconButton,
	Switch,
	Tooltip,
	InputAdornment,
	useTheme,
} from "@mui/material";
import {
	CheckCircleOutlineOutlined,
	DeleteForever,
	VpnKey,
	Key,
	ContentCopy,
	PersonAdd,
	RemoveCircle as LeaveIcon,
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import { DeleteIcon, EditIcon } from "lucide-react";
import { MASTER_PERMISSIONS } from "../../../constants";
import { useGroupDetails } from "../hooks/usegroupdetails";
import { EditPermissionsDialog } from "./editpermissionsdialog";
import type { Group } from "../../../types";

interface Props {
	open: boolean;
	group: Group | null;
	currentUserId: string;
	onClose: () => void;
	onLeave: () => void;
	showSnackbar: (msg: string, type: any) => void;
}

export const GroupDetailDialog: React.FC<Props> = ({
	open,
	group,
	currentUserId,
	onClose,
	onLeave,
	showSnackbar,
}) => {
	const theme = useTheme();

	const {
		members,
		myPerms,
		searchUsers,
		inviteUser,
		updateMyPerms,
		toggleReadAccess,
		kickMember,
		leaveGroup,
		deleteGroup,
	} = useGroupDetails(group, currentUserId, onLeave, showSnackbar);

	const [inviteInput, setInviteInput] = useState("");
	const [userOptions, setUserOptions] = useState<string[]>([]);
	const [searchLoading, setSearchLoading] = useState(false);
	const [editPermsOpen, setEditPermsOpen] = useState(false);

	useEffect(() => {
		if (!inviteInput || inviteInput.length < 2) {
			setUserOptions((prev) => (prev.length === 0 ? prev : []));
			return;
		}
		const timer = setTimeout(async () => {
			setSearchLoading(true);
			const results = await searchUsers(inviteInput);
			setUserOptions(results);
			setSearchLoading(false);
		}, 300);
		return () => clearTimeout(timer);
	}, [inviteInput, searchUsers]);

	const handleInviteSubmit = () => {
		inviteUser(inviteInput, () => {
			setInviteInput("");
			setUserOptions([]);
		});
	};

	const renderPermTooltip = (perms: string[]) => (
		<Box sx={{ p: 0.5 }}>
			<Typography
				variant="caption"
				fontWeight="bold"
				sx={{
					mb: 1,
					display: "block",
					color: "common.white",
					borderBottom: "1px solid rgba(255,255,255,0.2)",
					pb: 0.5,
				}}
			>
				Sharing Data:
			</Typography>
			{!perms || perms.length === 0 ? (
				<Typography
					variant="caption"
					color="grey.400"
					sx={{ fontStyle: "italic" }}
				>
					No data shared
				</Typography>
			) : (
				MASTER_PERMISSIONS.map((scope) => {
					if (!perms.includes(scope.key)) return null;
					return (
						<Box
							key={scope.key}
							sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}
						>
							<CheckCircleOutlineOutlined
								sx={{ fontSize: 12, color: "success.light" }}
							/>
							<Typography variant="caption" sx={{ color: "common.white" }}>
								{scope.label}
							</Typography>
						</Box>
					);
				})
			)}
		</Box>
	);

	return (
		<Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
			<DialogTitle
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					bgcolor: alpha(theme.palette.background.default, 1),
				}}
			>
				<Box>
					<Typography variant="h6">{group?.name}</Typography>
					<Typography variant="caption" color="text.secondary">
						{group?.description || "Manage your group settings"}
					</Typography>
				</Box>
				<Box sx={{ display: "flex", gap: 1 }}>
					{!group?.is_owner && (
						<Button
							size="small"
							color="error"
							startIcon={<LeaveIcon />}
							onClick={leaveGroup}
						>
							Leave
						</Button>
					)}
					{group?.is_owner && (
						<Button
							size="small"
							color="error"
							startIcon={<DeleteForever />}
							onClick={deleteGroup}
						>
							Delete
						</Button>
					)}
					<Button onClick={onClose}>Close</Button>
				</Box>
			</DialogTitle>

			<DialogContent
				dividers
				sx={{ p: 0, bgcolor: alpha(theme.palette.background.default, 1) }}
			>
				<Box
					sx={{
						p: 3,
						bgcolor: alpha(theme.palette.success.main, 0.05),
						borderBottom: `1px solid ${theme.palette.divider}`,
					}}
				>
					<Typography
						variant="subtitle2"
						color="success.main"
						gutterBottom
						sx={{ display: "flex", alignItems: "center", gap: 1 }}
					>
						<VpnKey fontSize="small" /> Your Group API Key
					</Typography>
					<Paper
						variant="outlined"
						sx={{
							p: "2px 4px",
							display: "flex",
							alignItems: "center",
							bgcolor: theme.palette.background.default,
							borderColor: alpha(theme.palette.success.main, 0.3),
						}}
					>
						<InputAdornment position="start" sx={{ pl: 1 }}>
							<Key fontSize="small" color="action" />
						</InputAdornment>
						<TextField
							variant="standard"
							fullWidth
							value={group?.my_full_token || "Loading..."}
							InputProps={{
								disableUnderline: true,
								readOnly: true,
								sx: { fontFamily: "monospace", fontSize: "0.85rem" },
							}}
						/>
						<Tooltip title="Copy Key">
							<IconButton
								onClick={() => {
									navigator.clipboard.writeText(group?.my_full_token || "");
									showSnackbar("Copied", "success");
								}}
								color="primary"
							>
								<ContentCopy fontSize="small" />
							</IconButton>
						</Tooltip>
					</Paper>
				</Box>

				<Box sx={{ p: 2 }}>
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							mb: 2,
						}}
					>
						<Typography variant="subtitle2" fontWeight="bold">
							Members ({members.length})
						</Typography>
						<Button
							size="small"
							startIcon={<EditIcon />}
							onClick={() => setEditPermsOpen(true)}
						>
							Edit My Shared Data
						</Button>
					</Box>

					{group?.is_owner && (
						<Box sx={{ display: "flex", gap: 1, mb: 3 }}>
							<Autocomplete
								freeSolo
								fullWidth
								size="small"
								options={userOptions}
								loading={searchLoading}
								inputValue={inviteInput}
								onInputChange={(e, val) => setInviteInput(val)}
								slotProps={{ paper: { sx: { bgcolor: "background.default" } } }}
								renderInput={(params) => {
									// SAFELY DESTRUCTURE InputProps to preserve the ref anchoring for Autocomplete
									const { InputProps, ...restParams } = params;
									return (
										<TextField
											{...restParams}
											placeholder="Search user to invite..."
											InputProps={{
												...InputProps,
												startAdornment: (
													<InputAdornment position="start">
														<PersonAdd sx={{ color: "action.active" }} />
													</InputAdornment>
												),
												endAdornment: (
													<React.Fragment>
														{searchLoading ? (
															<CircularProgress color="inherit" size={20} />
														) : null}
														{InputProps?.endAdornment}
													</React.Fragment>
												),
											}}
										/>
									);
								}}
								renderOption={(props, option) => (
									<Box
										component="li"
										{...props}
										sx={{ bgcolor: "background.default" }}
									>
										{option.label || option}
									</Box>
								)}
							/>
							<Button
								variant="contained"
								onClick={handleInviteSubmit}
								sx={{ px: 3 }}
							>
								Invite
							</Button>
						</Box>
					)}

					<List dense disablePadding sx={{ maxHeight: 450, overflow: "auto" }}>
						{members.map((m) => {
							const isMe = m.user_id === currentUserId;
							return (
								<ListItem key={m.user_id} divider>
									<ListItemText
										disableTypography // FIXED: Prevents rendering <p> wrappers which caused the <div> collision
										primary={
											<Box
												sx={{ display: "flex", alignItems: "center", gap: 1 }}
											>
												<Typography variant="body2" fontWeight="bold">
													{m.username}
												</Typography>
												{isMe && (
													<Chip
														label="YOU"
														size="small"
														color="info"
														sx={{ height: 18, fontSize: "0.6rem" }}
													/>
												)}
												{m.user_id === group?.owner_id && (
													<Chip
														label="OWNER"
														size="small"
														color="warning"
														sx={{ height: 18, fontSize: "0.6rem" }}
													/>
												)}
											</Box>
										}
										secondary={
											<Stack
												direction="row"
												spacing={1}
												mt={0.5}
												alignItems="center"
											>
												{m.status === "INVITED" ? (
													<Chip
														label="Pending"
														size="small"
														color="warning"
														variant="outlined"
														sx={{ height: 20 }}
													/>
												) : (
													<Chip
														label="Active"
														size="small"
														color="success"
														variant="outlined"
														sx={{ height: 20 }}
													/>
												)}
												<Tooltip
													title={renderPermTooltip(m.granted_permissions)}
													arrow
													placement="top"
													componentsProps={{
														tooltip: {
															sx: {
																bgcolor: "rgba(0,0,0,0.9)",
																border: "1px solid #333",
															},
														},
													}}
												>
													<Typography
														variant="caption"
														color="text.secondary"
														sx={{
															cursor: "help",
															borderBottom: "1px dotted grey",
															"&:hover": { color: theme.palette.primary.main },
														}}
													>
														Sharing {m.granted_permissions?.length || 0} scopes
													</Typography>
												</Tooltip>
											</Stack>
										}
									/>
									<ListItemSecondaryAction>
										<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
											{group?.is_owner && !isMe ? (
												<>
													<Tooltip title="Allow read access">
														<Switch
															size="small"
															checked={m.can_read_data}
															onChange={() =>
																toggleReadAccess(m.user_id, m.can_read_data)
															}
														/>
													</Tooltip>
													<IconButton
														size="small"
														color="error"
														onClick={() => kickMember(m.user_id)}
													>
														<DeleteIcon fontSize="small" />
													</IconButton>
												</>
											) : (
												m.can_read_data && (
													<Chip
														label="Reader"
														size="small"
														color="success"
														variant="outlined"
														sx={{ height: 20 }}
													/>
												)
											)}
										</Box>
									</ListItemSecondaryAction>
								</ListItem>
							);
						})}
					</List>
				</Box>
			</DialogContent>

			<EditPermissionsDialog
				open={editPermsOpen}
				currentPerms={myPerms}
				onClose={() => setEditPermsOpen(false)}
				onSave={(newPerms) =>
					updateMyPerms(newPerms, () => setEditPermsOpen(false))
				}
			/>
		</Dialog>
	);
};
