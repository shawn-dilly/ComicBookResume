/**
 * FitText - a single line that shrinks its font until it fits the width it is given.
 *
 * Headings here are display type on one line. Web fonts may arrive late (or not at all), so the line is re-fitted
 * when the parent resizes and when fonts finish loading. The element must be `white-space: nowrap` and have a
 * bounded width (block, or inline-block with `max-width: 100%`); the CSS Module of the caller provides that.
 */

import { useLayoutEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from 'react';

interface FitTextProps {
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

const SHRINK = 0.94;
const MAX_STEPS = 40;
/** Never shrink below this share of the CSS size: a bad measurement must not leave a speck of a heading. */
const FLOOR = 0.55;

/**
 * Fit one line to its width. Transitions are switched off while measuring: under reduced motion the global rule gives
 * every property a near-zero transition, and a font-size change then keeps reading as the old value until the next
 * frame, so the loop would never see the text shrink and would run to its limit.
 */
function fit(el: HTMLElement): void {
  const keep = el.style.transition;
  el.style.transition = 'none';
  el.style.fontSize = '';
  if (el.clientWidth) {
    const max = parseFloat(getComputedStyle(el).fontSize);
    const min = max * FLOOR;
    let size = max;
    let guard = 0;
    while (el.scrollWidth > el.clientWidth + 1 && size > min && guard < MAX_STEPS) {
      size = Math.max(min, size * SHRINK);
      el.style.fontSize = `${size.toFixed(2)}px`;
      guard += 1;
    }
  }
  el.style.transition = keep;
}

export default function FitText({ as: Tag = 'span', className, style, children }: FitTextProps) {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    fit(el);
    let cancelled = false;
    let frame = 0;
    // Re-fit on the next frame (merges bursts, and keeps a fit from re-triggering its own observer in a loop).
    const refit = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!cancelled) fit(el);
      });
    };
    void document.fonts?.ready.then(() => {
      if (!cancelled) fit(el);
    });
    // The parent's width, the heading's own box, and the heading becoming visible (its page turning current).
    const ro = new ResizeObserver(refit);
    if (el.parentElement) ro.observe(el.parentElement);
    ro.observe(el);
    const io = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(refit);
    io?.observe(el);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      ro.disconnect();
      io?.disconnect();
    };
  }, [children]);

  return (
    <Tag ref={ref} className={className} style={style} data-fit="">
      {children}
    </Tag>
  );
}
