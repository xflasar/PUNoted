import { useState, useMemo, useEffect, useCallback } from "react";
import { useTheme, useMediaQuery } from "@mui/material";
import { useGlobalData } from "../../../../context/globaldatacontext";
import type {
	Props,
	ShareBasis,
	FlowDirectionFilter,
	SourceTypeFilter,
	SortField,
} from "../fullsummaryview/types";
import { EXCHANGE_CURRENCY_CODE_MAP } from "../fullsummaryview/types";
import {
	resolveEffectivePrice,
	buildRecipeMap,
	calculateEffectiveShareBasis,
	aggregateProductionRows,
	filterAndSortSummaryRows,
	extractMultiRecipeMaterials,
} from "./utils";

export interface UseFullSummaryDataProps extends Props {}

export const useFullSummaryData = ({
	productionSummary = [],
	balances = [],
	members = [],
	pricingMode: externalPricingMode = "CX",
	onPricingModeChange,
	selectedExchange: externalExchange = "IC1",
	onSelectedExchangeChange,
	hideZeroFlow: externalHideZeroFlow = true,
	onHideZeroFlowChange,
	recipeOverrides: externalRecipeOverrides = {},
	onRecipeOverrideChange,
}: UseFullSummaryDataProps = {}) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));
	const {
		materialData = {},
		marketData = {},
		corpPrices = {},
		recipes = [],
	} = useGlobalData();

	const [internalPricingMode, setInternalPricingMode] = useState<"CX" | "CORP">(
		"CX",
	);
	const [internalExchange, setInternalExchange] = useState<string>("IC1");
	const [internalHideZeroFlow, setInternalHideZeroFlow] =
		useState<boolean>(true);
	const [internalRecipeOverrides, setInternalRecipeOverrides] = useState<
		Record<string, number>
	>({});

	const activePricingMode = onPricingModeChange
		? externalPricingMode
		: internalPricingMode;
	const selectedExchange = onSelectedExchangeChange
		? externalExchange
		: internalExchange;
	const hideZeroFlow = onHideZeroFlowChange
		? externalHideZeroFlow
		: internalHideZeroFlow;
	const recipeOverrides = onRecipeOverrideChange
		? externalRecipeOverrides
		: internalRecipeOverrides;

	const [shareBasis, setShareBasis] = useState<ShareBasis>("PROD");
	const [flowDirectionFilter, setFlowDirectionFilter] =
		useState<FlowDirectionFilter>("ALL");
	const [sourceTypeFilter, setSourceTypeFilter] =
		useState<SourceTypeFilter>("ALL");
	const [groupByCategory, setGroupByCategory] = useState<boolean>(false);

	const [selectedCategories, setSelectedCategories] = useState<string[]>([
		"ALL",
	]);
	const [filterOpen, setFilterOpen] = useState(false);

	const [inputValue, setInputValue] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [exactMatch, setExactMatch] = useState(false);
	const [settingsOpen, setSettingsOpen] = useState(false);

	const activeCurrencyCode =
		activePricingMode === "CORP"
			? "CORP"
			: EXCHANGE_CURRENCY_CODE_MAP[selectedExchange] || selectedExchange;

	// Debounce search input
	useEffect(() => {
		const timer = setTimeout(() => {
			setSearchQuery(inputValue);
		}, 300);
		return () => clearTimeout(timer);
	}, [inputValue]);

	const toggleCategory = useCallback((cat: string) => {
		setSelectedCategories((prev) => {
			if (cat === "ALL") return ["ALL"];
			if (prev.includes("ALL")) {
				return [cat];
			}
			const newCats = prev.includes(cat)
				? prev.filter((c) => c !== cat)
				: [...prev, cat];
			return newCats.length === 0 ? ["ALL"] : newCats;
		});
	}, []);

	// 3-State Sorting State
	const [sortField, setSortField] = useState<SortField | null>(null);
	const [sortDirection, setSortDirection] = useState<
		"asc" | "desc" | "neutral"
	>("neutral");

	const handleHeaderClick = useCallback(
		(field: SortField) => {
			if (sortField !== field) {
				setSortField(field);
				setSortDirection("desc");
			} else {
				if (sortDirection === "desc") {
					setSortDirection("asc");
				} else if (sortDirection === "asc") {
					setSortField(null);
					setSortDirection("neutral");
				} else {
					setSortDirection("desc");
				}
			}
		},
		[sortField, sortDirection],
	);

	const renderSortIcon = useCallback(
		(field: SortField) => {
			if (sortField !== field || sortDirection === "neutral") {
				return (
					<span style={{ opacity: 0.3, fontSize: "0.65rem", marginLeft: 3 }}>
						↕
					</span>
				);
			}
			return (
				<span
					style={{
						color: "#64FFDA",
						fontWeight: "bold",
						fontSize: "0.7rem",
						marginLeft: 3,
					}}
				>
					{sortDirection === "desc" ? "▼" : "▲"}
				</span>
			);
		},
		[sortField, sortDirection],
	);

	// Flexible Price Resolution wrapper
	const getEffectivePrice = useCallback(
		(ticker: string, fallbackPrice: number = 0): number => {
			return resolveEffectivePrice(
				ticker,
				activePricingMode,
				selectedExchange,
				corpPrices,
				marketData,
				fallbackPrice,
			);
		},
		[activePricingMode, selectedExchange, corpPrices, marketData],
	);

	// Build recipe map
	const recipeMap = useMemo(() => buildRecipeMap(recipes), [recipes]);

	// Automated share basis calculation
	const effectiveShareBasis = useMemo(
		() =>
			calculateEffectiveShareBasis(
				flowDirectionFilter,
				sourceTypeFilter,
				shareBasis,
			),
		[flowDirectionFilter, sourceTypeFilter, shareBasis],
	);

	// Aggregate production rows
	const aggregatedRows = useMemo(
		() =>
			aggregateProductionRows({
				productionSummary,
				materialData,
				recipeMap,
				effectiveShareBasis,
				recipeOverrides,
				getEffectivePrice,
			}),
		[
			productionSummary,
			materialData,
			recipeMap,
			effectiveShareBasis,
			recipeOverrides,
			getEffectivePrice,
		],
	);

	// Filter & sort rows
	const filteredRows = useMemo(
		() =>
			filterAndSortSummaryRows({
				aggregatedRows,
				hideZeroFlow,
				flowDirectionFilter,
				sourceTypeFilter,
				selectedCategories,
				searchQuery,
				exactMatch,
				sortField,
				sortDirection,
			}),
		[
			aggregatedRows,
			hideZeroFlow,
			flowDirectionFilter,
			sourceTypeFilter,
			selectedCategories,
			searchQuery,
			exactMatch,
			sortField,
			sortDirection,
		],
	);

	// Multi-recipe materials extraction
	const multiRecipeMaterials = useMemo(
		() => extractMultiRecipeMaterials(recipeMap),
		[recipeMap],
	);

	return {
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
		setSelectedCategories,
		toggleCategory,
		filterOpen,
		setFilterOpen,
		inputValue,
		setInputValue,
		searchQuery,
		exactMatch,
		setExactMatch,
		settingsOpen,
		setSettingsOpen,
		recipes,
		activeCurrencyCode,
		sortField,
		sortDirection,
		handleHeaderClick,
		renderSortIcon,
		getEffectivePrice,
		aggregatedRows,
		filteredRows,
		multiRecipeMaterials,
	};
};

export const useData = useFullSummaryData;
