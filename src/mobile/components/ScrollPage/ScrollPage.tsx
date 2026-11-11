/**
 * ScrollPage - the vertically scrolling body of a page, with a SCROLL hint while more is hidden below.
 *
 * The scroller is keyboard focusable (arrow keys scroll it). The hint is decorative (aria-hidden) and is shown
 * only when more than `LAYOUT.moreThreshold` px are still below the fold.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { LAYOUT } from '../../mobileConfig';
import styles from './ScrollPage.module.css';

interface ScrollPageProps {
  label: string;
  className?: string;
  children: ReactNode;
}

export default function ScrollPage({ label, className = '', children }: ScrollPageProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState(false);

  useEffect(() => {
    const scroller = scrollRef.current;
    const inner = innerRef.current;
    if (!scroller || !inner) return;
    const update = () => {
      const hidden = scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop;
      setMore(scroller.scrollHeight > scroller.clientHeight + LAYOUT.moreThreshold && hidden > LAYOUT.moreThreshold);
    };
    update();
    scroller.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(scroller);
    ro.observe(inner);
    return () => {
      scroller.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, []);

  return (
    <div className={styles.wrap}>
      <div ref={scrollRef} className={`${styles.scroll} ${className}`} tabIndex={0} role="region" aria-label={label} data-scroller>
        <div ref={innerRef}>{children}</div>
      </div>
      {more && (
        <div className={styles.more} aria-hidden="true">
          Scroll &#9662;
        </div>
      )}
    </div>
  );
}
