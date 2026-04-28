import { useState } from "react";
import {
	Box,
	Typography,
	Popover,
	IconButton,
	alpha,
	useTheme,
	Divider,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
} from "@mui/material";
import {
	HelpOutlineOutlined,
	Bolt,
	AutoFixHigh,
	InfoOutlined,
	SettingsSuggest,
} from "@mui/icons-material";

export interface GuideStep {
	title: string;
	description: string;
	type?: "info" | "action" | "feature";
}

interface SectionGuideProps {
	title: string;
	steps?: GuideStep[];
}

export const SectionGuide = ({ title, steps = [] }: SectionGuideProps) => {
	const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
	const theme = useTheme();

	const getIcon = (type?: string) => {
		switch (type) {
			case "action":
				return (
					<Bolt sx={{ fontSize: 16, color: theme.palette.warning.main }} />
				);
			case "feature":
				return (
					<AutoFixHigh
						sx={{ fontSize: 16, color: theme.palette.primary.main }}
					/>
				);
			default:
				return (
					<InfoOutlined sx={{ fontSize: 16, color: theme.palette.info.main }} />
				);
		}
	};

	return (
		<>
			<IconButton
				size="small"
				onClick={(e) => setAnchorEl(e.currentTarget)}
				sx={{ opacity: 1, ml: 0.5, p: 0.3, color: "primary.main" }}
			>
				<HelpOutlineOutlined sx={{ fontSize: 18 }} />
			</IconButton>
			<Popover
				open={!!anchorEl}
				anchorEl={anchorEl}
				onClose={() => setAnchorEl(null)}
				anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
				slotProps={{
					paper: {
						sx: {
							bgcolor: alpha(theme.palette.background.default, 0.98),
							backdropFilter: "blur(12px)",
							border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
							width: 320,
							maxHeight: 450,
							boxShadow: theme.shadows[20],
							borderRadius: 2,
							backgroundImage: "none",
						},
					},
				}}
			>
				<Box sx={{ p: 2 }}>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
						<SettingsSuggest
							sx={{
								color: "primary.main",
							}}
						/>
						<Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
							{title} Guide
						</Typography>
					</Box>
					<Divider sx={{ mb: 1, opacity: 0.5 }} />
					{steps && steps.length > 0 ? (
						<List dense disablePadding>
							{steps.map((step, idx) => (
								<ListItem
									key={idx}
									sx={{ px: 0, py: 0, alignItems: "flex-start" }}
								>
									<ListItemIcon sx={{ minWidth: 30, mt: 0.5 }}>
										{getIcon(step.type)}
									</ListItemIcon>
									<ListItemText
										primary={
											<Typography
												variant="caption"
												color="text.primary"
												sx={{ fontWeight: "bold" }}
											>
												{step.title}
											</Typography>
										}
										secondary={
											<Typography
												variant="caption"
												color="text.secondary"
												sx={{ display: "block", mt: 0.5, lineHeight: 1.4 }}
											>
												{step.description}
											</Typography>
										}
									/>
								</ListItem>
							))}
						</List>
					) : (
						<Typography variant="caption" color="error">
							No steps defined for this guide.
						</Typography>
					)}
				</Box>
			</Popover>
		</>
	);
};
