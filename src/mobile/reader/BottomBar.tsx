/**
 * BottomBar - back / next, the chapter name with the position, the contents button and HIRE ME.
 *
 * Buttons use aria-disabled (not `disabled`) so focus is not lost when the first or last page is reached.
 * HIRE ME is hidden on the contact page.
 */

import { PAGES } from '../pages';
import styles from './BottomBar.module.css';

interface BottomBarProps {
  current: number;
  canGoBack: boolean;
  canGoNext: boolean;
  hireHidden: boolean;
  onPrev: () => void;
  onNext: () => void;
  onContents: () => void;
  onHire: () => void;
}

const Chevron = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d={d} />
  </svg>
);

export default function BottomBar({
  current,
  canGoBack,
  canGoNext,
  hireHidden,
  onPrev,
  onNext,
  onContents,
  onHire,
}: BottomBarProps) {
  const total = PAGES.length;
  return (
    <nav className={styles.bar} aria-label="Page navigation">
      <button
        type="button"
        className={styles.circle}
        aria-label="Previous page"
        aria-disabled={!canGoBack}
        onClick={() => canGoBack && onPrev()}
      >
        <Chevron d="M15 4 7 12l8 8" />
      </button>
      <button
        type="button"
        className={styles.toc}
        aria-haspopup="dialog"
        aria-label={`Contents. ${PAGES[current].title}, page ${current + 1} of ${total}`}
        onClick={onContents}
      >
        <span className={styles.line}>
          <span className={styles.chapter}>{PAGES[current].title}</span>
          <span className={styles.count} data-testid="reader-count">
            {current + 1}/{total}
          </span>
        </span>
        <span className={styles.dots} aria-hidden="true">
          {PAGES.map((p, i) => (
            <i key={p.id} className={i === current ? styles.on : i < current ? styles.past : ''} />
          ))}
        </span>
      </button>
      <button
        type="button"
        className={styles.circle}
        aria-label="Next page"
        aria-disabled={!canGoNext}
        onClick={() => canGoNext && onNext()}
      >
        <Chevron d="m9 4 8 8-8 8" />
      </button>
      <button
        type="button"
        className={`${styles.hire} ${hireHidden ? styles.hireOff : ''}`}
        aria-label="Hire me: jump to contact"
        tabIndex={hireHidden ? -1 : 0}
        aria-hidden={hireHidden}
        onClick={onHire}
      >
        HIRE ME!
      </button>
    </nav>
  );
}
