import { useEffect, useRef, useSyncExternalStore } from 'react';
import gsap from 'gsap';

import HeroFigure from './HeroFigure';
import { ART, type Pose } from './heroArt';
import { FLYBY } from './heroConfig';
import styles from './HeroFlyby.module.css';

/**
 * HeroFlyby - the Iron Architect flies across the page background, left to right and back again, forever.
 *
 * Layering: a fixed layer under the book and under the back web canvas (see the CSS). It never takes input.
 * Motion: one GSAP timeline per pass drives a few numbers; each frame writes one transform on the hero (position and
 * mirror) and one rotation per visible pose, and nothing else, so there is no React state and no layout work while he flies.
 * Every pass draws its own lane, size (depth), speed and curve. Mirrored (scaleX -1) for right to left.
 *
 * Art: four panel-style cut-outs (rise, hover, climb, fly), all hung from the chest so a swap never slides him, and each
 * rotated so its drawn body axis follows the path. A plain cross is the level prone "fly" art, rotated only by a capped
 * bank. A rise pass is: rise (upright, straight up from below the bottom edge beside the book) -> hover -> climb (a short
 * launch curve up and forward, in the 45 degree art) -> fly once the path has levelled out to about 23 degrees -> cross.
 * About one pass in five adds a climb-and-dive swoop (climb art on the way up, fly art rotated down on the way back).
 * Hologram: he keeps flying while the Powers hologram is up, but a lane is only accepted if it stays clear of the towers.
 * Reduced motion: nothing is rendered.
 *
 * Test hooks (data attributes on the root): data-flyby-state (waiting | flying | gap), data-flyby-pass (passes started),
 * data-flyby-dir (ltr | rtl), data-flyby-kind (cross | rise), data-flyby-phase (rise | hover | climb | cross),
 * data-flyby-art (rise | hover | climb | fly: the most visible pose), data-flyby-flourish (none | swoop).
 * The URL flag ?flyby=fast speeds everything up for the e2e tests, ?flyby=slow slows it for screenshots.
 */

interface HeroFlybyProps {
  /** The book is held: the fly-by may start. */
  active: boolean;
  /** The Powers hologram is on: lanes must clear the towers. */
  holoOn: boolean;
}

interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

type Pt = { x: number; y: number };

interface Pass {
  kind: 'cross' | 'rise';
  dir: 1 | -1;
  /** Length of the prone figure (px), his head-to-boot length, the height of the upright art, and the prone half height. */
  len: number;
  b: number;
  h: number;
  half: number;
  riseSeconds: number;
  hoverSeconds: number;
  duration: number;
  opacity: number;
  saturate: number;
  /** Lane of the crossing (for a rise, the lane the launch curve ends on). */
  laneY: number;
  amp: number;
  waves: number;
  phase: number;
  bob: number;
  /** Where the crossing starts and ends (for a rise, startX is where the launch curve ends). */
  startX: number;
  endX: number;
  flourish: null | { kind: 'swoop'; p0: number; len: number; size: number };
  /** Rise passes: the hover point and the launch curve (cubic Bezier) from it to the start of the crossing. */
  launch: null | { x0: number; y0: number; pts: [Pt, Pt, Pt, Pt]; length: number };
}

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeReduced(onChange: () => void): () => void {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}
const getReduced = (): boolean => window.matchMedia(REDUCED_QUERY).matches;

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const rand = (a: number, b: number): number => lerp(a, b, Math.random());
const smooth = (u: number): number => {
  const c = Math.min(1, Math.max(0, u));
  return c * c * (3 - 2 * c);
};

function toRect(r: DOMRect): Rect {
  return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
}

function bookRect(): Rect | null {
  const el = document.querySelector('[data-book]');
  if (!el) return null;
  const r = toRect(el.getBoundingClientRect());
  // A closed book shows only its cover, the right half of the element.
  if (el.getAttribute('data-book') === 'closed') r.left = (r.left + r.right) / 2;
  return r;
}

