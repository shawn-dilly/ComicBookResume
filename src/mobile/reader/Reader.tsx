/**
 * Reader - the phone reader: one page at a time with a single-page 3D turn that follows the finger.
 *
 * Page state lives in React (`current`, the origin-story panel); motion does not. Turns are drawn by writing
 * transforms to the page elements (see pageTurn.ts) and React is told once a turn lands. The reader also owns the
 * bottom bar, the contents sheet, keyboard arrows and `#page` deep links.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { useMissionBoard } from '../../components/MissionBoard';
import { LAYOUT, READER } from '../mobileConfig';
import { PAGES, pageFromHash } from '../pages';
import { PageStack } from '../pages/PageStack';
import { prefersReducedMotion } from '../hooks/useReducedMotion';
import { ORIGIN_PANEL_COUNT } from '../pages/OriginStory';
import BottomBar from './BottomBar';
import HireBar from './HireBar';
import ContentsSheet from './ContentsSheet';
import useReaderGestures, { type ReaderApi, type TurnHandle } from './useReaderGestures';
import { clearTurn, easeInOut, renderTurn, tween } from './pageTurn';
import styles from './Reader.module.css';

interface ReaderProps {
  startIndex: number;
}

interface NavOptions {
  /** Skip the turn and fade instead. */
  instant?: boolean;
  /** Jumps from the contents sheet and deep links. */
  force?: boolean;
}

const FADE_MS = 320;

