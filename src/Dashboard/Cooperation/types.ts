// types.ts (Complete)

import type { Node } from "reactflow";

export interface RequiredFor {
	materialid: string;
	ticker: string;
}

export interface RecipeInputOutput {
	materialid: string;
	ticker: string;
	amount: number;
}

export interface InputRecipe {
	processid: string;
	id?: string;
	name: string;
	durationmillis?: number;
	duration?: number;
	madeIn: string;
	inputs: any[];
	outputs: any[];
}

export interface Material {
	materialid: string;
	ticker: string;
	category: string;
	weight: number;
	volume: number;
	resource: boolean;
	inputRecipes: InputRecipe[];
	requiredFor: RequiredFor[];
	production_building: string;
	inputMaterials: string[];
}

export interface InputStatus {
	[ticker: string]: {
		need: number;
		input: number;
		deficit: number;
	};
}

export interface RecipeSelectorProps {
	material: Material | undefined;
	selectedRecipe: any | null;
	onSelectRecipe: (recipe: any) => void;
}

export interface RecipePart {
	amount: number;
	ticker: string;
}

export interface MaterialMetrics {
	need: number;
	input: number;
	deficit: number;
}

export interface BuildingData {
	buildingid: string;
	ticker: string;
	name: string;
	description: string;
	build_materials: RecipeInputOutput[];
	power_input_w: number;
}

export type NodeType = "Starter" | "Normal" | "End";

export interface BaseDataOrder {
	id: string;
	material: string;
	amount: number;
	status: "queue" | "active" | "completed";
}

export interface BasePlatform {
	id: string;
	buildingTicker: string;
	amount: number;
	activeRecipes: string[];
}

export interface BaseInfrastructure {
	id: string;
	buildingTicker: string;
	amount: number;
}

export interface BasePlan {
	id: string;
	creatorUid: string;
	creatorName: string;
	permitLevel: 1 | 2 | 3;
	platforms: BasePlatform[];
	infrastructure: BaseInfrastructure[];
	orderQueue: BaseDataOrder[];
	createdAt: string;
}

export interface NodeBaseData {
	status: "actual" | "manual" | "uninitialized";
	permitLevel: 1 | 2 | 3;
	platforms: BasePlatform[];
	infrastructure: BaseInfrastructure[];
	orderQueue: BaseDataOrder[];
	plannedEdits?: BasePlan[];
}

export interface NodeAssignedUser {
	uid: string;
	username: string;
	displayName: string;
	isRegistered: boolean;
	baseData: NodeBaseData;
	activeNeeds?: Record<string, Record<string, boolean>>;
	experts?: Record<string, number>;
	activeCogc?: string | null;
	planetFactor?: number;
	faction?: string;
	usedPermits?: number;
	totalPermits?: number;
	planDefaultPricing?: "market" | "corp";
	globalMatPrices?: Record<string, "market" | "corp">;
	ioDisplayMode?: "profit" | "importExport";
}

// RESTORED: `speed` isolated from `total`
export interface EfficiencyBreakdown {
	workforce: number;
	expert: number;
	faction: number;
	cogc: number;
	planet: number;
	speed: number;
	total: number;
}

export interface EngineParams {
	activeData: any;
	activeBuildings: any[];
	activeWorkerNeeds: any;
	activeRecipes: any[];
	activeNeeds: Record<string, Record<string, boolean>>;
	experts: Record<string, number>;
	activeCogc: string | null;
	planetFactor: number;
	getPrice: (ticker: string) => number;
	faction?: string;
	usedPermits?: number;
	totalPermits?: number;
}

export interface ChainNodeData {
	supply: {};
	inputStatus: boolean;
	nodeId: string;
	nodeType?: NodeType;
	assignedUsers?: NodeAssignedUser[];
	materialTicker: string;
	description?: string;
	locked: boolean;
	isResource: boolean;
	isEndMaterial: boolean;
	recipe: InputRecipe;
	siteName: string;
	sector: SectorOption;
	system: SystemOption;
	planet: PlanetOption;
	productionRate: number;
	productionUnit: string;
	statusColor: string;
	netFlow: number;
	consumptionRatio: number;
	productionBuilding: string;
	userFlows: any[];
	userStorage: any[];
	transport?: {
		manualTons: number;
		manualVolume: number;
		userShips: any[];
	};
	position?: { x: number; y: number };
}

export interface ChainLinkData {
	source: string;
	sourceHandle: string;
	target: string;
	targetHandle: string;
}

export interface Chain {
	nodes?: ChainNodeData[] | undefined;
	links?: ChainLinkData[] | undefined;
}

export interface ConnectionToolContextProps {
	connectionMode: boolean;
	sourceNodeData: import("reactflow").Node<ChainNodeData> | null;
	materials: Material[];
	onEditNode: (nodeData: ChainNodeData) => void;
	onDeleteNode: (nodeData: ChainNodeData) => void;
	validationData: NodeValidationData;
	activeGroupId?: string | null;
	staticData?: StaticData | null;
}

export interface GroupMember {
	uid: string;
	username: string;
	displayName: string;
	role: GroupRole;
}

export type GroupRole = "owner" | "editor" | "viewer";

export interface GroupMemberOutput {
	uid: string;
	username: string;
	displayName: string;
	role: GroupRole;
}

export interface FullGroupData {
	id: string;
	name: string;
	ownerId: string;
	chain: Chain;
	isActive: boolean;
	members: GroupMemberOutput[];
	updated_at: string;
	created_at: string;
}

