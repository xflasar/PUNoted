import { API_BASE_URL } from "../../config/api";
import type { GuideStep } from "../../helpers/GlobalGuide";

export const API_BASE = `${API_BASE_URL}internal`;
export const WS_URL = "wss://a";

export const PAGE_CONTEXTS = {
	CORP_PAGE: "Corporation Page",
	DASHBOARD: "Dashboard",
	COOPERATION: "Cooperation Tool",
};

export const MASTER_PERMISSIONS = [
	{
		key: "profile:read",
		label: "Company Profile",
		desc: "Basic company info, code, and HQ",
	},
	{
		key: "accounting:read",
		label: "Accounting",
		desc: "Wallet balances, taxes, and transactions",
	},
	{ key: "contracts:read", label: "Contracts", desc: "Contracts data." },
	{
		key: "ships:read",
		label: "Ships & Fleets",
		desc: "Locations, cargo, fuel, and loadouts",
	},
	{ key: "flights:read", label: "Flights", desc: "Flights data." },
	{
		key: "sites:read",
		label: "Sites & Buildings",
		desc: "Planetary bases and infrastructure",
	},
	{
		key: "storage:read",
		label: "Inventories",
		desc: "Warehouse contents (all locations)",
	},
	{
		key: "production:read",
		label: "Production",
		desc: "Active lines, recipes, and queues",
	},
	{
		key: "workforce:read",
		label: "Workforce",
		desc: "Population numbers and satisfaction",
	},
	{
		key: "cxdata:read",
		label: "CX Data",
		desc: "Exchange orders and price history",
	},
];

export const profileandcompanyGuideSteps: GuideStep[] = [
	{
		title: "Display Name",
		description:
			"This is your public identifier within this application and in-game.",
		type: "info",
	},
	{
		title: "FIO API Key (!! CURRENTLY NOT IN USE !!)",
		description:
			"Required to fetch your live game data. This key is stored securely and only used for fetching FIO data. (!! CURRENTLY NOT IN USE !!)",
		type: "action",
	},
	{
		title: "Company Sync",
		description:
			"Your company is automatically synchronized from the PUNoted API.",
		type: "feature",
	},
];

export const securityGuideSteps: GuideStep[] = [
	{
		title: "Password Update",
		description:
			"Initiate a secure password change. A verification code will be sent to your registered email.",
		type: "action",
	},
	{
		title: "Verification",
		description:
			"You must verify your identity via email before any security changes are applied.",
		type: "info",
	},
];

export const privacyGuideSteps: GuideStep[] = [
	{
		title: "Contextual Privacy",
		description:
			"Control what data is shared with other users on different pages (e.g., Corp Page vs. Cooperation Tool).",
		type: "info",
	},
	{
		title: "Data Sharing",
		description:
			'Toggle specific data types like "Site Data" or "Storage Data" for each context.',
		type: "action",
	},
	{
		title: "Site Data Permission",
		description: "Enables sharing Sites within selected page.",
		type: "info",
	},
	{
		title: "Storage Data Permission",
		description: "Enables sharing Storage within selected page.",
		type: "info",
	},
	{
		title: "Production Data Permission",
		description: "Enables sharing Production within selected page.",
		type: "info",
	},
	{
		title: "Ships Data Permission",
		description: "Enables sharing Ships within selected page.",
		type: "info",
	},
	{
		title: "Flights Data Permission",
		description: "Enables sharing Flights within selected page.",
		type: "info",
	},
];

export const PREFERENCE_DESCRIPTIONS: Record<string, string> = {
	site_data: "Enables sharing Sites data.",
	storage_data: "Enables sharing Storage data.",
	production_data: "Enables sharing active production lines and queues data.",
	ships_data: "Enables sharing your ship fleet composition and locations data.",
	flight_data:
		"Enables sharing active flight plans and current movements data.",
};

export const dataGroupsGuideSteps: GuideStep[] = [
	{
		title: "Collaborative Groups",
		description:
			"Create or join groups to share specific data with other trusted users.",
		type: "feature",
	},
	{
		title: "Group API Key",
		description:
			"A unique key for external tools that combines your personal access with group context.",
		type: "info",
	},
	{
		title: "Permissions",
		description:
			"Granularly control exactly which data points (e.g., Inventory, Production) you share with the group.",
		type: "action",
	},
];

export const apiTokensGuideSteps: GuideStep[] = [
	{
		title: "Personal Tokens",
		description:
			"Generate long-lived tokens for your own scripts or third-party tools.",
		type: "feature",
	},
	{
		title: "Scoped Access",
		description:
			'Assign specific permissions (e.g., "Ships & Fleets") to limit what a token can access.',
		type: "action",
	},
];

export const globalConfigurationGuideSteps: GuideStep[] = [
	{
		title: "Defaults",
		description: "Set your preferred Commodity Exchange (CX) and Currency.",
		type: "action",
	},
	{
		title: "Excluded Sites",
		description:
			"Select sites you want to completely ignore in PUNoted calculations & views.",
		type: "feature",
	},
	{
		title: "Leased Sites",
		description:
			"Manually track sites you lease from others or lease out, keeping them separate from your core assets. With ability to enable them in calculations and views (Corporation page, Cooperation page).",
		type: "feature",
	},
];
