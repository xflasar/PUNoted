import React from "react";
import { Chip, Stack } from "@mui/material";

interface DefaultNotificationContentProps {
	data: Record<string, any>;
}

export const DefaultNotificationContent: React.FC<
	DefaultNotificationContentProps
> = ({ data }) => {
	if (!data || typeof data !== "object") return null;

	return (
		<Stack
			direction="row"
			spacing={0.75}
			useFlexGap
			sx={{ flexWrap: "wrap", gap: 0.5, width: "100%" }}
		>
			{Object.entries(data).map(([k, v]) => (
				<Chip
					key={k}
					size="small"
					label={`${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`}
					sx={{
						height: 18,
						fontSize: "0.62rem",
						fontWeight: 600,
						bgcolor: "rgba(255, 255, 255, 0.08)",
						color: "rgba(255,255,255,0.8)",
					}}
				/>
			))}
		</Stack>
	);
};
