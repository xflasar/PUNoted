import React, { useState } from "react";
import {
	Box,
	Typography,
	List,
	ListItem,
	ListItemText,
	Divider,
	Grid,
	Paper,
	Tabs,
	Tab,
	LinearProgress,
} from "@mui/material";
import { Site, Ship, Storage } from "./types";
import { Rocket } from "lucide-react";

interface TabPanelProps {
	children?: React.ReactNode;
	index: number;
	value: number;
}

function TabPanel(props: TabPanelProps) {
	const { children, value, index, ...other } = props;

	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`site-stat-tabpanel-${index}`}
			aria-labelledby={`site-stat-tab-${index}`}
			{...other}
		>
			{value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
		</div>
	);
}

const StorageContents: React.FC<{ storage: Storage }> = ({ storage }) => (
	<Paper variant="outlined" sx={{ p: 2 }}>
		<Typography variant="h6" gutterBottom>
			{storage.name} Contents
		</Typography>
		<Box sx={{ mb: 2 }}>
			<Typography
				variant="body2"
				color="text.secondary"
			>{`Tonnage: ${storage.currentTonnage} / ${storage.maxTonnage}`}</Typography>
			<LinearProgress
				variant="determinate"
				value={(storage.currentTonnage / storage.maxTonnage) * 100}
			/>
		</Box>
		<Box sx={{ mb: 2 }}>
			<Typography
				variant="body2"
				color="text.secondary"
			>{`Volume: ${storage.currentVolume} / ${storage.maxVolume}`}</Typography>
			<LinearProgress
				variant="determinate"
				value={(storage.currentVolume / storage.maxVolume) * 100}
			/>
		</Box>
		<Divider />
		<List dense>
			{storage.items.map((item) => (
				<ListItem key={item.materialTicker} divider>
					<ListItemText
						primary={item.materialTicker}
						secondary={`Amount: ${item.amount.toLocaleString()}`}
					/>
				</ListItem>
			))}
		</List>
	</Paper>
);

interface SiteStatsProps {
	site: Site;
	ships: Ship[];
}

const SiteStats: React.FC<SiteStatsProps> = ({ site, ships }) => {
	const [value, setValue] = useState(0);

	const handleChange = (event: React.SyntheticEvent, newValue: number) => {
		setValue(newValue);
	};

	const netChange = React.useMemo(() => {
		const change: Record<string, number> = {};
		site.dailyProduction.forEach(
			(p) =>
				(change[p.materialTicker] = (change[p.materialTicker] || 0) + p.amount),
		);
		site.dailyConsumption.forEach(
			(c) =>
				(change[c.materialTicker] = (change[c.materialTicker] || 0) - c.amount),
		);
		return change;
	}, [site]);

	const assignedShips = ships.filter((ship) => ship.assignedSiteId === site.id);

	const StatList: React.FC<{
		title: string;
		data: { materialTicker: string; amount: number }[];
	}> = ({ title, data }) => (
		<Box>
			<Typography variant="subtitle1" gutterBottom>
				{title}
			</Typography>
			<List dense disablePadding>
				{data.map((item) => (
					<ListItem key={item.materialTicker} disableGutters>
						<ListItemText
							primary={item.materialTicker}
							secondary={item.amount.toLocaleString()}
						/>
					</ListItem>
				))}
			</List>
		</Box>
	);

	return (
		<Box sx={{ width: "100%" }}>
			<Box sx={{ borderBottom: 1, borderColor: "divider" }}>
				<Tabs
					value={value}
					onChange={handleChange}
					aria-label="site details tabs"
					variant="scrollable"
					scrollButtons="auto"
				>
					<Tab label="Material Flow" />
					<Tab label={`Assigned Ships (${assignedShips.length})`} />
					<Tab label="Site Storage" />
					{site.warehouse && <Tab label="Warehouse" />}
				</Tabs>
			</Box>
			<TabPanel value={value} index={0}>
				<Paper
					variant="outlined"
					sx={{ p: 2, backgroundColor: "action.hover" }}
				>
					<Typography variant="h6" gutterBottom>
						Daily Material Flow
					</Typography>
					<Divider sx={{ my: 1 }} />
					<Grid container spacing={2}>
						<Grid item xs={12} md={4}>
							<StatList title="Production" data={site.dailyProduction} />
						</Grid>
						<Grid item xs={12} md={4}>
							<StatList title="Consumption" data={site.dailyConsumption} />
						</Grid>
						<Grid item xs={12} md={4}>
							<Box>
								<Typography variant="subtitle1" gutterBottom>
									Net Change
								</Typography>
								<List dense disablePadding>
									{Object.entries(netChange).map(([material, amount]) => (
										<ListItem key={material} disableGutters>
											<ListItemText
												primary={material}
												secondary={amount.toLocaleString()}
												secondaryTypographyProps={{
													component: "span",
													color: amount > 0 ? "success.main" : "error.main",
												}}
											/>
										</ListItem>
									))}
								</List>
							</Box>
						</Grid>
					</Grid>
				</Paper>
			</TabPanel>
			<TabPanel value={value} index={1}>
				<List>
					{assignedShips.map((ship) => (
						<ListItem key={ship.id} divider>
							<Rocket style={{ marginRight: "1em" }} />
							<ListItemText
								primary={ship.name}
								secondary={`Tonnage: ${ship.shipStorage.maxTonnage}, Volume: ${ship.shipStorage.maxVolume}`}
							/>
						</ListItem>
					))}
				</List>
			</TabPanel>
			<TabPanel value={value} index={2}>
				<StorageContents storage={site.siteStorage} />
			</TabPanel>
			{site.warehouse && (
				<TabPanel value={value} index={3}>
					<StorageContents storage={site.warehouse} />
				</TabPanel>
			)}
		</Box>
	);
};

export default SiteStats;
