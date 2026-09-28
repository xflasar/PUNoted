export const CONSUMABLE_TICKERS = new Set([
	"DW",
	"RAT",
	"O",
	"COF",
	"PWO",
	"PT",
	"MED",
	"SF",
	"EXO",
	"HE3",
	"GAL",
	"AMM",
	"REP",
	"ALE",
	"GIN",
	"VG",
	"C",
]);

export const DEFAULT_CARGO_OPTIONS = [
	{ id: "custom", name: "Custom Capacity", volCap: 500, massCap: 500 },
	{
		id: "freighter_s",
		name: "Small Freighter (500 m³ / 500 t)",
		volCap: 500,
		massCap: 500,
	},
	{
		id: "freighter_m",
		name: "Medium Freighter (2,000 m³ / 2,000 t)",
		volCap: 2000,
		massCap: 2000,
	},
	{
		id: "freighter_l",
		name: "Large Heavy Transport (5,000 m³ / 5,000 t)",
		volCap: 5000,
		massCap: 5000,
	},
];
