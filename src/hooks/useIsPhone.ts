/**
 * useIsPhone - is the viewport phone-sized? Decides between the desktop flipbook and the phone reader.
 *
 * Uses matchMedia on `(max-width: 600px)`, the width the site already treats as a phone (WebCatch compact
 * mode, hologram off), and re-renders when the window crosses it. The first render already has the right
 * answer (matchMedia is synchronous), so there is no flash of the wrong layout.
 */

import { useSyncExternalStore } from 'react';

/** Viewports at most this wide (px) get the phone reader. Same value as THRESHOLDS.phoneMaxWidth / HOLO.phoneMaxWidth. */
export const PHONE_MAX_WIDTH = 600;

const QUERY = `(max-width: ${PHONE_MAX_WIDTH}px)`;

function subscribe(onChange: () => void): () => void {
  if (typeof window.matchMedia !== 'function') return () => {};
  const mq = window.matchMedia(QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

function getSnapshot(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(QUERY).matches;
}

export default function useIsPhone(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
