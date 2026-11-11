import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { ComicBookGSAPRef, FlipDirection } from '../components/ComicBook';
import type { WebCatchRef } from '../components/WebCatch';
import type { HoloPhase } from '../components/SkillsHologram';
import { HOLO } from '../components/SkillsHologram/holoConfig';

interface Options {
  webCatchRef: RefObject<WebCatchRef | null>;
  comicBookRef: RefObject<ComicBookGSAPRef | null>;
  /** The book is caught and can be used. */
  isHeld: boolean;
}

export interface HologramMode {
  phase: HoloPhase;
  /** A page landed: start the hologram if this is the Powers spread and the device can show it. */
  landed: (pageIndex: number) => boolean;
  /** Play it again on the spread the reader is on (the replay control). */
  replay: () => void;
  /** Can the hologram be shown here (not a phone, not reduced motion, physics running)? */
  available: () => boolean;
  /**
   * The reader asked for a page turn. While the hologram is up (or coming or going) this powers it down,
   * stands the book up and then turns the page; returns true when it took the request.
   */
  requestTurn: (direction: FlipDirection) => boolean;
  /** Escape / close control: power down and stand the book back up, no page turn. */
  requestClose: () => void;
  /** The hologram component's callbacks. */
  onReady: () => void;
  onPoweredDown: () => void;
  /** The book finished lying down or standing up (from the physics loop). */
  onPose: (state: 'down' | 'up') => void;
}

const prefersReducedMotion = (): boolean =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Orchestrates the hologram mode: enter after a flip lands on Powers & Abilities (the book lies down in its
 * four lines, the projection builds), and leave by a page turn, Escape or the close control (power down, the
 * book stands up, then the queued turn runs, if any). A turn asked for while the mode
 * is entering or leaving is queued, latest direction wins, and runs once the book is upright.
 */
export default function useHologramMode({ webCatchRef, comicBookRef, isHeld }: Options): HologramMode {
  const [phase, setPhase] = useState<HoloPhase>('off');
  const phaseRef = useRef<HoloPhase>('off');
  const pending = useRef<FlipDirection | null>(null);
  /** The power-down finished and the book is standing up. */
  const standing = useRef(false);

  const move = useCallback((next: HoloPhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const available = useCallback((): boolean => {
    if (window.innerWidth <= HOLO.phoneMaxWidth || prefersReducedMotion()) return false;
    return webCatchRef.current?.canLieDown() ?? false;
  }, [webCatchRef]);

  const enter = useCallback((): boolean => {
    if (phaseRef.current !== 'off' || !available()) return false;
    pending.current = null;
    standing.current = false;
    move('entering');
    webCatchRef.current?.lieDown();
    return true;
  }, [available, move, webCatchRef]);

  const landed = useCallback(
    (pageIndex: number): boolean => (pageIndex === HOLO.triggerPage ? enter() : false),
    [enter]
  );

  const replay = useCallback(() => {
    enter();
  }, [enter]);

  const beginExit = useCallback(() => {
    if (phaseRef.current === 'entering' || phaseRef.current === 'on') move('exiting');
  }, [move]);

  const requestTurn = useCallback(
    (direction: FlipDirection): boolean => {
      if (phaseRef.current === 'off') return false;
      pending.current = direction;
      beginExit();
      return true;
    },
    [beginExit]
  );

  const requestClose = useCallback(() => {
    if (phaseRef.current === 'off') return;
    beginExit();
  }, [beginExit]);

  const onReady = useCallback(() => {
    if (phaseRef.current !== 'entering') return;
    move('on');
    // A soft twang as the towers finish rising (the lines are holding the book).
    webCatchRef.current?.twang();
  }, [move, webCatchRef]);

  const onPoweredDown = useCallback(() => {
    if (phaseRef.current !== 'exiting' || standing.current) return;
    standing.current = true;
    webCatchRef.current?.standUp();
  }, [webCatchRef]);

  const onPose = useCallback(
    (state: 'down' | 'up') => {
      if (state === 'down') {
        // The book finished lying down in the lines: a gentle twang.
        if (phaseRef.current === 'entering') webCatchRef.current?.twang();
        return;
      }
      if (phaseRef.current !== 'exiting' || !standing.current) return;
      standing.current = false;
      move('off');
      const direction = pending.current;
      pending.current = null;
      if (direction) {
        // The usual flip: its landing shoots every corner back (see App.handleFlipLanded).
        if (direction === 'forward') comicBookRef.current?.flipNext();
        else comicBookRef.current?.flipPrev();
      } else {
        webCatchRef.current?.reattachAll();
      }
    },
    [comicBookRef, move, webCatchRef]
  );

  // Leave at once if the screen becomes phone-sized or the book is no longer held (all lines cut).
  useEffect(() => {
    const bail = (): void => {
      if (phaseRef.current === 'off') return;
      pending.current = null;
      standing.current = false;
      move('off');
      webCatchRef.current?.resetPose();
    };
    const onResize = (): void => {
      if (window.innerWidth <= HOLO.phoneMaxWidth) bail();
    };
    window.addEventListener('resize', onResize);
    if (!isHeld) bail();
    return () => window.removeEventListener('resize', onResize);
  }, [isHeld, move, webCatchRef]);

  return { phase, landed, replay, available, requestTurn, requestClose, onReady, onPoweredDown, onPose };
}
