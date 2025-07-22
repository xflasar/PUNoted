// src/lib/api/fio.ts
import axios from 'axios';
import { FIO_API_BASE_URL } from '@/lib/constants';
import { FioMaterial, FioExchangeData, FioExchangeAllResponse, FioProductionResponse, FioStorageResponse, FioSite, FioWarehouse, FioProductionInputResponse, FioProductionOutputResponse, FioWorkforceResponse, BuildingCost, BuildingWorkforce, Building, RecipeOutput, RecipeInput } from '@/lib/types';


// For non-auth requests
export const fioApiClient = axios.create({
  baseURL: FIO_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// For auth requests
const createAuthenticatedApiClient = (apiKey: string) => {
  return axios.create({
    baseURL: FIO_API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `${apiKey}`, // auth token from FIO
    },
    timeout: 15000,
  });
};

// This is a simplified fetchWithCache.
async function fetchWithCache<T>(client: ReturnType<typeof createAuthenticatedApiClient>, endpoint: string, cacheKey: string): Promise<T> {
  // TODO: Implement caching
  console.log(`Fetching from endpoint: ${endpoint} (Cache key: ${cacheKey})`);
  const response = await client.get<T>(endpoint);
  return response.data;
}


/**
 * Fetches all material definitions (tickers, names, etc.) from /material/allmaterials.
 * Returns an object where keys are tickers for easy lookup.
 */
export async function fetchAllMaterials(): Promise<{ [ticker: string]: FioMaterial }> {
  try {
    const response = await fioApiClient.get('/material/allmaterials');
    // FIO's /material/allmaterials returns an array of materials
    const materialsArray: FioMaterial[] = response.data;

    // Transform array into an object for quicker lookup by ticker
    const materialsByTicker: { [ticker: string]: FioMaterial } = materialsArray.reduce((acc, material) => {
      if (material.Ticker) {
        acc[material.Ticker] = material;
      }
      return acc;
    }, {});

    return materialsByTicker;
  } catch (error) {
    console.error('Error fetching all materials from FIO:', error);
    throw new Error('Failed to fetch all material data from FIO API');
  }
}

/**
 * Fetches the market overview for all exchanges.
 * Corresponds to /exchange/all endpoint.
 */
export async function fetchAllMarketOverview(): Promise<FioExchangeAllResponse> {
  try {
    const response = await fioApiClient.get('/exchange/all');
    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Invalid response structure from /exchange/all');
    }
    return response.data; // Return the array directly
  } catch (error) {
    console.error('Error fetching all market overview from FIO using /exchange/all:', error);
    throw new Error('Failed to fetch all market overview data from FIO API via /exchange/all');
  }
}

/**
 * Fetches detailed exchange data for a specific material on a specific exchange.
 * @param ticker Material ticker (e.g., 'H2O')
 * @param exchangeCode Exchange code (e.g., 'IC1')
 */
export async function fetchExchangeData(ticker: string, exchangeCode: string): Promise<FioExchangeData> {
  try {
    const response = await fioApiClient.get(`/exchange/${ticker.toUpperCase()}.${exchangeCode.toUpperCase()}`);
    if (!response.data || !response.data.payload) {
      throw new Error(`Invalid response structure for ${ticker}.${exchangeCode}`);
    }
    return response.data.payload;
  } catch (error) {
    console.error(`Error fetching exchange data for ${ticker}.${exchangeCode} from FIO:`, error);
    throw new Error(`Failed to fetch exchange data for ${ticker}.${exchangeCode} from FIO API`);
  }
}

/**
 * Fetches all production data for a specific user across all their planets.
 * Corresponds to /production/{username} endpoint.
 * @param userName The username to fetch production data for.
 * @param apiKey The FIO API key.
 * @returns A promise that resolves with an array of FioPlanetProduction.
 */
export async function fetchUserProductionOverview(
  userName: string,
  apiKey: string
): Promise<FioProductionResponse> { // FioProductionResponse is FioPlanetProduction[]
  if (!apiKey) {
    throw new Error('FIO API Key is not set. Please go to Settings to configure it.');
  }

  const endpoint = `/production/${userName}`;
  const cacheKey = `fio_productionData_overview-${userName}`;

  const client = createAuthenticatedApiClient(apiKey);

  try {
    const data = await fetchWithCache<FioProductionResponse>(client, endpoint, cacheKey);
    if (!Array.isArray(data)) {
      throw new Error('Invalid response structure from FIO production overview API: Expected an array.');
    }
    return data;
  } catch (error) {
    console.error(`[FIO API] Error fetching production overview for ${userName}:`, error);
    throw error;
  }
}

