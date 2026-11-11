/**
 * useReaderGestures - swipe, drag and tap on the reader.
 *
 * A touch picks a direction from its first movement: within `horizontalAngle` of horizontal it is a page drag
 * (the page follows the finger, then commits or settles back); steeper, it hands over to native scrolling so long
 * pages scroll without turning. Past the first or last page a drag rubber-bands. A short touch is a tap: the
 * screen edges turn the page, the whole screen advances the origin story, and the cover opens. Regions marked
 * `data-noswipe` (the skill tabs, the running hologram) never start a drag.
 *
 * All motion is written straight to the page elements; React is only told when a turn commits.
 */

import { useEffect, type RefObject } from 'react';
import { GESTURE, READER } from '../mobileConfig';
import { clamp, easeOut, renderTurn, tween } from './pageTurn';

export interface TurnHandle {
  top: HTMLElement;
  under: HTMLElement;
  forward: boolean;
  from: number;
  to: number;
}

export interface ReaderApi {
  busy: () => boolean;
  setBusy: (busy: boolean) => void;
  current: () => number;
  pageCount: () => number;
  reducedMotion: () => boolean;
  isCover: () => boolean;
  isOrigin: () => boolean;
  originCan: (dir: 1 | -1) => boolean;
  originStep: (dir: 1 | -1) => void;
  pageEl: (index: number) => HTMLElement | null;
  /** Prepare both pages for a turn (visible, stacked) and return the handle. */
  prepTurn: (to: number) => TurnHandle;
  /** The turn landed on `turn.to`. */
  commitTurn: (turn: TurnHandle) => void;
  /** The turn was cancelled: put the pages back. */
  cancelTurn: () => void;
  next: () => void;
  prev: () => void;
}

const INTERACTIVE = 'a,button,input,select,textarea,[role=tab],[role=button],summary,[data-noturn]';

type Mode = 'step' | 'rubber' | 'commit' | 'drag';

interface Touch {
  id: number;
  x: number;
  y: number;
  t: number;
  mode: Mode | null;
  dx: number;
  samples: Array<[number, number]>;
  target: EventTarget | null;
  left: number;
  width: number;
  turn?: TurnHandle;
  dir?: 1 | -1;
  u?: number;
}

