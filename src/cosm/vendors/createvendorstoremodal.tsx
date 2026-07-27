import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Box,
	Typography,
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
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config/api";
import { Store } from "lucide-react";
import React from "react";

interface VendorStore {
	vendor: {
		vendorid: string;
		companycode: string;
		companyname: string;
		corpname: string;
		gamename: string;
		isactive: boolean;
		cx: string;
	};
	orders: Array<Record<string, unknown>>;
}
const cleanLocalStorageString = (value: string | null): string => {
	if (value === null || value === "null" || value === "undefined") {
		return "";
	}
	return value;
};

const VendorCreationModal: React.FC<{
	open: boolean;
	handleClose: () => void;
	vendorStore: VendorStore | null;
	onVendorCreated: (vendorStore: VendorStore) => void;
}> = ({ vendorStore, open, handleClose, onVendorCreated }) => {
	const theme = useTheme();
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [localCompanyName, setLocalCompanyName] = useState(
		vendorStore?.vendor.companyname || "",
	);
	const [localCompanyCode, setLocalCompanyCode] = useState(
		vendorStore?.vendor.companycode || "",
	);
	const [localCorpName, setLocalCorpName] = useState(
		vendorStore?.vendor.corpname || "",
	);
	const [localGameName, setLocalGameName] = useState(
		vendorStore?.vendor.gamename || "",
	);
	const [localCx, setLocalCx] = useState(vendorStore?.vendor.cx || "IC1");
	const CX_OPTIONS = ["AI1", "CI2", "CI1", "IC1", "NC2", "NC1"];

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
		setIsSaving(true);
		setError(null);

		// 1. Trim all local state variables before validation and payload creation
		const trimmedCompanyName = localCompanyName ? localCompanyName.trim() : "";
		const trimmedGameName = localGameName ? localGameName.trim() : "";
		const trimmedCompanyCode = localCompanyCode ? localCompanyCode.trim() : "";
		const trimmedCorpName = localCorpName ? localCorpName.trim() : "";
		const trimmedCx = localCx ? localCx.trim() : "";

		// 2. CLIENT-SIDE VALIDATION using trimmed values
		const requiredFields = [
			{ value: trimmedCompanyName, name: "Company Name" },
			{ value: trimmedGameName, name: "Game Name" },
			{ value: trimmedCompanyCode, name: "Company Code" },
			{ value: trimmedCx, name: "CX" },
		];
		for (const field of requiredFields) {
			if (field.value === "") {
				setError(`${field.name} is required.`);
				setIsSaving(false);
				return;
			}
		}

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

			// Use the complete, server-generated data to update the state.
			onVendorCreated(newVendorStore);

			handleClose();
		} catch (err) {
			console.error("Failed to save vendor store:", err);
			setError(
				`Failed to save changes. ${err instanceof Error ? err.message : ""}`,
			);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<React.Fragment>
			<Dialog
				open={open}
				onClose={handleClose}
				maxWidth="sm"
				fullWidth
				scroll="body"
				slotProps={{
					backdrop: {
						sx: {
							backdropFilter: "blur(5px)",
						},
					},
					paper: {
						sx: {
							background: "transparent",
							backgroundImage: "none",
							boxShadow: "none",
							width: "calc(100% - 32px)",
							maxWidth: 520,
							margin: 0,
							position: "fixed",
							top: "50%",
							left: "50%",
							transform: "translate(-50%, -50%)",
						},
					},
				}}
			>
				<DialogTitle sx={{ color: theme.palette.primary.main, py: 2 }}>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<Store />
						Create Store
					</Box>
				</DialogTitle>
				<DialogContent
					sx={{
						color: theme.palette.primary.main,
						display: "flex",
						flexDirection: "column",
						height: "90vh",
					}}
				>
					{/* Vendor Details Editing Section */}
					<Paper
						sx={{
							p: 3,
							mb: 2,
							background: theme.palette.background.paper,
							boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
							borderRadius: "15px",
						}}
					>
						<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
							<TextField
								fullWidth
								label="Company Name"
								variant="outlined"
								size="small"
								value={localCompanyName}
								onChange={(e) => setLocalCompanyName(e.target.value)}
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
							<TextField
								fullWidth
								label="Game Name"
								variant="outlined"
								size="small"
								value={localGameName}
								onChange={(e) => setLocalGameName(e.target.value)}
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
							<TextField
								fullWidth
								label="Company Code"
								variant="outlined"
								size="small"
								value={localCompanyCode}
								onChange={(e) => setLocalCompanyCode(e.target.value)}
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
							<TextField
								fullWidth
								label="Corp Name"
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
							<FormControl fullWidth variant="outlined" size="small">
								<InputLabel
									id="cx-select-label"
									sx={{ color: theme.palette.primary.light }}
								>
									CX
								</InputLabel>
								<Select
									labelId="cx-select-label"
									value={localCx}
									onChange={(e) => setLocalCx(e.target.value as string)}
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
						</Box>
					</Paper>

					{error && (
						<Box
							sx={{
								color: theme.palette.error.main,
								mt: 2,
								textAlign: "center",
							}}
						>
							<Typography variant="body2">{error}</Typography>
						</Box>
					)}
					<DialogActions
						sx={{ bgcolor: "transparent", mt: 2, justifyContent: "center" }}
					>
						<Button
							onClick={handleClose}
							disabled={isSaving}
							color="inherit"
							sx={{
								color: "white",
							}}
						>
							Cancel
						</Button>
						<Button
							onClick={handleSave}
							variant="contained"
							disabled={isSaving}
							sx={{
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
					</DialogActions>
				</DialogContent>
			</Dialog>
		</React.Fragment>
	);
};

export default VendorCreationModal;
