import { useState, useEffect, useCallback, useRef } from 'react';
import type { 
    UseGroupSyncProps, 
    SyncMessage, 
    Chain, 
    CursorMovePayload, 
    NodeMovePayload,
    NodeUpdatePayload,
    GroupDataResponse,
    NodeRemovePayload,
} from '../types'; 

interface RemoteCursor {
    id: string; 
    x: number;
    y: number;
    username: string; 
}

interface LockedNodeState {
    nodeId: string;
    userId: string;
}

const STALE_CURSOR_TIMEOUT = 5000; 

export const useGroupSync = ({ 
    groupId, 
    userId, 
    currentChain, 
    onChainUpdate,
    onGroupInvite,
    onRemoteNodeMove,
    onGroupMemberUpdate
}: UseGroupSyncProps) => {
    
    // --- WebSocket State ---
    const wsRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    
    // --- Cursor Sync State ---
    const [remoteCursors, setRemoteCursors] = useState<Map<string, RemoteCursor>>(new Map());
    const cursorTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
    const [lockedNode, setLockedNode] = useState<LockedNodeState[] | null>(null);
    const [reconnectAttemptCount, setReconnectAttemptCount] = useState(0);
    const [hasEverBeenConnected, setHasEverBeenConnected] = useState(false);

    // --- Chain State Management (Ref to avoid stale closures in message handlers) ---
    const currentChainRef = useRef(currentChain);
    useEffect(() => {
        currentChainRef.current = currentChain;
    }, [currentChain]);
    
    const applyNodeMove = useCallback((payload: NodeMovePayload) => {
        const latestChain = currentChainRef.current;

        const payload_data = payload

        if (!payload_data['position']) return

        const updatedNodes = latestChain!.nodes!.map((n) => {
            const fullId = n.nodeId;
            if (fullId === payload_data.id) {
                return {
                    ...n,
                    position: payload_data.position,
                };
            }
            return n;
        });

        onChainUpdate({ ...latestChain, nodes: updatedNodes });
    }, [onChainUpdate]);

    const applyNodeRemove = useCallback((payload: NodeRemovePayload) => {
        const latestChain = currentChainRef.current;
        if(!latestChain) return;

        const nodeId = payload['nodeId']

        const updatedChainNodes = latestChain.nodes?.filter((n) => {
            if(n.nodeId !== nodeId) return n
        })

        onChainUpdate({...latestChain, nodes: updatedChainNodes});
    }, [onChainUpdate])
    
const applyNodeUpdate = useCallback((payload: NodeUpdatePayload, type: string) => {
    const latestChain = currentChainRef.current;
    if (!latestChain) return;

    const node = type === 'NODE_UPDATE' 
        ? (payload as Record<string, any>)['node'] 
        : (payload as Record<string, any>)['data'];

    if (!node || !node.materialTicker || !node.siteName) {
        console.error("Invalid node payload:", node);
        return;
    }

    const nodeId = node.nodeId;

    const existingIndex = latestChain.nodes!.findIndex((n) =>
        n.nodeId === nodeId
    );

    let newNodes;
    if (existingIndex > -1) {
        newNodes = [...latestChain.nodes!];
        newNodes[existingIndex] = node;
    } else {
        newNodes = [...latestChain.nodes!, node];
    }

    const newChain: Chain = {
        ...latestChain,
        nodes: newNodes,
    };

    onChainUpdate(newChain);

}, [onChainUpdate]);

const applyEdgeUpdate = useCallback((payload: any) => {
    const latestChain = currentChainRef.current;
    if (!latestChain) return;

    const safeCurrentLinks = latestChain.links ?? [];
    console.log(safeCurrentLinks)
    console.log(payload)
    
    let newLinks = safeCurrentLinks;
    
    if (payload['type'] === 'add') {
        newLinks = [...safeCurrentLinks, payload['item']]
    } else if (payload['type'] === 'remove') {
        newLinks = safeCurrentLinks.filter(link => `${link.source}-${link.target}` !== payload['id'])
    }

    const newChain: Chain = {
        ...latestChain,
        links: newLinks,
    };

    onChainUpdate(newChain)
}, [onChainUpdate])


    // --- Exposed Send Function (Stable) ---
    const sendMessage = useCallback((message: Omit<SyncMessage, 'userId'>) => {
        const ws = wsRef.current;
        if (ws && ws.readyState === WebSocket.OPEN) {
            const fullMessage: SyncMessage = { ...message, userId };
            ws.send(JSON.stringify(fullMessage));
        } else {
            const stateName = ws ? (ws.readyState === 0 ? 'CONNECTING' : ws.readyState === 2 ? 'CLOSING' : ws.readyState === 3 ? 'CLOSED' : 'UNKNOWN') : 'NULL';
            console.warn(`WS: Message not sent (State: ${stateName}). Waiting for connection.`);
        }
    }, [userId]);

    // 🔑 NEW FUNCTION: Public handler to force a reconnection attempt
    const reconnect = useCallback(() => {
        // Only trigger if we are currently disconnected
        if (!isConnected) {
            setReconnectAttemptCount(prev => prev + 1);
            setIsConnected(false)
            setHasEverBeenConnected(true)
            console.log("WS: Reconnect attempt triggered.");
        }
    }, [isConnected]);


    // --- WebSocket Setup Effect ---
    useEffect(() => {
        setIsConnected(false);
        if(reconnectAttemptCount === 0)
        setHasEverBeenConnected(false);
        if (!groupId) {
            if (wsRef.current) wsRef.current.close();
            return;
        }

        // 2. Close any existing connection before attempting a new one.
        if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
            wsRef.current.close();
        }

        const authToken = localStorage.getItem('authToken');
        const wsUrl = `ww/${groupId}/${userId}?token=${authToken}`; 
        const newWs = new WebSocket(wsUrl);

        wsRef.current = newWs; 

        
        newWs.onopen = () => {
            console.log("WS: Connected successfully.");
            setIsConnected(true);
            setHasEverBeenConnected(true);
            const initialLoadMessage: Omit<SyncMessage, 'userId'> = {
                type: 'INITIAL_LOAD_REQUEST',
                payload: {
                    groupId: groupId
                }
            };
            newWs.send(JSON.stringify({ ...initialLoadMessage, userId }));
        };
        
        const handleMessage = (event: MessageEvent) => {
            try {
                const message: SyncMessage = JSON.parse(event.data);
                
                if (message.userId === userId) return;

                switch (message.type) {
                    case 'INITIAL_LOAD_REQUEST': {
                        const payload = message.payload as GroupDataResponse;
                        onChainUpdate(payload.chain); 
                        break;
                    }
                    case 'FULL_CHAIN_STATE':
                        { const fullChain = message.payload as Chain;
                        onChainUpdate(fullChain);
                        break }
                    case 'CHAIN_UPDATE': {
                        onChainUpdate(message.payload as Chain); 
                        break;
                    }
                    case 'NODE_MOVE': {
                        const payload = message.payload as NodeMovePayload;
                        onRemoteNodeMove(payload);
                        applyNodeMove(payload);
                        break;
                    }
                    case 'NODE_UPDATE': {
                        const payload = message.payload;
                        applyNodeUpdate(payload, 'NODE_UPDATE');
                        break;
                    }
                    case 'NODE_REMOVE': {
                        const payload = message.payload as NodeRemovePayload;
                        applyNodeRemove(payload);
                        break;
                    }
                    case 'NODE_ADD': {
                        const payload = message.payload as NodeUpdatePayload;
                        applyNodeUpdate(payload, 'NODE_ADD');
                        break;
                    }
                    case 'EDGE_UPDATE': {
                        const payload = message.payload as unknown;
                        applyEdgeUpdate(payload)
                        break;
                    }
                    case 'GROUP_MEMBER_UPDATE': {
                        const payload = message.payload
                        onGroupMemberUpdate(payload)
                        break; 
                    }
                    case "NODE_LOCKED": {
                        const { nodeId, userId } = message.payload;

                        setLockedNode(prevLockedNodes => {
                            const newLock: LockedNodeState = { nodeId, userId };

                            if (!prevLockedNodes) {
                                return [newLock];
                            }

                            if (prevLockedNodes.some(lock => lock.nodeId === nodeId)) {
                                return prevLockedNodes;
                            }


                            return [...prevLockedNodes, newLock];
                        });
                        console.log(`Node ${nodeId} locked by ${userId}.`);
                        break;
                    }

                    case "NODE_LOCK_DENIED": {
                        console.warn(`Lock for ${message.payload.nodeId} denied by server. Currently held by user ${message.payload.lockedByUserId}.                    `);
                        break;
                    }

                    case "NODE_UNLOCK": {
                        const { nodeId } = message.payload;

                        setLockedNode(prevLockedNodes => {
                            if (!prevLockedNodes) {
                                return null;
                            }

                            const filteredNodes = prevLockedNodes.filter(lock => lock.nodeId !== nodeId);

                            return filteredNodes.length > 0 ? filteredNodes : null;
                        });
                        console.log(`Node ${nodeId} unlocked.`);
                        break;
                    }
                    case 'CURSOR_MOVE': {
                        const payload = message.payload as CursorMovePayload;
                        
                        setRemoteCursors(prevMap => {
                            const newMap = new Map(prevMap);
                            newMap.set(message.userId, { 
                                id: message.userId, 
                                x: payload.x, 
                                y: payload.y, 
                                username: payload.userDisplayName
                            });
                            return newMap;
                        });
                        
                        const existingTimeout = cursorTimeoutsRef.current.get(message.userId);
                        if (existingTimeout) {
                            clearTimeout(existingTimeout);
                        }

                        const newTimeout = setTimeout(() => {
                            setRemoteCursors(prevMap => {
                                const nextMap = new Map(prevMap);
                                nextMap.delete(message.userId);
                                return nextMap;
                            });
                            cursorTimeoutsRef.current.delete(message.userId);
                        }, STALE_CURSOR_TIMEOUT);

                        cursorTimeoutsRef.current.set(message.userId, newTimeout);
                        break;
                    }
                    case 'GROUP_INVITE': {
                        const newGroup = message.payload.group
                        onGroupInvite(newGroup);
                        break;
                    }
                    case 'USER_LEAVE': {
                        setRemoteCursors(prevMap => {
                            const newMap = new Map(prevMap);
                            newMap.delete(message.userId);
                            return newMap;
                        });
                        
                        const existingTimeout = cursorTimeoutsRef.current.get(message.userId);
                        if (existingTimeout) {
                            clearTimeout(existingTimeout);
                            cursorTimeoutsRef.current.delete(message.userId);
                        }
                        console.log(`User ${message.userId} disconnected.`);
                        break;
                    }
                    
                    default:
                        console.warn("Unknown sync message type:", message.type);
                }
            } catch (e) {
                console.error("Error parsing or handling sync message:", e);
            }
        };

        newWs.onmessage = handleMessage;
        newWs.onclose = (_event) => {
            console.log("WS: Closed.");
            setIsConnected(false);
        };
        newWs.onerror = (error) => {
            console.error("WS: Error:", error);
            setIsConnected(false);
            setHasEverBeenConnected(true)
        };

        // Cleanup function
        return () => {
            if (newWs.readyState === WebSocket.OPEN) {
                newWs.close();
            }
            wsRef.current = null;
            cursorTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
            cursorTimeoutsRef.current.clear();
        };

    }, [groupId, userId, onChainUpdate, applyNodeMove, applyNodeUpdate, onGroupInvite, onGroupMemberUpdate, reconnectAttemptCount]);

    
    // --- Final Return ---
    return {
        isConnected,
        sendSyncMessage: sendMessage,
        remoteCursors,
        lockedNode,
        setLockedNode,
        reconnect,
        hasEverBeenConnected
    };
};