import type { ProductionSummaryItem } from "../../types";
import { getCategory } from "../../production/constants";
import type {
	ShareBasis,
	FlowDirectionFilter,
	SourceTypeFilter,
	SortField,
	RecipeItem,
} from "../fullsummaryview/types";
import type { AggregatedSummaryRow, RecipeMap, RecipeVariant } from "./types";

/**
 * Resolves material price based on CX / CORP mode, active exchange, corp prices, and market data.
 */
export const resolveEffectivePrice = (
	ticker: string,
	activePricingMode: "CX" | "CORP",
	selectedExchange: string,
	corpPrices: Record<string, number>,
	marketData: any,
	fallbackPrice: number = 0,
): number => {
	const effMode = activePricingMode === "CORP" ? "CORP" : selectedExchange;

	if (effMode === "CORP") {
		const cPrice =
			corpPrices[ticker] ||
			(marketData[ticker] && marketData[ticker].corp_price);
		if (cPrice && cPrice > 0) return cPrice;
		if (fallbackPrice > 0) return fallbackPrice;
	}

	let mObj: any = marketData[ticker] || marketData[`${ticker}.${effMode}`];
	if (!mObj && Array.isArray(marketData)) {
		mObj = marketData.find((i: any) => {
			const t = (i.Ticker || i.ticker || i.MaterialTicker || "").toUpperCase();
			return (
				t === ticker.toUpperCase() || t === `${ticker.toUpperCase()}.${effMode}`
			);
		});
	}

	if (mObj && typeof mObj === "object") {
		const askKey = `${effMode}-AskPrice`;
		const avgKey = `${effMode}-Average`;
		const bidKey = `${effMode}-BidPrice`;
		const priceKey = `${effMode}-Price`;
		const p =
			mObj[askKey] ||
			mObj[avgKey] ||
			mObj[bidKey] ||
			mObj[priceKey] ||
			mObj.AskPrice ||
			mObj.askPrice ||
			mObj.Average ||
			mObj.average ||
			mObj.BidPrice ||
			mObj.bidPrice ||
			mObj.price ||
			mObj.ask ||
			mObj.bid ||
			0;
		if (p > 0) return p;
	}

	if (fallbackPrice > 0) return fallbackPrice;

	if (mObj && typeof mObj === "object") {
		for (const k of Object.keys(mObj)) {
			if (typeof mObj[k] === "number" && mObj[k] > 0) return mObj[k];
		}
	}

	return 0;
};

/**
 * Builds recipe mapping from output ticker to list of recipe variants.
 */
export const buildRecipeMap = (recipes: RecipeItem[]): RecipeMap => {
	const map: RecipeMap = new Map();

	recipes.forEach((r) => {
		const outputs = r.Outputs || r.outputs || [];
		const inputs = r.Inputs || r.inputs || [];
		const building = r.BuildingTicker || "";
		if (outputs.length > 0 && inputs.length > 0) {
			const out0 = outputs[0];
			const outTicker = (
				out0.Ticker ||
				out0.material_ticker ||
				""
			).toUpperCase();
			const outAmount = Number(out0.Amount || out0.amount || 1);

			if (outTicker) {
				const parsedInputs = inputs
					.map((inp) => ({
						ticker: (inp.Ticker || inp.material_ticker || "").toUpperCase(),
						amount: Number(inp.Amount || inp.amount || 0),
					}))
					.filter((inp) => inp.ticker && inp.amount > 0);

				if (parsedInputs.length > 0) {
					const list = map.get(outTicker) || [];
					list.push({
						inputs: parsedInputs,
						outputAmount: outAmount,
						building,
					});
					map.set(outTicker, list);
				}
			}
		}
	});

	return map;
};

/**
 * Derives effective share basis considering flow/workforce filter context.
 */
