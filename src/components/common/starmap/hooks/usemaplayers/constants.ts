import ShipIconAtlas from "../../../../../assets/ship_icons.png";
import starO from "../../../../../assets/stars/o_star.png";
import starB from "../../../../../assets/stars/b_star.png";
import starA from "../../../../../assets/stars/a_star.png";
import starF from "../../../../../assets/stars/f_star.png";
import starG from "../../../../../assets/stars/g_star.png";
import starK from "../../../../../assets/stars/k_star.png";
import starM from "../../../../../assets/stars/m_star.png";
import stationIC from "../../../../../assets/stations/ic_station.png";
import earth from "../../../../../assets/planets/earth_like/earth.png";
import vartu from "../../../../../assets/planets/earth_like/vartu.png";
import niceq from "../../../../../assets/planets/earth_like/niceq.png";
import arden from "../../../../../assets/planets/gas_like/arden.png";
import berst from "../../../../../assets/planets/gas_like/berst.png";
import aerst from "../../../../../assets/planets/gas_like/aerst.png";
import bluey from "../../../../../assets/planets/gas_like/bluey.png";
import ert from "../../../../../assets/planets/rocky_like/ert.png";
import bar from "../../../../../assets/planets/rocky_like/bar.png";
import ters from "../../../../../assets/planets/rocky_like/ters.png";
import lcb from "../../../../../assets/ships/lcb.png";
import wcb from "../../../../../assets/ships/wcb.png";
import vcb from "../../../../../assets/ships/vcb.png";
import hcb from "../../../../../assets/ships/hcb.png";

// --- ICON ATLAS MAPPING CONFIGURATIONS ---
export const STAR_ICONS = [
	{ type: "O", url: starO, size: 512 },
	{ type: "B", url: starB, size: 512 },
	{ type: "A", url: starA, size: 512 },
	{ type: "F", url: starF, size: 512 },
	{ type: "G", url: starG, size: 512 },
	{ type: "K", url: starK, size: 512 },
	{ type: "M", url: starM, size: 512 },
];
export const STATION_ICONS = [{ type: "IC", url: stationIC, size: 512 }];
export const SHIP_ICONS = [
	{ type: "LCB", url: lcb, size: 512 },
	{ type: "WCB", url: wcb, size: 512 },
	{ type: "VCB", url: vcb, size: 512 },
	{ type: "HCB", url: hcb, size: 512 },
	{ type: "cluster", url: ShipIconAtlas, size: 512 },
];
export const PLANET_ICONS = [
	{ type: "EARTH", url: earth, size: 256 },
	{ type: "VARTU", url: vartu, size: 256 },
	{ type: "NICEQ", url: niceq, size: 256 },
	{ type: "ARDEN", url: arden, size: 256 },
	{ type: "BERST", url: berst, size: 256 },
	{ type: "AERST", url: aerst, size: 256 },
	{ type: "BLUEY", url: bluey, size: 256 },
	{ type: "ERT", url: ert, size: 256 },
	{ type: "BAR", url: bar, size: 256 },
	{ type: "TERS", url: ters, size: 256 },
];

// --- STATIC ACCESSOR HELPERS (Referential Stability for DeckGL) ---
/** Returns 2D position tuple [x, y] for a planet. */
export const getPlanetPosition = (d: any) => [d.x, d.y];
/** Returns 2D position tuple [x, y] for a station. */
export const getStationPosition = (d: any) => [d.x, d.y];
/** Returns 2D position tuple [x, y] for a ship. */
export const getShipPosition = (d: any) => d.position;
/** Resolves actual ship model type identifier ("LCB" | "WCB" | "VCB" | "HCB") from ship metadata. */
export function resolveShipType(ship: any): "LCB" | "WCB" | "VCB" | "HCB" {
	if (!ship) return "LCB";

	const str = [
		ship.ship_type,
		ship.shiptype,
		ship.shipType,
		ship.type,
		ship.model,
		ship.blueprintnaturalid,
		ship.blueprint_natural_id,
		ship.blueprintNaturalId,
		ship.blueprint,
		ship.registration,
		ship.name,
	]
		.filter(Boolean)
		.join(" ")
		.toUpperCase();

	if (str.includes("HCB") || str.includes("HEAVY")) return "HCB";
	if (str.includes("VCB") || str.includes("VERY LARGE")) return "VCB";
	if (str.includes("WCB") || str.includes("WIDE") || str.includes("BFF") || str.includes("BFI")) return "WCB";
	if (str.includes("LCB") || str.includes("LST") || str.includes("FFI") || str.includes("FSE") || str.includes("LIGHT")) return "LCB";

	// Mass / Volume Fallback Heuristic
	const m = Number(ship.mass || ship.operatingemptymass || ship.operating_empty_mass || 0);
	if (m > 3000) return "HCB";
	if (m > 2000) return "VCB";
	if (m > 1400) return "WCB";

	return "LCB";
}

