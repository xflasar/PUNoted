import type { ProductionSummaryItem, CorpMember } from "../../types";

export type ShareBasis = "PROD" | "CONS" | "STOCK" | "REVENUE" | "EXPENSE";
export type FlowDirectionFilter = "ALL" | "PROD_ONLY" | "CONS_ONLY";
export type SourceTypeFilter = "ALL" | "PRODUCTION" | "WORKFORCE";

export type SortField =
	| "ticker"
	| "prod"
	| "cons"
	| "net"
	| "price"
	| "estIncome"
	| "recipeUnitCost"
	| "estExpense"
	| "netValue"
	| "storageQty"
	| "sharePct";

export interface Props {
	productionSummary: ProductionSummaryItem[];
	balances?: { currency: string; amount: number }[];
	members?: CorpMember[];
	pricingMode?: "CX" | "CORP";
	onPricingModeChange?: (mode: "CX" | "CORP") => void;
	selectedExchange?: string;
	onSelectedExchangeChange?: (ex: string) => void;
	hideZeroFlow?: boolean;
	onHideZeroFlowChange?: (val: boolean) => void;
	recipeOverrides?: Record<string, number>;
	onRecipeOverrideChange?: (ticker: string, idx: number) => void;
}

export interface RecipeIngredient {
	Ticker?: string;
	material_ticker?: string;
	Amount?: number;
	amount?: number;
}

export interface RecipeItem {
	Inputs?: RecipeIngredient[];
	Outputs?: RecipeIngredient[];
	inputs?: RecipeIngredient[];
	outputs?: RecipeIngredient[];
	BuildingTicker?: string;
	RecipeName?: string;
}

// Exchange Code to Official Currency Symbol / Code Mapping
export const EXCHANGE_CURRENCY_CODE_MAP: Record<string, string> = {
	IC1: "ICA",
	NC1: "NCC",
	AI1: "AIC",
	CI1: "CIS",
	CI2: "CIS",
	CORP: "CORP",
};
