/**
 * ComicBookFlipping - Prototype using flipping-pages library
 *
 * EVALUATION NOTES:
 * =================
 *
 * 1. OVERFLOW HANDLING:
 *    - The library uses CSS transforms and perspective for 3D effects
 *    - Content is contained within page boundaries during animation
 *    - No significant overflow issues observed; pages bend naturally within bounds
 *    - Shadow effects stay contained within the component
 *
 * 2. ANIMATION QUALITY:
 *    - Animation is smooth with configurable duration (default 400ms)
 *    - Uses CSS 3D transforms for the page bend effect
 *    - Less realistic "book page" feel compared to react-pageflip (more like card flipping)
 *    - Direction: "right-to-left" gives a book-like forward flip
 *    - The fold/bend effect is more minimal than react-pageflip
 *
 * 3. CUSTOMIZATION:
 *    - Easy to style via containerProps and CSS
 *    - Shadow can be customized with shadowBackground prop
 *    - animationDuration, swipeLength, swipeSpeed all configurable
 *    - perspectiveMultiplier adjusts 3D depth
 *    - No built-in page corner curl or page-turn shadows like react-pageflip
 *
 * 4. PERFORMANCE:
 *    - Lightweight with minimal DOM manipulation
 *    - Uses CSS transforms (GPU accelerated)
 *    - Note: Each page renders twice (for fold effect) - can impact heavy content
 *    - willChange prop available for performance optimization
 *
 * 5. CODE COMPLEXITY:
 *    - Simpler API than react-pageflip
 *    - State management is straightforward (just track selected page index)
 *    - Built-in swipe support, no need for additional gesture handling
 *    - Total: ~150 lines for full implementation vs ~200 for react-pageflip
 *
 * 6. REACT 19 COMPATIBILITY:
 *    - Library peer deps only support React 16-18
 *    - Required --legacy-peer-deps to install
 *    - May have compatibility issues in production
 */

import { useState, useCallback, useEffect } from 'react';
import { FlippingPages } from 'flipping-pages';
import 'flipping-pages/dist/style.css';
import styles from './ComicBookFlipping.module.css';

interface ComicBookFlippingProps {
  onPageChange?: (pageIndex: number) => void;
}

export interface ComicBookFlippingRef {
  flipNext: () => void;
  flipPrev: () => void;
  flipTo: (page: number) => void;
  getCurrentPage: () => number;
}

