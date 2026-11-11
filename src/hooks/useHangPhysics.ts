/**
 * useHangPhysics - runs the hanging-book physics and moves the book with it.
 *
 * Owns a HangSim (see components/WebCatch/physics.ts) and steps it on
 * `gsap.ticker`, then writes `transform` directly on the book's hanger element:
 * translate plus a tilt about the hanger's centre, which is the centre of the
 * visible book (a closed book is the right half of `.book`, which GSAP shifts
 * so the cover is centred; an open book is the full spread). No per-frame
 * React state is involved.
 *
 * Each tick it also reads the cover-open progress from the book, so the rope
 * attachment points follow the visible corners while the cover turns.
 *
 * Work is skipped while the tab is hidden, and once a held book has come to
 * rest the loop goes idle (it keeps only two cheap checks per frame: has the
 * cover started moving, and has the layout changed) until something wakes it.
 *
 * Intro: on a first visit in a session the book falls and is caught (`falling`
 * -> `catching` -> `held`). On later loads, and with prefers-reduced-motion, it
 * starts `held`, already hanging. If the canvases are unavailable there is no
 * simulation at all: the book simply starts `held` at rest.
 *

 * Pose: the sim also eases a lie-down pose (translate, rotateX, scale) for the hologram mode; this hook
 * composes it into the transform, keeps the transform while it is active, and reports `onPose` when it settles.
 *
 * Page turns: `release(direction)` / `land(direction)` let go of the corners on the side the page
 * leaves and shoot them back after it lands (the sim holds the per-line state).
 *
 * Interaction (not under reduced motion or on phone-sized screens): pressing
 * on the book and moving more than a few pixels pulls it against the webs; the
 * click that follows a pull is swallowed. With the URL flag `?webs=cut` a
 * document-level pointer listener also lets lines be cut and new ones shot.
 */

import { useLayoutEffect, useMemo, useRef, type RefObject } from 'react';
import gsap from 'gsap';
import type { ComicBookGSAPRef } from '../components/ComicBook';
import { HangSim, type IntroState, type Layout } from '../components/WebCatch/physics';
import { CUT, DRAG, INTRO, PHYSICS, THRESHOLDS } from '../components/WebCatch/webConfig';
import { HOLO } from '../components/SkillsHologram/holoConfig';

export interface HangPhysicsApi {
  /** Make the lines vibrate. */
  twang: () => void;
  /** Ask for a redraw without waking the physics (colours or canvas size changed). */
  invalidate: () => void;
  /** A page is turning in this direction: let go of the strands and of the corners on the side it leaves. */
  release: (direction: 'forward' | 'backward') => void;
  /** Snap the wrapped strands back on (the page landed). */
  rewrap: () => void;
  /** A page landed: dip, tilt and vibrate. */
  land: (direction: 'forward' | 'backward') => void;
  /** Wake the loop (a flip is in progress). */
  wake: () => void;
  /** Can the book lie down for the hologram (simulation exists, not a phone, not reduced motion)? */
  canLieDown: () => boolean;
  /** Hologram mode in: the book lies flat while the four lines keep holding it over `pose.enterDuration`. */
  lieDown: () => void;
  /** Hologram mode out: the book stands back up over `pose.exitDuration`. */
  standUp: () => void;
  /** Leave hologram mode at once (no animation) and shoot the corners back. */
  resetPose: () => void;
  /** Shoot back every corner that is let go (top first, short stagger). */
  reattachAll: () => void;
}

interface UseHangPhysicsOptions {
  bookRef: RefObject<ComicBookGSAPRef | null>;
  /** Called when the intro state changes, and once at start with the initial state. */
  onStateChange: (state: IntroState) => void;
  /** Called when the number of main lines holding the book changes. */
  onLinesChange?: (count: number) => void;
  /** Called when the lie-down pose finished easing: `down` = lying flat, `up` = upright again. */
  onPose?: (state: 'down' | 'up') => void;
  /** Draw the lines and webs for the current physics state. */
  onFrame: (sim: HangSim) => void;
  /** False when there is no canvas to draw on: skip everything and start held. */
  canDraw: () => boolean;
}

const prefersReducedMotion = (): boolean =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const isPhone = (): boolean => window.innerWidth <= THRESHOLDS.phoneMaxWidth;

function dropAlreadyPlayed(): boolean {
  try {
    return window.sessionStorage.getItem(INTRO.sessionKey) === '1';
  } catch {
    return false;
  }
}

function markDropPlayed(): void {
  try {
    window.sessionStorage.setItem(INTRO.sessionKey, '1');
  } catch {
    // Storage unavailable (private mode, blocked): the drop just plays again next load.
  }
}

