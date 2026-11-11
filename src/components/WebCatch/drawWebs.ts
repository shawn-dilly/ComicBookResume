/**
 * drawWebs - Canvas 2D drawing for the web catch lines and corner webs.
 *
 * Mirrors the prototype's drawing: every strand is a wide, faint "halo"
 * stroke under a thin, bright strand stroke. Strokes are collected into
 * batches by width and stroked as one path each, so overlapping strands do
 * not stack their transparency.
 *
 * What is drawn:
 * - the four lines from the screen corners to the book corners (plus any line
 *   the visitor shot with `?webs=cut`), on the back canvas.
 * - a spider web at each book corner. Its hub sits out on the line, a little
 *   before the book, and its spokes fan toward the book and end on the page
 *   (the two outer spokes land on the book edges); scalloped rings cross the
 *   wedge, some outside the book and some on the page. The whole web is drawn
 *   on the back canvas (the book hides the part under it, and it stays put
 *   while a page turns); the same web is drawn again on the front canvas,
 *   clipped to the visible book face, so only the overlap shows on the page.
 *   That front overlap collapses while a page turns and regrows on landing.
 * - page turns: a line that lets go snaps back toward its screen anchor and its
 *   web folds into the hub; on re-attach the line shoots back and the web
 *   regrows with the quick timings.
 * - growth: after the line attaches, spokes grow out of the hub toward the
 *   book, then the rings weave from the hub outward. A cut line takes its web
 *   with it, shrinking toward the hub.
 *
 * Geometry is built directly in CSS pixels: the book's corners and every web point come from
 * `sim.cornerPx`, which follows the book through the physics pose AND the hologram's lie-down tilt (a
 * perspective projection, see physics.ts), so lines and webs stay attached to the real, tilted corners.
 * Lengths that are authored in world units (hub distance, droop, vibration) are multiplied by
 * `layout.unit` (and the pose scale where it shrinks the book). Draw targets are scaled by the device
 * pixel ratio by the caller.
 */

import { bookExtents, type HangSim, type Layout, type Rope } from './physics';
import { LINE, STROKE, WRAP } from './webConfig';
import { backOut, clamp } from './webGeometry';

export interface WebColors {
  strand: string;
  halo: string;
}

interface StrokeStyle {
  color: string;
  px: number;
}

/** Collects segments (in CSS px) grouped by width weight. */
class SegmentBatch {
  private readonly buckets = new Map<number, number[]>();

  /** Add a segment given in CSS px; `weight` scales its stroke width. */
  seg(ax: number, ay: number, bx: number, by: number, weight: number): void {
    let list = this.buckets.get(weight);
    if (!list) {
      list = [];
      this.buckets.set(weight, list);
    }
    list.push(ax, ay, bx, by);
  }

  /** Stroke everything: halos first, then strands on top. */
  stroke(ctx: CanvasRenderingContext2D, halo: StrokeStyle, strand: StrokeStyle): void {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const style of [halo, strand]) {
      ctx.strokeStyle = style.color;
      for (const [weight, pts] of this.buckets) {
        ctx.lineWidth = style.px * weight;
        ctx.beginPath();
        for (let i = 0; i < pts.length; i += 4) {
          ctx.moveTo(pts[i], pts[i + 1]);
          ctx.lineTo(pts[i + 2], pts[i + 3]);
        }
        ctx.stroke();
      }
    }
  }
}

/** Where a line is drawn (CSS px): `at(s)` is the point `s` (0 anchor .. 1 end of the line) including vibration and droop. */
interface LinePath {
  at(s: number): [number, number];
  weight: number;
  /** Straight distance from the anchor to the book corner (px). */
  span: number;
}

