import { beforeEach, describe, expect, it } from "vitest";
import {
	formatLocation,
	setLocationSystemNames,
} from "../src/cosm/vendors/utils/formatlocation";

describe("formatLocation", () => {
	beforeEach(() => setLocationSystemNames());

	it("uses a named system for an unnamed planet", () => {
		setLocationSystemNames({ "GY-694": "Othrys" });

		expect(formatLocation("GY-694b", "GY-694b")).toBe(
			"Othrys b (GY-694b)",
		);
	});

	it("keeps explicitly named locations unchanged", () => {
		setLocationSystemNames({ "GY-694": "Othrys" });

		expect(formatLocation("Berthier", "GY-694b")).toBe("Berthier (GY-694b)");
	});
});
