import React, { useState } from "react";
import {
	Modal,
	Box,
	Typography,
	TextField,
	Button,
	Alert,
	CircularProgress,
	IconButton,
} from "@mui/material";
import {
	Close as CloseIcon,
	PersonAdd as PersonAddIcon,
	EmailOutlined as EmailIcon,
} from "@mui/icons-material";

import type { Group } from "../types";

interface InviteUserModalProps {
	open: boolean;
	onClose: () => void;
	activeGroup: Group;
	onInviteSuccess: (updatedGroup: Group) => void;
	currentUserId: string;
}

const style = {
	position: "absolute" as "absolute",
	top: "50%",
	left: "50%",
	transform: "translate(-50%, -50%)",
	width: 400,
	bgcolor: "background.paper",
	borderRadius: 2,
	boxShadow: 24,
	p: 4,
};

const InviteUserModal: React.FC<InviteUserModalProps> = ({
	open,
	onClose,
	activeGroup,
	onInviteSuccess,
}) => {
	const [inviteeIdentifier, setInviteeIdentifier] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	const handleInvite = async () => {
		const identifier = inviteeIdentifier.trim();
		if (!identifier) {
			setError("Please enter a username, email, or user ID.");
			return;
		}

		setError(null);
		setSuccessMessage(null);
		setLoading(true);

		try {
			// MOCK: Replace with actual API call
			// const updatedGroup = await inviteUserToGroup(activeGroup.id, currentUserId, identifier);

			// --- MOCK API LOGIC ---
			// Simulate adding a user. In a real scenario, the API would return the updated group.
			const isUserAlreadyMember = activeGroup!.members.some(
				(m) => m.username === identifier || m.uid === identifier,
			);
			if (isUserAlreadyMember) {
				throw new Error(`User '${identifier}' is already a member.`);
			}

			const updatedGroup: Group = {
				...activeGroup,
				members: [
					...activeGroup.members,
					{
						uid: `user_${Math.random().toString(36).substring(7)}`,
						username: identifier,
						displayName: identifier,
						role: "viewer",
					},
				],
			};
			// --- END MOCK ---

			onInviteSuccess(updatedGroup);
			setSuccessMessage(`Successfully sent invite to ${identifier}.`);
			setInviteeIdentifier("");
		} catch (e) {
			console.error("Invite failed:", e);
			setError(
				(e as Error).message ||
					"Failed to send invitation. Please check the identifier.",
			);
		} finally {
			setLoading(false);
		}
	};

	const handleClose = () => {
		setInviteeIdentifier("");
		setError(null);
		setSuccessMessage(null);
		onClose();
	};

	return (
		<Modal open={open} onClose={handleClose}>
			<Box sx={style}>
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						mb: 2,
					}}
				>
					<Typography variant="h5" component="h2" sx={{ fontWeight: "bold" }}>
						<PersonAddIcon sx={{ mr: 1 }} /> Invite Member
					</Typography>
					<IconButton onClick={handleClose}>
						<CloseIcon />
					</IconButton>
				</Box>

				<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
					Add a new collaborator to the group **{activeGroup.name}**.
				</Typography>

				<TextField
					label="Username, Email, or User ID"
					variant="outlined"
					fullWidth
					margin="normal"
					value={inviteeIdentifier}
					onChange={(e) => setInviteeIdentifier(e.target.value)}
					onKeyPress={(e) => {
						if (e.key === "Enter" && !loading) handleInvite();
					}}
					error={!!error}
					helperText={error}
					InputProps={{
						startAdornment: (
							<EmailIcon sx={{ mr: 1, color: "action.active" }} />
						),
					}}
				/>

				{successMessage && (
					<Alert severity="success" sx={{ mt: 2 }}>
						{successMessage}
					</Alert>
				)}

				<Button
					variant="contained"
					color="primary"
					onClick={handleInvite}
					fullWidth
					disabled={loading}
					startIcon={
						loading ? (
							<CircularProgress size={20} color="inherit" />
						) : (
							<PersonAddIcon />
						)
					}
					sx={{ mt: 3 }}
				>
					{loading ? "Sending Invite..." : "Send Invitation"}
				</Button>
			</Box>
		</Modal>
	);
};

export default InviteUserModal;
