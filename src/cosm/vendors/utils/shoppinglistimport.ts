import Papa from "papaparse";

export interface ImportedShoppingListItem {
	materialticker: string;
	quantity: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const parseQuantity = (value: unknown, material: string): number => {
	const quantity = Number(String(value).replaceAll(",", ""));
	if (!Number.isSafeInteger(quantity) || quantity <= 0) {
		throw new Error(`Invalid quantity for ${material}`);
	}
	return quantity;
};

const combineMaterials = (
	entries: Iterable<[string, unknown]>,
): ImportedShoppingListItem[] => {
	const materials = new Map<string, number>();
	for (const [rawMaterial, rawQuantity] of entries) {
		const materialticker = rawMaterial.trim().toUpperCase();
		if (!materialticker) throw new Error("No materials to import");
		const quantity = parseQuantity(rawQuantity, materialticker);
		const total = (materials.get(materialticker) || 0) + quantity;
		if (!Number.isSafeInteger(total)) {
			throw new Error(`Invalid quantity for ${materialticker}`);
		}
		materials.set(materialticker, total);
	}

	if (materials.size === 0) throw new Error("No materials to import");
	return [...materials].map(([materialticker, quantity]) => ({
		materialticker,
		quantity,
	}));
};

const parseJsonImport = (text: string): ImportedShoppingListItem[] => {
	let data: unknown;
	try {
		data = JSON.parse(text);
	} catch {
		throw new Error("Invalid JSON");
	}

	if (!isRecord(data) || !Array.isArray(data.groups)) {
		throw new Error("No materials to import");
	}

	const entries: [string, unknown][] = [];
	for (const group of data.groups) {
		if (!isRecord(group)) throw new Error("No materials to import");
		if (group.materials === undefined) continue;
		if (!isRecord(group.materials)) {
			throw new Error("No materials to import");
		}
		entries.push(...Object.entries(group.materials));
	}

	return combineMaterials(entries);
};

const parseCsvImport = (text: string): ImportedShoppingListItem[] => {
	const result = Papa.parse<string[]>(text, { skipEmptyLines: "greedy" });
	if (result.errors.length > 0) {
		throw new Error("Invalid CSV/TSV");
	}

	const [firstRow] = result.data;
	const hasHeaders =
		firstRow?.length === 2 &&
		firstRow[0].trim().toLowerCase() === "material" &&
		firstRow[1].trim().toLowerCase() === "quantity";
	const rows = hasHeaders ? result.data.slice(1) : result.data;

	return combineMaterials(
		rows.map((row) => {
			if (row.length !== 2) {
				throw new Error("One material+quantity per row");
			}
			return [row[0], row[1]];
		}),
	);
};

export const parseShoppingListImport = (
	input: string,
	validMaterialTickers: Set<string>,
): ImportedShoppingListItem[] => {
	const text = input.trim();
	if (!text) throw new Error("No materials to import");
	const materials =
		text.startsWith("{") || text.startsWith("[")
			? parseJsonImport(text)
			: parseCsvImport(text);
	const invalidMaterial = materials.find(
		({ materialticker }) => !validMaterialTickers.has(materialticker),
	);
	if (invalidMaterial) {
		throw new Error(`Invalid material: ${invalidMaterial.materialticker}`);
	}
	return materials;
};
