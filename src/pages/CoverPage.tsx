import { forwardRef, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Page, CCAStamp, IssueNumber } from '../components';
import { resumeData } from '../data/resume';
import styles from './pages.module.css';

const CoverPage = forwardRef<HTMLDivElement>((_, ref) => {
  const titleRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const heroNameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.3 });

    if (titleRef.current) {
      tl.fromTo(
        titleRef.current,
        { opacity: 0, y: -30, scale: 1.2 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.5)' }
      );
    }

    if (heroNameRef.current) {
      tl.fromTo(
        heroNameRef.current,
        { opacity: 0, scale: 0.8, rotation: -10 },
        { opacity: 1, scale: 1, rotation: -3, duration: 0.4, ease: 'elastic.out(1, 0.5)' },
        '-=0.2'
      );
    }

    if (subtitleRef.current) {
      tl.fromTo(
        subtitleRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.3 },
        '-=0.1'
      );
    }
  }, []);

  return (
    <Page ref={ref} density="hard" variant="cover" showPageNumber={false}>
      <div className={styles.coverPage}>
        {/* Top Banner */}
        <div className={styles.coverBanner}>
          <span className={styles.publisherLogo}>RESUME COMICS</span>
        </div>

        {/* Issue Box */}
        <div className={styles.issueBoxWrapper}>
          <IssueNumber number={1} month="JAN" price="12¢" />
        </div>

        {/* CCA Stamp */}
        <div className={styles.ccaWrapper}>
          <CCAStamp size="medium" />
        </div>

        {/* Main Title */}
        <div ref={titleRef} className={styles.coverTitle}>
          <span className={styles.theText}>THE</span>
          <span className={styles.incredibleText}>INCREDIBLE</span>
        </div>

        {/* Hero Name */}
        <div ref={heroNameRef} className={styles.heroName}>
          {resumeData.personal.heroName || resumeData.personal.name}
        </div>

        {/* Hero Portrait Area */}
        <div className={styles.heroPortraitArea}>
          <div className={styles.heroSilhouette}>
            <span className={styles.heroInitial}>
              {resumeData.personal.name.charAt(0)}
            </span>
          </div>
          {/* Action burst background */}
          <div className={styles.actionBurst} />
        </div>

        {/* Subtitle/Tagline */}
        <div ref={subtitleRef} className={styles.coverTagline}>
          <span className={styles.taglineText}>
            {resumeData.personal.tagline || `The Amazing Adventures of ${resumeData.personal.title}`}
          </span>
        </div>

        {/* Issue Callout */}
        <div className={styles.issueCallout}>
          <span>FIRST ISSUE!</span>
          <span className={styles.calloutSub}>COLLECTOR'S EDITION</span>
        </div>

        {/* Bottom Info */}
        <div className={styles.coverFooter}>
          <span>{resumeData.personal.name}</span>
          <span>•</span>
          <span>{resumeData.personal.title}</span>
        </div>
      </div>
    </Page>
  );
});

CoverPage.displayName = 'CoverPage';

export default CoverPage;
