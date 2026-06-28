import React, { createContext, useContext, useState, ReactNode } from "react";

export interface FilterState {
	temperatureRange: [number, number]; // Kelvin
	populationRange: [number, number]; // arbitrary units
	resources: Set<string>; // resource ids
	filterRadius: number; // parsecs, 0 = disabled
	originSystemId: string | null;
	planetType: "all" | "rocky" | "gaseous";
	fertileOnly: boolean;
	gravity: "all" | "low" | "high";
	temperature: "all" | "low" | "high";
	pressure: "all" | "low" | "high";
	cogcEnabled: boolean;
	cogcProgram: string;
	destinationSystemId: string | null;
}

interface FilterContextProps {
	filter: FilterState;
	setFilter: React.Dispatch<React.SetStateAction<FilterState>>;
}

const defaultFilter: FilterState = {
	temperatureRange: [-50, 500],
	populationRange: [0, 10000000],
	resources: new Set(),
	filterRadius: 0,
	originSystemId: null,
	planetType: "all",
	fertileOnly: false,
	gravity: "all",
	temperature: "all",
	pressure: "all",
	cogcEnabled: false,
	cogcProgram: "ALL",
	destinationSystemId: null,
};

const FilterContext = createContext<FilterContextProps | undefined>(undefined);

export const FilterProvider = ({ children }: { children: ReactNode }) => {
	const [filter, setFilter] = useState<FilterState>(defaultFilter);
	return (
		<FilterContext.Provider value={{ filter, setFilter }}>
			{children}
		</FilterContext.Provider>
	);
};

export const useFilter = (): FilterContextProps => {
	const ctx = useContext(FilterContext);
	if (!ctx) {
		throw new Error("useFilter must be used within a FilterProvider");
	}
	return ctx;
};
