import React from "react";
import {
	Grid,
	Box,
	Typography,
	Paper,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	Chip,
	useTheme,
} from "@mui/material";
import { Check, ShieldAlert, AlertTriangle, Info } from "lucide-react";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { TransportRecommendation } from "./types";
import RecommendationCard from "./components/RecommendationCard";

interface AutomatedLogisticsProps {
	recommendations: TransportRecommendation[];
	onApprove: (id: string) => void;
	onReject: (id: string) => void;
}

const priorityOrder: TransportRecommendation["priority"][] = [
	"critical",
	"high",
	"medium",
	"low",
];

const priorityMeta = {
	critical: { label: "Critical", color: "error", icon: <ShieldAlert /> },
	high: { label: "High", color: "warning", icon: <AlertTriangle /> },
	medium: { label: "Info", color: "info", icon: <Info /> },
	low: { label: "Low", color: "success", icon: <Check /> },
};

const AutomatedLogistics: React.FC<AutomatedLogisticsProps> = ({
	recommendations,
	onApprove,
	onReject,
}) => {
	const theme = useTheme();

	if (!recommendations || recommendations.length === 0) {
		return (
			<Paper elevation={2} sx={{ p: 4, textAlign: "center" }}>
				<Check size={48} color={theme.palette.success.main} />
				<Typography variant="h6" sx={{ mt: 2 }}>
					System Balanced
				</Typography>
				<Typography color="text.secondary">
					No transport recommendations at this time.
				</Typography>
			</Paper>
		);
	}

	const groupedRecommendations = {
		critical: recommendations.filter((r) => r.priority === "critical"),
		high: recommendations.filter((r) => r.priority === "high"),
		medium: recommendations.filter((r) => r.priority === "medium"),
		low: recommendations.filter((r) => r.priority === "low"),
	};

	return (
		<Box>
			<Typography variant="h5" component="h2" gutterBottom>
				Automated Transport Recommendations
			</Typography>

			{priorityOrder.map((priority) => {
				const recs = groupedRecommendations[priority];
				if (!recs || recs.length === 0) return null;

				const meta = priorityMeta[priority];

				return (
					<Accordion
						key={priority}
						defaultExpanded={priority === "critical" || priority === "high"}
						sx={{
							backgroundImage: "none",
							"&.Mui-expanded": { margin: "8px 0" },
						}}
					>
						<AccordionSummary
							expandIcon={<ExpandMore />}
							aria-controls={`${priority}-content`}
							id={`${priority}-header`}
							sx={{
								backgroundColor: theme.palette.action.hover,
								"& .MuiAccordionSummary-content": {
									alignItems: "center",
									gap: 2,
								},
							}}
						>
							<Chip
								label={meta.label}
								color={meta.color as any}
								icon={meta.icon}
							/>
							<Typography variant="subtitle1">
								{recs.length} recommendation(s)
							</Typography>
						</AccordionSummary>
						<AccordionDetails
							sx={{ backgroundColor: theme.palette.background.paper, p: 2 }}
						>
							<Grid container spacing={2}>
								{recs.map((rec) => (
									<Grid item xs={12} md={6} lg={4} key={rec.id}>
										<RecommendationCard
											recommendation={rec}
											onApprove={onApprove}
											onReject={onReject}
										/>
									</Grid>
								))}
							</Grid>
						</AccordionDetails>
					</Accordion>
				);
			})}
		</Box>
	);
};

export default AutomatedLogistics;
