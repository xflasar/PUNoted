import { MarkerType, type Edge, type Node } from "reactflow";
import type { Chain, ChainNodeData, ChainLinkData, Material, ConnectionToolContextProps } from "./types";
import { COLOR_CONSTANTS, API_MATERIALS_KEY, LOCAL_STORAGE_USER_KEY, AGRICULTURE_TICKERS, ALLOY_TICKERS, CHEMICALS_TICKERS, CONSTRUCTION_MATERIALS_TICKERS, CONSTRUCTION_PARTS_TICKERS, CONSTRUCTION_PREFABS_TICKERS, CONSUMABLE_BASIC_TICKERS, CONSUMABLE_BUNDLES_TICKERS, CONSUMABLE_LUXURY_TICKERS, DRONES_TICKERS, ELECTRONIC_DEVICES_TICKERS, ELECTRONIC_PARTS_TICKERS, ELECTRONIC_PIECES_TICKERS, ELECTRONIC_SYSTEMS_TICKERS, ELEMENTS_TICKERS, ENERGY_SYSTEMS_TICKERS, FUELS_TICKERS, GASES_TICKERS, INFRASTRUCTURE_TICKERS, LIQUIDS_TICKERS, MEDICAL_EQUIPMENT_TICKERS, METALS_TICKERS, MINERALS_TICKERS, ORES_TICKERS, PLASTICS_TICKERS, SHIP_ENGINES_TICKERS, SHIP_KITS_TICKERS, SHIP_SHIELDS_TICKERS, SOFTWARE_COMPONENTS_TICKERS, SOFTWARE_SYSTEMS_TICKERS, SOFTWARE_TOOLS_TICKERS, TEXTILES_TICKERS, UNIT_PREFABS_TICKERS, UTILITY_TICKERS, SHIP_PARTS_TICKERS } from "./consts";
import React from 'react'; // <-- NEW: Import React for Context


// --- Debounce Utility (CRITICAL FIX for save logic) ---
export const debounce = (func: Function, delay: number) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: any) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func(...args);
        }, delay);
    };
};




const defaultContextValue: ConnectionToolContextProps = {
    connectionMode: false,
    sourceNodeData: null,
    materials: [],
    onEditNode: () => { },
    onDeleteNode: () => { },
    validationData: { sourceNodeId: null, validTargetNodeIds: new Set() },
    activeGroupId: null, // ✅ NEW
};

// --- NEW: Connection Validation Logic (Placeholder) ---
// This function needs to implement your actual game/app logic
export const validateConnection = (
    sourceNode: ChainNodeData,
    targetNode: ChainNodeData,
    materials: Material[]
): boolean => {
    if (sourceNode.nodeType === 'End') return false;
    if (targetNode.nodeType === 'Starter') return false;

    // The source node produces the material: sourceNode.materialTicker
    const producedMaterialTicker = sourceNode.materialTicker;
    
    // Find the Material object for the source's produced material
    const material = materials.find(m => m.ticker === producedMaterialTicker);
    if (!material) return false;

    // Check if the target node *requires* this material as an input.
    // The target node is an intermediary that needs an input to produce its own material:
    /* const isRequiredInput = material.inputRecipes.some(recipe => 
        // Does the target material's recipe take the source material as input?
        recipe.outputs.some(output => output.ticker === targetNode.materialTicker) &&
        recipe.inputs.some(input => input.ticker === sourceNode.materialTicker) 
    ); */
    
    // Simplistic check: If the source is a resource, it can connect to anything that uses it.
    // If the source produces material M, the target must consume M in one of its recipes.
    
    // A more robust check should iterate through the target node's material's inputRecipes
    const targetMaterial = materials.find(m => m.ticker === targetNode.materialTicker);
    if (!targetMaterial) return false;

    // A valid connection exists if the source material is required by ANY recipe 
    // that produces the target material.
    const isValid = targetMaterial.inputRecipes.some(recipe => 
        recipe.inputs.some(input => input.ticker === sourceNode.materialTicker)
    );

    return isValid;
};

export const ConnectionToolContext = React.createContext<ConnectionToolContextProps>(defaultContextValue);
// --- END Connection Tool Context Definition ---


/**
 * Generates a unique, URL-safe ID for a node.
 */
