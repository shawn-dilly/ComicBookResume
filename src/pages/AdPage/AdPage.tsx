/**
 * AdPage - the inside front cover: a mail-order ad (hard page, no page number), WANTED: TEAMS WITH BIG IDEAS!, the three missions as ad boxes and a coupon.
 * Tick missions and press CLIP & SEND: scissors cut round the dashed line, the coupon lifts off the page and the Mission
 * Board opens at step 2 with those missions picked (the coupon returns when the board closes).
 *
 * The page is printed art in fixed colours (paper stays cream in dark mode). The checkboxes and the button are marked
 * `data-no-turn` so the flipbook's click zones hand clicks to them instead of turning the page.
 */

import { forwardRef, useEffect, useRef, useState, type FormEvent } from 'react';
import gsap from 'gsap';
import { Page } from '../../components';
import { Burst } from '../../components/Burst';
import { FitText } from '../../mobile/components/FitText';
import { MissionIcon } from '../../components/MissionBoard';
import heroHover from '../../components/HeroFlyby/assets/hero-hover.webp';
import { AD_COPY, MISSIONS, type MissionId } from '../../data/hireMe';
import styles from './AdPage.module.css';

interface AdPageProps {
  /** The opening spread is showing: the page is reachable only then. */
  isVisible: boolean;
  /** The Mission Board is open; the coupon returns to the page when it closes. */
  boardOpen: boolean;
  onOpenBoard: (missions: MissionId[]) => void;
}

const reduced = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const SVG_NS = 'http://www.w3.org/2000/svg';

