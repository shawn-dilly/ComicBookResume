/**
 * MobileCover - the phone cover, recomposed for portrait in the desktop cover's design language.
 *
 * The drawn web runs up to the torn-cover burst around the portrait; the navy ribbon logo banner carries the
 * extruded IRON ARCHITECT logotype and THE INCREDIBLE in cream italic. The pieces are the desktop's (CoverWeb,
 * CoverBurst, CCAStamp, IssueNumber and the CoverPage styles); only the portrait frame is placed differently:
 * it sits on the web's hub, which stays at the same fraction of a taller screen, and its size follows the
 * screen's height so a short phone does not collide with the banner.
 */

import { useLayoutEffect, useRef } from 'react';
import { CCAStamp } from '../../../components/CCAStamp';
import { CoverBurst } from '../../../components/CoverBurst';
import { CoverWeb } from '../../../components/CoverWeb';
import IssueNumber from '../../../components/common/IssueNumber';
import { resumeData } from '../../../data/resume';
import { PageFace } from '../../components/PageFace';
import useReducedMotion from '../../hooks/useReducedMotion';
import deskStyles from '../../../pages/CoverPage.module.css';
import styles from './MobileCover.module.css';

interface MobileCoverProps {
  ref?: React.Ref<HTMLElement>;
  onOpen: () => void;
}

/** Shrink the logo banner's type until the hero name fits inside the ribbon (the fallback font is wider). */
function useFitLogo(titleRef: React.RefObject<HTMLDivElement | null>, heroRef: React.RefObject<HTMLDivElement | null>) {
  useLayoutEffect(() => {
    const title = titleRef.current;
    const hero = heroRef.current;
    if (!title || !hero) return;
    const fit = () => {
      title.style.removeProperty('--logo');
      const base = parseFloat(getComputedStyle(title).fontSize);
      const band = title.clientWidth;
      if (!band) return;
      // Ribbon padding is 0.8em left and 0.45em right; leave a little air for the swallow-tail ends.
      const need = hero.offsetWidth + base * (0.8 + 0.45) + base * 0.5;
      if (need > band) title.style.setProperty('--logo', `${(base * band) / need}px`);
    };
    fit();
    let cancelled = false;
    void document.fonts?.ready.then(() => {
      if (!cancelled) fit();
    });
    const ro = new ResizeObserver(fit);
    ro.observe(title);
    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, [titleRef, heroRef]);
}

export default function MobileCover({ ref, onOpen }: MobileCoverProps) {
  const { personal, contact } = resumeData;
  const heroName = personal.heroName || personal.name;
  const reduced = useReducedMotion();
  const titleRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  useFitLogo(titleRef, heroRef);

  return (
    <PageFace ref={ref} id="cover" label="Cover">
      <div className={styles.cover}>
        <div className={deskStyles.coverPageSpider}>
          <CoverWeb />

          <div className={`${deskStyles.topBanner} ${styles.topBanner}`}>
            <span className={deskStyles.bannerText}>RESUME COMICS GROUP</span>
            <span className={deskStyles.tmMark}>TM</span>
          </div>

          <div className={deskStyles.cornerBox}>
            <div className={deskStyles.cornerBoxIcon}>
              <span className={deskStyles.cornerInitial}>{personal.name.charAt(0)}</span>
            </div>
            <IssueNumber number={1} month="JAN" price="12¢" />
          </div>

          <div className={deskStyles.ccaPosition}>
            <CCAStamp size="small" />
          </div>

          <div ref={titleRef} className={deskStyles.titleTreatment}>
            <div className={deskStyles.titleBand} aria-hidden="true" />
            <div className={deskStyles.titleContent}>
              <div className={deskStyles.titleRow}>
                <span className={`${deskStyles.logoWord} ${deskStyles.theSmall}`}>
                  <span className={deskStyles.logoExtrude} aria-hidden="true">THE</span>
                  <span className={deskStyles.logoFill}>THE</span>
                </span>
                <span className={`${deskStyles.logoWord} ${deskStyles.incredibleItalic}`}>
                  <span className={deskStyles.logoExtrude} aria-hidden="true">INCREDIBLE</span>
                  <span className={deskStyles.logoFill}>INCREDIBLE</span>
                </span>
              </div>
              <div ref={heroRef} className={deskStyles.heroNameSpider}>
                <span className={deskStyles.heroTilt}>
                  <span className={deskStyles.heroExtrude} aria-hidden="true">{heroName}</span>
                  <span className={deskStyles.heroFill}>{heroName}</span>
                </span>
              </div>
            </div>
            <span className={`${deskStyles.spark} ${deskStyles.sparkA}`} aria-hidden="true" />
            <span className={`${deskStyles.spark} ${deskStyles.sparkB}`} aria-hidden="true" />
          </div>

          <div className={styles.portrait}>
            <CoverBurst />
            <div className={deskStyles.maskOutline}>
              <div className={deskStyles.photoPlaceholder}>
                <img
                  src={`${import.meta.env.BASE_URL}images/profile.jpg`}
                  alt={personal.name}
                  className={deskStyles.profilePhoto}
                  decoding="async"
                />
              </div>
            </div>
          </div>

          <div className={deskStyles.hireBadge} style={reduced ? { animation: 'none' } : undefined} aria-hidden="true">
            <span className={deskStyles.hireBadgeText}>HIRE</span>
            <span className={deskStyles.hireBadgeText}>ME!</span>
          </div>

          <button
            type="button"
            className={`${styles.tap} ${reduced ? styles.still : ''}`}
            onClick={onOpen}
          >
            TAP TO OPEN
          </button>

          <div className={deskStyles.headlineStrip}>
            <span className={deskStyles.headlineText}>
              EXCLUSIVE: {personal.title.toUpperCase()} SEEKS NEW ADVENTURES!
            </span>
          </div>

          <div className={deskStyles.coverFooterSpider}>
            <span>{personal.name}</span>
            <span className={deskStyles.footerDot}>•</span>
            <span>{contact.location || 'Available Worldwide'}</span>
          </div>
        </div>
      </div>
    </PageFace>
  );
}
