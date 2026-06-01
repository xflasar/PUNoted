import { useState, useEffect } from "react";
import { Routes, Route, Navigate, Outlet, useNavigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import AppShell from "./appshell";
import LandingPage from "./landingpage/landingpage";
import PrivacyPolicy from "./privacypolicy/privacypolicy";
import CosmPage from "./cosm/cosmpage";
import ApiStatus from "./components/common/apistatus";
import "./app.css";
import { getApiStatus } from "./components/common/apistatusservice";
import StoragePage from "./dashboard/storagepage";
import DashboardPage from "./dashboard/dashboardpage";
import SitesPage from "./dashboard/sites/sitespage";
import GalaxyMap from "./galaxymap/galaxymap";
import CX from "./cx/cx";
import Settings from "./dashboard/settings/settings";
import CXDashboard from "./dashboard/cx/cxdashboard";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import Logistics from "./dashboard/logistics/logistics";
import Governance from "./dashboard/governance/governancepage";
import { CorporationOverview } from "./dashboard/corporation/corporationoverview";
import ShipmentPage from "./dashboard/shipping/shipmentpage";
import { ProductionLeaderboard } from "./public/leaderboard";
import FinancialOverview from "./dashboard/financial/financialoverview";
import { API_BASE_URL } from "./config/api";
import { BasePlanner } from "./dashboard/planner/baseplanner";

const isTokenValid = () => {
	const token = localStorage.getItem("authToken");
	const expiresAt = localStorage.getItem("expiresAt");
	if (!token || !expiresAt) {
		return false;
	}
	const currentTime = Math.floor(Date.now() / 1000);
	return parseInt(expiresAt, 10) > currentTime;
};

// This component checks if the user is logged in and handles redirection
const ProtectedRoute = ({
	isLoggedIn,
	isLoading,
}: {
	isLoggedIn: boolean;
	isLoading: boolean;
}) => {
	if (isLoading) {
		return (
			<Box
				sx={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					height: "100vh",
				}}
			>
				<CircularProgress />
			</Box>
		);
	}
	return isLoggedIn ? <Outlet /> : <Navigate to="/" replace />;
};

const ProtectedLayout = () => {
	return <AppShell />;
};

function App() {
	const [isLoggedIn, setIsLoggedIn] = useState(isTokenValid());
	const [isLoading, setIsLoading] = useState(true);
	const [apiStatus, setApiStatus] = useState<"online" | "offline">("online");
	const navigate = useNavigate();

	useEffect(() => {
		const checkStatus = async () => {
			const status = await getApiStatus();
			setApiStatus(status);
		};
		checkStatus();
		const intervalId = setInterval(checkStatus, 30000);
		return () => clearInterval(intervalId);
	}, []);

	useEffect(() => {
		const tokenIsValid = isTokenValid();
		setIsLoggedIn(tokenIsValid);
		setIsLoading(false);
		if (!tokenIsValid) {
			localStorage.removeItem("authToken");
			localStorage.removeItem("expiresAt");
			localStorage.removeItem("username");
		}
	}, []);

	// Synchronize
	useEffect(() => {
		// 1. Check if synchronization is already complete
		const isSynchronized = localStorage.getItem("isSynchronized") === "true";
		if (isSynchronized) {
			return;
		}

		// 2. Synchronization required, perform API check
		const checkSyncStatus = async () => {
			const token = localStorage.getItem("authToken");
			const userId = localStorage.getItem("currentUserId");
			if (!token) return;
			if (!userId) return;

			try {
				const response = await fetch(
					`${API_BASE_URL}users/${userId}/synchronized`,
					{
						method: "GET",
						headers: {
							Authorization: `Bearer ${token}`,
							"Content-Type": "application/json",
						},
					},
				);

				if (!response.ok) {
					// Handle non-200 responses (e.g., 401, 500) gracefully without crashing
					console.error("Failed to fetch sync status:", response.status);
					return;
				}

				const data = await response.json();

				// 3. Check the response data for synchronization status
				if (data.isSynchronized === true) {
					console.log("Synchronization complete. Updating local data.");
					if (data.userdata) {
						localStorage.setItem("displayName", data.displayname || "");
						localStorage.setItem("companyName", data.companyname || "");
						localStorage.setItem("companyCode", data.companycode || "");
						localStorage.setItem("corporationName", data.corpname || "");

						localStorage.setItem("isSynchronized", "true");
					} else {
						console.log("No userdata found!");
					}

					// Optionally, force a component re-render here if necessary,
					// e.g., by updating a state variable that triggers a UI change.
					// forceRerender();
				} else {
					// isSynchronized is false, so we wait for the next page load/refresh
					console.log("Database synchronization is still pending.");
				}
			} catch (error) {
				// Handle network errors or JSON parsing errors
				console.error("Network or processing error during sync check:", error);
			}
		};

		checkSyncStatus();
	}, []);

	const handleLoginSuccess = () => {
		setIsLoggedIn(true);
		navigate(0);
	};

	const handleLogout = () => {
		localStorage.removeItem("authToken");
		localStorage.removeItem("expiresAt");
		localStorage.removeItem("username");
		setIsLoggedIn(false);
		navigate("/");
	};

	return (
		<Box sx={{ height: "100vh", width: "100vw" }}>
			<Routes>
				{/* Public Routes */}
				<Route
					path="/"
					element={
						<LandingPage
							onLoginSuccess={handleLoginSuccess}
							isLoggedIn={isLoggedIn}
							onLogout={handleLogout}
						/>
					}
				/>
				<Route path="/privacy" element={<PrivacyPolicy />} />

				<Route path="/cosm" element={<CosmPage isLoggedIn={isLoggedIn} />} />

				<Route path="/galaxy-map" element={<GalaxyMap />} />

				<Route path="/cx" element={<CX />} />
				<Route path="/planner/:planId" element={<BasePlanner />} />

				{/* Protected Routes - These are nested under a protected layout */}
				<Route
					element={
						<ProtectedRoute isLoggedIn={isLoggedIn} isLoading={isLoading} />
					}
				>
					<Route element={<ProtectedLayout />}>
						<Route path="/dashboard/galaxy-map" element={<DashboardPage />} />
						<Route
							path="/dashboard/public-data"
							element={<div>PUBLIC DATA (WIP)</div>}
						/>
						<Route path="/dashboard/governance" element={<Governance />} />
						<Route path="/dashboard/cx" element={<CXDashboard />} />
						<Route
							path="/dashboard/cooperation"
							element={<>Cooperation (WIP)</>}
						/>
						<Route path="/dashboard/sites" element={<SitesPage />} />
						<Route path="/dashboard/planner" element={<BasePlanner />} />
						<Route
							path="/dashboard/planner/:planId"
							element={<BasePlanner />}
						/>
						<Route path="/dashboard/logistics" element={<Logistics />} />
						<Route
							path="/dashboard/contracts"
							element={<div>Contracts Page</div>}
						/>
						<Route path="/dashboard/shipments" element={<ShipmentPage />} />
						<Route path="/dashboard/storage" element={<StoragePage />} />
						<Route
							path="/dashboard/settings"
							element={
								<Settings userId={localStorage.getItem("currentUserId")!} />
							}
						/>
						<Route path="/dashboard/corp" element={<CorporationOverview />} />
						<Route
							path="/dashboard/leaderboard"
							element={<ProductionLeaderboard />}
						/>
						<Route
							path="/dashboard/financial"
							element={<FinancialOverview />}
						/>
					</Route>
				</Route>

				{/* Catch-all for unknown routes */}
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
			<ApiStatus apiStatus={apiStatus} />
		</Box>
	);
}

export default App;
