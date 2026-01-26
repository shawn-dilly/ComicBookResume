import { forwardRef } from 'react';
import { Page, Panel, SpeechBubble, Caption } from '../../components';
import { resumeData } from '../../data/resume';
import styles from '../pages.module.css';

const OriginStoryPage1 = forwardRef<HTMLDivElement>((_, ref) => {
  const summaryParts = resumeData.summary.split(/[.!]\s+/).filter(Boolean);

  return (
    <Page ref={ref} pageNumber={3} variant="inner">
      <div className={styles.originPage}>
        <h2 className={styles.pageHeader}>Origin Story</h2>

        <div className={`${styles.panelGrid} ${styles.panelGrid2x2}`}>
          <Panel variant="standard" animate animationDelay={0.1}>
            <Caption variant="narrator">
              In the beginning...
            </Caption>
            <div style={{ marginTop: '8px', fontSize: '12px', fontFamily: 'var(--font-body)' }}>
              {summaryParts[0] || 'A hero emerged from the digital realm...'}
            </div>
          </Panel>

          <Panel variant="angled" animate animationDelay={0.2}>
            <SpeechBubble variant="thought" tailDirection="bottom-left" maxWidth="100%">
              <span style={{ fontSize: '11px' }}>
                With great code comes great responsibility!
              </span>
            </SpeechBubble>
          </Panel>

          <Panel variant="standard" animate animationDelay={0.3} halftone halftoneColor="blue">
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-body)', padding: '8px' }}>
              {summaryParts[1] || 'Armed with knowledge and determination...'}
            </div>
          </Panel>

          <Panel variant="standard" animate animationDelay={0.4}>
            <SpeechBubble variant="speech" tailDirection="top-right" maxWidth="100%">
              <span style={{ fontSize: '11px' }}>
                I shall defend the codebase!
              </span>
            </SpeechBubble>
            <Caption variant="location">
              The Journey Begins
            </Caption>
          </Panel>
        </div>
      </div>
    </Page>
  );
});

OriginStoryPage1.displayName = 'OriginStoryPage1';

export default OriginStoryPage1;
