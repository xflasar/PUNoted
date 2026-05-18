import type {
	NodeAssignedUser,
	StaticData,
} from "../../dashboard/cooperation/types";

/**
 * Properties required by the BaseManager component.
 */
export interface BaseManagerProps {
	/** The user whose base is being managed */
	user: NodeAssignedUser;
	/** Callback function to persist user updates */
	onUpdateUser: (updatedUser: NodeAssignedUser) => void;
	/** ID of the currently authenticated user */
	currentUserId: string;
	/** Whether the current user is the owner of the group */
	isGroupOwner: boolean;
	/** The name of the planet where the base is located */
	planetName?: string;
	/** Static game data containing buildings, recipes, prices, etc. */
	staticData: StaticData | null;
	/** If true, the component renders in a standalone view rather than a portal */
	standalone?: boolean;
}

/**
 * Breakdown of various efficiency multipliers affecting a production platform.
 */
export interface EfficiencyBreakdown {
	/** Efficiency derived from satisfied workforce needs (percentage) */
	workforce: number;
	/** Bonus from assigned experts (percentage) */
	expert: number;
	/** Bonus from faction alignment and HQ permits (percentage) */
	faction: number;
	/** Multiplier from current planetary COGC buffs (e.g., 1.25 for 25% bonus) */
	cogc: number;
	/** Multiplier from planet's resource extraction factors (percentage) */
	planet: number;
	/** Final combined efficiency multiplier applied to production speed (percentage) */
	total: number;
}

/**
 * Parameters used by the calculation engine to derive base metrics.
 */
export interface EngineParams {
	/** The current state of the player's base (platforms, infra, etc.) */
	activeData: any;
	/** Array of all available buildings in the game */
	activeBuildings: any[];
	/** Requirements and luxury preferences for each worker tier */
	activeWorkerNeeds: any;
	/** Array of all available production recipes */
	activeRecipes: any[];
	/** Map of currently satisfied worker luxuries */
	activeNeeds: Record<string, Record<string, boolean>>;
	/** Map of assigned experts by category */
	experts: Record<string, number>;
	/** Currently active COGC (Chamber of Global Commerce) program */
	activeCogc: string | null;
	/** The base planet resource factor (e.g., 100 for 100%) */
	planetFactor: number;
	/** Function to retrieve the configured price for a given material ticker */
	getPrice: (ticker: string) => number;
	/** The player's faction alignment */
	faction?: string;
	/** Number of HQ permits currently used */
	usedPermits?: number;
	/** Total number of HQ permits available to the player */
	totalPermits?: number;
}
