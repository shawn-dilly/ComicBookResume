/** BattleEzlinks - "Rank Up": role cards, most recent first with stars, a RANK UP! badge between cards (as on the desktop). */

import { useState } from 'react';
import { resumeData } from '../../../data/resume';
import { BATTLES } from '../../mobileConfig';
import { Banner } from '../../components/Banner';
import { Chips } from '../../components/Chips';
import { PageFace } from '../../components/PageFace';
import { ScrollPage } from '../../components/ScrollPage';
import { ShowMore } from '../../components/ShowMore';
import { CompanyHead } from './BattleParts';
import { lookup } from './lookup';
import styles from './Battles.module.css';

const RANK_LABELS = ['★★★', '★★', '★'];

export default function BattleEzlinks({ ref }: { ref?: React.Ref<HTMLElement> }) {
  const e = lookup(resumeData.experience, 'Ezlinks Golf');
  const [expanded, setExpanded] = useState(false);
  if (!e) return null;
  const roles = e.roles ?? [];
  const per = BATTLES.ezlinksPerRole;
  const hidden = roles.reduce((n, r) => n + Math.max(0, r.highlights.length - per), 0);
  return (
    <PageFace ref={ref} id="battle-ezlinks" label={e.company} faceClassName={styles.rank}>
      <ScrollPage label={e.company}>
        <Banner small>Epic Battles</Banner>
        <CompanyHead e={e} role={false} />
        {roles.map((role, index) => (
          <section key={role.title} className={styles.card} style={{ marginLeft: `${Math.min(index, 2) * 10}px` }}>
            {index > 0 && <div className={styles.rankUp}>RANK UP!</div>}
            <div className={styles.stars}>{RANK_LABELS[index] ?? String(roles.length - index)}</div>
            <h3>{role.title}</h3>
            <div className={styles.period}>{role.period}</div>
            <ul>
              {role.highlights.map((h, j) => (j >= per && !expanded ? null : <li key={j}>{h}</li>))}
            </ul>
          </section>
        ))}
        <ShowMore expanded={expanded} hidden={hidden} onToggle={() => setExpanded((v) => !v)} />
        {e.powers && e.powers.length > 0 && (
          <div className={styles.powers}>
            <Chips items={e.powers} />
          </div>
        )}
      </ScrollPage>
    </PageFace>
  );
}
