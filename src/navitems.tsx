import HomeIcon from "@mui/icons-material/Home";
import StorageIcon from "@mui/icons-material/Storage";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import FactoryIcon from "@mui/icons-material/Factory";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import SettingsIcon from "@mui/icons-material/Settings";
import {
	Assignment,
	CoPresent,
	Diversity3,
	LocationCity,
	Map,
	Public,
	RocketLaunch,
} from "@mui/icons-material";
import { DollarSignIcon, Gavel } from "lucide-react";

export const navItems = [
	{ text: "Landing Page", icon: <HomeIcon />, href: "/" },
	{ text: "Galaxy Map", icon: <Map />, href: "/dashboard/galaxy-map" },
	{ text: "Corporation", icon: <LocationCity />, href: "/dashboard/corp" },
	{ text: "Sites", icon: <Map />, href: "/dashboard/sites" },
	//{ text: "Base Planner", icon: <Assignment />, href: "/dashboard/planner" },
	{ text: "Global Storage", icon: <StorageIcon />, href: "/dashboard/storage" },
	{ text: "CX Dashboard", icon: <ShowChartIcon />, href: "/dashboard/cx" },
	{
		text: "Financial (Semi-WIP)",
		icon: <DollarSignIcon />,
		href: "/dashboard/financial",
	},
	{ text: "Shipments", icon: <RocketLaunch />, href: "/dashboard/shipments" },
	{
		text: "Logistics (WIP)",
		icon: <LocalShippingIcon />,
		href: "/dashboard/logistics",
	},
	{
		text: "Contracts",
		icon: <Assignment />,
		href: "/dashboard/contracts",
	},
	{ text: "Governance (WIP)", icon: <Gavel />, href: "/dashboard/governance" },
	{
		text: "Cooperation (WIP)",
		icon: <Diversity3 />,
		href: "/dashboard/cooperation",
	},
	{
		text: "Public Data (WIP)",
		icon: <Public />,
		href: "/dashboard/public-data",
	},
	{
		text: "Leaderboard (Semi-WIP)",
		icon: <CoPresent />,
		href: "/dashboard/leaderboard",
	},
	{ text: "Settings", icon: <SettingsIcon />, href: "/dashboard/settings" },
];
