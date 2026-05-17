import React, { useState } from "react";
import {
	Popover,
	Typography,
	Stack,
	Button,
	TextField,
	Switch,
	FormControlLabel,
	alpha,
	useTheme,
} from "@mui/material";
import { generateSupplyXit } from "../../utils/xitGenerator";

interface XitConfigPopoverProps {
	anchorEl: HTMLElement | null;
	onClose: () => void;
	siteName: string;
	materials: Record<string, number>;
	cargoPlanFleet?: any[];
	useMyFleet?: boolean;
	fleetMappingConfig?: Record<string, string>;
	onShowSnackbar?: (msg: string) => void;
}

export const XitConfigPopover: React.FC<XitConfigPopoverProps> = ({
	anchorEl,
	onClose,
	siteName,
	materials,
	cargoPlanFleet,
	useMyFleet = false,
	fleetMappingConfig = {},
	onShowSnackbar,
}) => {
	const theme = useTheme();

	const [useCXInv, setUseCXInv] = useState(true);
	const [includeTransport, setIncludeTransport] = useState(false);
	const [cxOrigin, setCxOrigin] = useState("Configure on Execution");

	const handleCopy = () => {
		if (Object.keys(materials).length === 0) {
			if (onShowSnackbar) onShowSnackbar("No materials allocated.");
			onClose();
			return;
		}

		const fleetMapping: { fleetId: string; userShipReg: string }[] = [];
		if (cargoPlanFleet) {
			cargoPlanFleet.forEach((ship: any) => {
				const mappedReg = (useMyFleet && fleetMappingConfig[ship.fleetId]) 
					? fleetMappingConfig[ship.fleetId] 
					: "Configure on Execution";
					
				fleetMapping.push({
					fleetId: ship.fleetId,
					userShipReg: mappedReg,
				});
			});
		}

		const xitJson = generateSupplyXit({
			siteName,
			materials,
			includeTransport,
			useCXInv,
			cxOrigin,
			fleetMapping,
		});

		navigator.clipboard
			.writeText(xitJson)
			.then(() => {
				if (onShowSnackbar) onShowSnackbar("Adjusted Supply XIT Copied!");
			})
			.catch((err) => {
				console.error("Failed to copy XIT:", err);
				if (onShowSnackbar) onShowSnackbar("Failed to copy XIT data.");
			});

		onClose();
	};

	const open = Boolean(anchorEl);

	return (
		<Popover
			open={open}
			anchorEl={anchorEl}
			onClose={onClose}
			anchorOrigin={{
				vertical: "bottom",
				horizontal: "right",
			}}
			transformOrigin={{
				vertical: "top",
				horizontal: "right",
			}}
			slotProps={{
				paper: {
					sx: {
						p: 2,
						width: 320,
						bgcolor: alpha(theme.palette.background.default, 0.98),
						backdropFilter: "blur(10px)",
						border: `1px solid ${theme.palette.divider}`,
						boxShadow: theme.shadows[4],
						borderRadius: 2,
					},
				},
			}}
		>
			<Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2 }}>
				XIT Configuration
			</Typography>
			<Stack spacing={2}>
				<Stack spacing={1}>
					<FormControlLabel
						control={
							<Switch
								size="small"
								checked={useCXInv}
								onChange={(e) => setUseCXInv(e.target.checked)}
								color="primary"
							/>
						}
						label={
							<Typography variant="body2" fontWeight={600}>
								Use CX Inventory
							</Typography>
						}
					/>
					<FormControlLabel
						control={
							<Switch
								size="small"
								checked={includeTransport}
								onChange={(e) => setIncludeTransport(e.target.checked)}
								color="primary"
							/>
						}
						label={
							<Typography variant="body2" fontWeight={600}>
								Include Transport Action
							</Typography>
						}
					/>
				</Stack>
				
				{includeTransport && (
					<>
						<TextField
							label="Origin (CX Location)"
							size="small"
							value={cxOrigin}
							onChange={(e) => setCxOrigin(e.target.value)}
							fullWidth
							InputProps={{ sx: { fontSize: "0.8rem", fontWeight: 600 } }}
						/>
					</>
				)}
				
				<Button
					onClick={handleCopy}
					variant="contained"
					color="info"
					fullWidth
					sx={{ mt: 1, fontWeight: 700 }}
				>
					Copy XIT
				</Button>
			</Stack>
		</Popover>
	);
};
