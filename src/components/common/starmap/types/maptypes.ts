export type XY = [number, number];

export interface BackendPlanet {
	name: string;
	systemid: string | number;
	planetid: string | number;
	population?: number;
	countryname?: string | null;
	countrycode?: string | null;
	totalSystemPopulation?: number | null;
	semimajoraxis?: number;
	eccentricity?: number;
	inclination?: number;
	rightascension?: number;
	periapsis?: number;
	orbitindex?: number;
}

export interface BackendSubsector {
	externalsectorid: string;
	externalsubsectorid: string;
}

export interface MapPoint {
	microasteroidCount: number;
	totalSystemPopulation?: number;
	id: string;
	label: string;
	type: "system" | "planet";
	systemtype: "O" | "B" | "A" | "F" | "G" | "K" | "M";
	x: number;
	y: number;
	z?: number;
	color: string;
	outlineColor?: string;
	population?: number;
	empireCode?: string | null;
	isCX?: boolean;
	radiusHint?: number;
	originalSystemId?: string | null;
	systemId?: string;
	hide?: boolean;
	masssol: number;
	mass: number;
	popBreakdown: popBreakdown[] | null;
}

export interface popBreakdown {
	type: string;
	count: number;
	color: number[];
}

export interface StationData {
	name: string;
	naturalid: string;
	comexid: string;
	systemid: string;
	stationid: string;
	warehouseid: string;
	semimajoraxis: number;
	eccentricity: number;
	inclination: number;
	rightascension: number;
	periapsis: number;
}

/* export interface StationOrbit {
  semimajoraxis: number;
  eccentricity: number;
  inclination: number;
  rightascension: number;
  periapsis: number;
} */

export interface Sector {
	id: string;
	vertices: XY[];
	centroid: XY;
	empireCode?: string | null;
	isCX?: boolean;
	name?: string;
}

export interface PlanetResource {
	name: string;
	value: number;
}

export interface GatewayData {
	id: string;
	name: string | null;
	naturalid: string;
	type: string;
	systemid: string;
	planetid: string;
	// Orbit
	semimajoraxis: number;
	eccentricity: number;
	inclination: number;
	rightascension: number;
	periapsis: number;
	// Status
	operational_state: string;
	is_linked: boolean;
	outgoing_link_id: string | null;
	fuel_available: number;
	fuel_max: number;
	fuel_usage_fee: number;
	currency_code: string;
}

export interface PlanetData {
	planetid: string;
	planetname: string;
	type: string;
	orbitindex: number;
	semimajoraxis: number;
	eccentricity: number;
	inclination: number;
	rightascension: number;
	periapsis: number;
	planetPopulation?: number;
	scaledOrbitalRadius?: number;
	scaledPlanetRadius?: number;
	mass: number;
	nextPopulation: any;
	resources?: PlanetResource[];
	updatedat?: string;
	gravity?: number;
	pressure?: number;
	temperature?: number;
	fertility?: number;
	cogc?: string | null;
	Government?: any[];
	Motions?: any[];
}

export interface Color {
	r: number;
	g: number;
	b: number;
	a: number;
}

export interface PlanetPosition {
	color?: Color;
	orbitindex: number;
	eccentricity: number;
	inclination: number;
	x: number;
	y: number;
	planetid: string;
	name: string;
	planetname?: string;
	parentSystemId: string;
	orbitalRadius: number;
	planetPopulation: number;
	semimajoraxis?: number;
	scaledOrbitalRadius?: number;
	scaledPlanetRadius?: number;
	type: string;
	resources?: PlanetResource[];
	gravity?: number;
	pressure?: number;
	temperature?: number;
	fertility?: number;
	cogc?: string | null;
	Government?: any[];
	Motions?: any[];
}

export interface StationPosition {
	color: Color;
	eccentricity: number;
	inclination: number;
	x: number;
	y: number;
	stationid: string;
	name: string;
	parentSystemId: string;
	orbitalRadius: number;
	semimajoraxis?: number;
	scaledOrbitalRadius?: number;
	scaledStationRadius?: number;
}

export interface SystemStats {
	name: string;
	totalSystemPopulation: number;
	planetCount: number;
	planetDetails: { name: string; population: number; orbitIndex: number }[];
	microasteroidCount: number;
}

export interface OrthographicViewState {
	target: [number, number];
	zoom: number;
	minZoom: number;
	maxZoom: number;
	pitch: number;
	bearing: number;
	transitionDuration?: number | "auto";
	transitionInterpolator?: any;
	transitionEasing?: (t: number) => number;
}

export interface LabeledSystem extends MapPoint {
	labelPosition: XY;
}

export interface Edge {
	systemidorigin: string;
	systemiddestination: string;
}

export interface FlightSegment {
	segment_id?: number;
	flight_id?: string;
	segment_index?: number;
	segment_type?: string;
	departure: number; // Unix timestamp in milliseconds
	arrival: number; // Unix timestamp in milliseconds
	duration?: number;
	origin_system_id?: string;
	origin_location_id?: string;
	origin_location_type?: string;
	origin_orbit_data?: any;
	destination_system_id?: string;
	destination_location_id?: string;
	destination_location_type?: string;
	destination_orbit_data?: any;
	stl_distance?: number;
	stl_fuel?: number;
	ftl_distance?: number;
	ftl_fuel?: number;
	damage?: number;
	transferellipse?: any;