function holoRect(): Rect | null {
  const parts = [...document.querySelectorAll('[data-holo-tower], [data-holo-label], [data-holo-nameplate]')];
  if (parts.length === 0) return null;
  const out: Rect = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
  for (const el of parts) {
    const r = el.getBoundingClientRect();
    out.left = Math.min(out.left, r.left);
    out.top = Math.min(out.top, r.top);
    out.right = Math.max(out.right, r.right);
    out.bottom = Math.max(out.bottom, r.bottom);
  }
  return out;
}

const inside = (x: number, y: number, r: Rect, pad = 0): boolean => x > r.left - pad && x < r.right + pad && y > r.top - pad && y < r.bottom + pad;

/** Path of the crossing: lane + arc/S-curve + swoop. */
function pathPoint(p: Pass, t: number, vh: number): Pt {
  const x = lerp(p.startX, p.endX, t);
  let y = p.laneY + p.amp * Math.sin(2 * Math.PI * p.waves * t + p.phase);
  const f = p.flourish;
  if (f && t >= f.p0 && t <= f.p0 + f.len) y -= f.size * Math.sin(Math.PI * smooth((t - f.p0) / f.len));
  return { x, y: Math.min(vh, Math.max(0, y)) };
}

const bezier = (q: [Pt, Pt, Pt, Pt], t: number): Pt => {
  const u = 1 - t;
  const w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
  return { x: w[0] * q[0].x + w[1] * q[1].x + w[2] * q[2].x + w[3] * q[3].x, y: w[0] * q[0].y + w[1] * q[1].y + w[2] * q[2].y + w[3] * q[3].y };
};

/** Heading of the launch curve at t, nose-down positive, in the direction of travel. */
function bezierAngle(q: [Pt, Pt, Pt, Pt], t: number): number {
  const a = bezier(q, Math.max(0, t - 0.01));
  const b = bezier(q, Math.min(1, t + 0.01));
  return Math.atan2(b.y - a.y, Math.abs(b.x - a.x));
}

const pick = <T,>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];

/** Build one candidate pass for the viewport (not yet checked against the book or hologram). */
function makePass(kind: Pass['kind'], dir: 1 | -1, vw: number, vh: number, book: Rect | null, narrow: boolean, flourishWanted: boolean): Pass {
  const depth = Math.random();
  const scale = narrow ? FLYBY.narrowScale : 1;
  const len = lerp(FLYBY.length.far, FLYBY.length.near, depth) * scale;
  const b = len / ART.fly.k;
  const h = len * FLYBY.uprightRatio;
  const margin = len * FLYBY.offscreen;
  const rise = kind === 'rise';
  let laneY = rand(FLYBY.lane.min, FLYBY.lane.max) * vh;
  let startX = dir > 0 ? -margin : vw + margin;
  let launch: Pass['launch'] = null;
  if (rise) {
    // Rise in the margin beside the book on the side he starts from (wherever is clear when there is no margin).
    // Far enough out that the launch curve is mostly in the margin too, as far as the margin allows.
    const reach = FLYBY.rise.launch.forward * b + h * 0.3;
    const mid = dir > 0 ? (book ? Math.min(book.left / 2, book.left - reach) : vw * 0.14) : book ? Math.max((book.right + vw) / 2, book.right + reach) : vw * 0.86;
    // Keep the column off the contact buttons that sit at the right edge of the page
    const x0 = Math.min(vw - h * 0.5 - FLYBY.sidebarInset, Math.max(h * 0.5, mid));
    laneY = rand(FLYBY.rise.lane.min, FLYBY.rise.lane.max) * vh;
    const L = FLYBY.rise.launch;
    const y0 = laneY + L.up * b;
    startX = x0 + dir * L.forward * b;
    const ang = (L.angle * Math.PI) / 180;
    const p0 = { x: x0, y: y0 };
    const p3 = { x: startX, y: laneY };
    const p1 = { x: x0 + dir * 0.76 * b * Math.cos(ang), y: y0 - 0.76 * b * Math.sin(ang) };
    const p2 = { x: p3.x - dir * 0.8 * b, y: p3.y };
    const pts: [Pt, Pt, Pt, Pt] = [p0, p1, p2, p3];
    let length = 0;
    let prev = p0;
    for (let i = 1; i <= 24; i++) {
      const q = bezier(pts, i / 24);
      length += Math.hypot(q.x - prev.x, q.y - prev.y);
      prev = q;
    }
    launch = { x0, y0, pts, length };
  }
  const pass: Pass = {
    kind,
    dir,
    len,
    b,
    h,
    half: len * FLYBY.halfExtent,
    riseSeconds: rand(FLYBY.rise.duration[0], FLYBY.rise.duration[1]),
    hoverSeconds: rand(FLYBY.rise.hover[0], FLYBY.rise.hover[1]),
    duration:
      lerp(FLYBY.duration.far, FLYBY.duration.near, depth) * rand(1 - FLYBY.duration.jitter, 1 + FLYBY.duration.jitter) *
      (flourishWanted && !rise ? 1.15 : 1) * (rise ? FLYBY.rise.crossShare : 1),
    opacity: lerp(FLYBY.opacity.far, FLYBY.opacity.near, depth),
    saturate: lerp(FLYBY.saturate.far, FLYBY.saturate.near, depth),
    laneY,
    amp: rand(FLYBY.amplitude.min, FLYBY.amplitude.max) * h * (narrow ? 0.6 : 1) * (Math.random() < 0.5 ? 1 : -1),
    waves: pick(FLYBY.waves),
    // A rise leaves its launch curve on the lane, so the crossing starts at zero offset
    phase: rise ? 0 : rand(0, Math.PI * 2),
    bob: FLYBY.bob.amplitude * h,
    startX,
    endX: dir > 0 ? vw + margin : -margin,
    flourish: null,
    launch,
  };
  if (flourishWanted && !rise) {
    const size = FLYBY.swoop.height * len * rand(0.9, 1.3);
    // Keep the swoop on screen: it starts between 25% and 55% of the way across.
    pass.flourish = { kind: 'swoop', p0: rand(0.25, 0.55), len: FLYBY.swoop.length, size };
  }
  return pass;
}