/** Resolves ship icon type identifier (or 'cluster' if grouped). */
export const getShipIconType = (d: any) => {
	if (d.isCluster) return "cluster";
	return resolveShipType(d);
};
/** Returns ship size pixel radius. */
export const getShipSize = (d: any) => (d.isCluster ? 40 : 33);
/** Default planet icon key. */
export const getPlanetIcon = () => "EARTH";
/** Default station icon key. */
export const getStationIcon = () => "IC";
/** Returns 2D position tuple [x, y] for a gateway. */
export const getGatewayPosition = (d: any) => [d.x, d.y];
/** Default gateway accent color. */
export const getGatewayColor = [180, 0, 255];
/** Formats count string for ship cluster badge. */
export const getClusterBadgeText = (d: any) => `${d.count}`;
/** Returns cluster badge anchor position. */
export const getClusterBadgePos = (d: any) => d.position;
/** Cluster badge text color. */
export const getClusterBadgeColor: [number, number, number, number] = [250, 250, 0, 255];
/** Cluster badge background color. */
export const getClusterBadgeBg: [number, number, number, number] = [15, 15, 15, 200];
/** Resolves ship display label. */
export const getShipLabelText = (d: any) => {
	if (d.isCluster) return `${d.name} (${d.count})`;
	return d.name || d.registration || d.display_name || d.id;
};
/** Returns ship label anchor position. */
export const getShipLabelPos = (d: any) => d.position;
/** Ship label text color. */
export const getShipLabelColor: [number, number, number, number] = [255, 100, 255, 255];
/** Ship label background color. */
export const getShipLabelBg: [number, number, number, number] = [0, 0, 0, 180];
/** Resolves system type icon key. */
export const getSystemIcon = (d: any) => d.systemtype;
/** Returns system 2D position tuple [x, y]. */
export const getSystemPos = (d: any) => [d.x, d.y];
/** Returns system label 2D position tuple [x, y]. */
export const getLabelPos = (d: any) => [d.x, d.y];
/** Returns system display label. */
export const getLabelText = (d: any) => d.label;
/** System label text color. */
export const getLabelColor = [255, 255, 255, 255];
/** System label background color. */
export const getLabelBgColor = [0, 0, 0, 160];
/** Returns path point array for flight path layers. */
export const getPathData = (d: any) => d.path;
/** Resolves flight path line color. */
export const getPathColor = (d: any) => d.color ?? [0, 229, 255, d.alpha ?? 60];
/** Connection line color between systems. */
export const getConnectionColor = [255, 255, 255, 10];
/** Gateway connection line color. */
export const getGatewayConnectionColor = [180, 0, 255, 100];
/** Returns start and end points for gateway connection path. */
export const getGatewayConnectionPath = (d: any) => [
	d.sourcePosition,
	d.targetPosition,
];

/** Converts raw meters or AU semimajoraxis values to clean AU (1 AU = 149,597,870,700 m). */
export function getSemimajorAxisAU(
	semimajoraxis: number | undefined | null,
): number {
	if (!semimajoraxis || semimajoraxis <= 0) return 0;
	if (semimajoraxis > 1000) {
		return semimajoraxis / 149597870700;
	}
	return semimajoraxis;
}
