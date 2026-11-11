/**
 * physics - the hanging-book simulation behind WebCatch (no React, no DOM).
 *
 * A direct port of the approved prototype's rope model:
 * - The book is a rigid body (x, y, angle) pulled down by gravity.
 * - Four main ropes run from anchors just outside the screen corners to the
 *   book's visible corners. A rope only pulls when stretched past its rest
 *   length, like silk.
 * - The top pair is cut to exactly the length that carries the book's weight
 *   at its resting pose, so the book hangs level, right where it sits in the
 *   layout. The bottom pair is a little long and droops.
 * - While `falling` there are no ropes yet: the book floats down with gusts.
 * - The visitor can pull the book with the pointer (a grab spring). With the
 *   `?webs=cut` flag they can also cut lines and shoot new ones; with no line
 *   left the book falls off screen and the drop replays.
 *
 * WORLD SPACE: y UP, origin at the rest centre of the visible book, one unit
 * = half a page width = `layout.unit` CSS pixels. Convert with `toScreen`.
 */

import { HOLO } from '../SkillsHologram/holoConfig';
import { ANCHORS, CUT, DIP, DRAG, INTRO, LINE, PHYSICS, RELEASE, WEB_SHAPES, WRAP } from './webConfig';
import { backOut, clamp, damp, cornerWebDef, type CornerWebDef } from './webGeometry';

export type IntroState = 'falling' | 'catching' | 'held';

/** Where a main line is in the page-turn choreography. */
export type LinkState = 'attached' | 'releasing' | 'detached' | 'shooting';

/** Everything needed to map between world units and the screen. */
export interface Layout {
  /** CSS pixels per world unit (half a page width). */
  unit: number;
  /** Screen position (CSS px) of the world origin: the rest centre of the visible book. */
  centerX: number;
  centerY: number;
  /** Viewport size in CSS px. */
  viewW: number;
  viewH: number;
  /** Page height in world units (3 for a 2:3 page). */
  bookH: number;
  /** Phone-sized screen: smaller webs, no wrap, no dragging. */
  compact: boolean;
}

/** Lie-down pose of the book (hologram mode). */
export interface BookPose {
  /** Eased progress 0 (upright) .. 1 (lying flat). */
  p: number;
  from: number;
  to: number;
  /** Time the current ease started and how long it takes. */
  t0: number;
  dur: number;
  /** Where the flat book sits (px offset down) and its scale, derived from the layout. */
  dy: number;
  scale: number;
  /** The ease reached its target (and the event was raised). */
  settled: boolean;
}

export interface Body {
  x: number;
  y: number;
  /** Counter-clockwise on screen, radians. */
  a: number;
  vx: number;
  vy: number;
  va: number;
}

export interface Rope {
  /** One of the four corner lines (false for lines the visitor shot). */
  main: boolean;
  /** Corner signs in world space (y up): -1 left / bottom, +1 right / top. */
  sx: number;
  sy: number;
  /** Anchor just outside the screen edge (world). */
  ax: number;
  ay: number;
  /** Attachment point in the book's local frame. */
  hx: number;
  hy: number;
  /** Rest length: the rope pulls only beyond this. */
  restLength: number;
  /** Time the line was fired (infinity until the drop triggers it). */
  fire: number;
  /** True once the line has reached the book. */
  on: boolean;
  /** Time the line was cut, or null. */
  cutAt: number | null;
  /** The pointer is over this line (`?webs=cut`). */
  hover: boolean;
  /** Vibration amplitude (units). */
  amp: number;
  /** Phase offset of the vibration. */
  seed: number;
  /** The corner web at this rope's book corner (main lines only; extra lines are just a line). */
  def: CornerWebDef | null;
  /** Page-turn state of the line (always `attached` for extra lines). */
  link: LinkState;
  /** Time the line entered its current link state. */
  linkAt: number;
  /** While `detached`: time the line will shoot back (Infinity = not scheduled). */
  reshootAt: number;
  /** Where the line end was (0 anchor .. 1 book corner) when it started releasing or shooting. */
  tipFrom: number;
  /** Time the web starts growing after a re-attach, or null to use the first attach (fire time). */
  webAt: number | null;
}

/** A book-local point, and a pointer position in world space. */
export interface Point {
  x: number;
  y: number;
}

