import { FaMap, FaStore, FaChartLine } from "react-icons/fa";
import { CorporateFare } from "@mui/icons-material";

export const featuresList = [
	{
		title: "Interactive Galaxy Map",
		icon: <FaMap size={24} color="#7b68ee" />,
		badge: "NAVIGATION",
		description:
			"Real-time 2D starmaps, system nodes, jump segment distance calculations, and sector routing across Prosperous Universe.",
	},
	{
		title: "CX Market Intelligence",
		icon: <FaStore size={24} color="#60a5fa" />,
		badge: "EXCHANGE",
		description:
			"Commodity exchange order books, historical pricing trends, materials valuation, and trade margin calculators.",
	},
	{
		title: "Site, Financial, Production, Corp Operations",
		icon: <FaChartLine size={24} color="#4ade80" />,
		badge: "TELEMETRY",
		description:
			"Workforce buffer tracking, production burn rate analytics, inventory storage, loan tracking, and financial balance sheet ledgers.",
	},
	{
		title: "COSM Vendors, Ship Production",
		icon: <CorporateFare />,
		badge: "COSM",
		description: "COSM Vendors, Ship Production, Marketplace, and more.",
	},
];