/**
 * Plan a pass that fits: stays in the viewport, mostly out from behind the book, clear of the hologram.
 * Returns null when nothing fits and the hologram is on (the caller retries shortly).
 */
function planPass(wantRise: boolean, dir: 1 | -1, vw: number, vh: number, book: Rect | null, holo: Rect | null, holoRetry: boolean): Pass | null {
  const narrow = vw <= FLYBY.narrowMaxWidth;
  const marginMode = Math.random() < FLYBY.marginChance;
  const maxHidden = marginMode ? FLYBY.maxHiddenMargin : FLYBY.maxHiddenBehind;
  const flourishWanted = !narrow && Math.random() < FLYBY.flourishChance;
  const fits = (pass: Pass): number => {
    // Returns the hidden ratio, or -1 when the pass does not fit.
    const { half, h, len } = pass;
    if (pass.kind === 'rise' && pass.launch) {
      const { x0, y0, pts } = pass.launch;
      // The hover point must be on screen with room below for the upright figure, and the launch must stay in view
      if (y0 > vh - h * 0.6 || pass.laneY < half) return -1;
      // No room beside the book (a small window): the rise would happen out of sight, so he just crosses
      if (book && (pass.dir > 0 ? book.left : vw - book.right) < h * 0.57) return -1;
      // Hologram: the rise column (from the hover point down to the bottom edge) and the launch curve stay clear of it
      const colHalf = h * 0.4 + h * 0.3 + FLYBY.holoClearance;
      if (holo && x0 + colHalf > holo.left && x0 - colHalf < holo.right && vh + h > holo.top - FLYBY.holoClearance) return -1;
      if (holo) for (let i = 0; i <= 8; i++) if (inside(bezier(pts, i / 8).x, bezier(pts, i / 8).y, holo, len * 0.3 + FLYBY.holoClearance)) return -1;
    }
    const samples = 56;
    let onScreen = 0;
    let hidden = 0;
    for (let s = 0; s <= samples; s++) {
      const pt = pathPoint(pass, s / samples, vh);
      if (pt.x < -len || pt.x > vw + len) continue;
      onScreen++;
      if (pt.y < half || pt.y > vh - half) return -1;
      if (book && inside(pt.x, pt.y, book, -half * 0.5)) hidden++;
      if (holo && inside(pt.x, pt.y, holo, len * 0.4 + FLYBY.holoClearance)) return -1;
    }
    return onScreen === 0 ? -1 : hidden / onScreen;
  };
  let best: Pass | null = null;
  let bestHidden = Infinity;
  const tries = (kind: Pass['kind']): Pass | null => {
    for (let i = 0; i < FLYBY.attempts; i++) {
      const pass = makePass(kind, dir, vw, vh, book, narrow, flourishWanted);
      const ratio = fits(pass);
      if (ratio < 0) continue;
      // A rise is visible in its own column, so its crossing may go behind the book for most of the way
      const limit = kind === 'rise' ? FLYBY.maxHiddenRise : maxHidden;
      if (ratio <= limit) return pass;
      if (ratio < bestHidden && ratio <= FLYBY.maxHiddenBehind) {
        best = pass;
        bestHidden = ratio;
      }
    }
    return best;
  };
  const found = (wantRise ? tries('rise') : null) ?? tries('cross');
  if (found) return found;
  // Nothing fit. With no hologram, fall back to a plain far cross along the bottom margin.
  if (holoRetry) return null;
  const pass = makePass('cross', dir, vw, vh, book, narrow, false);
  pass.laneY = book ? Math.min(vh - pass.half, (book.bottom + vh) / 2) : vh * 0.9;
  pass.amp = pass.h * 0.1;
  pass.waves = 1;
  pass.phase = 0;
  return pass;
}

