import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import EditVendorStoreModal from "../src/cosm/vendors/editvendorstoremodal";
import type { OrderItem, VendorStore } from "../src/cosm/vendors/types";

vi.mock("../src/cosm/vendors/hooks/useavailablematerials", () => ({
	useAvailableMaterials: () => ({ materials: [], isLoading: false }),
}));

vi.mock("../src/cosm/vendors/components/availablematerialslist", () => ({
	default: () => null,
}));

vi.mock("../src/cosm/vendors/components/materialtable", () => ({
	default: ({ allOrders, onAddMaterial, onEditMaterial, onRemoveMaterial }: {
		allOrders: OrderItem[];
		onAddMaterial: (material: OrderItem, type: "buy" | "sell") => void;
		onEditMaterial: (
			frontendId: string | undefined,
			field: string,
			value: string | number | boolean | object,
		) => void;
		onRemoveMaterial: (
			frontendId: string | undefined,
			type: "buy" | "sell" | undefined,
		) => void;
	}) => {
		const order = allOrders[0]!;
		const additionalMaterial: OrderItem = {
			...order,
			materialid: "material-2",
			materialticker: "AL",
			locations: [],
		};

		return (
			<>
				<button onClick={() => onAddMaterial(additionalMaterial, "sell")}>
					add material
				</button>
				<button onClick={() => onRemoveMaterial(order.frontendId, order.ordertype)}>
					remove material
				</button>
				<button
					onClick={() =>
						onEditMaterial(order.frontendId, "locations", [
							{
								id: "location-1",
								location_name: "Hortus Station",
								location_code: "HRT",
								amount: 5,
								storage_amount: 10,
							},
						])
					}
				>
					change locations
				</button>
				<button onClick={() => onEditMaterial(order.frontendId, "reserved", 25)}>
					change limit
				</button>
				<button onClick={() => onEditMaterial(order.frontendId, "fixedprice", 25)}>
					change price
				</button>
				<button onClick={() => onEditMaterial(order.frontendId, "priceLock", true)}>
					change price lock
				</button>
				<button onClick={() => onEditMaterial(order.frontendId, "ordertype", "buy")}>
					change side
				</button>
			</>
		);
	},
}));

const store: VendorStore = {
	vendor: {
		vendorid: "vendor-1",
		companycode: "COMP",
		companyname: "Company",
		corpname: "Corp",
		gamename: "Player",
		isactive: true,
		cx: "IC1",
	},
	orders: [
		{
			orderid: "order-1",
			materialid: "material-1",
			materialticker: "FE",
			ordertype: "sell",
			locations: [],
			price: { fixedprice: 10, corpprice: 10, cxprice: 12 },
			quantity: 10,
			vendorname: "Company",
			gamename: "Player",
			vendorid: "vendor-1",
			reserved: 0,
			instore: 10,
		},
	],
};

describe("EditVendorStoreModal", () => {
	it.each([
		"add material",
		"remove material",
		"change locations",
		"change limit",
		"change price",
		"change price lock",
		"change side",
	])("shows save controls after %s", (action) => {
		render(
			<EditVendorStoreModal
				vendorStore={store}
				onStoreDeleted={vi.fn()}
				onVendorChanged={vi.fn()}
			/>,
		);

		expect(screen.queryByRole("button", { name: "SAVE" })).toBeNull();
		fireEvent.click(screen.getByRole("button", { name: action }));
		expect(screen.getByRole("button", { name: "SAVE" })).toBeDefined();
	});
});