function linePath(sim: HangSim, rope: Rope, progress: number, asAttached = false): LinePath {
  const { unit } = sim.layout;
  const [ax, ay] = sim.anchorPx(rope);
  const [cx, cy] = sim.cornerPx(rope.hx, rope.hy);
  const tx = ax + (cx - ax) * progress;
  const ty = ay + (cy - ay) * progress;
  const len = Math.hypot(tx - ax, ty - ay) || 1;
  const nx = -(ty - ay) / len;
  const ny = (tx - ax) / len;
  const live = rope.on && rope.cutAt === null;
  // Droop belongs to the whole line to the corner (measured on the book's own pose, so it stays the same
  // gentle sag when the book lies flat); a line that is only partly out droops in proportion.
  const [wcx, wcy] = sim.corner(rope.hx, rope.hy);
  const full = Math.hypot(wcx - rope.ax, wcy - rope.ay) || 1;
  const droopScale = asAttached || rope.link === 'attached' ? 1 : progress;
  const slack =
    live && rope.restLength > full
      ? Math.min(Math.sqrt(rope.restLength * rope.restLength - full * full) * LINE.droop.factor, LINE.droop.max) *
        droopScale *
        unit
      : 0;
  const amp = rope.amp * unit;
  return {
    weight: STROKE.weight.line * (rope.hover ? STROKE.hoverWeight : 1),
    span: Math.hypot(cx - ax, cy - ay) || 1,
    at(s) {
      const wobble = amp * Math.sin(Math.PI * s) * Math.sin(sim.tau * LINE.vibrationRate + rope.seed);
      return [ax + (tx - ax) * s + nx * wobble, ay + (ty - ay) * s + ny * wobble + slack * Math.sin(Math.PI * s)];
    },
  };
}

/** The line from the screen edge to the book corner, with droop, vibration and cutting. */
function drawLine(batch: SegmentBatch, sim: HangSim, rope: Rope, progress: number): void {
  const path = linePath(sim, rope, progress);
  const cut = sim.cutProgress(rope);
  const gap = cut * 0.5;
  let [px, py] = path.at(0);
  for (let i = 1; i <= LINE.segments; i++) {
    const s = i / LINE.segments;
    const [x, y] = path.at(s);
    // A cut line parts in the middle and the gap grows until nothing is left.
    const inGap = cut > 0 && s > 0.5 - gap && s - 1 / LINE.segments < 0.5 + gap;
    if (!inGap) batch.seg(px, py, x, y, path.weight);
    px = x;
    py = y;
  }
}

/** How far a rope's corner web has grown. */
interface WrapGrowth {
  /** Spoke extension (back-out ease, 0..~1.1): how far along hub-to-end the spokes reach. */
  extent: number;
  /** Amount of the web present (1 full; falls while a page turns for the on-page part, and on a cut). */
  amount: number;
  /** Seconds since the line attached and its HOLD beat passed (the web's first growth). */
  age: number;
  /** Growth timings in use (first weave or the quick regrow after a re-attach). */
  timing: { ringDelay: number; ringStagger: number; ringDuration: number };
}

/**
 * Growth of a main line's corner web, or null if it is not visible (yet). `amount` is how much of
 * the web is present: the back web only fades with a cut, the front overlap also releases in a turn.
 */
function wrapGrowth(sim: HangSim, rope: Rope, wrap: number): WrapGrowth | null {
  if (!rope.main || !rope.def) return null;
  const age = sim.tau - sim.webStart(rope);
  if (age < 0) return null;
  const amount = wrap * (1 - sim.cutProgress(rope)) * sim.linkFold(rope);
  const w = sim.webTiming(rope);
  const extent = backOut(age / w.growDuration, WRAP.backOvershoot) * Math.min(1, amount / WRAP.spokesFullAt);
  if (extent < WRAP.minVisible) return null;
  return { extent, amount, age, timing: w };
}

/**
 * How much of ring `k` is woven: the first-time weave runs outward from the hub
 * over time; after a page turn the rings re-weave as the amount climbs back.
 */
function ringWeave(g: WrapGrowth, k: number): number {
  const t = g.timing;
  const first = clamp((g.age - t.ringDelay - k * t.ringStagger) / t.ringDuration, 0, 1);
  const r = WRAP.regrow;
  return first * clamp((g.amount - r.from - k * r.step) / r.span, 0, 1);
}

type Pt = [number, number];

/**
 * Point on the book face at distance `r` (world units) from the corner and angle `theta`
 * (0 along the horizontal edge, PI/2 along the vertical edge), in CSS px.
 */
function facePoint(sim: HangSim, rope: Rope, r: number, theta: number): Pt {
  return sim.cornerPx(rope.hx - rope.sx * r * Math.cos(theta), rope.hy - rope.sy * r * Math.sin(theta));
}

const along = (from: Pt, to: Pt, t: number): Pt => [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t];

