import { forwardRef } from 'react';
import { Page } from '../../components';
import { resumeData } from '../../data/resume';
import shared from '../pages.module.css';
import LoopDiagram from './LoopDiagram';
import styles from './CaseFile.module.css';

interface CaseFileLoopPageProps {
  pageNumber: number;
  /** This spread is showing: the loop pulse runs only then, and the page is reachable only then. */
  isVisible: boolean;
}

const TOKEN_COLORS = ['var(--comic-red)', 'var(--comic-blue)', 'var(--comic-green)', 'var(--comic-purple)', 'var(--comic-orange)'];

/** Right page of the Project Gridiron case file: the agent loop, the bake-off, the numbers and what it found. */
const CaseFileLoopPage = forwardRef<HTMLDivElement, CaseFileLoopPageProps>(({ pageNumber, isVisible }, ref) => {
  const { caseFile: cf, footer } = resumeData.specialProjects;
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <Page ref={ref} pageNumber={pageNumber} variant="inner">
      <div className={styles.page} data-case-file="loop" inert={!isVisible}>
        <div className={styles.fit}>
          <h2 className={`${shared.pageHeader} ${styles.pageHead}`}>{cf.loop.title}</h2>

          <LoopDiagram nodes={cf.loop.nodes} hint={cf.loop.hint} running={isVisible && !reduced} />

          <section className={styles.bake} data-case-section="bake-off">
            <p>
              <b className={styles.runIn}>{cf.bakeOff.title}</b> <b className={styles.bakeHead}>{cf.bakeOff.headline}</b> {cf.bakeOff.text}
            </p>
            <div className={styles.tokens} aria-hidden="true">
              {Array.from({ length: cf.bakeOff.tokens }, (_, i) => (
                <span key={i} className={styles.cell}>
                  <span className={styles.token} style={{ background: TOKEN_COLORS[i % TOKEN_COLORS.length] }}>
                    {i + 1}
                  </span>
                </span>
              ))}
              <span className={`${styles.cell} ${styles.refCell}`}>
                <span className={`${styles.token} ${styles.ref}`}>REF</span>
                <small>{cf.bakeOff.referee}</small>
              </span>
            </div>
          </section>

          <ul className={styles.stats} data-case-section="stats">
            {cf.stats.map((stat, i) => (
              <li key={stat.value} className={styles[`stat${i}`]}>
                <b>{stat.value}</b>
                <span>{stat.label}</span>
              </li>
            ))}
          </ul>

          <section className={styles.found} data-case-section="findings">
            <h3 className={styles.chip}>{cf.findingsTitle}</h3>
            <ol>
              {cf.findings.map((finding, i) => (
                <li key={finding.title}>
                  <span className={styles.findNo}>{i + 1}</span>
                  <p>
                    <b>{finding.title}</b> {finding.text}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <aside className={styles.still} data-case-section="still-in-the-lab">
            <b>{cf.stillInTheLab.title}</b> {cf.stillInTheLab.text}
          </aside>

          <footer className={styles.foot}>{footer}</footer>
        </div>
      </div>
    </Page>
  );
});

CaseFileLoopPage.displayName = 'CaseFileLoopPage';

export default CaseFileLoopPage;
