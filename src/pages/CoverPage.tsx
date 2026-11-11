import { forwardRef, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Page, CCAStamp, IssueNumber, CoverWeb, CoverBurst } from '../components';
import { resumeData } from '../data/resume';
import styles from './CoverPage.module.css';

const CoverPage = forwardRef<HTMLDivElement>((_, ref) => {
  const heroName = resumeData.personal.heroName || resumeData.personal.name;
  const titleRef = useRef<HTMLDivElement>(null);
  const heroNameRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);
  const hireBadgeRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reduced motion: leave the static final composition untouched.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Everything is visible by default in CSS; GSAP only animates FROM hidden,
    // and the context reverts inline styles if the effect is torn down.
    const ctx = gsap.context(() => {
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

      // The logo's solid block slams out behind the lettering
      if (heroNameRef.current) {
        tl.fromTo(
          heroNameRef.current.querySelectorAll('[data-extrude]'),
          { x: -7, y: -7 },
          { x: 0, y: 0, duration: 0.3, ease: 'back.out(3)' },
          '-=0.45'
        );
      }

      // The portrait BURSTS through the cover
      if (maskRef.current) {
        const root = maskRef.current;
        const q = (sel: string) => gsap.utils.toArray<SVGElement>(root.querySelectorAll(sel));
        tl.addLabel('boom', '-=0.3');

        // Portrait punches forward
        tl.fromTo(
          root,
          { opacity: 0, scale: 0.4, rotation: -6 },
          { opacity: 1, scale: 1, rotation: 0, duration: 0.55, ease: 'back.out(1.7)' },
          'boom'
        );
        // Torn opening rips wide
        tl.fromTo(
          q('[data-burst="hole"]'),
          { scale: 0.15, opacity: 0, svgOrigin: '0 0' },
          { scale: 1, opacity: 1, svgOrigin: '0 0', duration: 0.38, ease: 'back.out(2.2)' },
          'boom+=0.04'
        );
        // Energy burst flares with an overshoot
        tl.fromTo(
          q('[data-burst="energy"]'),
          { scale: 0.1, opacity: 0, svgOrigin: '0 0' },
          { scale: 1, opacity: 1, svgOrigin: '0 0', duration: 0.42, ease: 'back.out(2)' },
          'boom+=0.02'
        );
        // Cracks race out into the red
        tl.fromTo(
          q('[data-burst="cracks"]'),
          { scale: 0.35, opacity: 0, svgOrigin: '0 0' },
          { scale: 1, opacity: 1, svgOrigin: '0 0', duration: 0.28, ease: 'power4.out' },
          'boom+=0.08'
        );
        // Paper flaps snap outward from their creases
        q('[data-burst="flap"]').forEach((el, i) => {
          const ox = el.getAttribute('data-ox') ?? '0';
          const oy = el.getAttribute('data-oy') ?? '0';
          tl.fromTo(
            el,
            { scale: 0.05, rotation: i % 2 ? 14 : -14, opacity: 0, svgOrigin: `${ox} ${oy}` },
            { scale: 1, rotation: 0, opacity: 1, svgOrigin: `${ox} ${oy}`, duration: 0.34, ease: 'back.out(2)' },
            `boom+=${(0.1 + i * 0.012).toFixed(3)}`
          );
        });
        // Debris flies out a short way and settles
        q('[data-burst="piece"]').forEach((el, i) => {
          const x = Number(el.getAttribute('data-x'));
          const y = Number(el.getAttribute('data-y'));
          const r = Number(el.getAttribute('data-r'));
          tl.fromTo(
            el,
            { x: -x * 0.7, y: -y * 0.7, rotation: r, scale: 0.4, opacity: 0, svgOrigin: `${x} ${y}` },
            { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1, svgOrigin: `${x} ${y}`, duration: 0.42, ease: 'power3.out' },
            `boom+=${(0.1 + (i % 8) * 0.012).toFixed(3)}`
          );
        });
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
    });

    return () => ctx.revert();
  }, []);

  return (
    <Page ref={ref} density="hard" variant="cover" showPageNumber={false}>
      <div className={styles.coverPageSpider}>
        {/* Spider Web Background Pattern */}
        <CoverWeb />

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

        {/* Diagonal title banner: ribbon, caption box, script line and a solid-block logotype */}
        <div ref={titleRef} className={styles.titleTreatment}>
          <div className={styles.titleBand} aria-hidden="true" />
          <div className={styles.titleContent}>
            <div className={styles.titleRow}>
              <span className={`${styles.logoWord} ${styles.theSmall}`}>
                <span className={styles.logoExtrude} aria-hidden="true">THE</span>
                <span className={styles.logoFill}>THE</span>
              </span>
              <span className={`${styles.logoWord} ${styles.incredibleItalic}`}>
                <span className={styles.logoExtrude} aria-hidden="true">INCREDIBLE</span>
                <span className={styles.logoFill}>INCREDIBLE</span>
              </span>
            </div>
            <div ref={heroNameRef} className={styles.heroNameSpider}>
              <span className={styles.heroTilt}>
                <span className={styles.heroExtrude} data-extrude="" aria-hidden="true">{heroName}</span>
                <span className={styles.heroFill}>{heroName}</span>
              </span>
            </div>
          </div>
          <span className={`${styles.spark} ${styles.sparkA}`} aria-hidden="true" />
          <span className={`${styles.spark} ${styles.sparkB}`} aria-hidden="true" />
        </div>

        {/* Spider Mask Frame - BREAKTHROUGH EFFECT */}
        <div ref={maskRef} className={styles.spiderMaskFrame}>
          {/* Torn cover, flaps, cracks, energy burst and debris behind the portrait */}
          <CoverBurst />

          {/* Mask Outline Frame - just the border shape */}
          <div className={styles.maskOutline}>
            {/* Photo fills inside the mask - visible THROUGH the cutout */}
            <div className={styles.photoPlaceholder}>
              <img
                src={`${import.meta.env.BASE_URL}images/profile.jpg`}
                alt={resumeData.personal.name}
                className={styles.profilePhoto}
              />
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
