export interface XitAction {
	type: string;
	[key: string]: any;
}

export interface XitGroup {
	type: string;
	name: string;
	materials?: Record<string, number>;
	[key: string]: any;
}

export interface XitPayload {
	actions: XitAction[];
	global: { name: string };
	groups: XitGroup[];
}

/**
 * Generates a generic XIT payload.
 */
export const generateXit = (
	name: string,
	actions: XitAction[],
	groups: XitGroup[],
): string => {
	const xit: XitPayload = {
		actions,
		global: { name },
		groups,
	};
	return JSON.stringify(xit);
};

export interface XitSupplyConfig {
	siteName: string;
	materials: Record<string, number>;
	includeTransport?: boolean;
	useCXInv?: boolean;
	cxOrigin?: string;
	exchange?: string;
	fleetMapping?: { fleetId: string; userShipReg: string }[];
}

/**
 * Generates a supply XIT payload with configuration options.
 */
export const generateSupplyXit = (config: XitSupplyConfig): string => {
	const {
		siteName,
		materials,
		includeTransport = true,
		useCXInv = true,
		cxOrigin = "Configure on Execution",
		exchange = "IC1",
		fleetMapping = [],
	} = config;

	const actions: XitAction[] = [
		{
			type: "CX Buy",
			name: "Supply Buy",
			group: "S1",
			origin: cxOrigin,
			exchange,
			priceLimits: {},
			buyPartial: false,
			useCXInv,
		},
	];

	if (includeTransport) {
		if (fleetMapping.length > 0) {
			fleetMapping.forEach((mapping) => {
				actions.push({
					type: "MTRA",
					name: "Transport",
					group: "S1",
					origin: cxOrigin,
					dest: mapping.userShipReg,
				});
			});
		} else {
			actions.push({
				type: "MTRA",
				name: "Transport",
				group: "S1",
				origin: cxOrigin,
				dest: "Configure on Execution",
			});
		}
	}

	return generateXit(`${siteName} Supply`, actions, [
		{ type: "Manual", name: "S1", materials },
	]);
};

export interface XitExportConfig {
	siteName: string;
	materials: Record<string, number>;
	shipReg?: string;
}

/**
 * Generates an Export / Transport XIT payload specifically for transferring cargo to a ship.
 */
export const generateExportXit = (config: XitExportConfig): string => {
	const { siteName, materials, shipReg = "Configure on Execution" } = config;

	const actions: XitAction[] = [
		{
			type: "MTRA",
			name: "Export Transport",
			group: "E1",
			origin: siteName,
			dest: shipReg,
		},
	];

	return generateXit(`${siteName} Export`, actions, [
		{ type: "Manual", name: "E1", materials },
	]);
};
