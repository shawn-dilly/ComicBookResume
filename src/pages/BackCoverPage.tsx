import { forwardRef, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Page } from '../components';
import { resumeData } from '../data/resume';
import styles from './BackCover.module.css';

const BackCoverPage = forwardRef<HTMLDivElement>((_, ref) => {
  const ctaRef = useRef<HTMLDivElement>(null);
  const { contact } = resumeData;

  useEffect(() => {
    if (ctaRef.current) {
      gsap.to(ctaRef.current, {
        scale: 1.02,
        duration: 0.8,
        yoyo: true,
        repeat: -1,
        ease: 'power1.inOut',
      });
    }
  }, []);

  return (
    <Page ref={ref} density="hard" variant="back" showPageNumber={false}>
      <div className={styles.backCoverPage}>
        <div className={styles.toBeContinued}>
          TO BE CONTINUED...
        </div>

        <div ref={ctaRef} className={styles.ctaBox}>
          <span className={styles.ctaText}>HIRE ME!</span>
        </div>

        <div className={styles.contactLinks}>
          <a href={`mailto:${contact.email}`} className={styles.contactLink}>
            📧 {contact.email}
          </a>

          {contact.phone && (
            <a href={`tel:${contact.phone.replace(/[^+\d]/g, '')}`} className={styles.contactLink}>
              📞 {contact.phone}
            </a>
          )}

          {contact.linkedin && (
            <a
              href={contact.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.contactLink}
            >
              💼 LinkedIn Profile
            </a>
          )}

          {contact.github && (
            <a
              href={contact.github}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.contactLink}
            >
              💻 GitHub Profile
            </a>
          )}
        </div>

        <div className={styles.backCoverFooter}>
          © {new Date().getFullYear()} {resumeData.personal.name} • Built with ❤️ and React
        </div>
      </div>
    </Page>
  );
});

BackCoverPage.displayName = 'BackCoverPage';

export default BackCoverPage;
