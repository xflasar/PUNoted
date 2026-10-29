import { useCallback, useEffect, useState } from "react";

type MaterialSearch = {
	searchQuery: string;
	exactMatch: boolean;
};

const STORAGE_KEY = "cosmMaterialSearch";
const EVENT_NAME = "cosmMaterialSearchChange";
const DEFAULT_SEARCH: MaterialSearch = { searchQuery: "", exactMatch: false };

const parseSearch = (value: string | null): MaterialSearch => {
	try {
		const parsed: unknown = value && JSON.parse(value);
		if (
			parsed &&
			typeof parsed === "object" &&
			"searchQuery" in parsed &&
			typeof parsed.searchQuery === "string" &&
			"exactMatch" in parsed &&
			typeof parsed.exactMatch === "boolean"
		) {
			return parsed as MaterialSearch;
		}
	} catch {
		// Ignore malformed persisted search state.
	}
	return DEFAULT_SEARCH;
};

const readSearch = () =>
	typeof window === "undefined"
		? DEFAULT_SEARCH
		: parseSearch(localStorage.getItem(STORAGE_KEY));

export const useMaterialSearch = () => {
	const [search, setSearch] = useState<MaterialSearch>(readSearch);

	useEffect(() => {
		const onSearchChange = (event: Event) =>
			setSearch((event as CustomEvent<MaterialSearch>).detail);

		window.addEventListener(EVENT_NAME, onSearchChange);
		return () => window.removeEventListener(EVENT_NAME, onSearchChange);
	}, []);

	const updateSearch = useCallback((next: MaterialSearch) => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
		setSearch(next);
		window.dispatchEvent(
			new CustomEvent<MaterialSearch>(EVENT_NAME, { detail: next }),
		);
	}, []);

	return {
		...search,
		setSearchQuery: (searchQuery: string) =>
			updateSearch({ ...search, searchQuery }),
		toggleExactMatch: () =>
			updateSearch({ ...search, exactMatch: !search.exactMatch }),
	};
};
