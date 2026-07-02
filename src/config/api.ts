const getApiBaseUrl = (): string => {
	const envUrl = import.meta.env.VITE_API_BASE_URL;
	if (!envUrl) {
		throw new Error("VITE_API_BASE_URL not found in .env");
	}
	return envUrl.endsWith("/") ? envUrl : `${envUrl}/`;
};

export const API_BASE_URL = getApiBaseUrl();
