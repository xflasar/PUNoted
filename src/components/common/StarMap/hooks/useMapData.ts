import { useState, useEffect } from "react";
import { API_BASE_URL } from "../../../../config/api";
import type {
	MapPoint,
	Sector,
	PlanetData,
	StationData,
	GatewayData,
} from "../types/mapTypes";
import { assignEmpireColors } from "../utils/colors";
import {
	resolveInitialOverlapsAsync,
	buildSystemConnections,
} from "../utils/grid";
import {
	pointInPolygon,
	convexHull,
	densifyPolygon,
	chaikinSmooth,
	calculateCentroid,
} from "../utils/geometry";
import type { XY } from "../types/mapTypes";
import { BASE_PLANET_SIZE } from "../constants/map";

export const useMapData = (mapDataFromContext: any = null) => {
	const [isLoading, setIsLoading] = useState(true);
	const [fetchError, setFetchError] = useState<string | null>(null);
	const [systemsPoints, setSystemsPoints] = useState<MapPoint[]>([]);
	const [sectors, setSectors] = useState<Sector[]>([]);
	const [empireLegend, setEmpireLegend] = useState<Record<string, string>>({});

	// Connections
	const [systemConnections, setSystemConnections] = useState<
		{ sourcePosition: number[]; targetPosition: number[] }[]
	>([]);
	const [gatewayConnections, setGatewayConnections] = useState<
		{ sourcePosition: number[]; targetPosition: number[]; type: string }[]
	>([]);

	// Object Data
	const [allPlanetsData, setAllPlanetsData] = useState<
		Record<string, PlanetData[]>
	>({});
	const [allStationsData, setAllStationsData] = useState<
		Record<string, StationData[]>
	>({});
	const [allGatewaysData, setAllGatewaysData] = useState<
		Record<string, GatewayData[]>
	>({});

	const [maxSystemPopulation, setMaxSystemPopulation] = useState<number>(0);
	const [contentBounds, setContentBounds] = useState<{
		minX: number;
		minY: number;
		maxX: number;
		maxY: number;
	} | null>(null);

	useEffect(() => {
		let mounted = true;
		const fetchData = async () => {
			setIsLoading(true);
			setFetchError(null);
			try {
				// Use data from context if available, otherwise fetch from API
				let data: any;
				if (mapDataFromContext) {
					data = mapDataFromContext;
				} else {
					const res = await fetch(`${API_BASE_URL}dashboard_map`);
					if (!res.ok) throw new Error(`status ${res.status}`);
					const json = await res.json();
					data = json.data;
				}

				// 1. Process Systems (Base Map)
				const systemPointsMap = new Map<string, MapPoint>();
				for (const s of data.systems || []) {
					const key =
						s.systemid != null
							? String(s.systemid)
							: `${s.positionx}:${s.positiony}`;
					systemPointsMap.set(key, {
						id: `sys-${key}`,
						label: s.name ?? `System ${key}`,
						type: "system",
						systemtype: s.systemtype,
						x: s.positionx * 3,
						y: -s.positiony * 3,
						color: "#95a5a6",
						outlineColor: "#ffffff",
						population: 0,
						isCX: /(^|\s)CX(\s|$)/i.test(s.name ?? ""),
						radiusHint: 5,
						originalSystemId: s.systemid != null ? String(s.systemid) : null,
						microasteroidCount: s.microasteroidcount,
						masssol: s.masssol,
						mass: s.mass,
						popBreakdown: null,
					});
				}

				// 2. Process Stations
				const fullStationDataMap: Record<string, StationData[]> = {};
				for (const st of data.stations || []) {
					const sid = String(st.systemid ?? "unknown");
					const stationData = {
						stationid: String(st.stationid),
						name: st.name,
						comexid: st.comexid,
						systemid: st.systemid,
						semimajoraxis: st.orbit.semiMajorAxis,
						eccentricity: st.orbit.eccentricity,
						inclination: st.orbit.inclination,
						rightascension: st.orbit.rightAscension,
						periapsis: st.orbit.periapsis,
						naturalid: st.naturalid,
						warehouseid: st.warehouseid,
					};
					if (!fullStationDataMap[sid]) fullStationDataMap[sid] = [];
					fullStationDataMap[sid].push(stationData);
				}
				setAllStationsData(fullStationDataMap);

				// 3. Process Gateways
				const fullGatewayDataMap: Record<string, GatewayData[]> = {};

				// Lookup Map: Gateway ID -> System ID (Used to resolve targets)
				const gatewayIdToSystemId = new Map<string, string>();

				for (const g of data.gateways || []) {
					const sid = String(g.system_id ?? "unknown");

					// Map both Internal ID and Natural ID to System ID for robust linking
					if (g.system_id) {
						if (g.id)
							gatewayIdToSystemId.set(String(g.id), String(g.system_id));
						if (g.naturalid)
							gatewayIdToSystemId.set(String(g.id), String(g.system_id));
					}

					const gatewayObj: GatewayData = {
						id: g.id || g.naturalid,
						name: g.name || g.naturalid,
						naturalid: g.naturalid,
						type: "GATEWAY",
						systemid: g.system_id,
						planetid: g.planet_id,
						// Orbital Params
						semimajoraxis: g.semimajoraxis,
						eccentricity: g.eccentricity,
						inclination: g.inclination,
						rightascension: g.rightascension || 0,
						periapsis: g.periapsis || 0,
						// Functional Params
						operational_state: g.operational_state,
						is_linked: g.is_linked,
						outgoing_link_id: g.outgoing_link_id,
						fuel_available: g.fuel_available,
						fuel_max: g.fuel_max,
						fuel_usage_fee: g.fuel_usage_fee,
						currency_code: g.currency_code,
					};

					if (!fullGatewayDataMap[sid]) fullGatewayDataMap[sid] = [];
					fullGatewayDataMap[sid].push(gatewayObj);
				}
				setAllGatewaysData(fullGatewayDataMap);

				// 4. Process Planets
				const planetsBySystem = new Map<string, any[]>();
				const fullPlanetDataMap: Record<string, PlanetData[]> = {};
				for (const p of data.planets || []) {
					const sid = String(p.systemid ?? "unknown");
					if (!planetsBySystem.has(sid)) planetsBySystem.set(sid, []);
					planetsBySystem.get(sid)!.push(p);
					const orbitData: PlanetData = {
						planetid: String(p.planetid),
						planetname: p.name,
						nextPopulation: p.nextPopulation,
						planetPopulation: p.population ?? 0,
						orbitindex: p.orbitindex ?? 0,
						semimajoraxis: p.semimajoraxis ?? 50_000_000_000,
						eccentricity: p.eccentricity ?? 0,
						inclination: p.inclination ?? 0,
						rightascension: p.rightascension ?? 0,
						periapsis: p.periapsis ?? 0,
						scaledOrbitalRadius: 0,
						scaledPlanetRadius: BASE_PLANET_SIZE,
						mass: p.mass,
						type: p.planet_type,
						resources: p.resources,
						updatedat: p.updatedat,
					};
					if (!fullPlanetDataMap[sid]) fullPlanetDataMap[sid] = [];
					fullPlanetDataMap[sid].push(orbitData);
				}
				setAllPlanetsData(fullPlanetDataMap);

				// ... (Sector/Subsector processing) ...
				const subsectorToSector: Record<string, string> = {};
				if (Array.isArray(data.subsectors)) {
					for (const ss of data.subsectors) {
						if (ss.externalsubsectorid && ss.externalsectorid)
							subsectorToSector[ss.externalsubsectorid] = ss.externalsectorid;
					}
				}

				const vertexBuckets: Record<string, XY[]> = {};
				for (const v of data.subsector_vertices || []) {
					const subsId = v.externalsubsectorid ?? "";
					const sectorId =
						subsectorToSector[subsId] ??
						(subsId.includes("-")
							? subsId.substring(0, subsId.lastIndexOf("-"))
							: subsId || "UNKNOWN");
					const vertex: XY = [v.x * 3, -v.y * 3];
					if (!vertexBuckets[sectorId]) vertexBuckets[sectorId] = [];
					vertexBuckets[sectorId].push(vertex);
				}

				const sectorNameMap: Record<string, string> = {};
				if (Array.isArray(data.sectors)) {
					for (const s of data.sectors) {
						const sid = s.externalsectorid ?? s.id ?? null;
						if (sid) sectorNameMap[String(sid)] = s.name ?? String(sid);
					}
				}

				const countryCodesSet = new Set<string>();
				for (const p of data.planets || [])
					if (p.countrycode && p.countrycode !== "null")
						countryCodesSet.add(String(p.countrycode));
				const empireMap = assignEmpireColors(Array.from(countryCodesSet));
				setEmpireLegend(empireMap);

				// ... (Population processing) ...
				let globalMaxPop = 0;
				const POP_TYPE_COLORS: Record<string, number[]> = {
					PIONEER: [255, 255, 0, 255],
					SETTLER: [50, 50, 255, 255],
					TECHNICIAN: [0, 255, 255, 255],
					SCIENTIST: [204, 102, 255, 255],
					ENGINEER: [255, 102, 0, 255],
				};

				for (const [sysIdRaw, planets] of planetsBySystem.entries()) {
					const matched = systemPointsMap.get(String(sysIdRaw));
					if (!matched) continue;

					let totalPop = 0;
					const systemPopTypeCounts: Record<string, number> = {};

					for (const p of planets) {
						const rawBreakdown = p.nextPopulation;
						let planetBreakdown: Record<string, number> | null = null;

						if (typeof rawBreakdown === "string") {
							try {
								planetBreakdown = JSON.parse(rawBreakdown);
							} catch (e) {
								console.error(
									"Failed to parse planet population string:",
									rawBreakdown,
									e,
								);
							}
						} else if (
							typeof rawBreakdown === "object" &&
							rawBreakdown !== null
						) {
							planetBreakdown = rawBreakdown;
						}

						if (planetBreakdown) {
							for (const [type, count] of Object.entries(planetBreakdown)) {
								if (typeof count === "number" && count > 0) {
									const normalizedType = type.toUpperCase();
									systemPopTypeCounts[normalizedType] =
										(systemPopTypeCounts[normalizedType] || 0) + count;
									totalPop += count;
								}
							}
						}
						totalPop = totalPop > 0 ? totalPop : p.population;
					}

					const unsortedBreakdown = Object.entries(systemPopTypeCounts)
						.map(([type, count]) => ({
							type,
							count,
							color: POP_TYPE_COLORS[type] || [255, 255, 255, 255],
						}))
						.filter((d) => d.count > 0);

					const popBreakdownData = unsortedBreakdown.sort(
						(a, b) => a.count - b.count,
					);
					const counts: Record<string, number> = {};
					for (const p of planets) {
						const c = p.countrycode ?? "UN";
						counts[c] = (counts[c] || 0) + 1;
					}
					let majority = "UN",
						best = -1;
					for (const k of Object.keys(counts))
						if (counts[k] > best) {
							best = counts[k];
							majority = k;
						}

					const empireCode = majority === "UN" ? "UN" : majority;
					const color = empireMap[empireCode] ?? "#95a5a6";
					const isCX =
						planets.some((p: any) => /(^|\s)CX(\s|$)/i.test(p.name || "")) ||
						matched.isCX;

					matched.popBreakdown = popBreakdownData;
					matched.population = Math.max(0, totalPop);
					globalMaxPop = Math.max(globalMaxPop, totalPop);
					matched.empireCode = empireCode;
					matched.color = color;
					matched.isCX = isCX;
					matched.radiusHint = Math.max(
						5,
						matched.population && matched.population > 0
							? Math.log10(Math.max(1, matched.population)) * 3.5 + 5
							: 5,
					);
					systemPointsMap.set(String(sysIdRaw), matched);
				}
				setMaxSystemPopulation(globalMaxPop);

				const initialSectors: Sector[] = [];
				for (const [sectorId, pts] of Object.entries(vertexBuckets)) {
					if (!pts || pts.length < 3) {
						initialSectors.push({
							id: sectorId,
							vertices: pts,
							centroid: calculateCentroid(pts),
							empireCode: null,
							isCX: false,
							name: sectorNameMap[sectorId] ?? sectorId,
						});
						continue;
					}
					const hull = convexHull(pts);
					const dens = densifyPolygon(hull, 25);
					const smooth = chaikinSmooth(dens, 1);
					initialSectors.push({
						id: sectorId,
						vertices: smooth,
						centroid: calculateCentroid(smooth),
						empireCode: null,
						isCX: false,
						name: sectorNameMap[sectorId] ?? sectorId,
					});
				}

				// 5. GRID & CONNECTIONS
				const builtSystems = Array.from(systemPointsMap.values());

				// This calculates the FINAL visual X/Y for every system to avoid overlaps
				const { adjusted, bounds } = await resolveInitialOverlapsAsync(
					builtSystems,
					data.system_connections || [],
					{ cellSize: 40, minSeparation: 20, minLineSeparation: 15 },
				);
				setContentBounds(bounds);

				// A. Standard System Connections (Hyperlanes)
				const connections = buildSystemConnections(
					data.system_connections || [],
					adjusted,
				);

				// B. Gateway Connections (NEW)
				const finalGatewayConnections: {
					sourcePosition: number[];
					targetPosition: number[];
					type: string;
				}[] = [];

				// 1. Create a Lookup for Final System Coordinates
				const adjustedSystemMap = new Map<string, MapPoint>();
				adjusted.forEach((sys) => {
					if (sys.originalSystemId) {
						adjustedSystemMap.set(String(sys.originalSystemId), sys);
					}
				});

				// 2. Build Connections (Deduplicated with Set)
				const processedLinks = new Set<string>(); // Stores keys "sysID_A-sysID_B" (sorted)

				const addLink = (sysIdA: string, sysIdB: string) => {
					// Prevent self-links or missing data
					if (!sysIdA || !sysIdB || sysIdA === sysIdB) return;

					// Sort IDs to ensure A->B and B->A generate the same key (deduplication)
					const key = [sysIdA, sysIdB].sort().join("-");

					if (!processedLinks.has(key)) {
						const sysNodeA = adjustedSystemMap.get(sysIdA);
						const sysNodeB = adjustedSystemMap.get(sysIdB);

						if (sysNodeA && sysNodeB) {
							finalGatewayConnections.push({
								sourcePosition: [sysNodeA.x, sysNodeA.y],
								targetPosition: [sysNodeB.x, sysNodeB.y],
								type: "gateway",
							});
							processedLinks.add(key);
						}
					}
				};

				for (const g of data.gateways || []) {
					const currentSysId = String(g.system_id);

					// A. Handle Outgoing Link
					if (g.outgoing_link_id) {
						const targetSysId = gatewayIdToSystemId.get(
							String(g.outgoing_link_id),
						);
						if (targetSysId) {
							addLink(currentSysId, targetSysId);
						}
					}

					// B. Handle Incoming Links (Redundancy check)
					if (g.incoming_links && Array.isArray(g.incoming_links)) {
						for (const incomingGatewayId of g.incoming_links) {
							const originSysId = gatewayIdToSystemId.get(
								String(incomingGatewayId),
							);
							if (originSysId) {
								addLink(currentSysId, originSysId);
							}
						}
					}
				}

				if (!mounted) return;
				setSystemConnections(connections);
				setGatewayConnections(finalGatewayConnections);
				setSystemsPoints(adjusted);

				// ... (Final Sector Assignments) ...
				const finalSectors: Sector[] = [];
				for (const sector of initialSectors) {
					const systemsInside = adjusted.filter((s) =>
						pointInPolygon([s.x, s.y], sector.vertices),
					);
					const countByEmpire: Record<string, number> = {};
					for (const si of systemsInside) {
						const c = si.empireCode ?? "UN";
						countByEmpire[c] = (countByEmpire[c] || 0) + 1;
					}
					let chosenEmpire: string | null = null;
					let bestCnt = -1;
					for (const k of Object.keys(countByEmpire))
						if (countByEmpire[k] > bestCnt) {
							bestCnt = countByEmpire[k];
							chosenEmpire = k === "UN" ? null : k;
						}
					sector.empireCode = chosenEmpire;
					sector.isCX = systemsInside.some((s) => s.isCX);
					finalSectors.push(sector);
				}
				setSectors(finalSectors);
				setEmpireLegend(empireMap);

				setIsLoading(false);
			} catch (err: any) {
				console.error("map fetch error", err);
				if (mounted) {
					setFetchError(String(err?.message ?? err));
					setIsLoading(false);
				}
			}
		};
		fetchData();
		return () => {
			mounted = false;
		};
	}, [mapDataFromContext]);

	return {
		isLoading,
		fetchError,
		systemsPoints,
		sectors,
		empireLegend,
		systemConnections,
		gatewayConnections, // Exported
		allPlanetsData,
		allStationsData,
		allGatewaysData, // Exported
		maxSystemPopulation,
		contentBounds,
	};
};
