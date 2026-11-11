/**
 * ContentsSheet - the contents list as a bottom-sheet dialog.
 *
 * Focus moves to the close button on open, Tab stays inside the sheet, Escape (handled by the reader) and the
 * scrim close it, and focus returns to the button that opened it. While it is open the reader and the bar are made
 * inert by the reader. The current page is marked with aria-current.
 */

import { useEffect, useRef } from 'react';
import { CHAPTERS, PAGES, pageIndex } from '../pages';
import styles from './ContentsSheet.module.css';

interface ContentsSheetProps {
  open: boolean;
  current: number;
  onClose: () => void;
  onGo: (index: number) => void;
}

const FOCUSABLE = 'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

export default function ContentsSheet({ open, current, onClose, onGo }: ContentsSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement;
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 60);
    return () => {
      window.clearTimeout(focusTimer);
      const opener = openerRef.current;
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, [open]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const items = Array.from(sheetRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const currentId = PAGES[current].id;

  return (
    <div
      ref={sheetRef}
      className={`${styles.sheet} ${open ? styles.open : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="contents-title"
      inert={!open}
      onKeyDown={onKeyDown}
    >
      <div className={styles.scrim} onClick={onClose} aria-hidden="true" />
      <div className={styles.panel}>
        <header className={styles.header}>
          <h2 id="contents-title">Contents</h2>
          <button ref={closeRef} type="button" className={styles.close} aria-label="Close contents" onClick={onClose}>
            &#10005;
          </button>
        </header>
        <div className={styles.body}>
          <ol className={styles.list}>
            {CHAPTERS.map((chapter, ci) => (
              <li key={chapter.id}>
                <button
                  type="button"
                  className={`${styles.item} ${chapter.first === currentId || chapter.children?.includes(currentId) ? styles.cur : ''}`}
                  aria-current={chapter.first === currentId && !chapter.children ? 'page' : undefined}
                  onClick={() => onGo(pageIndex(chapter.first))}
                >
                  <span className={styles.no}>{ci + 1}</span>
                  <span className={styles.title}>{chapter.title}</span>
                </button>
                {chapter.children && (
                  <ol className={styles.sub}>
                    {chapter.children.map((id) => (
                      <li key={id}>
                        <button
                          type="button"
                          className={`${styles.item} ${styles.subItem} ${id === currentId ? styles.cur : ''}`}
                          aria-current={id === currentId ? 'page' : undefined}
                          onClick={() => onGo(pageIndex(id))}
                        >
                          <span className={styles.title}>{PAGES[pageIndex(id)].title}</span>
                        </button>
                      </li>
                    ))}
                  </ol>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
