import { forwardRef } from 'react';
import { Page } from '../../components';
import type { Experience } from '../../types';
import shared from '../pages.module.css';
import styles from '../Experience.module.css';

interface ExperienceGrodivoProps {
  experience: Experience;
  pageNumber: number;
}

/**
 * ExperienceGrodivo - "Lab Blueprint" layout
 *
 * The newest, AI-heavy role gets a schematic treatment: a cyan blueprint
 * panel with a headline stat strip, a numbered build log, and component
 * badges. Distinct from the Mission Briefing (PeopleReady), Rank Up
 * (Ezlinks), and Early Career layouts.
 */
const ExperienceGrodivo = forwardRef<HTMLDivElement, ExperienceGrodivoProps>(
  ({ experience, pageNumber }, ref) => {
    return (
      <Page ref={ref} pageNumber={pageNumber} variant="inner">
        <div className={styles.labPage}>
          <h2 className={shared.pageHeader}>Epic Battles</h2>

          {/* Company row */}
          <div className={styles.labCompanyRow}>
            <h3 className={styles.labCompanyName}>{experience.company}</h3>
            {experience.location && (
              <span className={styles.labLocation}>{experience.location}</span>
            )}
            <span className={styles.labPeriod}>{experience.period}</span>
          </div>

          {/* Role + villain */}
          <div className={styles.labRoleRow}>
            <span className={styles.labRole}>{experience.role}</span>
            {experience.villain && (
              <span className={styles.labVillainBadge}>VS. {experience.villain}</span>
            )}
          </div>

          {/* Blueprint panel */}
          <div className={styles.labBlueprint}>
            <div className={styles.labBlueprintTitle}>
              <span>BLUEPRINT // BUILD LOG</span>
              <span className={styles.labBlueprintRev}>REV. 2026</span>
            </div>

            {experience.stats && experience.stats.length > 0 && (
              <div className={styles.labStats}>
                {experience.stats.map((stat) => (
                  <div key={stat.label} className={styles.labStat}>
                    <span className={styles.labStatValue}>{stat.value}</span>
                    <span className={styles.labStatLabel}>{stat.label}</span>
                  </div>
                ))}
              </div>
            )}

            <ol className={styles.labLog}>
              {experience.achievements.map((achievement, index) => (
                <li key={index} className={styles.labLogItem}>
                  <span className={styles.labLogIndex}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className={styles.labLogText}>{achievement}</span>
                </li>
              ))}
            </ol>

            {experience.powers && experience.powers.length > 0 && (
              <div className={styles.labComponents}>
                <span className={styles.labComponentsLabel}>COMPONENTS:</span>
                {experience.powers.map((power) => (
                  <span key={power} className={styles.labComponentBadge}>
                    {power}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Page>
    );
  }
);

ExperienceGrodivo.displayName = 'ExperienceGrodivo';

export default ExperienceGrodivo;
