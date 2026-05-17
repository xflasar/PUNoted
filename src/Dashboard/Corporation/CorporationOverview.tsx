import { API_BASE_URL } from "../../config/api";
import React, { useMemo, useEffect, useState } from "react";
import {
	Box,
	Alert,
	useTheme,
	useMediaQuery,
	Paper,
	Typography,
	Tabs,
	Tab,
	alpha,
	Skeleton,
	Select,
	MenuItem,
	FormControl,
	type SelectChangeEvent,
} from "@mui/material";
import GroupIcon from "@mui/icons-material/Group";
import FactoryIcon from "@mui/icons-material/Factory";
import AssessmentIcon from "@mui/icons-material/Assessment";
import DomainIcon from "@mui/icons-material/Domain";
import type { CorpOverviewData, ProductionSummaryItem } from "./types";
import { CorpProductionView } from "./CorpProductionView";
import CorpMembersTable from "./CorpMembersTable";

const ThreeDotsLoader = () => (
	<Box sx={{ display: "inline-flex", gap: 0.5, alignItems: "baseline" }}>
		{[0, 1, 2].map((i) => (
			<Box
				key={i}
				sx={{
					width: 4,
					height: 4,
					borderRadius: "50%",
					bgcolor: "currentColor",
					animation: "pulse 1.4s infinite ease-in-out both",
					animationDelay: `${i * 0.16}s`,
					"@keyframes pulse": {
						"0%, 80%, 100%": { transform: "scale(0)", opacity: 0.5 },
						"40%": { transform: "scale(1)", opacity: 1 },
					},
				}}
			/>
		))}
	</Box>
);

/**
 * The main overview dashboard for a corporation, displaying high-level metrics
 * (members, headquarters, materials) and providing tabs to switch between
 * member and production details.
 */
