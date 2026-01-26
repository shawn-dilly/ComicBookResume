import { forwardRef } from 'react';
import { Page } from '../components';
import styles from './pages.module.css';

const InsideFrontCoverPage = forwardRef<HTMLDivElement>((_, ref) => {
  return (
    <Page ref={ref} density="hard" variant="inner" showPageNumber={false}>
      <div className={styles.insideFrontCover}>
        {/* Decorative pattern - vintage comic book inside cover */}
        <div className={styles.adPattern}>
          <div className={styles.vintageAd}>
            <div className={styles.adBorder}>
              <div className={styles.adContent}>
                <span className={styles.adHeadline}>AMAZING!</span>
                <span className={styles.adSubhead}>You Won't Believe</span>
                <span className={styles.adSubhead}>What's Inside!</span>
                <div className={styles.adDivider} />
                <span className={styles.adTagline}>
                  THE INCREDIBLE STORY OF A
                </span>
                <span className={styles.adHero}>SOFTWARE DEVELOPER</span>
                <div className={styles.adStarburst}>
                  <span>WOW!</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.comicInfo}>
            <p>RESUME COMICS GROUP</p>
            <p className={styles.smallText}>
              All characters and events in this publication are entirely fictional
              and any resemblance to actual developers is purely intentional.
            </p>
          </div>
        </div>
      </div>
    </Page>
  );
});

InsideFrontCoverPage.displayName = 'InsideFrontCoverPage';

export default InsideFrontCoverPage;
