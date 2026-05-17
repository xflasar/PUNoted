import React from "react";
import {
	Box,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	useTheme,
} from "@mui/material";
import type { CommodityExchange, GlobalSettings } from "../types";

interface Props {
	cxCode: string | undefined;
	currency: string | undefined;
	exchanges: CommodityExchange[];
	onChange: (field: keyof GlobalSettings, value: any) => void;
}

export const DefaultsSection: React.FC<Props> = ({
	cxCode,
	currency,
	exchanges,
	onChange,
}) => {
	const theme = useTheme();

	const menuProps = {
		PaperProps: {
			sx: {
				bgcolor: theme.palette.background.default,
				backgroundImage: "none",
			},
		},
	};

	const uniqueCurrencies = Array.from(
		new Set(exchanges.map((cx) => cx.currencyCode)),
	);

	return (
		<Box sx={{ display: "flex", gap: 2 }}>
			<FormControl fullWidth size="small">
				<InputLabel>Default CX</InputLabel>
				<Select
					value={cxCode || ""}
					label="Default CX"
					onChange={(e) => onChange("default_cx_code", e.target.value)}
					MenuProps={menuProps}
				>
					{exchanges.map((cx) => (
						<MenuItem key={cx.code} value={cx.code}>
							{cx.code} - {cx.name}
						</MenuItem>
					))}
				</Select>
			</FormControl>
			<FormControl fullWidth size="small">
				<InputLabel>Default Currency</InputLabel>
				<Select
					value={currency || ""}
					label="Default Currency"
					onChange={(e) => onChange("default_currency", e.target.value)}
					MenuProps={menuProps}
				>
					{uniqueCurrencies.map((curr) => (
						<MenuItem key={curr} value={curr}>
							{curr}
						</MenuItem>
					))}
				</Select>
			</FormControl>
		</Box>
	);
};
