// apiClient.ts

import { API_BASE_URL } from "../config/api";

// Dedup in-flight GET requests: maps url → Promise<Response> that clones on each read
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

	const executeRequest = async (): Promise<Response> => {
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

		const response = await fetch(url, fetchOptions);

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
				localStorage.setItem("authToken", refreshData.token);
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

				return await fetchClient(endpoint, options, true);
			} catch (refreshError) {
				console.warn("Refresh failed, returning 401 to caller.");
				// ponytail: let callers handle 401; hard redirects cause loops
				return response;
			}
		}

		return response;
	};

	// Dedup: share one in-flight GET promise while pending
	if (isGet && !_isRetry) {
		const existing = activeGetRequests.get(url);
		if (existing) {
			return existing.then((r) => r.clone());
		}
		const promise = executeRequest().finally(() => {
			activeGetRequests.delete(url);
		});
		activeGetRequests.set(url, promise);
		return promise;
	}

	return executeRequest();
};
