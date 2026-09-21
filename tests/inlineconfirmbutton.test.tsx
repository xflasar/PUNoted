import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import InlineConfirmButton from "../src/COSM/components/inlineconfirmbutton";

describe("InlineConfirmButton", () => {
	afterEach(() => vi.useRealTimers());

	it("requires a second click within 2 seconds", () => {
		vi.useFakeTimers();
		const action = vi.fn();
		render(<InlineConfirmButton buttonText="Clear" action={action} />);

		fireEvent.click(screen.getByRole("button", { name: "Clear" }));
		expect(screen.getByRole("button", { name: "Sure?" })).toBeTruthy();
		fireEvent.click(screen.getByRole("button", { name: "Sure?" }));
		expect(action).toHaveBeenCalledOnce();

		fireEvent.click(screen.getByRole("button", { name: "Clear" }));
		act(() => vi.advanceTimersByTime(2000));
		expect(screen.getByRole("button", { name: "Clear" })).toBeTruthy();
		expect(action).toHaveBeenCalledOnce();
	});

	it("does not confirm or act while disabled", () => {
		const action = vi.fn();
		render(<InlineConfirmButton buttonText="Clear" action={action} disabled />);

		fireEvent.click(screen.getByRole("button", { name: "Clear" }));
		expect(screen.getByRole("button", { name: "Clear" }).disabled).toBe(true);
		expect(action).not.toHaveBeenCalled();
	});

	it("cancels confirmation when the pointer leaves", () => {
		const action = vi.fn();
		render(<InlineConfirmButton buttonText="Clear" action={action} />);

		const button = screen.getByRole("button", { name: "Clear" });
		fireEvent.click(button);
		fireEvent.mouseLeave(screen.getByRole("button", { name: "Sure?" }));
		expect(screen.getByRole("button", { name: "Clear" })).toBeTruthy();
		expect(action).not.toHaveBeenCalled();
	});
});
