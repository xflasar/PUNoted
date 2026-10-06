import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, CircularProgress, Typography, Button, Alert, Paper, InputBase } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BaseStarMap from "../../components/common/starmap/basestarmap";
import { ShipmentListWidget } from "./components/shipmentlistwidget";
import {
	ShipmentDetailWidget,
	LocationFocusTarget,
} from "./components/shipmentdetailwidget";
import { useGlobalData } from "../../context/globaldatacontext";
import { API_BASE_URL } from "../../config/api";
import type { ShipmentContract, ShipmentShip } from "./types";

interface UnifiedShipmentPageProps {
	isPublicMode?: boolean;
}

export const ShipmentPage: React.FC<UnifiedShipmentPageProps> = ({ isPublicMode = false }) => {
	const { trackingId } = useParams<{ trackingId: string }>();
	const navigate = useNavigate();
	const { shipmentState } = useGlobalData();

	const [selectedId, setSelectedId] = useState<string | null>(
		trackingId && trackingId !== "track" ? trackingId : null,
	);
	const [cameraFocus, setCameraFocus] = useState<LocationFocusTarget | null>(null);

	// Multi-lookup state for public mode
	const [publicContracts, setPublicContracts] = useState<ShipmentContract[]>([]);
	const [publicShips, setPublicShips] = useState<Record<string, ShipmentShip>>({});
	const [notFoundIds, setNotFoundIds] = useState<string[]>([]);
	const [publicLoading, setPublicLoading] = useState<boolean>(false);

	const handleLookupContract = useCallback((targetId: string) => {
		const cleanId = targetId.trim();
		if (!cleanId) return;

		// 1. Check if contract exists in logged-in state
		if (shipmentState?.contracts) {
			const foundInState = shipmentState.contracts.find(
				(c) => c.contract_id === cleanId || c.local_id === cleanId,
			);
			if (foundInState) {
				setPublicContracts((prev) => {
					if (prev.some((c) => c.contract_id === foundInState.contract_id)) return prev;
					return [...prev, foundInState];
				});
				setPublicShips((prev) => ({ ...prev, ...(shipmentState.ships || {}) }));
				setSelectedId(foundInState.contract_id);
				return;
			}
		}

		// 2. Fetch from public API
		setPublicLoading(true);
		fetch(`${API_BASE_URL}public/shipments/${cleanId}`)
			.then((res) => {
				if (!res.ok) throw new Error("Not found");
				return res.json();
			})
			.then((data) => {
				if (data.success && data.data?.contract) {
					const c = data.data.contract;
					setPublicContracts((prev) => {
						if (prev.some((x) => x.contract_id === c.contract_id)) return prev;
						return [...prev, c];
					});
					if (data.data.ships) {
						setPublicShips((prev) => ({ ...prev, ...data.data.ships }));
					}
					setSelectedId(c.contract_id);
					setNotFoundIds((prev) => prev.filter((id) => id !== cleanId));
				} else {
					setNotFoundIds((prev) => (prev.includes(cleanId) ? prev : [...prev, cleanId]));
				}
			})
			.catch(() => {
				setNotFoundIds((prev) => (prev.includes(cleanId) ? prev : [...prev, cleanId]));
			})
			.finally(() => {
				setPublicLoading(false);
			});
	}, [shipmentState]);

	// Load initial URL trackingId if provided
	useEffect(() => {
		if (isPublicMode && trackingId && trackingId !== "track") {
			handleLookupContract(trackingId);
		}
	}, [isPublicMode, trackingId, handleLookupContract]);

	// Resolve active contract
	const activeContract = useMemo(() => {
		const pool = isPublicMode ? publicContracts : shipmentState?.contracts || [];
		if (!selectedId || pool.length === 0) return null;
		return (
			pool.find(
				(c) => c.contract_id === selectedId || c.local_id === selectedId,
			) || null
		);
	}, [isPublicMode, publicContracts, selectedId, shipmentState]);

	// Filter visible ships
	const visibleShips = useMemo(() => {
		const shipsPool = isPublicMode ? publicShips : shipmentState?.ships || {};
		const contractsPool = isPublicMode ? publicContracts : shipmentState?.contracts || [];

		const targetContracts = activeContract ? [activeContract] : contractsPool;
		const contractShipIds = new Set<string>();

		targetContracts.forEach((contract) => {
			contract.items?.forEach((item) => {
				if (item.shipid) contractShipIds.add(item.shipid);
			});
		});

		const filtered: Record<string, ShipmentShip> = {};
		contractShipIds.forEach((id) => {
			if (shipsPool[id]) {
				filtered[id] = shipsPool[id];
			}
		});
		return filtered;
	}, [isPublicMode, publicShips, publicContracts, shipmentState, activeContract]);

	const memoizedStarMap = useMemo(
		() => (
			<BaseStarMap
				mode="shipping"
				overrideShips={visibleShips}
				focusTarget={cameraFocus}
			/>
		),
		[visibleShips, cameraFocus],
	);

	return (
		<Box sx={{ width: "100%", height: "100%", minHeight: "100vh", position: "relative" }}>
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
				contracts={isPublicMode ? publicContracts : shipmentState?.contracts || []}
				isPublicMode={isPublicMode}
				notFoundIds={notFoundIds}
				loading={publicLoading}
				onLookupContract={handleLookupContract}
				onSelect={(id) => {
					setSelectedId(id);
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
				/>
			)}
		</Box>
	);
};

export default ShipmentPage;
