import React, { useState, useEffect, useRef } from "react";
import { TextField, InputAdornment, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";

export interface FormattedNumberInputProps {
	label: string;
	value: number | "";
	onChange: (val: number | "") => void;
	placeholder?: string;
	unit?: string;
	icon?: React.ReactNode;
	size?: "small" | "medium";
	required?: boolean;
	fullWidth?: boolean;
	disabled?: boolean;
	helperText?: React.ReactNode;
	error?: boolean;
}

/**
 * Reusable debounced numeric text input with comma formatting (e.g. 125,345.5 ICA)
 */
export const FormattedNumberInput: React.FC<FormattedNumberInputProps> = ({
	label,
	value,
	onChange,
	placeholder,
	unit,
	icon,
	size = "small",
	required = false,
	fullWidth = true,
	disabled = false,
	helperText,
	error = false,
}) => {
	const theme = useTheme();

	const formatNum = (n: number | "") => {
		if (n === "" || isNaN(Number(n))) return "";
		return Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
	};

	const [textValue, setTextValue] = useState<string>(formatNum(value));
	const [isFocused, setIsFocused] = useState(false);
	const timerRef = useRef<any>(null);

	// Sync when external reset occurs or when not focused
	useEffect(() => {
		if (value === "") {
			setTextValue("");
		} else if (!isFocused) {
			setTextValue(formatNum(value));
		}
	}, [value, isFocused]);

	const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const raw = e.target.value;
		setTextValue(raw);

		if (timerRef.current) clearTimeout(timerRef.current);

		timerRef.current = setTimeout(() => {
			const sanitized = raw.replace(/,/g, "").trim();
			if (!sanitized) {
				onChange("");
			} else {
				const parsed = parseFloat(sanitized);
				onChange(isNaN(parsed) ? "" : Math.max(0, parsed));
			}
		}, 250);
	};

	const handleBlur = () => {
		setIsFocused(false);
		const sanitized = textValue.replace(/,/g, "").trim();
		if (!sanitized) {
			setTextValue("");
			onChange("");
		} else {
			const parsed = parseFloat(sanitized);
			if (!isNaN(parsed)) {
				setTextValue(formatNum(parsed));
				onChange(parsed);
			}
		}
	};

	const handleFocus = () => {
		setIsFocused(true);
	};

	return (
		<TextField
			label={label}
			size={size}
			value={textValue}
			onChange={handleTextChange}
			onFocus={handleFocus}
			onBlur={handleBlur}
			placeholder={placeholder}
			required={required}
			fullWidth={fullWidth}
			disabled={disabled}
			helperText={helperText}
			error={error}
			slotProps={{
				input: {
					startAdornment: icon ? (
						<InputAdornment position="start">
							{icon}
						</InputAdornment>
					) : undefined,
					endAdornment: unit ? (
						<InputAdornment position="end">
							<Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", fontSize: "0.7rem" }}>
								{unit}
							</Typography>
						</InputAdornment>
					) : undefined,
				},
			}}
			sx={{
				"& .MuiOutlinedInput-root": {
					bgcolor: alpha(theme.palette.background.default, 0.5),
				},
			}}
		/>
	);
};
