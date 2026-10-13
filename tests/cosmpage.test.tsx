import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CosmPage from "../src/COSM/cosmpage";

const mounts = vi.hoisted(() => ({ vendors: 0, prices: 0, production: 0 }));

vi.mock("../src/COSM/vendors/vendorlist", async () => {
	const { useState } = await import("react");
	const MockVendors = ({
		activeTab,
		onLoginRequest,
	}: {
		activeTab: string;
		onLoginRequest: () => void;
	}) => {
		const [mount] = useState(() => ++mounts.vendors);
		return (
			<>
				<div data-testid="vendors">{`${activeTab}:${mount}`}</div>
				{activeTab === "store" && (
					<button onClick={onLoginRequest}>Login or Register</button>
				)}
			</>
		);
	};
	return {
		default: MockVendors,
	};
});

vi.mock("../src/COSM/pricelist/maindashboard", async () => {
	const { useState } = await import("react");
	const MockPrices = () => {
		const [mount] = useState(() => ++mounts.prices);
		return <div data-testid="prices">{mount}</div>;
	};
	return {
		default: MockPrices,
	};
});

vi.mock("../src/COSM/shipproduction/productiondashboard", async () => {
	const { useState } = await import("react");
	const MockProduction = () => {
		const [mount] = useState(() => ++mounts.production);
		return <div data-testid="production">{mount}</div>;
	};
	return {
		default: MockProduction,
	};
});

vi.mock("../src/COSM/shipping/shippingmap", () => ({
	default: () => <div data-testid="shipping" />,
}));

vi.mock("../src/landingpage/auth/authenticationbox", () => ({
	default: () => <div data-testid="authentication" />,
}));

describe("CosmPage", () => {
	beforeEach(() => {
		mounts.vendors = 0;
		mounts.prices = 0;
		mounts.production = 0;
	});

	it("keeps visited panels mounted and shares the vendor view", async () => {
		render(
			<ThemeProvider theme={createTheme()}>
				<MemoryRouter initialEntries={["/cosm?tab=vendors"]}>
					<CosmPage isLoggedIn onLoginSuccess={vi.fn()} />
				</MemoryRouter>
			</ThemeProvider>,
		);

		expect(screen.getByTestId("vendors").textContent).toBe("vendors:1");
		expect(screen.queryByTestId("prices")).toBeNull();

		fireEvent.click(screen.getByRole("tab", { name: "Cart" }));
		await waitFor(() =>
			expect(screen.getByTestId("vendors").textContent).toBe("cart:1"),
		);

		fireEvent.click(screen.getByRole("tab", { name: "Prices" }));
		await waitFor(() => expect(screen.getByTestId("prices").textContent).toBe("1"));

		fireEvent.click(screen.getByRole("tab", { name: "Market" }));
		await waitFor(() =>
			expect(screen.getByTestId("vendors").textContent).toBe("vendors:1"),
		);
		expect(mounts.prices).toBe(1);
	});

	it("opens authentication over the logged-out Store tab", async () => {
		render(
			<ThemeProvider theme={createTheme()}>
				<MemoryRouter initialEntries={["/cosm?tab=store"]}>
					<CosmPage isLoggedIn={false} onLoginSuccess={vi.fn()} />
				</MemoryRouter>
			</ThemeProvider>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Login or Register" }));
		await waitFor(() => expect(screen.getByTestId("authentication")).toBeTruthy());
	});
});
