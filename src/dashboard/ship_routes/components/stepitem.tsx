import React from "react";
import { Box, Typography } from "@mui/material";
import type { RouteStep } from "../../../types/ship_routes";

interface StepItemProps {
	step: RouteStep;
	stepNumber?: number;
	spanFullWidth?: boolean;
}

export const StepItem: React.FC<StepItemProps> = ({
	step,
	stepNumber,
	spanFullWidth = false,
}) => {
	const renderStepNumber = () => {
		if (stepNumber == null) return null;
		return (
			<Box
				sx={{
					width: 15,
					height: 15,
					borderRadius: "50%",
					bgcolor: "rgba(255, 255, 255, 0.06)",
					border: "1px solid rgba(255, 255, 255, 0.1)",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					fontSize: "0.58rem",
					color: "text.secondary",
					fontFamily: "monospace",
					fontWeight: 500,
					flexShrink: 0,
				}}
			>
				{stepNumber}
			</Box>
		);
	};

	const renderContent = () => {
		switch (step.type) {
			case "LOAD": {
				const hasRange = step.min_units != null && step.max_units != null;
				const rangeText = hasRange
					? `${step.min_units} – ${step.max_units} u`
					: step.max_units != null
						? `Max: ${step.max_units} u`
						: step.min_units != null
							? `Min: ${step.min_units} u`
							: "";

				return (
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							width: "100%",
							gap: 1,
						}}
					>
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 0.6,
								minWidth: 0,
							}}
						>
							{renderStepNumber()}

							<Typography
								variant="caption"
								sx={{
									color: "#00e676",
									fontSize: "0.68rem",
									fontWeight: 500,
									letterSpacing: 0.5,
									flexShrink: 0,
								}}
							>
								LOAD
							</Typography>

							<Typography
								variant="caption"
								sx={{
									color: "#fff",
									bgcolor: "rgba(0, 230, 118, 0.12)",
									border: "1px solid rgba(0, 230, 118, 0.25)",
									px: 0.5,
									py: 0.05,
									borderRadius: 0.6,
									fontSize: "0.68rem",
									fontFamily: "monospace",
									flexShrink: 0,
								}}
							>
								{step.material_ticker || "???"}
							</Typography>
						</Box>

						<Box textAlign="right" minWidth={0} flexShrink={0}>
							<Typography
								variant="caption"
								sx={{
									color: "#e0e0e0",
									fontSize: "0.68rem",
									whiteSpace: "nowrap",
								}}
							>
								{rangeText}
							</Typography>
							{step.retain != null && step.retain > 0 && (
								<Typography
									variant="caption"
									sx={{
										color: "#ffb74d",
										fontSize: "0.62rem",
										display: "block",
										lineHeight: 1,
									}}
								>
									Retain: {step.retain}
								</Typography>
							)}
						</Box>
					</Box>
				);
			}

			case "UNLOAD":
				return (
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							width: "100%",
							gap: 1,
						}}
					>
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 0.6,
								minWidth: 0,
							}}
						>
							{renderStepNumber()}

							<Typography
								variant="caption"
								sx={{
									color: "#ff9100",
									fontSize: "0.68rem",
									fontWeight: 500,
									letterSpacing: 0.5,
									flexShrink: 0,
								}}
							>
								UNLOAD
							</Typography>

							<Typography
								variant="caption"
								sx={{
									color: "#fff",
									bgcolor: "rgba(255, 145, 0, 0.12)",
									border: "1px solid rgba(255, 145, 0, 0.25)",
									px: 0.5,
									py: 0.05,
									borderRadius: 0.6,
									fontSize: "0.68rem",
									fontFamily: "monospace",
									flexShrink: 0,
								}}
							>
								{step.material_ticker || "???"}
							</Typography>
						</Box>

						{step.max_units != null && (
							<Typography
								variant="caption"
								sx={{
									color: "#e0e0e0",
									fontSize: "0.68rem",
									whiteSpace: "nowrap",
									flexShrink: 0,
								}}
							>
								Target: {step.max_units} u
							</Typography>
						)}
					</Box>
				);

			case "REFUEL":
				return (
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							width: "100%",
							gap: 1,
						}}
					>
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 0.6,
								minWidth: 0,
							}}
						>
							{renderStepNumber()}

							<Typography
								variant="caption"
								sx={{
									color: "#00e5ff",
									fontSize: "0.68rem",
									fontWeight: 500,
									letterSpacing: 0.5,
									flexShrink: 0,
								}}
							>
								REFUEL
							</Typography>

							<Typography
								variant="caption"
								sx={{
									color: "#00e5ff",
									bgcolor: "rgba(0, 229, 255, 0.1)",
									border: "1px solid rgba(0, 229, 255, 0.25)",
									px: 0.5,
									py: 0.05,
									borderRadius: 0.6,
									fontSize: "0.68rem",
									fontFamily: "monospace",
									flexShrink: 0,
								}}
							>
								{step.fuel_type || "FUEL"}
							</Typography>
						</Box>

						{step.max_units != null && (
							<Typography
								variant="caption"
								sx={{
									color: "text.secondary",
									fontSize: "0.68rem",
									whiteSpace: "nowrap",
									flexShrink: 0,
								}}
							>
								Cap: {step.max_units}%
							</Typography>
						)}
					</Box>
				);

			case "WAIT":
				return (
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							width: "100%",
						}}
					>
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 0.6,
								minWidth: 0,
							}}
						>
							{renderStepNumber()}

							<Typography
								variant="caption"
								sx={{
									color: "#ce93d8",
									fontSize: "0.68rem",
									fontWeight: 500,
									letterSpacing: 0.5,
									flexShrink: 0,
								}}
							>
								WAIT
							</Typography>
						</Box>

						<Typography
							variant="caption"
							sx={{
								color: "text.secondary",
								fontSize: "0.68rem",
								flexShrink: 0,
							}}
						>
							{step.wait_amount || 0} {step.wait_unit?.toLowerCase() || "min"}
						</Typography>
					</Box>
				);

			case "LOAD_SHIPMENT":
			case "UNLOAD_SHIPMENT":
				return (
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							width: "100%",
						}}
					>
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 0.6,
								minWidth: 0,
							}}
						>
							{renderStepNumber()}

							<Typography
								variant="caption"
								sx={{
									color: "#ffd54f",
									fontSize: "0.68rem",
									fontWeight: 500,
									letterSpacing: 0.5,
									flexShrink: 0,
								}}
							>
								{step.type.replace("_SHIPMENT", "")}
							</Typography>
						</Box>
						<Typography
							variant="caption"
							sx={{ color: "text.secondary", fontSize: "0.66rem" }}
						>
							SHIPMENT
						</Typography>
					</Box>
				);

			default:
				return (
					<Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
						{renderStepNumber()}
						<Typography
							variant="caption"
							sx={{ color: "text.secondary", fontSize: "0.68rem" }}
						>
							{step.type}
						</Typography>
					</Box>
				);
		}
	};

	return (
		<Box
			sx={{
				px: 0.8,
				py: 0.35,
				bgcolor: "rgba(255, 255, 255, 0.02)",
				border: "1px solid rgba(255, 255, 255, 0.04)",
				borderRadius: 0.8,
				width: "100%",
				boxSizing: "border-box",
				gridColumn: spanFullWidth ? "1 / -1" : undefined,
				transition: "background 0.15s ease",
				"&:hover": {
					bgcolor: "rgba(255, 255, 255, 0.04)",
				},
			}}
		>
			{renderContent()}
		</Box>
	);
};
