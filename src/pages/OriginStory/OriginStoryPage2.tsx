import { forwardRef } from 'react';
import { Page, Panel, SpeechBubble, Caption } from '../../components';
import { panelBgStyle } from '../../utils/styles';
import styles from '../pages.module.css';
import pageStyles from '../OriginStory.module.css';

const OriginStoryPage2 = forwardRef<HTMLDivElement>((_, ref) => {

  return (
    <Page ref={ref} pageNumber={5} variant="inner">
      <div className={styles.originPage}>
        {/* Two panels on top, one large panel on bottom */}
        <div className={`${styles.panelGrid} ${styles.panelGridOrigin2}`}>
          {/* Panel 5 - Top Left */}
          <Panel
            variant="standard"
            animate
            animationDelay={0.1}
            style={panelBgStyle('/images/ComicPanel5.png')}
            className={styles.imagePanel}
          >
            <div className={styles.panelOverlay} style={{ justifyContent: 'flex-end', alignItems: 'center' }}>
              <SpeechBubble variant="shout" maxWidth="85%">
                <span style={{ fontSize: '24px' }}>
                  A new hero arises..<br />
                  <strong>THE IRON ARCHITECT</strong>
                </span>
              </SpeechBubble>
            </div>
          </Panel>

          {/* Panel 6 - Top Right */}
          <Panel
            variant="standard"
            animate
            animationDelay={0.2}
            style={panelBgStyle('/images/ComicPanel6.png')}
            className={styles.imagePanel}
          >
            <div className={styles.panelOverlay} style={{ justifyContent: 'flex-end', alignItems: 'center' }}>
              <Caption variant="narrator" className={pageStyles.captionSmall}>
                With great power, comes great responsibility to architect a solution for all
              </Caption>
            </div>
          </Panel>

          {/* Panel 7 - Bottom Full Width */}
          <Panel
            variant="splash"
            animate
            animationDelay={0.3}
            style={panelBgStyle('/images/ComicPanel7.png')}
            className={`${styles.imagePanel} ${styles.fullWidthPanel}`}
          >
            <div className={styles.panelOverlay} style={{ justifyContent: 'space-between' }}>
              <Caption variant="narrator" className={pageStyles.captionWide}>
                Sometime in the future our hero has assembled a team..
              </Caption>
              <div className={pageStyles.missionBox}>
                <span className={pageStyles.missionLabel}>MISSION:</span>
                <span className={pageStyles.missionText}>
                  Build great teams. Shape the vision. Forge the future.
                </span>
              </div>
            </div>
          </Panel>
        </div>

        <div style={{
          textAlign: 'center',
          marginTop: '8px',
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