/**
 * Visible left / right edge of the book in its own frame (spine slides from
 * the cover's left edge to the middle as the cover opens). `open` is the cover
 * progress; `close` is the last sheet's progress (it swings onto the left,
 * leaving only the left half visible).
 */
export function bookExtents(open: number, close = 0): { left: number; right: number } {
  const spine = -(1 - open);
  return {
    // Once the cover swings past vertical its tip defines the left edge.
    left: spine + 2 * Math.min(0, Math.cos(Math.PI * open)),
    right: spine + 2 * Math.max(0, Math.cos(Math.PI * close)),
  };
}

export const toScreen = (layout: Layout, x: number, y: number): [number, number] => [
  layout.centerX + x * layout.unit,
  layout.centerY - y * layout.unit,
];

const makeRope = (main: boolean, sx: number, sy: number, def: CornerWebDef | null, seed: number): Rope => ({
  main,
  sx,
  sy,
  ax: 0,
  ay: 0,
  hx: 0,
  hy: 0,
  restLength: 1,
  fire: Infinity,
  on: false,
  cutAt: null,
  hover: false,
  amp: 0,
  seed,
  def,
  link: 'attached',
  linkAt: 0,
  reshootAt: Infinity,
  tipFrom: 1,
  webAt: null,
});

export class HangSim {
  layout: Layout;
  readonly body: Body;
  /** The four main ropes first, then any the visitor shot. */
  ropes: Rope[];
  state: IntroState;
  /** Simulation clock (seconds). */
  tau = 0;
  /** Time the drop triggered the lines, or -1 while still falling. */
  trigger = -1;
  /** Fades 1 -> 0 once the book is held; scales the 3D tumble. */
  tumble: number;
  /** Cover-open progress and last-sheet progress last applied. */
  open = 0;
  close = 0;
  /** 0..1: how much the wrapped strands are drawn (they let go during a page turn). */
  wrapAmt: number;
  /** A page is turning: the wrapped strands are let go. */
  wrapReleased = false;
  /**
   * The book's "pose": lying flat for the hologram mode. `p` eases 0 -> 1 (or back) over a set time;
   * the hook composes `dy`, `scale` and the tilt scaled by `p` into the hanger transform.
   */
  pose: BookPose = { p: 0, from: 0, to: 0, t0: 0, dur: 0, dy: 0, scale: 1, settled: true };
  /** Set when the pose finished easing to its target: the hook reports it, then clears it. */
  poseEvent: 'down' | 'up' | null = null;
  /** Local point of the book being pulled, and where the pointer is (world). */
  grab: Point | null = null;
  pointer: Point = { x: 0, y: 0 };
  private readonly reduced: boolean;
  private heldAt = Infinity;

  constructor(layout: Layout, mode: 'drop' | 'rest', reduced: boolean) {
    this.layout = layout;
    this.reduced = reduced;
    this.ropes = this.makeMainRopes();
    this.body = { x: 0, y: 0, a: 0, vx: 0, vy: 0, va: 0 };
    this.state = 'falling';
    this.tumble = 1;
    this.wrapAmt = layout.compact ? 0 : 1;
    this.layoutChanged();
    if (mode === 'rest') this.startCaught();
    else this.startFalling();
  }

  private makeMainRopes(): Rope[] {
    return ANCHORS.corners.map((c, i) => makeRope(true, c.sx, c.sy, cornerWebDef(WEB_SHAPES[i]), i * 1.7));
  }

  /** Book already hanging, lines fully drawn, nothing moving. */
  private startCaught(): void {
    this.state = 'held';
    this.tumble = 0;
    this.trigger = 0;
    this.tau = 20;
    this.heldAt = 0;
    this.ropes.forEach((r) => {
      r.fire = -100;
      r.on = true;
      r.amp = 0;
    });
  }

  private startFalling(): void {
    const { unit, centerY, bookH } = this.layout;
    const radius = Math.hypot(1, bookH / 2);
    const b = this.body;
    b.x = INTRO.start.x;
    b.y = centerY / unit + radius + INTRO.startClearance;
    b.a = INTRO.start.angle;
    b.vx = INTRO.start.vx;
    b.vy = INTRO.start.vy;
    b.va = INTRO.start.va;
  }

  /** Throw the book back above the screen and replay the drop (all lines were cut). */
  private restartDrop(): void {
    this.ropes = this.makeMainRopes();
    this.layoutChanged();
    this.snapPose(0);
    this.state = 'falling';
    this.trigger = -1;
    this.tumble = 1;
    this.heldAt = Infinity;
    this.grab = null;
    this.startFalling();
  }

