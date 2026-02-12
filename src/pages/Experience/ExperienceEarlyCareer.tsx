import { forwardRef } from 'react';
import { Page } from '../../components';
import type { Experience } from '../../types';
import shared from '../pages.module.css';
import styles from '../Experience.module.css';

interface ExperienceEarlyCareerProps {
  geneca: Experience;
  healthation: Experience;
  pageNumber: number;
}

const ExperienceEarlyCareer = forwardRef<HTMLDivElement, ExperienceEarlyCareerProps>(
  ({ geneca, healthation, pageNumber }, ref) => {
    return (
      <Page ref={ref} pageNumber={pageNumber} variant="inner">
        <div className={styles.earlyCareerPage}>
          <h2 className={shared.pageHeader}>Epic Battles</h2>

          {/* Geneca Section */}
          <div className={styles.earlyCareerSection}>
            <div className={styles.earlyCareerSectionHeader} style={{ borderLeftColor: 'var(--comic-purple)' }}>
              <div className={styles.earlyCareerCompanyRow}>
                <h3 className={styles.earlyCareerCompanyName} style={{ color: 'var(--comic-purple)' }}>
                  {geneca.company}
                </h3>
                <span className={styles.earlyCareerRole}>{geneca.role}</span>
              </div>
              <div className={styles.earlyCareerMeta}>
                <span>{geneca.period}</span>
                {geneca.location && <span> · {geneca.location}</span>}
              </div>
            </div>

            {geneca.villain && (
              <div className={styles.earlyCareerVillain} style={{ background: 'var(--comic-purple)' }}>
                VS. {geneca.villain}
              </div>
            )}

            <ul className={styles.earlyCareerList}>
              {geneca.achievements.map((a, i) => (
                <li key={i} className={styles.earlyCareerItem} style={{ borderLeftColor: i % 2 === 0 ? 'var(--comic-purple)' : 'var(--comic-orange)' }}>
                  {a}
                </li>
              ))}
            </ul>

            <div className={styles.earlyCareerTech}>
              {geneca.powers?.map((p) => (
                <span key={p} className={styles.earlyCareerBadge} style={{ background: 'var(--comic-purple)' }}>{p}</span>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className={styles.earlyCareerDivider} />

          {/* Healthation Section */}
          <div className={styles.earlyCareerSection}>
            <div className={styles.earlyCareerSectionHeader} style={{ borderLeftColor: 'var(--comic-orange)' }}>
              <div className={styles.earlyCareerCompanyRow}>
                <h3 className={styles.earlyCareerCompanyName} style={{ color: 'var(--comic-orange)' }}>
                  {healthation.company}
                </h3>
                <span className={styles.earlyCareerRole}>{healthation.role}</span>
              </div>
              <div className={styles.earlyCareerMeta}>
                <span>{healthation.period}</span>
                {healthation.location && <span> · {healthation.location}</span>}
              </div>
            </div>

            {healthation.villain && (
              <div className={styles.earlyCareerVillain} style={{ background: 'var(--comic-orange)' }}>
                VS. {healthation.villain}
              </div>
            )}

            <ul className={styles.earlyCareerList}>
              {healthation.achievements.map((a, i) => (
                <li key={i} className={styles.earlyCareerItem} style={{ borderLeftColor: i % 2 === 0 ? 'var(--comic-orange)' : 'var(--comic-yellow)' }}>
                  {a}
                </li>
              ))}
            </ul>

            <div className={styles.earlyCareerTech}>
              {healthation.powers?.map((p) => (
                <span key={p} className={styles.earlyCareerBadge} style={{ background: 'var(--comic-orange)' }}>{p}</span>
              ))}
            </div>
          </div>
        </div>
      </Page>
    );
  }
);

ExperienceEarlyCareer.displayName = 'ExperienceEarlyCareer';

export default ExperienceEarlyCareer;
