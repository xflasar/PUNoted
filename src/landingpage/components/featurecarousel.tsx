import { featuresList } from "../const";
import { Box, Typography } from "@mui/material";
import React, { useState, useEffect } from "react";

export const FeatureCarousel: React.FC = React.memo(() => {
	const [activeFeatureIdx, setActiveFeatureIdx] = useState(0);
	const [isMouseDown, setIsMouseDown] = useState(false);
	const [startX, setStartX] = useState(0);
	const [scrollLeftPos, setScrollLeftPos] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			if (!isMouseDown) {
				setActiveFeatureIdx((prev) => {
					const next = (prev + 1) % featuresList.length;
					const track = document.getElementById("features-carousel-track");
					if (track) {
						track.scrollTo({
							left: next * track.clientWidth,
							behavior: "smooth",
						});
					}
					return next;
				});
			}
		}, 4500);
		return () => clearInterval(interval);
	}, [isMouseDown]);

	const handleMouseDown = (e: React.MouseEvent) => {
		setIsMouseDown(true);
		const track = document.getElementById("features-carousel-track");
		if (track) {
			setStartX(e.pageX - track.offsetLeft);
			setScrollLeftPos(track.scrollLeft);
		}
	};

	const handleMouseLeaveOrUp = () => {
		setIsMouseDown(false);
	};

	const handleMouseMove = (e: React.MouseEvent) => {
		if (!isMouseDown) return;
		e.preventDefault();
		const track = document.getElementById("features-carousel-track");
		if (track) {
			const x = e.pageX - track.offsetLeft;
			const walk = (x - startX) * 1.6;
			track.scrollLeft = scrollLeftPos - walk;
		}
	};

	return (
		<Box
			sx={{
				width: "100%",
				borderRadius: 3,
				bgcolor: "rgba(0, 0, 0, 0.45)",
				border: "1px solid rgba(123, 104, 238, 0.2)",
				p: { xs: 2, sm: 3 },
				mb: 3.5,
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				position: "relative",
			}}
		>
			<Box
				id="features-carousel-track"
				onMouseDown={handleMouseDown}
				onMouseUp={handleMouseLeaveOrUp}
				onMouseLeave={handleMouseLeaveOrUp}
				onMouseMove={handleMouseMove}
				onScroll={(e) => {
					const target = e.currentTarget;
					const width = target.clientWidth;
					if (width > 0) {
						const newIdx = Math.round(target.scrollLeft / width);
						if (
							newIdx !== activeFeatureIdx &&
							newIdx >= 0 &&
							newIdx < featuresList.length
						) {
							setActiveFeatureIdx(newIdx);
						}
					}
				}}
				sx={{
					width: "100%",
					display: "flex",
					overflowX: "auto",
					scrollSnapType: isMouseDown ? "none" : "x mandatory",
					scrollBehavior: isMouseDown ? "auto" : "smooth",
					cursor: isMouseDown ? "grabbing" : "grab",
					userSelect: "none",
					WebkitOverflowScrolling: "touch",
					scrollbarWidth: "none",
					"&::-webkit-scrollbar": { display: "none" },
				}}
			>
				{featuresList.map((feat, idx) => (
					<Box
						key={idx}
						sx={{
							flex: "0 0 100%",
							minWidth: "100%",
							scrollSnapAlign: "center",
							scrollSnapStop: "always",
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							textAlign: "center",
							minHeight: 110,
							justifyContent: "center",
							boxSizing: "border-box",
							px: 1,
						}}
					>
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 1.25,
								mb: 1,
							}}
						>
							<Box
								sx={{
									p: 1,
									borderRadius: 2,
									bgcolor: "rgba(255,255,255,0.05)",
									display: "flex",
								}}
							>
								{feat.icon}
							</Box>
							<Box sx={{ textAlign: "left" }}>
								<Typography
									variant="caption"
									sx={{
										color: "rgba(255,255,255,0.4)",
										fontSize: "0.6rem",
										fontWeight: 800,
										letterSpacing: "0.08em",
										display: "block",
									}}
								>
									{feat.badge}
								</Typography>
								<Typography
									sx={{
										fontWeight: 800,
										fontSize: { xs: "0.95rem", sm: "1.05rem" },
										color: "white",
									}}
								>
									{feat.title}
								</Typography>
							</Box>
						</Box>

						<Typography
							sx={{
								fontSize: { xs: "0.78rem", sm: "0.84rem" },
								color: "rgba(255,255,255,0.65)",
								lineHeight: 1.5,
								maxWidth: 480,
								mt: 0.5,
							}}
						>
							{feat.description}
						</Typography>
					</Box>
				))}
			</Box>

			<Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2 }}>
				{featuresList.map((_, idx) => (
					<Box
						key={idx}
						onClick={() => {
							setActiveFeatureIdx(idx);
							const track = document.getElementById("features-carousel-track");
							if (track) {
								track.scrollTo({
									left: idx * track.clientWidth,
									behavior: "smooth",
								});
							}
						}}
						sx={{
							width: idx === activeFeatureIdx ? 22 : 6,
							height: 6,
							borderRadius: "4px",
							bgcolor:
								idx === activeFeatureIdx ? "#7b68ee" : "rgba(255,255,255,0.2)",
							cursor: "pointer",
							transition: "all 0.3s ease",
							"&:hover": { bgcolor: "#7b68ee" },
						}}
					/>
				))}
			</Box>
		</Box>
	);
});
