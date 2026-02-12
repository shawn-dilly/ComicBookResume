import { forwardRef } from 'react';
import { Page, Panel } from '../../components';
import type { Experience } from '../../types';
import shared from '../pages.module.css';
import styles from '../Experience.module.css';

interface ExperiencePeopleReadyProps {
  experience: Experience;
  pageNumber: number;
}

const ExperiencePeopleReady = forwardRef<HTMLDivElement, ExperiencePeopleReadyProps>(
  ({ experience, pageNumber }, ref) => {
    return (
      <Page ref={ref} pageNumber={pageNumber} variant="inner">
        <div className={styles.missionControlPage}>
          <h2 className={shared.pageHeader}>Epic Battles</h2>

          {/* Main mission briefing panel */}
          <Panel
            variant="splash"
            animate
            animationDelay={0.1}
            className={`${shared.flexPanel} ${styles.missionControlPanel}`}
          >
            <div className={styles.missionBriefingContainer}>
              {/* Classified header */}
              <div className={styles.missionBriefingHeader}>
                <span className={styles.topSecretStamp}>TOP SECRET</span>
                <h3 className={styles.missionBriefingTitle}>MISSION BRIEFING</h3>
                <span className={styles.topSecretStamp}>TOP SECRET</span>
              </div>

              {/* Company and location */}
              <div className={styles.missionCompanyHeader}>
                <h4 className={styles.missionCompanyName}>{experience.company}</h4>
                {experience.location && (
                  <span className={styles.missionLocationBadge}>{experience.location}</span>
                )}
              </div>

              {/* Designation (role and period) */}
              <div className={styles.missionDesignation}>
                <span className={styles.missionDesignationLabel}>DESIGNATION:</span>
                <span className={styles.missionDesignationRole}>{experience.role}</span>
                <span className={styles.missionDesignationPeriod}>{experience.period}</span>
              </div>

              {/* Threat assessment (villain) */}
              {experience.villain && (
                <div className={styles.missionThreat}>
                  <span className={styles.missionThreatLabel}>THREAT ASSESSMENT:</span>
                  <span className={styles.missionThreatTarget}>{experience.villain}</span>
                  <span className={styles.missionThreatLevel}>HIGH PRIORITY</span>
                </div>
              )}

              {/* Mission objectives (achievements) */}
              <div className={styles.missionObjectives}>
                <h5 className={styles.missionObjectivesTitle}>MISSION OBJECTIVES</h5>
                <ul className={styles.missionObjectivesList}>
                  {experience.achievements.map((achievement, index) => (
                    <li key={index} className={styles.missionObjectiveItem}>
                      <span className={styles.missionObjectiveNumber}>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className={styles.missionObjectiveText}>{achievement}</span>
                      <span className={styles.missionObjectiveStatus}>✓ COMPLETED</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tactical assets (tech powers) - at bottom */}
              {experience.powers && experience.powers.length > 0 && (
                <div className={styles.missionTactics}>
                  <h5 className={styles.missionTacticsTitle}>TACTICAL ASSETS</h5>
                  <div className={styles.missionTacticsBadges}>
                    {experience.powers.map((power) => (
                      <span key={power} className={styles.missionTacticBadge}>
                        {power}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Panel>
        </div>
      </Page>
    );
  }
);

ExperiencePeopleReady.displayName = 'ExperiencePeopleReady';

export default ExperiencePeopleReady;
