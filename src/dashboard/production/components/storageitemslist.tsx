import React from "react";
import {
	Box,
	Typography,
	Tooltip,
	LinearProgress,
	useTheme,
} from "@mui/material";
import { Layers, Warehouse } from "lucide-react";
import MaterialBadge from "../../../cosm/components/materialbadge";

interface StorageItemsListProps {
	storageList: any[];
	daysUntilStorageFull: number | null;
	site: any;
	globalGetMatProps: (ticker: string) => any;
	globalData: any;
}

export const StorageItemsList: React.FC<StorageItemsListProps> = ({
	storageList,
	daysUntilStorageFull,
	site,
	globalGetMatProps,
	globalData,
}) => {
	const theme = useTheme();

	const siteStorage = storageList.filter((s) => !s.type || s.type === "site");
	const warehouseStorage = storageList.filter(
		(s) => s.type && s.type.includes("warehouse"),
	);

	const siteUnits = siteStorage.reduce(
		(sum, item) => sum + (item.amount || 0),
		0,
	);

	let siteVol = 0;
	let siteMass = 0;
	siteStorage.forEach((item) => {
		const p = globalGetMatProps(item.ticker);
		siteVol += (item.amount || 0) * p.volume;
		siteMass += (item.amount || 0) * p.weight;
	});

	let whVol = 0;
	let whMass = 0;
	warehouseStorage.forEach((item) => {
		const p = globalGetMatProps(item.ticker);
		whVol += (item.amount || 0) * p.volume;
		whMass += (item.amount || 0) * p.weight;
	});

	const matchingSiteUnit = Object.values(
		globalData?.storageState?.units || {},
	).find(
		(u: any) =>
			u.addressableid === site.siteid ||
			(u.storageplanetid === site.planetid && u.type === "SITE"),
	);
	const matchingWhUnits = Object.values(
		globalData?.storageState?.units || {},
	).filter(
		(u: any) =>
			u.storageplanetid === site.planetid &&
			(u.type === "WAREHOUSE" || u.type === "WAREHOUSE_STORE") &&
			(!u.owner || !site.owner || u.owner === site.owner),
	);

	const whVolCapFromUnits = matchingWhUnits.reduce(
		(acc: number, u: any) => acc + (u.volumecapacity || 0),
		0,
	);
	const whWeightCapFromUnits = matchingWhUnits.reduce(
		(acc: number, u: any) => acc + (u.weightcapacity || 0),
		0,
	);

	const siteBaseVolCap =
		site.storage_capacity ||
		(site as any).volumecapacity ||
		(site as any).capacity ||
		matchingSiteUnit?.volumecapacity ||
		(siteVol > 0 ? siteVol : 500);
	const siteBaseMassCap =
		(site as any).weight_capacity ||
		(site as any).weightcapacity ||
		matchingSiteUnit?.weightcapacity ||
		siteBaseVolCap;

	const siteMaxVolCap = Math.max(siteVol, siteBaseVolCap);
	const siteMaxMassCap = Math.max(siteMass, siteBaseMassCap);

	const siteVolPct = Math.min(100, Math.round((siteVol / siteMaxVolCap) * 100));
	const siteMassPct = Math.min(
		100,
		Math.round((siteMass / siteMaxMassCap) * 100),
	);

	const warehouseBaseVolCap =
		(site as any).warehouse_capacity ||
		whVolCapFromUnits ||
		(whVol > 0 ? whVol : 3500);
	const warehouseBaseMassCap =
		(site as any).warehouse_weight_capacity ||
		whWeightCapFromUnits ||
		warehouseBaseVolCap;

	const warehouseMaxVolCap = Math.max(whVol, warehouseBaseVolCap);
	const warehouseMaxMassCap = Math.max(whMass, warehouseBaseMassCap);

	const warehouseVolPct =
		warehouseMaxVolCap > 0
			? Math.min(100, Math.round((whVol / warehouseMaxVolCap) * 100))
			: 0;
	const warehouseMassPct =
		warehouseMaxMassCap > 0
			? Math.min(100, Math.round((whMass / warehouseMaxMassCap) * 100))
			: 0;

	return (
		<Box
			sx={{ display: "flex", flexDirection: "column", gap: 0.75, minWidth: 0 }}
		>
			{/* SITE STORAGE GROUP */}
			<Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
				<Typography
					variant="subtitle2"
					sx={{
						display: "flex",
						alignItems: "center",
						gap: 0.5,
						height: 18,
						color: theme.palette.info.main,
						fontWeight: 700,
						fontSize: "0.76rem",
					}}
				>
					<Layers size={13} /> SITE ({siteStorage.length})
				</Typography>

				{/* Site Storage Progress Bars */}
				<Box
					sx={{
						px: 1,
						py: 0.5,
						bgcolor: "rgba(0,0,0,0.4)",
						borderRadius: "8px",
						border: "1px solid rgba(123, 104, 238, 0.15)",
					}}
				>
					{/* Mass Progress Bar */}
					<Box sx={{ mb: 0.5 }}>
						<Box
							sx={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								mb: 0.2,
							}}
						>
							<Typography
								variant="caption"
								color="text.primary"
								sx={{ fontWeight: 600, fontSize: "0.7rem" }}
							>
								Mass:{" "}
								{siteMass.toLocaleString(undefined, {
									maximumFractionDigits: 0,
								})}{" "}
								/{" "}
								{siteMaxMassCap.toLocaleString(undefined, {
									maximumFractionDigits: 0,
								})}{" "}
								t
							</Typography>
							<Typography
								variant="caption"
								sx={{
									color:
										siteMassPct > 85
											? "#ff5252"
											: siteMassPct > 60
												? "#ffd700"
												: "text.secondary",
									fontWeight: 700,
									fontSize: "0.7rem",
								}}
							>
								{siteMassPct}%
							</Typography>
						</Box>
						<LinearProgress
							variant="determinate"
							value={siteMassPct}
							sx={{
								height: 4,
								borderRadius: 2,
								bgcolor: "rgba(255,255,255,0.08)",
								"& .MuiLinearProgress-bar": {
									bgcolor:
										siteMassPct > 85
											? "#ff5252"
											: siteMassPct > 60
												? "#ffd700"
												: "#ffd700",
								},
							}}
						/>
					</Box>

					{/* Volume Progress Bar */}
					<Box sx={{ mb: 0.3 }}>
						<Box
							sx={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								mb: 0.2,
							}}
						>
							<Typography
								variant="caption"
								color="text.primary"
								sx={{ fontWeight: 600, fontSize: "0.7rem" }}
							>
								Volume:{" "}
								{siteVol.toLocaleString(undefined, {
									maximumFractionDigits: 0,
								})}{" "}
								/{" "}
								{siteMaxVolCap.toLocaleString(undefined, {
									maximumFractionDigits: 0,
								})}{" "}
								m³
							</Typography>
							<Typography
								variant="caption"
								sx={{
									color:
										siteVolPct > 85
											? "#ff5252"
											: siteVolPct > 60
												? "#ffd700"
												: "text.secondary",
									fontWeight: 700,
									fontSize: "0.7rem",
								}}
							>
								{siteVolPct}%
							</Typography>
						</Box>
						<LinearProgress
							variant="determinate"
							value={siteVolPct}
							sx={{
								height: 4,
								borderRadius: 2,
								bgcolor: "rgba(255,255,255,0.08)",
								"& .MuiLinearProgress-bar": {
									bgcolor:
										siteVolPct > 85
											? "#ff5252"
											: siteVolPct > 60
												? "#ffd700"
												: "#00e5ff",
								},
							}}
						/>
					</Box>

					{daysUntilStorageFull !== null && (
						<Typography
							variant="caption"
							sx={{
								color: "#ffd54f",
								fontWeight: 600,
								fontSize: "0.68rem",
								display: "block",
								textAlign: "right",
								mt: 0.3,
							}}
						>
							Full in {daysUntilStorageFull.toFixed(1)}d (Net Prod)
						</Typography>
					)}
				</Box>

				{/* Site Items List */}
				{siteStorage.length > 0 ? (
					<Box sx={{ display: "grid", gap: 0.25 }}>
						{siteStorage.map((s) => {
							const props = globalGetMatProps(s.ticker);
							const itemMass = (s.amount || 0) * props.weight;
							const itemVol = (s.amount || 0) * props.volume;
							const itemPctRaw =
								siteUnits > 0 ? ((s.amount || 0) / siteUnits) * 100 : 0;
							const displayPct =
								itemPctRaw > 0 && itemPctRaw < 1
									? "<1%"
									: itemPctRaw >= 1
										? `${Math.round(itemPctRaw)}%`
										: "";

							return (
								<Tooltip
									key={s.ticker}
									title={`Mass: ${itemMass.toLocaleString(undefined, { maximumFractionDigits: 1 })} t (${props.weight} t/u) | Volume: ${itemVol.toLocaleString(undefined, { maximumFractionDigits: 1 })} m³ (${props.volume} m³/u)`}
								>
									<Box
										sx={{
											display: "grid",
											gridTemplateColumns: "48px 45px 1fr",
											alignItems: "center",
											gap: 0.5,
											py: 0.15,
										}}
									>
										<Box
											sx={{
												fontSize: "0.75em",
												display: "flex",
												alignItems: "center",
											}}
										>
											<MaterialBadge ticker={s.ticker} />
										</Box>
										<Typography
											variant="caption"
											sx={{
												color: "rgba(255, 255, 255, 0.4)",
												fontSize: "0.68rem",
												fontWeight: 400,
												fontFamily: "monospace",
											}}
										>
											{displayPct ? `(${displayPct})` : ""}
										</Typography>
										<Typography
											variant="caption"
											sx={{
												fontWeight: 500,
												color: "text.primary",
												textAlign: "right",
												fontSize: "0.7rem",
												fontFamily: "monospace",
												fontVariantNumeric: "tabular-nums",
											}}
										>
											{s.amount.toLocaleString()}
										</Typography>
									</Box>
								</Tooltip>
							);
						})}
					</Box>
				) : (
					<Typography
						variant="caption"
						color="text.disabled"
						fontStyle="italic"
						textAlign="center"
						sx={{ py: 0.5, fontSize: "0.68rem" }}
					>
						Empty site storage
					</Typography>
				)}
			</Box>

			{/* WAREHOUSE STORAGE GROUP */}
			{warehouseBaseVolCap > 0 && (
				<Box
					sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 0.5 }}
				>
					<Typography
						variant="subtitle2"
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 0.5,
							height: 18,
							color: theme.palette.warning.main,
							fontWeight: 700,
							fontSize: "0.76rem",
						}}
					>
						<Warehouse size={13} /> WAREHOUSE ({warehouseStorage.length})
					</Typography>

					{/* Warehouse Storage Progress Bars */}
					<Box
						sx={{
							px: 1,
							py: 0.5,
							bgcolor: "rgba(0,0,0,0.4)",
							borderRadius: "8px",
							border: "1px solid rgba(255, 152, 0, 0.2)",
						}}
					>
						{/* Mass Progress Bar */}
						<Box sx={{ mb: 0.5 }}>
							<Box
								sx={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									mb: 0.2,
								}}
							>
								<Typography
									variant="caption"
									color="text.primary"
									sx={{ fontWeight: 600, fontSize: "0.7rem" }}
								>
									Mass:{" "}
									{whMass.toLocaleString(undefined, {
										maximumFractionDigits: 0,
									})}{" "}
									/{" "}
									{warehouseBaseMassCap.toLocaleString(undefined, {
										maximumFractionDigits: 0,
									})}{" "}
									t
								</Typography>
								<Typography
									variant="caption"
									sx={{
										color:
											warehouseMassPct > 85
												? "#ff5252"
												: warehouseMassPct > 60
													? "#ffd700"
													: "text.secondary",
										fontWeight: 700,
										fontSize: "0.7rem",
									}}
								>
									{warehouseMassPct}%
								</Typography>
							</Box>
							<LinearProgress
								variant="determinate"
								value={warehouseMassPct}
								sx={{
									height: 4,
									borderRadius: 2,
									bgcolor: "rgba(255,255,255,0.08)",
									"& .MuiLinearProgress-bar": {
										bgcolor:
											warehouseMassPct > 85
												? "#ff5252"
												: warehouseMassPct > 60
													? "#ffd700"
													: "#ffd700",
									},
								}}
							/>
						</Box>

						{/* Volume Progress Bar */}
						<Box sx={{ mb: 0.3 }}>
							<Box
								sx={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									mb: 0.2,
								}}
							>
								<Typography
									variant="caption"
									color="text.primary"
									sx={{ fontWeight: 600, fontSize: "0.7rem" }}
								>
									Volume:{" "}
									{whVol.toLocaleString(undefined, {
										maximumFractionDigits: 0,
									})}{" "}
									/{" "}
									{warehouseBaseVolCap.toLocaleString(undefined, {
										maximumFractionDigits: 0,
									})}{" "}
									m³
								</Typography>
								<Typography
									variant="caption"
									sx={{
										color:
											warehouseVolPct > 85
												? "#ff5252"
												: warehouseVolPct > 60
													? "#ffd700"
													: "text.secondary",
										fontWeight: 700,
										fontSize: "0.7rem",
									}}
								>
									{warehouseVolPct}%
								</Typography>
							</Box>
							<LinearProgress
								variant="determinate"
								value={warehouseVolPct}
								sx={{
									height: 4,
									borderRadius: 2,
									bgcolor: "rgba(255,255,255,0.08)",
									"& .MuiLinearProgress-bar": {
										bgcolor:
											warehouseVolPct > 85
												? "#ff5252"
												: warehouseVolPct > 60
													? "#ffd700"
													: "#00e5ff",
									},
								}}
							/>
						</Box>
					</Box>

					{/* Warehouse Items List */}
					{warehouseStorage.length > 0 ? (
						<Box sx={{ display: "grid", gap: 0.25 }}>
							{warehouseStorage.map((s) => {
								const props = globalGetMatProps(s.ticker);
								const whItemVol = (s.amount || 0) * props.volume;
								const whItemMass = (s.amount || 0) * props.weight;
								const whItemPctRaw =
									warehouseBaseVolCap > 0
										? (whItemVol / warehouseBaseVolCap) * 100
										: 0;
								const whDisplayPct =
									whItemPctRaw > 0 && whItemPctRaw < 1
										? "<1%"
										: whItemPctRaw >= 1
											? `${Math.round(whItemPctRaw)}%`
											: "";

								return (
									<Tooltip
										key={s.ticker}
										title={`Mass: ${whItemMass.toLocaleString(undefined, { maximumFractionDigits: 1 })} t (${props.weight} t/u) | Volume: ${whItemVol.toLocaleString(undefined, { maximumFractionDigits: 1 })} m³ (${props.volume} m³/u)`}
									>
										<Box
											sx={{
												display: "grid",
												gridTemplateColumns: "48px 45px 1fr",
												alignItems: "center",
												gap: 0.5,
												py: 0.15,
											}}
										>
											<Box
												sx={{
													fontSize: "0.75em",
													display: "flex",
													alignItems: "center",
												}}
											>
												<MaterialBadge ticker={s.ticker} />
											</Box>
											<Typography
												variant="caption"
												sx={{
													color: "rgba(255, 255, 255, 0.4)",
													fontSize: "0.68rem",
													fontWeight: 400,
													fontFamily: "monospace",
												}}
											>
												{whDisplayPct ? `(${whDisplayPct})` : ""}
											</Typography>
											<Typography
												variant="caption"
												sx={{
													fontWeight: 500,
													color: "text.primary",
													textAlign: "right",
													fontSize: "0.7rem",
													fontFamily: "monospace",
													fontVariantNumeric: "tabular-nums",
												}}
											>
												{s.amount.toLocaleString()}
											</Typography>
										</Box>
									</Tooltip>
								);
							})}
						</Box>
					) : (
						<Typography
							variant="caption"
							sx={{
								color: "text.disabled",
								fontStyle: "italic",
								textAlign: "center",
								py: 0.5,
								fontSize: "0.68rem",
							}}
						>
							Empty warehouse storage
						</Typography>
					)}
				</Box>
			)}
		</Box>
	);
};
