import React, { useState } from "react";
import {
	Box,
	Typography,
	CircularProgress,
	Paper,
	useTheme,
	alpha,
} from "@mui/material";

import { ProductionCard } from "../production/productioncard";
import { SiteDrawerContent } from "../production/components/sitedrawercontent";
import { useSitesManager } from "./hooks/usesitesmanager";
import { SitesToolbar } from "./components/sitestoolbar";
import { EmpireSummary } from "./components/empiresummary";
import { LeasedSiteGroup } from "./components/leasedsitegroup";
import { DEFAULT_DAYS } from "./utils/constants";

const SitesPage: React.FC = () => {
	const theme = useTheme();
	const [collapsedTenants, setCollapsedTenants] = useState<
		Record<string, boolean>
	>({});

	const {
		loading,
		filteredSites,
		ownSites,
		leasedSites,
		processedSites,
		globalSummary,
		availableTenants,
		searchTerm,
		setSearchTerm,
		selectedSite,
		setSelectedSite,
		siteTargets,
		handleTargetChange,
		summaryOpen,
		setSummaryOpen,
		leaseFilter,
		setLeaseFilter,
		selectedTenants,
		setSelectedTenants,
		selectedSummarySites,
		setSelectedSummarySites,
		handleSelectSite,
	} = useSitesManager();

	const toggleTenant = (groupKey: string) => {
		setCollapsedTenants((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
	};

	if (loading) {
		return (
			<Box
				sx={{
					height: "100vh",
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
				}}
			>
				<CircularProgress color="primary" />
			</Box>
		);
	}

	if (selectedSite) {
		return (
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					height: "100vh",
					bgcolor: theme.palette.background.default,
					overflow: "hidden",
				}}
			>
				<Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
					<SiteDrawerContent
						siteFlow={selectedSite}
						globalTargetDays={
							siteTargets[selectedSite.siteid || ""] || DEFAULT_DAYS
						}
						onClose={() => setSelectedSite(null)}
					/>
				</Box>
			</Box>
		);
	}

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				height: "100vh",
				bgcolor: theme.palette.background.default,
				overflow: "hidden",
			}}
		>
			<Box sx={{ position: "relative" }}>
				<SitesToolbar
					summaryOpen={summaryOpen}
					setSummaryOpen={setSummaryOpen}
					filteredSitesCount={filteredSites.length}
					totalLinesCount={filteredSites.reduce(
						(acc, s) => acc + s.site.production_lines.length,
						0,
					)}
					leaseFilter={leaseFilter}
					setLeaseFilter={setLeaseFilter}
					availableTenants={availableTenants}
					selectedTenants={selectedTenants}
					setSelectedTenants={setSelectedTenants}
					searchTerm={searchTerm}
					setSearchTerm={setSearchTerm}
				/>
				<EmpireSummary
					summaryOpen={summaryOpen}
					processedSites={processedSites}
					selectedSummarySites={selectedSummarySites}
					setSelectedSummarySites={setSelectedSummarySites}
					globalSummary={globalSummary}
				/>
			</Box>

			{/* --- MAIN CONTENT --- */}
			<Box
				sx={{
					flex: 1,
					overflowY: "auto",
					p: { xs: 0.5, sm: 1 },
					width: "100%",
					overflowX: "hidden",
				}}
			>
				{/* 1. OWNED CORE SITES */}
				{ownSites.length > 0 && (
					<Paper
						variant="outlined"
						sx={{
							p: 0.5,
							borderRadius: "10px",
							bgcolor: alpha(theme.palette.background.default, 0.1),
							borderColor: alpha(theme.palette.primary.main, 0.25),
							borderTop: `3px solid ${theme.palette.primary.main}`,
						}}
					>
						<Typography
							variant="caption"
							sx={{
								fontWeight: 800,
								color: "text.secondary",
								display: "block",
								mb: 0.5,
								letterSpacing: 0.5,
							}}
						>
							OWNED SITES ({ownSites.length} SITES)
						</Typography>
						<Box
							sx={{
								display: "grid",
								gridTemplateColumns: {
									xs: "1fr",
									sm: "repeat(auto-fill, minmax(400px, 1fr))",
								},
								gap: 2,
								alignItems: "start",
							}}
						>
							{ownSites.map(({ site, richFlows }) => (
								<ProductionCard
									key={site.siteid || site.planet_name}
									siteId={site.siteid || ""}
									site={site}
									richFlows={richFlows}
									targetDays={siteTargets[site.siteid || ""] || DEFAULT_DAYS}
									onTargetDaysChange={(val) =>
										handleTargetChange(site.siteid || "", val)
									}
									onSelect={(s) => handleSelectSite(s)}
								/>
							))}
						</Box>
					</Paper>
				)}

				{/* 2. LEASED / LOANED SITES */}
				{Object.keys(leasedSites).length > 0 &&
					Object.entries(leasedSites).map(([groupKey, sites]) => (
						<LeasedSiteGroup
							key={groupKey}
							groupKey={groupKey}
							sites={sites}
							collapsed={collapsedTenants[groupKey] || false}
							onToggle={() => toggleTenant(groupKey)}
							siteTargets={siteTargets}
							onTargetDaysChange={handleTargetChange}
							onSelectSite={handleSelectSite}
						/>
					))}
				<Box sx={{ height: 80 }} />
			</Box>
		</Box>
	);
};

export default SitesPage;