const ComicBookFlipping = ({ onPageChange }: ComicBookFlippingProps) => {
  const [selected, setSelected] = useState(0);
  const totalPages = 6;

  // Handle swipe end - update the page
  const handleSwipeEnd = useCallback(
    (page: number) => {
      setSelected(page);
      onPageChange?.(page);
    },
    [onPageChange]
  );

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        setSelected((prev) => {
          const next = Math.min(prev + 1, totalPages - 1);
          onPageChange?.(next);
          return next;
        });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelected((prev) => {
          const next = Math.max(prev - 1, 0);
          onPageChange?.(next);
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPageChange, totalPages]);

  // Handle click navigation
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const halfWidth = rect.width / 2;

      if (clickX < halfWidth) {
        // Left side - go back
        setSelected((prev) => {
          const next = Math.max(prev - 1, 0);
          onPageChange?.(next);
          return next;
        });
      } else {
        // Right side - go forward
        setSelected((prev) => {
          const next = Math.min(prev + 1, totalPages - 1);
          onPageChange?.(next);
          return next;
        });
      }
    },
    [onPageChange, totalPages]
  );

  return (
    <div className={styles.bookContainer}>
      <div className={styles.bookWrapper} onClick={handleClick}>
        <FlippingPages
          direction="right-to-left"
          selected={selected}
          onSwipeEnd={handleSwipeEnd}
          animationDuration={600}
          perspectiveMultiplier={3}
          shadowBackground="rgba(0, 0, 0, 0.3)"
          containerProps={{
            className: styles.flippingContainer,
          }}
        >
          {/* Page 0: Cover */}
          <div className={`${styles.page} ${styles.coverPage}`}>
            <div className={styles.coverBanner}>RESUME COMICS</div>
            <div className={styles.coverTitle}>
              <span className={styles.theText}>THE</span>
              <span className={styles.incredibleText}>INCREDIBLE</span>
            </div>
            <div className={styles.heroName}>DEVELOPER</div>
            <div className={styles.coverHeroArea}>
              <div className={styles.heroSilhouette}>D</div>
              <div className={styles.actionBurst} />
            </div>
            <div className={styles.issueCallout}>
              <span>FIRST ISSUE!</span>
              <span className={styles.calloutSub}>COLLECTOR'S EDITION</span>
            </div>
            <div className={styles.coverFooter}>
              Flipping Pages Library Test
            </div>
          </div>

          {/* Page 1: Origin Story */}
          <div className={`${styles.page} ${styles.innerPage}`}>
            <div className={styles.pageHeader}>ORIGIN STORY</div>
            <div className={styles.panel}>
              <div className={styles.panelContent}>
                <p className={styles.caption}>
                  "In the beginning, there was code..."
                </p>
                <p>
                  Every hero has an origin story. This developer's journey
                  began with a simple "Hello, World!" and evolved into
                  something extraordinary.
                </p>
              </div>
            </div>
            <div className={styles.pageNumber}>1</div>
          </div>

          {/* Page 2: Skills */}
          <div className={`${styles.page} ${styles.innerPage}`}>
            <div className={styles.pageHeader}>SUPER POWERS</div>
            <div className={styles.skillsGrid}>
              <div className={styles.skillItem}>
                <span className={styles.skillName}>React</span>
                <div className={styles.skillBar}>
                  <div
                    className={styles.skillFill}
                    style={{ width: '95%' }}
                  />
                </div>
              </div>
              <div className={styles.skillItem}>
                <span className={styles.skillName}>TypeScript</span>
                <div className={styles.skillBar}>
                  <div
                    className={styles.skillFill}
                    style={{ width: '90%' }}
                  />
                </div>
              </div>
              <div className={styles.skillItem}>
                <span className={styles.skillName}>CSS</span>
                <div className={styles.skillBar}>
                  <div
                    className={styles.skillFill}
                    style={{ width: '85%' }}
                  />
                </div>
              </div>
              <div className={styles.skillItem}>
                <span className={styles.skillName}>Node.js</span>
                <div className={styles.skillBar}>
                  <div
                    className={styles.skillFill}
                    style={{ width: '80%' }}
                  />
                </div>
              </div>
            </div>
            <div className={styles.pageNumber}>2</div>
          </div>

          {/* Page 3: Experience */}
          <div className={`${styles.page} ${styles.innerPage}`}>
            <div className={styles.pageHeader}>HEROIC DEEDS</div>
            <div className={styles.experienceItem}>
              <div className={styles.expHeader}>
                <span className={styles.expCompany}>TECH CORP</span>
                <span className={styles.expDate}>2020-Present</span>
              </div>
              <div className={styles.expRole}>Senior Developer</div>
              <ul className={styles.expList}>
                <li>Led team of 5 engineers</li>
                <li>Shipped 20+ features</li>
                <li>Reduced bugs by 40%</li>
              </ul>
            </div>
            <div className={styles.pageNumber}>3</div>
          </div>

          {/* Page 4: Education */}
          <div className={`${styles.page} ${styles.innerPage}`}>
            <div className={styles.pageHeader}>TRAINING GROUNDS</div>
            <div className={styles.panel}>
              <div className={styles.panelContent}>
                <div className={styles.educationItem}>
                  <span className={styles.eduDegree}>B.S. Computer Science</span>
                  <span className={styles.eduSchool}>State University</span>
                  <span className={styles.eduYear}>2016-2020</span>
                </div>
                <div className={styles.speechBubble}>
                  <span>"Knowledge is the ultimate superpower!"</span>
                </div>
              </div>
            </div>
            <div className={styles.pageNumber}>4</div>
          </div>

          {/* Page 5: Back Cover */}
          <div className={`${styles.page} ${styles.backPage}`}>
            <div className={styles.backContent}>
              <div className={styles.contactSection}>
                <h2 className={styles.contactTitle}>CONTACT THE HERO</h2>
                <div className={styles.contactItem}>
                  <span>Email: hero@example.com</span>
                </div>
                <div className={styles.contactItem}>
                  <span>GitHub: @developer-hero</span>
                </div>
                <div className={styles.contactItem}>
                  <span>LinkedIn: /in/developer-hero</span>
                </div>
              </div>
              <div className={styles.endMessage}>
                <span className={styles.theEnd}>THE END?</span>
                <span className={styles.nextIssue}>
                  SEE YOU IN THE NEXT ISSUE!
                </span>
              </div>
            </div>
          </div>
        </FlippingPages>
      </div>

      {/* Navigation indicator */}
      <div className={styles.pageIndicator}>
        Page {selected + 1} of {totalPages}
      </div>

      {/* Click zone hints */}
      <div className={styles.clickHints}>
        <span className={styles.leftHint}>← PREV</span>
        <span className={styles.rightHint}>NEXT →</span>
      </div>
    </div>
  );
};

ComicBookFlipping.displayName = 'ComicBookFlipping';

export default ComicBookFlipping;
