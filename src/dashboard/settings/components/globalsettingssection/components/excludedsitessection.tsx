import React, { useState } from "react";
import {
	Box,
	Typography,
	Autocomplete,
	TextField,
	Chip,
	useTheme,
} from "@mui/material";
import { Block } from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import type { UserSite } from "../types";

interface Props {
	excludedSites: string[];
	allSites: UserSite[];
	getSiteName: (id: string) => string;
	onChange: (newExcluded: string[]) => void;
}

export const ExcludedSitesSection: React.FC<Props> = ({
	excludedSites,
	allSites,
	getSiteName,
	onChange,
}) => {
	const theme = useTheme();
	const [inputValue, setInputValue] = useState<UserSite | null>(null);

	const availableSites = allSites.filter(
		(s) => !excludedSites.includes(s.siteId),
	);

	const handleAdd = (_: any, value: UserSite | null) => {
		if (value && !excludedSites.includes(value.siteId)) {
			onChange([...excludedSites, value.siteId]);
			setInputValue(null);
		}
	};

	const handleRemove = (siteId: string) => {
		onChange(excludedSites.filter((id) => id !== siteId));
	};

	return (
		<Box>
			<Typography
				variant="caption"
				fontWeight="bold"
				color="text.secondary"
				sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}
			>
				<Block fontSize="inherit" /> EXCLUDED SITES
			</Typography>
			<Autocomplete
				value={inputValue}
				options={availableSites}
				getOptionLabel={(option) => `${option.name} (${option.systemName})`}
				onChange={handleAdd}
				isOptionEqualToValue={(option, value) => option.siteId === value.siteId}
				size="small"
				sx={{ mb: 1 }}
				slotProps={{
					paper: {
						sx: {
							bgcolor: theme.palette.background.default,
							backgroundImage: "none",
						},
					},
				}}
				renderInput={(params) => (
					<TextField
						{...params}
						size="small"
						placeholder="Select site to exclude..."
						sx={{
							bgcolor: alpha(theme.palette.background.default, 0.3),
							borderRadius: 1,
							"& .MuiOutlinedInput-notchedOutline": {
								borderColor: alpha(theme.palette.divider, 0.3),
							},
						}}
					/>
				)}
			/>
			<Box
				sx={{
					display: "flex",
					flexWrap: "wrap",
					gap: 0.5,
					p: 1,
					bgcolor: alpha(theme.palette.background.default, 0.2),
					borderRadius: 1,
					minHeight: 40,
					border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
				}}
			>
				{excludedSites.map((id) => (
					<Chip
						key={id}
						label={getSiteName(id)}
						onDelete={() => handleRemove(id)}
						size="small"
						color="error"
						variant="outlined"
					/>
				))}
				{excludedSites.length === 0 && (
					<Typography
						variant="caption"
						color="text.disabled"
						sx={{ fontStyle: "italic", m: "auto 0" }}
					>
						None
					</Typography>
				)}
			</Box>
		</Box>
	);
};
