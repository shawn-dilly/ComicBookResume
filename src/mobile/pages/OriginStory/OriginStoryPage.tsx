/**
 * OriginStoryPage - the origin story as a guided view: one of the seven real panels per screen.
 *
 * Tap or swipe (or Next / Back) steps through the panels; the reader moves to the next page after the last one.
 * The panel art is about 3 MB per file, so only the current panel and its neighbours are mounted, and only while
 * this page is the current page or next to it; images load lazily and decode off the main thread. Captions, the
 * POW action word, the shout bubble and the mission box use the same wording as the desktop spreads.
 */

import { ActionWord } from '../../../components/ActionWord';
import Caption from '../../../components/common/Caption';
import { ORIGIN_HEADING, originPanels } from '../../../data/originStory';
import { FitText } from '../../components/FitText';
import { PageFace } from '../../components/PageFace';
import useReducedMotion from '../../hooks/useReducedMotion';
import { ORIGIN } from '../../mobileConfig';
import styles from './OriginStoryPage.module.css';

interface Props {
  ref?: React.Ref<HTMLElement>;
  panel: number;
  /** This page is the current page or one of its neighbours: panel images may be mounted. */
  nearby: boolean;
  /** This page is the current page: the panel entrance animations may run. */
  active: boolean;
}

export default function OriginStoryPage({ ref, panel, nearby, active }: Props) {
  const reduced = useReducedMotion();
  const total = originPanels.length;
  return (
    <PageFace ref={ref} id="origin-story" label={ORIGIN_HEADING} faceClassName={styles.face}>
      <div className={styles.head}>
        <h2>{ORIGIN_HEADING}</h2>
        <span className={styles.count} aria-label={`Panel ${panel + 1} of ${total}`}>
          {panel + 1}/{total}
        </span>
      </div>
      <div className={styles.stage}>
        {originPanels.map((p, i) => {
          const on = i === panel;
          const mounted = nearby && Math.abs(i - panel) <= ORIGIN.mountRadius;
          const cls = [styles.panel, p.splash ? styles.wide : '', on ? styles.on : i < panel ? styles.before : ''].join(' ');
          return (
            <div
              key={p.image}
              className={cls}
              aria-hidden={!on}
              style={{ '--kb': `kb${(i % 3) + 1}`, '--ox': i % 2 ? '30%' : '70%', '--kb-seconds': `${ORIGIN.zoomSeconds}s` } as React.CSSProperties}
            >
              <div className={styles.art}>
                {mounted && (
                  <img
                    src={`${import.meta.env.BASE_URL}images/${p.image}`}
                    alt={p.alt}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                  />
                )}
              </div>
              {p.actionWord && on && active && (
                <div className={styles.action}>
                  <ActionWord word={p.actionWord} size="medium" rotation={12} animate={!reduced} />
                </div>
              )}
              {p.shout && (
                <div className={styles.shout}>
                  {p.shout.lead}
                  <FitText as="strong">{p.shout.name}</FitText>
                </div>
              )}
              {p.caption && (
                <div className={`${styles.caption} ${p.captionVariant === 'location' ? styles.location : ''} ${p.splash ? styles.splashCaption : ''}`}>
                  <Caption variant={p.captionVariant ?? 'narrator'}>{p.caption}</Caption>
                </div>
              )}
              {p.mission && (
                <div className={styles.mission}>
                  <b>{p.mission.label}</b>
                  <span>{p.mission.text}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className={styles.pips} aria-hidden="true">
        {originPanels.map((p, i) => (
          <i key={p.image} className={i === panel ? styles.pipOn : ''} />
        ))}
      </div>
    </PageFace>
  );
}
