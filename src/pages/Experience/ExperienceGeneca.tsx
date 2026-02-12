import { forwardRef } from 'react';
import { Page, Panel, ActionWord } from '../../components';
import type { Experience } from '../../types';
import shared from '../pages.module.css';
import styles from '../Experience.module.css';

interface ExperienceGenecaProps {
  experience: Experience;
  pageNumber: number;
}

const ExperienceGeneca = forwardRef<HTMLDivElement, ExperienceGenecaProps>(
  ({ experience, pageNumber }, ref) => {
    return (
      <Page ref={ref} pageNumber={pageNumber} variant="inner">
        <div className={styles.caseFilePage}>
          <h2 className={shared.pageHeader}>Epic Battles</h2>

          <div className={styles.caseFileHeader}>
            <h3 className={styles.battleTitle}>GENECA</h3>
            <p className={styles.caseFileSubtitle}>CONSULTING CHRONICLES</p>
            <span className={styles.battlePeriod}>
              {experience.period} • {experience.location}
            </span>
          </div>

          {experience.villain && (
            <div
              className={shared.villainBadge}
              style={{
                backgroundColor: 'var(--comic-purple)',
                borderColor: 'var(--comic-purple)'
              }}
            >
              VS. {experience.villain}
            </div>
          )}

          <Panel
            variant="standard"
            animate
            animationDelay={0.1}
            className={shared.flexPanel}
            style={{ flex: 1, marginTop: 'var(--spacing-md)' }}
          >
            <div className={styles.caseFileGrid}>
              {experience.achievements.map((achievement, index) => (
                <div
                  key={index}
                  className={styles.caseFileCard}
                  style={{
                    borderLeftColor: index % 2 === 0
                      ? 'var(--comic-purple)'
                      : 'var(--comic-orange)'
                  }}
                >
                  <div className={styles.caseFileNumber}>
                    CASE #{String(index + 1).padStart(3, '0')}
                  </div>
                  <p className={styles.caseFileReport}>
                    {achievement}
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          {experience.powers && experience.powers.length > 0 && (
            <div className={styles.caseFileTools}>
              <span style={{
                fontFamily: 'var(--font-action)',
                fontSize: '0.75rem',
                letterSpacing: '0.1em',
                color: 'var(--comic-purple)',
                marginBottom: 'var(--spacing-xs)',
                display: 'block'
              }}>
                TOOLS OF THE TRADE
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
                {experience.powers.map((power) => (
                  <span key={power} className={shared.techBadge}>
                    {power}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{
            position: 'absolute',
            top: '120px',
            right: '20px',
          }}>
            <ActionWord word="ZAP" size="small" rotation={-15} showBurst={false} />
          </div>
        </div>
      </Page>
    );
  }
);

ExperienceGeneca.displayName = 'ExperienceGeneca';

export default ExperienceGeneca;
