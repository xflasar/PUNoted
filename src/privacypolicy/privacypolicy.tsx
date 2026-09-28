import React from "react";
import { Box, Typography, Link, useMediaQuery } from "@mui/material";
import { useTheme, alpha } from "@mui/system";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import {
	BackgroundBox,
	ConsoleWrapper,
	SectionCard,
	BackButton,
} from "./styles";

const BulletPoint: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const theme = useTheme();
	return (
		<Box
			sx={{
				display: "flex",
				gap: 1,
				color: theme.palette.text.secondary,
				fontSize: "0.82rem",
				lineHeight: 1.5,
			}}
		>
			<Box sx={{ color: theme.palette.primary.main, fontWeight: "bold" }}>
				•
			</Box>
			<Box>{children}</Box>
		</Box>
	);
};

const PrivacyPolicy: React.FC = () => {
	const navigate = useNavigate();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

	return (
		<BackgroundBox>
			<ConsoleWrapper>
				{/* Header Section with CSS Grid centering */}
				<Box
					sx={{
						display: "grid",
						gridTemplateColumns: "1fr auto 1fr",
						alignItems: "center",
						width: "100%",
						mb: 2.5,
						pb: 2,
						borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
					}}
				>
					<Box sx={{ justifySelf: "start" }}>
						<BackButton
							onClick={() => navigate("/")}
							startIcon={<FaArrowLeft size={12} />}
						>
							Back
						</BackButton>
					</Box>
					<Typography
						variant={isMobile ? "h6" : "h5"}
						sx={{
							fontWeight: 700,
							color: theme.palette.text.primary,
							letterSpacing: "-0.01em",
							textAlign: "center",
						}}
					>
						Privacy Policy
					</Typography>
					<Box />
				</Box>

				<Typography
					variant="body2"
					sx={{
						color: theme.palette.text.secondary,
						mb: 2.5,
						fontSize: "0.82rem",
						lineHeight: 1.5,
					}}
				>
					This privacy policy provides information on how PUNoted (not a legal
					name or entity) uses and protects any information you provide using
					this website, browser extension, and API.
				</Typography>

				{/* 2-Column Compact Layout */}
				<Box
					sx={{
						display: "grid",
						gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
						gap: 2,
						mb: 2.5,
					}}
				>
					{/* Column 1: Why & What */}
					<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
						<SectionCard>
							<Typography
								variant="subtitle2"
								sx={{ fontWeight: 700, color: theme.palette.primary.main }}
							>
								1. Why Information is Collected
							</Typography>
							<Typography
								variant="body2"
								sx={{
									color: theme.palette.text.secondary,
									fontSize: "0.82rem",
									lineHeight: 1.5,
								}}
							>
								All collected information is used strictly to provide services
								back to you/authorized parties or to identify technical issues.
							</Typography>
							<Box
								sx={{
									mt: 0.5,
									display: "flex",
									flexDirection: "column",
									gap: 0.5,
								}}
							>
								<BulletPoint>Your information is never sold.</BulletPoint>
								<BulletPoint>
									Information is not shared unless explicitly requested (via API
									Token permissions).
								</BulletPoint>
							</Box>
						</SectionCard>

						<SectionCard>
							<Typography
								variant="subtitle2"
								sx={{ fontWeight: 700, color: theme.palette.secondary.main }}
							>
								2. What is Collected
							</Typography>
							<Typography
								variant="caption"
								sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}
							>
								LOGGING (Periodically Deleted):
							</Typography>
							<Box sx={{ display: "flex", flexDirection: "column", gap: 0.4 }}>
								<BulletPoint>IP Address</BulletPoint>
								<BulletPoint>Browser version (User Agent)</BulletPoint>
							</Box>
							<Typography
								variant="caption"
								sx={{
									color: theme.palette.text.secondary,
									fontWeight: 600,
									mt: 1,
								}}
							>
								ACCOUNT & API DATA (Saved until deletion request):
							</Typography>
							<Box sx={{ display: "flex", flexDirection: "column", gap: 0.4 }}>
								<BulletPoint>Username & password / Auth Token</BulletPoint>
								<BulletPoint>Prosperous Universe display name</BulletPoint>
								<BulletPoint>Game data (bases, user data, etc.)</BulletPoint>
							</Box>
						</SectionCard>
					</Box>

					{/* Column 2: Security & Control */}
					<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
						<SectionCard>
							<Typography
								variant="subtitle2"
								sx={{ fontWeight: 700, color: theme.palette.success.main }}
							>
								3. Security
							</Typography>
							<Typography
								variant="body2"
								sx={{
									color: theme.palette.text.secondary,
									fontSize: "0.82rem",
									lineHeight: 1.5,
								}}
							>
								Strong security measures are maintained to prevent unauthorized
								access, protect data integrity, and safeguard collected
								information.
							</Typography>
						</SectionCard>

						<SectionCard>
							<Typography
								variant="subtitle2"
								sx={{ fontWeight: 700, color: theme.palette.warning.main }}
							>
								4. Controlling Your Information
							</Typography>
							<Typography
								variant="body2"
								sx={{
									color: theme.palette.text.secondary,
									fontSize: "0.82rem",
									lineHeight: 1.5,
								}}
							>
								Public services operate with minimal data collection. Additional
								details are requested only when creating an account for extended
								functionality.
							</Typography>
							<Typography
								variant="body2"
								sx={{
									color: theme.palette.text.secondary,
									fontSize: "0.82rem",
									lineHeight: 1.5,
									mt: 0.5,
								}}
							>
								To request data deletion or ask questions about collected data,
								contact:{" "}
								<Link
									href="mailto:xflasar@gmail.com"
									sx={{
										color: theme.palette.primary.main,
										textDecoration: "none",
										fontWeight: 600,
										"&:hover": { textDecoration: "underline" },
									}}
								>
									xflasar@gmail.com
								</Link>
							</Typography>
						</SectionCard>
					</Box>
				</Box>

				{/* Compact Footer */}
				<Box
					sx={{
						borderTop: `1px solid ${alpha(theme.palette.common.white, 0.06)}`,
						pt: 1.5,
						mt: "auto",
						textAlign: "center",
					}}
				>
					<Typography
						variant="caption"
						sx={{ color: theme.palette.text.secondary }}
					>
						Developed by <b>Martin Flasar (xsupefly)</b> with contributions from{" "}
						<b>lumivient</b> and <b>raylu</b>.
					</Typography>
				</Box>
			</ConsoleWrapper>
		</BackgroundBox>
	);
};

export default PrivacyPolicy;
