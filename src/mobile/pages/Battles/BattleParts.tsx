/** Shared bits of the Epic Battles pages: company heading, stats strip, numbered list. */

import type { ReactNode } from 'react';
import type { Experience } from '../../../types';
import { FitText } from '../../components/FitText';
import styles from './Battles.module.css';

export function CompanyHead({ e, villain = true, role = true }: { e: Experience; villain?: boolean; role?: boolean }) {
  return (
    <>
      <FitText as="h3" className={styles.company}>
        {e.company}
      </FitText>
      <div className={styles.sub}>
        <span>{e.period}</span>
        {e.location && <span>{e.location}</span>}
      </div>
      {role && <div className={styles.role}>{e.role}</div>}
      {villain && e.villain && <div className={styles.vs}>VS. {e.villain}</div>}
    </>
  );
}

export function Stats({ e }: { e: Experience }) {
  if (!e.stats?.length) return null;
  return (
    <div className={styles.stats}>
      {e.stats.map((s) => (
        <div key={s.label} className={styles.stat}>
          <b>{s.value}</b>
          <span>{s.label}</span>
        </div>
      ))}
    </div>
  );
}

interface NumberedProps {
  items: readonly string[];
  shown: number;
  expanded: boolean;
  /** Extra markup after each item (status tag). */
  after?: ReactNode;
  className?: string;
}

export function Numbered({ items, shown, expanded, after, className = '' }: NumberedProps) {
  return (
    <ol className={`${styles.ach} ${className}`}>
      {items.map((text, i) => {
        if (i >= shown && !expanded) return null;
        return (
          <li key={i} className={i >= shown ? styles.extra : undefined}>
            <span className={styles.n}>{String(i + 1).padStart(2, '0')}</span>
            <span className={styles.text}>
              {text}
              {after}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
