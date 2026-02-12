import { forwardRef } from 'react';
import { Page, ActionWord, SpeechBubble } from '../../components';
import Caption from '../../components/common/Caption';
import type { Experience } from '../../types';
import shared from '../pages.module.css';
import styles from '../Experience.module.css';

interface ExperienceHealthationProps {
  experience: Experience;
  pageNumber: number;
}

const ExperienceHealthation = forwardRef<HTMLDivElement, ExperienceHealthationProps>(
  ({ experience, pageNumber }, ref) => {
    return (
      <Page ref={ref} pageNumber={pageNumber} variant="inner">
        <div className={shared.originPage}>
          <h2 className={shared.pageHeader}>Epic Battles</h2>

          <div className={styles.originNarrator}>
            <Caption variant="narrator">WHERE IT ALL BEGAN...</Caption>
          </div>

          <div className={styles.originCompanyHeader}>
            <div className={styles.originChapterLabel}>CHAPTER I</div>
            <h3 className={styles.originCompanyName}>{experience.company}</h3>
            {experience.location && (
              <p className={styles.originLocation}>{experience.location}</p>
            )}
            <div className={styles.originRoleInfo}>
              <span className={styles.originRole}>{experience.role}</span>
              <span className={styles.originPeriod}>{experience.period}</span>
            </div>
          </div>

          {experience.villain && (
            <div className={shared.villainBadge} style={{ backgroundColor: 'var(--comic-orange)' }}>
              VS. {experience.villain}
            </div>
          )}

          <div className={styles.originStoryBeats}>
            {experience.achievements.slice(0, -1).map((achievement, index) => (
              <div
                key={index}
                className={`${styles.originBeat} ${
                  index % 2 === 0 ? styles.originBeatOdd : styles.originBeatEven
                }`}
              >
                {achievement}
              </div>
            ))}

            {experience.achievements.length > 0 && (
              <div style={{ marginTop: 'var(--spacing-md)' }}>
                <SpeechBubble variant="speech" tailDirection="bottom-right">
                  {experience.achievements[experience.achievements.length - 1]}
                </SpeechBubble>
              </div>
            )}
          </div>

          <div className={styles.originClosing}>
            AND SO THE JOURNEY BEGAN...
          </div>

          {experience.powers && experience.powers.length > 0 && (
            <div className={styles.techPowers}>
              {experience.powers.map((power) => (
                <span key={power} className={shared.techBadge}>
                  {power}
                </span>
              ))}
            </div>
          )}

          <div
            style={{
              position: 'absolute',
              top: '120px',
              right: '30px',
            }}
          >
            <ActionWord word="POW" size="small" rotation={-15} showBurst={false} />
          </div>
        </div>
      </Page>
    );
  }
);

ExperienceHealthation.displayName = 'ExperienceHealthation';

export default ExperienceHealthation;
