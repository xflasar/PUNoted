import React, { useState, useEffect } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	Button,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Box,
	Typography,
	useTheme,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import { MASTER_PERMISSIONS } from "../../../constants";

interface Props {
	open: boolean;
	onClose: () => void;
	onSave: (form: { label: string; desc: string; perms: string[] }) => void;
	isEditing: boolean;
	initialData: { label: string; desc: string; perms: string[] };
}

export const TokenEditDialog: React.FC<Props> = ({
	open,
	onClose,
	onSave,
	isEditing,
	initialData,
}) => {
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
			slotProps={{
				paper: { sx: { background: theme.palette.background.default } },
			}}
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
						MenuProps={{ slotProps: { paper: { sx: { maxHeight: 300 } } } }}
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
};
