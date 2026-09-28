import React from "react";
import GlobalLoadingOverlay from "./globalloadingoverlay";

interface MapLoadingOverlayProps {
	isVisible: boolean;
	isLoadingFromCache?: boolean;
}

const MapLoadingOverlay: React.FC<MapLoadingOverlayProps> = ({
	isVisible,
	isLoadingFromCache = false,
}) => {
	return (
		<GlobalLoadingOverlay
			loading={isVisible}
			statusText={
				isLoadingFromCache
					? "FETCHING MAP DATA FROM CACHE..."
					: "COMPUTING GALAXY SECTORS & ORBITS..."
			}
			zIndex={1000}
		/>
	);
};

export default MapLoadingOverlay;
