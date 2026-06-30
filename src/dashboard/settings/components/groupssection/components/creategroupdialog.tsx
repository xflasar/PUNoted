import React, { useState } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	Button,
	useTheme,
} from "@mui/material";

interface Props {
	open: boolean;
	onClose: () => void;
	onSave: (name: string, desc: string) => void;
}

export const CreateGroupDialog: React.FC<Props> = ({
	open,
	onClose,
	onSave,
}) => {
	const theme = useTheme();
	const [name, setName] = useState("");
	const [desc, setDesc] = useState("");

	const handleSave = () => {
		if (!name) return;
		onSave(name, desc);
		setName("");
		setDesc("");
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="xs"
			fullWidth
			slotProps={{
				paper: {
					sx: {
						bgcolor: theme.palette.background.default,
						backgroundImage: "none",
					},
				},
			}}
		>
			<DialogTitle>Create New Group</DialogTitle>
			<DialogContent>
				<TextField
					autoFocus
					margin="dense"
					label="Group Name"
					fullWidth
					size="small"
					value={name}
					onChange={(e) => setName(e.target.value)}
				/>
				<TextField
					margin="dense"
					label="Description"
					fullWidth
					size="small"
					multiline
					rows={2}
					value={desc}
					onChange={(e) => setDesc(e.target.value)}
				/>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} color="inherit">
					Cancel
				</Button>
				<Button onClick={handleSave} variant="contained" color="primary">
					Create
				</Button>
			</DialogActions>
		</Dialog>
	);
};
