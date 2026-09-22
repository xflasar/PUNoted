import { useState, useEffect, useMemo } from "react";
import { fetchClient } from "../../../utils/apiclient";
import { useTheme } from "@mui/material";
import type {
	ContractDetailData,
	UseContractDetailProps,
	UseContractDetailResult,
	VendorOrder,
} from "../types";
import { useGlobalData } from "../../../context/globaldatacontext";
import { SEMANTIC_COLORS } from "../../financial/utils/financeutils";

export const MATERIAL_CONDITION_TYPES = new Set([
	"PROVISION",
	"DEPOSIT",
	"WITHDRAW",
	"PROVISION_SHIPMENT",
	"PICKUP",
	"DELIVERY",
	"COMEX_PURCHASE_PICKUP",
]);

export function useContractDetail(
	props: UseContractDetailProps,
): UseContractDetailResult {
	const theme = useTheme();
	const { corpPrices, marketData, storageState, financialData } =
		useGlobalData();

	const [contractDetail, setContractDetail] =
		useState<ContractDetailData | null>(null);
	const [vendorOrders, setVendorOrders] = useState<VendorOrder[]>([]);
	const [loading, setLoading] = useState<boolean>(false);

	useEffect(() => {
		if (props.open && props.contractId) {
			setLoading(true);
			fetchClient(
				`/internal/contracts/detail?contract_id=${encodeURIComponent(props.contractId)}`,
			)
				.then(async (res) => (res && res.ok ? res.json() : null))
				.then((data) => {
					if (data) {
						setContractDetail(
							data.contract
								? { ...data.contract, conditions: data.conditions }
								: data,
						);
					} else {
						setContractDetail(null);
					}
					setVendorOrders([]);
				})
				.catch((err) => {
					console.error("Failed to fetch contract details:", err);
					setContractDetail(null);
					setVendorOrders([]);
				})
				.finally(() => setLoading(false));
		} else {
			setContractDetail(null);
			setVendorOrders([]);
		}
	}, [props.open, props.contractId]);

	const contract = useMemo(() => {
		if (!contractDetail) return null;

		const allConditions = contractDetail?.conditions || [];
		const isMotion =
			contractDetail?.contracttype === "MOTION" ||
			(contractDetail?.preamble &&
				/MOT-\d+-\d+/i.test(contractDetail.preamble)) ||
			(contractDetail?.name && /MOT-\d+-\d+/i.test(contractDetail.name));

		const condPlanet = allConditions.find(
			(cond) => cond.addressplanetname || cond.destinationplanetname,
		);
		const condPlanetName =
			condPlanet?.addressplanetname || condPlanet?.destinationplanetname;
		const activePlanetName =
			contractDetail?.motion_planet_name || condPlanetName;
		const planetIdMatch =
			contractDetail?.preamble?.match(/MOT-(\d+)-/i) ||
			contractDetail?.name?.match(/MOT-(\d+)-/i);

		const planetGovName = activePlanetName
			? activePlanetName.toLowerCase().includes("government")
				? activePlanetName
				: `${activePlanetName} Government`
			: planetIdMatch
				? `Planet ${planetIdMatch[1]} Government`
				: "Planetary Government";

		const partnerName =
			contractDetail?.partnername ||
			(isMotion
				? planetGovName
				: contractDetail?.partnercode || "Counterparty");
		const partnerCode = contractDetail?.partnercode || (isMotion ? "GOV" : "");
		const condCurrency =
			allConditions.find((cond) => cond.currencymoney || cond.currency)
				?.currencymoney ||
			allConditions.find((cond) => cond.currencymoney || cond.currency)
				?.currency;
		const contractCurrency = contractDetail?.currency || condCurrency || "ICA";
		const party = contractDetail?.party || "CUSTOMER";
		const natId =
			contractDetail?.localid ||
			(contractDetail?.id
				? `CTR-${String(contractDetail.id).substring(0, 8)}`
				: "CTR-N/A");

		const totalCondCount = allConditions.length;
		const fulfilledCondCount = allConditions.filter(
			(cond) => (cond.status || "").toUpperCase() === "FULFILLED",
		).length;
		const condPercent =
			totalCondCount > 0
				? Math.min(100, Math.round((fulfilledCondCount / totalCondCount) * 100))
				: 100;

		// Total contract value calculation
		const totalAmount =
			contractDetail?.total_amount ||
			contractDetail?.conditions?.reduce(
				(sum, cond) =>
					sum + Number(cond.amountmoney || cond.repaymentamount || 0),
				0,
			) ||
			0;

		const isIncome = contractDetail?.is_income ?? party === "CUSTOMER";
		const hasAmount = totalAmount > 0;
		const sign = !hasAmount ? "" : isIncome ? "+" : "-";
		const amountColor = !hasAmount
			? "rgba(255,255,255,0.7)"
			: isIncome
				? SEMANTIC_COLORS.neonGreen
				: SEMANTIC_COLORS.neonRed;

		const status = (contractDetail?.status || "ACTIVE").toUpperCase();

		const totalStockMap = new Map<string, number>();
		if (storageState?.units) {
			Object.values(storageState.units).forEach((unit: any) => {
				unit.items?.forEach((it: any) => {
					if (it.name) {
						const ticker = it.name.toUpperCase();
						totalStockMap.set(
							ticker,
							(totalStockMap.get(ticker) || 0) + (it.quantity || 0),
						);
					}
				});
			});
		}

		// Calculate overall contract state & actionability
		const contractActionState = (() => {
			if (!contractDetail) return null;
			if (status === "FULFILLED")
				return { label: "Contract Fulfilled ✓", color: "success" as const };
			if (
				status === "CLOSED" ||
				status === "CANCELLED" ||
				status === "BREACHED"
			)
				return { label: `Contract ${status}`, color: "error" as const };

			const pendingConditions = (contractDetail.conditions || []).filter(
				(cond) => (cond.status || "").toUpperCase() !== "FULFILLED",
			);
			const matConds = pendingConditions.filter(
				(cond) =>
					MATERIAL_CONDITION_TYPES.has(cond.type) &&
					cond.party === contractDetail.party,
			);

			if (matConds.length === 0) {
				return {
					label: "Pending Counterparty Action / Payment",
					color: "info" as const,
				};
			}

			let canFulfillAll = true;
			matConds.forEach((cond) => {
				const matSummary = cond.material_summary;
				const matMatch = matSummary?.match(/^(\d+)x\s+(.+)$/);
				if (!matMatch) return;
				const qty = Number(matMatch[1]);
				const ticker = matMatch[2];

				const stock = totalStockMap.get(ticker.toUpperCase()) || 0;
				if (stock < qty) canFulfillAll = false;
			});

			return canFulfillAll
				? { label: "Ready to Fulfill ✓ (In Stock)", color: "success" as const }
				: {
						label: "Action Blocked ⚠️ (Insufficient Stock)",
						color: "warning" as const,
					};
		})();

		return {
			...contractDetail,
			conditions: allConditions,
			id: natId,
			partner: party,
			partner_code: partnerCode,
			partner_name: partnerName,
			fulfillment_percentage: condPercent,
			action_state: contractActionState,
			total_amount: totalAmount,
			amount_color: amountColor,
			contract_currency: contractCurrency,
			is_income: isIncome,
			has_amount: hasAmount,
			sign: sign,
			status: status,
			total_cond_count: totalCondCount,
			fulfilled_cond_count: fulfilledCondCount,
		};
	}, [contractDetail, storageState]);

	return {
		contract,
		vendorOrders,
		loading,
		theme,
		corpPrices,
		marketData,
		storageState,
		financialData,
	};
}
