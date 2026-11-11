/**
 * AlliesPage - Mighty Allies: every testimonial as a speech-bubble card with the name, the title and company, and
 * the alias from the data (shown as "a.k.a." like the desktop). Long quotes are clamped with Read more.
 */

import { useState } from 'react';
import { resumeData } from '../../../data/resume';
import type { Testimonial } from '../../../types';
import { ALLIES } from '../../mobileConfig';
import { Banner } from '../../components/Banner';
import { PageFace } from '../../components/PageFace';
import { ScrollPage } from '../../components/ScrollPage';
import styles from './AlliesPage.module.css';

const COLOURS = ['var(--comic-blue)', 'var(--comic-green)', 'var(--comic-purple)', 'var(--comic-orange)', 'var(--comic-red)'];

function Ally({ t, index }: { t: Testimonial; index: number }) {
  const long = t.quote.length > ALLIES.clampChars;
  const [open, setOpen] = useState(false);
  return (
    <article className={`${styles.card} ${index % 2 ? styles.even : ''}`}>
      <div className={styles.bubble}>
        <p className={long && !open ? styles.clamp : undefined} style={{ '--lines': ALLIES.clampLines } as React.CSSProperties}>
          &ldquo;{t.quote}&rdquo;
        </p>
        {long && (
          <button type="button" className={styles.read} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            {open ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>
      <div className={styles.who}>
        <div className={styles.avatar} style={{ background: COLOURS[index % COLOURS.length] }} aria-hidden="true">
          {t.name.charAt(0)}
        </div>
        <div className={styles.name}>
          <b>{t.name}</b>
          <span>{t.role}</span>
          {t.heroAlias && <em>a.k.a. {t.heroAlias}</em>}
        </div>
      </div>
    </article>
  );
}

export default function AlliesPage({ ref }: { ref?: React.Ref<HTMLElement> }) {
  return (
    <PageFace ref={ref} id="mighty-allies" label="Mighty Allies">
      <ScrollPage label="Mighty Allies">
        <Banner>Mighty Allies</Banner>
        {resumeData.testimonials.map((t, i) => (
          <Ally key={t.name} t={t} index={i} />
        ))}
        <div style={{ height: 6 }} />
      </ScrollPage>
    </PageFace>
  );
}
