import { describe, expect, it } from "vitest";
import { parseShoppingListImport } from "../src/cosm/vendors/utils/shoppinglistimport";

const validMaterialTickers = new Set(["RAT", "H2O"]);

describe("parseShoppingListImport", () => {
	it("parses CSV and combines duplicate materials", () => {
		expect(
			parseShoppingListImport(
				'material,quantity\nRAT,1\nRAT,2\nH2O,"1,234"',
				validMaterialTickers,
			),
		).toEqual([
			{ materialticker: "RAT", quantity: 3 },
			{ materialticker: "H2O", quantity: 1234 },
		]);
	});

	it("parses headerless TSV", () => {
		expect(
			parseShoppingListImport("RAT\t1\nH2O\t2", validMaterialTickers),
		).toEqual([
			{ materialticker: "RAT", quantity: 1 },
			{ materialticker: "H2O", quantity: 2 },
		]);
	});

	it("rejects duplicate quantities above the safe integer limit", () => {
		expect(() =>
			parseShoppingListImport(
				"RAT,9007199254740991\nRAT,1",
				validMaterialTickers,
			),
		).toThrow("Invalid quantity for RAT");
	});

	it("parses material groups from JSON", () => {
		expect(
			parseShoppingListImport(
				JSON.stringify({
					groups: [
						{ name: "m1", materials: { RAT: 1 } },
						{ name: "m2", materials: { H2O: 2, RAT: 3 } },
					],
				}),
				validMaterialTickers,
			),
		).toEqual([
			{ materialticker: "RAT", quantity: 4 },
			{ materialticker: "H2O", quantity: 2 },
		]);
	});

	it("rejects malformed imports", () => {
		expect(() =>
			parseShoppingListImport(
				"material,quantity\nRAT,abc",
				validMaterialTickers,
			),
		).toThrow("Invalid quantity for RAT");
		expect(() =>
			parseShoppingListImport('{"groups":', validMaterialTickers),
		).toThrow("Invalid JSON");
		expect(() => parseShoppingListImport("RAT,1", new Set(["H2O"]))).toThrow(
			"Invalid material: RAT",
		);
	});
});