export const createNodeId = (materialTicker: string, siteName: string) => 
    `${materialTicker}_${siteName.replace(/[\s\W]+/g, '-')}`; 


// A shallow check for two simple objects (enough for checking your ChainNodeData keys)
export const shallowEqual = (objA: any, objB: any) => {
    if (objA === objB) return true;
    if (!objA || !objB || typeof objA !== 'object' || typeof objB !== 'object') return false;

    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);

    if (keysA.length !== keysB.length) return false;

    for (let i = 0; i < keysA.length; i++) {
        const key = keysA[i];
        if (objA[key] !== objB[key]) {
            // Special case for 'userFlows' or other nested arrays if necessary
            // For now, let's assume direct value comparison is enough for the top level.
            return false;
        }
    }
    return true;
};

export interface ProductionConsumptionResult {
  production: number;
  consumption: number;
  net: number;
}

export const calculateProductionAndConsumption = (
  nodeData: ChainNodeData
): ProductionConsumptionResult => {
  // Validate the input array
  if (!nodeData.userFlows || !Array.isArray(nodeData.userFlows)) {
    return { production: 0, consumption: 0 , net: 0};
  }

  // Accumulate totals for each flow type
  const { production, consumption } = nodeData.userFlows.reduce(
    (acc, flow) => {
      const rateValue = parseFloat(flow.rate || "0");
      if (isNaN(rateValue)) return acc;

      if (flow.type === "Produce") {
        acc.production += rateValue;
      } else if (flow.type === "Consume") {
        acc.consumption += rateValue;
      }

      return acc;
    },
    { production: 0, consumption: 0 }
  );

  return { production, consumption, net: production - consumption };
};


const buildTransshipmentEdges = (chain: Chain | null | undefined, materials: any[]) => {
  if (!chain?.links?.length) return [];

  return (
    chain.links
      .filter((link: { source: any; target: any; }) => !!link && link.source && link.target)
      .map((link: { source: any; target: any; sourceHandle: any; targetHandle: any; }) => {
        const { source, target, sourceHandle, targetHandle } = link;
        const ticker = sourceHandle?.split('-')[0];

        if (!ticker) {
          console.warn(`Invalid link sourceHandle format: ${sourceHandle}`);
          return null;
        }

        const color = getTickerColor(ticker);

        // Compute flow rate dynamically from the source node’s net flow
        const flowRate = getCalculatedFlowRate(source, ticker, chain.nodes!);

        // Lookup the material’s physical data (mass, volume, etc.)
        const material = materials?.find((m: { ticker: any; }) => m.ticker === ticker) || null;

        return {
          id: `${source}-${target}`,
          source,
          target,
          type: 'transshipment',
          sourceHandle,
          targetHandle,

          // Data passed to TransshipmentEdge
          // ✅ only include relevant data props
        data: {
          sourceHandle,
          targetHandle,
          flowRate,
          materialTicker: ticker,
          material,
        },

          markerEnd: {
            type: MarkerType.ArrowClosed,
            color,
            width: 20,
            height: 20,
          },

          style: {
            stroke: color,
            strokeWidth: 2,
          },
        };
      })
      .filter(Boolean)
  );
};

/**
 * Calculate the flow rate of a given material from a source node.
 * Flow rate is measured in units per second.
 */
export const getCalculatedFlowRate = (sourceId: string, ticker: string, nodes: ChainNodeData[]) => {
  const sourceNode = nodes.find((n) => n.nodeId === sourceId);
  if (!sourceNode) {
    console.warn(`Source node not found: ${sourceId}`);
    return 0;
}

  // Each node can produce multiple materials; check correct ticker
  const nodeTicker = sourceNode.materialTicker;
  const nodeFlow = sourceNode.netFlow ?? 0;

  return nodeTicker === ticker ? nodeFlow : 0;
};

/**
 * Transforms the custom Chain structure into ReactFlow nodes and edges.
 */
