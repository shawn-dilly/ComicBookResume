import { forwardRef } from 'react';
import { Page, Panel } from '../../components';
import { resumeData } from '../../data/resume';
import shared from '../pages.module.css';
import styles from '../SpecialProjects.module.css';

interface SpecialProjectsPageProps {
  pageNumber: number;
}

const SpecialProjectsPage = forwardRef<HTMLDivElement, SpecialProjectsPageProps>(
  ({ pageNumber }, ref) => {
    const projects = resumeData.specialProjects || [];

    return (
      <Page ref={ref} pageNumber={pageNumber} variant="inner">
        <div className={styles.specialProjectsPage}>
          <h2 className={shared.pageHeader}>Secret Lab Projects</h2>

          <div className={styles.projectsGrid}>
            {projects.map((project, index) => (
              <Panel
                key={project.codename}
                variant="standard"
                animate
                animationDelay={index * 0.15}
                className={shared.flexPanel}
              >
                <div className={styles.projectCard}>
                  <div className={styles.projectCodename}>{project.codename}</div>
                  <h3 className={styles.projectTitle}>{project.title}</h3>
                  <p className={styles.projectDescription}>{project.description}</p>
                  <div className={styles.projectImpact}>
                    <span className={styles.impactLabel}>IMPACT:</span> {project.impact}
                  </div>
                  <div className={styles.projectTech}>
                    {project.tech.map((t) => (
                      <span key={t} className={shared.techBadge}>{t}</span>
                    ))}
                  </div>
                </div>
              </Panel>
            ))}
          </div>

          <div className={styles.classifiedFooter}>
            CLASSIFIED // FOR AUTHORIZED EYES ONLY
          </div>
        </div>
      </Page>
    );
  }
);

SpecialProjectsPage.displayName = 'SpecialProjectsPage';

export default SpecialProjectsPage;