function cuttingEnabled(): boolean {
  try {
    return new URLSearchParams(window.location.search).get(CUT.flag.name) === CUT.flag.value;
  } catch {
    return false;
  }
}

/** Measure the world<->screen mapping from the scene and the book's page size. */
function measureLayout(book: ComicBookGSAPRef, hanger: HTMLElement): Layout | null {
  const scene = hanger.parentElement;
  if (!scene) return null;
  const rect = scene.getBoundingClientRect();
  const page = book.getPageSize();
  const unit = page.width / 2;
  return {
    unit,
    centerX: rect.left + rect.width / 2,
    centerY: rect.top + rect.height / 2,
    viewW: window.innerWidth,
    viewH: window.innerHeight,
    bookH: page.height / unit,
    compact: isPhone(),
  };
}

/** Write the physics pose onto the hanger (world y is up, CSS y is down). */
function writeTransform(hanger: HTMLElement, sim: HangSim, atRest: boolean): void {
  if (atRest && sim.pose.p <= 1e-4) {
    hanger.style.transform = '';
    return;
  }
  const { unit } = sim.layout;
  const b = sim.body;
  let transform = `translate(${(b.x * unit).toFixed(2)}px, ${(-b.y * unit).toFixed(2)}px) rotate(${(
    (-b.a * 180) /
    Math.PI
  ).toFixed(3)}deg)`;
  const pose = sim.pose;
  if (pose.p > 1e-4) {
    // Lying flat for the hologram: lowered, tilted back about the book's centre, and scaled to fit.
    transform += ` translateY(${(pose.dy * pose.p).toFixed(2)}px) rotateX(${(HOLO.pose.tilt * pose.p).toFixed(3)}deg)`;
    transform += ` scale(${(1 + (pose.scale - 1) * pose.p).toFixed(4)})`;
  }
  if (sim.tumble > THRESHOLDS.tumbleEpsilon) {
    const rx = sim.tumble * INTRO.tumbleX.amplitude * Math.sin(sim.tau * INTRO.tumbleX.rate);
    const ry = sim.tumble * INTRO.tumbleY.amplitude * Math.sin(sim.tau * INTRO.tumbleY.rate + INTRO.tumbleY.phase);
    transform += ` rotateX(${rx.toFixed(4)}rad) rotateY(${ry.toFixed(4)}rad)`;
  }
  hanger.style.transform = transform;
}

