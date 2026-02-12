import { forwardRef } from 'react';
import { Page } from '../../components';
import type { Experience } from '../../types';
import shared from '../pages.module.css';
import styles from '../Experience.module.css';

interface ExperienceEzlinksProps {
  experience: Experience;
  pageNumber: number;
}

const ExperienceEzlinks = forwardRef<HTMLDivElement, ExperienceEzlinksProps>(
  ({ experience, pageNumber }, ref) => {
    const roles = experience.roles ?? [];
    const totalRoles = roles.length;
    const rankLabels = ['★★★', '★★', '★'];

    return (
      <Page ref={ref} pageNumber={pageNumber} variant="inner">
        <div className={styles.rankPage}>
          <h2 className={shared.pageHeader}>Epic Battles</h2>

          {/* Company Header - compact row */}
          <div className={styles.rankCompanyRow}>
            <h3 className={styles.rankCompanyName}>{experience.company}</h3>
            {experience.location && (
              <span className={styles.rankLocation}>{experience.location}</span>
            )}
            <span className={styles.rankPeriod}>{experience.period}</span>
          </div>

          {/* Villain Badge */}
          {experience.villain && (
            <div className={styles.rankVillainBadge}>
              VS. {experience.villain}
            </div>
          )}

          {/* Role Progression - most recent first */}
          <div className={styles.rankProgression}>
            {roles.map((role, index) => {
              const rank = totalRoles - index;
              return (
                <div key={index} className={styles.rankCard}>
                  {/* Rank Up connector between cards */}
                  {index > 0 && (
                    <div className={styles.rankUpBadge}>RANK UP!</div>
                  )}
                  <div
                    className={styles.rankCardInner}
                    style={{
                      borderLeftWidth: `${rank * 2 + 1}px`,
                    }}
                  >
                    <div className={styles.rankCardHeader}>
                      <span className={styles.rankStars}>
                        {rankLabels[index] ?? rank.toString()}
                      </span>
                      <span className={styles.rankRoleTitle}>{role.title}</span>
                      <span className={styles.rankRolePeriod}>{role.period}</span>
                    </div>
                    <ul className={styles.rankHighlights}>
                      {role.highlights.map((h, hIdx) => (
                        <li key={hIdx} className={styles.rankHighlightItem}>
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tech Powers */}
          {experience.powers && experience.powers.length > 0 && (
            <div className={styles.rankTechRow}>
              {experience.powers.map((power) => (
                <span key={power} className={styles.rankTechBadge}>
                  {power}
                </span>
              ))}
            </div>
          )}

        </div>
      </Page>
    );
  }
);

ExperienceEzlinks.displayName = 'ExperienceEzlinks';

export default ExperienceEzlinks;
