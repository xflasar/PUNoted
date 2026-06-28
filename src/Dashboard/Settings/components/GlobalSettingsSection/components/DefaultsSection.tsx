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

	const showCxCode = cxCode || "";
	const showCurrency = currency || "";

	const uniqueCurrencies = Array.from(
		new Set(exchanges.map((cx) => cx.currencyCode)),
	);

	const selectExchanges = [...exchanges];
	if (showCxCode && !selectExchanges.some((cx) => cx.code === showCxCode)) {
		selectExchanges.push({ code: showCxCode, name: "Loading...", currencyCode: showCurrency });
	}

	const selectCurrencies = [...uniqueCurrencies];
	if (showCurrency && !selectCurrencies.includes(showCurrency)) {
		selectCurrencies.push(showCurrency);
	}

	return (
		<Box sx={{ display: "flex", gap: 2 }}>
			<FormControl fullWidth size="small">
				<InputLabel>Default CX</InputLabel>
				<Select
					value={showCxCode}
					label="Default CX"
					onChange={(e) => onChange("default_cx_code", e.target.value)}
					MenuProps={menuProps}
				>
					{selectExchanges.map((cx) => (
						<MenuItem key={cx.code} value={cx.code}>
							{cx.code} - {cx.name}
						</MenuItem>
					))}
				</Select>
			</FormControl>
			<FormControl fullWidth size="small">
				<InputLabel>Default Currency</InputLabel>
				<Select
					value={showCurrency}
					label="Default Currency"
					onChange={(e) => onChange("default_currency", e.target.value)}
					MenuProps={menuProps}
				>
					{selectCurrencies.map((curr) => (
						<MenuItem key={curr} value={curr}>
							{curr}
						</MenuItem>
					))}
				</Select>
			</FormControl>
		</Box>
	);
};
