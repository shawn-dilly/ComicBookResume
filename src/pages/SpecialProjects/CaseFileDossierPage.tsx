import { forwardRef } from 'react';
import { Page } from '../../components';
import { resumeData } from '../../data/resume';
import type { CaseFileSection } from '../../types';
import styles from './CaseFile.module.css';

interface CaseFileDossierPageProps {
  pageNumber: number;
}

const ACCENTS = ['var(--comic-blue)', 'var(--comic-purple)', 'var(--comic-green)'];

function Block({ section, accent, id }: { section: CaseFileSection; accent: string; id: string }) {
  return (
    <section className={styles.block} style={{ '--accent': accent } as React.CSSProperties} data-case-section={id}>
      <p>
        <b className={styles.runIn}>{section.title}</b> {section.text}
      </p>
    </section>
  );
}

/** Left page of the Project Gridiron case file: the dossier (mission, machine, lab, rules, verdict). */
const CaseFileDossierPage = forwardRef<HTMLDivElement, CaseFileDossierPageProps>(({ pageNumber }, ref) => {
  const { caseFile: cf, footer } = resumeData.specialProjects;
  const [codeA, ...codeRest] = cf.codename.split(' ');
  return (
    <Page ref={ref} pageNumber={pageNumber} variant="inner">
      <div className={styles.page} data-case-file="dossier">
        <div className={styles.fit}>
          <header className={styles.top}>
            <div>
              <span className={styles.tab}>{cf.label}</span>
              <h2 className={styles.title}>{cf.title}</h2>
            </div>
            <div className={styles.codename}>
              {codeA}
              <br />
              {codeRest.join(' ')}
            </div>
          </header>

          <section className={styles.mission} data-case-section="mission">
            <h3 className={styles.chip}>{cf.mission.title}</h3>
            <p>{cf.mission.text}</p>
            <ul className={styles.goals}>
              {cf.mission.goals.map((goal) => (
                <li key={goal}>{goal}</li>
              ))}
            </ul>
          </section>

          <Block id="machine" section={cf.machine} accent={ACCENTS[0]} />
          <Block id="lab" section={cf.lab} accent={ACCENTS[1]} />
          <Block id="rules" section={cf.rules} accent={ACCENTS[2]} />

          <aside className={styles.verdict} data-case-section="verdict">
            <div className={styles.stamp}>
              {cf.verdict.stamp.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </div>
            <p>{cf.verdict.text}</p>
          </aside>

          <footer className={styles.foot}>{footer}</footer>
        </div>
      </div>
    </Page>
  );
});

CaseFileDossierPage.displayName = 'CaseFileDossierPage';

export default CaseFileDossierPage;
