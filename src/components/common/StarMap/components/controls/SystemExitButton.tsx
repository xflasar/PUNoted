import React from "react";
import { Paper, Button } from "@mui/material";
import { CartesianInterpolator } from "../../utils/deckgl";
import type { SystemStats, MapPoint } from "../../types/mapTypes";

interface SystemExitButtonProps {
	systemStats: SystemStats | null;
	isPlanetModeActive: boolean;
	setSystemViewState: (viewState: any) => void;
	setCurrentViewMode: (mode: "galaxy" | "system") => void;
	setCenteredSystem: (system: MapPoint | null) => void;
	ignoreOnViewStateChangeRef: React.MutableRefObject<boolean>;
	SYSTEM_TO_GALAXY_ZOOM_OUT_THRESHOLD: number;
}

export const SystemExitButton: React.FC<SystemExitButtonProps> = ({
	systemStats,
	isPlanetModeActive,
	setSystemViewState,
	setCurrentViewMode,
	setCenteredSystem,
	ignoreOnViewStateChangeRef,
	SYSTEM_TO_GALAXY_ZOOM_OUT_THRESHOLD,
}) => {
	if (!systemStats || !isPlanetModeActive) {
		return null;
	}

	return (
		<Paper sx={{ position: "absolute", top: 10, left: 10, p: 2, zIndex: 100 }}>
			<Button
				size="small"
				onClick={() => {
					// programmatic exit
					setCurrentViewMode("galaxy");
					setCenteredSystem(null);
					ignoreOnViewStateChangeRef.current = true;
					setSystemViewState((v: any) => ({
						...v,
						zoom: SYSTEM_TO_GALAXY_ZOOM_OUT_THRESHOLD - 1,
						transitionDuration: 300,
						transitionInterpolator: new CartesianInterpolator(),
					}));
				}}
				sx={{ mt: 1 }}
			>
				Exit System View
			</Button>
		</Paper>
	);
};
