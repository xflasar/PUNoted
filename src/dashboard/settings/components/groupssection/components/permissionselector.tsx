import React from "react";
import { Box, Paper, Checkbox, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { MASTER_PERMISSIONS } from "../../../constants";

interface Props {
	selected: string[];
	onToggle: (key: string) => void;
}

export const PermissionSelector: React.FC<Props> = ({ selected, onToggle }) => {
	const theme = useTheme();
	return (
		<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
			{MASTER_PERMISSIONS.map((scope) => {
				const isSelected = selected.includes(scope.key);
				return (
					<Paper
						key={scope.key}
						variant="outlined"
						onClick={() => onToggle(scope.key)}
						sx={{
							p: 1,
							display: "flex",
							alignItems: "center",
							cursor: "pointer",
							borderColor: isSelected
								? theme.palette.success.main
								: alpha(theme.palette.text.disabled, 0.2),
							bgcolor: isSelected
								? alpha(theme.palette.success.main, 0.08)
								: "transparent",
							transition: "all 0.2s",
							"&:hover": { borderColor: theme.palette.primary.main },
						}}
					>
						<Checkbox
							checked={isSelected}
							size="small"
							color="success"
							sx={{ p: 0.5, mr: 1 }}
						/>
						<Box>
							<Typography variant="body2" sx={{ fontWeight: "bold" }}>
								{scope.label}
							</Typography>
							<Typography variant="caption" color="text.secondary">
								{scope.desc}
							</Typography>
						</Box>
					</Paper>
				);
			})}
		</Box>
	);
};
