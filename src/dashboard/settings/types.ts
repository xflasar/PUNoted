// src/settings/types.ts
// --- Interfaces ---

export interface UserSettings {
	username: string;
	displayName: string;
	companyName?: string;
	companyCode?: string;
	isVerified: boolean;
	isSynchronized: boolean;
	fioApiKey?: string;
}

// NEW: Global Settings Structure
export interface GlobalSettings {
	default_cx_code: string;
	default_currency: string;
	internal_excluded_sites: string[]; // List of Site IDs
	internal_leased_sites: LeasedSite[]; // List of Objects
}

export interface LeasedSite {
	siteId: string;
	description: string; // e.g. "Leased to X"
}

// NEW: Reference Data Types
export interface CommodityExchange {
	code: string;
	name: string;
	currencyCode: string;
}

export interface UserSite {
	siteId: string;
	name: string; // e.g. "Promitor Low Orbit" or "UV-351a"
	systemName: string;
}

export interface ApiToken {
	id: string;
	label: string;
	description?: string;
	token_prefix: string;
	token?: string;
	permissions: string[];
	created_at: string;
	group_id?: string;
}

export interface WebPrivacySettings {
	[context: string]: {
		[key: string]: boolean;
	};
}

export interface GroupMember {
	user_id: string;
	username: string;
	status: "INVITED" | "ACCEPTED";
	can_read_data: boolean;
	granted_permissions: string[];
}

export interface Group {
	id: string;
	name: string;
	description?: string;
	owner_id: string;
	is_owner: boolean;
	my_status: "INVITED" | "ACCEPTED";
	members_count: number;
	owner_suffix?: string;
	my_full_token?: string;
}
