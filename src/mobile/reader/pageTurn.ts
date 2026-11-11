/**
 * pageTurn - draws a single-page turn about the left spine, and the little tween helper that drives it.
 *
 * `t` is the fraction turned: 0 flat, 1 gone. The top page rotates about its left edge (rotateY, 0 to -180deg)
 * with a shade that peaks mid-turn; the page underneath is dimmed and receives a moving cast shadow. All work is
 * transform and opacity written straight to the elements (no React state per frame).
 */

import { READER } from '../mobileConfig';

interface Parts {
  frontShade: HTMLElement | null;
  backShade: HTMLElement | null;
  cast: HTMLElement | null;
}

const cache = new WeakMap<HTMLElement, Parts>();

function partsOf(page: HTMLElement): Parts {
  let parts = cache.get(page);
  if (!parts) {
    parts = {
      frontShade: page.querySelector<HTMLElement>('[data-shade="front"]'),
      backShade: page.querySelector<HTMLElement>('[data-shade="back"]'),
      cast: page.querySelector<HTMLElement>('[data-cast]'),
    };
    cache.set(page, parts);
  }
  return parts;
}

export const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));
export const easeInOut = (k: number): number => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
export const easeOut = (k: number): number => 1 - Math.pow(1 - k, 3);

export function renderTurn(top: HTMLElement, under: HTMLElement | null, t: number, width: number): void {
  top.style.transform = `rotateY(${(-180 * t).toFixed(2)}deg)`;
  const s = Math.sin(Math.PI * t) * READER.turnShade;
  const tp = partsOf(top);
  if (tp.frontShade) tp.frontShade.style.opacity = (t < 0.5 ? s : 0).toFixed(3);
  if (tp.backShade) tp.backShade.style.opacity = (t >= 0.5 ? s : 0).toFixed(3);
  if (under) {
    const up = partsOf(under);
    if (up.frontShade) up.frontShade.style.opacity = ((1 - t) * READER.underShade).toFixed(3);
    if (up.cast) {
      up.cast.style.transform = `translate3d(${(width * Math.cos(Math.PI * t)).toFixed(1)}px,0,0)`;
      up.cast.style.opacity = (t < 0.98 ? Math.min(1, (1 - t) * 2.2) : 0).toFixed(3);
    }
  }
}

/** Put a page back to its resting look (flat, unshaded). */
export function clearTurn(page: HTMLElement): void {
  page.style.transform = '';
  page.style.opacity = '';
  page.style.willChange = 'auto';
  const p = partsOf(page);
  for (const el of [p.frontShade, p.backShade, p.cast]) {
    if (el) {
      el.style.opacity = '0';
      el.style.transform = '';
    }
  }
}

export interface Tween {
  kill: () => void;
}

export function tween(
  from: number,
  to: number,
  ms: number,
  ease: (k: number) => number,
  update: (v: number) => void,
  done?: () => void
): Tween {
  let t0: number | null = null;
  let id = 0;
  let dead = false;
  const step = (ts: number) => {
    if (dead) return;
    if (t0 === null) t0 = ts;
    const k = clamp((ts - t0) / ms, 0, 1);
    update(from + (to - from) * ease(k));
    if (k < 1) id = requestAnimationFrame(step);
    else done?.();
  };
  id = requestAnimationFrame(step);
  return {
    kill: () => {
      dead = true;
      cancelAnimationFrame(id);
    },
  };
}
