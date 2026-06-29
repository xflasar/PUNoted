import { useState, useEffect } from "react";
import type { CommodityExchange, UserSite } from "../../../types";
import { API_BASE } from "../../../constants";

export const useReferenceData = (headers: any) => {
	const [exchanges, setExchanges] = useState<CommodityExchange[]>([]);
	const [sites, setSites] = useState<UserSite[]>([]);
	const [users, setUsers] = useState<BasicUser[]>([]);

	useEffect(() => {
		const fetchRefs = async () => {
			try {
				const [cxRes, siteRes, usersRes] = await Promise.all([
					fetch(`${API_BASE}/settings/refs/commodity-exchanges`, { headers }),
					fetch(`${API_BASE}/settings/user/sites`, { headers }),
					fetch(`${API_BASE}/users/list`, { headers }),
				]);

				if (cxRes.ok) setExchanges(await cxRes.json());
				if (siteRes.ok) setSites(await siteRes.json());
				if (usersRes.ok) setUsers(await usersRes.json());
			} catch (e) {
				console.error("Failed to load reference data", e);
			}
		};
		fetchRefs();
	}, [headers]);

	const getSiteName = (id: string) => {
		const site = sites.find((s) => s.siteId === id);
		return site ? `${site.name} (${site.systemName})` : id;
	};

	return { exchanges, sites, users, getSiteName };
};
