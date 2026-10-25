import { describe, expect, it } from "vitest";
import { getLocationMarketQuantity } from "../src/cosm/vendors/components/orderitemrow";

describe("getLocationMarketQuantity", () => {
	it("caps each ASK location before the parent total is calculated", () => {
		const locations = [
			{ available: 100, storage_amount: 100, amount: 50 },
			{ available: 200, storage_amount: 200, amount: 500 },
		];

		expect(
			locations.reduce(
				(total, location) =>
					total + getLocationMarketQuantity("sell", location),
				0,
			),
		).toBe(50);
	});

	it("shows a BID location's unmet demand", () => {
		expect(
			getLocationMarketQuantity("buy", {
				available: 100,
				storage_amount: 100,
				amount: 250,
			}),
		).toBe(150);
	});
});