  /** Re-derive anchors and rope lengths after the viewport or page size changed. */
  setLayout(layout: Layout): void {
    this.layout = layout;
    this.layoutChanged();
  }

  /** Apply new cover / last-sheet progress (moves the book corners the ropes tie to). */
  setOpen(open: number, close = 0): void {
    if (open === this.open && close === this.close) return;
    this.open = open;
    this.close = close;
    this.updateRest();
  }

  private layoutChanged(): void {
    const { unit, centerX, centerY, viewW, viewH } = this.layout;
    const padX = ANCHORS.overshoot * (viewW / 2);
    const padY = ANCHORS.overshoot * (viewH / 2);
    for (const r of this.ropes) {
      if (!r.main) continue;
      const screenX = r.sx < 0 ? -padX : viewW + padX;
      const screenY = r.sy > 0 ? -padY : viewH + padY;
      r.ax = (screenX - centerX) / unit;
      r.ay = (centerY - screenY) / unit;
    }
    this.computePose();
    this.updateRest();
  }

  /**
   * Re-tie the main ropes to the book's visible corners and recompute rest
   * lengths (prototype `setRest`). The two top ropes are cut so that, with the
   * book at its neutral pose, they carry its weight with no net turning force:
   * when the book is symmetric that is half each; while the cover turns and
   * the corners are lopsided, the tensions are solved so the book does not
   * twist. The bottom ropes are a bit long, so they droop.
   */
  private updateRest(): void {
    const { left, right } = bookExtents(this.open, this.close);
    const halfH = this.layout.bookH / 2;
    const top: { rope: Rope; span: number; ux: number; uy: number }[] = [];
    for (const r of this.ropes) {
      if (!r.main) continue;
      r.hx = (r.sx > 0 ? right : left) * ANCHORS.hub[0];
      r.hy = r.sy * halfH * ANCHORS.hub[1];
      const dx = r.ax - r.hx;
      const dy = r.ay - r.hy;
      const span = Math.hypot(dx, dy) || 1;
      if (r.sy > 0) top.push({ rope: r, span, ux: dx / span, uy: dy / span });
      else r.restLength = span * PHYSICS.slackRopeFactor;
    }

    const weight = PHYSICS.gravity * PHYSICS.mass;
    const tension = top.map((t) => (t.uy > 0.02 ? weight / top.length / t.uy : 0));
    if (top.length === 2) {
      // Vertical balance and zero torque about the book's centre, two unknown tensions.
      const [p, q] = top;
      const turn = (t: (typeof top)[number]) => t.rope.hx * t.uy - t.rope.hy * t.ux;
      const det = p.uy * turn(q) - q.uy * turn(p);
      if (Math.abs(det) > 1e-6) {
        const tp = (weight * turn(q)) / det;
        const tq = (-weight * turn(p)) / det;
        if (tp >= 0 && tq >= 0) {
          tension[0] = tp;
          tension[1] = tq;
        }
      }
    }
    top.forEach((t, i) => {
      const stretch = tension[i] > 0 ? tension[i] / PHYSICS.ropeStiffness : t.span * 0.02;
      t.rope.restLength = Math.max(t.span - stretch, t.span * PHYSICS.minRestFraction);
    });
  }

  /** A book-local point in world space. */
  corner(lx: number, ly: number): [number, number] {
    const b = this.body;
    const c = Math.cos(b.a);
    const s = Math.sin(b.a);
    return [b.x + lx * c - ly * s, b.y + lx * s + ly * c];
  }

  /** The pose's current uniform scale (1 upright). */
  poseScale(): number {
    return 1 + (this.pose.scale - 1) * this.pose.p;
  }

