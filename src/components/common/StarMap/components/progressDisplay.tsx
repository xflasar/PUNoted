import { Box, Typography, LinearProgress } from "@mui/material";
import React, { useState, useEffect, memo, useRef } from "react";

const getShipFlightProgress = (plan: any, now: number = Date.now()) => {
	if (!plan || !plan.segments || plan.segments.length === 0) {
		return { progressPercent: 0, elapsedMs: 0, remainingMs: 0 };
	}
	const segments = plan.segments;
	const currentSegmentIndex = plan.currentsegmentindex;
	const firstDeparture = segments[0].departure;
	const lastArrival = segments[segments.length - 1].arrival;
	const totalDuration = lastArrival - firstDeparture;

	if (totalDuration <= 0 || now >= lastArrival)
		return { progressPercent: 100, elapsedMs: totalDuration, remainingMs: 0 };
	if (now < firstDeparture)
		return { progressPercent: 0, elapsedMs: 0, remainingMs: totalDuration };

	let elapsed = 0;
	const validSegmentIndex =
		typeof currentSegmentIndex === "number" && currentSegmentIndex >= 0;

	if (validSegmentIndex) {
		for (let i = 0; i < currentSegmentIndex; i++) {
			const seg = segments[i];
			if (
				seg &&
				typeof seg.arrival === "number" &&
				typeof seg.departure === "number"
			) {
				elapsed += seg.arrival - seg.departure;
			}
		}
	}

	const currentSeg = validSegmentIndex ? segments[currentSegmentIndex] : null;

	if (
		!currentSeg ||
		typeof currentSeg.arrival !== "number" ||
		typeof currentSeg.departure !== "number"
	) {
		const remaining = totalDuration - elapsed;
		return {
			progressPercent: (elapsed / totalDuration) * 100,
			elapsedMs: elapsed,
			remainingMs: Math.max(0, remaining),
		};
	}

	const segDuration = currentSeg.arrival - currentSeg.departure;
	let currentElapsed = 0;
	if (segDuration > 0) {
		currentElapsed = Math.max(
			0,
			Math.min(now - currentSeg.departure, segDuration),
		);
	}

	elapsed += currentElapsed;
	const remaining = totalDuration - elapsed;
	return {
		progressPercent: (elapsed / totalDuration) * 100,
		elapsedMs: elapsed,
		remainingMs: remaining,
	};
};

const formatDuration = (ms: number) => {
	const totalSeconds = Math.max(0, Math.round(ms / 1000));
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	if (hours > 0) return `${hours}h ${minutes}m`;
	return `${minutes}m ${seconds}s`;
};

const ProgressDisplayComponent = ({ plan }: { plan: any }) => {
	const intervalRef = useRef<any | null>(null);
	const [tick, setTick] = useState(0);

	const { progressPercent, elapsedMs, remainingMs } =
		getShipFlightProgress(plan);

	useEffect(() => {
		const { remainingMs: initialRemainingMs } = getShipFlightProgress(plan);

		if (initialRemainingMs > 0) {
			const interval = setInterval(() => {
				const { remainingMs: currentRemainingMs } = getShipFlightProgress(
					plan,
					Date.now(),
				);

				if (currentRemainingMs <= 0) {
					if (intervalRef.current) {
						clearInterval(intervalRef.current);
						intervalRef.current = null;
					}
					setTick((t) => t + 1);
				} else {
					setTick((t) => t + 1);
				}
			}, 1000);

			intervalRef.current = interval;
		}

		return () => {
			if (intervalRef.current !== null) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [plan]);

	return (
		<Box sx={{ mt: 1, mb: 0.5 }}>
			<LinearProgress
				variant="determinate"
				value={progressPercent}
				color="primary"
				sx={(theme) => ({
					height: 6,
					borderRadius: 3,
					backgroundColor:
						theme.palette.mode === "dark"
							? "rgba(255, 255, 255, 0.1)"
							: "rgba(0, 0, 0, 0.1)",
				})}
			/>
			<Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
				<Typography
					variant="caption"
					sx={{ color: "text.secondary", fontWeight: "bold" }}
				>
					{formatDuration(elapsedMs)} passed
				</Typography>
				<Typography
					variant="caption"
					sx={{ color: "primary.main", fontWeight: "bold" }}
				>
					{remainingMs > 0 ? `${formatDuration(remainingMs)} left` : "Arrived!"}
				</Typography>
			</Box>
		</Box>
	);
};

export const ProgressDisplay = memo(ProgressDisplayComponent);

export default ProgressDisplay;
