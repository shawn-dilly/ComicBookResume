/** BattleEarlyCareer - Geneca and Healthation together: two stacked cards, each with its role, villain, list and badges. */

import { useState } from 'react';
import { resumeData } from '../../../data/resume';
import type { Experience } from '../../../types';
import { BATTLES } from '../../mobileConfig';
import { Banner } from '../../components/Banner';
import { Chips } from '../../components/Chips';
import { FitText } from '../../components/FitText';
import { PageFace } from '../../components/PageFace';
import { ScrollPage } from '../../components/ScrollPage';
import { ShowMore } from '../../components/ShowMore';
import { Numbered } from './BattleParts';
import { lookup } from './lookup';
import styles from './Battles.module.css';

function Card({ e, accent }: { e: Experience; accent: string }) {
  const [expanded, setExpanded] = useState(false);
  const shown = BATTLES.early;
  return (
    <section className={styles.ecCard} style={{ '--accent': accent } as React.CSSProperties}>
      <span className={styles.caption}>
        {e.period}
        {e.location ? ` · ${e.location}` : ''}
      </span>
      <FitText as="h3" className={styles.company}>
        {e.company}
      </FitText>
      <div className={styles.role}>{e.role}</div>
      {e.villain && <div className={styles.vs}>VS. {e.villain}</div>}
      <Numbered items={e.achievements} shown={shown} expanded={expanded} />
      <ShowMore expanded={expanded} hidden={e.achievements.length - shown} onToggle={() => setExpanded((v) => !v)} />
      {e.powers && e.powers.length > 0 && (
        <div className={styles.powers}>
          <Chips items={e.powers} />
        </div>
      )}
    </section>
  );
}

export default function BattleEarlyCareer({ ref }: { ref?: React.Ref<HTMLElement> }) {
  const geneca = lookup(resumeData.experience, 'Geneca');
  const healthation = lookup(resumeData.experience, 'Healthation');
  if (!geneca || !healthation) return null;
  return (
    <PageFace ref={ref} id="battle-early-career" label={`${geneca.company} + ${healthation.company}`} faceClassName={styles.early}>
      <ScrollPage label={`${geneca.company} + ${healthation.company}`}>
        <Banner small>Epic Battles</Banner>
        <Card e={geneca} accent="var(--comic-purple)" />
        <Card e={healthation} accent="var(--comic-orange)" />
      </ScrollPage>
    </PageFace>
  );
}
