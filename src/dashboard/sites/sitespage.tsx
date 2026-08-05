import React, { useState } from "react";
import { Box, Typography, CircularProgress, useTheme } from "@mui/material";

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
		groupLoanedMode,
		setGroupLoanedMode,
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
					groupLoanedMode={groupLoanedMode}
					setGroupLoanedMode={setGroupLoanedMode}
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
					p: { xs: 1, sm: 2 },
					width: "100%",
					overflowX: "hidden",
				}}
			>
				{/* 1. OWNED CORE SITES */}
				{(ownSites || []).length > 0 && (
					<Box sx={{ mb: 2 }}>
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 1,
								mb: 1,
								px: 0.5,
							}}
						>
							<Box
								sx={{
									width: 4,
									height: 16,
									bgcolor: theme.palette.primary.main,
									borderRadius: 1,
								}}
							/>
							<Typography
								sx={{
									fontWeight: 800,
									color: "text.primary",
									fontSize: "0.78rem",
									letterSpacing: "0.8px",
								}}
							>
								OWNED SITES ({(ownSites || []).length})
							</Typography>
						</Box>
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
							{(ownSites || []).map(({ site, richFlows }) => (
								<ProductionCard
									key={site.siteid || site.planet_name}
									siteId={site.siteid || ""}
									site={site}
									richFlows={richFlows}
									targetDays={siteTargets[site.siteid || ""] || DEFAULT_DAYS}
									onTargetDaysChange={(val) =>
										handleTargetChange(site.siteid || "", val)
									}
									onSelect={(s) => handleSelectSite && handleSelectSite(s)}
								/>
							))}
						</Box>
					</Box>
				)}

				{/* 2. LEASED / LOANED SITES */}
				{Object.keys(leasedSites || {}).length > 0 &&
					Object.entries(leasedSites || {}).map(([groupKey, sites]) => (
						<LeasedSiteGroup
							key={groupKey}
							groupKey={groupKey}
							sites={sites}
							collapsed={collapsedTenants[groupKey] || false}
							onToggle={() => toggleTenant(groupKey)}
							siteTargets={siteTargets}
							onTargetDaysChange={handleTargetChange}
							onSelectSite={(s) => handleSelectSite && handleSelectSite(s)}
						/>
					))}
			</Box>
		</Box>
	);
};

export default SitesPage;
