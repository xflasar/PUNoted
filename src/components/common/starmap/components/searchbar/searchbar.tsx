import React, { useState, useEffect, useMemo } from "react";
import {
	Paper,
	TextField,
	IconButton,
	Collapse,
	Box,
	Autocomplete,
	Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import TuneIcon from "@mui/icons-material/Tune";
import PublicIcon from "@mui/icons-material/Public";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { useTheme } from "@mui/material/styles";
import FilterPanel from "../filter/filterpanel";

interface SearchOption {
	label: string;
	id: string;
	type: "system" | "planet";
	systemId?: string;
	x?: number;
	y?: number;
}

interface SearchBarProps {
	options: SearchOption[];
	onSelect: (option: SearchOption | null) => void;
	onSearchQueryChange?: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
	options,
	onSelect,
	onSearchQueryChange,
}) => {
	const theme = useTheme();
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

			if (labelMatch || idMatch || naturalIdMatch) {
				matches.push(opt);
				if (matches.length >= 50) break; // Hard limit for performance
			}
		}
		return matches;
	}, [options, inputValue]);

	const handleSearch = () => {
		if (selectedValue) {
			onSelect(selectedValue);
		} else if (inputValue.trim()) {
			const query = inputValue.toLowerCase();
			const match = options.find((opt) => {
				const labelMatch = opt.label.toLowerCase().includes(query);
				const idMatch = opt.id.toLowerCase().includes(query);
				const naturalIdMatch = (opt as any).naturalId
					?.toLowerCase()
					.includes(query);
				return labelMatch || idMatch || naturalIdMatch;
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
				top: 10,
				left: "50%",
				transform: "translateX(-50%)",
				zIndex: 11,
				width: "40%",
				minWidth: 320,
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
						if (newValue !== selectedValue) {
							setSelectedValue(newValue as SearchOption);
							if (newValue) {
								onSelect(newValue);
							}
						}
					}}
					onInputChange={(_, newInputValue, reason) => {
						setInputValue(newInputValue);
						if (reason === "clear") {
							setSelectedValue(null);
						}
					}}
					onKeyDown={handleKeyDown}
					// Custom styling for dropdown menu container - needs fix
					PaperComponent={({ children, ...other }) => (
						<Paper
							{...other}
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
						>
							{children}
						</Paper>
					)}
					renderOption={(props, option) => {
						const { key, ...otherProps } = props as any;
						return (
							<Box
								key={option.id || key}
								component="li"
								{...otherProps}
								sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1 }}
							>
								{option.type === "system" ? (
									<AutoAwesomeIcon sx={{ fontSize: 16, color: "#00e5ff" }} />
								) : (
									<PublicIcon sx={{ fontSize: 16, color: "#00ff88" }} />
								)}
								<Typography sx={{ fontSize: "0.8rem", fontWeight: 500 }}>
									{option.label}
								</Typography>
							</Box>
						);
					}}
					renderInput={(params) => {
						const { InputProps, ...rest } = params;
						return (
							<TextField
								{...rest}
								variant="standard"
								placeholder="Search for a system or planet..."
								InputProps={{
									...InputProps,
									disableUnderline: true,
									style: {
										paddingLeft: "10px",
										color: theme.palette.text.primary,
										fontSize: "0.85rem",
									},
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