  /**
   * A book-local point (world units, y up) on the screen, in CSS px. Upright this is `corner` + `toScreen`.
   * While the book is posed it follows the same transform chain the hook writes on the hanger -
   * `translate rotate translateY(dy p) rotateX(tilt p) scale(s)` under the scene's perspective, whose origin is
   * the hanger centre (the world origin) - so lines and webs land on the tilted book's real corners.
   */
  cornerPx(lx: number, ly: number): [number, number] {
    const { unit, centerX, centerY } = this.layout;
    const q = this.pose;
    const b = this.body;
    if (q.p <= 1e-4) {
      const [wx, wy] = this.corner(lx, ly);
      return [centerX + wx * unit, centerY - wy * unit];
    }
    const s = this.poseScale();
    const th = (HOLO.pose.tilt * q.p * Math.PI) / 180;
    const x = lx * unit * s;
    const yFlat = -ly * unit * s;
    const y = yFlat * Math.cos(th) + q.dy * q.p;
    const z = yFlat * Math.sin(th);
    const phi = -b.a;
    const c = Math.cos(phi);
    const sn = Math.sin(phi);
    const x2 = x * c - y * sn + b.x * unit;
    const y2 = x * sn + y * c - b.y * unit;
    const f = HOLO.pose.perspective / (HOLO.pose.perspective - z);
    return [centerX + x2 * f, centerY + y2 * f];
  }

  /** A rope's screen anchor in CSS px. */
  anchorPx(r: Rope): [number, number] {
    return toScreen(this.layout, r.ax, r.ay);
  }

  /** A world point in the book's local frame. */
  toLocal(wx: number, wy: number): [number, number] {
    const b = this.body;
    const c = Math.cos(-b.a);
    const s = Math.sin(-b.a);
    const dx = wx - b.x;
    const dy = wy - b.y;
    return [dx * c - dy * s, dx * s + dy * c];
  }

  /** Screen position (CSS px) to world units. */
  screenToWorld(px: number, py: number): Point {
    const { unit, centerX, centerY } = this.layout;
    return { x: (px - centerX) / unit, y: (centerY - py) / unit };
  }

  /** 0..1 progress of a line's cut animation (0 = intact). */
  cutProgress(r: Rope): number {
    return r.cutAt === null ? 0 : clamp((this.tau - r.cutAt) / CUT.retractTime, 0, 1);
  }

  private isLive(r: Rope): boolean {
    return r.on && r.cutAt === null;
  }

  /** Number of lines holding the book (reached it and not cut). */
  holding(): number {
    let n = 0;
    for (const r of this.ropes) if (this.isLive(r)) n++;
    return n;
  }

  /** Number of the four main lines currently attached to the book (not let go for a page turn, not cut). */
  holdingMain(): number {
    let n = 0;
    for (const r of this.ropes) if (r.main && this.isLive(r) && r.link === 'attached') n++;
    return n;
  }

  /** Is the lie-down pose in effect (or on its way in)? */
  poseActive(): boolean {
    return this.pose.p > 1e-4 || this.pose.to > 0;
  }

  /** Start easing the pose toward lying flat (1) or upright (0). */
  setPose(target: 0 | 1, duration: number): void {
    const q = this.pose;
    if (q.settled && q.to === target) return;
    q.from = q.p;
    q.to = target;
    q.t0 = this.tau;
    q.dur = Math.max(0.01, duration * Math.abs(target - q.p));
    q.settled = false;
    this.poseEvent = null;
  }

  /** Jump straight to a pose with no animation. */
  snapPose(target: 0 | 1): void {
    const q = this.pose;
    q.p = q.from = q.to = target;
    q.settled = true;
    this.poseEvent = null;
  }

  private stepPose(): void {
    const q = this.pose;
    if (q.settled) return;
    const t = clamp((this.tau - q.t0) / q.dur, 0, 1);
    const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    q.p = q.from + (q.to - q.from) * e;
    if (t >= 1) {
      q.p = q.to;
      q.settled = true;
      this.poseEvent = q.to === 1 ? 'down' : 'up';
    }
  }

  /**
   * Where the flat book sits so the whole open spread stays on screen: it is lowered until its near
   * edge is `bottomMargin` above the viewport bottom, and scaled down until it fits the width and
   * takes at most `maxHeight` of the viewport height. Uses the scene perspective like the browser does.
   */
  private computePose(): void {
    const { unit, centerY, viewW, viewH, bookH } = this.layout;
    const P = HOLO.pose;
    const theta = (P.tilt * Math.PI) / 180;
    const d = P.perspective;
    const pageH = bookH * unit;
    const spreadW = 4 * unit;
    const target = viewH - P.bottomMargin - centerY;
    let scale = 1;
    let dy = 0;
    for (scale = 1; scale >= P.minScale; scale -= 0.01) {
      const hb = (scale * pageH) / 2;
      const zb = hb * Math.sin(theta);
      const near = d / (d - zb);
      const far = d / (d + zb);
      dy = target / near - hb * Math.cos(theta);
      const bottom = (dy + hb * Math.cos(theta)) * near;
      const top = (dy - hb * Math.cos(theta)) * far;
      if (spreadW * scale * near <= viewW - 2 * P.sideMargin && bottom - top <= P.maxHeight * viewH) break;
    }
    this.pose.dy = dy;
    this.pose.scale = Math.max(scale, P.minScale);
  }

