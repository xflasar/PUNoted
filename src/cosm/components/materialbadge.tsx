import type { ReactNode } from "react";

type MaterialBadgeProps = {
	ticker: string | null | undefined;
	children?: ReactNode;
};

export default function MaterialBadge({
	ticker,
	children,
}: MaterialBadgeProps) {
	const text = String(ticker ?? "").trim();
	const cls = `mat mat-${text.toLowerCase()}`;
	return <span className={cls}>{children ?? text}</span>;
}
