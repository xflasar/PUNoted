import { Skeleton, Box } from "@mui/material";

export const CXPageSkeleton = () => (
	<Box
		sx={{
			display: "flex",
			width: "100%",
			height: "100%",
			gap: 2,
			flexDirection: { xs: "column", md: "row" },
			overflow: "hidden",
		}}
	>
		<Box
			sx={{
				width: { xs: "100%", md: 300 },
				flexShrink: 0,
				height: "100%",
				bgcolor: "rgba(6, 6, 14, 0.75)",
				borderRadius: "16px",
				border: "1px solid rgba(123, 104, 238, 0.2)",
				p: 2,
				boxSizing: "border-box",
				display: "flex",
				flexDirection: "column",
				gap: 1.25,
				overflow: "hidden",
			}}
		>
			<Skeleton
				variant="text"
				width={110}
				height={20}
				sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 1 }}
			/>
			<Skeleton
				variant="rectangular"
				height={36}
				sx={{ borderRadius: "8px", bgcolor: "rgba(255,255,255,0.05)" }}
			/>
		</Box>
		<Box
			sx={{
				flex: 1,
				display: "flex",
				flexDirection: "column",
				gap: 2,
				height: "100%",
				overflow: "hidden",
			}}
		>
			<Skeleton
				variant="rectangular"
				height={310}
				sx={{ borderRadius: "16px", bgcolor: "rgba(255,255,255,0.04)" }}
			/>
		</Box>
	</Box>
);
