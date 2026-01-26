import { forwardRef } from 'react';
import { Page, Panel, SpeechBubble, ActionWord } from '../../components';
import { resumeData } from '../../data/resume';
import styles from '../pages.module.css';

const OriginStoryPage2 = forwardRef<HTMLDivElement>((_, ref) => {
  const summaryParts = resumeData.summary.split(/[.!]\s+/).filter(Boolean);

  return (
    <Page ref={ref} pageNumber={4} variant="inner">
      <div className={styles.originPage}>
        <div className={`${styles.panelGrid} ${styles.panelGridMixed}`}>
          <Panel
            variant="splash"
            className={styles.fullWidthPanel}
            animate
            animationDelay={0.1}
            style={{ minHeight: '150px', position: 'relative' }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: '100%',
              padding: '12px'
            }}>
              <div style={{ flex: 1 }}>
                <SpeechBubble variant="shout" maxWidth="180px">
                  <span style={{ fontSize: '14px' }}>
                    And so our hero rises!
                  </span>
                </SpeechBubble>
              </div>
              <ActionWord word="POW" size="medium" rotation={-8} />
            </div>
          </Panel>

          <Panel variant="standard" animate animationDelay={0.2}>
            <div style={{ padding: '8px', fontSize: '11px', fontFamily: 'var(--font-body)' }}>
              {summaryParts[2] || 'Ready to face any challenge...'}
            </div>
            <SpeechBubble variant="speech" tailDirection="bottom-right" maxWidth="100%">
              <span style={{ fontSize: '10px' }}>
                Every bug shall be squashed!
              </span>
            </SpeechBubble>
          </Panel>

          <Panel variant="angled" animate animationDelay={0.3} halftone halftoneColor="red">
            <div style={{
              padding: '8px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '14px',
                color: 'var(--comic-blue)'
              }}>
                MISSION:
              </span>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-body)' }}>
                Build amazing things. Ship features. Mentor others.
              </span>
            </div>
          </Panel>
        </div>

        <div style={{
          textAlign: 'center',
          marginTop: '12px',
          fontFamily: 'var(--font-caption)',
          fontSize: '10px',
          fontStyle: 'italic'
        }}>
          CONTINUED ON NEXT PAGE...
        </div>
      </div>
    </Page>
  );
});

OriginStoryPage2.displayName = 'OriginStoryPage2';

export default OriginStoryPage2;
