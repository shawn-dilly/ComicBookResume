/**
 * MobileAdPage - "WANTED: TEAMS WITH BIG IDEAS!": the ad page as a normal reader page. The missions stack as ad boxes and
 * the coupon sits at the bottom. CLIP & SEND cuts the coupon, then opens the Mission Board at step 2 with the ticked
 * missions (nothing ticked: a shake and a hint). The coupon comes back when the board closes.
 */

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Burst } from '../../../components/Burst';
import { MissionIcon } from '../../../components/MissionBoard';
import heroHover from '../../../components/HeroFlyby/assets/hero-hover.webp';
import { AD_COPY, MISSIONS, type MissionId } from '../../../data/hireMe';
import { FitText } from '../../components/FitText';
import { PageFace } from '../../components/PageFace';
import { ScrollPage } from '../../components/ScrollPage';
import styles from './AdPage.module.css';

interface MobileAdPageProps {
  ref?: React.Ref<HTMLElement>;
  boardOpen: boolean;
  onOpenBoard: (missions: MissionId[]) => void;
}

const ICON_FILL = ['#00AEEF', '#F7941D', '#EC008C'];

export default function MobileAdPage({ ref, boardOpen, onOpenBoard }: MobileAdPageProps) {
  const [checked, setChecked] = useState<MissionId[]>([]);
  const [hint, setHint] = useState('');
  const [cut, setCut] = useState(false);
  const [shaking, setShaking] = useState(false);
  const timer = useRef(0);

  // The coupon returns once the board has closed.
  const [prevOpen, setPrevOpen] = useState(boardOpen);
  if (prevOpen !== boardOpen) {
    setPrevOpen(boardOpen);
    if (!boardOpen) setCut(false);
  }
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const toggle = (id: MissionId) => {
    setChecked((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
    setHint('');
  };

  const clip = (e: FormEvent) => {
    e.preventDefault();
    const picked = MISSIONS.map((m) => m.id).filter((id) => checked.includes(id));
    if (!picked.length) {
      setHint(AD_COPY.hint);
      setShaking(true);
      return;
    }
    if (cut) return;
    setCut(true);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    timer.current = window.setTimeout(() => onOpenBoard(picked), reduced ? 0 : 900);
  };

  return (
    <PageFace ref={ref} id="ad-page" label={`${AD_COPY.wanted} ${AD_COPY.headline.join(' ')}`} faceClassName={styles.face}>
      <ScrollPage label={`${AD_COPY.wanted} ${AD_COPY.headline.join(' ')}`}>
        <div className={styles.top}>
          <span className={styles.attn}>{AD_COPY.attention}</span>
          <h2 className={styles.h1}>
            <FitText className={styles.wanted}>{AD_COPY.wanted}</FitText>
            <FitText className={styles.headline}>{AD_COPY.headline[0]}</FitText>
            <FitText className={styles.headline}>{AD_COPY.headline[1]}</FitText>
          </h2>
          <span className={styles.sub}>{AD_COPY.sub}</span>
        </div>

        <div className={styles.hero}>
          <div className={styles.bubble}>{AD_COPY.heroBubble}</div>
          <img src={heroHover} alt="" />
          <div className={styles.burstBox} aria-hidden="true">
            <Burst className={styles.burstArt} rays={11} outer={49} inner={34} jitter={0.16} fill="#FFF200" />
            <span>
              {AD_COPY.burst[0]}
              <br />
              {AD_COPY.burst[1]}
            </span>
          </div>
        </div>

        <div className={styles.boxes}>
          {MISSIONS.map((m, i) => (
            <div key={m.id} className={styles.box} data-ad-box={m.id}>
              <span className={styles.ic}>
                <Burst className={styles.icBurst} rays={10} outer={49} inner={37} jitter={0.08} fill={ICON_FILL[i]} />
                <MissionIcon id={m.id} className={styles.ico} />
              </span>
              <div>
                <h3>{m.title}</h3>
                <p>{m.blurb}</p>
              </div>
              {i === 0 && <span className={styles.newTag}>{AD_COPY.newTag}</span>}
            </div>
          ))}
        </div>

        <div className={`${styles.couponWrap} ${cut ? styles.cut : ''}`}>
          <form
            className={`${styles.coupon} ${shaking ? styles.shake : ''}`}
            data-ad-coupon=""
            onSubmit={clip}
            onAnimationEnd={(e) => e.target === e.currentTarget && setShaking(false)}
            noValidate
          >
            <span className={styles.scissors} aria-hidden="true">
              <svg viewBox="0 0 48 48">
                <g fill="none" stroke="#231F20" strokeWidth="3.5" strokeLinecap="round">
                  <circle cx="12" cy="36" r="6" />
                  <circle cx="12" cy="12" r="6" />
                  <path d="M17 15 L42 34 M17 33 L42 14" />
                </g>
              </svg>
            </span>
            <h3 className={styles.couponTitle}>
              {AD_COPY.couponTitle} <em>{AD_COPY.couponPick}</em>
            </h3>
            <fieldset className={styles.checks}>
              <legend className={styles.sr}>Missions</legend>
              {MISSIONS.map((m) => (
                <label key={m.id} className={styles.ck} data-ad-check={m.id}>
                  <input type="checkbox" name="mission" value={m.id} checked={checked.includes(m.id)} onChange={() => toggle(m.id)} />
                  <span className={styles.boxMark}>
                    <svg viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M3 11 L8 16 L17 4" fill="none" stroke="#ED1C24" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {AD_COPY.labels[m.id]}
                </label>
              ))}
            </fieldset>
            <button type="submit" className={styles.clipBtn} data-ad-clip="" aria-label="Clip and send">
              <Burst className={styles.clipArt} rays={14} outer={49} inner={35} jitter={0.14} fill="#ED1C24" />
              <span>
                {AD_COPY.send[0]}
                <br />
                {AD_COPY.send[1]}
              </span>
            </button>
            <p className={styles.hint} role="status" data-ad-hint="">
              {hint}
            </p>
            <p className={styles.fine}>{AD_COPY.couponFine}</p>
          </form>
        </div>
      </ScrollPage>
    </PageFace>
  );
}
