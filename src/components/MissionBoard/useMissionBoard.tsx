import { lazy, Suspense, useCallback, useMemo, useState, type ReactNode } from 'react';
import type { MissionId } from '../../data/hireMe';

// The board (and its styles) is its own chunk: nothing about it loads until the first time it is opened.
const MissionBoard = lazy(() => import('./MissionBoard'));

export interface MissionBoardControl {
  isOpen: boolean;
  /** Opens the board; with missions it starts at step 2 with those picked. */
  open: (missions?: MissionId[]) => void;
  close: () => void;
  /** Render this once, anywhere in the app. */
  node: ReactNode;
}

/** useMissionBoard - state and the lazy element for the Mission Board, shared by the desktop and phone apps. */
export function useMissionBoard(): MissionBoardControl {
  const [state, setState] = useState<{ open: boolean; missions: MissionId[]; key: number; opener: Element | null }>({
    open: false,
    missions: [],
    key: 0,
    opener: null,
  });
  // The opener is noted when the board is asked for: the app behind goes inert (and drops focus) before the lazy board mounts.
  const open = useCallback(
    (missions: MissionId[] = []) => {
      const opener = document.activeElement === document.body ? null : document.activeElement;
      setState((s) => ({ open: true, missions, key: s.key + 1, opener }));
    },
    []
  );
  const close = useCallback(() => setState((s) => ({ ...s, open: false })), []);
  const node = useMemo(
    () =>
      state.open ? (
        <Suspense fallback={null}>
          <MissionBoard key={state.key} initial={state.missions} opener={state.opener} onClose={close} />
        </Suspense>
      ) : null,
    [state, close]
  );
  return { isOpen: state.open, open, close, node };
}
