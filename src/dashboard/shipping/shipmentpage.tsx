import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
	Box,
	CircularProgress,
	Typography,
	Button,
	Alert,
	Paper,
	InputBase,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BaseStarMap from "../../components/common/starmap/basestarmap";
import { ShipmentListWidget } from "./components/shipmentlistwidget";
import {
	ShipmentDetailWidget,
	type LocationFocusTarget,
} from "./components/shipmentdetailwidget";
import { useGlobalData } from "../../context/globaldatacontext";
import { API_BASE_URL } from "../../config/api";
import type { ShipmentContract, ShipmentShip } from "./types";
import { fetchClient } from "../../utils/apiclient";

interface UnifiedShipmentPageProps {
	isPublicMode?: boolean;
}

export const ShipmentPage: React.FC<UnifiedShipmentPageProps> = ({
	isPublicMode = false,
}) => {
	const { trackingId } = useParams<{ trackingId: string }>();
	const navigate = useNavigate();
	const { shipmentState } = useGlobalData();

	const [selectedId, setSelectedId] = useState<string | null>(
		trackingId && trackingId !== "track" ? trackingId : null,
	);
	const [cameraFocus, setCameraFocus] = useState<LocationFocusTarget | null>(
		null,
	);

	// Multi-lookup state for public mode
	const [publicContracts, setPublicContracts] = useState<ShipmentContract[]>(
		[],
	);
	const [publicShips, setPublicShips] = useState<Record<string, ShipmentShip>>(
		{},
	);
	const [notFoundIds, setNotFoundIds] = useState<string[]>([]);
	const [publicLoading, setPublicLoading] = useState<boolean>(false);

	// Track company codes used to look up public contracts for refreshing
	const [publicQueryKeys, setPublicQueryKeys] = useState<
		Record<string, string>
	>({});

	const handleLookupContract = useCallback(
		(targetId: string, companyCode?: string) => {
			let cleanId = targetId.trim();
			let cleanCompany = companyCode?.trim();

			// Support '{LOCAL_ID}:{COMPANY}' (or space-separated) syntax
			if (!cleanCompany && (cleanId.includes(":") || cleanId.includes(" "))) {
				const delimiter = cleanId.includes(":") ? ":" : " ";
				const parts = cleanId.split(delimiter);
				cleanId = parts[0].trim();
				cleanCompany = parts.slice(1).join("").trim();
			}

			if (!cleanId) return;

			// 1. Check if contract exists in logged-in state (non-public only)
			if (!isPublicMode && shipmentState?.contracts) {
				const foundInState = shipmentState.contracts.find(
					(c) => c.contract_id === cleanId || c.local_id === cleanId,
				);
				if (foundInState) {
					setPublicContracts((prev) => {
						if (prev.some((c) => c.contract_id === foundInState.contract_id))
							return prev;
						return [...prev, foundInState];
					});
					setPublicShips((prev) => ({
						...prev,
						...(shipmentState.ships || {}),
					}));
					setSelectedId(foundInState.contract_id);
					return;
				}
			}

			const queryKey = cleanCompany ? `${cleanId}:${cleanCompany}` : cleanId;

			// If public mode and no company code is provided, reject immediately
			if (isPublicMode && !cleanCompany) {
				setNotFoundIds((prev) =>
					prev.includes(cleanId) ? prev : [...prev, cleanId],
				);
				return;
			}

			// 2. Fetch from public API (always fresh fetch)
			setPublicLoading(true);
			const url = cleanCompany
				? `${API_BASE_URL}public/shipments/${encodeURIComponent(cleanId)}?company=${encodeURIComponent(cleanCompany)}`
				: `${API_BASE_URL}public/shipments/${encodeURIComponent(cleanId)}`;

			fetchClient(url)
				.then((res) => {
					if (!res.ok) throw new Error("Not found");
					return res.json();
				})
				.then((data) => {
					if (data.success && data.data?.contract) {
						const c: ShipmentContract = data.data.contract;
						setPublicContracts((prev) => {
							const index = prev.findIndex(
								(x) =>
									x.contract_id === c.contract_id || x.local_id === c.local_id,
							);
							if (index >= 0) {
								const copy = [...prev];
								copy[index] = c;
								return copy;
							}
							return [...prev, c];
						});
						if (data.data.ships) {
							setPublicShips((prev) => ({ ...prev, ...data.data.ships }));
						}
						if (cleanCompany) {
							setPublicQueryKeys((prev) => ({
								...prev,
								[c.contract_id]: cleanCompany,
							}));
						}
						setSelectedId(c.contract_id);
						setNotFoundIds((prev) =>
							prev.filter(
								(id) =>
									id !== cleanId &&
									id !== queryKey &&
									id !== `${cleanId}:${cleanCompany}` &&
									id.toLowerCase() !== cleanId.toLowerCase() &&
									id.toLowerCase() !== queryKey.toLowerCase(),
							),
						);
					} else {
						setNotFoundIds((prev) =>
							prev.includes(queryKey) ? prev : [...prev, queryKey],
						);
					}
				})
				.catch(() => {
					setNotFoundIds((prev) =>
						prev.includes(queryKey) ? prev : [...prev, queryKey],
					);
				})
				.finally(() => {
					setPublicLoading(false);
				});
		},
		[shipmentState, isPublicMode],
	);

	// Load initial URL trackingId and ?company= if provided
	useEffect(() => {
		if (isPublicMode && trackingId && trackingId !== "track") {
			const searchParams = new URLSearchParams(window.location.search);
			const companyParam = searchParams.get("company") || undefined;
			handleLookupContract(trackingId, companyParam);
		}
	}, [isPublicMode, trackingId, handleLookupContract]);

	// Automatic 5-minute background refresh for public tracking
	useEffect(() => {
		if (!isPublicMode || publicContracts.length === 0) return;

		const interval = setInterval(
			() => {
				publicContracts.forEach((c) => {
					const comp = publicQueryKeys[c.contract_id];
					const rawId = (c.local_id || c.contract_id).split(":")[0].trim();
					handleLookupContract(rawId, comp);
				});
			},
			5 * 60 * 1000,
		);

		return () => clearInterval(interval);
	}, [isPublicMode, publicContracts, publicQueryKeys, handleLookupContract]);

	// Resolve active contract
	const activeContract = useMemo(() => {
		const pool = isPublicMode
			? publicContracts
			: shipmentState?.contracts || [];
		if (!selectedId || pool.length === 0) return null;
		return (
			pool.find(
				(c) => c.contract_id === selectedId || c.local_id === selectedId,
			) || null
		);
	}, [isPublicMode, publicContracts, selectedId, shipmentState]);

	// Manual refresh active contract handler
	const handleManualRefresh = useCallback(() => {
		if (!activeContract) return;
		const comp = publicQueryKeys[activeContract.contract_id];
		const rawId = (activeContract.local_id || activeContract.contract_id)
			.split(":")[0]
			.trim();
		handleLookupContract(rawId, comp);
	}, [activeContract, publicQueryKeys, handleLookupContract]);

	// Filter visible ships: show only ships belonging to the selected contract
	const visibleShips = useMemo(() => {
		if (!activeContract) return {};
		const shipsPool = isPublicMode ? publicShips : shipmentState?.ships || {};
		const contractShipIds = new Set<string>();

		activeContract.items?.forEach((item) => {
			if (item.shipid) contractShipIds.add(item.shipid);
		});

		const filtered: Record<string, ShipmentShip> = {};
		contractShipIds.forEach((id) => {
			if (shipsPool[id]) {
				filtered[id] = shipsPool[id];
			}
		});
		return filtered;
	}, [isPublicMode, publicShips, shipmentState, activeContract]);

	// Filter target contracts: show ONLY the selected contract (or empty if none selected)
	const targetContracts = useMemo(() => {
		return activeContract ? [activeContract] : [];
	}, [activeContract]);

	const memoizedStarMap = useMemo(
		() => (
			<BaseStarMap
				mode="shipping"
				overrideShips={visibleShips}
				focusTarget={cameraFocus}
				contracts={targetContracts}
			/>
		),
		[visibleShips, cameraFocus, targetContracts],
	);

	return (
		<Box
			sx={{
				width: "100%",
				height: "100%",
				minHeight: "100vh",
				position: "relative",
			}}
		>
			<Box
				id="map"
				sx={{
					display: "flex",
					position: "absolute",
					inset: 0,
					zIndex: 1,
					width: "100%",
					height: "100%",
				}}
			>
				{memoizedStarMap}
			</Box>

			{/* PUBLIC BACK BUTTON */}
			{isPublicMode && (
				<Box
					sx={{
						position: "absolute",
						top: 16,
						left: 16,
						zIndex: 10,
					}}
				>
					<Button
						variant="contained"
						size="small"
						startIcon={<ArrowBackIcon />}
						onClick={() => navigate(-1)}
						sx={{
							bgcolor: "rgba(10, 14, 23, 0.85)",
							backdropFilter: "blur(12px)",
							border: "1px solid rgba(255, 255, 255, 0.15)",
							color: "#fff",
							textTransform: "none",
							boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
							"&:hover": { bgcolor: "rgba(20, 28, 45, 0.95)" },
						}}
					>
						Back
					</Button>
				</Box>
			)}

			{/* REUSED SHIPMENT LIST WIDGET */}
			<ShipmentListWidget
				contracts={
					isPublicMode ? publicContracts : shipmentState?.contracts || []
				}
				selectedId={selectedId}
				isPublicMode={isPublicMode}
				notFoundIds={notFoundIds}
				loading={publicLoading}
				onLookupContract={handleLookupContract}
				onSelect={(id) => {
					setSelectedId((prev) => (prev === id ? null : id));
					setCameraFocus(null);
				}}
			/>

			{/* DETAIL WIDGET */}
			{activeContract && (
				<ShipmentDetailWidget
					contract={activeContract}
					ships={visibleShips}
					onClose={() => {
						setSelectedId(null);
						setCameraFocus(null);
					}}
					onFocusLocation={(target) => setCameraFocus(target)}
					onRefresh={isPublicMode ? handleManualRefresh : undefined}
					isRefreshing={publicLoading}
				/>
			)}
		</Box>
	);
};

export default ShipmentPage;
