import React, { useState } from "react";
import {
	Button,
	Typography,
	Box,
	Link,
	Snackbar,
	Alert,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
} from "@mui/material";
import AuthenticationBox from "./auth/authenticationbox";
import {
	BackgroundBox,
	ConsoleWrapper,
	TimelineBadge,
	TimelineContainer,
	TimelineItem,
	TimelineNode,
} from "./styles";
import { LandingPageHeader } from "./components/landingpageheader";
import { useLandingPage } from "./hooks/uselandingpage";
import { InstructionsSetupDialog } from "./components/instructionssetupdialog";
import { ChangeLogDialog } from "./components/changelogdialog";

interface LandingPageProps {
	onLoginSuccess: () => void;
	onLogout: () => void;
	isLoggedIn: boolean;
}

const LandingPage: React.FC<LandingPageProps> = ({
	onLoginSuccess,
	onLogout,
	isLoggedIn,
}) => {
	const {
		showAuth,
		showInstructionsDialog,
		showChangelog,
		changelog,
		loadingChangelog,
		snackbar,
		theme,
		apiStatus,
		loggedInUsername,
		targetExtensionUrl,
		setTargetExtensionUrl,
		groupCommitsByDay,
		handleAuthButton,
		handleLogout,
		handleExtensionClick,
		handleOpenChangelog,
		setShowChangelog,
		setShowAuth,
		setShowInstructionsDialog,
	} = useLandingPage({ isLoggedIn, onLogout });

	if (showAuth) {
		return (
			<AuthenticationBox
				onLoginSuccess={onLoginSuccess}
				onBackToLanding={() => setShowAuth(false)}
			/>
		);
	}

	return (
		<BackgroundBox>
			<ConsoleWrapper>
				{/* Sticky Top Bar */}
				<LandingPageHeader
					isLoggedIn={isLoggedIn}
					loggedInUsername={loggedInUsername}
					handleLogout={handleLogout}
					handleAuthButton={handleAuthButton}
					handleExtensionClick={handleExtensionClick}
					handleOpenChangelog={handleOpenChangelog}
					apiStatus={apiStatus}
				/>
			</ConsoleWrapper>

			{/* Notifications Snackbar */}
			<Snackbar
				open={snackbar.open}
				autoHideDuration={6000}
				onClose={() => setSnackbar({ ...snackbar, open: false })}
				anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
			>
				<Alert
					onClose={() => setSnackbar({ ...snackbar, open: false })}
					severity={
						snackbar.severity as "success" | "info" | "warning" | "error"
					}
					sx={{ width: "100%" }}
				>
					{snackbar.message}
				</Alert>
			</Snackbar>

			{/* Instructions Setup Dialog */}
			<InstructionsSetupDialog
				open={showInstructionsDialog}
				setShowInstructionsDialog={setShowInstructionsDialog}
				targetExtensionUrl={targetExtensionUrl}
				setTargetExtensionUrl={setTargetExtensionUrl}
			/>

			{/* Changelog Dialog */}
			<ChangeLogDialog
				showChangelog={showChangelog}
				setShowChangelog={setShowChangelog}
				changelog={changelog}
				loadingChangelog={loadingChangelog}
				groupCommitsByDay={groupCommitsByDay}
			/>
		</BackgroundBox>
	);
};

export default LandingPage;
