export type PriceSource = "fixed" | "corp" | "cx" | "unresolved";

export interface ResolvePriceInput {
	fixedprice?: number | null;
	corpprice?: number | null;
	cxprice?: number | null;
}

export interface ResolvedPrice {
	price: number;
	source: PriceSource;
}

const valid = (n: number | null | undefined): n is number =>
	typeof n === "number" && Number.isFinite(n);

export const pickPrice = ({
	fixedprice,
	corpprice,
	cxprice,
}: ResolvePriceInput): ResolvedPrice => {
	if (valid(fixedprice) && fixedprice !== -1)
		return { price: fixedprice, source: "fixed" };
	if (valid(corpprice)) return { price: corpprice, source: "corp" };
	if (valid(cxprice)) return { price: cxprice, source: "cx" };
	return { price: 0, source: "unresolved" };
};
