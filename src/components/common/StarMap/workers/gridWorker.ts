// gridWorker.ts -- run as module worker

/**
 * Calculates the shortest distance and closest point on a line segment (a, b) to a point (p).
 */
function distanceToSegment(
  ax: number, ay: number, 
  bx: number, by: number, 
  px: number, py: number
): { distance: number, cx: number, cy: number } {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;

  let t = 0;
  if (lenSq !== 0) {
    t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  }

  // Clamps t to [0, 1] to ensure the closest point is on the segment
  t = Math.max(0, Math.min(1, t)); 

  const cx = ax + t * dx;
  const cy = ay + t * dy;
  const distance = Math.hypot(px - cx, py - cy);

  return { distance, cx, cy };
}

// simple spatial hash for systems
const buildSystemGrid = (items: any[], cs: number) => {
  const g = new Map();
  for (const it of items) {
    const gx = Math.floor(it.x / cs);
    const gy = Math.floor(it.y / cs);
    const k = `${gx},${gy}`;
    if (!g.has(k)) g.set(k, []);
    g.get(k).push(it);
  }
  return g;
};

/**
 * Maps edges to the grid cells they cross using a simplified line rasterization.
 * This is the optimization that speeds up line-system repulsion.
 */
function buildEdgeGrid(edges: any[], cellSize: number) {
  const edgeGrid = new Map<string, any[]>();
  for (const edge of edges) {
    let x0 = Math.floor(edge.ax / cellSize);
    let y0 = Math.floor(edge.ay / cellSize);
    let x1 = Math.floor(edge.bx / cellSize);
    let y1 = Math.floor(edge.by / cellSize);

    // Simple symmetric rasterization to find all cells crossed
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let sx = (x0 < x1) ? 1 : -1;
    let sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;

    while (true) {
      const key = `${x0},${y0}`;
      if (!edgeGrid.has(key)) edgeGrid.set(key, []);
      edgeGrid.get(key)!.push(edge);
      
      if (x0 === x1 && y0 === y1) break;
      let e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x0 += sx; }
      if (e2 < dx) { err += dx; y0 += sy; }
    }
  }
  return edgeGrid;
}


self.addEventListener("message", (ev) => {
  const { 
    systems, 
    edges, 
    cellSize = 40, 
    minSeparation = 20, 
    maxIterations = 100, 
    minLineSeparation = 10 
  } = ev.data;

  const systemMap = new Map();
  for (const s of systems) {
      if (s.originalSystemId) systemMap.set(s.originalSystemId, s);
  }

  // Initial edge processing to map IDs to coordinates
  const edgesWithCoords = edges
    .map((c: any) => {
      const origin = systemMap.get(c.systemidorigin);
      const destination = systemMap.get(c.systemiddestination);
      if (origin && destination) {
        return {
          id: `${c.systemidorigin}-${c.systemiddestination}`,
          systemidorigin: c.systemidorigin,
          systemiddestination: c.systemiddestination,
          ax: origin.x,
          ay: origin.y,
          bx: destination.x,
          by: destination.y,
        };
      }
      return null;
    })
    .filter((e: any) => e !== null);

  const adjusted = systems.map((s: any) => ({ ...s }));
  const damp = 0.9;
  const LINE_REPULSION_GAIN = 0.05;

  for (let iter = 0; iter < maxIterations; iter++) {
    let moved = false;
    const systemGrid = buildSystemGrid(adjusted, cellSize);
    const forces = new Map();
    
    // Update edges with current coordinates for this iteration
    const currentEdges = edgesWithCoords.map((e: any) => {
      const origin = adjusted.find((s: any) => s.originalSystemId === e.systemidorigin);
      const destination = adjusted.find((s: any) => s.originalSystemId === e.systemiddestination);
      return {
        ...e,
        ax: origin?.x ?? e.ax,
        ay: origin?.y ?? e.ay,
        bx: destination?.x ?? e.bx,
        by: destination?.y ?? e.by,
      };
    });

    // BUILD EDGE GRID HERE (OPTIMIZATION)
    const edgeGrid = buildEdgeGrid(currentEdges, cellSize);

    for (const system of adjusted) {
      let fx = 0, fy = 0;
      const gx = Math.floor(system.x / cellSize);
      const gy = Math.floor(system.y / cellSize);
      
      // 1. SYSTEM-SYSTEM REPULSION (Grid Accelerated)
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const k = `${gx + dx},${gy + dy}`;
          const neigh = systemGrid.get(k) || [];
          for (const other of neigh) {
            if (other.id === system.id) continue;
            const dxv = system.x - other.x;
            const dyv = system.y - other.y;
            const dist = Math.hypot(dxv, dyv) || 1e-6;
            if (dist < minSeparation) {
              const overlap = minSeparation - dist;
              const angle = Math.atan2(dyv, dxv);
              const mag = overlap * overlap * 0.01;
              fx += Math.cos(angle) * mag;
              fy += Math.sin(angle) * mag;
            }
          }
        }
      }

      // 2. LINE-SYSTEM REPULSION (Grid Accelerated)
      for (let dx_cell = -1; dx_cell <= 1; dx_cell++) {
        for (let dy_cell = -1; dy_cell <= 1; dy_cell++) {
          const key = `${gx + dx_cell},${gy + dy_cell}`;
          const nearbyEdges = edgeGrid.get(key) || [];

          for (const edge of nearbyEdges) {
            // Skip edges connected to the system itself
            if (system.originalSystemId === edge.systemidorigin || system.originalSystemId === edge.systemiddestination) {
              continue;
            }

            const { distance, cx, cy } = distanceToSegment(edge.ax, edge.ay, edge.bx, edge.by, system.x, system.y);

            if (distance < minLineSeparation) {
              const overlap = minLineSeparation - distance;
              // Vector from system to closest point on line (cx, cy)
              const dxv = system.x - cx; 
              const dyv = system.y - cy;
              const angle = Math.atan2(dyv, dxv);
              
              // Apply repulsion force proportional to overlap
              const mag = overlap * LINE_REPULSION_GAIN; 

              fx += Math.cos(angle) * mag;
              fy += Math.sin(angle) * mag;
            }
          }
        }
      }
      
      forces.set(system.id, [fx, fy]);
    }

    // Position Update
    for (const system of adjusted) {
      const [fx, fy] = forces.get(system.id) || [0, 0];
      const dx = fx * damp;
      const dy = fy * damp;
      if (Math.hypot(dx, dy) > 1e-3) {
        system.x += dx;
        system.y += dy;
        moved = true;
      }
    }
    if (!moved) break;
  }

  // compute bounds
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const s of adjusted) {
    minX = Math.min(minX, s.x);
    minY = Math.min(minY, s.y);
    maxX = Math.max(maxX, s.x);
    maxY = Math.max(maxY, s.y);
  }

  // return adjusted and bounds
  self.postMessage({ adjusted, bounds: { minX, minY, maxX, maxY } });
});