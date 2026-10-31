import React from "react";
import { Box, Paper, Button, useTheme, useMediaQuery } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import DeckGL from "@deck.gl/react";
import { OrthographicView, LinearInterpolator } from "@deck.gl/core";
import type { AnimatedShipData } from "./types/maptypes";
import type { LocationFocusTarget } from "../../../dashboard/shipping/components/shipmentdetailwidget";

import type { ShipmentContract } from "../../../dashboard/shipping/types";

// Custom Hook & Context
import { useBaseStarMapData } from "./hooks/usebasestarmapdata";
import { FilterProvider } from "./components/filter/filtercontext";
import { MapDataProvider } from "./context/mapdatacontext";

// Components & Overlays
import SearchBar from "./components/searchbar/searchbar";
import SearchResultsPanel from "./components/searchresultspanel/searchresultspanel";
import ShipListComponent from "./components/shiplistcomponent";
import MapLoadingOverlay from "../maploadingoverlay";
import SystemHoverTooltip from "./components/systemdetail/systemhovertooltip";
import SystemDetailPanel from "./components/systemdetail/systemdetailpanel";
import PlanetHoverTooltip from "./components/systemdetail/planethovertooltip";
import ShipTooltip from "./components/shiptooltip";
import MapLegend from "./components/legend/maplegend";
import MapZoomControls from "./components/controls/mapzoomcontrols";

function deepCompareLayers(prevLayers: any[] = [], nextLayers: any[] = []) {
	if (prevLayers.length !== nextLayers.length) return false;
	for (let i = 0; i < nextLayers.length; i++) {
		const prevLayer = prevLayers[i];
		const nextLayer = nextLayers[i];
		if (prevLayer === nextLayer) continue;
		if (!prevLayer || !nextLayer || prevLayer.id !== nextLayer.id) return false;
		const prevProps = prevLayer.props || {};
		const nextProps = nextLayer.props || {};
		const keys = Object.keys(nextProps);
		for (const key of keys) {
			if (prevProps[key] !== nextProps[key]) return false;
		}
	}
	return true;
}

/* Memoized DeckGL wrapper to avoid unnecessary re-renders */
const MemoizedDeckGL = React.memo(
	(props: any) => {
		return (
			<DeckGL
				deviceProps={props.deviceProps}
				ref={props.deckRef}
				views={props.views}
				viewState={props.viewState}
				onViewStateChange={props.onViewStateChange}
				onHover={props.onHover}
				onDoubleClick={props.onDoubleClick}
				controller={props.controller}
				layers={props.layers}
				pickingRadius={5}
				_animate={false}
				onAfterRender={props.onAfterRender}
			/>
		);
	},
	(prevProps, nextProps) =>
		prevProps.viewState === nextProps.viewState &&
		prevProps.onAfterRender === nextProps.onAfterRender &&
		deepCompareLayers(prevProps.layers, nextProps.layers),
);

const DECK_VIEWS = [new OrthographicView({ id: "main-map-view" })];

interface BaseStarMapProps {
	mode: "public" | "dashboard" | "shipping";
	shipments?: AnimatedShipData[];
	overrideShips?: Record<string, any>;
	focusTarget?: LocationFocusTarget | null;
	contracts?: ShipmentContract[];
}

