import { PathLayer } from "@deck.gl/layers";

export function createConnectionLayerUsingScreens({
  id = "connection-layer-factory",
  connections,
  color = [200, 200, 200, 110],
  width = 1,
  visible = true,
}: {
  id?: string;
  connections: { sourcePosition?: number[]; targetPosition?: number[] }[];
  color?: [number, number, number, number];
  width?: number;
  visible?: boolean;
}) {
  if (!connections || connections.length === 0) {
    return new PathLayer({ id, data: [], visible });
  }

  // NOTE: data is expected to be { path: [[x,y], [x,y]] }[]
  // We rely on useMapLayers to format this once.
  
  return new PathLayer({
    id,
    data: connections, // We pass the pre-formatted data directly
    getPath: (d: any) => d.path,
    getColor: color,
    getWidth: width,
    widthUnits: "pixels",
    visible,
    pickable: false, // Performance optimization
    autoHighlight: false
  });
}

export function createLabelConnectorPathLayer() {
  // Deprecated: We don't draw connector lines for system labels anymore
  // because GPU collision makes it hard to know which ones are visible.
  return null;
}