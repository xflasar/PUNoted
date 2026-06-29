import {
	ListItemButton,
	Typography,
	Chip,
	IconButton,
	Collapse,
	Box,
} from "@mui/material";

import React from "react";
import MaterialBadge from "../../../../../../cosm/components/materialbadge";
import type { SystemRowProps } from "../types";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

export const SystemRow = React.memo(
	({
		sys,
		planets,
		isExpanded,
		filterResourcesArray,
		onToggle,
		onSelectSystem,
		onSelectPlanet,
	}: SystemRowProps) => {
		const sysId = sys.originalSystemId || sys.id;

		return (
			<Box
				sx={{
					mb: 1,
					borderRadius: "8px",
					border: "1px solid rgba(255, 255, 255, 0.04)",
					bgcolor: "rgba(255, 255, 255, 0.01)",
					overflow: "hidden",
				}}
			>
				{/* System Item */}
				<ListItemButton
					onClick={() => onSelectSystem(sys)}
					sx={{
						p: 1.5,
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						"&:hover": {
							bgcolor: "rgba(0, 229, 255, 0.06)",
							borderLeft: "2px solid #00e5ff",
							pl: "10px",
						},
					}}
				>
					<Box sx={{ flexGrow: 1 }}>
						<Typography
							variant="subtitle2"
							sx={{ fontWeight: 700, color: "white" }}
						>
							{sys.label || sys.name}
						</Typography>
						<Box sx={{ display: "flex", gap: 1, mt: 0.25 }}>
							<Typography
								variant="caption"
								sx={{ color: "rgba(255,255,255,0.4)" }}
							>
								Pop: {sys.population ? sys.population.toLocaleString() : "0"}
							</Typography>
							<Typography
								variant="caption"
								sx={{ color: "rgba(255,255,255,0.4)" }}
							>
								Type: {sys.systemtype || "K"}
							</Typography>
						</Box>
					</Box>

					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						{planets.length > 0 && (
							<Chip
								label={`${planets.length} matching`}
								size="small"
								sx={{
									height: 18,
									fontSize: "0.6rem",
									bgcolor: "rgba(0, 229, 255, 0.1)",
									color: "#00e5ff",
									border: "1px solid rgba(0, 229, 255, 0.2)",
								}}
							/>
						)}
						<IconButton
							size="small"
							onClick={(e) => onToggle(sysId, e)}
							sx={{ color: "rgba(255,255,255,0.4)", p: 0.25 }}
						>
							{isExpanded ? (
								<ExpandLessIcon fontSize="small" />
							) : (
								<ExpandMoreIcon fontSize="small" />
							)}
						</IconButton>
					</Box>
				</ListItemButton>

				{/* Planets Collapsible Area */}
				<Collapse in={isExpanded} timeout="auto" unmountOnExit>
					<Box
						sx={{
							pl: 2,
							pr: 1,
							pb: 1,
							borderTop: "1px solid rgba(255,255,255,0.03)",
						}}
					>
						{planets.length === 0 ? (
							<Typography
								variant="caption"
								sx={{
									color: "rgba(255,255,255,0.3)",
									display: "block",
									py: 1,
									pl: 1,
								}}
							>
								No matching planets
							</Typography>
						) : (
							planets.map((planet) => (
								<ListItemButton
									key={planet.planetid}
									onClick={() => onSelectPlanet(planet.planetid, sys)}
									sx={{
										mt: 0.5,
										p: 1,
										borderRadius: "4px",
										display: "flex",
										flexDirection: "column",
										alignItems: "flex-start",
										bgcolor: "rgba(0, 0, 0, 0.2)",
										border: "1px solid rgba(255, 255, 255, 0.03)",
										"&:hover": {
											bgcolor: "rgba(255, 120, 0, 0.08)",
											borderLeft: "2px solid #ff7800",
											pl: "6px",
										},
									}}
								>
									<Box
										sx={{
											display: "flex",
											justifyContent: "space-between",
											width: "100%",
											alignItems: "center",
										}}
									>
										<Typography
											variant="caption"
											sx={{
												fontWeight: 700,
												color: "rgba(255,255,255,0.9)",
											}}
										>
											{planet.planetname}
										</Typography>
										<Typography
											variant="caption"
											sx={{
												fontSize: "0.55rem",
												color: "rgba(255,255,255,0.4)",
											}}
										>
											{planet.type}
										</Typography>
									</Box>

									{/* Resources List on Planet Item */}
									{planet.resources && planet.resources.length > 0 && (
										<Box
											sx={{
												display: "flex",
												flexWrap: "wrap",
												gap: 0.5,
												mt: 0.75,
												width: "100%",
											}}
										>
											{planet.resources.map((r, rIdx) => {
												const ticker = (r as any).material || r.name;
												const factor =
													(r as any).factor !== undefined
														? (r as any).factor
														: r.value;
												const isFiltered = filterResourcesArray.includes(
													ticker?.toUpperCase(),
												);

												return (
													<Box
														key={rIdx}
														sx={{
															display: "inline-flex",
															alignItems: "center",
															bgcolor: isFiltered
																? "rgba(0, 229, 255, 0.15)"
																: "rgba(0, 0, 0, 0.3)",
															border: isFiltered
																? "1px solid rgba(0, 229, 255, 0.3)"
																: "1px solid rgba(255,255,255,0.04)",
															borderRadius: "3px",
															px: 0.4,
															py: 0.1,
															gap: 0.25,
														}}
													>
														<Box
															sx={{
																fontSize: "0.5rem",
																display: "inline-flex",
															}}
														>
															<MaterialBadge ticker={ticker} />
														</Box>
														<Typography
															variant="caption"
															sx={{
																fontSize: "0.55rem",
																fontWeight: 700,
																color: isFiltered
																	? "#00e5ff"
																	: "rgba(255,255,255,0.7)",
															}}
														>
															{Math.round(factor * 100)}%
														</Typography>
													</Box>
												);
											})}
										</Box>
									)}
								</ListItemButton>
							))
						)}
					</Box>
				</Collapse>
			</Box>
		);
	},
	// Deep comparison to ensure we ONLY re-render if something actually changed
	(prev, next) => {
		return (
			prev.sys.id === next.sys.id &&
			prev.isExpanded === next.isExpanded &&
			prev.planets === next.planets &&
			prev.filterResourcesArray.join(",") ===
				next.filterResourcesArray.join(",")
		);
	},
);