export const transformChainToRF = (chain: Chain | null | undefined, materials: Material[]): { rfNodes: Node<ChainNodeData>[], rfEdges: Edge<ChainLinkData>[] } => {
    
    // 1. Convert Chain.nodes to ReactFlow Nodes
    const rfNodes: Node<ChainNodeData>[] = (chain?.nodes ?? [])
    .filter(nodeData => !!nodeData)
    .map(nodeData => {
        if (!nodeData.position) {
            console.error("Node data is missing position property:", nodeData);
            return null;
        }

        return {
            id: nodeData.nodeId,
            type: 'minimalistNode', 
            position: nodeData.position,
            data: nodeData,
            draggable: !nodeData.locked,
            selectable: !nodeData.locked,
            deletable: !nodeData.locked,
            positionAbsolute: nodeData.position,
        } as Node<ChainNodeData>;
    })
    .filter((node): node is Node<ChainNodeData> => node !== null);

    // 2. Convert Chain.links to ReactFlow Edges
    const rfEdges = buildTransshipmentEdges(chain, materials) as unknown as Edge<ChainLinkData>[];

    return { rfNodes, rfEdges};
};

/**
 * Transforms ReactFlow nodes and edges back into the custom Chain structure.
 * This is used when the user moves/edits nodes in the viewer to update the source of truth.
 */
export const transformRFToChain = (
    rfNodes: Node<ChainNodeData>[],
    rfEdges: Edge<ChainLinkData>[]
): Chain => {
    
    // 1. Map React Flow Nodes back to ChainNodeData
    const nodes: ChainNodeData[] = rfNodes.map(rfNode => ({
        // Spread the original data payload, which is ChainNodeData
        ...rfNode.data, 
        // CRITICAL: Overwrite the position from the React Flow node object
        position: rfNode.position,
        // The rest of the data (materialTicker, siteName, etc.) remains the same
    }));
    
    // 2. Map React Flow Edges back to ChainLinkData
    const links: any[] = rfEdges.map(rfEdge => ({
        // The Edge's data payload contains ChainLinkData
        ...rfEdge, 
        // The data must contain the required fields: 
        // sourceMaterial, sourceSite, targetMaterial, targetSite, material
        // Assuming you ensure these fields are present when edges are created.
    }));
    
    // 3. Return the complete Chain object
    return { nodes, links };
};

// Function to map Ticker to a consistent color
export const getTickerColor = (ticker: string) => {
    if (AGRICULTURE_TICKERS.includes(ticker)) {
        return '#074306'; 
    } else if (ALLOY_TICKERS.includes(ticker)) {
        return '#8e5f31';
    } else if(CHEMICALS_TICKERS.includes(ticker)) {
        return '#cc4370';
    } else if(CONSTRUCTION_MATERIALS_TICKERS.includes(ticker)) {
        return '#2a6de5';
    } else if(CONSTRUCTION_PARTS_TICKERS.includes(ticker)) {
        return '#406482';
    } else if(CONSTRUCTION_PREFABS_TICKERS.includes(ticker)) {
        return '#132266';
    } else if(CONSUMABLE_BUNDLES_TICKERS.includes(ticker)) {
        return '#521e25';
    } else if(CONSUMABLE_BASIC_TICKERS.includes(ticker)) {
        return '#b63438';
    } else if(CONSUMABLE_LUXURY_TICKERS.includes(ticker)) {
        return '#720009';
    } else if(DRONES_TICKERS.includes(ticker)) {
        return '#9d4523';
    } else if(ELECTRONIC_DEVICES_TICKERS.includes(ticker)) {
        return '#62209f';
    } else if(ELECTRONIC_PARTS_TICKERS.includes(ticker)) {
        return '#7144cd';
    } else if(ELECTRONIC_PIECES_TICKERS.includes(ticker)) {
        return '#845fca';
    } else if(ELECTRONIC_SYSTEMS_TICKERS.includes(ticker)) {
        return '#482f61';
    } else if(ELEMENTS_TICKERS.includes(ticker)) {
        return '#524335';
    } else if(ENERGY_SYSTEMS_TICKERS.includes(ticker)) {
        return '#2b543d';
    } else if(FUELS_TICKERS.includes(ticker)) {
        return '#609830';
    } else if(GASES_TICKERS.includes(ticker)) {
        return '#157e80';
    } else if(INFRASTRUCTURE_TICKERS.includes(ticker)) {
        return '#0a0a0a';
    } else if(LIQUIDS_TICKERS.includes(ticker)) {
        return '#64a2d1';
    } else if(MEDICAL_EQUIPMENT_TICKERS.includes(ticker)) {
        return '#5fb45f';
    } else if(METALS_TICKERS.includes(ticker)) {
        return '#444444';
    } else if(MINERALS_TICKERS.includes(ticker)) {
        return '#a67e56';
    } else if(ORES_TICKERS.includes(ticker)) {
        return '#5e636d';
    } else if(PLASTICS_TICKERS.includes(ticker)) {
        return '#872d70';
    } else if(SHIP_ENGINES_TICKERS.includes(ticker)) {
        return '#9f2f06';
    } else if(SHIP_KITS_TICKERS.includes(ticker)) {
        return '#a5600c';
    } else if(SHIP_PARTS_TICKERS.includes(ticker)) {
        return '#a46e0b';
    } else if(SHIP_SHIELDS_TICKERS.includes(ticker)) {
        return '#c2770d';
    } else if(SOFTWARE_COMPONENTS_TICKERS.includes(ticker)) {
        return '#95863c';
    } else if(SOFTWARE_SYSTEMS_TICKERS.includes(ticker)) {
        return '#494212';
    } else if(SOFTWARE_TOOLS_TICKERS.includes(ticker)) {
        return '#866718';
    } else if(TEXTILES_TICKERS.includes(ticker)) {
        return '#5b632a';
    } else if(UNIT_PREFABS_TICKERS.includes(ticker)) {
        return '#272526';
    } else if(UTILITY_TICKERS.includes(ticker)) {
        return '#ab9e92';
    }
    else {
        return '#ffffff'
    }
    
};

