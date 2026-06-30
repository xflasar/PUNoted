import React, { useState } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogContentText,
	DialogActions,
	Button,
} from "@mui/material";
import { CheckCircleOutlineOutlined } from "@mui/icons-material";
import { PermissionSelector } from "./permissionselector";

interface Props {
	open: boolean;
	groupName: string;
	onClose: () => void;
	onAccept: (perms: string[]) => void;
}

export const AcceptInviteDialog: React.FC<Props> = ({
	open,
	groupName,
	onClose,
	onAccept,
}) => {
	const [perms, setPerms] = useState<string[]>([]);

	const handleToggle = (key: string) =>
		setPerms((prev) =>
			prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
		);

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
			<DialogTitle>Join Group: {groupName}</DialogTitle>
			<DialogContent>
				<DialogContentText sx={{ mb: 2 }}>
					Select data to share. You can update this later.
				</DialogContentText>
				<PermissionSelector selected={perms} onToggle={handleToggle} />
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} color="error">
					Decline
				</Button>
				<Button
					onClick={() => onAccept(perms)}
					variant="contained"
					color="success"
					startIcon={<CheckCircleOutlineOutlined />}
				>
					Accept & Join
				</Button>
			</DialogActions>
		</Dialog>
	);
};
