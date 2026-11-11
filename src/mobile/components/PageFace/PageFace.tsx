/**
 * PageFace - one sheet of the reader: a front face (the page) and a back face (the paper seen mid-turn).
 *
 * The shade, cast and spine layers are driven by the page turn (see reader/pageTurn.ts). Which sheet is visible
 * is decided by the reader (class `is-cur`, `inert`, aria-hidden), not by React props, so re-renders never fight a
 * turn in progress.
 */

import type { ReactNode, Ref } from 'react';
import styles from './PageFace.module.css';

interface PageFaceProps {
  id: string;
  label: string;
  /** Extra class for the front face (page-specific paper). */
  faceClassName?: string;
  ref?: Ref<HTMLElement>;
  children: ReactNode;
}

export default function PageFace({ id, label, faceClassName = '', ref, children }: PageFaceProps) {
  return (
    <section ref={ref} className={styles.page} id={`pg-${id}`} aria-label={label} data-page={id}>
      <div className={`${styles.face} ${styles.front} ${faceClassName}`}>
        {children}
        <div className={styles.shade} data-shade="front" />
        <div className={styles.cast} data-cast />
        <div className={styles.spine} />
      </div>
      <div className={`${styles.face} ${styles.back}`}>
        <div className={styles.shade} data-shade="back" />
      </div>
    </section>
  );
}