  /**
   * A page started turning from `side`: the two corners on that side let go. The ropes keep
   * carrying the book (only the drawing lets go), and the book sags a little toward that side.
   */
  releaseSide(side: 'left' | 'right', reaction = true): void {
    if (this.reduced || this.trigger < 0) return;
    const sign = side === 'right' ? 1 : -1;
    let any = false;
    for (const r of this.ropes) {
      if (!r.main || r.sx !== sign || r.cutAt !== null || !r.on) continue;
      r.reshootAt = Infinity;
      if (r.link === 'attached' || r.link === 'shooting') {
        r.tipFrom = this.tipProgress(r);
        r.link = 'releasing';
        r.linkAt = this.tau;
        r.amp = Math.max(r.amp, RELEASE.whipAmplitude);
        any = true;
      }
    }
    if (any && reaction && !this.grab) {
      this.body.vy -= RELEASE.sag.velocity;
      // Toward the released side: the right side dropping turns the book clockwise.
      this.body.va -= sign * RELEASE.sag.tilt;
    }
  }

  /** Make sure every corner that is let go shoots back (corner order, a short stagger). */
  reattachAll(): void {
    if (this.reduced) return;
    this.ropes.forEach((r, i) => {
      if (!r.main || r.cutAt !== null) return;
      if (r.link === 'detached' && r.reshootAt === Infinity) {
        r.reshootAt = this.tau + i * RELEASE.allStagger;
      } else if (r.link === 'releasing' && r.reshootAt === Infinity) {
        r.reshootAt = this.tau + i * RELEASE.allStagger;
      }
    });
  }

  /** The page landed on the `side` it left: its corners shoot back, the top one first. */
  reattachSide(side: 'left' | 'right'): void {
    if (this.reduced) return;
    const sign = side === 'right' ? 1 : -1;
    for (const r of this.ropes) {
      if (!r.main || r.sx !== sign || r.cutAt !== null || r.link === 'attached' || r.link === 'shooting') continue;
      r.link = 'detached';
      r.reshootAt = this.tau + (r.sy > 0 ? RELEASE.topDelay : RELEASE.bottomDelay);
    }
  }

  /** How far a line's end reaches (0 at its screen anchor .. 1 at the book corner). */
  tipProgress(r: Rope): number {
    const t = this.tau - r.linkAt;
    switch (r.link) {
      case 'releasing': {
        const eased = backOut(t / RELEASE.retract, RELEASE.whip);
        return RELEASE.recoil + (r.tipFrom - RELEASE.recoil) * (1 - eased);
      }
      case 'detached':
        return RELEASE.recoil;
      case 'shooting': {
        const k = Math.pow(clamp(t / RELEASE.shot, 0, 1), LINE.shotPower);
        return r.tipFrom + (1 - r.tipFrom) * k;
      }
      default:
        return Math.pow(clamp((this.tau - r.fire) / INTRO.shot, 0, 1), LINE.shotPower);
    }
  }

  /** 1 while a line is attached, falling to 0 as its web folds up on release; 0 while it is let go. */
  linkFold(r: Rope): number {
    if (r.link === 'attached') return 1;
    if (r.link === 'releasing') return 1 - clamp((this.tau - r.linkAt) / RELEASE.fold, 0, 1);
    return 0;
  }

  /** Seconds the corner web's growth takes (first weave or the quick regrow after a re-attach). */
  webTiming(r: Rope): typeof WRAP | typeof WRAP.quick {
    return r.webAt === null ? WRAP : WRAP.quick;
  }

  /** Time the corner web started to grow. */
  webStart(r: Rope): number {
    return r.webAt ?? r.fire + INTRO.shot + INTRO.hold;
  }

  /** Make every live line vibrate (a page landed, something plucked them). */
  twang(amplitude: number = LINE.twangAmplitude): void {
    if (this.reduced) return;
    for (const r of this.ropes) if (this.isLive(r)) r.amp = Math.max(r.amp, amplitude);
  }

