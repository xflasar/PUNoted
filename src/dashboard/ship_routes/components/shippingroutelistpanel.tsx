import React from "react";
import {
	Box,
	Paper,
	Typography,
	IconButton,
	Switch,
	Stack,
	Tooltip,
	InputBase,
	List,
	ListItem,
	ListItemButton,
	Chip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import LoopIcon from "@mui/icons-material/Loop";
import RefreshIcon from "@mui/icons-material/Refresh";
import type { ShipRoute } from "../../../types/ship_routes";

interface ShippingRouteListPanelProps {
	routes: ShipRoute[];
	selectedRouteId: string | null;
	showAllRoutes: boolean;
	onToggleShowAll: (showAll: boolean) => void;
	onSelectRoute: (routeId: string) => void;
	onRefresh: () => void;
	isLoading: boolean;
}

export const ShippingRouteListPanel: React.FC<ShippingRouteListPanelProps> = ({
	routes,
	selectedRouteId,
	showAllRoutes,
	onToggleShowAll,
	onSelectRoute,
	onRefresh,
	isLoading,
}) => {
	const [search, setSearch] = React.useState("");

	const filteredRoutes = React.useMemo(() => {
		if (!search) return routes;
		const q = search.toLowerCase();
		return routes.filter(
			(r) =>
				r.name?.toLowerCase().includes(q) ||
				r.naturalid?.toLowerCase().includes(q) ||
				r.waypoints.some(
					(w) =>
						w.location_name?.toLowerCase().includes(q) ||
						w.system_name?.toLowerCase().includes(q),
				),
		);
	}, [routes, search]);

	return (
		<Paper
			sx={{
				width: 290,
				maxHeight: "calc(100vh - 120px)",
				display: "flex",
				flexDirection: "column",
				bgcolor: "rgba(12, 14, 24, 0.94)",
				backdropFilter: "blur(18px)",
				border: "1px solid rgba(255, 255, 255, 0.08)",
				borderRadius: 2,
				boxShadow: "0 8px 32px rgba(0, 0, 0, 0.7)",
				zIndex: 10,
				overflow: "hidden",
			}}
		>
			{/* Top Accent Line */}
			<Box
				sx={{
					height: 2,
					background: "linear-gradient(90deg, #7b68ee, #00e5ff)",
					width: "100%",
					flexShrink: 0,
				}}
			/>

			{/* Compact Header */}
			<Box
				sx={{
					p: 1.2,
					pb: 0.8,
					borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
				}}
			>
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						width: "100%",
						boxSizing: "border-box",
						mb: 0.8,
					}}
				>
					<Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
						<Typography
							variant="body2"
							sx={{
								color: "#fff",
								fontWeight: 500,
								fontSize: "0.82rem",
								letterSpacing: 0.5,
							}}
						>
							SHIPPING ROUTES
						</Typography>
						<Typography
							variant="caption"
							sx={{
								color: "primary.light",
								bgcolor: "rgba(123, 104, 238, 0.15)",
								px: 0.6,
								py: 0.1,
								borderRadius: 1,
								fontSize: "0.68rem",
								fontWeight: 500,
							}}
						>
							{routes.length}
						</Typography>
					</Box>

					<Tooltip title="Refresh routes">
						<IconButton
							size="small"
							onClick={onRefresh}
							disabled={isLoading}
							sx={{
								p: 0.4,
								color: "text.secondary",
								"&:hover": { color: "#fff" },
							}}
						>
							<RefreshIcon sx={{ fontSize: 16 }} />
						</IconButton>
					</Tooltip>
				</Box>

				{/* Show All Toggle */}
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						width: "100%",
						boxSizing: "border-box",
						bgcolor: "rgba(255, 255, 255, 0.02)",
						px: 1,
						py: 0.2,
						borderRadius: 1,
						mb: 0.8,
						border: "1px solid rgba(255, 255, 255, 0.04)",
					}}
				>
					<Typography
						variant="caption"
						sx={{ color: "text.secondary", fontSize: "0.7rem" }}
					>
						Show all on map
					</Typography>
					<Switch
						size="small"
						checked={showAllRoutes}
						onChange={(e) => onToggleShowAll(e.target.checked)}
						sx={{
							transform: "scale(0.8)",
							"& .MuiSwitch-switchBase.Mui-checked": { color: "#7b68ee" },
							"& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
								backgroundColor: "#7b68ee",
							},
						}}
					/>
				</Box>

				{/* Search Input */}
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						bgcolor: "rgba(0, 0, 0, 0.35)",
						border: "1px solid rgba(255, 255, 255, 0.06)",
						borderRadius: 1,
						px: 0.8,
						py: 0.2,
						transition: "border-color 0.15s ease",
						"&:focus-within": {
							borderColor: "rgba(123, 104, 238, 0.5)",
						},
					}}
				>
					<SearchIcon sx={{ color: "text.secondary", fontSize: 15, mr: 0.6 }} />
					<InputBase
						fullWidth
						placeholder="Filter routes or stops..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						sx={{ fontSize: "0.76rem", color: "#fff" }}
					/>
				</Box>
			</Box>

			{/* Routes List */}
			<List sx={{ flexGrow: 1, overflowY: "auto", p: 0.6 }}>
				{filteredRoutes.length === 0 ? (
					<Box p={2} textAlign="center">
						<Typography
							variant="caption"
							sx={{ color: "text.secondary", fontSize: "0.72rem" }}
						>
							{routes.length === 0
								? "No shipping routes detected."
								: "No routes match filter."}
						</Typography>
					</Box>
				) : (
					filteredRoutes.map((route) => {
						const isSelected = route.routeid === selectedRouteId;
						const wpCount = route.waypoints.length;
						const shipCount = route.assigned_ships.length;

						const names = route.waypoints.map(
							(w) => w.location_name || w.system_name,
						);
						const pathSummary =
							names.length <= 3
								? names.join(" → ")
								: `${names[0]} → ${names[1]} → ... → ${names[names.length - 1]}`;

						return (
							<ListItem key={route.routeid} disablePadding sx={{ mb: 0.6 }}>
								<ListItemButton
									onClick={() => onSelectRoute(route.routeid)}
									selected={isSelected}
									sx={{
										borderRadius: 1.2,
										px: 1,
										py: 0.7,
										bgcolor: isSelected
											? "rgba(123, 104, 238, 0.14) !important"
											: "rgba(255, 255, 255, 0.02)",
										border: isSelected
											? "1px solid rgba(123, 104, 238, 0.45)"
											: "1px solid rgba(255, 255, 255, 0.04)",
										borderLeft: isSelected
											? "3px solid #7b68ee !important"
											: "1px solid rgba(255, 255, 255, 0.04)",
										transition: "all 0.15s ease",
										"&:hover": {
											bgcolor: "rgba(123, 104, 238, 0.08)",
										},
									}}
								>
									<Box width="100%">
										{/* Title + Repeat tag */}
										<Box
											sx={{
												display: "flex",
												justifyContent: "space-between",
												alignItems: "center",
												width: "100%",
												boxSizing: "border-box",
											}}
										>
											<Typography
												variant="body2"
												sx={{
													fontSize: "0.8rem",
													fontWeight: 500,
													color: isSelected ? "#fff" : "#e0e0e0",
													overflow: "hidden",
													textOverflow: "ellipsis",
													whiteSpace: "nowrap",
												}}
											>
												{route.name || "Unnamed Route"}
											</Typography>

											{route.repeats && (
												<Tooltip title="Looping Route">
													<LoopIcon
														sx={{
															fontSize: 13,
															color: "#66bb6a",
															ml: 0.5,
															flexShrink: 0,
														}}
													/>
												</Tooltip>
											)}
										</Box>

										{/* Path Sequence Preview */}
										{pathSummary && (
											<Typography
												variant="caption"
												sx={{
													color: isSelected
														? "rgba(255, 255, 255, 0.7)"
														: "text.secondary",
													fontSize: "0.66rem",
													display: "block",
													mt: 0.3,
													overflow: "hidden",
													textOverflow: "ellipsis",
													whiteSpace: "nowrap",
												}}
											>
												{pathSummary}
											</Typography>
										)}

										{/* Meta line */}
										<Box
											sx={{
												display: "flex",
												justifyContent: "space-between",
												alignItems: "center",
												width: "100%",
												boxSizing: "border-box",
												mt: 0.5,
											}}
										>
											<Typography
												variant="caption"
												sx={{
													color: "text.secondary",
													fontSize: "0.66rem",
													fontFamily: "monospace",
												}}
											>
												{route.naturalid}
											</Typography>

											<Stack direction="row" spacing={0.5}>
												<Chip
													label={`${wpCount} stops`}
													size="small"
													sx={{
														height: 16,
														fontSize: "0.6rem",
														bgcolor: "rgba(123, 104, 238, 0.12)",
														color: "primary.light",
														px: 0.2,
													}}
												/>
												<Chip
													label={`${shipCount} ${shipCount === 1 ? "ship" : "ships"}`}
													size="small"
													sx={{
														height: 16,
														fontSize: "0.6rem",
														bgcolor:
															shipCount > 0
																? "rgba(0, 229, 255, 0.12)"
																: "rgba(255,255,255,0.04)",
														color: shipCount > 0 ? "#00e5ff" : "text.secondary",
														px: 0.2,
													}}
												/>
											</Stack>
										</Box>
									</Box>
								</ListItemButton>
							</ListItem>
						);
					})
				)}
			</List>
		</Paper>
	);
};
