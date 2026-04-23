import type { PlanetPosition, MapPoint } from "../types/mapTypes";

/**
 * Compute a viewState target + zoom which attempts to fit the whole system into the viewport.
 * viewport should be the DeckGL viewport instance (has width/height and project/unproject).
 *
 * Returns { target: [x,y], zoom: number }
 *
 * Math:
 * - we compute requiredWorld = diameter in world units (2 * max distance from center to planet)
 * - then compute approximate zoom = log2(viewportMinPx / requiredWorld)
 * - clamp with given min/maxZoom (optional)
 */
export function computePlanetFitView({
  viewport,
  centeredSystem,
  planetPositions,
  paddingWorld = 100,
  minZoom = -2,
  maxZoom = 8,
}: {
  viewport: any;
  centeredSystem: MapPoint;
  planetPositions: PlanetPosition[];
  paddingWorld?: number;
  minZoom?: number;
  maxZoom?: number;
}) {
  if (!viewport || !centeredSystem) return { target: [0, 0], zoom: minZoom };

  if (!planetPositions || planetPositions.length === 0) {
    return { target: [centeredSystem.x, centeredSystem.y], zoom: Math.max(minZoom, Math.min(maxZoom, 2)) };
  }

  const cx = centeredSystem.x;
  const cy = centeredSystem.y;
  let maxD = 0;
  for (const p of planetPositions) {
    const d = Math.hypot(p.x - cx, p.y - cy);
    if (d > maxD) maxD = d;
  }

  const requiredWorld = Math.max(1, maxD * 2 + paddingWorld * 2);
  const vpMin = Math.min(viewport.width || 800, viewport.height || 600);
  // avoid division by zero
  const scaling = Math.max(1e-6, vpMin / requiredWorld);
  const zoom = Math.log2(scaling);
  const clamped = Math.max(minZoom, Math.min(maxZoom, zoom));

  return { target: [cx, cy], zoom: clamped };
}
