import React, { useMemo, useState } from "react";
import {
	alpha,
	Autocomplete,
	Box,
	createFilterOptions,
	TextField,
	Typography,
	useTheme,
	type SxProps,
	type Theme,
} from "@mui/material";
import { RotateCcw } from "lucide-react";
import {
	formatLocation as formatLocationName,
	useLocationFormatVersion,
} from "../utils/formatlocation";

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
		: formatLocationName(option.name, option.id);
const filterOptions = createFilterOptions<LocationOption>({
	stringify: formatLocation,
});

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
	const locationFormatVersion = useLocationFormatVersion();
	const [inputValue, setInputValue] = useState<string | null>(null);
	const [open, setOpen] = useState(false);
	const options = useMemo(() => {
		const hortus = locations.find(
			(location) => location.id === HORTUS_LOCATION_CODE,
		);
		const otherLocations = locations
			.filter((location) => location.id !== HORTUS_LOCATION_CODE)
			.sort((a, b) => formatLocation(a).localeCompare(formatLocation(b)));
		return hortus
			? [hortus, NOT_HORTUS, ALL_LOCATIONS, ...otherLocations]
			: [ALL_LOCATIONS, ...otherLocations];
	}, [locationFormatVersion, locations]);
	const selectedOption =
		value === null
			? ALL_LOCATIONS
			: options.find((option) => option.id === value) || null;
	const selectedLabel = selectedOption
		? formatLocation(selectedOption)
		: value || "";
	const canClear = value !== HORTUS_LOCATION_CODE;

	return (
		<Autocomplete<LocationOption, false, false, false>
			size="small"
			clearIcon={<RotateCcw size={18} />}
			options={options}
			open={open}
			onOpen={() => setOpen(true)}
			onClose={() => setOpen(false)}
			filterOptions={(locations, state) =>
				state.inputValue === selectedLabel
					? locations
					: filterOptions(locations, state)
			}
			value={selectedOption}
			onChange={(event, option) => {
				// MUI also reports erased text as a clear change; only the button resets.
				if (!option && event.type !== "click") return;
				if (!option) setOpen(false);
				const nextValue =
					option?.id === ALL_LOCATIONS.id
						? null
						: option?.id || HORTUS_LOCATION_CODE;
				setInputValue(null);
				onChange(nextValue);
			}}
			inputValue={inputValue ?? selectedLabel}
			onInputChange={(_event, nextInputValue, reason) => {
				if (reason !== "input") return;
				setInputValue(nextInputValue);
			}}
			onBlur={() => setInputValue(null)}
			getOptionLabel={formatLocation}
			isOptionEqualToValue={(option, selected) => option.id === selected.id}
			renderOption={(props, option) => {
				const { key, ...optionProps } = props;
				return (
					<Box
						component="li"
						key={key}
						{...optionProps}
						sx={
							option.id === ALL_LOCATIONS_ID
								? {
										borderBottom: `1px solid ${theme.palette.divider}`,
										mb: 0.5,
									}
								: undefined
						}
					>
						<Typography variant="body2">{formatLocation(option)}</Typography>
					</Box>
				);
			}}
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
						visibility: canClear ? "visible" : "hidden",
						opacity: canClear ? 1 : 0,
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
				...(Array.isArray(sx) ? sx : sx ? [sx] : []),
			]}
			renderInput={(params) => (
				<TextField {...params} variant="outlined" placeholder="Location" />
			)}
		/>
	);
};

export default LocationFilter;
