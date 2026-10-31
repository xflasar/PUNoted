import React from "react";
import {
	Box,
	Tabs,
	Tab,
	TextField,
	InputAdornment,
	IconButton,
	useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

interface PublicBankingToolbarProps {
	selectedCurrency: string;
	onCurrencyChange: (currency: string) => void;
	searchQuery: string;
	onSearchChange: (query: string) => void;
}

export const PublicBankingToolbar: React.FC<PublicBankingToolbarProps> = ({
	selectedCurrency,
	onCurrencyChange,
	searchQuery,
	onSearchChange,
}) => {
	const theme = useTheme();

	return (
		<Box
			sx={{
				position: "relative",
				px: { xs: 2, md: 3 },
				py: 0.75,
				borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
				bgcolor: alpha(theme.palette.background.default, 0.4),
				display: "flex",
				justifyContent: { xs: "center", md: "flex-start" },
				alignItems: "center",
				flexWrap: { xs: "wrap", md: "nowrap" },
				gap: 1.5,
				minHeight: 46,
			}}
		>
			<Tabs
				value={selectedCurrency}
				onChange={(_, val) => onCurrencyChange(val)}
				sx={{
					minHeight: 34,
					"& .MuiTab-root": {
						textTransform: "none",
						fontWeight: 700,
						fontSize: "0.8rem",
						minHeight: 34,
						py: 0,
						px: 1.5,
					},
				}}
			>
				<Tab label="All Currencies" value="ALL" />
				<Tab label="ICA" value="ICA" />
				<Tab label="CIS" value="CIS" />
				<Tab label="AIC" value="AIC" />
				<Tab label="NCC" value="NCC" />
			</Tabs>

			{/* Search */}
			<Box
				sx={{
					position: { xs: "static", md: "absolute" },
					left: { md: "50%" },
					transform: { md: "translateX(-50%)" },
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					width: { xs: "100%", md: "auto" },
				}}
			>
				<TextField
					size="small"
					placeholder="Search bank or banker..."
					value={searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
					slotProps={{
						input: {
							startAdornment: (
								<InputAdornment position="start">
									<SearchIcon sx={{ fontSize: 16, color: "text.secondary" }} />
								</InputAdornment>
							),
							endAdornment: searchQuery ? (
								<InputAdornment position="end">
									<IconButton
										size="small"
										onClick={() => onSearchChange("")}
										edge="end"
									>
										<ClearIcon sx={{ fontSize: 14 }} />
									</IconButton>
								</InputAdornment>
							) : null,
						},
					}}
					sx={{
						width: { xs: "100%", sm: 300, md: 340 },
						"& .MuiOutlinedInput-root": {
							borderRadius: 1.5,
							bgcolor: alpha(theme.palette.background.default, 0.5),
							fontSize: "0.825rem",
							height: 34,
						},
					}}
				/>
			</Box>
		</Box>
	);
};
