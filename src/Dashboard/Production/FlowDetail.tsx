import React, { useMemo, useState } from "react";
import {
	Box,
	List,
	ListItem,
	Typography,
	Divider,
	Tooltip,
	Button,
	Menu,
	MenuItem,
	FormControl,
	InputLabel,
	Select,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { SiteSummary, SnackbarState } from "../ProductionPage";
import { ContentCopy } from "@mui/icons-material";

interface ConsumptionFlowDetailProps {
	site: SiteSummary;
	targetDaysValue: number;
	formatAmount: (amount: number) => string;
	setSnackbar: React.Dispatch<React.SetStateAction<SnackbarState>>;
}

// Define the mapping from Station Name (Origin) to Exchange Ticker (CX)
const StationExchangeMap: Record<string, string> = {
	"Hortus Station Warehouse": "IC1",
	"Antares Station Warehouse": "AI1",
	"Benten Station Warehouse": "CI1",
	"Hubur Station Warehouse": "NC2",
	"Moria Station Warehouse": "NC1",
	"Arclight Station Warehouse": "CI2",
	"Configure on Execution": "IC1",
};

const MaterialProperties: Record<string, { weight: number; volume: number }> = {
	H2O: { weight: 1, volume: 1 },
	FE: { weight: 10, volume: 1.5 },
	O: { weight: 0.8, volume: 0.9 },
	EL_P: { weight: 50, volume: 50 },
	SI: { weight: 6, volume: 1 },
	COF: { weight: 5, volume: 5 },
};
const getMaterialProperties = (ticker: string) =>
	MaterialProperties[ticker] || { weight: 10, volume: 10 };

async function copyToClipboard(text: string) {
	// 1. Try modern clipboard API (preferred)
	if (navigator.clipboard && window.isSecureContext) {
		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch (err) {
			console.error("Modern clipboard API failed: ", err);
			// Fall through to the deprecated fallback
		}
	}

	// 2. Fallback to deprecated document.execCommand('copy')
	const textArea = document.createElement("textarea");
	textArea.value = text;

	// Make the textarea non-obtrusive but present
	textArea.style.position = "fixed";
	textArea.style.top = "-9999px";
	textArea.style.left = "0";

	let copySuccess = false;

	try {
		document.body.appendChild(textArea);

		if (textArea.setSelectionRange) {
			textArea.setSelectionRange(0, textArea.value.length);
		} else {
			textArea.select();
		}
		textArea.focus();

		// Execute the copy command
		copySuccess = document.execCommand("copy");

		// Log failure of the fallback
		if (!copySuccess) {
			console.error(
				"Fallback copy failed: document.execCommand returned false.",
			);
		}
	} catch (err) {
		console.error("Fallback copy execution error: ", err);
		copySuccess = false;
	} finally {
		document.body.removeChild(textArea);
	}

	return copySuccess;
}

const ConsumptionFlowTable: React.FC<ConsumptionFlowDetailProps> = ({
	site,
	targetDaysValue,
	formatAmount,
	setSnackbar,
}) => {
	const theme = useTheme();

	// --- MENU STATE ---
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);

	const originKeys = Object.keys(StationExchangeMap);

	const [selectedOrigin, setSelectedOrigin] = useState<string>(
		originKeys.length > 0 ? originKeys[0] : "Configure on Execution",
	);

	const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleMenuClose = () => {
		setAnchorEl(null);
	};
	// ------------------

	const negativeFlows = useMemo(() => {
		return Object.entries(site.site_daily_flow)
			.filter(([, f]) => f.flow < 0)
			.map(([ticker, f]) => {
				const currentAmount = f.currentAmount;
				const deficitPerDay = f.flow;
				const props = getMaterialProperties(ticker);

				const daysRemaining =
					deficitPerDay < 0
						? currentAmount / Math.abs(deficitPerDay)
						: currentAmount > 0
							? Infinity
							: 0;
				const targetSupply = Math.abs(deficitPerDay * targetDaysValue);
				const neededAmount = Math.max(0, targetSupply - currentAmount);
				const neededWeight = neededAmount * props.weight;
				const neededVolume = neededAmount * props.volume;

				return {
					ticker,
					currentAmount,
					deficitPerDay,
					daysRemaining,
					neededAmount,
					neededWeight,
					neededVolume,
				};
			})
			.sort((a, b) => a.ticker.localeCompare(b.ticker));
	}, [site.site_daily_flow, targetDaysValue]);

	/* const { totalNeedWeight, totalNeedVolume } = useMemo(() => {
    return negativeFlows.reduce(
      (acc, item) => {
        acc.totalNeedWeight += item.neededWeight;
        acc.totalNeedVolume += item.neededVolume;
        return acc;
      },
      { totalNeedWeight: 0, totalNeedVolume: 0 }
    );
  }, [negativeFlows]); */

	// --- XIT GENERATION LOGIC ---
	const createXIT = (type: "transfer" | "buy") => {
		// 1. Initial Checks and Material Preparation
		if (negativeFlows.length === 0) return;

		const materials: Record<string, number> = {};
		negativeFlows.forEach((item) => {
			// Only include materials that need to be bought/transferred
			if (item.neededAmount > 0) {
				materials[item.ticker] = Math.ceil(item.neededAmount);
			}
		});

		// If no materials are needed based on the targetDaysValue, return early
		if (Object.keys(materials).length === 0) return;

		// --- 2. Action and Group Configuration ---

		// Use a common group name for both actions
		const groupName = "A1";
		const nameSuffix = type === "transfer" ? "TRANSFER SUPPLY" : "BUY SUPPLY";
		const origin = selectedOrigin;

		// 3. Define Final Action Object based on type
		const finalAction =
			type === "transfer"
				? {
						// MTRA (Material Transfer Action)
						type: "MTRA",
						name: "TransferAction",
						group: groupName,
						origin: origin, // Source station
						dest: "Configure on Execution", // Destination (the site)
					}
				: {
						// CX Buy (Commodity Exchange Buy)
						type: "CX Buy",
						name: "BuyItems",
						group: groupName,
						origin: origin,
						exchange: StationExchangeMap[origin] || "IC1",
						priceLimits: {},
						buyPartial: false,
						useCXInv: true,
					};

		console.log("XIT Action:", finalAction);

		// 4. Return Final XIT Object
		return {
			actions: [finalAction],
			global: {
				name: `${site?.planet_name || "Site"} ${nameSuffix}`,
			},
			groups: [
				{
					type: "Manual",
					name: groupName,
					materials,
				},
			],
		};
	};

	const handleCopy = (type: "transfer" | "buy") => {
		handleMenuClose();

		const xit = createXIT(type);

		if (!xit) {
			setSnackbar({
				open: true,
				message: "No deficit found to copy.",
				severity: "warning",
			});
			return;
		}

		const text = JSON.stringify(xit);

		console.log(text);

		copyToClipboard(text).then((success) => {
			setSnackbar({
				open: true,
				message: success
					? `${type.toUpperCase()} XIT copied!`
					: "Failed to copy",
				severity: success ? "success" : "error",
			});
		});
	};
	// ------------------

	const getDaysColor = (days: number) => {
		if (days < targetDaysValue / 5) return theme.palette.error.dark;
		if (days < targetDaysValue) return theme.palette.warning.dark;
		if (days >= targetDaysValue) return theme.palette.success.light;
		return "error";
	};

	return (
		<Box sx={{ mt: 2 }}>
			{/* Header text */}
			<Box
				sx={{
					display: "flex",
					flexDirection: "row",
					justifyContent: "space-between",
				}}
			>
				<Typography
					variant="body2"
					color="text.secondary"
					sx={{ mb: 2, px: 1 }}
				>
					Inventory deficit required for <strong>{targetDaysValue} days</strong>{" "}
					of supply.
				</Typography>

				{/* --- REPLACED ICON BUTTON WITH BUTTON + MENU --- */}
				<Tooltip title="Select XIT action">
					<Button
						id="copy-button"
						aria-controls={open ? "copy-menu" : undefined}
						aria-haspopup="true"
						aria-expanded={open ? "true" : undefined}
						onClick={handleMenuClick}
						size="small"
						startIcon={<ContentCopy fontSize="small" />}
						sx={{
							color: theme.palette.primary.main,
							display: "flex",
							alignItems: "center",
							gap: 0.5,
							px: 1,
							py: 0.25,
							borderRadius: 1,
							"&:hover": {
								backgroundColor: theme.palette.action.hover,
								color: theme.palette.primary.dark,
							},
						}}
					>
						<Typography variant="caption" sx={{ fontWeight: 500 }}>
							Copy XIT
						</Typography>
					</Button>
				</Tooltip>

				<Menu
					id="copy-menu"
					anchorEl={anchorEl}
					open={open}
					onClose={handleMenuClose}
					MenuListProps={{
						"aria-labelledby": "copy-button",
						sx: { padding: "0px 0" }, // Adjusted padding for better fit with header
					}}
					slotProps={{
						paper: {
							elevation: 4,
							sx: { borderRadius: 1 },
						},
						list: {
							sx: {
								background: theme.palette.background.paper,
								border: "1px solid " + theme.palette.divider,
								padding: 0,
							},
						},
					}}
				>
					{/* --- NEW: Origin Dropdown Header/Input --- */}
					<Box sx={{ p: 1, pt: 1.5, pb: 0.5, maxWidth: 300 }}>
						<FormControl fullWidth size="small">
							<InputLabel id="origin-select-label">Origin</InputLabel>
							<Select
								labelId="origin-select-label"
								id="origin-select"
								value={selectedOrigin}
								label="Origin"
								onChange={(e) => setSelectedOrigin(e.target.value as string)}
								MenuProps={{
									PaperProps: {
										sx: {
											background: theme.palette.background.paper,
											borderRadius: 1,
										},
									},
									MenuListProps: {
										sx: {
											background: theme.palette.background.paper,
											border: "1px solid " + theme.palette.divider,
										},
									},
								}}
								sx={{
									"& .MuiSelect-select": { py: 0.8 },
									backgroundColor: theme.palette.action.selected,
								}}
							>
								{originKeys.map((origin) => (
									<MenuItem key={origin} value={origin}>
										{origin}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</Box>
					{/* --- END NEW HEADER --- */}

					{/* Divider to separate header from actions */}
					<Divider sx={{ mt: 0.5, mb: 0 }} />

					{/* MenuItem 1: Transfer (uses selectedOrigin in handleCopy) */}
					<MenuItem
						onClick={() => handleCopy("transfer")}
						disabled={!selectedOrigin}
						sx={{
							px: 2,
							py: 1,
							"&:hover": {
								backgroundColor: theme.palette.action.hover,
							},
						}}
					>
						Copy Transfer (MTRA) XIT
					</MenuItem>

					{/* Divider between menu items */}
					<Divider component="li" sx={{ my: 0.5 }} />

					{/* MenuItem 2: Buy at CX */}
					<MenuItem
						onClick={() => handleCopy("buy")}
						sx={{
							px: 2,
							py: 1,
							"&:hover": {
								backgroundColor: theme.palette.action.hover,
							},
						}}
					>
						Copy Buy at CX (CX Buy) XIT
					</MenuItem>
				</Menu>
				{/* --- END REPLACEMENT --- */}
			</Box>

			<List disablePadding sx={{ maxHeight: 350, overflowY: "auto" }}>
				{/* Header */}
				<ListItem
					sx={{
						py: 0.75,
						px: 1,
						display: "flex",
						alignItems: "center",
						gap: 1,
					}}
				>
					<Typography
						variant="caption"
						color="text.secondary"
						fontWeight="bold"
						sx={{ flexGrow: 1 }}
					>
						TICKER
					</Typography>
					<Typography
						variant="caption"
						color="text.secondary"
						fontWeight="bold"
						sx={{ width: 70, textAlign: "right" }}
					>
						CURRENT
					</Typography>
					<Typography
						variant="caption"
						color="text.secondary"
						fontWeight="bold"
						sx={{ width: 70, textAlign: "right" }}
					>
						DEFICIT/d
					</Typography>
					<Typography
						variant="caption"
						color="text.secondary"
						fontWeight="bold"
						sx={{ width: 70, textAlign: "right" }}
					>
						DAYS
					</Typography>
					<Typography
						variant="caption"
						color="text.secondary"
						fontWeight="bold"
						sx={{ width: 70, textAlign: "right" }}
					>
						NEED
					</Typography>
				</ListItem>

				<Divider />

				{/* Rows */}
				{negativeFlows.length > 0 ? (
					negativeFlows.map((item, index) => (
						<React.Fragment key={item.ticker}>
							<ListItem
								sx={{
									py: 0.75,
									px: 1,
									display: "flex",
									alignItems: "center",
									gap: 1,
									borderRadius: 1,
									transition: "background-color 0.2s",
									"&:hover": { bgcolor: theme.palette.action.hover },
								}}
							>
								<Typography
									variant="body2"
									sx={{ fontWeight: 500, flexGrow: 1 }}
								>
									{item.ticker}
								</Typography>
								<Typography
									variant="body2"
									sx={{ width: 70, textAlign: "right", fontWeight: 600 }}
								>
									{item.currentAmount}
								</Typography>
								<Typography
									variant="body2"
									sx={{
										width: 70,
										textAlign: "right",
										fontWeight: 600,
										color: "text.secondary",
									}}
								>
									{formatAmount(item.deficitPerDay)}
								</Typography>
								<Typography
									variant="body2"
									sx={{
										width: 70,
										textAlign: "right",
										fontWeight: 600,
										color: getDaysColor(item.daysRemaining),
									}}
								>
									{item.daysRemaining === Infinity
										? "∞"
										: item.daysRemaining.toFixed(1)}
								</Typography>
								<Typography
									variant="body2"
									sx={{
										width: 70,
										textAlign: "right",
										fontWeight: 600,
										color:
											item.neededAmount > 0
												? theme.palette.error.main
												: theme.palette.success.main,
									}}
								>
									{item.neededAmount.toFixed(0)}
								</Typography>
							</ListItem>
							{index < negativeFlows.length - 1 && <Divider component="li" />}
						</React.Fragment>
					))
				) : (
					<ListItem disableGutters>
						<Typography
							variant="body2"
							color="text.disabled"
							sx={{
								textAlign: "center",
								fontStyle: "italic",
								p: 2,
								width: "100%",
							}}
						>
							No materials currently being consumed.
						</Typography>
					</ListItem>
				)}
			</List>
		</Box>
	);
};

export default ConsumptionFlowTable;
