import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button, type ButtonProps } from "@mui/material";

type InlineConfirmButtonProps = {
	buttonText: string;
	confirmText?: string;
	icon?: ReactNode;
	color?: ButtonProps["color"];
	action: () => void;
	disabled?: boolean;
};

export default function InlineConfirmButton({
	buttonText,
	confirmText = "Sure?",
	icon,
	color = "primary",
	action,
	disabled = false,
}: InlineConfirmButtonProps) {
	const [confirming, setConfirming] = useState(false);
	const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
	const reset = () => {
		if (timeout.current) clearTimeout(timeout.current);
		timeout.current = null;
		setConfirming(false);
	};

	useEffect(
		() => () => {
			if (timeout.current) clearTimeout(timeout.current);
		},
		[],
	);

	return (
		<Button
			size="small"
			variant={confirming ? "contained" : "outlined"}
			color={color}
			startIcon={icon}
			disabled={disabled}
			onMouseLeave={reset}
			onClick={() => {
				if (confirming) {
					reset();
					action();
					return;
				}
				setConfirming(true);
				timeout.current = setTimeout(reset, 2000);
			}}
			sx={{ fontWeight: "bold" }}
		>
			{confirming ? confirmText : buttonText}
		</Button>
	);
}
