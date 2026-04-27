import React, { useState } from "react";
import { Paper, TextField, IconButton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useTheme } from "@mui/material/styles";

interface SearchBarProps {
	onSearch: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
	const theme = useTheme();
	const [inputValue, setInputValue] = useState("");

	const handleSearch = () => {
		onSearch(inputValue);
	};

	const handleKeyDown = (event: React.KeyboardEvent) => {
		if (event.key === "Enter") {
			handleSearch();
		}
	};

	return (
		<Paper
			component="form"
			elevation={10}
			sx={{
				position: "absolute",
				top: 10,
				left: "50%",
				transform: "translateX(-50%)",
				zIndex: 11,
				padding: "2px 4px",
				display: "flex",
				alignItems: "center",
				width: "40%",
				background: theme.palette.background.paper,
				border: `1px solid ${theme.palette.primary.main}`,
				boxShadow: `0 0 15px ${theme.palette.primary.main}`,
			}}
		>
			<TextField
				fullWidth
				variant="standard"
				placeholder="Search for a system or planet..."
				value={inputValue}
				onChange={(e) => setInputValue(e.target.value)}
				onKeyDown={handleKeyDown}
				InputProps={{
					disableUnderline: true,
					style: {
						paddingLeft: "10px",
						color: theme.palette.text.primary,
					},
				}}
			/>
			<IconButton
				type="button"
				sx={{ p: "10px" }}
				aria-label="search"
				onClick={handleSearch}
			>
				<SearchIcon />
			</IconButton>
		</Paper>
	);
};

export default SearchBar;
