// types.ts (Complete)

import type {
    Node,
} from 'reactflow';

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
    reactorid: string;
    durationmillis: number;
    inputs: RecipeInputOutput[];
    outputs: RecipeInputOutput[];
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
    material: Material | undefined; // <--- This is the key fix for the error
    selectedRecipe: any | null;
    onSelectRecipe: (recipe: any) => void; // Adjust the function signature as needed
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

// --- Building Structures (NEW) ---

export interface BuildingData {
    buildingid: string;
    ticker: string;
    name: string;
    description: string;
    build_materials: RecipeInputOutput[];
    power_input_w: number;
}

export interface ChainNodeData {
	supply: {};
	inputStatus: boolean;
    nodeId: string;
    materialTicker: string;
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
    position?: { x: number; y: number };
}

export interface ChainLinkData {
    source: string,
	sourceHandle: string,
	target: string,
	targetHandle: string,
}

export interface Chain {
    nodes?: ChainNodeData[] | undefined;
    links?: ChainLinkData[] | undefined;
}

// --- NEW: Connection Tool Context Definition (FIX 2) ---
export interface ConnectionToolContextProps {
    connectionMode: boolean;
    sourceNodeData: import('reactflow').Node<ChainNodeData> | null;
    materials: Material[];
    onEditNode: (nodeData: ChainNodeData) => void;
    onDeleteNode: (nodeData: ChainNodeData) => void;
    validationData: NodeValidationData;
    activeGroupId?: string | null; // ✅ NEW: Required for fetching node live data
}

export interface GroupMember {
    uid: string;
    username: string;
    displayName: string;    // ud.displayname
    role: GroupRole;        // gm.role
}

export type GroupRole = 'owner' | 'editor' | 'viewer';

export interface GroupMemberOutput {
    uid: string;            // u.accountid
    username: string;       // u.username
    displayName: string;    // ud.displayname
    role: GroupRole;        // gm.role
}

// --- 3. Full Group Aggregated Data ---
export interface FullGroupData {
    id: string;             // pg.id
    name: string;           // pg.name
    ownerId: string;        // pg.owner_id
    chain: Chain;           // pg.chain_data (nested object)
    isActive: boolean;      // pg.is_active
    members: GroupMemberOutput[]; // Aggregated array of members
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
    isPending?: boolean; // ✅ NEW: Identifies if the group is a pending invitation
}

export interface NodeBaseModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (nodeData: ChainNodeData) => void; 
    materials: Material[];
    initialData: ChainNodeData | null;
    isEdit: boolean;
    groupMembers: GroupMember[];
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
    onSendSyncMessage: (message: Omit<SyncMessage, 'userId'>) => void;
    canEdit: boolean;
    initialChain: Chain;
    remoteCursors: Map<string, any>;
    onRemoteNodeMove: any;
    lockedNode: any;
    userId: string;
    activeGroupId?: string | null; // ✅ NEW
}

export interface NodeValidationData {
    sourceNodeId: string | null;
    validTargetNodeIds: Set<string>; // Use a Set for quick lookups
}

interface RemoteCursor {
    id: string; // userId
    x: number;
    y: number;
    username: string; // Or display name
    // Add color/avatar info here
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

// Define the type for a real-time cursor position
export interface CursorMovePayload {
    x: number;
    y: number;
    viewportZoom: number;
    userDisplayName: string;
}

// Define the structure of the messages sent over the WebSocket
export interface NodeMovePayload {
    id: string;
    position: { x: number; y: number };
}

export interface NodeUpdatePayload {
    //nodeId: string;
    data: ChainNodeData; // For full node data updates (edit/delete)
}

export interface NodeRemovePayload {
    nodeId: string;
}

export interface SyncMessage {
    type: 'NODE_MOVE' | 'NODE_UPDATE' | 'NODE_ADD' | 'NODE_REMOVE' | 'EDGE_UPDATE' | 'CURSOR_MOVE' | 'USER_LEAVE' | 'MEMBER_UPDATE' | 'CHAIN_UPDATE' | 'INITIAL_LOAD_REQUEST' | 'FULL_CHAIN_STATE' | 'GROUP_INVITE' | 'GROUP_MEMBER_UPDATE' | 'NODE_LOCKED' | 'NODE_LOCK_DENIED' | 'NODE_UNLOCK';
    userId: string; // The ID of the user who made the change
    payload: NodeMovePayload | NodeUpdatePayload | MemberSyncPayload | CursorMovePayload | NodeRemovePayload | any; 
}

// Define the type for a sync message related to group membership
export interface MemberSyncPayload {
    uid: string;
    action: 'REMOVE' | 'ADD';
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

// Response model matching the backend /full_sync endpoint
export interface GroupDataResponse {
    group: Group;
    chain: Chain;
}

export interface UserStorage {
    username: string;
    current: number;
    unit: string;
    overallStorage: []
}