import { forwardRef } from 'react';
import { Page, Panel, Caption, ActionWord } from '../../components';
import { panelBgStyle } from '../../utils/styles';
import styles from '../pages.module.css';
import pageStyles from '../OriginStory.module.css';

const OriginStoryPage1 = forwardRef<HTMLDivElement>((_, ref) => {

  return (
    <Page ref={ref} pageNumber={4} variant="inner">
      <div className={styles.originPage}>
        <h2 className={styles.pageHeader}>Origin Story</h2>

        <div className={`${styles.panelGrid} ${styles.panelGrid2x2}`}>
          {/* Panel 1 - Top Left */}
          <Panel
            variant="standard"
            animate
            animationDelay={0.1}
            style={panelBgStyle('/images/ComicPanel1.png')}
            className={styles.imagePanel}
          >
            <div className={styles.panelOverlay}>
              <Caption variant="narrator">
                In the beginning... a hero was thrust into battle
              </Caption>
            </div>
          </Panel>

          {/* Panel 2 - Top Right */}
          <Panel
            variant="standard"
            animate
            animationDelay={0.2}
            style={panelBgStyle('/images/ComicPanel2.png')}
            className={styles.imagePanel}
          >
            <div className={styles.panelOverlay} style={{ justifyContent: 'flex-end' }}>
              <div style={{ position: 'absolute', top: '25%', right: '15%', zIndex: 10 }}>
                <ActionWord word="POW" size="small" rotation={12} />
              </div>
              <Caption variant="narrator">
                He fought against the bugs that overwhelmed the system
              </Caption>
            </div>
          </Panel>

          {/* Panel 3 - Bottom Left */}
          <Panel
            variant="standard"
            animate
            animationDelay={0.3}
            style={panelBgStyle('/images/ComicPanel3.png')}
            className={styles.imagePanel}
          >
            <div className={styles.panelOverlay} style={{ justifyContent: 'flex-end', alignItems: 'flex-end' }}>
              <Caption variant="narrator" className={pageStyles.captionSmall}>
                During the battle, a barrel of toxic waste was dumped on the hero and he couldn't dodge it
              </Caption>
            </div>
          </Panel>

          {/* Panel 4 - Bottom Right */}
          <Panel
            variant="standard"
            animate
            animationDelay={0.4}
            style={panelBgStyle('/images/ComicPanel4.png')}
            className={styles.imagePanel}
          >
            <div className={styles.panelOverlay} style={{ justifyContent: 'flex-end', alignItems: 'center' }}>
              <Caption variant="location">
                Something unexpected happened..
              </Caption>
            </div>
          </Panel>
        </div>
      </div>
    </Page>
  );
});

OriginStoryPage1.displayName = 'OriginStoryPage1';

export default OriginStoryPage1;