export default function useReaderGestures(
  bookRef: RefObject<HTMLElement | null>,
  shellRef: RefObject<HTMLElement | null>,
  apiRef: RefObject<ReaderApi | null>
): void {
  useEffect(() => {
    const book = bookRef.current;
    const shell = shellRef.current;
    if (!book || !shell) return;
    let st: Touch | null = null;

    const api = (): ReaderApi => apiRef.current as ReaderApi;
    const setDragging = (on: boolean) => shell.toggleAttribute('data-dragging', on);

    const onDown = (e: PointerEvent) => {
      const a = api();
      if (a.busy() || (e.pointerType === 'mouse' && e.button !== 0)) return;
      if ((e.target as Element).closest('[data-noswipe]')) {
        st = null;
        return;
      }
      const r = book.getBoundingClientRect();
      st = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        t: e.timeStamp,
        mode: null,
        dx: 0,
        samples: [[e.timeStamp, e.clientX]],
        target: e.target,
        left: r.left,
        width: r.width,
      };
    };

    const onMove = (e: PointerEvent) => {
      if (!st || e.pointerId !== st.id) return;
      const a = api();
      const dx = e.clientX - st.x;
      const dy = e.clientY - st.y;
      if (!st.mode) {
        if (Math.abs(dx) < GESTURE.slop && Math.abs(dy) < GESTURE.slop) return;
        const angle = (Math.atan2(Math.abs(dy), Math.abs(dx)) * 180) / Math.PI;
        if (angle >= GESTURE.horizontalAngle) {
          // Vertical intent: the browser scrolls.
          st = null;
          return;
        }
        const dir: 1 | -1 = dx < 0 ? 1 : -1;
        const cur = a.current();
        if (a.isOrigin() && a.originCan(dir)) st.mode = 'step';
        else if (cur + dir < 0 || cur + dir >= a.pageCount()) st.mode = 'rubber';
        else if (a.reducedMotion()) st.mode = 'commit';
        else {
          st.turn = a.prepTurn(cur + dir);
          st.mode = 'drag';
        }
        st.dir = dir;
        try {
          book.setPointerCapture(e.pointerId);
        } catch {
          /* pointer already gone */
        }
        setDragging(true);
        window.getSelection()?.removeAllRanges();
      }
      st.dx = dx;
      st.samples.push([e.timeStamp, e.clientX]);
      if (st.samples.length > 6) st.samples.shift();
      if (st.mode === 'drag' && st.turn && st.dir) {
        let u = clamp(Math.abs(dx) / (st.width * GESTURE.dragReach), 0, 1);
        // Progress only counts while moving the way the turn goes.
        if ((st.dir > 0 && dx > 0) || (st.dir < 0 && dx < 0)) u = 0;
        renderTurn(st.turn.top, st.turn.under, st.turn.forward ? u : 1 - u, st.width);
        st.u = u;
      } else if (st.mode === 'rubber') {
        const x = Math.sign(dx) * Math.min(GESTURE.rubberMax, Math.abs(dx) * GESTURE.rubberRatio);
        const el = a.pageEl(a.current());
        if (el) el.style.transform = `translate3d(${x}px,0,0)`;
      }
    };

    const onEnd = (e: PointerEvent) => {
      if (!st || e.pointerId !== st.id) return;
      const s = st;
      st = null;
      setDragging(false);
      const a = api();
      const dt = Math.max(1, e.timeStamp - s.samples[0][0]);
      const vx = (s.samples[s.samples.length - 1][1] - s.samples[0][1]) / dt;
      if (e.type === 'pointercancel' && !s.mode) return;
      if (!s.mode) {
        // A tap.
        if (e.type !== 'pointerup') return;
        if (Math.hypot(e.clientX - s.x, e.clientY - s.y) > GESTURE.slop || e.timeStamp - s.t > GESTURE.tapMaxMs) return;
        if ((s.target as Element | null)?.closest?.(INTERACTIVE)) return;
        const rx = (e.clientX - s.left) / s.width;
        if (a.isCover()) {
          a.next();
          return;
        }
        if (a.isOrigin()) {
          if (rx < GESTURE.originTapBack) a.prev();
          else a.next();
          return;
        }
        if (rx > GESTURE.tapForward) a.next();
        else if (rx < GESTURE.tapBack) a.prev();
        return;
      }
      if (s.mode === 'rubber') {
        const el = a.pageEl(a.current());
        if (!el) return;
        const x0 = parseFloat((el.style.transform.match(/-?[\d.]+/) ?? ['0'])[0]) || 0;
        tween(
          x0,
          0,
          GESTURE.rubberReturnMs,
          easeOut,
          (x) => (el.style.transform = `translate3d(${x}px,0,0)`),
          () => (el.style.transform = '')
        );
        return;
      }
      const dir: 1 | -1 = s.dx < 0 ? 1 : -1;
      const fast = Math.abs(vx) > GESTURE.flickVelocity && Math.sign(vx) === Math.sign(s.dx);
      const go = Math.abs(s.dx) / s.width > GESTURE.commitFraction || fast;
      const released = e.type === 'pointerup';
      if (s.mode === 'step') {
        if (go && released) a.originStep(dir);
        return;
      }
      if (s.mode === 'commit') {
        if (go && released) (dir > 0 ? a.next : a.prev)();
        return;
      }
      if (s.mode === 'drag' && s.turn) {
        const turn = s.turn;
        const u = s.u ?? 0;
        const wantTurn = go && dir === s.dir && released;
        a.setBusy(true);
        const t0 = turn.forward ? u : 1 - u;
        const t1 = wantTurn ? (turn.forward ? 1 : 0) : turn.forward ? 0 : 1;
        const dur = Math.max(READER.settleMinMs, Math.round(READER.settleMs * Math.abs(t1 - t0)));
        tween(
          t0,
          t1,
          dur,
          easeOut,
          (t) => renderTurn(turn.top, turn.under, t, s.width),
          () => (wantTurn ? a.commitTurn(turn) : a.cancelTurn())
        );
      }
    };

    const noDrag = (e: Event) => e.preventDefault();

    book.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);
    book.addEventListener('dragstart', noDrag);
    return () => {
      book.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
      book.removeEventListener('dragstart', noDrag);
    };
  }, [bookRef, shellRef, apiRef]);
}

