// Automatically use the environment-based API URL
// In development (dev): http://localhost:9900
// In production (build): https://api.punoted.net

const getApiBaseUrl = (): string => {
	const envUrl = import.meta.env.VITE_API_BASE_URL;
	if (envUrl) {
		return envUrl.endsWith("/") ? envUrl : `${envUrl}/`;
	}
	return "http://localhost:9900/api";
};

export const API_BASE_URL = getApiBaseUrl();

export const PRODUCTION_API_URL = "https://api.punoted.net/";