/**
 * Fetches materials from the API and maps the new structure for client compatibility.
 */
export const fetchMaterials = async (retries = 3, delay = 1000): Promise<Material[]> => {
    // --- MOCK MATERIALS DATA ---
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
        {
            ticker: "MOCK",
            name: "Mock Material",
            category: "Production",
            resource: false,
            production_building: "Production",
            inputMaterials: [],
            inputRecipes: [
                { processid: "mock-recipe", inputs: [], outputs: [{ ticker: "MOCK", amount: 1 }] }
            ],
            requiredFor: []
        } as unknown as Material
    ];
    /*
    for (let i = 0; i < retries; i++) {
        try {
            // Note: Using a POST endpoint with an empty body as per your original file
            const response = await fetch("https://api.punoted.net/materials");
            if(response.ok) {
              const data = await response.json();
              
              return data.data.map((m: any) => {
                  const inputMaterials = new Set<string>();
                  m.inputRecipes.forEach((recipe: any) => {
                      recipe.inputs.forEach((input: any) => inputMaterials.add(input.ticker));
                  });

                  const production_building = m.resource 
                      ? 'Resource' 
                      : (m.category.length > 10 ? m.category.substring(0, 10) : m.category) || 'Production';

                  return {
                      ...m,
                      production_building: production_building,
                      inputMaterials: Array.from(inputMaterials),
                      ticker: m.ticker, 
                  } as Material;
              }) as Material[];
            } else {
              return [];
            }
        } catch (error) {
            if (i < retries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; 
            } else {
                return [];
            }
        }
    }
    return [];
    */
};

/**
 * Retrieves Material data from local storage.
 */
export const getStoredMaterials = (): Material[] | null => {
    try {
        const data = localStorage.getItem(API_MATERIALS_KEY);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        return null;
    }
};

/**
 * Saves Material data to local storage.
 */
export const setStoredMaterials = (materials: Material[]) => {
    try {
        localStorage.setItem(API_MATERIALS_KEY, JSON.stringify(materials));
    } catch (e) {
        console.error("Could not save materials to localStorage.", e);
    }
};


// --- Storage and User Management ---

export const getOrCreateUserId = () => { 
    let userId = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (!userId) {
        userId = 'user-' + Math.random().toString(36).substring(2, 10);
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, userId);
    }
    return userId;
};

/* export const loadGroupsFromStorage = (): Group[] => { 
    try {
        const data = localStorage.getItem(LOCAL_STORAGE_GROUPS_KEY);
        const groups: Group[] = data ? JSON.parse(data) : [];
        const currentUserId = getOrCreateUserId();
        
        // MOCK: Ensure the current user is in the active group's members for testing
        const mockGroups = groups.map((group: Group) => {
            if (group.isActive && group.members && !group.members.some(m => m.uid === currentUserId)) {
                return {
                    ...group,
                    members: [...group.members, { uid: currentUserId, username: 'User-You (Current)' }]
                };
            }
            return group;
        });
        return mockGroups;
    } catch (e) {
        console.error("Failed to load groups from storage:", e);
        return [];
    }
}; */