/**
 * Fetches production data for a specific planet of a given user.
 * Corresponds to /production/{username}/{planet} endpoint.
 * @param userName The username to fetch production data for.
 * @param apiKey The FIO API key.
 * @param planetIdentifier The PlanetId, PlanetNaturalId, or PlanetName of the specific planet.
 * @returns A promise that resolves with an array of FioPlanetProduction (typically containing a single element for the specified planet).
 */
export async function fetchPlanetProductionDetails(
  userName: string,
  apiKey: string,
  planetIdentifier: string // This must be provided
): Promise<FioProductionResponse> { // FioProductionResponse is FioPlanetProduction[]
  if (!apiKey) {
    throw new Error('FIO API Key is not set. Please go to Settings to configure it.');
  }
  if (!planetIdentifier) {
    throw new Error('Planet identifier is required to fetch specific planet production details.');
  }

  const endpoint = `/production/${userName}/${planetIdentifier}`;
  const cacheKey = `fio_productionData_details-${userName}-${planetIdentifier}`;

  const client = createAuthenticatedApiClient(apiKey);

  try {
    const data = await fetchWithCache<FioProductionResponse>(client, endpoint, cacheKey);
    if (!Array.isArray(data)) {
      throw new Error('Invalid response structure from FIO planet production details API: Expected an array.');
    }
    return data;
  } catch (error) {
    console.error(`[FIO API] Error fetching production details for ${userName} on planet ${planetIdentifier}:`, error);
    throw error;
  }
}

/**
 * Fetches all storage units and their contents for a given username.
 * @param username The username to fetch storage data for.
 * @returns A promise that resolves to an array of FioStorageUnit.
 */
export async function fetchUserStorage(userName: string, apiKey: string): Promise<FioStorageResponse> {
  if (!apiKey) {
    throw new Error('FIO API Key is not set. Please go to Settings to configure it.');
  }

  const endpoint = `/storage/${userName}`;
  const cacheKey = `fio_storageData-${userName}`;
  const client = createAuthenticatedApiClient(apiKey);
  try {
    const response = await fetchWithCache<FioStorageResponse>(client, endpoint, cacheKey);
    if (!response) {
      throw new Error(`Invalid response structure for user storage: ${userName}`);
    }
    return response as FioStorageResponse;
  } catch (error) {
    console.error(`Error fetching storage data for ${userName} from FIO:`, error);
    throw new Error(`Failed to fetch storage data for ${userName}.`);
  }
}

// Add new API functions for sites and warehouses
export async function fetchUserSites(userName: string, apiKey: string): Promise<FioSite[]> {
  if (!apiKey) {
    throw new Error('FIO API Key is not set. Please go to Settings to configure it.');
  }

  const endpoint = `/sites/${userName}`;
  const cacheKey = `fio_storageData-${userName}-sites`;
  const client = createAuthenticatedApiClient(apiKey);
  try {
    const response = await fetchWithCache<FioSite[]>(client, endpoint, cacheKey);
    return response as FioSite[];
  } catch (error) {
    console.error(`Error fetching user sites for ${userName}:`, error);
    return [];
  }
}

export async function fetchUserWarehouses(userName: string, apiKey: string): Promise<FioWarehouse[]> {
  if (!apiKey) {
    throw new Error('FIO API Key is not set. Please go to Settings to configure it.');
  }

  const endpoint = `/sites/warehouses/${userName}`;
  const cacheKey = `fio_storageData-${userName}-werehouses`;
  const client = createAuthenticatedApiClient(apiKey);
  try {
    const response = await fetchWithCache<FioWarehouse[]>(client, endpoint, cacheKey);
    return response as FioWarehouse[];
  } catch (error) {
    console.error(`Error fetching user warehouses for ${userName}:`, error);
    return [];
  }
}

/**
 * Fetches user production input data.
 * Corresponds to /rain/userplanetproductioninput/{username} endpoint.
 * @param username The username to fetch data for.
 * @param apiKey The FIO API key.
 * @returns A promise that resolves with an array of ProductionInputOutputItem.
 */
export async function fetchUserProductionInputs(userName: string, apiKey: string): Promise<FioProductionInputResponse> {
  if (!apiKey) {
    throw new Error('FIO API Key is not set. Please go to Settings to configure it.');
  }

  const endpoint = `/rain/userplanetproductioninput/${userName}`;
  const cacheKey = `fio_dashboardData-${userName}-prodInput`;
  const client = createAuthenticatedApiClient(apiKey);
  try {
    const response = await fetchWithCache<FioProductionInputResponse>(client, endpoint, cacheKey);
    if (!Array.isArray(response)) {
      throw new Error('Invalid response structure for production inputs: Expected an array.');
    }
    return response as FioProductionInputResponse;
  } catch (error) {
    console.error(`Error fetching production inputs for ${userName}:`, error);
    return [];
  }
}

