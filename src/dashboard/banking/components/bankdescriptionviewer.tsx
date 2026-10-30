import React, { useState } from "react";
import {
	Box,
	Typography,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	Chip,
	useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PolicyIcon from "@mui/icons-material/Policy";

interface BankDescriptionViewerProps {
	description?: string | null;
	bankName?: string;
}

export const BankDescriptionViewer: React.FC<BankDescriptionViewerProps> = ({
	description,
}) => {
	const theme = useTheme();
	const [expanded, setExpanded] = useState<boolean>(false);

	if (!description || !description.trim()) {
		return null;
	}

	return (
		<Accordion
			expanded={expanded}
			onChange={(_, isExpanded) => setExpanded(isExpanded)}
			disableGutters
			elevation={0}
			sx={{
				maxWidth: 680,
				mx: "auto",
				mt: 1,
				borderRadius: 1.5,
				bgcolor: alpha(theme.palette.background.paper, 0.4),
				backdropFilter: "blur(12px)",
				border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
				overflow: "hidden",
				"&:before": { display: "none" },
				transition: "all 0.2s ease-in-out",
			}}
		>
			<AccordionSummary
				expandIcon={<ExpandMoreIcon sx={{ color: theme.palette.primary.main, fontSize: 18 }} />}
				sx={{
					px: 1.5,
					py: 0.2,
					minHeight: 36,
					"&.Mui-expanded": { minHeight: 36 },
					"& .MuiAccordionSummary-content": {
						my: 0.3,
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						flexWrap: "wrap",
						gap: 1,
					},
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
					<PolicyIcon sx={{ fontSize: 16, color: "primary.main" }} />
					<Typography variant="caption" sx={{ fontWeight: 800, fontSize: "0.76rem", letterSpacing: 0.4 }}>
						BANK TERMS &amp; LENDING POLICIES
					</Typography>
				</Box>

				<Chip
					label={expanded ? "Collapse" : "Click to view rules"}
					size="small"
					variant="outlined"
					color="primary"
					sx={{ height: 18, fontSize: "0.62rem", fontWeight: 700 }}
				/>
			</AccordionSummary>

			<AccordionDetails
				sx={{
					px: 2.5,
					pb: 2.5,
					pt: 1.5,
					borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
					maxHeight: 380,
					overflowY: "auto",
					"&::-webkit-scrollbar": { width: 5 },
					"&::-webkit-scrollbar-thumb": {
						backgroundColor: alpha(theme.palette.divider, 0.3),
						borderRadius: 4,
					},
				}}
			>
				<Typography
					variant="body2"
					sx={{
						lineHeight: 1.6,
						whiteSpace: "pre-wrap",
						wordBreak: "break-word",
						overflowWrap: "anywhere",
						fontSize: "0.85rem",
						textAlign: "left",
					}}
				>
					{description.trim()}
				</Typography>
			</AccordionDetails>
		</Accordion>
	);
};
