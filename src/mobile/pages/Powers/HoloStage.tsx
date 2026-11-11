/**
 * HoloStage - the Powers & Abilities card and its hologram.
 *
 * Flat, it is a paper card with the category's power meters. With `holo` on, the card tilts back into a glowing
 * floor and four solid, skill-coloured towers rise from it, each with a label plate (name and level). Drag to spin
 * the floor; tap a tower (or its plate) for a readout. No sound, and nothing else is written on the scene.
 *
 * The 3D is plain CSS (perspective, rotateX/rotateZ, scale3d towers). Motion lives in one mutable `sim` object that
 * `render()` writes to the elements; gsap tweens the sim and React is only told which tower is selected. Under
 * reduced motion everything snaps. Leaving the page (`active` false) drops the projection immediately.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import type { SkillCategory } from '../../../types';
import { HOLO } from '../../mobileConfig';
import { prefersReducedMotion } from '../../hooks/useReducedMotion';
import { rgbTriplet } from '../../utils';
import Meters from './Meters';
import styles from './HoloStage.module.css';

interface HoloStageProps {
  category: SkillCategory;
  holo: boolean;
  active: boolean;
}

interface TowerState {
  rise: number;
  pl: number;
}

interface TowerEls {
  wrap: HTMLElement | null;
  body: HTMLElement | null;
  plate: HTMLElement | null;
  lead: HTMLElement | null;
  ring: HTMLElement | null;
}

interface Sim {
  tilt: number;
  yaw: number;
  fit: number;
  ty: number;
  projecting: boolean;
  /** Stretch of the towers and floor at full projection (see HOLO.maxTallness). */
  tall: number;
  towers: TowerState[];
}

interface Scales {
  /** Stage width: the full width of the page. */
  w: number;
  /** Scene scale for the flat card, and for the projection. */
  flat: number;
  holo: number;
  /** Height of the scene box while projecting (design px), its stretch against the design height, and the stage's height. */
  sceneH: number;
  tall: number;
  /** World origin's y in the scene box while projecting. */
  yOn: number;
  height: number;
}

const emptyEls = (): TowerEls => ({ wrap: null, body: null, plate: null, lead: null, ring: null });

/** Label font size: the longest word has to fit the plate. */
const plateFont = (name: string): number => {
  const longest = Math.max(...name.split(/\s+/).map((w) => w.length), 1);
  const f = HOLO.labelFont;
  return clamp(Math.floor(((HOLO.plateWidth - 14) / (longest * f.charWidth)) * 2) / 2, f.min, f.max);
};

const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));

