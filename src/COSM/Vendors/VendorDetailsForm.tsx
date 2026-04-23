import React, { useMemo, useCallback } from "react";
import {
	Paper,
	Grid,
	TextField,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Button,
	CircularProgress,
	useTheme,
	Box,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

/**
 * Props for the VendorDetailsForm component.
 */
interface VendorDetailsFormProps {
	/** The current details of the vendor */
	vendorDetails: {
		companyName: string;
		gameName: string;
		companyCode: string;
		corpName: string;
		cx: string;
	};
	/** Indicates whether the vendor details are synchronized from an external source */
	isSynchronized: boolean;
	/** Indicates if a save operation is currently in progress */
	isSaving: boolean;
	/** Indicates if a delete operation is currently in progress */
	isDeleting: boolean;
	/** Callback to handle changes to individual vendor detail fields */
	onDetailChange: (
		field: keyof VendorDetailsFormProps["vendorDetails"],
		value: string,
	) => void;
	/** Callback to initiate the deletion of the vendor */
	onDelete: () => void;
}

const CX_OPTIONS = ["AI1", "CI2", "CI1", "IC1", "NC2", "NC1"];

/**
 * Form component for displaying and editing vendor details.
 *
 * @param {VendorDetailsFormProps} props - The component props.
 * @returns {React.ReactElement} The rendered form component.
 */
const VendorDetailsForm: React.FC<VendorDetailsFormProps> = ({
	vendorDetails,
	isSynchronized,
	isSaving,
	isDeleting,
	onDetailChange,
	onDelete,
}) => {
	const theme = useTheme();

	// Memoize common styles to prevent recreation on each render
	const textFieldSx = useMemo(
		() => ({
			"& .MuiOutlinedInput-root": {
				color: theme.palette.text.primary,
				"& fieldset": { borderColor: theme.palette.divider },
				"&:hover fieldset": {
					borderColor: theme.palette.divider,
				},
				"&.Mui-focused fieldset": {
					borderColor: theme.palette.primary.main,
				},
			},
			"& .Mui-disabled .MuiOutlinedInput-notchedOutline": {
				borderColor: theme.palette.divider,
			},
			"& .Mui-disabled .MuiInputBase-input": {
				color: theme.palette.text.secondary,
				"-webkit-text-fill-color": theme.palette.text.secondary,
			},
		}),
		[theme],
	);

	const inputLabelSx = useMemo(
		() => ({
			color: theme.palette.text.secondary,
			"&.Mui-focused": { color: theme.palette.primary.main },
			"&.Mui-disabled": { color: theme.palette.text.disabled },
		}),
		[theme],
	);

	/**
	 * Determines if a specific field should be disabled.
	 * If synchronized, all fields except CX are disabled.
	 */
	const isFieldDisabled = useCallback(
		(fieldName: keyof VendorDetailsFormProps["vendorDetails"]) => {
			if (fieldName === "cx") return false;
			return isSynchronized;
		},
		[isSynchronized],
	);

	return (
		<Box
			sx={{
				width: "100%",
				maxWidth: "80%",
			}}
		>
			<Paper
				elevation={0}
				sx={{
					p: 2,
					background: theme.palette.background.default,
					border: `1px solid ${theme.palette.divider}`,
					borderRadius: 2,
				}}
			>
				<Grid container spacing={1.5} sx={{ justifyContent: "center" }}>
					{/* Row 1: The Identifiers */}
					<Grid item xs={12} sm={6} md={2.4}>
						<TextField
							fullWidth
							label="Company Name"
							variant="outlined"
							size="small"
							value={vendorDetails.companyName}
							onChange={(e) => onDetailChange("companyName", e.target.value)}
							disabled={isFieldDisabled("companyName")}
							sx={textFieldSx}
							InputLabelProps={{ sx: inputLabelSx }}
						/>
					</Grid>
					<Grid item xs={12} sm={6} md={2.4}>
						<TextField
							fullWidth
							label="Game Name"
							variant="outlined"
							size="small"
							value={vendorDetails.gameName}
							onChange={(e) => onDetailChange("gameName", e.target.value)}
							disabled={isFieldDisabled("gameName")}
							sx={textFieldSx}
							InputLabelProps={{ sx: inputLabelSx }}
						/>
					</Grid>
					<Grid item xs={12} sm={6} md={2.4}>
						<TextField
							fullWidth
							label="Company Code"
							variant="outlined"
							size="small"
							value={vendorDetails.companyCode}
							onChange={(e) => onDetailChange("companyCode", e.target.value)}
							disabled={isFieldDisabled("companyCode")}
							sx={textFieldSx}
							InputLabelProps={{ sx: inputLabelSx }}
						/>
					</Grid>
					<Grid item xs={12} sm={6} md={2.4}>
						<TextField
							fullWidth
							label="Corp Name"
							variant="outlined"
							size="small"
							value={vendorDetails.corpName}
							onChange={(e) => onDetailChange("corpName", e.target.value)}
							disabled={isFieldDisabled("corpName")}
							sx={textFieldSx}
							InputLabelProps={{ sx: inputLabelSx }}
						/>
					</Grid>

					{/* Row 2 / End of Row 1: Location & Actions */}
					<Grid item xs={6} sm={6} md={1.2}>
						<FormControl fullWidth variant="outlined" size="small">
							<InputLabel id="cx-select-label" sx={inputLabelSx}>
								CX
							</InputLabel>
							<Select
								labelId="cx-select-label"
								value={vendorDetails.cx}
								onChange={(e) => onDetailChange("cx", e.target.value as string)}
								label="CX"
								sx={textFieldSx}
								MenuProps={{
									PaperProps: {
										sx: {
											background: theme.palette.background.paper,
											border: `1px solid ${theme.palette.divider}`,
										},
									},
								}}
							>
								{CX_OPTIONS.map((cx) => (
									<MenuItem key={cx} value={cx}>
										{cx}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</Grid>

					<Grid item xs={6} sm={6} md={1.2}>
						<Button
							fullWidth
							variant="outlined"
							color="error"
							size="small"
							onClick={onDelete}
							disabled={isSaving || isDeleting}
							startIcon={
								isDeleting ? (
									<CircularProgress size={16} color="inherit" />
								) : (
									<DeleteIcon fontSize="small" />
								)
							}
							sx={{ height: "40px", whiteSpace: "nowrap" }}
						>
							Delete
						</Button>
					</Grid>
				</Grid>
			</Paper>
		</Box>
	);
};

export default VendorDetailsForm;
