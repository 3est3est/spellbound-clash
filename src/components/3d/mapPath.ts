// ===================================================================
// Shared map definition for the winding forest path.
// Used by Environment (tiles/walls), Player (collision) and the
// store (enemy placement) so every system agrees on the same path.
// ===================================================================

// Centerline waypoints [x, z]. Path travels from the bottom of the
// map (positive z, near player start) toward the top (negative z).
// The zig-zag x offsets create the winding, edge-to-edge feel.
export const PATH_WAYPOINTS: [number, number][] = [
  [0, 9],
  [0, -6],
  [7, -20],
  [-7, -34],
  [7, -48],
  [-7, -62],
  [7, -76],
  [-7, -90],
  [7, -104],
  [-7, -118],
  [7, -132],
  [-7, -146],
  [0, -162],
  [0, -196],
];

// Half-width of the walkable path (full path = 7 units wide).
export const PATH_HALF_WIDTH = 3.5;

// Hard map extents (z = depth axis).
export const MAP_MIN_Z = -198;
export const MAP_MAX_Z = 10;

// Forest wall extent on x (where dense trees fill the non-path area).
export const MAP_HALF_X = 14;

// --- Dense centerline samples (for collision + decoration) --------
interface Sample {
  x: number;
  z: number;
  cum: number; // cumulative arc length up to this sample
}

const STEP = 0.5;

function buildSamples(): Sample[] {
  const samples: Sample[] = [];
  let cum = 0;
  for (let i = 0; i < PATH_WAYPOINTS.length - 1; i++) {
    const [x1, z1] = PATH_WAYPOINTS[i];
    const [x2, z2] = PATH_WAYPOINTS[i + 1];
    const dx = x2 - x1;
    const dz = z2 - z1;
    const segLen = Math.sqrt(dx * dx + dz * dz);
    const count = Math.max(1, Math.round(segLen / STEP));
    for (let j = 0; j <= count; j++) {
      const t = j / count;
      samples.push({ x: x1 + dx * t, z: z1 + dz * t, cum });
      cum += segLen / count;
    }
  }
  return samples;
}

export const PATH_SAMPLES: Sample[] = buildSamples();
export const PATH_TOTAL_LENGTH: number =
  PATH_SAMPLES[PATH_SAMPLES.length - 1]?.cum ?? 0;

// Distance from a point to the nearest centerline sample.
export function nearestCenterlineDist(x: number, z: number): number {
  let best = Infinity;
  for (const s of PATH_SAMPLES) {
    const ddx = s.x - x;
    const ddz = s.z - z;
    const d = ddx * ddx + ddz * ddz;
    if (d < best) best = d;
  }
  return Math.sqrt(best);
}

// True when (x, z) lies on the walkable path. Optional extra margin
// (positive = stricter, e.g. for placing solid scenery off the path).
export function isOnPath(x: number, z: number, margin = 0): boolean {
  return nearestCenterlineDist(x, z) <= PATH_HALF_WIDTH - margin;
}

// Return `count` points evenly spaced along the path by arc length,
// between startT and endT (0..1 of total length). Used to place
// enemies reliably ON the path so the player always runs into them.
export function getSpacedPathPoints(
  count: number,
  startT = 0.12,
  endT = 0.95
): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i < count; i++) {
    const t = startT + ((endT - startT) * (i + 0.5)) / count;
    const target = t * PATH_TOTAL_LENGTH;

    // Linear scan for the sample crossing the target arc length.
    let prev = PATH_SAMPLES[0];
    for (let j = 1; j < PATH_SAMPLES.length; j++) {
      const cur = PATH_SAMPLES[j];
      if (cur.cum >= target) {
        const span = cur.cum - prev.cum || 1;
        const f = (target - prev.cum) / span;
        points.push([
          prev.x + (cur.x - prev.x) * f,
          prev.z + (cur.z - prev.z) * f,
        ]);
        break;
      }
      prev = cur;
    }
  }
  return points;
}