  /** A page landed: the book dips and tilts a little and the lines vibrate. */
  land(direction: 'forward' | 'backward'): void {
    if (this.reduced || this.state !== 'held' || this.grab) return;
    this.body.vy -= DIP.velocity;
    this.body.va += (direction === 'forward' ? 1 : -1) * DIP.tilt;
    this.twang(DIP.amplitude);
  }

  /** Let the wrapped strands go (a page is turning) or snap them back on. */
  setWrapReleased(released: boolean): void {
    this.wrapReleased = released;
  }

  /** Start pulling the book by the point under the pointer. */
  beginGrab(pointer: Point): void {
    const [lx, ly] = this.toLocal(pointer.x, pointer.y);
    this.grab = { x: lx, y: ly };
    this.pointer = pointer;
  }

  /** Let go: the book bounces back and the lines vibrate. */
  endGrab(): void {
    if (!this.grab) return;
    this.grab = null;
    this.twang(DRAG.releaseAmplitude);
  }

  /** True when the world point lies on the visible book. */
  insideBook(pointer: Point): boolean {
    const { left, right } = bookExtents(this.open, this.close);
    if (this.pose.p > 1e-4) {
      // Lying flat: test against the projected quad of the book.
      const halfH = this.layout.bookH / 2;
      const quad = [
        this.cornerPx(left, halfH),
        this.cornerPx(right, halfH),
        this.cornerPx(right, -halfH),
        this.cornerPx(left, -halfH),
      ];
      const [px, py] = toScreen(this.layout, pointer.x, pointer.y);
      let inside = false;
      for (let i = 0, j = quad.length - 1; i < quad.length; j = i++) {
        const [xi, yi] = quad[i];
        const [xj, yj] = quad[j];
        if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
      }
      return inside;
    }
    const [lx, ly] = this.toLocal(pointer.x, pointer.y);
    return lx >= left && lx <= right && Math.abs(ly) <= this.layout.bookH / 2;
  }

