import { forwardRef, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Page, CCAStamp, IssueNumber } from '../components';
import { resumeData } from '../data/resume';
import styles from './pages.module.css';

const CoverPage = forwardRef<HTMLDivElement>((_, ref) => {
  const titleRef = useRef<HTMLDivElement>(null);
  const heroNameRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);
  const hireBadgeRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.3 });

    // Title animation
    if (titleRef.current) {
      tl.fromTo(
        titleRef.current,
        { opacity: 0, y: -30, scale: 1.2 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.5)' }
      );
    }

    // Hero name with dramatic entrance
    if (heroNameRef.current) {
      tl.fromTo(
        heroNameRef.current,
        { opacity: 0, scale: 0.5, rotation: -15 },
        { opacity: 1, scale: 1, rotation: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' },
        '-=0.2'
      );
    }

    // Mask frame PUNCHES through with breakthrough effect
    if (maskRef.current) {
      tl.fromTo(
        maskRef.current,
        { opacity: 0, scale: 0.3, rotation: -10 },
        {
          opacity: 1,
          scale: 1,
          rotation: 0,
          duration: 0.6,
          ease: 'back.out(1.4)'
        },
        '-=0.3'
      );
    }

    // Hire badge pops in with bounce
    if (hireBadgeRef.current) {
      tl.fromTo(
        hireBadgeRef.current,
        { opacity: 0, scale: 0, rotation: -30 },
        { opacity: 1, scale: 1, rotation: 8, duration: 0.4, ease: 'back.out(2)' },
        '-=0.2'
      );
    }

    // Headline slides up
    if (headlineRef.current) {
      tl.fromTo(
        headlineRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' },
        '-=0.1'
      );
    }
  }, []);

  return (
    <Page ref={ref} density="hard" variant="cover" showPageNumber={false}>
      <div className={styles.coverPageSpider}>
        {/* Spider Web Background Pattern */}
        <div className={styles.spiderWebBg} />

        {/* Top Banner - Marvel Comics Group style */}
        <div className={styles.topBanner}>
          <span className={styles.bannerText}>RESUME COMICS GROUP</span>
          <span className={styles.tmMark}>TM</span>
        </div>

        {/* Issue Box - Top Left Corner */}
        <div className={styles.cornerBox}>
          <div className={styles.cornerBoxIcon}>
            <span className={styles.cornerInitial}>
              {resumeData.personal.name.charAt(0)}
            </span>
          </div>
          <IssueNumber number={1} month="JAN" price="12¢" />
        </div>

        {/* CCA Stamp - Top Right */}
        <div className={styles.ccaPosition}>
          <CCAStamp size="small" />
        </div>

        {/* Diagonal Black Banner with Full Title */}
        <div ref={titleRef} className={styles.titleTreatment}>
          <span className={styles.theSmall}>THE</span>
          <span className={styles.incredibleItalic}>INCREDIBLE</span>
          <div ref={heroNameRef} className={styles.heroNameSpider}>
            {resumeData.personal.heroName || resumeData.personal.name}
          </div>
        </div>

        {/* Spider Mask Frame - BREAKTHROUGH EFFECT */}
        <div ref={maskRef} className={styles.spiderMaskFrame}>
          {/* Glow layer behind everything */}
          <div className={styles.breakthroughGlow} />

          {/* Jagged starburst - paper tearing effect */}
          <div className={styles.breakthroughBurst} />

          {/* Mask Outline Frame - just the border shape */}
          <div className={styles.maskOutline}>
            {/* Photo fills inside the mask - visible THROUGH the cutout */}
            <div className={styles.photoPlaceholder}>
              <div className={styles.photoPlaceholderInner}>
                <span className={styles.placeholderIcon}>📷</span>
                <span className={styles.placeholderText}>YOUR PHOTO</span>
                <span className={styles.placeholderSubtext}>LinkedIn Profile</span>
              </div>
            </div>
          </div>
        </div>

        {/* Green Circular "HIRE ME" Badge */}
        <div ref={hireBadgeRef} className={styles.hireBadge}>
          <span className={styles.hireBadgeText}>HIRE</span>
          <span className={styles.hireBadgeText}>ME!</span>
        </div>

        {/* Bottom Newspaper Headline Strip */}
        <div ref={headlineRef} className={styles.headlineStrip}>
          <span className={styles.headlineText}>
            EXCLUSIVE: {resumeData.personal.title.toUpperCase()} SEEKS NEW ADVENTURES!
          </span>
        </div>

        {/* Bottom Footer */}
        <div className={styles.coverFooterSpider}>
          <span>{resumeData.personal.name}</span>
          <span className={styles.footerDot}>•</span>
          <span>{resumeData.contact?.location || 'Available Worldwide'}</span>
        </div>
      </div>
    </Page>
  );
});

CoverPage.displayName = 'CoverPage';

export default CoverPage;
