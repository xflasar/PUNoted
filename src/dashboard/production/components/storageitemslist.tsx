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

interface StorageGroupProps {
	title: string;
	icon: React.ReactNode;
	color: string;
	borderColor: string;
	items: any[];
	mass: number;
	maxMass: number;
	massPct: number;
	vol: number;
	maxVol: number;
	volPct: number;
	daysUntilFull: number | null;
	totalUnits: number;
	globalGetMatProps: (ticker: string) => any;
	emptyText: string;
	barDefaultColor: string;
}

const StorageGroup: React.FC<StorageGroupProps> = ({
	title,
	icon,
	color,
	borderColor,
	items,
	mass,
	maxMass,
	massPct,
	vol,
	maxVol,
	volPct,
	daysUntilFull,
	totalUnits,
	globalGetMatProps,
	emptyText,
	barDefaultColor,
}) => {
	const theme = useTheme();

	const getStatusColor = (pct: number) => {
		if (pct > 85) return theme.palette.error.main;
		if (pct > 60) return theme.palette.warning.main;
		return theme.palette.text.secondary;
	};

	const getBarColor = (pct: number) => {
		if (pct > 85) return theme.palette.error.main;
		if (pct > 60) return theme.palette.warning.main;
		return barDefaultColor;
	};

	return (
		<Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
			<Typography
				variant="subtitle2"
				sx={{
					display: "flex",
					alignItems: "center",
					gap: 0.5,
					height: 18,
					color: color,
					fontWeight: 700,
					fontSize: "0.76rem",
				}}
			>
				{icon} {title} ({items.length})
			</Typography>

			{/* Progress Bars Container */}
			<Box
				sx={{
					px: 1,
					py: 0.5,
					bgcolor: "rgba(0,0,0,0.4)",
					borderRadius: "8px",
					border: `1px solid ${borderColor}`,
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
							gap: 1,
						}}
					>
						<Typography
							variant="caption"
							color="text.primary"
							sx={{ fontWeight: 600, fontSize: "0.7rem", whiteSpace: "nowrap" }}
						>
							{mass.toLocaleString(undefined, { maximumFractionDigits: 0 })} /{" "}
							{maxMass.toLocaleString(undefined, { maximumFractionDigits: 0 })}{" "}
							t
						</Typography>
						<Typography
							variant="caption"
							sx={{
								color: getStatusColor(massPct),
								fontWeight: 700,
								fontSize: "0.7rem",
								whiteSpace: "nowrap",
							}}
						>
							{massPct}%
						</Typography>
					</Box>
					<LinearProgress
						variant="determinate"
						value={massPct}
						sx={{
							height: 4,
							borderRadius: 2,
							bgcolor: "rgba(255,255,255,0.08)",
							"& .MuiLinearProgress-bar": {
								bgcolor: getBarColor(massPct),
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
							gap: 1,
						}}
					>
						<Typography
							variant="caption"
							color="text.primary"
							sx={{ fontWeight: 600, fontSize: "0.7rem", whiteSpace: "nowrap" }}
						>
							{vol.toLocaleString(undefined, { maximumFractionDigits: 0 })} /{" "}
							{maxVol.toLocaleString(undefined, { maximumFractionDigits: 0 })}{" "}
							m³
						</Typography>
						<Typography
							variant="caption"
							sx={{
								color: getStatusColor(volPct),
								fontWeight: 700,
								fontSize: "0.7rem",
								whiteSpace: "nowrap",
							}}
						>
							{volPct}%
						</Typography>
					</Box>
					<LinearProgress
						variant="determinate"
						value={volPct}
						sx={{
							height: 4,
							borderRadius: 2,
							bgcolor: "rgba(255,255,255,0.08)",
							"& .MuiLinearProgress-bar": {
								bgcolor: getBarColor(volPct),
							},
						}}
					/>
				</Box>

				{daysUntilFull !== null && (
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
						Full in {daysUntilFull.toFixed(1)}d
					</Typography>
				)}
			</Box>

			{/* Items List */}
			{items.length > 0 ? (
				<Box sx={{ display: "grid", gap: 0.25 }}>
					{items.map((s) => {
						const props = globalGetMatProps(s.ticker);
						const itemMass = (s.amount || 0) * props.weight;
						const itemVol = (s.amount || 0) * props.volume;
						const itemPctRaw =
							totalUnits > 0 ? ((s.amount || 0) / totalUnits) * 100 : 0;
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
					{emptyText}
				</Typography>
			)}
		</Box>
	);
};

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
	const warehouseUnits = warehouseStorage.reduce(
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
			<StorageGroup
				title="SITE"
				icon={<Layers size={13} />}
				color={theme.palette.info.main}
				borderColor="rgba(123, 104, 238, 0.15)"
				items={siteStorage}
				mass={siteMass}
				maxMass={siteMaxMassCap}
				massPct={siteMassPct}
				vol={siteVol}
				maxVol={siteMaxVolCap}
				volPct={siteVolPct}
				daysUntilFull={daysUntilStorageFull}
				totalUnits={siteUnits}
				globalGetMatProps={globalGetMatProps}
				emptyText="Empty site storage"
				barDefaultColor="#ffd700"
			/>

			{warehouseBaseVolCap > 0 && (
				<StorageGroup
					title="WAREHOUSE"
					icon={<Warehouse size={13} />}
					color={theme.palette.warning.main}
					borderColor="rgba(255, 152, 0, 0.2)"
					items={warehouseStorage}
					mass={whMass}
					maxMass={warehouseMaxMassCap}
					massPct={warehouseMassPct}
					vol={whVol}
					maxVol={warehouseMaxVolCap}
					volPct={warehouseVolPct}
					daysUntilFull={null}
					totalUnits={warehouseUnits}
					globalGetMatProps={globalGetMatProps}
					emptyText="Empty warehouse storage"
					barDefaultColor="#00e5ff"
				/>
			)}
		</Box>
	);
};