export interface Group {
	id: string;
	name: string;
	ownerId: string;
	ownerDisplayName?: string;
	chain: Chain;
	isActive: boolean;
	members: GroupMember[];
	updated_at: string;
	created_at: string;
	isPending?: boolean;
}

export interface NodeBaseModalProps {
	open: boolean;
	onClose: () => void;
	onSave: (nodeData: ChainNodeData) => void;
	materials: Material[];
	initialData: ChainNodeData | null;
	isEdit: boolean;
	groupMembers: GroupMember[];
	staticData: StaticData | null;
}

export interface GroupMembersListProps {
	members: GroupMember[];
	isOwner: boolean;
	ownerId: string;
	onRemoveMember: (uid: string) => void;
	onChangeRole: (memberUid: string, role: string) => void;
}

export interface SettingsManagerProps {
	activeGroup: Group;
	currentUserId: string;
	onGroupListUpdate: (groups: Group[]) => void;
	onGroupMemberUpdate: (updatedGroup: Group) => void;
	onGroupDelete: (groupId: string, userId: string) => Promise<void>;
	onGroupUpdate: (updatedGroup: Group) => void;
	isOwner: boolean;
}

export interface GroupManagerProps {
	groups: Group[];
	currentUserId: string;
	activeGroupId: string;
	onGroupSelect: (group: Group) => void;
	onGroupListUpdate: (groups: Group[]) => void;
	onGroupCreate: (name: string, userId: string) => Promise<Group>;
	onGroupDelete: (groupId: string, userId: string) => Promise<void>;
	onSaveCurrentGroup: () => Promise<void>;
	isSaving: boolean;
	onMinimize: () => void;
	canSave: boolean;
	remoteCursors: Map<string, RemoteCursor>;
}

export interface ProductionChainViewerProps {
	currentChain: Chain;
	onChainUpdate: (newChain: Chain) => void;
	materials: Material[];
	onEditNode: (nodeData: ChainNodeData) => void;
	onDeleteNode: (nodeData: ChainNodeData) => void;
	onAddNodeClick: () => void;
	onSendSyncMessage: (message: Omit<SyncMessage, "userId">) => void;
	canEdit: boolean;
	initialChain: Chain;
	remoteCursors: Map<string, any>;
	onRemoteNodeMove: any;
	lockedNode: any;
	userId: string;
	activeGroupId?: string | null;
	staticData: StaticData | null;
}

export interface NodeValidationData {
	sourceNodeId: string | null;
	validTargetNodeIds: Set<string>;
}

interface RemoteCursor {
	id: string;
	x: number;
	y: number;
	username: string;
}

export interface SectorOption {
	externalsectorid: string;
	name: string;
}

export interface SystemOption {
	systemid: string;
	name: string;
}

export interface PlanetOption {
	planetid: string;
	name: string;
	naturalid: string | null;
}

export interface ProductionChainViewerHandle {
	getNodes: () => Node<ChainNodeData>[];
	fitView: any;
}

export interface CursorMovePayload {
	x: number;
	y: number;
	viewportZoom: number;
	userDisplayName: string;
}

export interface NodeMovePayload {
	id: string;
	position: { x: number; y: number };
}

export interface NodeUpdatePayload {
	data: ChainNodeData;
}

export interface NodeRemovePayload {
	nodeId: string;
}

export interface SyncMessage {
	type:
		| "NODE_MOVE"
		| "NODE_UPDATE"
		| "NODE_ADD"
		| "NODE_REMOVE"
		| "EDGE_UPDATE"
		| "CURSOR_MOVE"
		| "USER_LEAVE"
		| "MEMBER_UPDATE"
		| "CHAIN_UPDATE"
		| "INITIAL_LOAD_REQUEST"
		| "FULL_CHAIN_STATE"
		| "GROUP_INVITE"
		| "GROUP_MEMBER_UPDATE"
		| "NODE_LOCKED"
		| "NODE_LOCK_DENIED"
		| "NODE_UNLOCK";
	userId: string;
	payload:
		| NodeMovePayload
		| NodeUpdatePayload
		| MemberSyncPayload
		| CursorMovePayload
		| NodeRemovePayload
		| any;
}

export interface MemberSyncPayload {
	uid: string;
	action: "REMOVE" | "ADD";
}

export interface UseGroupSyncProps {
	groupId: string | null;
	userId: string;
	currentChain: Chain | null;
	onChainUpdate: (newChain: Chain) => void;
	onRemoteNodeMove: (payload: NodeMovePayload) => void;
	onGroupInvite: (payload: any) => void;
	onGroupMemberUpdate: (payload: any) => void;
}

export interface GroupDataResponse {
	group: Group;
	chain: Chain;
}

export interface UserStorage {
	username: string;
	current: number;
	unit: string;
	overallStorage: [];
}

export interface BuildingRequirement {
	ticker: string;
	amount: number;
}

export interface BuildingData {
	id: string;
	ticker: string;
	name: string;
	type: "production" | "infrastructure";
	area: number;
	buildReq: BuildingRequirement[];
	workers?: Record<string, number>;
	supply?: Record<string, number>;
	storageCap?: number;
}

export interface PriceData {
	market: number;
	corp: number;
}

export interface StaticData {
	materials: Material[];
	buildings: BuildingData[];
	prices: Record<string, PriceData>;
	needs: Record<string, string[]>;
}
