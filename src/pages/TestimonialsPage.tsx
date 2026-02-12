import React, { forwardRef } from 'react';
import { Page, Panel, SpeechBubble } from '../components';
import { resumeData } from '../data/resume';
import type { Testimonial } from '../types';
import shared from './pages.module.css';
import styles from './Testimonials.module.css';

interface TestimonialsPageProps {
  pageNumber: number;
  testimonials?: Testimonial[];
  showHeader?: boolean;
}

// Generate comic panel style with hand-drawn border variation
function getComicPanelStyle(name: string): React.CSSProperties {
  // Simple hash from name to get consistent "random" values for border variation
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash = hash & hash;
  }

  // Generate varied border widths for each side (3-7px) - hand-drawn effect
  const top = 3 + Math.abs((hash >> 0) % 5);
  const right = 3 + Math.abs((hash >> 4) % 5);
  const bottom = 3 + Math.abs((hash >> 8) % 5);
  const left = 3 + Math.abs((hash >> 12) % 5);

  // Slight rotation for hand-drawn feel (-1.5 to 1.5 degrees)
  const rotation = ((hash % 30) - 15) / 10;

  // Offset shadow for depth (comic book style)
  const shadowX = 3 + Math.abs((hash >> 16) % 4);
  const shadowY = 3 + Math.abs((hash >> 20) % 4);

  // Slight position offset for organic feel
  const marginLeft = Math.abs((hash >> 6) % 3);

  return {
    borderWidth: `${top}px ${right}px ${bottom}px ${left}px`,
    borderStyle: 'solid',
    borderColor: 'var(--comic-black)',
    transform: `rotate(${rotation}deg)`,
    boxShadow: `${shadowX}px ${shadowY}px 0 var(--comic-black)`,
    marginLeft: `${marginLeft}%`,
  };
}

const TestimonialsPage = forwardRef<HTMLDivElement, TestimonialsPageProps>(
  ({ pageNumber, testimonials, showHeader = true }, ref) => {
    // Use provided testimonials or fall back to all from resumeData
    const displayTestimonials = testimonials || resumeData.testimonials;
    const isMultiple = displayTestimonials.length > 1;

    return (
      <Page ref={ref} pageNumber={pageNumber} variant="inner">
        <div className={`${styles.testimonialsPage} ${isMultiple ? styles.testimonialsPageMultiple : ''}`}>
          {showHeader && <h2 className={shared.pageHeader}>Mighty Allies</h2>}
          {!showHeader && <h2 className={shared.pageHeader}>Mighty Allies (Continued)</h2>}

          {displayTestimonials.map((testimonial, index) => {
            const comicStyle = getComicPanelStyle(testimonial.name);
            return (
            <Panel
              key={testimonial.name}
              variant="standard"
              animate
              animationDelay={index * 0.15}
              className={`${shared.flexPanel} ${isMultiple ? styles.testimonialPanelCompact : ''}`}
              style={{
                padding: isMultiple ? '10px' : '16px',
                ...comicStyle,
              }}
            >
              <div className={styles.testimonialPanel}>
                <div className={styles.testimonialContent}>
                  <SpeechBubble
                    variant="speech"
                    tailDirection="bottom-left"
                    maxWidth="100%"
                    animate={false}
                  >
                    <p className={`${styles.testimonialQuote} ${isMultiple ? styles.testimonialQuoteCompact : ''}`}>
                      "{testimonial.quote}"
                    </p>
                  </SpeechBubble>
                  <div className={styles.testimonialAttribution}>
                    <p className={`${styles.testimonialAuthor} ${isMultiple ? styles.testimonialAuthorCompact : ''}`}>
                      {testimonial.name}
                      {testimonial.heroAlias && (
                        <span className={styles.heroAlias}>
                          a.k.a. {testimonial.heroAlias}
                        </span>
                      )}
                    </p>
                    <p className={`${styles.testimonialRole} ${isMultiple ? styles.testimonialRoleCompact : ''}`}>{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </Panel>
            );
          })}
        </div>
      </Page>
    );
  }
);

TestimonialsPage.displayName = 'TestimonialsPage';

export default TestimonialsPage;
