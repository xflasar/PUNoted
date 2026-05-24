import React, { useState, useMemo } from "react";
import {
	Drawer,
	Box,
	Typography,
	IconButton,
	useTheme,
	TextField,
	InputAdornment,
} from "@mui/material";
import { X, Search } from "lucide-react";

import type { Site, Ship } from "./types";
import SiteCard from "./components/sitecard";
import SiteStats from "./sitestats";

interface SitesListProps {
	sites: Site[];
	ships: Ship[];
}

const SitesList: React.FC<SitesListProps> = ({ sites, ships }) => {
	const [selectedSite, setSelectedSite] = useState<Site | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const theme = useTheme();

	const handleSelectSite = (site: Site) => {
		setSelectedSite(site);
	};

	const handleCloseDrawer = () => {
		setSelectedSite(null);
	};

	const filteredSites = useMemo(() => {
		if (!searchTerm) return sites;
		return sites.filter(
			(site) =>
				site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				site.planetName.toLowerCase().includes(searchTerm.toLowerCase()),
		);
	}, [sites, searchTerm]);

	return (
		// Added padding here (p: 2) to compensate for removing it from the parent Paper
		<Box
			sx={{
				height: "100%",
				display: "flex",
				flexDirection: "column",
				overflow: "hidden",
				flexGrow: 1,
				p: 2,
			}}
		>
			<TextField
				fullWidth
				variant="outlined"
				placeholder="Search sites by name or planet..."
				value={searchTerm}
				onChange={(e) => setSearchTerm(e.target.value)}
				InputProps={{
					startAdornment: (
						<InputAdornment position="start">
							<Search size={20} />
						</InputAdornment>
					),
				}}
				sx={{ mb: 2, flexShrink: 0 }}
			/>

			<Box
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
					{filteredSites.map((site) => (
						<SiteCard key={site.id} site={site} onSelect={handleSelectSite} />
					))}
				</Box>
			</Box>

			<Drawer
				anchor="right"
				open={!!selectedSite}
				onClose={handleCloseDrawer}
				PaperProps={{
					sx: {
						width: { xs: "90%", md: "50%", lg: "40%" },
						p: 2,
						backgroundColor: theme.palette.background.default,
					},
				}}
			>
				{selectedSite && (
					<Box>
						<Box
							sx={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								mb: 2,
								borderBottom: `1px solid ${theme.palette.divider}`,
								pb: 1,
							}}
						>
							<Typography variant="h5">{selectedSite.name}</Typography>
							<IconButton onClick={handleCloseDrawer}>
								<X />
							</IconButton>
						</Box>
						<SiteStats site={selectedSite} ships={ships} />
					</Box>
				)}
			</Drawer>
		</Box>
	);
};

export default SitesList;
