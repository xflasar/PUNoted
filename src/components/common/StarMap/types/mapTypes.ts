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
  stationid: string
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
}

export interface Color {
  r: number,
  g: number,
  b: number,
  a: number
}

export interface PlanetPosition {
  color: Color;
  orbitindex: number;
  eccentricity: number;
  inclination: number;
  x: number;
  y: number;
  planetid: string;
  name: string;
  parentSystemId: string;
  orbitalRadius: number;
  planetPopulation: number;
  semimajoraxis?: number;
  scaledOrbitalRadius?: number;
  scaledPlanetRadius?: number;
  type: string;
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

export interface WorkerFlightPlan {
  id: string;
  segments: FlightSegment[];
  origin: string;
  destination: string;
  shipid?: string;
  originid?: string;
  destinationid?: string;
  start?: number;
  end?: number;
  currentsegmentindex?: number;
  departuretimestamp?: string;
  expired?: boolean;
  originplanetid?: string;
  destinationplanetid?: string;
  originstationid?: string;
  destinationstationid?: string;
  originsystemid?: string;
  destinationsystemid?: string;
}

export interface FlightPlan {
  id: string;
  segments: FlightSegment[];
  origin: string;
  destination: string;
  shipid?: string;
  originid?: string;
  destinationid?: string;
  start?: number;
  end?: number;
  currentsegmentindex?: number;
}

export interface FlightSegment {
  departure: number; // Unix timestamp (milliseconds)
  arrival: number;   // Unix timestamp (milliseconds)
  origin: string;  // MapPoint of the segment's origin system
  destination: string; // MapPoint of the segment's destination system
  // ... other data
}

export interface AnimatedShipData {
  id: string;
  registration: string;
  name: string;
  ownerName: string;
  ownerId: string;
  is_owner_ship: boolean;
  addressplanetid: string;
  addresssystemid: string;
  addressstationid: string;
  type: string;
  currentLocationLabel?: string;
  plan: FlightPlan | null;
  position: [number, number]; // [x, y] coordinates for the current time
  progress: number; // 0.0 to 1.0, progress through the current segment
  bearing?: number; // Optional bearing angle in degrees
  visible?: boolean; // Optional visibility flag
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
    bearing: number; // precomputed rotation where possible
    name: string;
    // optional: ships array only kept for hover/click but not required for rendering
    ships?: AnimatedShipData[];
}

export interface UpdateShipData {
  id: string;
  position: [number, number];
  bearing: number;
  name: string;
  registration: string;
  visible?: boolean;
  type: string;

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