import React, { useEffect, useMemo, useState } from "react";
import {
	alpha,
	Autocomplete,
	Box,
	TextField,
	Typography,
	useTheme,
	type SxProps,
	type Theme,
} from "@mui/material";

export type LocationOption = { id: string; name?: string };
export const ALL_LOCATIONS_ID = "all-locations";
export const HORTUS_LOCATION_CODE = "HRT";
export const NOT_HORTUS_LOCATION = "not-hortus";
export const matchesLocationFilter = (
	location: { location_code?: string; location_name?: string },
	value: string | null,
) =>
	value === null ||
	(value === NOT_HORTUS_LOCATION
		? location.location_code !== HORTUS_LOCATION_CODE
		: location.location_code === value || location.location_name === value);

const ALL_LOCATIONS = { id: ALL_LOCATIONS_ID, name: "All Locations" };
const NOT_HORTUS = { id: NOT_HORTUS_LOCATION, name: "Not Hortus Station" };
const formatLocation = (option: LocationOption) =>
	option.id === ALL_LOCATIONS_ID ||
	option.id === HORTUS_LOCATION_CODE ||
	option.id === NOT_HORTUS_LOCATION
		? option.name || option.id
		: option.name && option.name !== option.id
			? `${option.name} (${option.id})`
			: option.name || option.id;

const LocationFilter = ({
	locations,
	value,
	onChange,
	sx,
	popperSx,
}: {
	locations: LocationOption[];
	value: string | null;
	onChange: (value: string | null) => void;
	sx?: SxProps<Theme>;
	popperSx?: SxProps<Theme>;
}) => {
	const theme = useTheme();
	const [inputValue, setInputValue] = useState("");
	const options = useMemo(() => {
		const sortedLocations = [...locations].sort((a, b) => {
			if (a.id === HORTUS_LOCATION_CODE) return -1;
			if (b.id === HORTUS_LOCATION_CODE) return 1;
			return formatLocation(a).localeCompare(formatLocation(b));
		});
		const hortus = sortedLocations.find(
			(location) => location.id === HORTUS_LOCATION_CODE,
		);
		return hortus
			? [
					ALL_LOCATIONS,
					hortus,
					NOT_HORTUS,
					...sortedLocations.filter((location) => location !== hortus),
				]
			: [ALL_LOCATIONS, ...sortedLocations];
	}, [locations]);

	useEffect(() => {
		setInputValue(
			value
				? formatLocation(
						options.find((option) => option.id === value) || { id: value },
					)
				: "",
		);
	}, [options, value]);

	return (
		<Autocomplete<LocationOption, false, false, false>
			size="small"
			options={options}
			value={
				value ? options.find((option) => option.id === value) || null : null
			}
			onChange={(_event, option) => {
				const nextValue =
					option?.id === ALL_LOCATIONS.id ? null : option?.id || null;
				setInputValue(nextValue ? formatLocation(option!) : "");
				onChange(nextValue);
			}}
			inputValue={inputValue}
			onInputChange={(_event, nextInputValue, reason) => {
				if (reason === "input") setInputValue(nextInputValue);
			}}
			getOptionLabel={formatLocation}
			isOptionEqualToValue={(option, selected) => option.id === selected.id}
			renderOption={(props, option) => (
				<Box
					component="li"
					{...props}
					sx={
						option.id === NOT_HORTUS_LOCATION
							? { borderBottom: `1px solid ${theme.palette.divider}`, mb: 0.5 }
							: undefined
					}
				>
					<Typography variant="body2">{formatLocation(option)}</Typography>
				</Box>
			)}
			slotProps={{
				paper: {
					sx: {
						bgcolor: theme.palette.background.default,
						backgroundImage: "none",
					},
				},
				popper: popperSx ? { sx: popperSx } : undefined,
			}}
			sx={[
				{
					"& .MuiAutocomplete-clearIndicator": {
						visibility: value ? "visible" : "hidden",
						opacity: value ? 1 : 0,
					},
					"& .MuiOutlinedInput-root": {
						height: 40,
						bgcolor: alpha(theme.palette.background.default, 0.5),
						backdropFilter: "blur(5px)",
						borderRadius: "12px",
						"& fieldset": {
							borderColor: alpha(theme.palette.common.white, 0.1),
						},
						"&:hover fieldset": { borderColor: theme.palette.primary.main },
						"&.Mui-focused fieldset": {
							borderColor: theme.palette.primary.main,
						},
						color: theme.palette.text.primary,
					},
				},
				sx,
			]}
			renderInput={(params) => (
				<TextField {...params} variant="outlined" placeholder="All Locations" />
			)}
		/>
	);
};

export default LocationFilter;
