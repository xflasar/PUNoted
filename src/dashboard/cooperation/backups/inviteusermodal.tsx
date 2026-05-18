import React, { useState, useEffect } from "react";
import {
	Box,
	Typography,
	Button,
	Modal,
	TextField,
	Alert,
	CircularProgress,
	Autocomplete,
	useTheme,
} from "@mui/material";
import type { Group } from "./types"; // Assuming Group type is imported from types.ts

// --- Placeholder/Mock User Data for Autocomplete ---
// Replace this with your actual server fetch function later.
interface UserSuggestion {
	uid: string;
	username: string; // The unique ID used for the invitation payload
	displayname: string; // The friendly name shown in the Autocomplete field
}

// In a real application, this function would call an API like /api/users/search?q={query}
const fetchUserSuggestions = async (): Promise<UserSuggestion[]> => {
	// Simulate API delay
	const response = await fetch("https://api.punoted.net/groups/all_users");

	if (response.ok) {
		return await response.json();
	} else {
		return [];
	}
};
// ----------------------------------------------------

const InviteUserModal: React.FC<{
	group: Group;
	currentUserId: string;
	open: boolean;
	onClose: () => void;
}> = ({ group, open, onClose }) => {
	// State to hold the selected user object from Autocomplete
	const [selectedUser, setSelectedUser] = useState<UserSuggestion | null>(null);
	// State for the list of users shown in the Autocomplete dropdown
	const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
	// State for the text input value (used for searching)
	const [inputValue, setInputValue] = useState("");

	const [loading, setLoading] = useState(false);
	const [searchLoading, setSearchLoading] = useState(false);
	const [status, setStatus] = useState<{
		message: string;
		severity: "success" | "error" | null;
	}>({ message: "", severity: null });
	const theme = useTheme();

	// Effect for handling user search/suggestions
	useEffect(() => {
		const loadSuggestions = async () => {
			setSearchLoading(true);
			try {
				// In a real app, replace this with your API call that takes 'inputValue' as a query
				const userList = await fetchUserSuggestions();
				setSuggestions(userList);
			} catch (error) {
				console.error("Failed to fetch user suggestions:", error);
				setSuggestions([]);
			} finally {
				setSearchLoading(false);
			}
		};

		loadSuggestions();
	}, []);

	// Handler for sending the invitation
	const handleInvite = async () => {
		// We use the selected user's unique username/email (selectedUser.username)
		// in the invitation payload, but show the displayName to the inviter.
		if (!selectedUser) return;

		setLoading(true);
		setStatus({
			message: `Sending invitation to ${selectedUser.displayname}...`,
			severity: null,
		});

		try {
			// NOTE: The API endpoint structure remains the same as your original plan.
			const response = await fetch(
				`https://api.punoted.net/groups/${group.id}/invite`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${localStorage.getItem("authToken")}`,
					},
					body: JSON.stringify({
						invitee_username: selectedUser.displayname,
						group_id: group.id,
					}),
				},
			);

			const data = await response.json();

			if (response.ok) {
				// Check for 200/202 status codes
				// If your backend returns 202 and a token, display it (or just the success message)
				const tokenMessage = data.token ? `Token: ${data.token}` : "";
				setStatus({
					message: `Invitation sent to ${selectedUser.displayname}! ${tokenMessage}`,
					severity: "success",
				});
				setSelectedUser(null);
				setInputValue("");
				setSuggestions([]);
			} else {
				setStatus({
					message:
						data.detail || "Failed to send invitation. Check permissions.",
					severity: "error",
				});
			}
		} catch (error) {
			setStatus({
				message: "Network error during invitation.",
				severity: "error",
			});
		} finally {
			setLoading(false);
		}
	};

	// Reset state when modal closes
	useEffect(() => {
		if (!open) {
			setStatus({ message: "", severity: null });
			setSelectedUser(null);
			setInputValue("");
			setSuggestions([]);
		}
	}, [open]);

	const inviteDisabled = loading || !selectedUser;

	return (
		<Modal open={open} onClose={onClose}>
			<Box
				sx={{
					position: "absolute",
					top: "50%",
					left: "50%",
					transform: "translate(-50%, -50%)",
					width: 400,
					background: theme.palette.background.paper,
					borderRadius: 2,
					boxShadow: 24,
					p: 4,
				}}
			>
				<Typography variant="h6" component="h2" sx={{ mb: 2 }}>
					Invite User to {group.name}
				</Typography>

				<Autocomplete
					options={suggestions}
					getOptionLabel={(option) => option.displayname}
					isOptionEqualToValue={(option, value) => option.uid === value.uid}
					loading={searchLoading}
					value={selectedUser}
					onChange={(_event, newValue) => {
						setSelectedUser(newValue);
						setStatus({ message: "", severity: null }); // Clear status on selection change
					}}
					inputValue={inputValue}
					onInputChange={(_event, newInputValue) => {
						setInputValue(newInputValue);
					}}
					slotProps={{
						listbox: {
							sx: (theme) => ({
								background: theme.palette.background.paper,
							}),
						},
					}}
					renderInput={(params) => (
						<TextField
							{...params}
							label="Search User (by Display Name)"
							variant="outlined"
							fullWidth
							margin="normal"
							sx={{ mb: 2 }}
							InputProps={{
								...params.InputProps,
								endAdornment: (
									<>
										{searchLoading ? (
											<CircularProgress color="inherit" size={20} />
										) : null}
										{params.InputProps.endAdornment}
									</>
								),
							}}
						/>
					)}
				/>

				{status.message && (
					<Alert
						severity={status.severity || "info"}
						sx={{ mb: 2, overflowWrap: "break-word" }}
					>
						{status.message}
					</Alert>
				)}
				<Button
					onClick={handleInvite}
					variant="contained"
					color="primary"
					fullWidth
					disabled={inviteDisabled}
				>
					{loading ? "Sending..." : "Send Invitation"}
				</Button>
				<Button onClick={onClose} fullWidth sx={{ mt: 1 }}>
					Close
				</Button>
			</Box>
		</Modal>
	);
};

export default InviteUserModal;