function HeroFlyby({ active, holoOn }: HeroFlybyProps) {
  const reduced = useSyncExternalStore(subscribeReduced, getReduced, () => false);
  const rootRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const holoRef = useRef(holoOn);
  useEffect(() => {
    holoRef.current = holoOn;
  }, [holoOn]);

  useEffect(() => {
    const root = rootRef.current;
    const hero = heroRef.current;
    if (!root || !hero || !active || reduced) return;

    const flag = new URLSearchParams(window.location.search).get('flyby');
    const fast = flag === 'fast';
    // ?flyby=slow stretches every pass 5x (only used to take deliberate screenshots)
    const speed = fast ? FLYBY.fast.timeScale : flag === 'slow' ? FLYBY.slow.timeScale : 1;
    const poseEls = Object.fromEntries((Object.keys(ART) as Pose[]).map((k) => [k, hero.querySelector<HTMLElement>(`[data-pose="${k}"]`)!])) as Record<Pose, HTMLElement>;
    const imgs = [...hero.querySelectorAll('img')];
    let cancelled = false;
    let dir: 1 | -1 = 1;
    let passes = 0;
    // The one thing that is running (a delayed call between passes, or the timeline of a pass): paused when the tab is hidden.
    let current: gsap.core.Animation | null = null;
    let hiddenPaused = false;

    const setState = (state: string): void => {
      root.dataset.flybyState = state;
    };
    const wait = (seconds: number, then: () => void): void => {
      setState('gap');
      current = gsap.delayedCall(seconds, then);
      if (document.hidden) current.pause();
    };
    const gap = (): number => (fast ? rand(FLYBY.fast.gap[0], FLYBY.fast.gap[1]) : rand(FLYBY.gap[0], FLYBY.gap[1]));
    const deg = Math.PI / 180;
    // A pose hangs from its chest anchor; rotate it about that point. The angle is how far the pose turns from its drawn attitude.
    const place = (pose: Pose, angle: number): void => {
      const [ax, ay] = ART[pose].anchor;
      poseEls[pose].style.transform = `translate(${-ax * 100}%, ${-ay * 100}%) rotate(${angle.toFixed(4)}rad)`;
    };
    const poses = Object.keys(ART) as Pose[];

    let first = true;
    const startPass = (): void => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const holo = holoRef.current ? holoRect() : null;
      const wantRise = first || Math.random() < FLYBY.rise.chance;
      const pass = planPass(wantRise, dir, vw, vh, bookRect(), holo, holoRef.current);
      if (!pass) {
        // The hologram leaves no clear lane right now: try again shortly.
        wait(FLYBY.holoRetry, startPass);
        return;
      }
      first = false;
      passes += 1;
      const rise = pass.kind === 'rise' && pass.launch !== null;
      const launch = pass.launch;
      const f = pass.flourish;
      root.dataset.flybyPass = String(passes);
      root.dataset.flybyDir = dir > 0 ? 'ltr' : 'rtl';
      root.dataset.flybyKind = pass.kind;
      root.dataset.flybyFlourish = f ? f.kind : 'none';

      hero.style.setProperty('--b', `${pass.b.toFixed(1)}px`);
      hero.style.opacity = String(pass.opacity);
      const filter = pass.saturate < 0.99 ? `saturate(${pass.saturate.toFixed(2)})` : '';
      for (const el of Object.values(poseEls)) el.style.filter = filter;

      const R = FLYBY.rise;
      const bankLimit = (FLYBY.maxTilt * Math.PI) / 180;
      const level = (R.levelAt * Math.PI) / 180;
      // ry: height while rising; s: progress along the launch curve; p: progress along the crossing
      const startRy = vh + pass.b * 0.9;
      const st = { ry: startRy, s: 0, p: 0 };
      const phase0 = Math.random() * Math.PI * 2;
      type Phase = 'rise' | 'hover' | 'climb' | 'cross';
      let phase: Phase = rise ? 'rise' : 'cross';
      const setPhase = (ph: Phase): void => {
        phase = ph;
        root.dataset.flybyPhase = ph;
        hero.style.setProperty('--thrust', String(R.thrust[ph]));
      };

      // Pose cross-fades: when the wanted pose changes, every pose eases toward its new opacity over a short time
      const fadeSeconds = R.fadeSeconds * speed;
      let target: Pose = rise ? 'rise' : 'fly';
      let from = Object.fromEntries(poses.map((k) => [k, k === target ? 1 : 0])) as Record<Pose, number>;
      const now = { ...from };
      let fadeT0 = -1e9;
      let dominant: Pose | null = null;
      const want = (pose: Pose): void => {
        if (pose === target) return;
        from = { ...now };
        target = pose;
        fadeT0 = gsap.ticker.time;
      };
      const applyFade = (): void => {
        const e = smooth(fadeSeconds > 0 ? (gsap.ticker.time - fadeT0) / fadeSeconds : 1);
        let best: Pose = target;
        for (const k of poses) {
          const o = lerp(from[k], k === target ? 1 : 0, e);
          if (Math.abs(o - now[k]) > 0.002 || dominant === null) poseEls[k].style.opacity = o.toFixed(3);
          now[k] = o;
          if (o > now[best]) best = k;
        }
        if (best !== dominant) {
          dominant = best;
          root.dataset.flybyArt = best;
        }
      };

      const render = (): void => {
        const clock = gsap.ticker.time;
        const bob = pass.bob * Math.sin(clock * 2 * Math.PI * FLYBY.bob.rate + phase0);
        const wobble = Math.sin(clock * 1.7 + phase0) * 0.04;
        let x: number;
        let y: number;
        if (phase === 'rise' || phase === 'hover') {
          x = launch!.x0 + Math.sin(clock * 3.1 + phase0) * pass.h * 0.01;
          y = st.ry + (phase === 'hover' ? bob * 1.6 : 0);
          const done = (startRy - st.ry) / (startRy - launch!.y0);
          want(phase === 'hover' || done >= R.hoverAt ? 'hover' : 'rise');
          place('rise', wobble);
          place('hover', wobble);
        } else if (phase === 'climb') {
          const pt = bezier(launch!.pts, st.s);
          const psi = bezierAngle(launch!.pts, st.s);
          x = pt.x;
          y = pt.y;
          // Each sprite is turned so its drawn body axis lies along the path
          want(st.s < 0.02 ? 'hover' : psi < -level ? 'climb' : 'fly');
          place('hover', psi - ART.hover.drawn * deg);
          place('climb', psi - ART.climb.drawn * deg);
          place('fly', psi);
        } else {
          const pt = pathPoint(pass, st.p, vh);
          x = pt.x;
          y = pt.y + bob;
          // Slope of the path in the direction of travel (nose down is positive, in the figure's own mirrored frame)
          const e = 0.01;
          const a = pathPoint(pass, Math.max(0, st.p - e), vh);
          const b = pathPoint(pass, Math.min(1, st.p + e), vh);
          const slope = Math.atan2(b.y - a.y, Math.abs(b.x - a.x));
          const swooping = f !== null && st.p >= f.p0 - 0.02 && st.p <= f.p0 + f.len + 0.02;
          if (swooping) {
            // Climb art on the way up, level art turned down for the dive; the bank cap is lifted while he swoops
            want(slope < -26 * deg ? 'climb' : 'fly');
            place('climb', slope - ART.climb.drawn * deg);
            place('fly', Math.max(-50 * deg, Math.min(50 * deg, slope)));
          } else {
            want('fly');
            place('fly', Math.max(-bankLimit, Math.min(bankLimit, slope * FLYBY.bank)));
          }
        }
        hero.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${pass.dir}, 1)`;
        applyFade();
      };

      if (rise) place('rise', 0);
      else place('fly', 0);
      setPhase(phase);
      hero.style.visibility = 'visible';
      render();
      const tl = gsap.timeline({ onUpdate: render });
      const done = (): void => {
        hero.style.visibility = 'hidden';
        dir = dir > 0 ? -1 : 1;
        wait(gap(), startPass);
      };
      const crossSeconds = pass.duration * speed;
      if (rise && launch) {
        tl.to(st, { ry: launch.y0, duration: pass.riseSeconds * speed, ease: 'power2.out' });
        tl.call(() => setPhase('hover'));
        tl.to({}, { duration: pass.hoverSeconds * speed });
        tl.call(() => setPhase('climb'));
        // The launch starts from rest and leaves at the speed the crossing continues at (a Hermite ease), so nothing jerks
        const launchSeconds = R.launch.seconds * speed;
        const cruise = Math.abs(pass.endX - pass.startX) / crossSeconds;
        const slope0 = Math.min(3, (cruise * launchSeconds) / launch.length);
        tl.to(st, {
          s: 1,
          duration: launchSeconds,
          ease: (t: number) => -2 * t * t * t + 3 * t * t + (t * t * t - t * t) * slope0,
          onComplete: () => setPhase('cross'),
        });
        tl.to(st, { p: 1, duration: crossSeconds, ease: 'none', onComplete: done });
      } else {
        tl.to(st, { p: 1, duration: crossSeconds, ease: 'none', onComplete: done });
      }
      current = tl;
      if (document.hidden) tl.pause();
    };

    const onVisibility = (): void => {
      if (document.hidden) {
        if (current && !current.paused()) {
          current.pause();
          hiddenPaused = true;
        }
      } else if (hiddenPaused) {
        hiddenPaused = false;
        current?.resume();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    setState('waiting');
    // Both cut-outs are decoded before the first pass
    void Promise.all(imgs.map((img) => img.decode().catch(() => undefined))).then(() => {
      if (cancelled) return;
      current = gsap.delayedCall(fast ? FLYBY.fast.firstDelay : FLYBY.firstDelay, startPass);
      if (document.hidden) current.pause();
    });

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      current?.kill();
      hero.style.visibility = 'hidden';
      hero.style.transform = '';
      for (const key of ['flybyState', 'flybyPass', 'flybyDir', 'flybyKind', 'flybyPhase', 'flybyArt', 'flybyFlourish']) delete root.dataset[key];
    };
  }, [active, reduced]);

  if (reduced) return null;
  return (
    <div ref={rootRef} className={styles.root} aria-hidden="true" data-flyby="" style={{ pointerEvents: 'none' }}>
      <div ref={heroRef} className={styles.hero} data-flyby-sprite="" aria-hidden="true">
        <HeroFigure />
      </div>
    </div>
  );
}

export default HeroFlyby;
