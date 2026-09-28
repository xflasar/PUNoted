import React from "react";
import { Box, Paper, Typography, Chip, Stack } from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import type { Props } from "./components/fullsummaryview/types";
import { CorpSummaryToolbar } from "./components/fullsummaryview/controls/corpsummarytoolbar";
import { CorpFilterDialog } from "./components/fullsummaryview/controls/corpfilterdialog";
import { RecipeDialog } from "./components/fullsummaryview/recipesettings/recipediaglog";
import { CorpSummaryView } from "./components/fullsummaryview/view/corpsummaryview";
import { useFullSummaryData } from "./components/fullsummary/usefullsumarrydata";

export const CorpFullSummaryView: React.FC<Props> = (props) => {
	const {
		productionSummary = [],
		balances = [],
		members = [],
		onPricingModeChange,
		onSelectedExchangeChange,
		onHideZeroFlowChange,
		recipeOverrides: externalRecipeOverrides,
		onRecipeOverrideChange,
	} = props;

	const {
		isMobile,
		activePricingMode,
		setInternalPricingMode,
		selectedExchange,
		setInternalExchange,
		hideZeroFlow,
		setInternalHideZeroFlow,
		recipeOverrides,
		setInternalRecipeOverrides,
		shareBasis,
		setShareBasis,
		flowDirectionFilter,
		setFlowDirectionFilter,
		sourceTypeFilter,
		setSourceTypeFilter,
		groupByCategory,
		setGroupByCategory,
		selectedCategories,
		toggleCategory,
		filterOpen,
		setFilterOpen,
		inputValue,
		setInputValue,
		exactMatch,
		setExactMatch,
		settingsOpen,
		setSettingsOpen,
		activeCurrencyCode,
		sortField,
		sortDirection,
		handleHeaderClick,
		renderSortIcon,
		getEffectivePrice,
		filteredRows,
		multiRecipeMaterials,
	} = useFullSummaryData(props);

	return (
		<Box
			sx={{
				p: isMobile ? 1 : 2,
				display: "flex",
				flexDirection: "column",
				gap: 1.5,
				flex: 1,
				minHeight: 0,
				height: "100%",
				overflow: "hidden",
			}}
		>
			{/* Liquid Currency Balances Row */}
			{balances.length > 0 && (
				<Paper
					sx={{
						p: 1.25,
						borderRadius: 2,
						bgcolor: "rgba(20, 20, 36, 0.5)",
						border: "1px solid rgba(123, 104, 238, 0.2)",
						flexShrink: 0,
					}}
				>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
						<AccountBalanceWalletIcon sx={{ color: "#64FFDA", fontSize: 16 }} />
						<Typography
							variant="caption"
							sx={{
								fontWeight: 800,
								color: "#FFFFFF",
								textTransform: "uppercase",
								letterSpacing: "0.04em",
							}}
						>
							Corp Member Liquid Balances
						</Typography>
					</Box>
					<Stack direction="row" spacing={1} flexWrap="wrap">
						{balances.map((b) => (
							<Chip
								key={b.currency}
								label={`${b.currency}: ${Math.round(b.amount).toLocaleString()}`}
								sx={{
									bgcolor: "rgba(100, 255, 218, 0.08)",
									color: "#64FFDA",
									border: "1px solid rgba(100, 255, 218, 0.25)",
									fontWeight: 700,
									fontSize: "0.74rem",
									height: 24,
								}}
							/>
						))}
					</Stack>
				</Paper>
			)}

			{/* Main Search & Control Toolbar */}
			<CorpSummaryToolbar
				inputValue={inputValue}
				onInputChange={setInputValue}
				exactMatch={exactMatch}
				onExactMatchToggle={() => setExactMatch(!exactMatch)}
				filterOpen={filterOpen}
				onFilterToggle={() => setFilterOpen(!filterOpen)}
				activePricingMode={activePricingMode}
				onPricingModeChange={onPricingModeChange || setInternalPricingMode}
				selectedExchange={selectedExchange}
				onSelectedExchangeChange={
					onSelectedExchangeChange || setInternalExchange
				}
				shareBasis={shareBasis}
				onShareBasisChange={setShareBasis}
				groupByCategory={groupByCategory}
				onGroupByCategoryToggle={() => setGroupByCategory(!groupByCategory)}
				multiRecipeCount={multiRecipeMaterials.length}
				onSettingsOpen={() => setSettingsOpen(true)}
			/>

			{/* Floating Categories & Flow Filters Modal */}
			<CorpFilterDialog
				open={filterOpen}
				onClose={() => setFilterOpen(false)}
				selectedCategories={selectedCategories}
				onToggleCategory={toggleCategory}
				flowDirectionFilter={flowDirectionFilter}
				onFlowDirectionChange={setFlowDirectionFilter}
				sourceTypeFilter={sourceTypeFilter}
				onSourceTypeChange={setSourceTypeFilter}
				hideZeroFlow={hideZeroFlow}
				onHideZeroFlowChange={onHideZeroFlowChange || setInternalHideZeroFlow}
			/>

			{/* Full Material Matrix View (Mobile Cards vs Desktop Table) */}
			<CorpSummaryView
				isMobile={isMobile}
				rows={filteredRows}
				members={members}
				activeCurrencyCode={activeCurrencyCode}
				sortField={sortField}
				sortDirection={sortDirection}
				onHeaderClick={handleHeaderClick}
				renderSortIcon={renderSortIcon}
				getEffectivePrice={getEffectivePrice}
				onRecipeSettingsOpen={() => setSettingsOpen(true)}
				groupByCategory={groupByCategory}
			/>

			{/* Recipe Override Settings Dialog */}
			<RecipeDialog
				open={settingsOpen}
				onClose={() => setSettingsOpen(false)}
				multiRecipeMaterials={multiRecipeMaterials}
				recipeOverrides={recipeOverrides}
				onRecipeOverrideChange={onRecipeOverrideChange}
				setInternalRecipeOverrides={setInternalRecipeOverrides}
			/>
		</Box>
	);
};
