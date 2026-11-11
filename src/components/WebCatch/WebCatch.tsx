/**
 * WebCatch - the lines and corner webs that catch the comic book and hold it up.
 *
 * The book floats down from above the screen, four lines shoot from the screen
 * corners (top-left, top-right, bottom-right, bottom-left), and each one
 * attaches to the book's corner and becomes a rope. Right after a line
 * attaches, a spider web grows from a hub out on the line, a little before the
 * book, and fans toward the book: part of it hangs outside the book, part
 * overlaps the page corner. The ropes carry the book's weight (see
 * physics.ts), and while the book is open they follow the visible corners of
 * the spread. When a page turns, the two corners on the side it leaves let go
 * (web folds up, line snaps back toward the screen corner) and shoot back on
 * after it lands, top corner first (see RELEASE in webConfig.ts).
 *
 * Hologram mode: the same simulation also owns the book's "pose" (lying flat for the Powers & Abilities
 * hologram, see SkillsHologram): the book lies down while all four lines keep holding it. The canvases draw in
 * screen px through HangSim.cornerPx, which projects the tilted book's corners, so the lines and corner webs
 * follow the corners through the lie-down and while it lies flat.
 *
 * This component owns two fixed, pointer-transparent canvases:
 * - back:  the lines and the whole corner webs, under the book (the book hides
 *          the part beneath it; this part stays put while a page turns)
 * - front: above the book, below the navigation; the same webs again, clipped
 *          to the visible book face, so only the overlap with the page shows
 *          (it collapses while a page turns and regrows on landing)
 * Phone-sized screens draw the lines only.
 *
 * Visitors can pull the book (drag) and, with `?webs=cut`, cut lines and shoot
 * new ones (a new line is only a line, with no web). If a canvas cannot be
 * created there are no lines or webs at all and the book starts held at rest.
 *
 * The physics loop lives in useHangPhysics and runs on gsap.ticker; it writes
 * the book's transform and calls back here to draw. Strand and outline colours (lines
 * and webs, both canvases) come from the CSS variables --web-strand-color /
 * --web-halo-color so dark mode just works.
 */

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type RefObject,
} from 'react';
import useHangPhysics from '../../hooks/useHangPhysics';
import type { ComicBookGSAPRef } from '../ComicBook';
import { drawBackLayer, drawFrontLayer, type WebColors } from './drawWebs';
import type { HangSim, IntroState } from './physics';
import { COLOR_VARS } from './webConfig';
import styles from './WebCatch.module.css';

export interface WebCatchRef {
  /** Make the lines vibrate. */
  twang: () => void;
  /** A page started turning in this direction: the strands let go, and the corners on the side it leaves disconnect. */
  release: (direction: 'forward' | 'backward') => void;
  /** Snap the wrapped strands back on. */
  rewrap: () => void;
  /** A page landed: the disconnected corners shoot back, the book dips and tilts a little and the lines vibrate. */
  land: (direction: 'forward' | 'backward') => void;
  /** A flip is in progress (keeps the loop awake while corners move). */
  flipProgress: () => void;
  /** Can the book lie down for the hologram right now? */
  canLieDown: () => boolean;
  /** Hologram in: the book lies flat, still hanging in its lines (`onPose('down')` when it has). */
  lieDown: () => void;
  /** Hologram out: the book stands back up (`onPose('up')` when it has). */
  standUp: () => void;
  /** Leave hologram mode at once and shoot the corners back. */
  resetPose: () => void;
  /** Shoot back every corner that is let go. */
  reattachAll: () => void;
}

interface WebCatchProps {
  /** The book the webs hold; used to find its hanger, page size and open progress. */
  bookRef: RefObject<ComicBookGSAPRef | null>;
  /** Reports `falling`, `catching` and `held` as the intro plays. */
  onStateChange?: (state: IntroState) => void;
  /** Reports how many of the four main lines hold the book, whenever that changes. */
  onLinesChange?: (count: number) => void;
  /** The lie-down pose finished easing (`down` = flat, `up` = upright). */
  onPose?: (state: 'down' | 'up') => void;
}

function readColors(): WebColors {
  const style = getComputedStyle(document.documentElement);
  return {
    strand: style.getPropertyValue(COLOR_VARS.strand).trim() || 'rgba(255, 255, 255, 0.55)',
    halo: style.getPropertyValue(COLOR_VARS.halo).trim() || 'rgba(0, 160, 233, 0.14)',
  };
}

/** Size a canvas to the viewport at the device pixel ratio; draw in CSS pixels. */
function fitCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

const WebCatch = forwardRef<WebCatchRef, WebCatchProps>(({ bookRef, onStateChange, onLinesChange, onPose }, ref) => {
  const backCanvas = useRef<HTMLCanvasElement>(null);
  const frontCanvas = useRef<HTMLCanvasElement>(null);
  const backCtx = useRef<CanvasRenderingContext2D | null>(null);
  const frontCtx = useRef<CanvasRenderingContext2D | null>(null);
  const colors = useRef<WebColors>({ strand: '', halo: '' });
  const invalidateRef = useRef<() => void>(() => undefined);

  // Canvas setup, sizing and colours. Declared before the physics hook so the
  // canvases are ready when the hook draws its first frame.
  useLayoutEffect(() => {
    const back = backCanvas.current;
    const front = frontCanvas.current;
    if (!back || !front) return;
    backCtx.current = back.getContext('2d');
    frontCtx.current = front.getContext('2d');
    colors.current = readColors();

    const resize = (): void => {
      if (backCtx.current) fitCanvas(back, backCtx.current);
      if (frontCtx.current) fitCanvas(front, frontCtx.current);
      invalidateRef.current();
    };
    resize();
    window.addEventListener('resize', resize);

    const scheme = window.matchMedia('(prefers-color-scheme: dark)');
    const onScheme = (): void => {
      colors.current = readColors();
      invalidateRef.current();
    };
    scheme.addEventListener('change', onScheme);

    return () => {
      window.removeEventListener('resize', resize);
      scheme.removeEventListener('change', onScheme);
      backCtx.current = null;
      frontCtx.current = null;
    };
  }, []);

  const handleState = useCallback(
    (state: IntroState) => {
      onStateChange?.(state);
    },
    [onStateChange]
  );

  const handleFrame = useCallback((sim: HangSim) => {
    if (backCtx.current) drawBackLayer(backCtx.current, sim, colors.current);
    if (frontCtx.current) drawFrontLayer(frontCtx.current, sim, colors.current);
  }, []);

  const canDraw = useCallback(() => backCtx.current !== null && frontCtx.current !== null, []);

  const physics = useHangPhysics({
    bookRef,
    onStateChange: handleState,
    onLinesChange,
    onFrame: handleFrame,
    canDraw,
    onPose,
  });

  useLayoutEffect(() => {
    invalidateRef.current = physics.invalidate;
  }, [physics]);

  useImperativeHandle(
    ref,
    () => ({
      twang: physics.twang,
      release: physics.release,
      rewrap: physics.rewrap,
      land: physics.land,
      flipProgress: physics.wake,
      canLieDown: physics.canLieDown,
      lieDown: physics.lieDown,
      standUp: physics.standUp,
      resetPose: physics.resetPose,
      reattachAll: physics.reattachAll,
    }),
    [physics]
  );

  return (
    <>
      <canvas ref={backCanvas} className={`${styles.layer} ${styles.back}`} aria-hidden="true" />
      <canvas ref={frontCanvas} className={`${styles.layer} ${styles.front}`} aria-hidden="true" />
    </>
  );
});

WebCatch.displayName = 'WebCatch';

export default WebCatch;
