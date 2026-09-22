import { useMemo } from "react";
import type { Condition, VendorOrder } from "../types";
import { MATERIAL_CONDITION_TYPES } from "./usecontractdetail";

export interface UseContractConditionCardProps {
	cond: Condition;
	idx: number;
	contract: any;
	allConditions: Condition[];
	marketData: any;
	corpPrices: any;
	vendorOrders: VendorOrder[];
	storageState: any;
	financialData: any;
}

/** Helper: Parse material ticker and quantity from condition */
export function parseMaterialInfo(cond: Condition) {
	const matSummary = cond.material_summary || "";
	const matMatch =
		matSummary.match(/(\d+)\s*x\s*([A-Z0-9_-]+)/i) ||
		matSummary.match(/([A-Z0-9]{1,6})/i);
	const matTicker =
		cond.material_ticker ||
		(cond as any).materialid ||
		(cond as any).ticker ||
		(matMatch ? matMatch[2] || matMatch[1] : null);
	const matQty =
		cond.amount || (matMatch && matMatch[2] ? Number(matMatch[1]) : 1);
	return { matTicker, matQty };
}

/** Helper: Resolve location name from condition */
export function resolveLocationName(cond: Condition): string {
	return (
		cond.addressstationname ||
		cond.addressplanetname ||
		cond.addresssystemname ||
		cond.destinationstationname ||
		cond.destinationplanetname ||
		cond.destinationsystemname ||
		""
	);
}

/** Helper: Calculate per-unit price against linked deliverable / payment condition */
export function calculateUnitPrice(
	cond: Condition,
	allConditions: Condition[],
	matQty: number,
): number {
	const linkedPayCond = allConditions.find(
		(other) =>
			(other.type === "PAYMENT" || other.amountmoney) && other !== cond,
	);
	const totalPay = Number(cond.amountmoney || linkedPayCond?.amountmoney || 0);
	return matQty > 0 && totalPay > 0 ? totalPay / matQty : 0;
}

/** Helper: Lookup market price for ticker */
export function lookupMarketPrice(
	matTicker: string | null,
	marketData: any,
): number | null {
	if (!matTicker || !marketData) return null;

	let marketObj: any = null;
	if (Array.isArray(marketData)) {
		marketObj = marketData.find(
			(m: any) =>
				(m.ticker || m.Ticker || m.materialid)?.toUpperCase() ===
				matTicker.toUpperCase(),
		);
	} else if (typeof marketData === "object") {
		marketObj =
			marketData[matTicker] ||
			marketData[matTicker.toUpperCase()] ||
			marketData[matTicker.toLowerCase()];
	}

	return marketObj
		? Number(
				marketObj.price ??
					marketObj.ask ??
					marketObj.vwap ??
					marketObj.Price ??
					0,
			) || null
		: null;
}

/** Helper: Lookup inventory stock for ticker and optional location match */
export function lookupInventoryStock(
	matTicker: string | null,
	locName: string,
	storageState: any,
	matQty: number,
) {
	if (!matTicker || !storageState?.units) {
		return { availableStock: 0, hasEnoughStock: true };
	}

	let locStock = 0;
	let totalStock = 0;
	let hasLocMatch = false;

	Object.values(storageState.units).forEach((u: any) => {
		const unitLoc = (u.storagelocation || u.name || "").toLowerCase();
		const isLocMatch = locName && unitLoc.includes(locName.toLowerCase());

		if (u.items) {
			u.items.forEach((it: any) => {
				if (it.name?.toUpperCase() === matTicker.toUpperCase()) {
					const q = it.quantity || 0;
					totalStock += q;
					if (isLocMatch) {
						locStock += q;
						hasLocMatch = true;
					}
				}
			});
		}
	});

	const availableStock = hasLocMatch ? locStock : totalStock;
	const hasEnoughStock = matQty ? availableStock >= matQty : true;
	return { availableStock, hasEnoughStock };
}

/** Helper: Check if user can afford payment condition */
export function checkCanUserAfford(
	cond: Condition,
	contractCurrency: string,
	financialData: any,
): boolean {
	if (!financialData) return true;
	const requiredMoney = Number(
		cond.amountmoney || (cond as any).repaymentamount || 0,
	);
	const userCurrencyObj = financialData?.Currencies?.find(
		(c: any) =>
			c.Currency?.toUpperCase() === (contractCurrency || "").toUpperCase(),
	);
	const userLiquidBalance = userCurrencyObj
		? Number(userCurrencyObj.Liquid || 0)
		: 0;
	return userLiquidBalance >= requiredMoney;
}

/**
 * Custom Hook: Encapsulates all derived calculations for ContractConditionCard
 */
export function useContractConditionCard({
	cond,
	contract,
	allConditions,
	marketData,
	corpPrices,
	vendorOrders,
	storageState,
	financialData,
}: UseContractConditionCardProps) {
	return useMemo(() => {
		const isFulfilled = (cond.status || "").toUpperCase() === "FULFILLED";
		const condType = (cond.type || "CLAUSE").replace(/_/g, " ");

		const isMaterial = MATERIAL_CONDITION_TYPES.has(cond.type);
		const isMoney = !!cond.amountmoney || !!cond.repaymentamount;
		const isMyCondition = cond.party === contract?.partner;

		const { matTicker, matQty } = parseMaterialInfo(cond);
		const locName = resolveLocationName(cond);
		const unitPrice = calculateUnitPrice(cond, allConditions, matQty);
		const marketPrice = lookupMarketPrice(matTicker, marketData);

		const corpPrice = matTicker
			? (corpPrices?.[matTicker.toUpperCase()] ??
				corpPrices?.[matTicker] ??
				null)
			: null;
		const matchedVendorOrder = matTicker
			? vendorOrders.find(
					(o) => o.ticker?.toUpperCase() === matTicker.toUpperCase(),
				)
			: null;
		const vendorPrice = matchedVendorOrder
			? Number(matchedVendorOrder.price)
			: null;

		const isVendorMatch =
			vendorPrice !== null &&
			unitPrice > 0 &&
			Math.abs(vendorPrice - unitPrice) < 0.01;
		const isCorpMatch =
			corpPrice !== null &&
			unitPrice > 0 &&
			Math.abs(corpPrice - unitPrice) < 0.01;

		const { availableStock, hasEnoughStock } = lookupInventoryStock(
			matTicker,
			locName,
			storageState,
			matQty,
		);
		const canUserAfford = checkCanUserAfford(
			cond,
			contract?.contract_currency,
			financialData,
		);

		return {
			isFulfilled,
			condType,
			isMaterial,
			isMoney,
			isMyCondition,
			matTicker,
			matQty,
			locName,
			unitPrice,
			marketPrice,
			corpPrice,
			vendorPrice,
			isVendorMatch,
			isCorpMatch,
			availableStock,
			hasEnoughStock,
			canUserAfford,
		};
	}, [
		cond,
		contract,
		allConditions,
		marketData,
		corpPrices,
		vendorOrders,
		storageState,
		financialData,
	]);
}