export default function HoloStage({ category, holo, active }: HoloStageProps) {
  const hsRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const floorRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const scanRef = useRef<HTMLDivElement>(null);
  const els = useRef<TowerEls[]>([]);
  const simRef = useRef<Sim>({
    tilt: 0,
    yaw: 0,
    fit: 1,
    ty: HOLO.yOff,
    projecting: false,
    tall: 1,
    towers: Array.from({ length: 4 }, () => ({ rise: 0, pl: 0 })),
  });
  const geomRef = useRef<{ yOn: number; floor: number }>({ yOn: HOLO.designH * 0.66, floor: HOLO.floorH });
  const levelsRef = useRef<number[]>([]);

  // Towers lag the tab by one swap animation so the old ones can sink before the new ones rise.
  const [towerCat, setTowerCat] = useState(category);
  const [selected, setSelected] = useState(-1);
  const [scales, setScales] = useState<Scales>({ w: HOLO.designW, flat: 1, holo: 1, sceneH: HOLO.designH, tall: 1, yOn: HOLO.designH * 0.66, height: HOLO.floorH + 8 });

  const towers = towerCat.skills.slice(0, 4);

  const setEl = (i: number, key: keyof TowerEls) => (el: HTMLElement | null) => {
    (els.current[i] ??= emptyEls())[key] = el;
  };

  useEffect(() => {
    levelsRef.current = towers.map((s) => s.level);
  });

  const render = useCallback(() => {
    const sim = simRef.current;
    const world = worldRef.current;
    if (!world) return;
    const tall = 1 + (sim.tall - 1) * sim.tilt;
    if (floorRef.current) floorRef.current.style.transform = sim.tilt < 0.001 ? '' : `scaleY(${(tall * (1 + (HOLO.floorBoost - 1) * sim.tilt)).toFixed(4)})`;
    if (!sim.projecting && sim.tilt < 0.001) {
      world.style.transform = `translate(0,${sim.ty}px)`;
    } else {
      world.style.transform = `translate3d(0,${sim.ty.toFixed(1)}px,0) scale(${sim.fit.toFixed(4)}) rotateX(${(sim.tilt * HOLO.tilt).toFixed(2)}deg) rotateZ(${sim.yaw.toFixed(2)}deg)`;
    }
    if (glowRef.current) glowRef.current.style.opacity = clamp(sim.tilt * 1.4, 0, 1).toFixed(3);
    if (paperRef.current) {
      paperRef.current.style.opacity = clamp(1 - sim.tilt * 1.8, 0, 1).toFixed(3);
      paperRef.current.style.visibility = sim.tilt > 0.6 ? 'hidden' : 'visible';
    }
    const tiltDeg = sim.tilt * HOLO.tilt;
    sim.towers.forEach((t, i) => {
      const e = els.current[i];
      if (!e) return;
      const lvl = levelsRef.current[i] ?? 0;
      const h = (t.rise * lvl) / 10;
      const hh = HOLO.towerHeight * h * tall;
      const lift = HOLO.labelLift[i % 2];
      const face = `translate3d(0,0,${(hh + 4).toFixed(1)}px) rotateZ(${(-sim.yaw).toFixed(2)}deg) rotateX(${(-tiltDeg).toFixed(2)}deg)`;
      if (e.wrap) e.wrap.style.transform = `translate3d(${HOLO.towerX[i] * HOLO.towerPitch}px,${(HOLO.towerY[i] * tall).toFixed(1)}px,0)`;
      if (e.body) {
        e.body.style.transform = `scale3d(1,1,${Math.max(h * tall, 0.001).toFixed(4)})`;
        e.body.style.visibility = t.rise > 0.005 ? 'visible' : 'hidden';
      }
      if (e.ring) e.ring.style.opacity = clamp(t.rise * 1.6, 0, 1).toFixed(3);
      if (e.plate) {
        e.plate.style.transform = `${face} translate(-50%,-100%) translateY(${-lift}px)`;
        e.plate.style.opacity = t.pl.toFixed(3);
        e.plate.style.visibility = t.pl > 0.01 ? 'visible' : 'hidden';
      }
      if (e.lead) {
        e.lead.style.height = `${lift}px`;
        e.lead.style.transform = `${face} translateY(-100%)`;
        e.lead.style.opacity = (t.pl * 0.9).toFixed(3);
      }
    });
  }, []);

  /** Raise the towers one after another. */
  const rise = useCallback(
    (stagger: number, duration: number) => {
      const sim = simRef.current;
      sim.towers.forEach((t) => {
        t.rise = 0;
        t.pl = 0;
      });
      if (prefersReducedMotion()) {
        sim.towers.forEach((t) => {
          t.rise = 1;
          t.pl = 1;
        });
        render();
        return;
      }
      sim.towers.forEach((t, i) => {
        gsap.to(t, { rise: 1, duration, delay: 0.1 + i * stagger, ease: 'back.out(1.5)', onUpdate: render });
        gsap.to(t, { pl: 1, duration: HOLO.labelFade, delay: 0.1 + i * stagger + HOLO.labelDelay, ease: 'power1.out', onUpdate: render });
      });
    },
    [render]
  );

  const killAll = useCallback(() => {
    const sim = simRef.current;
    gsap.killTweensOf(sim);
    sim.towers.forEach((t) => gsap.killTweensOf(t));
  }, []);

  // Measure: the stage is as wide as the page (a little wider than its padding) and, while projecting, as tall as
  // the free space above the button. The scene is scaled to the width; the tower stretch is chosen so the projection
  // fills the height (see HOLO.fit).
  useLayoutEffect(() => {
    const hs = hsRef.current;
    if (!hs) return;
    const scroller = hs.closest<HTMLElement>('[data-scroller]');
    const measure = () => {
      const parentW = hs.parentElement?.clientWidth ?? HOLO.designW;
      const w = parentW + 2 * HOLO.bleed;
      const flat = Math.min(HOLO.maxFlatScale, parentW / HOLO.designW);
      let holoK = Math.max(0.5, (w - 2 * HOLO.sideMargin) / HOLO.designW);
      let tall = 1;
      let sceneH: number = HOLO.designH;
      let yOn = HOLO.designH * 0.66;
      let height = Math.round(HOLO.floorH * flat + 8);
      if (scroller) {
        const top = hs.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
        const avail = Math.max(120, scroller.clientHeight - top - HOLO.bottomReserve);
        const f = HOLO.fit;
        const up = (t: number) => f.up0 + f.up1 * t;
        const dn = (t: number) => f.dn0 + f.dn1 * t + f.dn2 * t * t;
        const need = (t: number) => up(t) + dn(t) + HOLO.padTop + HOLO.padBottom;
        const stretchFor = (k: number): number => {
          const room = avail / k;
          let lo: number = HOLO.minTallness;
          let hi: number = HOLO.maxTallness;
          if (need(lo) > room) return lo;
          for (let n = 0; n < 24; n++) {
            const mid = (lo + hi) / 2;
            if (need(mid) <= room) lo = mid;
            else hi = mid;
          }
          return lo;
        };
        // The scene's width and the stretch depend on each other (a deeper floor looks wider): settle them.
        const span = w - 2 * HOLO.sideMargin;
        for (let n = 0; n < 6; n++) holoK = span / HOLO.designW / (f.span0 + f.span1 * stretchFor(holoK));
        const hMin = need(HOLO.minTallness);
        if (avail / holoK < hMin) holoK = avail / hMin;
        const room = avail / holoK;
        const lo = stretchFor(holoK);
        tall = lo;
        sceneH = room;
        yOn = HOLO.padTop + (room - need(tall)) / 2 + up(tall);
        height = Math.round(avail);
      }
      const next: Scales = { w, flat, holo: holoK, sceneH, tall, yOn, height };
      setScales((prev) =>
        Math.abs(prev.w - w) < 0.5 &&
        Math.abs(prev.flat - flat) < 0.001 &&
        Math.abs(prev.holo - holoK) < 0.001 &&
        Math.abs(prev.height - height) < 1 &&
        Math.abs(prev.yOn - yOn) < 0.5
          ? prev
          : next
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (hs.parentElement) ro.observe(hs.parentElement);
    if (scroller) ro.observe(scroller);
    return () => ro.disconnect();
  }, []);

  // Keep the stretch and the resting height of the scene current.
  useEffect(() => {
    const sim = simRef.current;
    sim.tall = scales.tall;
    geomRef.current = { yOn: scales.yOn, floor: HOLO.floorH * scales.tall * HOLO.floorBoost };
    if (sim.projecting && sim.tilt > 0.999) sim.ty = geomRef.current.yOn;
    render();
  }, [scales, render]);

  // Projection on / off.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      render();
      return;
    }
    const sim = simRef.current;
    const instant = prefersReducedMotion() || !active;
    killAll();
    if (holo && active) {
      sim.projecting = true;
      if (instant) {
        sim.tilt = 1;
        sim.fit = HOLO.scaleOn;
        sim.ty = geomRef.current.yOn;
        rise(0, 0);
        if (glowRef.current) glowRef.current.style.opacity = '1';
        return;
      }
      const s = { t: sim.tilt, f: sim.fit, y: sim.ty };
      gsap.to(s, {
        t: 1,
        f: HOLO.scaleOn,
        y: geomRef.current.yOn,
        duration: HOLO.tiltIn,
        ease: 'power2.inOut',
        onUpdate: () => {
          sim.tilt = s.t;
          sim.fit = s.f;
          sim.ty = s.y;
          render();
        },
        onComplete: () => {
          // Emitter flash and scan line.
          const scan = scanRef.current;
          if (scan) {
            scan.style.transition = 'none';
            scan.style.opacity = '1';
            scan.style.transform = 'translateY(-60px)';
            requestAnimationFrame(() => {
              scan.style.transition = 'transform .55s linear, opacity .55s ease-in';
              scan.style.transform = 'translateY(${geomRef.current.floor}px)';
              scan.style.opacity = '0';
            });
          }
          rise(HOLO.riseStagger, HOLO.riseDuration);
        },
      });
      return;
    }
    // Off (button, or the page was left).
    sim.projecting = false;
    const timer = window.setTimeout(() => setSelected(-1), 0);
    if (instant) {
      sim.towers.forEach((t) => {
        t.rise = 0;
        t.pl = 0;
      });
      sim.tilt = 0;
      sim.fit = 1;
      sim.ty = HOLO.yOff;
      sim.yaw = 0;
      render();
      return () => window.clearTimeout(timer);
    }
    sim.towers.forEach((t) => gsap.to(t, { rise: 0, pl: 0, duration: 0.25, ease: 'power2.in', onUpdate: render }));
    const s = { t: sim.tilt, f: sim.fit, y: sim.ty, yw: sim.yaw };
    gsap.to(s, {
      t: 0,
      f: 1,
      y: HOLO.yOff,
      yw: 0,
      duration: HOLO.tiltOut,
      delay: 0.12,
      ease: 'power2.inOut',
      onUpdate: () => {
        sim.tilt = s.t;
        sim.fit = s.f;
        sim.ty = s.y;
        sim.yaw = s.yw;
        render();
      },
    });
    return () => window.clearTimeout(timer);
  }, [holo, active, render, rise, killAll]);

  // Changing the tab while projecting: the old towers sink, then the new ones rise.
  useEffect(() => {
    if (towerCat === category) return;
    const sim = simRef.current;
    const reduced = prefersReducedMotion();
    const wait = sim.projecting && !reduced ? HOLO.swapGapMs : 0;
    if (sim.projecting && !reduced) {
      sim.towers.forEach((t) => {
        gsap.killTweensOf(t);
        gsap.to(t, { rise: 0, pl: 0, duration: HOLO.swapOut, ease: 'power2.in', onUpdate: render });
      });
    }
    const timer = window.setTimeout(() => {
      setSelected(-1);
      setTowerCat(category);
    }, wait);
    return () => window.clearTimeout(timer);
  }, [category, towerCat, render]);

  // New towers mounted: rise them if projecting, otherwise keep them hidden.
  useEffect(() => {
    const sim = simRef.current;
    if (sim.projecting) rise(0.09, 0.55);
    else render();
  }, [towerCat, rise, render]);

  useEffect(() => {
    const sim = simRef.current;
    return () => {
      gsap.killTweensOf(sim);
      sim.towers.forEach((t) => gsap.killTweensOf(t));
    };
  }, []);

  // Orbit drag and tower taps (only while projecting).
  useEffect(() => {
    const hs = hsRef.current;
    if (!hs || !holo || !active) return;
    let drag: { x: number; yaw: number; id: number } | null = null;
    let moved = 0;
    const onDown = (e: PointerEvent) => {
      drag = { x: e.clientX, yaw: simRef.current.yaw, id: e.pointerId };
      moved = 0;
    };
    const onMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x;
      moved = Math.max(moved, Math.abs(dx));
      simRef.current.yaw = clamp(drag.yaw + dx * HOLO.yawPerPx, -HOLO.yawMax, HOLO.yawMax);
      render();
    };
    const onEnd = (e: PointerEvent) => {
      if (drag && e.pointerId === drag.id) {
        drag = null;
        window.setTimeout(() => {
          moved = 0;
        }, 60);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (moved > HOLO.tapSlop) return;
      const t = (e.target as Element).closest<HTMLElement>('[data-tower]');
      setSelected(t ? Number(t.dataset.tower) : -1);
    };
    hs.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);
    hs.addEventListener('click', onClick);
    return () => {
      hs.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
      hs.removeEventListener('click', onClick);
    };
  }, [holo, active, render]);

  const scale = holo && active ? scales.holo : scales.flat;
  const sel = selected >= 0 ? towers[selected] : undefined;

  return (
    <div
      ref={hsRef}
      className={`${styles.hs} ${holo && active ? styles.on : ''}`}
      style={{ margin: `0 -${HOLO.bleed}px`, height: holo && active ? scales.height : Math.round(HOLO.floorH * scales.flat + 8) }}
      data-noswipe={holo && active ? '' : undefined}
      data-holo-stage=""
    >
      <div
        className={styles.inner}
        style={{ height: holo && active ? scales.sceneH : HOLO.designH, transform: `translateX(${((scales.w - HOLO.designW * scale) / 2).toFixed(2)}px) scale(${scale.toFixed(4)})` }}
      >
        <div className={styles.scene}>
          <div ref={worldRef} className={styles.world}>
            <div ref={floorRef} className={styles.floor}>
              <div ref={paperRef} className={styles.paper}>
                <Meters key={category.category} category={category} />
              </div>
              <div ref={glowRef} className={styles.glow} aria-hidden="true" />
              <div ref={scanRef} className={styles.scan} aria-hidden="true" />
            </div>
            <div className={styles.towers}>
              {towers.map((skill, i) => {
                const lit = rgbTriplet(skill.color, HOLO.lighten);
                return (
                  <div
                    key={`${towerCat.category}-${skill.name}`}
                    className={`${styles.tower} ${i === selected ? styles.sel : ''}`}
                    ref={setEl(i, 'wrap')}
                    data-tower={i}
                    style={
                      {
                        '--c': lit,
                        '--pf': `${plateFont(skill.name)}px`,
                        '--pw': `${HOLO.plateWidth}px`,
                        '--tw': `${HOLO.towerWidth}px`,
                        '--th': `${HOLO.towerHeight}px`,
                      } as React.CSSProperties
                    }
                  >
                    <div ref={setEl(i, 'ring')} className={styles.ring} />
                    <div ref={setEl(i, 'body')} className={styles.body}>
                      <i className={`${styles.face} ${styles.fr}`} />
                      <i className={`${styles.face} ${styles.lf}`} />
                      <i className={`${styles.face} ${styles.rt}`} />
                      <i className={`${styles.face} ${styles.tp}`} />
                    </div>
                    <div ref={setEl(i, 'lead')} className={styles.lead} />
                    <div
                      ref={setEl(i, 'plate')}
                      className={styles.plate}
                      role="button"
                      tabIndex={0}
                      aria-label={`${skill.name}, level ${skill.level} of 10`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelected(i);
                        }
                      }}
                    >
                      <b>{skill.name}</b>
                      <i>
                        {skill.level}
                        <small>/10</small>
                      </i>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div
            className={`${styles.readout} ${sel ? styles.show : ''}`}
            style={sel ? ({ '--c': rgbTriplet(sel.color, HOLO.lighten) } as React.CSSProperties) : undefined}
            role="status"
            aria-live="polite"
          >
            {sel && (
              <>
                <div className={styles.rn}>
                  {sel.name} <span>{sel.level}/10</span>
                </div>
                <div className={styles.rm}>{towerCat.category}</div>
                <div className={styles.rb}>
                  {Array.from({ length: 10 }, (_, k) => (
                    <i key={k} className={k < sel.level ? styles.f : ''} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
