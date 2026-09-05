export interface RecipeVariantInput {
	ticker: string;
	amount: number;
}

export interface RecipeVariant {
	inputs: RecipeVariantInput[];
	outputAmount: number;
	building?: string;
}

export type RecipeMap = Map<string, RecipeVariant[]>;

export interface AggregatedSummaryRow {
	ticker: string;
	name: string;
	category: string;
	prod: number;
	cons: number;
	net: number;
	price: number;
	recipeUnitCost: number;
	recipeCount: number;
	selectedRecipe: RecipeVariant | null;
	selectedRecipeIdx: number;
	estIncome: number;
	prodExpense: number;
	consExpense: number;
	estExpense: number;
	netValue: number;
	storageQty: number;
	producers: any[];
	consumers: any[];
	isCorpActive: boolean;
	isWorkforce: boolean;
	sharePct: number;
	batchProdActive?: number;
	batchProdQueued?: number;
	batchConsActive?: number;
	batchConsQueued?: number;
	userRecipesUsed?: any[];
}
