import { forwardRef } from 'react';
import { Page, Panel, ActionWord } from '../../components';
import type { Experience } from '../../types';
import shared from '../pages.module.css';
import styles from '../Experience.module.css';

interface ExperiencePageProps {
  experience: Experience;
  pageNumber: number;
  isFirst?: boolean;
}

const ExperiencePage = forwardRef<HTMLDivElement, ExperiencePageProps>(
  ({ experience, pageNumber, isFirst = false }, ref) => {
    return (
      <Page ref={ref} pageNumber={pageNumber} variant="inner">
        <div className={styles.experiencePage}>
          {isFirst && <h2 className={shared.pageHeader}>Epic Battles</h2>}

          <Panel
            variant="splash"
            animate
            animationDelay={0.1}
            className={shared.flexPanel}
            style={{ flex: 1 }}
          >
            <div className={styles.battlePanel}>
              <div className={styles.battleHeader}>
                <div>
                  <h3 className={styles.battleTitle}>{experience.company}</h3>
                  <p className={styles.battleRole}>{experience.role}</p>
                </div>
                <span className={styles.battlePeriod}>{experience.period}</span>
              </div>

              {experience.villain && (
                <div className={shared.villainBadge}>
                  VS. {experience.villain}
                </div>
              )}

              <ul className={styles.achievementsList}>
                {experience.achievements.map((achievement, index) => (
                  <li key={index} className={styles.achievementItem}>
                    {achievement}
                  </li>
                ))}
              </ul>

              {experience.powers && experience.powers.length > 0 && (
                <div className={styles.techPowers}>
                  {experience.powers.map((power) => (
                    <span key={power} className={shared.techBadge}>
                      {power}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Panel>

          {isFirst && (
            <div style={{
              position: 'absolute',
              bottom: '60px',
              right: '20px',
            }}>
              <ActionWord word="BAM" size="small" rotation={10} showBurst={false} />
            </div>
          )}
        </div>
      </Page>
    );
  }
);

ExperiencePage.displayName = 'ExperiencePage';

export default ExperiencePage;