const Tick = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <path d="M3 11 L8 16 L17 4" fill="none" stroke="#ED1C24" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AdPage = forwardRef<HTMLDivElement, AdPageProps>(({ isVisible, boardOpen, onOpenBoard }, ref) => {
  const [checked, setChecked] = useState<MissionId[]>([]);
  const [hint, setHint] = useState('');
  const [cut, setCut] = useState(false);
  const fitRef = useRef<HTMLDivElement>(null);
  const couponRef = useRef<HTMLFormElement>(null);
  const cutRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  // The coupon comes back once the board has been closed.
  const [prevOpen, setPrevOpen] = useState(boardOpen);
  if (prevOpen !== boardOpen) {
    setPrevOpen(boardOpen);
    if (!boardOpen) setCut(false);
  }
  useEffect(() => {
    if (boardOpen || !busyRef.current) return;
    tlRef.current?.kill();
    tlRef.current = null;
    busyRef.current = false;
    if (cutRef.current) cutRef.current.innerHTML = '';
    if (couponRef.current) gsap.set(couponRef.current, { clearProps: 'transform,boxShadow' });
  }, [boardOpen]);

  useEffect(
    () => () => {
      tlRef.current?.kill();
    },
    []
  );

  const toggle = (id: MissionId) => {
    setChecked((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
    setHint('');
  };

  const clip = (e: FormEvent) => {
    e.preventDefault();
    const picked = MISSIONS.map((m) => m.id).filter((id) => checked.includes(id));
    const coupon = couponRef.current;
    const fit = fitRef.current;
    const layer = cutRef.current;
    if (!coupon || !fit || !layer) return;
    if (!picked.length) {
      setHint(AD_COPY.hint);
      if (!reduced()) gsap.fromTo(coupon, { x: -8 }, { x: 0, duration: 0.5, ease: 'elastic.out(1.2,.25)', clearProps: 'transform' });
      return;
    }
    if (busyRef.current) return;
    busyRef.current = true;
    if (reduced()) {
      setCut(true);
      onOpenBoard(picked);
      return;
    }

    // Scissors run round the dashed border, drawing the cut as they go; then the coupon lifts off and the board opens.
    const pr = fit.getBoundingClientRect();
    const cr = coupon.getBoundingClientRect();
    const x = cr.left - pr.left;
    const y = cr.top - pr.top;
    const w = cr.width;
    const h = cr.height;
    const unit = parseFloat(getComputedStyle(fit).fontSize) / 10;
    layer.innerHTML = '';
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('width', String(pr.width));
    svg.setAttribute('height', String(pr.height));
    svg.setAttribute('viewBox', `0 0 ${pr.width} ${pr.height}`);
    svg.innerHTML =
      `<path d="M${x} ${y}H${x + w}V${y + h}H${x}Z" fill="none" stroke="#231F20" stroke-width="${3.5 * unit * 0.8}" stroke-linecap="round"/>` +
      `<g data-scissors><g transform="scale(${0.72 * unit}) translate(-20 -20)">` +
      `<g class="blade" data-blade="1"><path d="M20 20 L74 14 L76 20 Z" fill="#c9d3dc" stroke="#231F20" stroke-width="2.5" stroke-linejoin="round"/><circle cx="6" cy="9" r="7.5" fill="none" stroke="#ED1C24" stroke-width="5"/><path d="M12 12 L20 20" stroke="#ED1C24" stroke-width="5" stroke-linecap="round"/></g>` +
      `<g class="blade" data-blade="2"><path d="M20 20 L74 26 L76 20 Z" fill="#aab6c1" stroke="#231F20" stroke-width="2.5" stroke-linejoin="round"/><circle cx="6" cy="31" r="7.5" fill="none" stroke="#ED1C24" stroke-width="5"/><path d="M12 28 L20 20" stroke="#ED1C24" stroke-width="5" stroke-linecap="round"/></g>` +
      `</g></g>`;
    layer.appendChild(svg);
    const path = svg.querySelector('path') as SVGPathElement;
    const scissors = svg.querySelector('[data-scissors]') as SVGGElement;
    const len = path.getTotalLength();
    path.style.strokeDasharray = String(len);
    path.style.strokeDashoffset = String(len);
    const blades = svg.querySelectorAll<SVGGElement>('[data-blade]');
    gsap.set(blades, { svgOrigin: '20 20' });
    gsap.set(blades[0], { rotation: -14 });
    gsap.set(blades[1], { rotation: 14 });
    const snip = gsap.timeline({ repeat: -1, yoyo: true });
    snip.to(blades[0], { rotation: 6, duration: 0.16, ease: 'sine.inOut' }, 0).to(blades[1], { rotation: -6, duration: 0.16, ease: 'sine.inOut' }, 0);

    const proxy = { t: 0 };
    const tl = gsap.timeline({
      onComplete: () => {
        snip.kill();
      },
    });
    tlRef.current = tl;
    tl.to(coupon, { scale: 0.985, duration: 0.15 }, 0)
      .to(
        proxy,
        {
          t: 1,
          duration: 1.7,
          ease: 'power1.inOut',
          onUpdate: () => {
            const l = len * proxy.t;
            const p = path.getPointAtLength(l);
            const q = path.getPointAtLength(Math.min(len, l + 2));
            const o = path.getPointAtLength(Math.max(0, l - 2));
            path.style.strokeDashoffset = String(len - l);
            gsap.set(scissors, { x: p.x, y: p.y, rotation: (Math.atan2(q.y - o.y, q.x - o.x) * 180) / Math.PI });
          },
        },
        0.1
      )
      .to(scissors, { opacity: 0, duration: 0.2 }, 1.8)
      .call(() => setCut(true), undefined, 1.85)
      .to(coupon, { y: -2.6 * unit, rotation: 3.5, scale: 1.05, boxShadow: '0 1.2em 1.4em rgba(0,0,0,.45)', duration: 0.5, ease: 'back.out(2)' }, 1.85)
      .to(coupon, { y: -3.4 * unit, duration: 0.35, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 2.4)
      .call(() => onOpenBoard(picked), undefined, 2.45);
  };

  return (
    <Page ref={ref} density="hard" variant="inner" showPageNumber={false} bleed>
      <div className={styles.page} data-ad-page="" inert={!isVisible}>
        <div className={styles.bg} aria-hidden="true">
          <i className={styles.sun} />
          <i className={styles.dotsA} />
          <i className={styles.dotsB} />
          <i className={styles.tint} />
        </div>
        <div ref={fitRef} className={styles.fit}>
          <div className={styles.top}>
            <span className={styles.attn}>{AD_COPY.attention}</span>
            <h2 className={styles.h1}>
              <FitText className={styles.wanted}>{AD_COPY.wanted}</FitText>
              <FitText className={styles.headline}>{AD_COPY.headline[0]}</FitText>
              <FitText className={styles.headline}>{AD_COPY.headline[1]}</FitText>
            </h2>
            <span className={styles.sub}>{AD_COPY.sub}</span>
            <div className={styles.burstBox} aria-hidden="true">
              <Burst className={styles.burstArt} rays={11} outer={49} inner={34} jitter={0.16} fill="#FFF200" />
              <span>
                {AD_COPY.burst[0]}
                <br />
                {AD_COPY.burst[1]}
              </span>
            </div>
          </div>

          <div className={styles.main}>
            <div className={styles.hero}>
              <div className={styles.bubble}>{AD_COPY.heroBubble}</div>
              <img src={heroHover} alt="" />
            </div>
            <div className={styles.boxes}>
              {MISSIONS.map((m, i) => (
                <div key={m.id} className={styles.box} data-ad-box={m.id}>
                  <span className={styles.ic}>
                    <Burst className={styles.icBurst} rays={10} outer={49} inner={37} jitter={0.08} fill={['#00AEEF', '#F7941D', '#EC008C'][i]} />
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
          </div>

          <div className={`${styles.couponWrap} ${cut ? styles.cut : ''}`}>
            <form ref={couponRef} className={styles.coupon} data-ad-coupon="" onSubmit={clip} noValidate>
              <span className={styles.scissorsIcon} aria-hidden="true">
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
                  <label key={m.id} className={styles.ck} data-no-turn="" data-ad-check={m.id}>
                    <input type="checkbox" name="mission" value={m.id} checked={checked.includes(m.id)} onChange={() => toggle(m.id)} />
                    <span className={styles.boxMark}>
                      <Tick />
                    </span>
                    {AD_COPY.labels[m.id]}
                  </label>
                ))}
              </fieldset>
              <button type="submit" className={styles.clipBtn} data-no-turn="" data-ad-clip="" aria-label="Clip and send">
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
          <div ref={cutRef} className={styles.cutLayer} aria-hidden="true" />
        </div>
      </div>
    </Page>
  );
});

AdPage.displayName = 'AdPage';

export default AdPage;