  /** The live line closest to the pointer, if within picking range (and not over the book). */
  nearestRope(pointer: Point): Rope | null {
    if (this.insideBook(pointer)) return null;
    let best: Rope | null = null;
    const { unit } = this.layout;
    let bestDist: number = CUT.pickRadius * unit;
    const [qx, qy] = toScreen(this.layout, pointer.x, pointer.y);
    for (const r of this.ropes) {
      if (!this.isLive(r) || r.link !== 'attached') continue;
      const [ax, ay] = this.anchorPx(r);
      const [cx, cy] = this.cornerPx(r.hx, r.hy);
      const dx = cx - ax;
      const dy = cy - ay;
      const t = clamp(((qx - ax) * dx + (qy - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1);
      const d = Math.hypot(qx - ax - dx * t, qy - ay - dy * t);
      if (d < bestDist) {
        bestDist = d;
        best = r;
      }
    }
    return best;
  }

  /** Mark which line the pointer is over. */
  setHover(rope: Rope | null): boolean {
    let changed = false;
    for (const r of this.ropes) {
      const h = r === rope;
      if (r.hover !== h) changed = true;
      r.hover = h;
    }
    return changed;
  }

  /** Cut a line: it retracts, and the others shiver. */
  cut(rope: Rope): void {
    rope.cutAt = this.tau;
    rope.hover = false;
    for (const r of this.ropes) if (this.isLive(r)) r.amp = Math.max(r.amp, CUT.neighbourAmplitude);
  }

  /** Fire a new line from the nearest screen edge at a click outside the book. */
  shoot(screenX: number, screenY: number): void {
    if (this.trigger < 0 || this.ropes.filter((r) => !r.main).length >= CUT.maxExtra) return;
    const { unit, centerX, centerY, viewW, viewH } = this.layout;
    const padX = ANCHORS.overshoot * (viewW / 2);
    const padY = ANCHORS.overshoot * (viewH / 2);
    const edges = [screenX, viewW - screenX, screenY, viewH - screenY];
    const nearest = edges.indexOf(Math.min(...edges));
    const ex = nearest === 0 ? -padX : nearest === 1 ? viewW + padX : screenX;
    const ey = nearest === 2 ? -padY : nearest === 3 ? viewH + padY : screenY;

    const pointer = this.screenToWorld(screenX, screenY);
    const [lx, ly] = this.toLocal(pointer.x, pointer.y);
    const { left, right } = bookExtents(this.open, this.close);
    const halfW = lx >= 0 ? right : -left;
    const k =
      Math.min(halfW / (Math.abs(lx) || 1e-6), this.layout.bookH / 2 / (Math.abs(ly) || 1e-6)) * CUT.extraReach;
    const rope = makeRope(false, Math.sign(lx) || 1, Math.sign(ly) || 1, null, this.tau);
    rope.ax = (ex - centerX) / unit;
    rope.ay = (centerY - ey) / unit;
    rope.hx = lx * k;
    rope.hy = ly * k;
    rope.fire = this.tau;
    this.ropes.push(rope);
  }

  /** True when nothing is moving: the caller can skip stepping and drawing. */
  isAtRest(): boolean {
    if (this.state !== 'held' || this.grab || this.holding() === 0) return false;
    const b = this.body;
    const t = PHYSICS.rest;
    if (
      Math.abs(b.x) > t.position ||
      Math.abs(b.y) > t.position ||
      Math.abs(b.a) > t.angle ||
      Math.abs(b.vx) > t.velocity ||
      Math.abs(b.vy) > t.velocity ||
      Math.abs(b.va) > t.angularVelocity
    ) {
      return false;
    }
    const wrapTarget = this.wrapTarget();
    if (!this.pose.settled) return false;
    return (
      Math.abs(this.wrapAmt - wrapTarget) < 0.01 &&
      this.tumble < 0.001 &&
      this.ropes.every((r) => r.amp < t.amplitude && (r.cutAt !== null ? this.cutProgress(r) >= 1 : this.linkSettled(r)))
    );
  }

  /**
   * Has everything drawn for this line finished moving? Only the main lines carry a corner web,
   * and phones draw none; the web is done once its spokes and last ring have grown.
   */
  private webSettled(r: Rope): boolean {
    if (!r.main || !r.def || this.layout.compact) return true;
    const w = this.webTiming(r);
    const growTime = Math.max(w.growDuration, w.ringDelay + (r.def.rings.length - 1) * w.ringStagger + w.ringDuration);
    return this.tau >= this.webStart(r) + growTime;
  }

  /** A line is settled when attached and its web has grown, or let go with nothing scheduled. */
  private linkSettled(r: Rope): boolean {
    if (r.link === 'attached') return this.webSettled(r);
    return r.link === 'detached' && r.reshootAt === Infinity;
  }

  private wrapTarget(): number {
    // The on-page overlap also folds away while the book lies flat: the front canvas sits above the hologram,
    // so a web on the page would cross towers and labels. The outside part of each web stays (back canvas).
    return this.wrapReleased || this.layout.compact || this.pose.to > 0 ? 0 : 1;
  }

  /** Put a settled book exactly at its resting pose (so the transform can be dropped). */
  snapToRest(): void {
    const b = this.body;
    b.x = b.y = b.a = b.vx = b.vy = b.va = 0;
    this.ropes.forEach((r) => (r.amp = 0));
    this.tumble = 0;
    this.wrapAmt = this.wrapTarget();
  }

  /** Advance the whole intro and the physics by `dt` seconds. */
  step(dt: number): void {
    this.tau += dt;
    const b = this.body;

    if (this.trigger < 0 && b.y < INTRO.triggerHeight) {
      this.trigger = this.tau;
      this.state = 'catching';
      this.ropes.forEach((r, i) => (r.fire = this.tau + i * INTRO.stagger));
      this.heldAt = this.tau + (ANCHORS.corners.length - 1) * INTRO.stagger + INTRO.shot + INTRO.settleDelay;
    }

    for (const r of this.ropes) {
      if (!r.on && this.tau >= r.fire + INTRO.shot) {
        r.on = true;
        r.amp = this.reduced ? 0 : LINE.attachAmplitude;
        if (!r.main) {
          const [cx, cy] = this.corner(r.hx, r.hy);
          r.restLength = Math.hypot(r.ax - cx, r.ay - cy) * CUT.extraRestFraction;
        }
      }
      r.amp *= Math.exp(-LINE.amplitudeDecay * dt);
    }
    for (const r of this.ropes) this.stepLink(r);
    // Cut lines that finished retracting are dropped (the main four stay, cut, until the drop replays).
    if (this.ropes.some((r) => !r.main && this.cutProgress(r) >= 1)) {
      this.ropes = this.ropes.filter((r) => r.main || this.cutProgress(r) < 1);
    }

    if (this.state === 'catching' && this.tau >= this.heldAt) {
      this.state = 'held';
      // The 3D tumble must be exactly gone once clicks are accepted: any leftover rotateX/Y
      // makes the browser's hit test flip between the click zone and the artwork under it.
      this.tumble = 0;
    }

    const h = dt / PHYSICS.substeps;
    for (let i = 0; i < PHYSICS.substeps; i++) this.integrate(h);

    const target = this.trigger < 0 || this.holding() === 0 ? 1 : 0;
    this.tumble = damp(this.tumble, target, INTRO.tumbleFade, dt);
    this.wrapAmt = damp(this.wrapAmt, this.wrapTarget(), this.wrapReleased ? WRAP.releaseRate : WRAP.restoreRate, dt);
    this.stepPose();

    // Every line cut: the book has fallen off the bottom of the screen, so drop it in again.
    if (this.trigger >= 0 && this.holding() === 0 && this.ropes.every((r) => !r.main || r.cutAt !== null)) {
      const { unit, centerY, viewH, bookH } = this.layout;
      const bottom = -(viewH - centerY) / unit - Math.hypot(1, bookH / 2) * 1.2;
      if (b.y < bottom) this.restartDrop();
    }
  }

  /** Advance a main line through releasing -> detached -> shooting -> attached. */
  private stepLink(r: Rope): void {
    if (r.link === 'releasing' && this.tau - r.linkAt >= RELEASE.retract) {
      r.link = 'detached';
      r.linkAt = this.tau;
    }
    if (r.link === 'detached' && this.tau >= r.reshootAt) {
      r.link = 'shooting';
      r.linkAt = this.tau;
      r.tipFrom = RELEASE.recoil;
      r.reshootAt = Infinity;
    }
    if (r.link === 'shooting' && this.tau - r.linkAt >= RELEASE.shot) {
      r.link = 'attached';
      r.linkAt = this.tau;
      r.webAt = this.tau + RELEASE.hold;
      r.amp = Math.max(r.amp, RELEASE.hitAmplitude);
      if (!this.grab) {
        this.body.vy += RELEASE.hit.velocity;
        this.body.va += r.sx * RELEASE.hit.tilt;
      }
    }
  }

  private integrate(dt: number): void {
    const b = this.body;
    const P = PHYSICS;
    let fx = 0;
    let fy = -P.gravity * P.mass;
    let torque = 0;
    let n = 0;

    for (const r of this.ropes) {
      if (!this.isLive(r)) continue;
      n++;
      const [cx, cy] = this.corner(r.hx, r.hy);
      const dx = r.ax - cx;
      const dy = r.ay - cy;
      const d = Math.hypot(dx, dy) || 1;
      const stretch = d - r.restLength;
      if (stretch <= 0) continue;
      const f = P.ropeStiffness * stretch;
      const Fx = (dx / d) * f;
      const Fy = (dy / d) * f;
      fx += Fx;
      fy += Fy;
      torque += (cx - b.x) * Fy - (cy - b.y) * Fx;
    }

    if (this.grab) {
      const [gx, gy] = this.corner(this.grab.x, this.grab.y);
      const Fx = DRAG.stiffness * (this.pointer.x - gx);
      const Fy = DRAG.stiffness * (this.pointer.y - gy);
      fx += Fx;
      fy += Fy + P.gravity * P.mass;
      torque += (gx - b.x) * Fy - (gy - b.y) * Fx;
    }

    if (this.trigger < 0) {
      const g = P.fallGust;
      fx += Math.cos(this.tau * g.forceRate) * g.force - P.fallDrag.x * b.vx;
      fy += -P.fallDrag.y * b.vy;
      torque += Math.sin(this.tau * g.torqueRate) * g.torque - P.fallDrag.angular * b.va;
    } else if (n && !this.reduced) {
      fx += Math.sin(this.tau * 0.7) * P.heldGust.force;
      torque += Math.sin(this.tau * 0.9) * P.heldGust.torque;
    }

    b.vx += (fx / P.mass) * dt;
    b.vy += (fy / P.mass) * dt;
    b.va += (torque / P.inertia) * dt;
    if (n || this.grab) {
      const lin = Math.exp(-(this.grab ? DRAG.damping : P.heldLinearDamping) * dt);
      b.vx *= lin;
      b.vy *= lin;
      b.va *= Math.exp(-(this.grab ? DRAG.damping : P.heldAngularDamping) * dt);
    }
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.a += b.va * dt;
  }
}
