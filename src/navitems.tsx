import React from "react";
import HomeIcon from "@mui/icons-material/Home";
import StorageIcon from "@mui/icons-material/Storage";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import SettingsIcon from "@mui/icons-material/Settings";
import AltRouteIcon from "@mui/icons-material/AltRoute";
import {
	AccountBalance,
	Assignment,
	Diversity3,
	LocationCity,
	Map,
	Public,
	RocketLaunch,
} from "@mui/icons-material";
import { DollarSignIcon, Gavel } from "lucide-react";

export interface NavItem {
	text: string;
	icon: React.ReactNode;
	href: string;
	disabled?: boolean;
}

export interface NavCategory {
	category: string;
	items: NavItem[];
}

export const navCategories: NavCategory[] = [
	{
		category: "Maps & Navigation",
		items: [
			{ text: "Galaxy Map", icon: <Map />, href: "/dashboard/galaxy-map" },
			{
				text: "Shipments",
				icon: <RocketLaunch />,
				href: "/dashboard/shipments",
			},
			{
				text: "Shipping Routes (WIP)",
				icon: <AltRouteIcon />,
				href: "/dashboard/shipping-routes",
			},
		],
	},
	{
		category: "Fleet & Logistics",
		items: [
			{
				text: "Logistics",
				icon: <LocalShippingIcon />,
				href: "/dashboard/logistics",
				disabled: true,
			},
		],
	},
	{
		category: "Empire & Production",
		items: [
			{ text: "Sites", icon: <Map />, href: "/dashboard/sites" },
			{
				text: "Global Storage",
				icon: <StorageIcon />,
				href: "/dashboard/storage",
			},
		],
	},
	{
		category: "Commerce & Finance",
		items: [
			{ text: "CX Dashboard", icon: <ShowChartIcon />, href: "/dashboard/cx" },
			{
				text: "Financial",
				icon: <DollarSignIcon size={20} />,
				href: "/dashboard/financial",
			},
			{
				text: "Contracts",
				icon: <Assignment />,
				href: "/dashboard/contracts",
			},
			{
				text: "Banking",
				icon: <AccountBalance />,
				href: "/dashboard/banking",
			},
		],
	},
	{
		category: "Organization & Community",
		items: [
			{ text: "Corporation", icon: <LocationCity />, href: "/dashboard/corp" },
			{
				text: "Governance (WIP)",
				icon: <Gavel size={20} />,
				href: "/dashboard/governance",
			},
			{
				text: "Cooperation",
				icon: <Diversity3 />,
				href: "/dashboard/cooperation",
				disabled: true,
			},
			{
				text: "Public Data (WIP)",
				icon: <Public />,
				href: "/dashboard/public-data",
			},
		],
	},
	{
		category: "System",
		items: [
			{ text: "Settings", icon: <SettingsIcon />, href: "/dashboard/settings" },
		],
	},
];

// Flat export for compatibility with Landing Page and existing consumers
export const navItems: NavItem[] = [
	{ text: "Landing Page", icon: <HomeIcon />, href: "/" },
	...navCategories.flatMap((cat) => cat.items),
];