/** Scalloped arc between two points, sagging toward `hub`, drawn up to `part` (0..1). */
function addScallop(
  batch: SegmentBatch,
  p0: [number, number],
  p1: [number, number],
  hub: [number, number],
  sag: number,
  part: number,
  weight: number
): void {
  const mx = (p0[0] + p1[0]) / 2;
  const my = (p0[1] + p1[1]) / 2;
  const qx = mx + (hub[0] - mx) * sag;
  const qy = my + (hub[1] - my) * sag;
  let px = p0[0];
  let py = p0[1];
  for (let t = 1; t <= WRAP.ringSteps; t++) {
    const u = (t / WRAP.ringSteps) * part;
    const v = 1 - u;
    const x = v * v * p0[0] + 2 * v * u * qx + u * u * p1[0];
    const y = v * v * p0[1] + 2 * v * u * qy + u * u * p1[1];
    batch.seg(px, py, x, y, weight);
    px = x;
    py = y;
  }
}

/**
 * The hub of a rope's web: a point on the line, `hubOut` before the book corner. The distance is measured
 * along the line in screen px and shrinks with the pose scale, so a lying book keeps the same proportions.
 */
function webHub(sim: HangSim, rope: Rope, hubOut: number): Pt {
  const path = linePath(sim, rope, 1, true);
  return path.at(1 - (hubOut * sim.layout.unit * sim.poseScale()) / path.span);
}

/**
 * A corner web: spokes from the hub on the line to their ends on the book face, and scalloped
 * rings between adjacent spokes at fractions of the spoke length, each sagging toward the hub.
 * `wrap` is how much of the web is present (see wrapGrowth).
 */
function drawWeb(batch: SegmentBatch, sim: HangSim, rope: Rope, wrap: number): void {
  const g = wrapGrowth(sim, rope, wrap);
  if (!g || !rope.def) return;
  const web = rope.def;
  const hub = webHub(sim, rope, web.hubOut);
  const ends = web.angles.map((theta, i) => facePoint(sim, rope, web.outer * web.reach[i], theta));
  ends.forEach((end) => {
    const tip = along(hub, end, g.extent);
    batch.seg(hub[0], hub[1], tip[0], tip[1], STROKE.weight.spoke);
  });
  const gaps = ends.length - 1;
  web.rings.forEach((fraction, k) => {
    const sweep = ringWeave(g, k) * gaps;
    for (let j = 0; j < gaps; j++) {
      const part = clamp(sweep - j, 0, 1);
      if (part <= 0) continue;
      addScallop(
        batch,
        along(hub, ends[j], fraction * g.extent),
        along(hub, ends[j + 1], fraction * g.extent),
        hub,
        WRAP.ringSag,
        part,
        STROKE.weight.ring
      );
    }
  });
}

/** Clear a canvas that is already scaled to CSS pixels. */
export function clearCanvas(ctx: CanvasRenderingContext2D, layout: Layout): void {
  ctx.clearRect(0, 0, layout.viewW, layout.viewH);
}

/**
 * Draw the lines and the whole corner webs onto the back canvas. They sit behind the book because
 * the canvas is under the book's stacking layer, so the part of a web under the book is hidden.
 */
export function drawBackLayer(ctx: CanvasRenderingContext2D, sim: HangSim, colors: WebColors): void {
  clearCanvas(ctx, sim.layout);
  const batch = new SegmentBatch();
  for (const rope of sim.ropes) {
    const elapsed = sim.tau - rope.fire;
    if (elapsed < 0 || sim.cutProgress(rope) >= 1) continue;
    drawLine(batch, sim, rope, sim.tipProgress(rope));
    if (!sim.layout.compact) drawWeb(batch, sim, rope, 1);
  }
  batch.stroke(ctx, { color: colors.halo, px: STROKE.haloPx }, { color: colors.strand, px: STROKE.strandPx });
}

/**
 * Front canvas: the same webs again, clipped to the visible book face so only the overlap with the
 * page shows. This part releases while a page turns and regrows on landing.
 */
export function drawFrontLayer(ctx: CanvasRenderingContext2D, sim: HangSim, colors: WebColors): void {
  clearCanvas(ctx, sim.layout);
  if (sim.wrapAmt < WRAP.minVisible) return;
  const batch = new SegmentBatch();
  for (const rope of sim.ropes) drawWeb(batch, sim, rope, sim.wrapAmt);
  const { left, right } = bookExtents(sim.open, sim.close);
  const halfH = sim.layout.bookH / 2;
  ctx.save();
  ctx.beginPath();
  [
    [left, halfH],
    [right, halfH],
    [right, -halfH],
    [left, -halfH],
  ].forEach(([lx, ly], i) => {
    const [x, y] = sim.cornerPx(lx, ly);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.clip();
  batch.stroke(ctx, { color: colors.halo, px: STROKE.haloPx }, { color: colors.strand, px: STROKE.strandPx });
  ctx.restore();
}
