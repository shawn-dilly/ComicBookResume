import { forwardRef } from 'react';
import { Page, Panel, SpeechBubble } from '../components';
import { resumeData } from '../data/resume';
import styles from './pages.module.css';

interface TestimonialsPageProps {
  pageNumber: number;
}

const TestimonialsPage = forwardRef<HTMLDivElement, TestimonialsPageProps>(
  ({ pageNumber }, ref) => {
    return (
      <Page ref={ref} pageNumber={pageNumber} variant="inner">
        <div className={styles.testimonialsPage}>
          <h2 className={styles.pageHeader}>Mighty Allies</h2>

          {resumeData.testimonials.map((testimonial, index) => (
            <Panel
              key={testimonial.name}
              variant="standard"
              animate
              animationDelay={index * 0.15}
              className={styles.flexPanel}
              style={{ padding: '10px' }}
            >
              <div className={styles.testimonialPanel}>
                <div className={styles.testimonialAvatar}>
                  {testimonial.name.charAt(0)}
                </div>
                <div className={styles.testimonialContent}>
                  <SpeechBubble
                    variant="speech"
                    tailDirection="left"
                    maxWidth="100%"
                    animate={false}
                  >
                    <p className={styles.testimonialQuote}>
                      "{testimonial.quote}"
                    </p>
                  </SpeechBubble>
                  <div style={{ marginTop: '8px', marginLeft: '8px' }}>
                    <p className={styles.testimonialAuthor}>
                      {testimonial.name}
                      {testimonial.heroAlias && (
                        <span style={{
                          fontFamily: 'var(--font-caption)',
                          fontSize: '9px',
                          marginLeft: '4px',
                          opacity: 0.7
                        }}>
                          a.k.a. {testimonial.heroAlias}
                        </span>
                      )}
                    </p>
                    <p className={styles.testimonialRole}>{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      </Page>
    );
  }
);

TestimonialsPage.displayName = 'TestimonialsPage';

export default TestimonialsPage;