export default function useHangPhysics({
  bookRef,
  onStateChange,
  onLinesChange,
  onFrame,
  canDraw,
  onPose,
}: UseHangPhysicsOptions): HangPhysicsApi {
  const stateCb = useRef(onStateChange);
  const linesCb = useRef(onLinesChange);
  const frameCb = useRef(onFrame);
  const canDrawCb = useRef(canDraw);
  const poseCb = useRef(onPose);
  const apiRef = useRef<HangPhysicsApi>({
    twang: () => undefined,
    invalidate: () => undefined,
    release: () => undefined,
    rewrap: () => undefined,
    land: () => undefined,
    wake: () => undefined,
    canLieDown: () => false,
    lieDown: () => undefined,
    standUp: () => undefined,
    resetPose: () => undefined,
    reattachAll: () => undefined,
  });

  useLayoutEffect(() => {
    stateCb.current = onStateChange;
    linesCb.current = onLinesChange;
    frameCb.current = onFrame;
    canDrawCb.current = canDraw;
    poseCb.current = onPose;
  }, [onStateChange, onLinesChange, onFrame, canDraw, onPose]);

  useLayoutEffect(() => {
    // No canvas: no webs, no simulation. The book just sits there, held.
    if (!canDrawCb.current()) {
      stateCb.current('held');
      return;
    }

    const reduced = prefersReducedMotion();
    const mode = reduced || dropAlreadyPlayed() ? 'rest' : 'drop';
    const cutting = cuttingEnabled();

    let sim: HangSim | null = null;
    let hanger: HTMLElement | null = null;
    let layoutDirty = true;
    let redraw = true;
    let asleep = false;
    let resumed = false;
    let lastState: IntroState | null = null;
    let lastLines = -1;

    const reportState = (state: IntroState): void => {
      if (state === lastState) return;
      lastState = state;
      if (state === 'held' && mode === 'drop') markDropPlayed();
      stateCb.current(state);
    };

    const reportLines = (): void => {
      if (!sim) return;
      const n = sim.holdingMain();
      if (n === lastLines) return;
      lastLines = n;
      linesCb.current?.(n);
    };

    /** Create the simulation once the book (and so the hanger) exists. */
    const init = (): boolean => {
      const book = bookRef.current;
      const el = book?.getHangerElement();
      if (!book || !el) return false;
      const layout = measureLayout(book, el);
      if (!layout) return false;
      hanger = el;
      sim = new HangSim(layout, mode, reduced);
      layoutDirty = false;
      sim.setOpen(book.getOpenProgress(), book.getCloseProgress());
      writeTransform(el, sim, sim.isAtRest());
      reportState(sim.state);
      reportLines();
      frameCb.current(sim);
      redraw = false;
      return true;
    };

    const tick = (_time: number, deltaMs: number): void => {
      if (document.hidden) return;
      if (!sim || !hanger) {
        if (!init()) return;
      }
      const book = bookRef.current;
      if (!sim || !hanger || !book) return;

      // Layout: the page size is React state, the scene position changes on resize.
      const page = book.getPageSize();
      if (layoutDirty || Math.abs(page.width / 2 - sim.layout.unit) > 1e-6) {
        const layout = measureLayout(book, hanger);
        if (layout) {
          sim.setLayout(layout);
          layoutDirty = false;
          asleep = false;
          redraw = true;
        }
      }

      // Cover turning (or last sheet closing): the book's visible corners move.
      const snap = (v: number): number =>
        v > 1 - THRESHOLDS.openEpsilon ? 1 : v < THRESHOLDS.openEpsilon ? 0 : v;
      const open = snap(book.getOpenProgress());
      const close = snap(book.getCloseProgress());
      if (open !== sim.open || close !== sim.close) {
        sim.setOpen(open, close);
        asleep = false;
      }

      if (asleep && !redraw) return;

      if (!asleep) {
        // After the tab was hidden the first delta is huge: advance one nominal frame instead.
        const dt = resumed ? 1 / 60 : Math.min(deltaMs / 1000, PHYSICS.maxFrameTime);
        resumed = false;
        sim.step(dt);
        reportState(sim.state);
        reportLines();
        if (sim.poseEvent) {
          const event = sim.poseEvent;
          sim.poseEvent = null;
          poseCb.current?.(event);
        }
      }

      const settled = !asleep && sim.isAtRest();
      if (settled) {
        sim.snapToRest();
        asleep = true;
      }
      writeTransform(hanger, sim, asleep);
      frameCb.current(sim);
      redraw = false;
    };

    const wake = (): void => {
      asleep = false;
    };

    apiRef.current = {
      twang: () => {
        sim?.twang();
        wake();
      },
      invalidate: () => {
        redraw = true;
      },
      release: (direction) => {
        sim?.setWrapReleased(true);
        sim?.releaseSide(direction === 'forward' ? 'right' : 'left');
        wake();
      },
      rewrap: () => {
        sim?.setWrapReleased(false);
        wake();
      },
      land: (direction) => {
        sim?.reattachSide(direction === 'forward' ? 'right' : 'left');
        sim?.land(direction);
        wake();
      },
      wake,
      canLieDown: () => !!sim && !reduced && !sim.layout.compact && sim.state === 'held',
      lieDown: () => {
        if (!sim) return;
        // The lines stay on: they follow the corners down (cornerPx) and hold the book while it lies flat.
        sim.reattachAll();
        sim.setPose(1, HOLO.pose.enterDuration);
        wake();
      },
      standUp: () => {
        sim?.setPose(0, HOLO.pose.exitDuration);
        wake();
      },
      resetPose: () => {
        if (!sim) return;
        sim.snapPose(0);
        sim.reattachAll();
        wake();
      },
      reattachAll: () => {
        sim?.reattachAll();
        wake();
      },
    };

    // --- Pulling the book -------------------------------------------------
    let press: { id: number; x: number; y: number; dragging: boolean } | null = null;
    let swallowClickUntil = 0;
    const canDrag = (): boolean => !reduced && !isPhone() && sim?.state === 'held' && !sim.poseActive();

    const onPointerDown = (e: PointerEvent): void => {
      if (!canDrag() || (e.pointerType === 'mouse' && e.button !== 0)) return;
      press = { id: e.pointerId, x: e.clientX, y: e.clientY, dragging: false };
    };
    const onPointerMove = (e: PointerEvent): void => {
      if (!sim || !press || e.pointerId !== press.id) return;
      if (!press.dragging) {
        if (Math.hypot(e.clientX - press.x, e.clientY - press.y) < THRESHOLDS.dragPx) return;
        press.dragging = true;
        sim.beginGrab(sim.screenToWorld(press.x, press.y));
      }
      sim.pointer = sim.screenToWorld(e.clientX, e.clientY);
      wake();
    };
    const onPointerEnd = (e: PointerEvent): void => {
      if (!press || e.pointerId !== press.id) return;
      if (press.dragging) {
        sim?.endGrab();
        // The click the browser sends after this release must not turn a page.
        swallowClickUntil = performance.now() + DRAG.clickGuardMs;
        wake();
      }
      press = null;
    };
    const onClickCapture = (e: MouseEvent): void => {
      if (performance.now() > swallowClickUntil) return;
      swallowClickUntil = 0;
      e.stopPropagation();
      e.preventDefault();
    };

    // --- Cutting and re-catching (?webs=cut) -------------------------------
    const onCutMove = (e: PointerEvent): void => {
      if (!sim || press?.dragging) return;
      const rope = sim.nearestRope(sim.screenToWorld(e.clientX, e.clientY));
      if (sim.setHover(rope)) redraw = true;
      document.body.style.cursor = rope ? 'crosshair' : '';
    };
    const onCutClick = (e: MouseEvent): void => {
      if (!sim || sim.state === 'falling') return;
      const pointer = sim.screenToWorld(e.clientX, e.clientY);
      const rope = sim.nearestRope(pointer);
      if (rope) {
        sim.cut(rope);
        document.body.style.cursor = '';
      } else if (
        !sim.insideBook(pointer) &&
        !(e.target instanceof Element && e.target.closest('a, button, [role="button"]'))
      ) {
        sim.shoot(e.clientX, e.clientY);
      } else {
        return;
      }
      wake();
    };

    // --- Lifecycle ---------------------------------------------------------
    const markLayoutDirty = (): void => {
      layoutDirty = true;
    };
    const onVisibility = (): void => {
      if (!document.hidden) resumed = true;
    };

    // First placement happens before paint so a falling book never flashes at rest.
    init();
    gsap.ticker.add(tick);
    window.addEventListener('resize', markLayoutDirty);
    document.addEventListener('visibilitychange', onVisibility);
    const scene = bookRef.current?.getHangerElement()?.parentElement;
    const observer = typeof ResizeObserver === 'function' && scene ? new ResizeObserver(markLayoutDirty) : null;
    if (observer && scene) observer.observe(scene);

    const hangerEl = bookRef.current?.getHangerElement() ?? null;
    if (hangerEl && !reduced) {
      // A pull must not scroll or pan on touch screens (the page never scrolls).
      hangerEl.style.touchAction = 'none';
      hangerEl.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerEnd);
      window.addEventListener('pointercancel', onPointerEnd);
      window.addEventListener('click', onClickCapture, true);
    }
    if (cutting) {
      document.addEventListener('pointermove', onCutMove);
      document.addEventListener('click', onCutClick);
    }

    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener('resize', markLayoutDirty);
      document.removeEventListener('visibilitychange', onVisibility);
      observer?.disconnect();
      if (hangerEl) {
        hangerEl.style.touchAction = '';
        hangerEl.removeEventListener('pointerdown', onPointerDown);
      }
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerEnd);
      window.removeEventListener('pointercancel', onPointerEnd);
      window.removeEventListener('click', onClickCapture, true);
      document.removeEventListener('pointermove', onCutMove);
      document.removeEventListener('click', onCutClick);
      if (cutting) document.body.style.cursor = '';
      if (hanger) hanger.style.transform = '';
      apiRef.current = {
        twang: () => undefined,
        invalidate: () => undefined,
        release: () => undefined,
        rewrap: () => undefined,
        land: () => undefined,
        wake: () => undefined,
        canLieDown: () => false,
        lieDown: () => undefined,
        standUp: () => undefined,
        resetPose: () => undefined,
        reattachAll: () => undefined,
      };
      sim = null;
      hanger = null;
    };
  }, [bookRef]);

  return useMemo<HangPhysicsApi>(
    () => ({
      twang: () => apiRef.current.twang(),
      invalidate: () => apiRef.current.invalidate(),
      release: (direction) => apiRef.current.release(direction),
      rewrap: () => apiRef.current.rewrap(),
      land: (direction) => apiRef.current.land(direction),
      wake: () => apiRef.current.wake(),
      canLieDown: () => apiRef.current.canLieDown(),
      lieDown: () => apiRef.current.lieDown(),
      standUp: () => apiRef.current.standUp(),
      resetPose: () => apiRef.current.resetPose(),
      reattachAll: () => apiRef.current.reattachAll(),
    }),
    []
  );
}
