/**
 * CaseFileLoop - Secret Lab Projects, page 2: the agent loop as a vertical tap list (tap a step for its caption),
 * the bake-off, the numbers, what it found and the still-in-the-lab note.
 */

import { useState } from 'react';
import { resumeData } from '../../../data/resume';
import { PageFace } from '../../components/PageFace';
import { ScrollPage } from '../../components/ScrollPage';
import styles from './CaseFile.module.css';

const TOKEN_COLORS = ['#ED1C24', '#0072BC', '#00A651', '#662D91', '#F7941D'];
const STAT_COLORS = ['#0072BC', '#ED1C24', '#662D91', '#00A651', '#F7941D', '#EC008C'];

export default function CaseFileLoop({ ref }: { ref?: React.Ref<HTMLElement> }) {
  const { caseFile: cf, footer } = resumeData.specialProjects;
  const [open, setOpen] = useState(-1);
  return (
    <PageFace ref={ref} id="case-file-loop" label={cf.loop.title} faceClassName={styles.face}>
      <ScrollPage label={cf.loop.title}>
        <h2 className={styles.title}>{cf.loop.title}</h2>
        <p className={styles.hint}>{cf.loop.hint}</p>

        <ol className={styles.loopList} data-loop-list="">
          {cf.loop.nodes.map((node, i) => {
            const on = open === i;
            return (
              <li key={node.label} className={on ? styles.stepOn : ''}>
                <button
                  type="button"
                  className={styles.step}
                  aria-expanded={on}
                  aria-controls={`loop-cap-${i}`}
                  data-loop-step={i}
                  onClick={() => setOpen(on ? -1 : i)}
                >
                  <span className={styles.stepNo}>{i + 1}</span>
                  <span className={styles.stepLabel}>{node.label}</span>
                </button>
                <p id={`loop-cap-${i}`} className={styles.cap} hidden={!on} data-loop-caption={i}>
                  {node.caption}
                </p>
              </li>
            );
          })}
        </ol>
        <div className={styles.loopBack} aria-hidden="true">
          &#8635;
        </div>

        <section className={styles.bake} data-case-section="bake-off">
          <p>
            <b className={styles.runIn}>{cf.bakeOff.title}</b> <b>{cf.bakeOff.headline}</b> {cf.bakeOff.text}
          </p>
          <div className={styles.tokens} aria-hidden="true">
            {Array.from({ length: cf.bakeOff.tokens }, (_, i) => (
              <span key={i} className={styles.token} style={{ background: TOKEN_COLORS[i % TOKEN_COLORS.length] }}>
                {i + 1}
              </span>
            ))}
            <span className={`${styles.token} ${styles.ref}`}>REF</span>
          </div>
          <span className={styles.refLabel}>{cf.bakeOff.referee}</span>
        </section>

        <ul className={styles.stats}>
          {cf.stats.map((s, i) => (
            <li key={s.label} style={{ background: STAT_COLORS[i % STAT_COLORS.length] }}>
              <b>{s.value}</b>
              <span>{s.label}</span>
            </li>
          ))}
        </ul>

        <h3 className={styles.found}>{cf.findingsTitle}</h3>
        <ol className={styles.findings}>
          {cf.findings.map((f, i) => (
            <li key={f.title}>
              <span className={styles.findNo}>{i + 1}</span>
              <p>
                <b className={styles.runIn}>{f.title}</b> {f.text}
              </p>
            </li>
          ))}
        </ol>

        <aside className={styles.still} data-case-section="still-in-the-lab">
          <p>
            <b className={styles.runIn}>{cf.stillInTheLab.title}</b> {cf.stillInTheLab.text}
          </p>
        </aside>

        <p className={styles.foot}>{footer}</p>
      </ScrollPage>
    </PageFace>
  );
}
