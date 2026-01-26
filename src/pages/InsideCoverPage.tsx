import { forwardRef } from 'react';
import { Page } from '../components';
import { resumeData } from '../data/resume';
import styles from './pages.module.css';

const InsideCoverPage = forwardRef<HTMLDivElement>((_, ref) => {
  const { personal, contact } = resumeData;

  return (
    <Page ref={ref} pageNumber={2} variant="inner">
      <div className={styles.insideCoverPage}>
        <div className={styles.dossierHeader}>
          S.H.I.E.L.D. PERSONNEL FILE
        </div>

        <div className={styles.dossierContent}>
          <div className={styles.dossierField}>
            <span className={styles.dossierLabel}>CODENAME:</span>
            <span className={styles.dossierValue}>{personal.heroName || 'CLASSIFIED'}</span>
          </div>

          <div className={styles.dossierField}>
            <span className={styles.dossierLabel}>REAL NAME:</span>
            <span className={styles.dossierValue}>{personal.name}</span>
          </div>

          <div className={styles.dossierField}>
            <span className={styles.dossierLabel}>OCCUPATION:</span>
            <span className={styles.dossierValue}>{personal.title}</span>
          </div>

          <div className={styles.dossierField}>
            <span className={styles.dossierLabel}>BASE:</span>
            <span className={styles.dossierValue}>{contact.location || 'UNDISCLOSED'}</span>
          </div>

          <div className={styles.dossierField}>
            <span className={styles.dossierLabel}>COMM LINK:</span>
            <span className={styles.dossierValue}>{contact.email}</span>
          </div>

          {contact.phone && (
            <div className={styles.dossierField}>
              <span className={styles.dossierLabel}>SECURE LINE:</span>
              <span className={styles.dossierValue}>{contact.phone}</span>
            </div>
          )}

          {contact.linkedin && (
            <div className={styles.dossierField}>
              <span className={styles.dossierLabel}>NETWORK:</span>
              <span className={styles.dossierValue}>{contact.linkedin}</span>
            </div>
          )}

          {contact.github && (
            <div className={styles.dossierField}>
              <span className={styles.dossierLabel}>CODE VAULT:</span>
              <span className={styles.dossierValue}>{contact.github}</span>
            </div>
          )}

          {contact.website && (
            <div className={styles.dossierField}>
              <span className={styles.dossierLabel}>HQ:</span>
              <span className={styles.dossierValue}>{contact.website}</span>
            </div>
          )}
        </div>

        <div className={styles.classifiedStamp}>
          TOP SECRET
        </div>
      </div>
    </Page>
  );
});

InsideCoverPage.displayName = 'InsideCoverPage';

export default InsideCoverPage;