export const calculateEffectiveShareBasis = (
	flowDirectionFilter: FlowDirectionFilter,
	sourceTypeFilter: SourceTypeFilter,
	shareBasis: ShareBasis,
): ShareBasis => {
	if (flowDirectionFilter === "CONS_ONLY" && shareBasis === "PROD")
		return "CONS";
	if (sourceTypeFilter === "WORKFORCE" && shareBasis === "PROD") return "CONS";
	if (flowDirectionFilter === "PROD_ONLY" && shareBasis === "CONS")
		return "PROD";
	return shareBasis;
};

export interface AggregateParams {
	productionSummary: ProductionSummaryItem[];
	materialData: any;
	recipeMap: RecipeMap;
	effectiveShareBasis: ShareBasis;
	recipeOverrides: Record<string, number>;
	getEffectivePrice: (ticker: string, fallback?: number) => number;
}

/**
 * Aggregates production totals, prices, recipe expenses, net values, and share percentages.
 */
export const aggregateProductionRows = ({
	productionSummary,
	materialData,
	recipeMap,
	effectiveShareBasis,
	recipeOverrides,
	getEffectivePrice,
}: AggregateParams): AggregatedSummaryRow[] => {
	const corpMap = new Map<string, ProductionSummaryItem>();
	productionSummary.forEach((item) => corpMap.set(item.ticker, item));

	const allTickersSet = new Set<string>([
		...Array.from(corpMap.keys()),
		...Object.keys(materialData),
	]);

	let totalCorpProd = 0;
	let totalCorpCons = 0;
	let totalCorpStorage = 0;
	let totalCorpRevenue = 0;
	let totalCorpExpense = 0;

	const tempRows: Array<Omit<AggregatedSummaryRow, "sharePct">> = [];

	allTickersSet.forEach((ticker) => {
		const corpItem = corpMap.get(ticker);
		const matInfo = materialData[ticker];

		const prod = corpItem?.productionTotal || 0;
		const cons = corpItem?.consumptionTotal || 0;
		const net = corpItem?.net || prod - cons;
		const storageQty = corpItem?.storageQty || 0;
		const isCorpActive =
			prod > 0 ||
			cons > 0 ||
			storageQty > 0 ||
			(corpItem?.batchProdActive || 0) > 0;
		const category = getCategory(ticker) || matInfo?.category || "General";
		const isWorkforce =
			category.toLowerCase().includes("consumable") ||
			category.toLowerCase().includes("luxury") ||
			category.toLowerCase().includes("basic");

		const price = getEffectivePrice(ticker, corpItem?.price || 0);
		const estIncome = prod * price;

		let recipeUnitCost = 0;
		let recipeCount = 0;
		let selectedRecipe: RecipeVariant | null = null;
		let selectedRecipeIdx = 0;

		const recipeList = recipeMap.get(ticker.toUpperCase());
		console.log("recipeList", ticker, recipeList, recipeMap);
		if (recipeList && recipeList.length > 0) {
			recipeCount = recipeList.length;
			const overrideIdx = recipeOverrides[ticker.toUpperCase()];
			if (overrideIdx !== undefined && recipeList[overrideIdx]) {
				selectedRecipe = recipeList[overrideIdx];
				selectedRecipeIdx = overrideIdx;
				if (selectedRecipe && selectedRecipe.outputAmount > 0) {
					const totalInputCost = selectedRecipe.inputs.reduce(
						(sum: number, inp: any) =>
							sum +
							inp.amount *
								getEffectivePrice(
									inp.ticker,
									corpMap.get(inp.ticker)?.price || 0,
								),
						0,
					);
					recipeUnitCost = totalInputCost / selectedRecipe.outputAmount;
				}
			} else {
				// Default to actual weighted cost from userRecipesUsed if available
				const userRecipes = corpItem?.userRecipesUsed || [];
				if (userRecipes.length > 0) {
					let totalDailyCost = 0;
					let totalDailyOutput = 0;
					userRecipes.forEach((ur) => {
						if (ur.dailyOutput > 0 && ur.inputs) {
							const dailyInputCost = Object.entries(ur.inputs).reduce(
								(s, [inpTicker, inpDailyAmt]) =>
									s +
									Number(inpDailyAmt) *
										getEffectivePrice(
											inpTicker,
											corpMap.get(inpTicker)?.price || 0,
										),
								0,
							);
							totalDailyCost += dailyInputCost;
							totalDailyOutput += ur.dailyOutput;
						}
					});
					if (totalDailyOutput > 0) {
						recipeUnitCost = totalDailyCost / totalDailyOutput;
					}
				}

				// Fallback to lowest cost recipe if no actual user recipes were found
				if (recipeUnitCost === 0) {
					let minCost = Infinity;
					recipeList.forEach((rec, idx) => {
						if (rec.outputAmount > 0) {
							const cost =
								rec.inputs.reduce(
									(s, i) =>
										s +
										i.amount *
											getEffectivePrice(
												i.ticker,
												corpMap.get(i.ticker)?.price || 0,
											),
									0,
								) / rec.outputAmount;
							if (cost < minCost) {
								minCost = cost;
								selectedRecipe = rec;
								selectedRecipeIdx = idx;
							}
						}
					});
					if (selectedRecipe && selectedRecipe.outputAmount > 0) {
						const totalInputCost = selectedRecipe.inputs.reduce(
							(sum: number, inp: any) =>
								sum +
								inp.amount *
									getEffectivePrice(
										inp.ticker,
										corpMap.get(inp.ticker)?.price || 0,
									),
							0,
						);
						recipeUnitCost = totalInputCost / selectedRecipe.outputAmount;
					}
				}
			}
		}

		let prodExpense = 0;
		if (prod > 0 && recipeUnitCost > 0) {
			prodExpense = prod * recipeUnitCost;
		}

		let consExpense = 0;
		if (cons > 0) {
			consExpense = cons * price;
		}

		const estExpense = prodExpense + consExpense;
		const netValue = estIncome - estExpense;

		if (isCorpActive) {
			totalCorpProd += prod;
			totalCorpCons += cons;
			totalCorpStorage += storageQty;
			totalCorpRevenue += estIncome;
			totalCorpExpense += estExpense;
		}

		tempRows.push({
			ticker,
			name: matInfo?.name || corpItem?.name || ticker,
			category,
			prod,
			cons,
			net,
			price,
			recipeUnitCost,
			recipeCount,
			selectedRecipe,
			selectedRecipeIdx,
			estIncome,
			prodExpense,
			consExpense,
			estExpense,
			netValue,
			storageQty,
			batchProdActive: corpItem?.batchProdActive || 0,
			batchProdQueued: corpItem?.batchProdQueued || 0,
			batchConsActive: corpItem?.batchConsActive || 0,
			batchConsQueued: corpItem?.batchConsQueued || 0,
			producers: corpItem?.producers || [],
			consumers: corpItem?.consumers || [],
			userRecipesUsed: corpItem?.userRecipesUsed || [],
			isCorpActive,
			isWorkforce,
		});
	});

	return tempRows.map((r) => {
		let sharePct = 0;
		if (r.isCorpActive) {
			if (effectiveShareBasis === "PROD" && totalCorpProd > 0) {
				sharePct = (r.prod / totalCorpProd) * 100;
			} else if (effectiveShareBasis === "CONS" && totalCorpCons > 0) {
				sharePct = (r.cons / totalCorpCons) * 100;
			} else if (effectiveShareBasis === "STOCK" && totalCorpStorage > 0) {
				sharePct = (r.storageQty / totalCorpStorage) * 100;
			} else if (effectiveShareBasis === "REVENUE" && totalCorpRevenue > 0) {
				sharePct = (r.estIncome / totalCorpRevenue) * 100;
			} else if (effectiveShareBasis === "EXPENSE" && totalCorpExpense > 0) {
				sharePct = (r.estExpense / totalCorpExpense) * 100;
			}
		}
		return {
			...r,
			sharePct: Math.round(sharePct * 10) / 10,
		};
	});
};

