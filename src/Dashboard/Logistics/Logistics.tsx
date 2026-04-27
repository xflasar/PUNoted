import React, { useState, useEffect } from "react";
import {
	Box,
	CircularProgress,
	Alert,
	ToggleButtonGroup,
	ToggleButton,
	Typography,
	Paper,
} from "@mui/material";
import SitesList from "./SitesList";
import ShipsList from "./ShipsList";
import AutomatedLogistics from "./AutomatedLogistics";
import type {
	Site,
	Ship,
	LogisticsSummary,
	TransportRecommendation,
	CX,
} from "./types";
import LogisticsOverview from "./LogisticsOverview";
import { Bot, User } from "lucide-react";

const API_BASE_URL = "http://localhost:9900"; // In a real app, use an env variable

const Logistics: React.FC = () => {
	const [sites, setSites] = useState<Site[]>([]);
	const [ships, setShips] = useState<Ship[]>([]);
	const [cxs, setCxs] = useState<CX[]>([]);
	const [summary, setSummary] = useState<LogisticsSummary | null>(null);
	const [recommendations, setRecommendations] = useState<
		TransportRecommendation[]
	>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [viewMode, setViewMode] = useState<"automated" | "manual">("manual");

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			setError(null);
			try {
				const endpoints = [
					"sites",
					"ships",
					"cxs",
					"summary",
					"recommendations",
				];
				const requests = endpoints.map((endpoint) =>
					fetch(`${API_BASE_URL}/logistics/${endpoint}`, {
						headers: {
							Authorization: `Bearer ${localStorage.getItem("authToken")}`,
						},
					}),
				);

				const responses = await Promise.all(requests);

				for (const res of responses) {
					if (!res.ok) {
						const errorBody = await res.text();
						console.error(
							`Failed to fetch data from ${res.url}: ${res.statusText}`,
							errorBody,
						);
						throw new Error(`Failed to fetch data: ${res.statusText}`);
					}
				}

				const [
					sitesData,
					shipsData,
					cxsData,
					summaryData,
					recommendationsData,
				] = await Promise.all(responses.map((res) => res.json()));

				setSites(Array.isArray(sitesData) ? sitesData : sitesData?.data || []);
				setShips(Array.isArray(shipsData) ? shipsData : shipsData?.data || []);
				setCxs(Array.isArray(cxsData) ? cxsData : cxsData ? [cxsData] : []);
				setSummary(summaryData || null);

				if (Array.isArray(recommendationsData)) {
					setRecommendations(recommendationsData);
				} else if (recommendationsData) {
					setRecommendations(recommendationsData.data || [recommendationsData]);
				} else {
					setRecommendations([]);
				}
			} catch (err: any) {
				console.error(err);
				setError(
					`Could not load logistics data. Please ensure the backend service is running. [${err.message}]`,
				);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	const handleViewChange = (
		event: React.MouseEvent<HTMLElement>,
		newView: "automated" | "manual" | null,
	) => {
		if (newView !== null) {
			setViewMode(newView);
		}
	};

	const handleAssignShip = async (shipId: string, siteId: string | null) => {
		const originalShips = ships;
		setShips(
			ships.map((ship) =>
				ship.id === shipId ? { ...ship, assignedSiteId: siteId } : ship,
			),
		);

		try {
			const response = await fetch(
				`${API_BASE_URL}/logistics/ships/${shipId}/assign`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${localStorage.getItem("authToken")}`,
					},
					body: JSON.stringify({ siteId }),
				},
			);
			if (!response.ok) throw new Error("Failed to assign ship.");
		} catch (err) {
			setShips(originalShips);
			setError("Failed to update ship assignment. Please try again.");
		}
	};

	const handleApproveRecommendation = (id: string) => {
		setRecommendations(recommendations.filter((rec) => rec.id !== id));
	};

	const handleRejectRecommendation = (id: string) => {
		setRecommendations(recommendations.filter((rec) => rec.id !== id));
	};

	if (loading) {
		return (
			<Box
				sx={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					height: "80vh",
				}}
			>
				<CircularProgress />
				<Typography variant="h6" sx={{ ml: 2 }}>
					Loading Logistics Data...
				</Typography>
			</Box>
		);
	}
	if (error) {
		return (
			<Box sx={{ p: 4 }}>
				<Alert severity="error">{error}</Alert>
			</Box>
		);
	}

	return (
		<Box
			sx={{
				p: 2,
				display: "flex",
				flexDirection: "column",
				height: "calc(100vh)",
				overflow: "hidden",
			}}
		>
			<Box sx={{ flexShrink: 0, mb: 2 }}>
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						mb: 2,
					}}
				>
					<Typography variant="h4">Logistics Dashboard</Typography>
					<ToggleButtonGroup
						value={viewMode}
						exclusive
						onChange={handleViewChange}
						aria-label="view mode"
					>
						<ToggleButton value="manual" aria-label="manual mode">
							<User size={20} style={{ marginRight: 8 }} />
							Manual
						</ToggleButton>
						<ToggleButton value="automated" aria-label="automated mode">
							<Bot size={20} style={{ marginRight: 8 }} />
							Automated
						</ToggleButton>
					</ToggleButtonGroup>
				</Box>
				<LogisticsOverview summary={summary} />
			</Box>

			<Box sx={{ flexGrow: 1, overflow: "hidden" }}>
				{viewMode === "automated" ? (
					<Paper sx={{ height: "100%", overflowY: "auto", p: 2 }}>
						<AutomatedLogistics
							recommendations={recommendations}
							onApprove={handleApproveRecommendation}
							onReject={handleRejectRecommendation}
						/>
					</Paper>
				) : (
					<Box
						sx={{ display: "flex", flexWrap: "wrap", gap: 2, height: "100%" }}
					>
						{/* Column 1: Sites */}
						<Box
							sx={{
								flex: "1 1 500px",
								minWidth: 350,
								display: "flex",
								flexDirection: "column",
								minHeight: 0,
								maxHeight: "100%",
								overflow: "hidden",
							}}
						>
							<Typography variant="h5" gutterBottom>
								Site Operations
							</Typography>
							<Paper
								sx={{
									flexGrow: 1,
									overflow: "hidden",
									display: "flex",
									flexDirection: "column",
									background: "transparent",
								}}
							>
								<SitesList sites={sites} ships={ships} />
							</Paper>
						</Box>

						{/* Column 2: Ships */}
						<Box
							sx={{
								flex: "1 1 500px",
								minWidth: 350,
								display: "flex",
								flexDirection: "column",
								minHeight: 0,
								maxHeight: "100%",
								overflow: "hidden",
							}}
						>
							<Typography variant="h5" gutterBottom>
								Fleet Management
							</Typography>
							<Paper
								sx={{
									flexGrow: 1,
									overflow: "hidden",
									display: "flex",
									flexDirection: "column",
									background: "transparent",
								}}
							>
								<ShipsList
									ships={ships}
									sites={[...sites, ...cxs]}
									onAssignShip={handleAssignShip}
								/>
							</Paper>
						</Box>
					</Box>
				)}
			</Box>
		</Box>
	);
};

export default Logistics;
