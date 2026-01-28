import { forwardRef } from 'react';
import { Page, Panel } from '../../components';
import { resumeData } from '../../data/resume';
import styles from '../pages.module.css';

interface EducationPageProps {
  pageNumber: number;
}

const EducationPage = forwardRef<HTMLDivElement, EducationPageProps>(
  ({ pageNumber }, ref) => {
    return (
      <Page ref={ref} pageNumber={pageNumber} variant="inner">
        <div className={styles.educationPage}>
          <h2 className={styles.pageHeader}>Training Grounds</h2>

          {resumeData.education.map((edu, index) => (
            <Panel
              key={edu.institution}
              variant="standard"
              animate
              animationDelay={index * 0.2}
              className={`${styles.flexPanel} ${styles.academyPanel}`}
            >
              <h3 className={styles.academyName}>{edu.institution}</h3>
              <p className={styles.academyDegree}>{edu.degree}</p>
              <span className={styles.academyYear}>{edu.year}</span>

              {edu.highlights && edu.highlights.length > 0 && (
                <ul className={styles.academyHighlights}>
                  {edu.highlights.map((highlight, hIndex) => (
                    <li key={hIndex}>{highlight}</li>
                  ))}
                </ul>
              )}
            </Panel>
          ))}

          <div style={{
            marginTop: 'auto',
            textAlign: 'center',
            fontFamily: 'var(--font-caption)',
            fontSize: '10px',
            fontStyle: 'italic',
            color: 'var(--text-caption)',
            padding: '12px'
          }}>
            "True leaders build more leaders" - Ancient Architect Proverb
          </div>
        </div>
      </Page>
    );
  }
);

EducationPage.displayName = 'EducationPage';

export default EducationPage;
