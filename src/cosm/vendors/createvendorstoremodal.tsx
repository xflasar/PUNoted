import {
	Box,
	TextField,
	Button,
	CircularProgress,
	Paper,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config/api";
import type { VendorStore } from "./types";
import { Toast } from "./toast";

type RequiredField = "companyName" | "gameName" | "companyCode" | "cx";
const cleanLocalStorageString = (value: string | null): string => {
	if (value === null || value === "null" || value === "undefined") {
		return "";
	}
	return value;
};

const VendorCreationModal: React.FC<{
	onVendorCreated: (vendorStore: VendorStore) => void;
}> = ({ onVendorCreated }) => {
	const theme = useTheme();
	const [isSaving, setIsSaving] = useState(false);
	const [showSaveError, setShowSaveError] = useState(false);
	const [invalidFields, setInvalidFields] = useState<Set<RequiredField>>(
		new Set(),
	);

	const [localCompanyName, setLocalCompanyName] = useState("");
	const [localCompanyCode, setLocalCompanyCode] = useState("");
	const [localCorpName, setLocalCorpName] = useState("");
	const [localGameName, setLocalGameName] = useState("");
	const [localCx, setLocalCx] = useState("IC1");
	const CX_OPTIONS = ["AI1", "CI2", "CI1", "IC1", "NC2", "NC1"];
	const clearInvalidField = (field: RequiredField) => {
		setInvalidFields((current) => {
			if (!current.has(field)) return current;
			const next = new Set(current);
			next.delete(field);
			return next;
		});
	};

	useEffect(() => {
		setLocalCompanyName(
			cleanLocalStorageString(localStorage.getItem("companyName")),
		);
		setLocalCompanyCode(
			cleanLocalStorageString(localStorage.getItem("companyCode")),
		);
		setLocalCorpName(
			cleanLocalStorageString(localStorage.getItem("corporationName")),
		);
		setLocalGameName(
			cleanLocalStorageString(localStorage.getItem("displayName")),
		);
		setLocalCx("IC1");
	}, []);

	const handleSave = async () => {
		// 1. Trim all local state variables before validation and payload creation
		const trimmedCompanyName = localCompanyName.trim();
		const trimmedGameName = localGameName.trim();
		const trimmedCompanyCode = localCompanyCode.trim();
		const trimmedCorpName = localCorpName.trim();
		const trimmedCx = localCx.trim();

		// 2. CLIENT-SIDE VALIDATION using trimmed values
		const requiredFields: Array<{ field: RequiredField; value: string }> = [
			{ field: "companyName", value: trimmedCompanyName },
			{ field: "gameName", value: trimmedGameName },
			{ field: "companyCode", value: trimmedCompanyCode },
			{ field: "cx", value: trimmedCx },
		];
		const invalid = new Set(
			requiredFields
				.filter((field) => field.value === "")
				.map((field) => field.field),
		);
		setInvalidFields(invalid);
		if (invalid.size > 0) {
			return;
		}
		setIsSaving(true);

		// 3. Use trimmed values in the payload
		const payload = {
			vendor_data: {
				companyname: trimmedCompanyName,
				companycode: trimmedCompanyCode,
				corpname: trimmedCorpName,
				gamename: trimmedGameName,
				cx: trimmedCx,
			},
			materials: [],
		};

		try {
			const response = await fetch(`${API_BASE_URL}create_vendor_store`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("authToken")}`,
				},
				body: JSON.stringify(payload),
			});

			const result = await response.json();
			if (!response.ok || !result.success) {
				throw new Error(result.message || "Failed to save changes.");
			}

			// Extract the complete vendor store object from the server response
			const newVendorStore = result.vendor_store;
			Object.entries({
				companyName: trimmedCompanyName,
				companyCode: trimmedCompanyCode,
				corporationName: trimmedCorpName,
				displayName: trimmedGameName,
			}).forEach(([key, value]) => localStorage.setItem(key, value));

			// Use the complete, server-generated data to update the state.
			onVendorCreated(newVendorStore);
		} catch (err) {
			console.error("Failed to save vendor store:", err);
			setShowSaveError(true);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Box
			sx={{
				height: "100%",
				width: "100%",
				overflowY: "auto",
				px: 2,
				mx: "auto",
				maxWidth: 520,
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
			}}
		>
			<Paper
				sx={{
					p: 3,
					background: theme.palette.background.paper,
					boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
					borderRadius: "15px",
					display: "flex",
					flexDirection: "column",
					gap: 2,
				}}
			>
				<TextField
					fullWidth
					label="User Name"
					variant="outlined"
					size="small"
					value={localGameName}
					error={invalidFields.has("gameName")}
					onChange={(e) => {
						setLocalGameName(e.target.value);
						clearInvalidField("gameName");
					}}
					sx={{
						"& .MuiOutlinedInput-root": {
							color: theme.palette.text.primary,
							"& fieldset": { borderColor: theme.palette.primary.dark },
							"&:hover fieldset": {
								borderColor: theme.palette.primary.light,
							},
							"&.Mui-focused fieldset": {
								borderColor: "rgb(123, 104, 238)",
							},
							"&.Mui-error fieldset": {
								borderColor: theme.palette.error.main,
							},
						},
					}}
					InputLabelProps={{
						sx: { color: theme.palette.primary.light },
					}}
				/>
				<TextField
					fullWidth
					label="Company Name"
					variant="outlined"
					size="small"
					value={localCompanyName}
					error={invalidFields.has("companyName")}
					onChange={(e) => {
						setLocalCompanyName(e.target.value);
						clearInvalidField("companyName");
					}}
					sx={{
						"& .MuiOutlinedInput-root": {
							color: theme.palette.text.primary,
							"& fieldset": { borderColor: theme.palette.primary.dark },
							"&:hover fieldset": {
								borderColor: theme.palette.primary.light,
							},
							"&.Mui-focused fieldset": {
								borderColor: "rgb(123, 104, 238)",
							},
							"&.Mui-error fieldset": {
								borderColor: theme.palette.error.main,
							},
						},
					}}
					InputLabelProps={{
						sx: { color: theme.palette.primary.light },
					}}
				/>
				<TextField
					fullWidth
					label="Company Code"
					variant="outlined"
					size="small"
					value={localCompanyCode}
					error={invalidFields.has("companyCode")}
					onChange={(e) => {
						setLocalCompanyCode(e.target.value);
						clearInvalidField("companyCode");
					}}
					sx={{
						"& .MuiOutlinedInput-root": {
							color: theme.palette.text.primary,
							"& fieldset": { borderColor: theme.palette.primary.dark },
							"&:hover fieldset": {
								borderColor: theme.palette.primary.light,
							},
							"&.Mui-focused fieldset": {
								borderColor: "rgb(123, 104, 238)",
							},
							"&.Mui-error fieldset": {
								borderColor: theme.palette.error.main,
							},
						},
					}}
					InputLabelProps={{
						sx: { color: theme.palette.primary.light },
					}}
				/>
				<TextField
					fullWidth
					label="Corporation Name"
					variant="outlined"
					size="small"
					value={localCorpName}
					onChange={(e) => setLocalCorpName(e.target.value)}
					sx={{
						"& .MuiOutlinedInput-root": {
							color: theme.palette.text.primary,
							"& fieldset": { borderColor: theme.palette.primary.dark },
							"&:hover fieldset": {
								borderColor: theme.palette.primary.light,
							},
							"&.Mui-focused fieldset": {
								borderColor: "rgb(123, 104, 238)",
							},
						},
					}}
					InputLabelProps={{
						sx: { color: theme.palette.primary.light },
					}}
				/>
				<FormControl
					fullWidth
					variant="outlined"
					size="small"
					error={invalidFields.has("cx")}
					sx={{ display: "none" }}
				>
					<InputLabel
						id="cx-select-label"
						sx={{ color: theme.palette.primary.light }}
					>
						CX
					</InputLabel>
					<Select
						labelId="cx-select-label"
						value={localCx}
						onChange={(e) => {
							setLocalCx(e.target.value as string);
							clearInvalidField("cx");
						}}
						label="CX"
						sx={{
							color: theme.palette.text.primary,
							"& .MuiOutlinedInput-notchedOutline": {
								borderColor: theme.palette.primary.dark,
							},
							"&:hover .MuiOutlinedInput-notchedOutline": {
								borderColor: theme.palette.primary.light,
							},
							"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
								borderColor: "rgb(123, 104, 238)",
							},
							"&.Mui-error .MuiOutlinedInput-notchedOutline": {
								borderColor: theme.palette.error.main,
							},
						}}
						MenuProps={{
							PaperProps: {
								sx: {
									background: theme.palette.background.paper,
									border: "1px solid rgba(123, 104, 238, 0.5)",
								},
							},
						}}
					>
						{CX_OPTIONS.map((cx) => (
							<MenuItem
								key={cx}
								value={cx}
								sx={{
									color: theme.palette.text.primary,
									"&:hover": {
										color: "white",
										bgcolor: "rgba(123, 104, 238, 0.2)",
									},
								}}
							>
								{cx}
							</MenuItem>
						))}
					</Select>
				</FormControl>
			</Paper>
			<Button
				onClick={handleSave}
				variant="contained"
				disabled={isSaving}
				sx={{
					mt: 2,
					alignSelf: "center",
					background: theme.palette.primary.dark,
					"&:hover": { background: theme.palette.primary.light },
				}}
			>
				{isSaving ? (
					<CircularProgress size={24} color="inherit" />
				) : (
					"Create Store"
				)}
			</Button>
			<Toast
				open={showSaveError}
				message="Something went wrong — please try again"
				color="error"
				onClose={() => setShowSaveError(false)}
			/>
		</Box>
	);
};

export default VendorCreationModal;
