import {
	Box,
	Typography,
	useTheme,
	alpha,
	Tooltip,
	Select,
	MenuItem,
	FormControl,
} from "@mui/material";
import { smartFormat } from "./utils";
import MaterialBadge from "../../../../COSM/components/MaterialBadge.tsx";

export const ShipBreakdown = ({
	ship,
	index,
	unmetW,
	unmetV,
	useMyFleet,
	animatedShipData,
	fleetMappingConfig,
	setFleetMappingConfig,
}: {
	ship: any;
	index: number;
	unmetW?: number;
	unmetV?: number;
	useMyFleet?: boolean;
	animatedShipData?: any[];
	fleetMappingConfig?: Record<string, string>;
	setFleetMappingConfig?: React.Dispatch<
		React.SetStateAction<Record<string, string>>
	>;
}) => {
	const theme = useTheme();

	const wLoadPct = Math.min(100, (ship.loadedW / ship.weight) * 100);
	const vLoadPct = Math.min(100, (ship.loadedV / ship.volume) * 100);

	const inventoryItems = Object.entries(ship.inventory).filter(
		([_, amt]) => (amt as number) >= 0.1,
	);

	const mappedShipId = fleetMappingConfig?.[ship.fleetId] || "";

	const handleMapShip = (e: any) => {
		if (setFleetMappingConfig) {
			setFleetMappingConfig((prev) => ({
				...prev,
				[ship.fleetId]: e.target.value,
			}));
		}
	};

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "row",
				gap: 0.75,
				py: 1,
				borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
				"&:last-child": { borderBottom: "none", pb: 0 },
			}}
		>
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					width: "100%",
				}}
			>
				<Box
					sx={{
						display: "flex",
						flexDirection: "row",
						alignItems: "center",
						width: "100%",
						gap: 2,
					}}
				>
					<Typography
						variant="caption"
						sx={{ width: 50, color: "text.primary", pt: 0.25, fontWeight: 800 }}
					>
						{index + 1}. {ship.id}
					</Typography>

					<Box
						sx={{
							display: "flex",
							width: "100%",
							flexDirection: "column",
							gap: 0.75,
						}}
					>
						{/* --- WEIGHT BAR --- */}
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							<Tooltip
								title={`Loaded: ${ship.loadedW.toFixed(0)}t | Capacity: ${ship.weight}t`}
							>
								<Box
									sx={{
										flex: 1,
										height: 6,
										bgcolor: alpha(theme.palette.text.secondary, 0.15),
										borderRadius: 2,
										position: "relative",
										cursor: "help",
									}}
								>
									<Box
										sx={{
											position: "absolute",
											top: 0,
											left: 0,
											height: "100%",
											width: `${wLoadPct}%`,
											bgcolor: "tertiary.main",
											borderRadius: 2,
											transition: "width 0.3s ease",
										}}
									/>
								</Box>
							</Tooltip>
							<Typography
								variant="caption"
								sx={{
									fontSize: "0.7rem",
									fontWeight: 500,
									minWidth: 90,
									textAlign: "right",
									color: "text.secondary",
									whiteSpace: "nowrap",
								}}
							>
								<span style={{ color: theme.palette.text.primary }}>
									{ship.loadedW.toFixed(0)}
								</span>{" "}
								/ {ship.weight} t
							</Typography>
						</Box>

						{/* --- VOLUME BAR --- */}
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							<Tooltip
								title={`Loaded: ${ship.loadedV.toFixed(0)}m³ | Capacity: ${ship.volume}m³`}
							>
								<Box
									sx={{
										flex: 1,
										height: 6,
										bgcolor: alpha(theme.palette.text.secondary, 0.15),
										borderRadius: 2,
										position: "relative",
										cursor: "help",
									}}
								>
									<Box
										sx={{
											position: "absolute",
											top: 0,
											left: 0,
											height: "100%",
											width: `${vLoadPct}%`,
											bgcolor: "tertiary.main",
											borderRadius: 2,
											transition: "width 0.3s ease",
										}}
									/>
								</Box>
							</Tooltip>
							<Typography
								variant="caption"
								sx={{
									fontSize: "0.7rem",
									fontWeight: 500,
									minWidth: 90,
									textAlign: "right",
									color: "text.secondary",
									whiteSpace: "nowrap",
								}}
							>
								<span style={{ color: theme.palette.text.primary }}>
									{ship.loadedV.toFixed(0)}
								</span>{" "}
								/ {ship.volume} m³
							</Typography>
						</Box>
					</Box>
				</Box>

				{useMyFleet && (
					<Box sx={{ display: "flex", pt: 1, pl: "66px" }}>
						<FormControl size="small" fullWidth>
							<Select
								value={mappedShipId}
								displayEmpty
								onChange={handleMapShip}
								MenuProps={{
									slotProps: {
										paper: {
											sx: {
												background: theme.palette.background.default,
												backgroundImage: "none",
											},
										},
									},
								}}
								sx={{
									height: 24,
									fontSize: "0.75rem",
									fontWeight: 600,
									background: alpha(theme.palette.background.default, 0.5),
									"& .MuiSelect-select": { py: 0, px: 1 },
								}}
							>
								<MenuItem
									value=""
									sx={{ fontSize: "0.8rem", fontStyle: "italic" }}
								>
									Select Ship...
								</MenuItem>
								{animatedShipData?.map((realShip: any) => (
									<MenuItem
										key={realShip.registration}
										value={realShip.registration}
										sx={{ fontSize: "0.8rem" }}
									>
										{realShip.registration} - {realShip.name}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</Box>
				)}

				<Box
					sx={{ display: "flex", flexWrap: "wrap", gap: 1, pt: 1, pl: "66px" }}
				>
					{inventoryItems.length > 0 ? (
						inventoryItems.map(([ticker, amt]) => (
							<Box
								key={ticker}
								sx={{ display: "flex", alignItems: "center", gap: 0.25 }}
							>
								<Box
									sx={{
										transform: "scale(0.65)",
										transformOrigin: "left center",
										mr: -1.5,
									}}
								>
									<MaterialBadge ticker={ticker} />
								</Box>
								<Typography
									variant="caption"
									fontWeight={700}
									sx={{ fontSize: "0.7rem", color: "text.secondary" }}
								>
									{smartFormat(amt as number).text}
								</Typography>
							</Box>
						))
					) : (
						<Typography
							variant="caption"
							sx={{
								fontSize: "0.65rem",
								color: "text.disabled",
								fontStyle: "italic",
							}}
						>
							Empty Cargo Hold
						</Typography>
					)}
				</Box>
			</Box>
		</Box>
	);
};
