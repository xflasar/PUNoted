// apiClient.ts

const isDev =
	process.env.NODE_ENV === "development" || (import.meta as any).env?.DEV;
export const baseURL = isDev
	? "http://localhost:9900"
	: "https://api.punoted.net";

export const fetchClient = async (
	endpoint: string,
	options: RequestInit = {},
	_isRetry = false,
): Promise<Response> => {
	const url = endpoint.startsWith("http") ? endpoint : `${baseURL}${endpoint}`;

	// 1. Setup headers and inject current Access Token
	const headers = new Headers(options.headers || {});
	const token = localStorage.getItem("authToken");

	if (token) {
		headers.set("Authorization", `Bearer ${token}`);
		headers.set("X-Data-Token", token);
	}
	if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
		headers.set("Content-Type", "application/json");
	}

	const fetchOptions: RequestInit = {
		...options,
		headers,
		credentials: options.credentials || "include",
	};

	// 2. Execute the initial request
	const response = await fetch(url, fetchOptions);

	// 3. Catch 401 Unauthorized for silent refresh
	if (response.status === 401 && !_isRetry) {
		console.log("Access token expired. Attempting silent refresh...");

		try {
			const refreshResponse = await fetch(`${baseURL}/auth/refresh`, {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
			});

			if (!refreshResponse.ok) {
				throw new Error("Refresh token expired or invalid");
			}

			const refreshData = await refreshResponse.json();
			const newAccessToken = refreshData.token;

			localStorage.setItem("authToken", newAccessToken);

			// 4. Retry the original request with the new token
			return await fetchClient(endpoint, options, true);
		} catch (refreshError) {
			console.warn("Refresh failed. Forcing logout.");
			localStorage.removeItem("authToken");
			window.location.href = "/";
			return Promise.reject(refreshError);
		}
	}

	return response;
};
