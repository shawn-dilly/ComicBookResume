/** BattlePeopleReady - "Mission Briefing": TOP SECRET header, designation, threat assessment, objectives, tactical assets. */

import { useState } from 'react';
import { resumeData } from '../../../data/resume';
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

export default function BattlePeopleReady({ ref }: { ref?: React.Ref<HTMLElement> }) {
  const e = lookup(resumeData.experience, 'PeopleReady');
  const [expanded, setExpanded] = useState(false);
  if (!e) return null;
  const shown = BATTLES.peopleReady;
  return (
    <PageFace ref={ref} id="battle-peopleready" label={e.company} faceClassName={styles.mission}>
      <ScrollPage label={e.company}>
        <div className={styles.tape} aria-hidden="true" />
        <Banner small>Epic Battles</Banner>
        <div className={styles.briefing}>
          <span className={styles.secret}>TOP SECRET</span>
          <h3>MISSION BRIEFING</h3>
        </div>
        <div className={styles.companyRow}>
          <FitText as="h4" className={styles.company}>
            {e.company}
          </FitText>
          {e.location && <span className={styles.badge}>{e.location}</span>}
        </div>
        <div className={styles.designation}>
          <span className={styles.label}>DESIGNATION:</span>
          <span className={styles.role}>{e.role}</span>
          <span className={styles.period}>{e.period}</span>
        </div>
        {e.villain && (
          <div className={styles.threat}>
            <span className={styles.label}>THREAT ASSESSMENT:</span>
            <span className={styles.target}>{e.villain}</span>
            <span className={styles.priority}>HIGH PRIORITY</span>
          </div>
        )}
        <h5 className={styles.objectives}>MISSION OBJECTIVES</h5>
        <Numbered
          items={e.achievements}
          shown={shown}
          expanded={expanded}
          after={<span className={styles.done}>&#10003; COMPLETED</span>}
        />
        <ShowMore expanded={expanded} hidden={e.achievements.length - shown} onToggle={() => setExpanded((v) => !v)} />
        {e.powers && e.powers.length > 0 && (
          <div className={styles.powers}>
            <h4>TACTICAL ASSETS</h4>
            <Chips items={e.powers} />
          </div>
        )}
      </ScrollPage>
    </PageFace>
  );
}
