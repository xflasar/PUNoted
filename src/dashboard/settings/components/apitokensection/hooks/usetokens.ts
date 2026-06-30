import { useState, useCallback } from "react";
import { fetchClient } from "../../../../../utils/apiclient";
import type { ApiToken } from "../../../types";

export const useTokens = (
	initialTokens: ApiToken[],
	showSnackbar: (msg: string, type: any) => void,
) => {
	const [tokens, setTokens] = useState<ApiToken[]>(initialTokens);

	const saveToken = useCallback(
		async (
			form: { label: string; desc: string; perms: string[] },
			id: string | null,
		) => {
			const isEditing = !!id;
			const url = isEditing
				? `/internal/settings/tokens/${id}`
				: `/internal/settings/tokens`;
			const method = isEditing ? "PATCH" : "POST";

			try {
				const res = await fetchClient(url, {
					method,
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						label: form.label,
						description: form.desc,
						permissions: form.perms,
					}),
				});

				if (!res.ok) throw new Error("Request failed");

				if (isEditing) {
					setTokens((prev) =>
						prev.map((t) =>
							t.id === id
								? {
										...t,
										...form,
										description: form.desc,
										permissions: form.perms,
									}
								: t,
						),
					);
				} else {
					const newToken = await res.json();
					setTokens((prev) => [newToken, ...prev]);
				}
				showSnackbar("Token saved", "success");
				return true;
			} catch {
				showSnackbar("Failed to save token", "error");
				return false;
			}
		},
		[showSnackbar],
	);

	const deleteToken = useCallback(
		async (id: string) => {
			try {
				const res = await fetchClient(`/internal/settings/tokens/${id}`, {
					method: "DELETE",
				});
				if (res.ok) {
					setTokens((prev) => prev.filter((t) => t.id !== id));
					showSnackbar("Token revoked", "info");
				} else {
					throw new Error();
				}
			} catch {
				showSnackbar("Failed to revoke token", "error");
			}
		},
		[showSnackbar],
	);

	return { tokens, saveToken, deleteToken };
};
