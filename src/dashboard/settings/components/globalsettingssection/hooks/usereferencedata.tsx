import { useState, useEffect } from "react";
import type { BasicUser, CommodityExchange, UserSite } from "../../../types";
import { fetchClient } from "../../../../../utils/apiclient";

export const useReferenceData = (headers: any) => {
	const [exchanges, setExchanges] = useState<CommodityExchange[]>([]);
	const [sites, setSites] = useState<UserSite[]>([]);
	const [users, setUsers] = useState<BasicUser[]>([]);

	useEffect(() => {
		const fetchRefs = async () => {
			try {
				const [cxRes, siteRes, usersRes] = await Promise.all([
					fetchClient(`/internal/settings/refs/commodity-exchanges`),
					fetchClient(`/internal/settings/user/sites`),
					fetchClient(`/internal/users/list`),
				]);

				if (cxRes.ok) {
					const data = await cxRes.json();
					setExchanges(data);
				}
				if (siteRes.ok) {
					const data = await siteRes.json();
					setSites(data);
				}
				if (usersRes.ok) {
					const data = await usersRes.json();
					setUsers(data.data);
				}
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
