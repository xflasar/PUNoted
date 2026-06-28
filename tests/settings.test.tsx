import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SettingsPage from "../src/dashboard/settings/settings";

// Mock fetch calls
global.fetch = vi.fn((url: string) => {
	if (url.includes("/users/settings")) {
		return Promise.resolve({
			ok: true,
			json: () => Promise.resolve({ isSynchronized: true, username: "TestUser" }),
		});
	}
	if (url.includes("/settings/global")) {
		return Promise.resolve({
			ok: true,
			json: () => Promise.resolve({
				default_cx_code: "IC1",
				default_currency: "AIC",
				internal_excluded_sites: [],
				internal_leased_sites: []
			}),
		});
	}
	if (url.includes("/settings/tokens")) {
		return Promise.resolve({
			ok: true,
			json: () => Promise.resolve([]),
		});
	}
	if (url.includes("/settings/privacy")) {
		return Promise.resolve({
			ok: true,
			json: () => Promise.resolve({}),
		});
	}
	return Promise.reject(new Error("Unknown endpoint"));
}) as any;

// Mock WebSocket
global.WebSocket = class {
	onmessage: any = null;
	onopen: any = null;
	onclose: any = null;
	onerror: any = null;
	constructor(url: string) {}
	send(data: any) {}
	close() {}
} as any;

describe("SettingsPage Component", () => {
	it("renders correctly with loaded settings and shows tabs", async () => {
		render(<SettingsPage userId="123" />);

		// Wait for loading to finish and settings header to be defined
		await waitFor(() => {
			expect(screen.getAllByText("Settings").length).toBeGreaterThan(0);
		});

		// Verify Tab options are present
		expect(screen.getAllByText("Profile & Security").length).toBeGreaterThan(0);
		expect(screen.getAllByText("Game Config").length).toBeGreaterThan(0);
		expect(screen.getAllByText("API Integrations").length).toBeGreaterThan(0);

		// Click on "Game Config" tab
		const configTab = screen.getAllByText("Game Config")[0];
		fireEvent.click(configTab);

		expect(configTab).toBeDefined();
	});
});
