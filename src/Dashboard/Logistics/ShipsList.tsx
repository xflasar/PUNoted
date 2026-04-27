import React, { useState, useMemo } from "react";
import {
	Box,
	TextField,
	InputAdornment,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	SelectChangeEvent,
	useTheme,
} from "@mui/material";
import { Search } from "lucide-react";

import { Ship, Site, CX } from "./types";
import ShipCard from "./components/ShipCard";

interface ShipsListProps {
	ships: Ship[];
	sites: (Site | CX)[];
	onAssignShip: (shipId: string, siteId: string | null) => void;
}

const ShipsList: React.FC<ShipsListProps> = ({
	ships,
	sites,
	onAssignShip,
}) => {
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [assignmentFilter, setAssignmentFilter] = useState<string>("all");
	const theme = useTheme();

	const siteMap = useMemo(
		() => new Map(sites.map((s) => [s.id, s.name])),
		[sites],
	);

	const filteredShips = useMemo(() => {
		return ships.filter((ship) => {
			const matchesSearch = ship.name
				? ship.name.toLowerCase().includes(searchTerm.toLowerCase())
				: ship.shipStorage.name
						.toLowerCase()
						.includes(searchTerm.toLowerCase());
			const matchesStatus =
				statusFilter === "all" || ship.status === statusFilter;
			const matchesAssignment =
				assignmentFilter === "all" ||
				(assignmentFilter === "assigned" && ship.assignedSiteId) ||
				(assignmentFilter === "unassigned" && !ship.assignedSiteId);

			return matchesSearch && matchesStatus && matchesAssignment;
		});
	}, [ships, searchTerm, statusFilter, assignmentFilter]);

	return (
		<Box
			sx={{
				height: "100%",
				display: "flex",
				flexDirection: "column",
				flexGrow: 1,
				overflow: "hidden",
				p: 2,
				background: "transparent",
			}}
		>
			<Box
				sx={{
					display: "flex",
					flexDirection: { xs: "column", md: "row" },
					alignItems: "center",
					gap: 1.5,
					mb: 2,
					flexShrink: 0,
				}}
			>
				<TextField
					fullWidth
					variant="outlined"
					placeholder="Search ships..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<Search size={20} />
							</InputAdornment>
						),
					}}
				/>
				<Box
					sx={{
						display: "flex",
						gap: 1.5,
						width: "100%",
						justifyContent: "space-between",
					}}
				>
					<FormControl fullWidth>
						<InputLabel>Status</InputLabel>
						<Select
							value={statusFilter}
							label="Status"
							onChange={(e: SelectChangeEvent) =>
								setStatusFilter(e.target.value)
							}
						>
							<MenuItem value="all">All</MenuItem>
							<MenuItem value="idle">Idle</MenuItem>
							<MenuItem value="in-transit">In Transit</MenuItem>
						</Select>
					</FormControl>
					<FormControl fullWidth>
						<InputLabel>Assignment</InputLabel>
						<Select
							value={assignmentFilter}
							label="Assignment"
							onChange={(e: SelectChangeEvent) =>
								setAssignmentFilter(e.target.value)
							}
						>
							<MenuItem value="all">All</MenuItem>
							<MenuItem value="assigned">Assigned</MenuItem>
							<MenuItem value="unassigned">Unassigned</MenuItem>
						</Select>
					</FormControl>
				</Box>
			</Box>

			<Box
				name="ship-list"
				sx={{
					flexGrow: 1,
					overflowY: "auto",
					minHeight: 0,
					pr: 1,
					// Custom Scrollbar Styling
					"&::-webkit-scrollbar": { width: "8px" },
					"&::-webkit-scrollbar-track": { background: "transparent" },
					"&::-webkit-scrollbar-thumb": {
						backgroundColor:
							theme.palette.mode === "dark"
								? "rgba(255,255,255,0.2)"
								: "rgba(0,0,0,0.2)",
						borderRadius: "4px",
					},
					"&::-webkit-scrollbar-thumb:hover": {
						backgroundColor:
							theme.palette.mode === "dark"
								? "rgba(255,255,255,0.3)"
								: "rgba(0,0,0,0.3)",
					},
				}}
			>
				<Box
					sx={{
						display: "grid",
						gap: 2,
						gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
						pb: 2,
					}}
				>
					{filteredShips.map((ship) => (
						<ShipCard
							key={ship.id}
							ship={ship}
							assignedSiteName={
								ship.assignedSiteId
									? siteMap.get(ship.assignedSiteId)
									: undefined
							}
							sites={sites}
							onAssignShip={onAssignShip}
						/>
					))}
				</Box>
			</Box>
		</Box>
	);
};

export default ShipsList;
