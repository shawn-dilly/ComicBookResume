/**
 * PersonnelPage - the personnel file: the desktop inside-cover dossier (header, CODENAME, REAL NAME, OCCUPATION,
 * BASE, TOP SECRET stamp) as a folder with the ID photo, plus the summary and tagline from the resume data.
 * The contact fields (COMM LINK and the rest) live on the last page.
 */

import { resumeData } from '../../../data/resume';
import { Banner } from '../../components/Banner';
import { PageFace } from '../../components/PageFace';
import { ScrollPage } from '../../components/ScrollPage';
import styles from './PersonnelPage.module.css';

export default function PersonnelPage({ ref }: { ref?: React.Ref<HTMLElement> }) {
  const { personal, contact, summary } = resumeData;
  const fields: Array<[string, string]> = [
    ['REAL NAME:', personal.name],
    ['OCCUPATION:', personal.title],
    ['BASE:', contact.location || 'UNDISCLOSED'],
  ];
  return (
    <PageFace ref={ref} id="personnel-file" label="Personnel File">
      <ScrollPage label="Personnel File">
        <Banner>S.H.I.E.L.D. PERSONNEL FILE</Banner>
        <div className={styles.folder}>
          <div className={styles.top}>
            <figure className={styles.photo}>
              <img
                src={`${import.meta.env.BASE_URL}images/profile.jpg`}
                alt={personal.name}
                width={270}
                height={327}
                decoding="async"
              />
            </figure>
            <div className={styles.id}>
              <span className={styles.label}>CODENAME:</span>
              <span className={styles.value}>{personal.heroName || 'CLASSIFIED'}</span>
            </div>
          </div>
          <dl className={styles.fields}>
            {fields.map(([label, value]) => (
              <div key={label} className={styles.row}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <div className={styles.stamp}>TOP SECRET</div>
        </div>
        <div className={styles.notes}>
          <p>{summary.replace(/\s+/g, ' ').trim()}</p>
          {personal.tagline && <p className={styles.tagline}>{personal.tagline}</p>}
        </div>
      </ScrollPage>
    </PageFace>
  );
}
