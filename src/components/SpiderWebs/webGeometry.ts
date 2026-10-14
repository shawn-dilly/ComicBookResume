/**
 * webGeometry - Procedural spider web generator
 *
 * Produces SVG path data for a quarter-circle "corner web" anchored at the
 * origin (0, 0) and spreading into the +x / +y quadrant. The caller mirrors
 * the result with CSS transforms to place it in any viewport corner.
 *
 * All randomness comes from a seeded PRNG so a given seed always yields the
 * same web (stable across React re-renders and StrictMode double-mounts).
 */

export interface WebGeometry {
  /** The first line fired from the corner, along the 45° bisector. */
  lead: string;
  /** Angle of the lead line in degrees (what the spokes fan out from). */
  leadAngle: number;
  /** Radial strands, each drawn from the origin outward. Ordered by angle. */
  spokes: string[];
  /** Final angle (degrees) of each spoke, parallel to `spokes`. */
  spokeAngles: number[];
  /** Spiral rings connecting adjacent spokes. Ordered inner to outer. */
  rings: string[];
}

export interface WebOptions {
  /** Nominal web radius in user units (viewBox is 0 0 radius radius). */
  radius?: number;
  /** Number of radial strands across the 90° sweep. */
  spokeCount?: number;
  /** Number of spiral rings. */
  ringCount?: number;
  /** PRNG seed; different seeds give different organic shapes. */
  seed?: number;
}

/** mulberry32 - tiny, fast, deterministic 32-bit PRNG. Returns [0, 1). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DEG = Math.PI / 180;
const fmt = (n: number) => Math.round(n * 100) / 100;
const polar = (angleDeg: number, r: number): [number, number] => [
  r * Math.cos(angleDeg * DEG),
  r * Math.sin(angleDeg * DEG),
];

export function generateWeb(options: WebOptions = {}): WebGeometry {
  const { radius = 100, spokeCount = 13, ringCount = 10, seed = 1 } = options;
  const rand = mulberry32(seed);

  // --- Spoke angles: evenly spaced across 90° with organic jitter.
  // The two edge spokes are pulled slightly inward so they don't sit exactly
  // on the viewport edge (where half the stroke would be clipped).
  const step = 90 / (spokeCount - 1);
  const angles: number[] = [];
  for (let i = 0; i < spokeCount; i++) {
    if (i === 0) angles.push(2);
    else if (i === spokeCount - 1) angles.push(88);
    else angles.push(i * step + (rand() - 0.5) * step * 0.5);
  }
  angles.sort((a, b) => a - b);

  // --- Spokes: each extends a little past the nominal radius so the outer
  // edge of the web looks ragged rather than machine-cut.
  const spokes = angles.map((angle) => {
    const [x, y] = polar(angle, radius * (1.02 + rand() * 0.14));
    return `M0 0L${fmt(x)} ${fmt(y)}`;
  });

  // --- Rings: quadratic curves between neighbouring spokes, with the control
  // point pulled toward the origin so each segment sags like real silk.
  // Radii follow a power curve so inner rings sit closer together.
  const rings: string[] = [];
  for (let k = 0; k < ringCount; k++) {
    const base = radius * 0.97 * Math.pow((k + 1) / ringCount, 1.2);
    // Quadratic control at (1 - sag) pulls the curve's midpoint in by roughly
    // sag / 2, so this gives a gentle 3-6% droop between spokes.
    const sag = 0.06 + rand() * 0.06;
    let d = '';
    let prevAngle = 0;
    let prevR = 0;

    for (let i = 0; i < spokeCount; i++) {
      const r = base * (1 + (rand() - 0.5) * 0.04);
      const [x, y] = polar(angles[i], r);

      if (i === 0) {
        d += `M${fmt(x)} ${fmt(y)}`;
      } else {
        const midAngle = (prevAngle + angles[i]) / 2;
        const midR = ((prevR + r) / 2) * (1 - sag);
        const [cx, cy] = polar(midAngle, midR);
        d += `Q${fmt(cx)} ${fmt(cy)} ${fmt(x)} ${fmt(y)}`;
      }

      prevAngle = angles[i];
      prevR = r;
    }
    rings.push(d);
  }

  // --- Lead line: fired first, straight down the corner's bisector, and a
  // touch longer than the spokes so the web reads as hanging from it.
  const leadAngle = 45;
  const [lx, ly] = polar(leadAngle, radius * 1.2);
  const lead = `M0 0L${fmt(lx)} ${fmt(ly)}`;

  return { lead, leadAngle, spokes, spokeAngles: angles, rings };
}