	// Deprecated / view aliases
	origin?: string;
	destination?: string;
	origin_system?: string;
	destination_system?: string;
}

export interface FlightPlan {
	id: string;
	shipid?: string;
	userid?: string;
	originsystemid?: string;
	originstationid?: string | null;
	originplanetid?: string | null;
	destinationsystemid?: string;
	destinationstationid?: string | null;
	destinationplanetid?: string | null;
	departuretimestamp?: string;
	arrivaltimestamp?: string;
	currentsegmentindex?: number;
	aborted?: boolean;
	damage?: number;
	stldistance?: number;
	stltotalconsumption?: number;
	ftldistance?: number;
	ftltotalconsumption?: number;
	segments: FlightSegment[];

	// UI & View helper fields
	origin?: string;
	destination?: string;
	color?: number[];
	isOwn?: boolean;
	_arrivalMs?: number;
	_departureMs?: number;
	expired?: boolean;
}

export interface WorkerFlightPlan extends FlightPlan {}

export interface ShipData {
	shipid: string;
	userid?: string | null;
	name: string | null;
	registration: string;
	type: string; // Base hull natural ID (e.g. "WSP")
	ship_type: string; // Cargo class ('HCB' | 'VCB' | 'WCB' | 'LCB' | 'TINY' | 'UNKNOWN')

	// Addressing / Location
	addressplanetid?: string | null;
	addressstationid?: string | null;
	addresssystemid?: string | null;

	// Performance & Stats
	acceleration: number;
	thrust: number;
	volume: number;
	mass: number;
	operatingemptymass: number;
	reactorpower: number;
	emitterpower: number;
	stlfuelflowrate: number;
	status: string;
	condition: number;
	commissioningtime?: string | null;
	lastrepair?: string | null;
	flightid?: string | null;

	// Stores & Operating Times
	idftlfuelstore?: string | null;
	idstlfuelstore?: string | null;
	idshipstore?: string | null;
	operatingtimeftl: number;
	operatingtimestl: number;
	blueprintnaturalid: string;

	// Joined Metadata from ships_repo.py
	is_owner: boolean;
	is_corp: boolean;
	companycode?: string | null;
	displayname?: string | null;
	plan?: FlightPlan | null;

	// Optional runtime/view coordinates when merged
	id?: string;
	position?: [number, number];
	progress?: number;
	bearing?: number;
	visible?: boolean;
	currentLocationLabel?: string;
	cargo?: ShipCargo;

	// --- Deprecated Backward Compatibility Aliases ---
	user_id?: string;
	ownerName?: string;
	ownerId?: string;
	flight?: FlightPlan | null;
	flight_id?: string;
	flightId?: string;
	systemid?: string | null;
	systemId?: string | null;
	system_id?: string | null;
	address_planet_id?: string;
	address_station_id?: string;
	address_system_id?: string;
	operating_empty_mass?: number;
	reactor_power?: number;
	emitter_power?: number;
	stl_fuel_flow_rate?: number;
	commissioning_time?: string;
	last_repair?: string | null;
	id_ftl_fuel_store?: string;
	id_stl_fuel_store?: string;
	id_ship_store?: string;
	operating_time_ftl?: number;
	operating_time_stl?: number;
	blueprint_natural_id?: string;
	company_code?: string;
	display_name?: string;
	personal_suffix?: string;
	iscorp?: boolean;
	is_owner_ship?: boolean;
}

/**
 * Runtime Animated Ship Model (for Starmap rendering & Web Worker)
 */
export interface AnimatedShipData extends ShipData {
	id: string;
	position: [number, number];
	progress: number;
	bearing?: number;
	visible?: boolean;
	currentLocationLabel?: string;
	cargo?: ShipCargo;
}

export interface ShipCargo {
	currentvolume: number;
	maxvolume: number;
	currentweight: number;
	maxweight: number;
	items: any[];
}

export interface PreCalculatedShipData {
	id: string;
	position: [number, number];
	isCluster: boolean;
	count: number;
	bearing: number;
	name: string;
	ships?: AnimatedShipData[];
}

export interface UpdateShipData {
	id: string;
	position: [number, number];
	bearing: number;
	name?: string | null;
	registration: string;
	visible?: boolean;
	type: string;
	positionMode?: "galaxy" | "system";
	systemId?: string | null;
}

export interface ShipmentFlightSegment {
	segment_type: string;
	segment_index: number;
	departure: number;
	arrival: number;
	origin_system_id: string;
	destination_system_id: string;
	origin_location_id: string;
	destination_location_id: string;
	stl_distance: number;
	transferellipse: string;
}

export interface ShipmentDeliveryBox {
	conditionId: string;
	flightId: string;
	index: number;
	planet: string;
	shipData: any;
	shipId: string;
	shipmentItemId: string;
	site: string;
	station: string;
	status: string;
	system: string;
	flightSegments: ShipmentFlightSegment[];
}