/**
 * Fetches user production output data.
 * Corresponds to /rain/userplanetproductionoutput/{username} endpoint.
 * @param username The username to fetch data for.
 * @param apiKey The FIO API key.
 * @returns A promise that resolves with an array of ProductionInputOutputItem.
 */
export async function fetchUserProductionOutputs(userName: string, apiKey: string): Promise<FioProductionOutputResponse> {
  if (!apiKey) {
    throw new Error('FIO API Key is not set. Please go to Settings to configure it.');
  }

  const endpoint = `/rain/userplanetproductionoutput/${userName}`;
  const cacheKey = `fio_dashboardData-${userName}-prodOutput`;
  const client = createAuthenticatedApiClient(apiKey);
  try {
    const response = await fetchWithCache<FioProductionInputResponse>(client, endpoint, cacheKey);
    if (!Array.isArray(response)) {
      throw new Error('Invalid response structure for production inputs: Expected an array.');
    }
    return response as FioProductionOutputResponse;
  } catch (error) {
    console.error(`Error fetching production outputs for ${userName}:`, error);
    return [];
  }
}

/**
 * Fetches user workforce data.
 * Corresponds to /workforce/{username} endpoint.
 * @param username The username to fetch data for.
 * @param apiKey The FIO API key.
 * @returns A promise that resolves with an array of Workforce.
 */
export async function fetchUserWorkforce(userName: string, apiKey: string): Promise<FioWorkforceResponse> {
  if (!apiKey) {
    throw new Error('FIO API Key is not set. Please go to Settings to configure it.');
  }

  const endpoint = `/workforce/${userName}`;
  const cacheKey = `fio_dashboardData-${userName}-prodOutput`;
  const client = createAuthenticatedApiClient(apiKey);
  try {
    const response = await fetchWithCache<FioWorkforceResponse>(client, endpoint, cacheKey);
    if (!Array.isArray(response)) {
      throw new Error('Invalid response structure for workforce data: Expected an array.');
    }
    return response as FioWorkforceResponse;
  } catch (error) {
    console.error(`Error fetching workforce data for ${userName}:`, error);
    return [];
  }
}

// --- New Static Game Data API Functions ---

/**
 * Fetches all recipe inputs data.
 * Endpoint: /rain/recipeinputs
 */
export async function fetchRecipeInputs(): Promise<RecipeInput[]> {
  try {
    const response = await fioApiClient.get('/rain/recipeinputs');
    if (!Array.isArray(response.data)) {
      throw new Error('Invalid response structure for recipe inputs: Expected an array.');
    }
    return response.data as RecipeInput[];
  } catch (error) {
    console.error('Error fetching recipe inputs:', error);
    return [];
  }
}

/**
 * Fetches all recipe outputs data.
 * Endpoint: /rain/recipeoutputs
 */
export async function fetchRecipeOutputs(): Promise<RecipeOutput[]> {
  try {
    const response = await fioApiClient.get('/rain/recipeoutputs');
    if (!Array.isArray(response.data)) {
      throw new Error('Invalid response structure for recipe outputs: Expected an array.');
    }
    return response.data as RecipeOutput[];
  } catch (error) {
    console.error('Error fetching recipe outputs:', error);
    return [];
  }
}

/**
 * Fetches all building data.
 * Endpoint: /rain/buildings
 */
export async function fetchBuildings(): Promise<Building[]> {
  try {
    const response = await fioApiClient.get('/rain/buildings');
    if (!Array.isArray(response.data)) {
      throw new Error('Invalid response structure for buildings: Expected an array.');
    }
    return response.data as Building[];
  } catch (error) {
    console.error('Error fetching buildings:', error);
    return [];
  }
}

/**
 * Fetches all building costs data.
 * Endpoint: /rain/buildingcosts
 */
export async function fetchBuildingCosts(): Promise<BuildingCost[]> {
  try {
    const response = await fioApiClient.get('/rain/buildingcosts');
    if (!Array.isArray(response.data)) {
      throw new Error('Invalid response structure for building costs: Expected an array.');
    }
    return response.data as BuildingCost[];
  } catch (error) {
    console.error('Error fetching building costs:', error);
    return [];
  }
}

/**
 * Fetches all building workforces data.
 * Endpoint: /rain/buildingworkforces
 */
export async function fetchBuildingWorkforces(): Promise<BuildingWorkforce[]> {
  try {
    const response = await fioApiClient.get('/rain/buildingworkforces');
    if (!Array.isArray(response.data)) {
      throw new Error('Invalid response structure for building workforces: Expected an array.');
    }
    return response.data as BuildingWorkforce[];
  } catch (error) {
    console.error('Error fetching building workforces:', error);
    return [];
  }
}