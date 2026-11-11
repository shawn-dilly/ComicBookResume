/**
 * webGeometry - seeded geometry for the corner webs and a few small math helpers.
 *
 * Randomness comes from a seeded PRNG so a given seed always yields the same
 * web: the webs look different from one another but are stable across
 * reloads, React re-renders and StrictMode double-mounts.
 *
 * Distances are in "units" (half a page width), see webConfig.ts.
 */

import { WRAP } from './webConfig';

/** mulberry32 - tiny, fast, deterministic 32-bit PRNG. Returns [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
/** Frame-rate independent exponential approach of `a` toward `b`. */
export const damp = (a: number, b: number, lambda: number, dt: number): number =>
  lerp(a, b, 1 - Math.exp(-lambda * dt));
/** Ease-out with a small overshoot, input and output nominally 0..1. */
export const backOut = (x: number, overshoot: number): number => {
  const t = clamp(x, 0, 1) - 1;
  return 1 + (overshoot + 1) * t * t * t + overshoot * t * t;
};

/** Per-corner web settings (see WEB_SHAPES in webConfig). */
export interface CornerShape {
  seed: number;
  /** Interior spokes between the two edge spokes. */
  wrapSpokes: number;
  /** How far the web reaches along both book edges from the corner (units). */
  outer: number;
  /** Distance of the hub from the book corner out along the line (units). */
  hubOut: number;
  /** Number of rings. */
  rings: number;
}

/**
 * A corner web. Spokes radiate from a hub on the line, `hubOut` before the book corner; they end on
 * the book face at `corner + dir * outer * reach` (edge spokes land exactly on the book edges).
 */
export interface CornerWebDef {
  /** Spoke angles from 0 (along the horizontal edge) to PI/2 (along the vertical edge), radians, as seen from the corner. */
  angles: number[];
  /** Spoke end distance from the corner as a multiple of `outer` (edge spokes are exactly 1). */
  reach: number[];
  /** Ring positions as fractions of each spoke's length from the hub, inner to outer (the last is 1). */
  rings: number[];
  /** Reach along both book edges from the corner (units). */
  outer: number;
  /** Hub distance from the corner out along the line (units). */
  hubOut: number;
}

/**
 * Seeded layout of a corner web: spokes along both book edges plus a few interior ones with a
 * little angular jitter, and rings spread from WRAP.ringFrom to the outer outline.
 */
export function cornerWebDef(shape: CornerShape): CornerWebDef {
  const rnd = mulberry32(shape.seed * 31 + 7);
  const quarter = Math.PI / 2;
  const angles = [0];
  const reach = [1];
  for (let i = 1; i <= shape.wrapSpokes; i++) {
    angles.push((i / (shape.wrapSpokes + 1)) * quarter + (rnd() - 0.5) * 2 * WRAP.jitter);
    reach.push(1 + rnd() * WRAP.overshoot);
  }
  angles.push(quarter);
  reach.push(1);

  const rings: number[] = [];
  for (let k = 0; k < shape.rings; k++) {
    const f = shape.rings === 1 ? 1 : WRAP.ringFrom + ((1 - WRAP.ringFrom) * k) / (shape.rings - 1);
    rings.push(k === shape.rings - 1 ? 1 : f + (rnd() - 0.5) * 2 * WRAP.ringJitter);
  }
  rings.sort((a, b) => a - b);
  return { angles, reach, rings, outer: shape.outer, hubOut: shape.hubOut };
}