export interface FilterAndSortParams {
	aggregatedRows: AggregatedSummaryRow[];
	hideZeroFlow: boolean;
	flowDirectionFilter: FlowDirectionFilter;
	sourceTypeFilter: SourceTypeFilter;
	selectedCategories: string[];
	searchQuery: string;
	exactMatch: boolean;
	sortField: SortField | null;
	sortDirection: "asc" | "desc" | "neutral";
}

/**
 * Filters and sorts aggregated material rows.
 */
export const filterAndSortSummaryRows = ({
	aggregatedRows,
	hideZeroFlow,
	flowDirectionFilter,
	sourceTypeFilter,
	selectedCategories,
	searchQuery,
	exactMatch,
	sortField,
	sortDirection,
}: FilterAndSortParams): AggregatedSummaryRow[] => {
	const searchTokens = searchQuery
		.trim()
		.toUpperCase()
		.split(/[\s,]+/)
		.filter(Boolean);

	let result = aggregatedRows.filter((row) => {
		if (
			hideZeroFlow &&
			row.prod === 0 &&
			row.cons === 0 &&
			(row.batchProdActive || 0) === 0 &&
			(row.batchProdQueued || 0) === 0
		)
			return false;

		if (flowDirectionFilter === "PROD_ONLY" && row.prod <= 0) return false;
		if (flowDirectionFilter === "CONS_ONLY" && row.cons <= 0) return false;

		if (sourceTypeFilter === "PRODUCTION" && row.isWorkforce && row.prod <= 0)
			return false;
		if (sourceTypeFilter === "WORKFORCE" && !row.isWorkforce) return false;

		if (!selectedCategories.includes("ALL")) {
			const cat = getCategory(row.ticker);
			if (!selectedCategories.includes(cat)) return false;
		}

		if (searchTokens.length > 0) {
			if (exactMatch) {
				const isExactMatch = searchTokens.includes(row.ticker.toUpperCase());
				if (!isExactMatch) return false;
			} else {
				const q = searchQuery.toLowerCase();
				const matchTicker = row.ticker.toLowerCase().includes(q);
				const matchName = row.name.toLowerCase().includes(q);
				const matchToken = searchTokens.some((t) =>
					row.ticker.toUpperCase().includes(t),
				);
				if (!matchTicker && !matchName && !matchToken) return false;
			}
		}

		return true;
	});

	if (sortField && sortDirection !== "neutral") {
		result.sort((a, b) => {
			let valA: any = a[sortField];
			let valB: any = b[sortField];

			if (typeof valA === "string") {
				const cmp = valA.localeCompare(valB);
				return sortDirection === "asc" ? cmp : -cmp;
			}

			valA = valA || 0;
			valB = valB || 0;
			return sortDirection === "asc" ? valA - valB : valB - valA;
		});
	} else {
		result.sort(
			(a, b) => Math.abs(b.netValue) - Math.abs(a.netValue) || b.prod - a.prod,
		);
	}

	return result;
};

/**
 * Extracts materials that have multiple recipe variants for override options.
 */
export const extractMultiRecipeMaterials = (recipeMap: RecipeMap) => {
	const list: Array<{ ticker: string; recipes: RecipeVariant[] }> = [];
	recipeMap.forEach((recList, ticker) => {
		if (recList.length > 1) {
			list.push({ ticker, recipes: recList });
		}
	});
	return list.sort((a, b) => a.ticker.localeCompare(b.ticker));
};

/**
 * Groups summary rows by category string.
 */
export const groupRowsByCategory = (rows: AggregatedSummaryRow[]) => {
	const map = new Map<string, AggregatedSummaryRow[]>();
	rows.forEach((row) => {
		const cat = row.category || "General";
		const list = map.get(cat) || [];
		list.push(row);
		map.set(cat, list);
	});
	return map;
};
