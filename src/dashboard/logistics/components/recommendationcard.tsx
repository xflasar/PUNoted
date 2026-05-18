import React from "react";
import { Paper, Box, Typography, Chip, Button, useTheme } from "@mui/material";
import { ArrowRight, Check, X } from "lucide-react";
import { TransportRecommendation } from "../types";

interface RecommendationCardProps {
	recommendation: TransportRecommendation;
	onApprove: (id: string) => void;
	onReject: (id: string) => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
	recommendation,
	onApprove,
	onReject,
}) => {
	const theme = useTheme();

	const getPriorityColor = (priority: TransportRecommendation["priority"]) => {
		switch (priority) {
			case "critical":
				return "error";
			case "high":
				return "warning";
			case "medium":
				return "info";
			default:
				return "default";
		}
	};

	return (
		<Paper
			elevation={3}
			sx={{ p: 2, display: "flex", flexDirection: "column", height: "100%" }}
		>
			<Box sx={{ flexGrow: 1 }}>
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						mb: 1,
					}}
				>
					<Typography variant="h6">Transport Task</Typography>
					<Chip
						label={recommendation.priority}
						color={getPriorityColor(recommendation.priority)}
						size="small"
						sx={{ textTransform: "capitalize" }}
					/>
				</Box>
				<Box sx={{ display: "flex", alignItems: "center", my: 2 }}>
					<Typography variant="body1">
						<strong>{recommendation.fromName || recommendation.fromId}</strong>
					</Typography>
					<ArrowRight style={{ margin: `0 ${theme.spacing(2)}` }} />
					<Typography variant="body1">
						<strong>{recommendation.toName || recommendation.toId}</strong>
					</Typography>
				</Box>
				<Typography variant="body1" gutterBottom>
					Move <strong>{recommendation.amount.toLocaleString()}</strong> units
					of <strong>{recommendation.materialTicker}</strong>
				</Typography>
				<Typography variant="body2" color="text.secondary">
					Reason: <em>{recommendation.reason}</em>
				</Typography>
			</Box>
			<Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
				<Button
					size="small"
					color="error"
					startIcon={<X />}
					onClick={() => onReject(recommendation.id)}
					sx={{ mr: 1 }}
				>
					Reject
				</Button>
				<Button
					size="small"
					variant="contained"
					color="success"
					startIcon={<Check />}
					onClick={() => onApprove(recommendation.id)}
				>
					Approve
				</Button>
			</Box>
		</Paper>
	);
};

export default RecommendationCard;
