/** Meters - one category's skills as ten-segment power meters that fill in segment by segment. */

import { useEffect, useState } from 'react';
import type { SkillCategory } from '../../../types';
import useReducedMotion from '../../hooks/useReducedMotion';
import styles from './Meters.module.css';

export default function Meters({ category }: { category: SkillCategory }) {
  const reduced = useReducedMotion();
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    if (reduced) return;
    // Two frames so the empty state paints before the segments transition in.
    let id2 = 0;
    const id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => setFilled(true));
    });
    return () => {
      cancelAnimationFrame(id1);
      cancelAnimationFrame(id2);
    };
  }, [reduced, category.category]);

  return (
    <>
      <h3 className={styles.title}>{category.category}</h3>
      {category.skills.map((skill) => (
        <div key={skill.name} className={styles.row} style={{ '--c': skill.color ?? 'var(--comic-red)' } as React.CSSProperties}>
          <div className={styles.top}>
            <span className={styles.name}>{skill.name}</span>
            <span className={styles.level}>
              {skill.level}
              <small>/10</small>
            </span>
          </div>
          <div
            className={`${styles.bar} ${filled || reduced ? styles.on : ''}`}
            role="img"
            aria-label={`${skill.name}, level ${skill.level} out of 10`}
          >
            {Array.from({ length: 10 }, (_, k) => (
              <i key={k} className={`${styles.seg} ${k < skill.level ? styles.full : ''}`} style={{ '--i': k } as React.CSSProperties} />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
