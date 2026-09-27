import { PolygonLayer, TextLayer } from "@deck.gl/layers";
import type { Sector } from "../../../types/maptypes";

/**
 * Builds PolygonLayer & TextLayer for territory sectors on galaxy view.
 */
export function buildSectorLayers(
	isGalaxyView: boolean,
	sectors: Sector[] | undefined,
	safeGetColor: (code?: string, alpha?: number) => [number, number, number, number],
) {
	if (!isGalaxyView || !sectors || sectors.length === 0) return [];
	const sectorLayers: any[] = [];
	const sectorLabels = sectors.map((s) => ({
		text: s.name || s.id,
		position: s.centroid,
	}));

	sectorLayers.push(
		new PolygonLayer<Sector>({
			id: "sector-polygons",
			data: sectors,
			getPolygon: (d: Sector) => {
				const cx = d.centroid[0],
					cy = d.centroid[1];
				const gap = 0.995;
				return d.vertices.map((v: any) => [
					cx + (v[0] - cx) * gap,
					cy + (v[1] - cy) * gap,
				]);
			},
			getFillColor: (d: Sector) => safeGetColor(d.empireCode, 60),
			getLineColor: (d: Sector) => safeGetColor(d.empireCode, 180),
			getLineWidth: 2,
			stroked: true,
			pickable: false,
		}),
	);
	sectorLayers.push(
		new TextLayer({
			id: "sector-labels",
			data: sectorLabels,
			getPosition: (d: any) => d.position,
			getText: (d: any) => d.text,
			getSize: 18,
			sizeUnits: "pixels",
			getColor: [255, 255, 255, 255],
			billboard: true,
			pickable: false,
		}),
	);
	return sectorLayers;
}