export default function Reader({ startIndex }: ReaderProps) {
  const total = PAGES.length;
  const [current, setCurrent] = useState(startIndex);
  const [originPanel, setOriginPanelState] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const board = useMissionBoard();
  const boardOpenRef = useRef(false);
  useEffect(() => {
    boardOpenRef.current = board.isOpen;
  }, [board.isOpen]);

  const shellRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLElement>(null);
  const barWrapRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<Array<HTMLElement | null>>([]);
  const apiRef = useRef<ReaderApi | null>(null);

  const curRef = useRef(startIndex);
  const busyRef = useRef(false);
  const panelRef = useRef(0);
  const fadeTimer = useRef(0);

  const setPanel = useCallback((n: number) => {
    const next = Math.max(0, Math.min(ORIGIN_PANEL_COUNT - 1, n));
    panelRef.current = next;
    setOriginPanelState(next);
  }, []);

  /** Resting look: only the current page is visible, reachable and unshaded. */
  const applyRest = useCallback((cur: number) => {
    pagesRef.current.forEach((el, i) => {
      if (!el) return;
      clearTurn(el);
      el.classList.toggle('is-cur', i === cur);
      el.style.zIndex = i === cur ? '2' : '1';
      el.setAttribute('aria-hidden', i === cur ? 'false' : 'true');
      el.inert = i !== cur;
    });
  }, []);

  useLayoutEffect(() => {
    applyRest(startIndex);
  }, [applyRest, startIndex]);

  const writeHash = useCallback((index: number) => {
    try {
      const hash = `#${PAGES[index].id}`;
      if (window.location.hash !== hash) window.history.replaceState(null, '', hash);
    } catch {
      /* History unavailable: deep links just do not update. */
    }
  }, []);

  const commit = useCallback(
    (to: number) => {
      curRef.current = to;
      setCurrent(to);
      applyRest(to);
      busyRef.current = false;
      writeHash(to);
    },
    [applyRest, writeHash]
  );

  const prepTurn = useCallback(
    (to: number): TurnHandle => {
      const from = curRef.current;
      const forward = to > from;
      const topIndex = forward ? from : to;
      const underIndex = forward ? to : from;
      const top = pagesRef.current[topIndex] as HTMLElement;
      const under = pagesRef.current[underIndex] as HTMLElement;
      if (PAGES[to].id === 'origin-story') setPanel(forward ? 0 : ORIGIN_PANEL_COUNT - 1);
      for (const el of [under, top]) {
        el.classList.add('is-cur');
        el.inert = false;
        el.setAttribute('aria-hidden', 'false');
      }
      under.style.zIndex = '2';
      top.style.zIndex = '3';
      top.style.willChange = 'transform';
      return { top, under, forward, from, to };
    },
    [setPanel]
  );

  const navigate = useCallback(
    (to: number, opts: NavOptions = {}) => {
      const from = curRef.current;
      if (to < 0 || to >= total || to === from) return;
      if (busyRef.current) return;
      busyRef.current = true;
      if (prefersReducedMotion() || opts.instant || Math.abs(to - from) > 1) {
        // Fade (reduced motion, or a jump across several pages).
        if (PAGES[to].id === 'origin-story') setPanel(0);
        const el = pagesRef.current[to];
        commit(to);
        if (el) {
          el.setAttribute('data-fade', '');
          window.clearTimeout(fadeTimer.current);
          fadeTimer.current = window.setTimeout(() => el.removeAttribute('data-fade'), FADE_MS);
        }
        return;
      }
      const turn = prepTurn(to);
      const width = bookRef.current?.clientWidth ?? 0;
      const startT = turn.forward ? 0 : 1;
      const endT = turn.forward ? 1 : 0;
      tween(startT, endT, READER.turnMs, easeInOut, (t) => renderTurn(turn.top, turn.under, t, width), () => commit(to));
    },
    [commit, prepTurn, setPanel, total]
  );

  const jumpTo = useCallback(
    (index: number) => {
      setSheetOpen(false);
      if (index === curRef.current) return;
      navigate(index, { instant: true, force: true });
    },
    [navigate]
  );

  const next = useCallback(() => {
    if (PAGES[curRef.current].id === 'origin-story' && panelRef.current < ORIGIN_PANEL_COUNT - 1) {
      setPanel(panelRef.current + 1);
      return;
    }
    navigate(curRef.current + 1);
  }, [navigate, setPanel]);

  const prev = useCallback(() => {
    if (PAGES[curRef.current].id === 'origin-story' && panelRef.current > 0) {
      setPanel(panelRef.current - 1);
      return;
    }
    navigate(curRef.current - 1);
  }, [navigate, setPanel]);

  // Hash deep links typed or followed while the reader is open.
  useEffect(() => {
    const onHash = () => {
      const i = pageFromHash(window.location.hash);
      if (i > -1 && i !== curRef.current) {
        setSheetOpen(false);
        navigate(i, { instant: true, force: true });
      }
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [navigate]);

  // Keyboard arrows (also handy at desktop width in a narrow window).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSheetOpen(false);
        return;
      }
      if (sheetOpen || boardOpenRef.current || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        prev();
      } else if (e.key === 'Home') {
        jumpTo(0);
      } else if (e.key === 'End') {
        jumpTo(total - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheetOpen, next, prev, jumpTo, total]);

  // While the contents sheet is open nothing behind it can be reached.
  useEffect(() => {
    const parts = [bookRef.current, barWrapRef.current];
    for (const el of parts) if (el) el.inert = sheetOpen;
    return () => {
      for (const el of parts) if (el) el.inert = false;
    };
  }, [sheetOpen]);

  useLayoutEffect(() => {
    apiRef.current = {
      busy: () => busyRef.current,
      setBusy: (b) => {
        busyRef.current = b;
      },
      current: () => curRef.current,
      pageCount: () => total,
      reducedMotion: prefersReducedMotion,
      isCover: () => curRef.current === 0,
      isOrigin: () => PAGES[curRef.current].id === 'origin-story',
      originCan: (dir) => (dir > 0 ? panelRef.current < ORIGIN_PANEL_COUNT - 1 : panelRef.current > 0),
      originStep: (dir) => setPanel(panelRef.current + dir),
      pageEl: (i) => pagesRef.current[i] ?? null,
      prepTurn,
      commitTurn: (turn) => commit(turn.to),
      cancelTurn: () => {
        busyRef.current = false;
        applyRest(curRef.current);
      },
      next,
      prev,
    };
  });

  useReaderGestures(bookRef, shellRef, apiRef);

  const onOrigin = PAGES[current].id === 'origin-story';
  const canGoBack = current > 0 || (onOrigin && originPanel > 0);
  const canGoNext = current < total - 1 || (onOrigin && originPanel < ORIGIN_PANEL_COUNT - 1);
  // The HIRE ME! bar sits above the bottom bar and takes room from the pages, except on the contact page.
  const hireHidden = PAGES[current].id === 'contact';
  const style = {
    '--m-bar-height': `calc(${LAYOUT.barHeight}px + env(safe-area-inset-bottom, 0px))`,
    '--m-hire-height': `${hireHidden ? 0 : LAYOUT.hireHeight}px`,
  } as CSSProperties;

  return (
    <div ref={shellRef} className={styles.shell} style={style}>
      <main
        ref={bookRef}
        className={styles.book}
        aria-label="Comic resume, one page at a time"
        style={{ perspective: READER.perspective, perspectiveOrigin: READER.perspectiveOrigin }}
      >
        <PageStack
          setRef={(i) => (el) => {
            pagesRef.current[i] = el;
          }}
          current={current}
          originPanel={originPanel}
          onOpenCover={next}
          onBackToCover={() => jumpTo(0)}
          boardOpen={board.isOpen}
          onOpenBoard={board.open}
        />
      </main>
      <div className={styles.veil} aria-hidden="true" />
      <div ref={barWrapRef} className={styles.barWrap}>
        <BottomBar
          current={current}
          canGoBack={canGoBack}
          canGoNext={canGoNext}
          onPrev={prev}
          onNext={next}
          onContents={() => setSheetOpen(true)}
        />
        <HireBar hidden={hireHidden} onOpen={() => board.open()} />
      </div>
      {board.node}
      <ContentsSheet open={sheetOpen} current={current} onClose={() => setSheetOpen(false)} onGo={jumpTo} />
      <div className={styles.live} role="status" aria-live="polite">
        {`${PAGES[current].title}, page ${current + 1} of ${total}`}
      </div>
    </div>
  );
}
