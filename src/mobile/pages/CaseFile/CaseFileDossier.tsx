/** CaseFileDossier - Secret Lab Projects, page 1: the Project Gridiron dossier (mission, machine, lab, rules, verdict). */

import { resumeData } from '../../../data/resume';
import { PageFace } from '../../components/PageFace';
import { ScrollPage } from '../../components/ScrollPage';
import styles from './CaseFile.module.css';

export default function CaseFileDossier({ ref }: { ref?: React.Ref<HTMLElement> }) {
  const { caseFile: cf, footer } = resumeData.specialProjects;
  const sections = [
    { key: 'machine', s: cf.machine },
    { key: 'lab', s: cf.lab },
    { key: 'rules', s: cf.rules },
  ];
  return (
    <PageFace ref={ref} id="case-file-dossier" label={cf.codename} faceClassName={styles.face}>
      <ScrollPage label={cf.codename}>
        <div className={styles.tabRow}>
          <span className={styles.tab}>{cf.label}</span>
          <span className={styles.codename}>{cf.codename}</span>
        </div>
        <h2 className={styles.title}>{cf.title}</h2>

        <section className={styles.mission} data-case-section="mission">
          <h3 className={styles.sectionHead}>{cf.mission.title}</h3>
          <p>{cf.mission.text}</p>
          <ul className={styles.goals}>
            {cf.mission.goals.map((g, i) => (
              <li key={g} className={i === 0 ? styles.goalA : styles.goalB}>
                {g}
              </li>
            ))}
          </ul>
        </section>

        {sections.map(({ key, s }) => (
          <section key={key} className={`${styles.block} ${styles[key]}`} data-case-section={key}>
            <h3 className={styles.sectionHead}>{s.title}</h3>
            <p>{s.text}</p>
          </section>
        ))}

        <section className={styles.verdict} data-case-section="verdict">
          <div className={styles.stamp}>
            {cf.verdict.stamp.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>
          <p>{cf.verdict.text}</p>
        </section>

        <p className={styles.foot}>{footer}</p>
      </ScrollPage>
    </PageFace>
  );
}
