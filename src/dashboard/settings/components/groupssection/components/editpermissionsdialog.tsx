import React, { useState, useEffect } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { PermissionSelector } from "./permissionselector";

interface Props {
	open: boolean;
	currentPerms: string[];
	onClose: () => void;
	onSave: (perms: string[]) => void;
}

export const EditPermissionsDialog: React.FC<Props> = ({
	open,
	currentPerms,
	onClose,
	onSave,
}) => {
	const theme = useTheme();
	const [perms, setPerms] = useState<string[]>(currentPerms);

	useEffect(() => {
		setPerms(currentPerms);
	}, [currentPerms, open]);

	const handleToggle = (key: string) =>
		setPerms((prev) =>
			prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
		);

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
			<DialogTitle
				sx={{ bgcolor: alpha(theme.palette.background.default, 0.95) }}
			>
				Edit Shared Data
			</DialogTitle>
			<DialogContent
				sx={{ bgcolor: alpha(theme.palette.background.default, 0.95) }}
			>
				<PermissionSelector selected={perms} onToggle={handleToggle} />
			</DialogContent>
			<DialogActions
				sx={{ bgcolor: alpha(theme.palette.background.default, 0.95) }}
			>
				<Button onClick={onClose}>Cancel</Button>
				<Button onClick={() => onSave(perms)} variant="contained">
					Save Changes
				</Button>
			</DialogActions>
		</Dialog>
	);
};