/* export const saveGroupsToStorage = (groups: Group[]) => { 
    try {
        localStorage.setItem(LOCAL_STORAGE_GROUPS_KEY, JSON.stringify(groups));
    } catch (e) {
        console.error("Could not save groups to localStorage.", e);
    }
}; */


// --- Mock Data Utilities (For Modals/Placeholders) ---

const createMockUserOtherStorage = (materialTicker: string, _unit: string, username: string) => {
    let others: any[] = [];
    if (username === 'User-Alpha') {
        others = [
            { materialTicker: 'PLAS', current: 10, capacity: 50, unit: 't' },
            { materialTicker: 'WTR', current: 150, capacity: 300, unit: 't' },
        ];
    } else if (username === 'User-Beta') {
        others = [
            { materialTicker: 'H2O', current: 20, capacity: 100, unit: 't' },
            { materialTicker: 'FEO', current: 500, capacity: 1000, unit: 't' },
        ];
    }
    return others.filter(item => item.materialTicker !== materialTicker); 
};


export const createMockUserStorage = (materialTicker: string, unit: string) => ([
    { username: 'User-Alpha', current: materialTicker === 'FE' ? 120 : 50, capacity: 200, unit, overallStorage: createMockUserOtherStorage(materialTicker, unit, 'User-Alpha') },
    { username: 'User-Beta', current: materialTicker === 'FE' ? 80 : 10, capacity: 100, unit, overallStorage: createMockUserOtherStorage(materialTicker, unit, 'User-Beta') },
    { username: 'User-Gamma', current: 0, capacity: 50, unit, overallStorage: createMockUserOtherStorage(materialTicker, unit, 'User-Gamma') },
    { username: 'User-Delta', current: 15, capacity: 150, unit, overallStorage: createMockUserOtherStorage(materialTicker, unit, 'User-Delta') },
]);

/**
 * Generates an initial chain structure populated with nodes derived from the full material list.
 */
/* export const generateInitialChainFromMaterials = (apiMaterials: Material[]): Chain => {
    const newChain: Chain = {
        nodes: [],
        links: [],
    };
    const nodeSet = new Set<string>();
    const linkSet = new Set<string>();

    apiMaterials.forEach((m, index) => {
        const materialTicker = m.ticker;
        const siteName = m.resource ? 'Source-Site' : 'Production-Hub';
        const nodeId = createNodeId(materialTicker, siteName);

        if (!nodeSet.has(nodeId)) {
            const productionBuilding = m.production_building; 

            const newNode: ChainNodeData = {
                materialTicker: materialTicker,
                siteName: siteName,
                productionRate: 0.0, 
                productionUnit: 'k/h',
                statusColor: COLOR_CONSTANTS.GREY_TEXT,
                netFlow: 0.0,
                globalBalance: 0.0,
                productionBuilding: productionBuilding, 
                userFlows: [], 
                userStorage: [], 
                position: { 
                    x: (index % 4) * 350 + 50, 
                    y: Math.floor(index / 4) * 300 + 50 
                }, 
            };
            newChain!.nodes!.push(newNode);
            nodeSet.add(nodeId);
        }

        // Map recipes to links (edges)
        m.inputRecipes.forEach(recipe => {
            const targetMaterial = m.ticker; 
            const targetSite = siteName;
            
            recipe.inputs.forEach(input => {
                const sourceMaterial = input.ticker;
                const sourceMaterialInfo = apiMaterials.find(am => am.ticker === sourceMaterial);
                const sourceSite = sourceMaterialInfo?.resource ? 'Source-Site' : 'Production-Hub';

                const linkId = `${sourceMaterial}_${sourceSite}_${targetMaterial}_${targetSite}`;
                
                if (!linkSet.has(linkId)) {
                    newChain!.links!.push({
                        sourceMaterial: sourceMaterial,
                        sourceSite: sourceSite,
                        targetMaterial: targetMaterial,
                        targetSite: targetSite,
                        material: sourceMaterial, 
                    });
                    linkSet.add(linkId);
                }
            });
        });
    });

    return newChain;
}; */

export { COLOR_CONSTANTS };
