import { mulberry32 } from '../WebCatch/webGeometry';
import { SPOKE_ANGLES } from '../CoverWeb/coverWebGeometry';

/**
 * All geometry is in "frame units": the portrait frame is 100 wide and 115
 * tall, centred on (0, 0). The SVG is stretched over the frame, so the burst
 * scales with the portrait at every breakpoint.
 */
export const HALF_W = 50;
export const HALF_H = 57.5;
export const VIEW = { x: -100, y: -115, w: 200, h: 230 };

type Pt = readonly [number, number];
const f = (n: number) => (Math.round(n * 10) / 10).toString();
const TAU = Math.PI * 2;

/** Radius of the portrait's outer edge in direction `a`. */
export function ovalR(a: number): number {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return (HALF_W * HALF_H) / Math.hypot(HALF_H * c, HALF_W * s);
}

const polar = (a: number, r: number): Pt => [Math.cos(a) * r, Math.sin(a) * r];

function poly(pts: readonly Pt[]): string {
  return 'M' + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join('L') + 'Z';
}

/**
 * How far a spike may reach in direction `a`, as a multiplier. There is little
 * red below the portrait (headline strip) and the title banner covers the top,
 * so the explosion is strongest to the sides.
 */
function reach(a: number): number {
  const s = Math.sin(a); // +1 = straight down
  const c = Math.abs(Math.cos(a));
  if (s > 0) return 0.5 + 0.5 * c;
  return 0.8 + 0.4 * c;
}

/** Tapered stroke (wide at p[0], a point at the end) as a filled path. */
function taper(pts: readonly Pt[], w0: number): string {
  const left: Pt[] = [];
  const right: Pt[] = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0];
    let dy = b[1] - a[1];
    const d = Math.hypot(dx, dy) || 1;
    dx /= d;
    dy /= d;
    const w = (w0 * (1 - i / (n - 1))) / 2;
    left.push([pts[i][0] - dy * w, pts[i][1] + dx * w]);
    right.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
  }
  return poly([...left, ...right.reverse()]);
}

export interface Flap {
  /** Cream underside of the peeled paper. */
  under: string;
  /** Flat offset shadow beneath it. */
  shadow: string;
  /** Red curl along the crease. */
  curl: string;
  /** Fold line across the underside. */
  fold: string;
  /** Crease midpoint, the origin the flap unfolds from. */
  ox: number;
  oy: number;
}

export interface Shard {
  d: string;
  /** Offset from the burst centre it flies out from. */
  x: number;
  y: number;
  r: number;
  kind: 'red' | 'cream';
}

export interface Strand {
  d: string;
  x: number;
  y: number;
  r: number;
}

export interface BurstGeometry {
  hole: string;
  burst: string;
  burstInner: string;
  cracks: string;
  flaps: Flap[];
  rimLines: string;
  loose: string;
  speed: string;
  shards: Shard[];
  strands: Strand[];
}