const BaseStarMapInner: React.FC<BaseStarMapProps> = ({
	mode,
	overrideShips,
	focusTarget,
	contracts,
}) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

	const mapState = useBaseStarMapData({
		mode,
		overrideShips,
		focusTarget,
		contracts,
	});

	const handleZoomIn = React.useCallback(() => {
		const step = 0.5;
		const currentZoom = mapState.activeViewState.zoom ?? 0;
		const nextZoom = Math.min(mapState.sliderMax, currentZoom + step);
		mapState.handleSliderChange(null as any, nextZoom);
	}, [mapState]);

	const handleZoomOut = React.useCallback(() => {
		const step = 0.5;
		const currentZoom = mapState.activeViewState.zoom ?? 0;
		const nextZoom = Math.max(mapState.sliderMin, currentZoom - step);
		mapState.handleSliderChange(null as any, nextZoom);
	}, [mapState]);

	return (
		<Paper
			sx={{ flexGrow: 1, position: "relative", width: "100%", height: "100%" }}
		>
			{mode !== "shipping" && (
				<SearchBar
					options={mapState.searchOptions}
					onSelect={mapState.handleSearchSelect}
					onSearchQueryChange={mapState.setSearchQuery}
				/>
			)}

			<Box
				ref={mapState.mapRef}
				sx={{
					display: "flex",
					position: "absolute",
					inset: 0,
					background: "#02040ae3",
					backgroundSize: "cover",
					zIndex: 1,
					width: "100%",
					height: "100%",
				}}
			>
				<MemoizedDeckGL
					deviceProps={mapState.DECK_DEVICE_PROPS}
					ref={mapState.deckRef}
					views={DECK_VIEWS}
					viewState={mapState.activeViewState}
					onViewStateChange={mapState.handleViewStateChange}
					onHover={mapState.handleDeckHover}
					onClick={mapState.handleDeckClick}
					controller={mapState.controller as any}
					layers={mapState.layers}
					pickingRadius={5}
					_animate={false}
					onAfterRender={mapState.handleDeckAfterRender}
				/>

				<MapLoadingOverlay
					isVisible={mapState.isLoading || !mapState.isLayersReady}
					isLoadingFromCache={
						!mapState.isLoading &&
						!!mapState.mapData &&
						mapState.isGlobalMapLoading
					}
				/>

				{mode !== "shipping" && mode === "dashboard" && (
					<ShipListComponent
						ownShips={mapState.ownShips}
						corpShips={mapState.corpShipsGrouped}
						otherShips={mapState.otherShipsGrouped}
						onSelectPosition={mapState.handleShipSelect}
						visibleCorpGroups={mapState.visibleCorpGroups}
						selectedShipId={mapState.selectedShipId}
						onGroupVisibilityChange={mapState.handleGroupVisibilityChange}
						expandedCorpGroups={mapState.expandedCorpGroups}
						onToggleCorpGroup={mapState.handleToggleCorpGroup}
						searchResultsVisible={false}
						visiblePathShipIds={mapState.visiblePathShipIds}
						onTogglePath={mapState.handleTogglePath}
						onToggleAllPaths={mapState.handleToggleAllPaths}
						onToggleAllCorpVisibility={mapState.handleToggleAllCorpVisibility}
						ownShipsVisible={mapState.ownShipsVisible}
						onToggleOwnVisibility={mapState.handleToogleOwnShipsVisibility}
						isSystemPanelOpen={mapState.isSystemPanelOpen}
					/>
				)}

				<div
					ref={mapState.tooltipRef as any}
					style={{
						position: "absolute",
						display: "none",
						pointerEvents: "none",
						zIndex: 9999,
						backgroundColor: "rgba(0,0,0,0.85)",
						color: "white",
						padding: "4px 8px",
						borderRadius: "4px",
						transform: "translate(-50%, -120%)",
						fontSize: "12px",
						whiteSpace: "pre",
						border: "1px solid rgba(255,255,255,0.2)",
					}}
				/>

				{mapState.hoveredInfo &&
				mapState.hoveredInfo.object.type === "planet" ? (
					<PlanetHoverTooltip
						object={mapState.hoveredInfo.object}
						x={mapState.hoveredInfo.x}
						y={mapState.hoveredInfo.y}
						allPlanetsData={mapState.allPlanetsData}
						ownerShips={mapState.effectiveOwnerShips}
						otherShips={mapState.effectiveOtherShips}
					/>
				) : mapState.hoveredInfo ? (
					<SystemHoverTooltip
						object={mapState.hoveredInfo.object}
						x={mapState.hoveredInfo.x}
						y={mapState.hoveredInfo.y}
						allPlanetsData={mapState.allPlanetsData}
						allStationsData={mapState.allStationsData}
						ownerShips={mapState.effectiveOwnerShips}
						otherShips={mapState.effectiveOtherShips}
					/>
				) : null}

				{mapState.activeShipTooltip && mapState.projectedTooltipCoords && (
					<ShipTooltip
						tooltip={{
							...mapState.activeShipTooltip,
							x: mapState.projectedTooltipCoords.x,
							y: mapState.projectedTooltipCoords.y,
						}}
						onClose={() => mapState.setActiveShipTooltip(null)}
						onSelectShip={mapState.handleShipSelect}
					/>
				)}

				{mode !== "shipping" && (
					<MapLegend
						currentViewMode={mapState.currentViewMode}
						isSystemPanelOpen={mapState.isSystemPanelOpen}
						centeredSystem={mapState.centeredSystem}
						isMobile={isMobile}
						mode={mode}
					/>
				)}

				{mode !== "shipping" &&
					mapState.isSystemPanelOpen &&
					mapState.centeredSystem && (
						<SystemDetailPanel
							system={mapState.centeredSystem}
							onClose={() => {
								mapState.setIsSystemPanelOpen(false);
							}}
							onEnterSystemView={() => mapState.setCurrentViewMode("system")}
							isGalaxyView={mapState.currentViewMode === "galaxy"}
							selectedPlanetId={mapState.selectedPlanetId}
							onSelectPlanet={mapState.setSelectedPlanetId}
							selectedStationId={mapState.selectedStationId}
							onSelectStation={mapState.setSelectedStationId}
							onEnterPlanetView={mapState.handleSelectPlanet}
							allPlanetsData={mapState.allPlanetsData}
							allStationsData={mapState.allStationsData}
							ownerShips={mapState.ownShips}
							otherShips={mapState.effectiveOtherShips}
							activeFlightPlans={mapState.effectiveFlightPlans}
							storageState={mapState.storageState}
							productionData={mapState.productionData}
							onSelectShip={(id) => mapState.handleShipSelect(id, false)}
						/>
					)}

				{mode !== "shipping" &&
					!mapState.centeredSystem &&
					mapState.isSearchResultsOpen &&
					(mapState.searchQuery || mapState.isFilterActive) && (
						<SearchResultsPanel
							systems={mapState.matchedSystems}
							allPlanetsData={mapState.allPlanetsData}
							filter={mapState.filter}
							searchQuery={mapState.searchQuery}
							onSelectSystem={mapState.handleSelectSystem}
							onSelectPlanet={mapState.handleSelectPlanet}
							onClose={() => mapState.setIsSearchResultsOpen(false)}
						/>
					)}

				{mapState.currentViewMode === "system" && (
					<Button
						variant="contained"
						size="small"
						startIcon={
							<ArrowBack sx={{ color: theme.palette.secondary.main }} />
						}
						onClick={mapState.handleExitSystemView}
						sx={{
							position: "absolute",
							top: { xs: 62, sm: 16 },
							left: { xs: 12, sm: 20 },
							zIndex: 1000,
							bgcolor: "rgba(16, 16, 32, 0.85)",
							backdropFilter: "blur(15px)",
							border: "1px solid rgba(123, 104, 238, 0.35)",
							borderRadius: "20px",
							px: { xs: 1.5, sm: 2 },
							py: 0.6,
							color: "#ffffff",
							fontSize: { xs: "0.7rem", sm: "0.75rem" },
							fontWeight: 700,
							letterSpacing: "0.05em",
							textTransform: "none",
							boxShadow:
								"0 4px 20px rgba(0, 0, 0, 0.5), 0 0 12px rgba(123, 104, 238, 0.2)",
							"&:hover": {
								bgcolor: "rgba(24, 24, 48, 0.95)",
								borderColor: theme.palette.primary.light,
								boxShadow: "0 0 16px rgba(123, 104, 238, 0.45)",
							},
						}}
					>
						{mapState.centeredSystem?.name
							? `Exit ${mapState.centeredSystem.name}`
							: "Galaxy View"}
					</Button>
				)}

				<MapZoomControls
					currentViewMode={mapState.currentViewMode}
					activeZoom={mapState.activeViewState.zoom ?? -3}
					sliderMin={mapState.sliderMin}
					sliderMax={mapState.sliderMax}
					sliderMarks={mapState.sliderMarks}
					onChange={mapState.handleSliderChange as any}
					onZoomIn={handleZoomIn}
					onZoomOut={handleZoomOut}
					isSystemPanelOpen={mapState.isSystemPanelOpen}
				/>
			</Box>
		</Paper>
	);
};

const BaseStarMap: React.FC<BaseStarMapProps> = (props) => {
	return (
		<MapDataProvider>
			<FilterProvider>
				<BaseStarMapInner {...props} />
			</FilterProvider>
		</MapDataProvider>
	);
};

export default BaseStarMap;