export const CorporationOverview: React.FC = () => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));

	const [tabValue, setTabValue] = useState(1);
	const [corpList, setCorpList] = useState<CorpOverviewData[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedCorpFilter, setSelectedCorpFilter] = useState<string>("ALL");

	const glassyStyle = useMemo(
		() => ({
			backgroundColor: alpha(theme.palette.background.default, 0.4),
			backdropFilter: "blur(12px)",
			WebkitBackdropFilter: "blur(12px)",
			border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
			backgroundImage: "none",
			boxShadow: "none",
		}),
		[theme],
	);

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				setIsLoading(true);
				const res = await fetch(`${API_BASE_URL}internal/corporation/`, {
					headers: {
						Authorization: `Bearer ${localStorage.getItem("authToken")}`,
					},
				});
				if (!res.ok) throw new Error();
				const data = await res.json();

				if (mounted) {
					const list = Array.isArray(data) ? data : [data];
					setCorpList(list);
				}
			} catch {
				if (mounted) setError("Failed to load corporation data");
			} finally {
				if (mounted) setIsLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, []);

	const activeViewData = useMemo(() => {
		if (!corpList.length) return null;

		if (selectedCorpFilter !== "ALL") {
			const selected = corpList.find((c) => c.code === selectedCorpFilter);
			return selected || corpList[0];
		}

		const allMembers = corpList.flatMap((c) => c.members || []);
		const prodMap = new Map<string, ProductionSummaryItem>();

		corpList.forEach((corp) => {
			(corp.productionSummary || []).forEach((item) => {
				const existing = prodMap.get(item.ticker);
				if (existing) {
					existing.productionTotal += item.productionTotal;
					existing.productionAccurate += item.productionAccurate;
					existing.productionEstimated += item.productionEstimated;
					existing.consumptionTotal += item.consumptionTotal;
					existing.consumptionAccurate += item.consumptionAccurate;
					existing.consumptionEstimated += item.consumptionEstimated;
					existing.net += item.net;
					existing.producers = [...existing.producers, ...item.producers];
					existing.consumers = [...existing.consumers, ...item.consumers];
				} else {
					prodMap.set(item.ticker, {
						...item,
						producers: [...item.producers],
						consumers: [...item.consumers],
					});
				}
			});
		});

		const aggregatedProduction = Array.from(prodMap.values());

		return {
			name: "All Corporations",
			code: "ALL",
			headquarters: "Aggregated",
			memberCount: allMembers.length,
			members: allMembers,
			productionSummary: aggregatedProduction,
			productionCount: aggregatedProduction.length,
			consumptionCount: aggregatedProduction.length,
		} as CorpOverviewData;
	}, [corpList, selectedCorpFilter]);

	const syncedCount = useMemo(
		() => activeViewData?.members?.filter((m) => m.isSynchronized).length || 0,
		[activeViewData],
	);

	if (error) {
		return <Alert severity="error">{error ?? "No data"}</Alert>;
	}

	const displayName = activeViewData?.name || (
		<Skeleton width={180} height={40} />
	);

	const widgets = [
		{
			title: "Members",
			value: isLoading ? (
				<ThreeDotsLoader />
			) : (
				`${activeViewData?.memberCount || 0} (${syncedCount})`
			),
			icon: <GroupIcon />,
			color: theme.palette.primary.main,
		},
		{
			title: "Headquarters",
			value: isLoading ? <ThreeDotsLoader /> : activeViewData?.headquarters,
			icon: <FactoryIcon />,
			color: theme.palette.info.main,
		},
		{
			title: "Materials",
			value: isLoading ? (
				<ThreeDotsLoader />
			) : (
				`${activeViewData?.productionSummary?.length || 0}`
			),
			icon: <AssessmentIcon />,
			color: theme.palette.secondary.light,
		},
	];

	return (
		<Box
			sx={{
				height: "100dvh",
				display: "flex",
				flexDirection: "column",
				overflow: "hidden",
				p: isMobile ? 0 : 2,
				gap: isMobile ? 1 : 2,
			}}
		>
			<Paper
				sx={{
					...glassyStyle,
					p: isMobile ? 1 : 2,
					borderRadius: isMobile ? 0 : 2,
					flexShrink: 0,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: 2,
				}}
			>
				{/* TOP: "TEXT" (Title + Dropdown) CENTERED */}
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						gap: 2,
						width: "100%",
						flexWrap: "wrap",
					}}
				>
					<Typography
						variant={isMobile ? "h6" : "h4"}
						noWrap
						sx={{
							fontWeight: "bold",
							color: "primary.light",
							textAlign: "center",
						}}
					>
						{displayName}
					</Typography>

					{!isLoading && corpList.length > 0 && (
						<FormControl size="small" sx={{ minWidth: 140 }}>
							<Select
								value={selectedCorpFilter}
								onChange={(e: SelectChangeEvent) =>
									setSelectedCorpFilter(e.target.value)
								}
								displayEmpty
								variant="outlined"
								sx={{
									height: 32,
									fontSize: "0.8rem",
									fontWeight: "bold",
									bgcolor: alpha(theme.palette.background.default, 0.5),
									"& .MuiOutlinedInput-notchedOutline": {
										borderColor: alpha(theme.palette.primary.main, 0.3),
									},
								}}
								renderValue={(selected) => (
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 1,
										}}
									>
										<DomainIcon
											sx={{ fontSize: 16, color: theme.palette.primary.main }}
										/>
										{selected === "ALL" ? "All Corps" : selected}
									</Box>
								)}
							>
								<MenuItem
									value="ALL"
									sx={{ fontSize: "0.8rem", fontWeight: "bold" }}
								>
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 1,
										}}
									>
										<DomainIcon
											sx={{ fontSize: 16, color: "text.secondary" }}
										/>
										All Corporations
									</Box>
								</MenuItem>
								{corpList.map((corp) => (
									<MenuItem
										key={corp.code}
										value={corp.code}
										sx={{ fontSize: "0.8rem" }}
									>
										{corp.code} - {corp.name}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					)}
				</Box>

				{/* BOTTOM: 3 BOXES CENTERED */}
				<Box
					sx={{
						display: "flex",
						flexDirection: "row",
						flexWrap: "wrap",
						justifyContent: "center",
						gap: 2,
						width: "100%",
					}}
				>
					{widgets.map((w, i) => (
						<Box
							key={i}
							sx={{
								...glassyStyle,
								py: 1,
								px: 2,
								borderRadius: 2,
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(theme.palette.background.default, 0.2),
								flexShrink: 0,
								minWidth: 120,
							}}
						>
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 1,
									mb: 0.5,
								}}
							>
								{React.cloneElement(w.icon, {
									sx: { fontSize: 20, color: w.color },
								})}
								<Typography
									variant="caption"
									sx={{
										color: "text.secondary",
										fontWeight: "bold",
										fontSize: "0.75rem",
										lineHeight: 1,
									}}
								>
									{w.title}
								</Typography>
							</Box>
							<Typography
								variant="body2"
								sx={{
									color: "text.primary",
									fontWeight: "bold",
									fontSize: "0.9rem",
									lineHeight: 1.2,
								}}
							>
								{w.value}
							</Typography>
						</Box>
					))}
				</Box>
			</Paper>

			<Paper
				sx={{
					...glassyStyle,
					flex: 1,
					display: "flex",
					flexDirection: "column",
					borderRadius: isMobile ? 0 : 2,
					overflow: "hidden",
					minHeight: 0,
				}}
			>
				<Tabs
					value={tabValue}
					onChange={(_, v) => setTabValue(v)}
					centered={false}
					variant="standard"
					textColor="primary"
					indicatorColor="primary"
					sx={{
						borderBottom: 1,
						borderColor: "divider",
						px: 2,
						minHeight: 40,
						alignSelf: "center",
					}}
				>
					<Tab
						label="MEMBERS"
						sx={{ fontSize: "0.85rem", fontWeight: "bold" }}
					/>
					<Tab
						label="PRODUCTION"
						sx={{ fontSize: "0.85rem", fontWeight: "bold" }}
					/>
				</Tabs>

				<Box
					sx={{
						flex: 1,
						overflow: "hidden",
						display: "flex",
						flexDirection: "column",
					}}
				>
					<Box
						sx={{
							display: tabValue === 0 ? "flex" : "none",
							flex: 1,
							height: "100%",
							overflow: "hidden",
							flexDirection: "column",
						}}
					>
						<CorpMembersTable
							members={activeViewData?.members || []}
							isLoading={isLoading}
						/>
					</Box>
					<Box
						sx={{
							display: tabValue === 1 ? "flex" : "none",
							flex: 1,
							height: "100%",
							overflow: "hidden",
							flexDirection: "column",
						}}
					>
						<CorpProductionView
							productionSummary={activeViewData?.productionSummary || []}
							members={activeViewData?.members}
							isLoading={isLoading}
						/>
					</Box>
				</Box>
			</Paper>
		</Box>
	);
};

export default CorporationOverview;
