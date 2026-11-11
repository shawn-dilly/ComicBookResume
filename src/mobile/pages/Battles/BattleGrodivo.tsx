/** BattleGrodivo - "Lab Blueprint": cyan blueprint with a stat strip, build log and component badges (as on the desktop). */

import { useState } from 'react';
import { resumeData } from '../../../data/resume';
import { BATTLES } from '../../mobileConfig';
import { Banner } from '../../components/Banner';
import { Chips } from '../../components/Chips';
import { PageFace } from '../../components/PageFace';
import { ScrollPage } from '../../components/ScrollPage';
import { ShowMore } from '../../components/ShowMore';
import { CompanyHead, Numbered, Stats } from './BattleParts';
import { lookup } from './lookup';
import styles from './Battles.module.css';

export default function BattleGrodivo({ ref }: { ref?: React.Ref<HTMLElement> }) {
  const e = lookup(resumeData.experience, 'Grodivo');
  const [expanded, setExpanded] = useState(false);
  if (!e) return null;
  const shown = BATTLES.grodivo;
  return (
    <PageFace ref={ref} id="battle-grodivo" label={e.company} faceClassName={styles.blueprint}>
      <ScrollPage label={e.company}>
        <Banner small>Epic Battles</Banner>
        <CompanyHead e={e} />
        <Stats e={e} />
        <div className={styles.plate}>
          <div className={styles.plateTitle}>
            <span>BLUEPRINT // BUILD LOG</span>
            <span>REV. 2026</span>
          </div>
          <Numbered items={e.achievements} shown={shown} expanded={expanded} />
          <ShowMore expanded={expanded} hidden={e.achievements.length - shown} onToggle={() => setExpanded((v) => !v)} />
        </div>
        {e.powers && e.powers.length > 0 && (
          <div className={styles.powers}>
            <h4>COMPONENTS:</h4>
            <Chips items={e.powers} />
          </div>
        )}
      </ScrollPage>
    </PageFace>
  );
}
