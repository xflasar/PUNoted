import React, { useState, useEffect, useMemo } from "react";
import {
	Paper,
	TextField,
	IconButton,
	Collapse,
	Box,
	Autocomplete,
	Typography,
	useMediaQuery,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import TuneIcon from "@mui/icons-material/Tune";
import PublicIcon from "@mui/icons-material/Public";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { useTheme } from "@mui/material/styles";
import FilterPanel from "../filter/filterpanel";
import type { SearchOption } from "../../hooks/usemapsearchoptions";

interface SearchBarProps {
	options: SearchOption[];
	onSelect: (option: SearchOption | null) => void;
	onSearchQueryChange?: (query: string) => void;
}

const CustomAutocompletePaper = React.forwardRef<HTMLDivElement, any>(
	(props, ref) => (
		<Paper
			{...props}
			ref={ref}
			elevation={12}
			sx={{
				background:
					"linear-gradient(135deg, rgba(15, 18, 28, 0.95) 0%, rgba(8, 10, 15, 0.98) 100%)",
				backdropFilter: "blur(24px)",
				border: "1px solid rgba(255, 255, 255, 0.08)",
				boxShadow: "0 10px 40px rgba(0, 0, 0, 0.6)",
				color: "white",
				"& .MuiAutocomplete-groupLabel": {
					background: "rgba(0, 0, 0, 0.4)",
					color: "#00e5ff",
					fontSize: "0.65rem",
					fontWeight: 800,
					textTransform: "uppercase",
					letterSpacing: "0.1em",
					py: 0.5,
				},
				"& .MuiAutocomplete-option": {
					fontSize: "0.8rem",
					color: "rgba(255, 255, 255, 0.8)",
					'&[aria-selected="true"]': {
						backgroundColor: "rgba(0, 229, 255, 0.15)",
						color: "#00e5ff",
					},
					"&.Mui-focused": {
						backgroundColor: "rgba(255, 255, 255, 0.06)",
					},
				},
			}}
		/>
	),
);

const SearchBar: React.FC<SearchBarProps> = ({
	options,
	onSelect,
	onSearchQueryChange,
}) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
	const [inputValue, setInputValue] = useState("");
	const [debouncedInput, setDebouncedInput] = useState("");
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [selectedValue, setSelectedValue] = useState<SearchOption | null>(null);

	// Debounce input value changes
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedInput(inputValue);
		}, 300);
		return () => clearTimeout(timer);
	}, [inputValue]);

	useEffect(() => {
		if (onSearchQueryChange) {
			onSearchQueryChange(debouncedInput);
		}
	}, [debouncedInput, onSearchQueryChange]);

	// Filter options based on instant input value locally (limit to 50 results)
	const filteredOptions = useMemo(() => {
		const query = inputValue.trim().toLowerCase();
		if (!query) {
			return [];
		}
		const matches: SearchOption[] = [];

		for (const opt of options) {
			const labelMatch = opt.label.toLowerCase().includes(query);
			const idMatch = opt.id.toLowerCase().includes(query);
			const naturalIdMatch = (opt as any).naturalId
				?.toLowerCase()
				.includes(query);
			const systemNameMatch = opt.systemName?.toLowerCase().includes(query);

			if (labelMatch || idMatch || naturalIdMatch || systemNameMatch) {
				matches.push(opt);
			}
		}

		// Sort: startsWith query first, then systems, then alphabetical
		matches.sort((a, b) => {
			const aStarts = a.label.toLowerCase().startsWith(query);
			const bStarts = b.label.toLowerCase().startsWith(query);
			if (aStarts && !bStarts) return -1;
			if (!aStarts && bStarts) return 1;

			if (a.type !== b.type) {
				return a.type === "system" ? -1 : 1;
			}
			return a.label.localeCompare(b.label);
		});

		return matches.slice(0, 50);
	}, [options, inputValue]);

	const handleSearch = () => {
		if (selectedValue) {
			onSelect(selectedValue);
		} else if (inputValue.trim()) {
			const query = inputValue.trim().toLowerCase();
			const match =
				filteredOptions[0] ||
				options.find((opt) => {
					const labelMatch = opt.label.toLowerCase().includes(query);
					const idMatch = opt.id.toLowerCase().includes(query);
					const naturalIdMatch = (opt as any).naturalId
						?.toLowerCase()
						.includes(query);
					const systemNameMatch = opt.systemName?.toLowerCase().includes(query);
					return labelMatch || idMatch || naturalIdMatch || systemNameMatch;
				});
			if (match) {
				onSelect(match);
				setSelectedValue(match);
			}
		}
	};

	const handleKeyDown = (event: React.KeyboardEvent) => {
		if (event.key === "Enter") {
			event.preventDefault();
			handleSearch();
		}
	};

	return (
		<Box
			sx={{
				position: "absolute",
				top: { xs: 8, sm: 12, md: 16 },
				left: "50%",
				transform: "translateX(-50%)",
				zIndex: 1001,
				width: {
					xs: "calc(100% - 24px)",
					sm: "380px",
					md: "460px",
					lg: "520px",
				},
				maxWidth: 520,
			}}
		>
			<Paper
				elevation={10}
				sx={{
					padding: "2px 4px",
					display: "flex",
					alignItems: "center",
					background:
						"linear-gradient(135deg, rgba(15, 18, 28, 0.85) 0%, rgba(8, 10, 15, 0.95) 100%)",
					backdropFilter: "blur(24px)",
					border: "1px solid rgba(255, 255, 255, 0.08)",
					boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
					borderRadius: filtersOpen ? "8px 8px 0 0" : "8px",
				}}
			>
				<Autocomplete
					fullWidth
					freeSolo
					clearOnBlur={false}
					options={filteredOptions}
					filterOptions={(x) => x} // Disable MUI's built-in filtering since we do it via filteredOptions state
					groupBy={(option) =>
						(option as any).type === "system" ? "Star Systems" : "Planets"
					}
					getOptionLabel={(option) =>
						typeof option === "string" ? option : option.label
					}
					isOptionEqualToValue={(option, value) => option.id === value.id}
					value={selectedValue}
					onChange={(_, newValue) => {
						if (!newValue) {
							setSelectedValue(null);
							return;
						}
						let selectedOpt: SearchOption | null = null;
						if (typeof newValue === "string") {
							const q = (newValue as string).trim().toLowerCase();
							selectedOpt =
								options.find(
									(opt) =>
										opt.label.toLowerCase() === q || opt.id.toLowerCase() === q,
								) || null;
						} else {
							selectedOpt = newValue as SearchOption;
						}

						if (selectedOpt) {
							setSelectedValue(selectedOpt);
							onSelect(selectedOpt);
						}
					}}
					onInputChange={(_, newInputValue, reason) => {
						setInputValue(newInputValue);
						if (reason === "clear") {
							setSelectedValue(null);
						}
					}}
					onKeyDown={handleKeyDown}
					PaperComponent={CustomAutocompletePaper}
					renderOption={(props, option) => {
						const { key, ...otherProps } = props as any;
						return (
							<Box
								key={key || option.id}
								component="li"
								{...otherProps}
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 1.5,
									py: 0.75,
								}}
							>
								{option.type === "system" ? (
									<AutoAwesomeIcon sx={{ fontSize: 18, color: "#00e5ff" }} />
								) : (
									<PublicIcon sx={{ fontSize: 18, color: "#00ff88" }} />
								)}
								<Box
									sx={{
										display: "flex",
										flexDirection: "column",
										minWidth: 0,
										flexGrow: 1,
									}}
								>
									<Typography
										sx={{
											fontSize: "0.85rem",
											fontWeight: 600,
											color: "#ffffff",
											lineHeight: 1.2,
										}}
									>
										{option.label}
									</Typography>
									{option.type === "planet" && option.systemName && (
										<Typography
											variant="caption"
											sx={{
												fontSize: "0.7rem",
												color: "rgba(255, 255, 255, 0.45)",
												lineHeight: 1.1,
												mt: 0.2,
											}}
										>
											System: {option.systemName}
										</Typography>
									)}
								</Box>
							</Box>
						);
					}}
					renderInput={(params) => {
						const { InputProps, ...restParams } = params;
						return (
							<TextField
								{...restParams}
								variant="standard"
								placeholder={
									isMobile
										? "Search systems / planets..."
										: "Search for a system or planet..."
								}
								sx={{
									"& .MuiInputBase-input::placeholder": {
										color: "rgba(255, 255, 255, 0.4)",
										opacity: 1,
									},
									"& .MuiInput-root": {
										paddingLeft: "10px",
										color: "#ffffff",
										fontSize: "0.85rem",
									},
								}}
								InputProps={{
									...InputProps,
									disableUnderline: true,
								}}
							/>
						);
					}}
				/>
				<IconButton
					type="button"
					sx={{
						p: "8px",
						color: "rgba(255, 255, 255, 0.5)",
						"&:hover": { color: "#00e5ff" },
					}}
					aria-label="search"
					onClick={handleSearch}
				>
					<SearchIcon sx={{ fontSize: 20 }} />
				</IconButton>
				<IconButton
					type="button"
					sx={{
						p: "8px",
						color: filtersOpen ? "#00e5ff" : "rgba(255, 255, 255, 0.5)",
						"&:hover": { color: "#00e5ff" },
					}}
					aria-label="toggle filters"
					onClick={() => setFiltersOpen((p) => !p)}
				>
					<TuneIcon sx={{ fontSize: 20 }} />
				</IconButton>
			</Paper>
			<Collapse in={filtersOpen} unmountOnExit>
				<Paper
					elevation={10}
					sx={{
						background:
							"linear-gradient(135deg, rgba(15, 18, 28, 0.85) 0%, rgba(8, 10, 15, 0.95) 100%)",
						backdropFilter: "blur(24px)",
						border: "1px solid rgba(255, 255, 255, 0.08)",
						borderTop: "none",
						borderRadius: "0 0 8px 8px",
						boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
						maxHeight: "45vh",
						display: "flex",
						flexDirection: "column",
						overflow: "hidden",
					}}
				>
					<FilterPanel />
				</Paper>
			</Collapse>
		</Box>
	);
};

export default SearchBar;
