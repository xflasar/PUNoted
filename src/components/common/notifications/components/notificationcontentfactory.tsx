import React from "react";
import { FinancialDailyContent } from "./financialdailycontent";
import { ContractDueContent } from "./contractduecontent";
import { ProductionSupplyContent } from "./productionsupplycontent";
import { DefaultNotificationContent } from "./defaultnotificationcontent";
import { ComexOrderFilledContent } from "./comexorderfilledcontent";
import { FlightCompletedContent } from "./flightcompletedcontent";

interface NotificationContentFactoryProps {
	category: string;
	type: string;
	data: Record<string, any> | null;
}

export const NotificationContentFactory: React.FC<
	NotificationContentFactoryProps
> = ({ category, type, data }) => {
	if (!data) return null;

	if (type === "financial_daily" || data.currencies) {
		return <FinancialDailyContent data={data} />;
	}

	if (
		type === "contract_payment_due" ||
		type === "contract_payment_overdue" ||
		category === "contracts"
	) {
		return <ContractDueContent data={data} type={type} />;
	}

	if (type === "site_supply_low" || category === "production") {
		return <ProductionSupplyContent data={data} />;
	}

	if (type === "comex_order_filled" || category === "cx") {
		return <ComexOrderFilledContent data={data} />;
	}

	if (type === "flight_plan_completed" || category === "fleet") {
		return <FlightCompletedContent data={data} />;
	}

	return <DefaultNotificationContent data={data} />;
};
