import type { UserNotification } from "./types";

export const MOCK_DEBUG_NOTIFICATIONS: UserNotification[] = [
	{
		id: "dbg_financial_01",
		category: "financial",
		type: "financial_daily",
		title: "Daily Financial Balance Summary",
		message:
			"24h Financial Summary across your active liquid accounts: 150,240 NCC, 45,000 AIC, 12,300 ICA, 8,500 CIS.",
		data: {
			currencies: [
				{ code: "NCC", balance: 150240, income_24h: 12500, expense_24h: 4200 },
				{ code: "AIC", balance: 45000, income_24h: 8000, expense_24h: 1200 },
				{ code: "ICA", balance: 12300, income_24h: 0, expense_24h: 500 },
				{ code: "CIS", balance: 8500, income_24h: 3200, expense_24h: 0 },
			],
		},
		is_read: false,
		created_at: new Date().toISOString(),
	},
	{
		id: "dbg_contract_01",
		category: "contracts",
		type: "contract_payment_due",
		title: "Contract Payment Due Soon: CNT-7892",
		message:
			"Payment condition of 25,000 NCC to Customer 'AetherCorp' is due in 2 days.",
		data: {
			contract_id: "CNT-7892",
			amount: 25000,
			currency: "NCC",
			due_days: 2,
			party: "AetherCorp",
		},
		is_read: false,
		created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
	},
	{
		id: "dbg_contract_02",
		category: "contracts",
		type: "contract_payment_overdue",
		title: "Contract Payment Overdue: CNT-4011",
		message:
			"Payment condition of 12,000 AIC from 'Hortus Trading' is overdue by 1 day.",
		data: {
			contract_id: "CNT-4011",
			amount: 12000,
			currency: "AIC",
			overdue_days: 1,
			party: "Hortus Trading",
		},
		is_read: false,
		created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
	},
	{
		id: "dbg_production_01",
		category: "production",
		type: "site_supply_low",
		title: "Production Site Reserve Alert: Khor Station",
		message:
			"Khor Station: Low reserve alerts for 4 materials (RAT, DW, O, STEEL).",
		data: {
			siteid: "site_khor_01",
			sitename: "Khor Station",
			materials: [
				{ ticker: "RAT", amount: 140, target_days: 2, days_left: 0.8 },
				{ ticker: "DW", amount: 320, target_days: 3, days_left: 1.2 },
				{ ticker: "O", amount: 80, target_days: 2, days_left: 0.5 },
				{ ticker: "STEEL", amount: 45, target_days: 5, days_left: 1.5 },
			],
		},
		is_read: false,
		created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
	},
	{
		id: "dbg_cx_01",
		category: "cx",
		type: "comex_order_filled",
		title: "COMEX Buy Order Filled: 100 FE @ 15.20 NCC",
		message:
			"Your buy order for 100 FE at Castillo Station CX has been filled.",
		data: {
			exchange: "CI1",
			ticker: "FE",
			count: 100,
			price: 15.2,
		},
		is_read: true,
		created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
	},
	{
		id: "dbg_fleet_01",
		category: "fleet",
		type: "flight_plan_completed",
		title: "Flight Completed: Freighter IV",
		message: "Ship 'Freighter IV' arrived safely at Benten Station.",
		data: {
			ship: "Freighter IV",
			destination: "Benten Station",
		},
		is_read: true,
		created_at: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
	},
];
