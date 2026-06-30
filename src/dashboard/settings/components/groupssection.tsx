import React, { useState } from "react";
import {
	Box,
	Typography,
	Paper,
	Button,
	List,
	ListItem,
	ListItemText,
	Alert,
	Stack,
	Chip,
	useTheme,
} from "@mui/material";
import {
	Groups as GroupsIcon,
	Add as AddIcon,
	NotificationsActive,
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import { dataGroupsGuideSteps } from "../constants";
import { transparentCardStyle, SectionHeader } from "../styles";
import type { Group } from "../types";
import { AcceptInviteDialog } from "./groupssection/components/acceptinvitedialog";
import { CreateGroupDialog } from "./groupssection/components/creategroupdialog";
import { GroupDetailDialog } from "./groupssection/components/groupdetaildialog";
import { useGroupsData } from "./groupssection/hooks/usegroupsdata";

interface Props {
	userId: string;
	showSnackbar: (msg: string, type: any) => void;
	wsTrigger: number;
}

const GroupsSection: React.FC<Props> = ({
	userId,
	showSnackbar,
	wsTrigger,
}) => {
	const theme = useTheme();

	const { groups, invites, fetchGroups, createGroup, acceptInvite } =
		useGroupsData(wsTrigger, showSnackbar);

	const [createOpen, setCreateOpen] = useState(false);
	const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
	const [acceptInviteData, setAcceptInviteData] = useState<{
		open: boolean;
		group: Group | null;
	}>({ open: false, group: null });

	const handleCreate = (name: string, desc: string) => {
		createGroup(name, desc, () => setCreateOpen(false));
	};

	const handleAcceptInvite = (perms: string[]) => {
		if (!acceptInviteData.group) return;
		acceptInvite(acceptInviteData.group, perms, (suffix) => {
			setAcceptInviteData({ open: false, group: null });
			alert(
				`You joined ${acceptInviteData.group?.name}.\n\nYour SECRET SUFFIX is: ${suffix}`,
			);
		});
	};

	return (
		<Paper sx={transparentCardStyle(theme)}>
			<SectionHeader
				icon={<GroupsIcon />}
				title="Data Groups"
				color={theme.palette.secondary.main}
				badge={invites.length}
				guideSteps={dataGroupsGuideSteps}
			/>

			{invites.length > 0 && (
				<Alert
					severity="info"
					variant="outlined"
					sx={{ mb: 2, bgcolor: alpha(theme.palette.background.default, 0.1) }}
				>
					<Typography
						variant="caption"
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 1,
							fontWeight: "bold",
						}}
					>
						<NotificationsActive fontSize="inherit" /> Pending Invites
					</Typography>
					<Stack spacing={1} mt={1}>
						{invites.map((inv: any) => (
							<Box
								key={inv.id}
								sx={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									p: 1,
									border: `1px solid ${theme.palette.info.main}`,
									borderRadius: 1,
								}}
							>
								<Typography variant="body2" sx={{ fontWeight: "bold" }}>
									{inv.name}
								</Typography>
								<Button
									size="small"
									variant="contained"
									color="success"
									onClick={() =>
										setAcceptInviteData({ open: true, group: inv })
									}
									sx={{ height: 24, fontSize: "0.7rem" }}
								>
									Review & Join
								</Button>
							</Box>
						))}
					</Stack>
				</Alert>
			)}

			<Box
				sx={{ flexGrow: 1, overflowY: "auto", mb: 1, maxHeight: 450, pr: 0.5 }}
			>
				<List dense disablePadding>
					{groups.map((g) => (
						<ListItem
							key={g.id}
							onClick={() => setSelectedGroup(g)}
							secondaryAction={
								g.is_owner ? (
									<Chip
										label="Owner"
										size="small"
										color="primary"
										sx={{ height: 20, fontSize: "0.65rem" }}
									/>
								) : null
							}
							sx={{
								cursor: "pointer",
								border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
								borderRadius: 1,
								mb: 1,
								transition: "all 0.2s",
								"&:hover": {
									bgcolor: alpha(theme.palette.primary.main, 0.05),
									borderColor: theme.palette.primary.main,
								},
							}}
						>
							<ListItemText
								primary={
									<Typography variant="body2" sx={{ fontWeight: "medium" }}>
										{g.name}
									</Typography>
								}
								secondary={
									<Typography variant="caption" color="text.secondary">
										{g.members_count || 1} members
									</Typography>
								}
							/>
						</ListItem>
					))}
				</List>
				{groups.length === 0 && invites.length === 0 && (
					<Box sx={{ py: 3, textAlign: "center", opacity: 0.6 }}>
						<Typography variant="caption">No groups yet.</Typography>
					</Box>
				)}
			</Box>

			<Button
				fullWidth
				variant="outlined"
				startIcon={<AddIcon />}
				onClick={() => setCreateOpen(true)}
				sx={{ mt: "auto" }}
			>
				Create Group
			</Button>

			<CreateGroupDialog
				open={createOpen}
				onClose={() => setCreateOpen(false)}
				onSave={handleCreate}
			/>

			{acceptInviteData.group && (
				<AcceptInviteDialog
					open={acceptInviteData.open}
					groupName={acceptInviteData.group.name}
					onClose={() => setAcceptInviteData({ open: false, group: null })}
					onAccept={handleAcceptInvite}
				/>
			)}

			<GroupDetailDialog
				open={!!selectedGroup}
				group={selectedGroup}
				currentUserId={userId}
				onClose={() => setSelectedGroup(null)}
				onLeave={() => {
					setSelectedGroup(null);
					fetchGroups();
				}}
				showSnackbar={showSnackbar}
			/>
		</Paper>
	);
};

export default GroupsSection;
