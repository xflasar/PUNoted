// apiClient.ts

import { API_BASE_URL } from "../config/api";

const activeGetRequests = new Map<string, Promise<Response>>();

export const fetchClient = async (
	endpoint: string,
	options: RequestInit = {},
	_isRetry = false,
): Promise<Response> => {
	const base = API_BASE_URL.replace(/\/+$/, "");
	const path = endpoint.replace(/^\/+/, "");
	const url = path.startsWith("http") ? path : `${base}/${path}`;

	const method = options.method?.toUpperCase() || "GET";
	const isGet = method === "GET";

	if (isGet && !_isRetry) {
		const existingPromise = activeGetRequests.get(url);
		if (existingPromise) {
			try {
				const res = await existingPromise;
				return res.clone();
			} catch (err) {
				// Fall through if the cached promise rejected
			}
		}
	}

	const executeRequest = async (): Promise<Response> => {
		// 1. Setup headers and inject current Access Token
		const headers = new Headers(options.headers || {});
		const token = localStorage.getItem("authToken");

		if (token && !headers.has("Authorization")) {
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
				const refreshResponse = await fetch(`${API_BASE_URL}auth/refresh`, {
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
				localStorage.setItem("hasSession", "true");
				if (refreshData.expires_at)
					localStorage.setItem("expiresAt", refreshData.expires_at.toString());
				if (refreshData.username)
					localStorage.setItem("username", refreshData.username);
				if (refreshData.displayName)
					localStorage.setItem("displayName", refreshData.displayName);
				if (refreshData.companyName)
					localStorage.setItem("companyName", refreshData.companyName || "");
				if (refreshData.companyCode)
					localStorage.setItem("companyCode", refreshData.companyCode || "");
				if (refreshData.currentUserId)
					localStorage.setItem(
						"currentUserId",
						refreshData.currentUserId.toString(),
					);
				if (refreshData.corpName)
					localStorage.setItem("corpName", refreshData.corpName || "");
				if (refreshData.isSynchronized !== undefined)
					localStorage.setItem(
						"isSynchronized",
						refreshData.isSynchronized.toString(),
					);

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

	if (isGet && !_isRetry) {
		const promise = executeRequest();
		activeGetRequests.set(url, promise);
		try {
			const res = await promise;
			return res.clone();
		} finally {
			activeGetRequests.delete(url);
		}
	}

	return executeRequest();
};