function buildBurst(): BurstGeometry {
  const rand = mulberry32(90210);
  const span = (a: number, b: number) => a + (b - a) * rand();

  // ---- Torn opening: uneven angles, uneven spike lengths, a few long shards.
  const N = 20;
  const angs: number[] = [];
  let acc = span(0, 1);
  const cuts: number[] = [];
  for (let i = 0; i < N; i++) {
    const w = span(0.55, 1.5);
    cuts.push(w);
  }
  const total = cuts.reduce((s, v) => s + v, 0);
  cuts.forEach((w) => {
    angs.push(acc);
    acc += (w / total) * TAU;
  });

  const longShard = new Set([1, 5, 8, 12, 15, 18]);
  const holePts: Pt[] = [];
  const valleys: { a: number; r: number }[] = [];
  const tips: { a: number; r: number; len: number }[] = [];
  angs.forEach((a, i) => {
    const o = ovalR(a);
    const next = angs[(i + 1) % N] + (i === N - 1 ? TAU : 0);
    const mid = a + (next - a) * span(0.35, 0.65);
    const k = reach(a);
    const spike = longShard.has(i) ? span(0.4, 0.7) : span(0.1, 0.26);
    const r = o * (1.16 + spike * k);
    holePts.push(polar(a, r));
    tips.push({ a, r, len: r - o * 1.16 });
    const vr = o * span(1.12, 1.18);
    holePts.push(polar(mid, vr));
    valleys.push({ a: mid, r: vr });
  });
  const hole = poly(holePts);

  // ---- Peeled flaps: pieces of the red cover folded outward at some valleys.
  const flaps: Flap[] = [];
  const flapAt = [0, 3, 7, 10, 14, 17];
  flapAt.forEach((vi) => {
    const v = valleys[vi % valleys.length];
    const k = reach(v.a);
    const o = ovalR(v.a);
    const half = span(0.075, 0.1) / (o / 50); // half angular width
    const lean = span(-0.22, 0.22);
    const aL = v.a - half;
    const aR = v.a + half;
    const rb = o * 1.12;
    const BL = polar(aL, rb);
    const BR = polar(aR, rb);
    const len = span(11, 16) * Math.max(0.6, k);
    const T = polar(v.a + lean * 0.3, rb + len);
    const ml = polar(aL - 0.015 + lean * 0.12, rb + len * 0.58);
    const mr = polar(aR + 0.02 + lean * 0.12, rb + len * 0.62);
    const under = poly([BL, ml, T, mr, BR]);
    const sh = 1.3;
    const shadow = poly([BL, ml, T, mr, BR].map(([x, y]) => [x + sh, y + sh * 1.6] as Pt));
    // Curl: thin red crescent over the crease.
    const cL = polar(aL, rb - 1);
    const cR = polar(aR, rb - 1);
    const cM = polar(v.a, rb + len * 0.18);
    const curl = `M${f(cL[0])} ${f(cL[1])}Q${f(cM[0])} ${f(cM[1])} ${f(cR[0])} ${f(cR[1])}L${f(
      polar(aR, rb + 2.2)[0],
    )} ${f(polar(aR, rb + 2.2)[1])}Q${f(polar(v.a, rb + len * 0.18 + 3)[0])} ${f(
      polar(v.a, rb + len * 0.18 + 3)[1],
    )} ${f(polar(aL, rb + 2.2)[0])} ${f(polar(aL, rb + 2.2)[1])}Z`;
    const fa = polar(v.a, rb + len * 0.2);
    const fb = polar(v.a + lean * 0.3, rb + len * 0.85);
    const fold = `M${f(fa[0])} ${f(fa[1])}L${f(fb[0])} ${f(fb[1])}`;
    const mid = polar(v.a, rb);
    flaps.push({ under, shadow, curl, fold, ox: mid[0], oy: mid[1] });
  });

  // ---- Energy burst: classic jagged outline, irregular.
  const M = 26;
  const bAngs: number[] = [];
  let bacc = span(0, 1);
  const bw: number[] = [];
  for (let i = 0; i < M; i++) bw.push(span(0.6, 1.4));
  const bt = bw.reduce((s, v) => s + v, 0);
  bw.forEach((w) => {
    bAngs.push(bacc);
    bacc += (w / bt) * TAU;
  });
  const bPts: Pt[] = [];
  const iPts: Pt[] = [];
  bAngs.forEach((a, i) => {
    const o = ovalR(a);
    const next = bAngs[(i + 1) % M] + (i === M - 1 ? TAU : 0);
    const mid = a + (next - a) * span(0.4, 0.6);
    const k = reach(a);
    const long = i % 5 === 1;
    const rt = o * (1.09 + (long ? span(0.1, 0.18) : span(0.04, 0.09)) * k + 0.03);
    bPts.push(polar(a, rt));
    bPts.push(polar(mid, o * span(1.0, 1.04)));
    iPts.push(polar(a, rt * 0.9));
    iPts.push(polar(mid, o * 1.0));
  });
  const burst = poly(bPts);
  const burstInner = poly(iPts);

  // ---- Fracture lines in the red: some follow the web's spokes.
  let cracks = '';
  const crack = (a0: number, len: number, w0: number, wob: number, depth: number, start: number) => {
    const steps = 5 + Math.floor(span(0, 3));
    const pts: Pt[] = [];
    let a = a0;
    let r = start;
    for (let i = 0; i <= steps; i++) {
      pts.push(polar(a, r));
      r += (len / steps) * span(0.75, 1.25);
      a += span(-wob, wob);
    }
    // Stop where the headline strip would swallow the crack anyway.
    const cut = pts.findIndex(([, y]) => y > HALF_H + 8);
    if (cut >= 0) pts.length = Math.max(2, cut);
    if (pts.length < 3) return;
    cracks += taper(pts, w0);
    if (depth > 0) {
      const nb = 1 + Math.floor(span(0, 1.6));
      for (let b = 0; b < nb; b++) {
        const at = 1 + Math.floor(span(0, pts.length - 3));
        const base = pts[at];
        const dir = Math.atan2(pts[at + 1][1] - base[1], pts[at + 1][0] - base[0]) + (rand() < 0.5 ? -1 : 1) * span(0.4, 0.8);
        const bl = len * span(0.25, 0.4);
        const bp: Pt[] = [base];
        let cx = base[0];
        let cy = base[1];
        const bs = 3;
        for (let i = 0; i < bs; i++) {
          const da = dir + span(-0.18, 0.18);
          cx += Math.cos(da) * (bl / bs);
          cy += Math.sin(da) * (bl / bs);
          bp.push([cx, cy]);
        }
        cracks += taper(bp, w0 * 0.7);
      }
    }
  };
  // Tears propagate from the spike tips; where a tip is close to one of the
  // web's spokes the crack follows that spoke exactly (the web snapped there).
  tips.forEach((t, i) => {
    if (i % 2 === 1 && !longShard.has(i)) return;
    let a = t.a;
    let best = 9;
    SPOKE_ANGLES.forEach((sa) => {
      let d = Math.atan2(Math.sin(sa - t.a), Math.cos(sa - t.a));
      d = Math.abs(d);
      if (d < best) {
        best = d;
        if (d < 0.16) a = sa;
      }
    });
    const k = reach(a);
    crack(a, span(16, 36) * k, best < 0.16 ? 2 : 1.6, best < 0.16 ? 0.015 : 0.07, 1, t.r * 0.96);
  });
  // A few extra spoke cracks that start further out, between the tips.
  [3, 9, 15].forEach((i) => {
    const a = SPOKE_ANGLES[i];
    crack(a, span(14, 26) * reach(a), 1.5, 0.02, 0, ovalR(a) * 1.4);
  });

  // ---- Short impact lines just outside the opening and inside the tear.
  let speed = '';
  const sl = 34;
  for (let i = 0; i < sl; i++) {
    const a = (i / sl) * TAU + span(-0.05, 0.05);
    const o = ovalR(a);
    const k = reach(a);
    const r0 = o * span(1.32, 1.5) * Math.max(0.8, k);
    const len = span(5, 11) * k;
    speed += taper([polar(a, r0), polar(a + span(-0.01, 0.01), r0 + len)], 1.1);
  }

  // ---- Rim lines: short dark wedges just inside the hole edge, cream.
  let rimLines = '';
  const rl = 40;
  for (let i = 0; i < rl; i++) {
    const a = (i / rl) * TAU + span(-0.06, 0.06);
    const o = ovalR(a);
    const r0 = o * span(1.06, 1.1);
    const len = o * span(0.1, 0.22) * reach(a);
    rimLines += taper([polar(a, r0 + len), polar(a, r0)], 1.0);
  }

  // ---- Strands snapped right at the tear: short loose ends curling outward.
  let loose = '';
  [0, 3, 6, 9, 12, 15, 18].forEach((i) => {
    const a = SPOKE_ANGLES[i];
    const o = ovalR(a);
    const sgn = i % 2 ? 1 : -1;
    const p0 = polar(a, o * 1.13);
    const out: Pt = [Math.cos(a), Math.sin(a)];
    const perp: Pt = [-out[1] * sgn, out[0] * sgn];
    const l = span(9, 14) * Math.max(0.6, reach(a));
    const c1: Pt = [p0[0] + out[0] * l * 0.5, p0[1] + out[1] * l * 0.5];
    const c2: Pt = [p0[0] + out[0] * l + perp[0] * l * 0.2, p0[1] + out[1] * l + perp[1] * l * 0.2];
    const e: Pt = [p0[0] + out[0] * l * 0.85 + perp[0] * l * 0.55, p0[1] + out[1] * l * 0.85 + perp[1] * l * 0.55];
    loose += `M${f(p0[0])} ${f(p0[1])}C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(e[0])} ${f(e[1])}`;
  });

  // ---- Debris: red paper shards and loose web strands flung outward.
  const shards: Shard[] = [];
  const place = (): Pt | null => {
    // Only the corners of the cover have spare red: stay inside the page,
    // below the title banner, above the headline strip and off the HIRE ME badge.
    for (let t = 0; t < 60; t++) {
      const a = span(0, TAU);
      const o = ovalR(a);
      const p = polar(a, o * span(1.4, 1.75));
      if (Math.abs(p[0]) > 63 || p[1] < -46 || p[1] > 64) continue;
      if (p[0] > 24 && p[1] > 40) continue;
      return p;
    }
    return null;
  };
  for (let i = 0; i < 14; i++) {
    const p = place();
    if (!p) continue;
    const s = span(2.4, 5.2);
    const n = 3 + Math.floor(span(0, 2));
    const pts: Pt[] = [];
    const a0 = span(0, TAU);
    for (let k = 0; k < n; k++) {
      const ak = a0 + (k / n) * TAU + span(-0.4, 0.4);
      const rk = s * span(0.5, 1.2);
      pts.push([p[0] + Math.cos(ak) * rk, p[1] + Math.sin(ak) * rk * 0.8]);
    }
    shards.push({ d: poly(pts), x: p[0], y: p[1], r: span(-120, 120), kind: i % 5 === 3 ? 'cream' : 'red' });
  }
  const strands: Strand[] = [];
  for (let i = 0; i < 7; i++) {
    const p = place();
    if (!p) continue;
    const a = span(0, TAU);
    const l = span(6, 13);
    const bend = span(-0.5, 0.5);
    const p1: Pt = [p[0] + Math.cos(a) * l * 0.5, p[1] + Math.sin(a) * l * 0.5];
    const p2: Pt = [p[0] + Math.cos(a + bend) * l, p[1] + Math.sin(a + bend) * l];
    const d = `M${f(p[0])} ${f(p[1])}Q${f(p1[0] + Math.cos(a + 1.5) * 2)} ${f(p1[1] + Math.sin(a + 1.5) * 2)} ${f(p2[0])} ${f(p2[1])}`;
    strands.push({ d, x: p[0], y: p[1], r: span(-90, 90) });
  }

  return { hole, burst, burstInner, cracks, flaps, rimLines, loose, speed, shards, strands };
}

export const BURST = buildBurst();
