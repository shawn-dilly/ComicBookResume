/**
 * SkillsHologram - the Powers & Abilities projection that rises out of the open comic book.
 *
 * It is rendered next to the book inside the hanger (see ComicBookGSAP `renderOverlay`), not inside `.book`
 * (which clips and flattens), so it shares the book's 3D pose: when the book lies flat the towers stand
 * perpendicular to the page plane. One tower per skill (categories x skills, from resumeData) stands on the two
 * pages, split like the printed pages: the first categories over the left page, the rest over the right. A tower
 * is a CSS 3D box (4 sides, a cap, ten-step scale lines) whose height is level / 10 of HOLO.towers.maxHeight and
 * whose sides carry the skill's own colour. Each category is a row: a standing nameplate at the left end of its
 * page, then its towers, with a faint floor zone outlining the tower bases so the row reads as a group.
 *
 * Phases come from the parent (useHologramMode): `entering` plays the projection timeline (flash, scan line,
 * light panel, a wave of towers rising with a flicker, labels), `on` idles (CSS animations only), `exiting`
 * powers down in HOLO.timing.powerDown seconds and then reports `onPoweredDown`.
 *
 * Pointer input: while the book is flat its own click zones are off. A transparent hit plane just above the
 * page takes clicks (left half = previous page, right half = next page), and the towers stand above it so a
 * tower under the pointer always wins. The readout panel and close button are 2D, portalled out of the 3D
 * space into `.app-container`.
 */

import { Fragment, memo, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import type { PageSize } from '../ComicBook';
import { resumeData } from '../../data/resume';
import { splitSkillCategories } from '../../pages/Skills/layout';
import { HOLO } from './holoConfig';
import styles from './SkillsHologram.module.css';

export type HoloPhase = 'off' | 'entering' | 'on' | 'exiting';

interface SkillsHologramProps {
  page: PageSize;
  phase: Exclude<HoloPhase, 'off'>;
  /** The projection finished building. */
  onReady: () => void;
  /** The power-down finished (everything is invisible). */
  onPoweredDown: () => void;
  /** The reader clicked a page half: turn the page that way. */
  onTurn: (direction: 'forward' | 'backward') => void;
  /** The close control was used. */
  onClose: () => void;
  /** Sound hooks: `tickTimes` are seconds after the projection starts. */
  onPowerUp: (tickTimes: readonly number[]) => void;
  onPowerDown: () => void;
}

interface TowerSpec {
  key: string;
  category: string;
  /** Index of the category in `Geometry.categories`. */
  cat: number;
  name: string;
  level: number;
  accent: string;
  /** Position on the spread plane (px from the spread centre), y down. */
  x: number;
  y: number;
  /** Height in px at level 10 scale. */
  height: number;
  /** Delay (s) after the projection starts at which this tower begins to rise. */
  delay: number;
  label: string;
}

interface CategorySpec {
  index: number;
  name: string;
  skills: { name: string; level: number; accent: string }[];
  /** Where the nameplate stands (centre of its foot, px from the spread centre, y down). */
  plateX: number;
  plateY: number;
  /** Floor zone around the tower bases (centre and size, px). */
  zoneX: number;
  zoneY: number;
  zoneW: number;
  zoneH: number;
  /** Floor leader between the nameplate and the zone (left edge and width, px). */
  leaderX: number;
  leaderW: number;
  /** Delay (s) after the projection starts at which the zone and nameplate appear. */
  delay: number;
  label: string;
}

interface Geometry {
  towers: TowerSpec[];
  categories: CategorySpec[];
  towerWidth: number;
  maxHeight: number;
  labelFont: number;
  labelWidth: number;
  plateWidth: number;
  plateFont: number;
  /** Time (s) after the projection starts at which the last label has fully faded in. */
  total: number;
}

const T = HOLO.towers;
const C = HOLO.categories;
const TM = HOLO.timing;

/**
 * Row centres (fraction of page height from the middle, y down) for `n` categories stacked on one page.
 * Two rows keep the classic spacing; three or more squeeze to fit inside the page.
 */
function rowPositions(n: number): number[] {
  if (n <= 1) return [0];
  const half = Math.min(T.rowHalfSpanMax, (T.rowGap * (n - 1)) / 2);
  return Array.from({ length: n }, (_, r) => -half + (2 * half * r) / (n - 1));
}

/**
 * Place the categories and towers (all from resumeData) on the spread plane and work out the reveal timing.
 * Categories are split across the two pages exactly like the printed pages. Nameplates stand next to the spine
 * (never behind a nearer row's towers), towers run outward from them; rows are revealed back to front, each row's zone and nameplate just
 * before its towers.
 */
function buildGeometry(page: PageSize): Geometry {
  const pw = page.width;
  const ph = page.height;
  const towerWidth = T.width * pw;
  const pitch = T.pitch * pw;
  const maxHeight = T.maxHeight * ph;
  const plateWidth = C.plateWidth * pw;
  const { left, right } = splitSkillCategories(resumeData.skills);
  // `inward` is the direction (+1 / -1 along x) from a page's outer edge toward the spine: nameplates stand
  // next to the spine on both pages, towers run outward from them.
  const pages = [
    { inward: 1, categories: left, rows: rowPositions(left.length) },
    { inward: -1, categories: right, rows: rowPositions(right.length) },
  ];
  const placed = pages.flatMap((pg) =>
    pg.categories.map((category, row) => ({ category, inward: pg.inward, row, rowY: pg.rows[row] }))
  );
  const ys = placed.map((p) => p.rowY * ph);
  const minY = Math.min(...ys);
  const spanY = Math.max(...ys) - minY || 1;

  const towers: TowerSpec[] = [];
  const categories: CategorySpec[] = [];
  placed.forEach(({ category, inward, row, rowY }, index) => {
    const y = rowY * ph;
    // Away from the spine = +1 on the right page, -1 on the left page.
    const outward = -inward;
    // Every other row is pushed a little outward so towers of neighbouring rows do not line up behind each other.
    const stagger = row % 2 === 0 ? 0 : T.rowStagger * pitch;
    const plateNear = outward * C.margin * pw;
    const plateFar = plateNear + outward * plateWidth;
    const plateX = (plateNear + plateFar) / 2;
    const count = category.skills.length;
    // Tower k counts outward from the nameplate; the left page reads left to right, so its order is reversed.
    const towerX = (k: number): number =>
      plateFar + outward * (C.plateGap * pw + towerWidth / 2 + k * pitch + stagger);
    const xs = Array.from({ length: count }, (_, k) => towerX(k));
    const zoneNear = plateFar + outward * (C.plateGap * pw - C.zonePadX * pw + stagger);
    const zoneFar = xs[count - 1] + outward * (towerWidth / 2 + C.zonePadX * pw);
    const zoneLeft = Math.min(zoneNear, zoneFar);
    const zoneRight = Math.max(zoneNear, zoneFar);
    const leaderEnds = [plateFar, zoneNear];
    const catDelay = TM.riseStart + ((y - minY) / spanY) * TM.rowSpan;
    categories.push({
      index,
      name: category.category,
      skills: category.skills.map((sk) => ({ name: sk.name, level: sk.level, accent: sk.color ?? 'var(--comic-blue)' })),
      plateX,
      plateY: y,
      zoneX: (zoneLeft + zoneRight) / 2,
      zoneY: y,
      zoneW: zoneRight - zoneLeft,
      zoneH: towerWidth + 2 * C.zonePadY * ph,
      leaderX: Math.min(...leaderEnds),
      leaderW: Math.abs(leaderEnds[1] - leaderEnds[0]),
      delay: catDelay,
      label: `${category.category} category, ${count} skills`,
    });
    category.skills.forEach((skill, i) => {
      // Skills run left to right on both pages: on the left page the first skill is the farthest from the plate.
      const k = outward > 0 ? i : count - 1 - i;
      towers.push({
        key: `${category.category}-${skill.name}`,
        category: category.category,
        cat: index,
        name: skill.name,
        level: skill.level,
        accent: skill.color ?? 'var(--comic-blue)',
        x: xs[k],
        y,
        height: (skill.level / 10) * maxHeight,
        delay: catDelay + TM.towerLead + k * TM.towerStagger,
        label: `${skill.name}, ${skill.level} out of 10, ${category.category}`,
      });
    });
  });
  const lastDelay = Math.max(...towers.map((t) => t.delay));
  return {
    towers,
    categories,
    towerWidth,
    maxHeight,
    labelFont: Math.max(9, T.labelFont * pw),
    labelWidth: pitch * 1.02,
    plateWidth,
    plateFont: Math.max(10, C.plateFont * pw),
    total: lastDelay + TM.labelAfter + TM.labelFade,
  };
}

function PowerBar({ level, accent }: { level: number; accent: string }) {
  return (
    <div className={styles.bar} style={{ '--accent': accent } as CSSProperties} aria-hidden="true">
      {Array.from({ length: 10 }, (_, i) => (
        <span key={i} className={i < level ? styles.barOn : styles.barOff} />
      ))}
    </div>
  );
}

const Tower = memo(function Tower({
  spec,
  geo,
  active,
  inCategory,
  onActivate,
  onDeactivate,
  onSelect,
}: {
  spec: TowerSpec;
  geo: Geometry;
  active: boolean;
  /** Its category is the highlighted one (category focus). */
  inCategory: boolean;
  onActivate: (key: string) => void;
  onDeactivate: (key: string) => void;
  onSelect: (key: string) => void;
}) {
  const style = {
    '--tx': `${spec.x}px`,
    '--ty': `${spec.y}px`,
    '--h': `${spec.height}px`,
    '--tw': `${geo.towerWidth}px`,
    '--seg': `${geo.maxHeight / 10}px`,
    '--accent': spec.accent,
    '--lw': `${geo.labelWidth}px`,
    '--lf': `${geo.labelFont}px`,
  } as CSSProperties;
  return (
    <button
      type="button"
      className={styles.tower}
      style={style}
      data-holo-tower=""
      data-active={active ? 'true' : undefined}
      data-in={inCategory ? 'true' : undefined}
      aria-label={spec.label}
      onPointerEnter={() => onActivate(spec.key)}
      onPointerLeave={() => onDeactivate(spec.key)}
      onFocus={() => onActivate(spec.key)}
      onBlur={() => onDeactivate(spec.key)}
      onClick={() => onSelect(spec.key)}
    >
      <span className={styles.foot} aria-hidden="true" />
      <span className={`${styles.face} ${styles.f0}`} aria-hidden="true" />
      <span className={`${styles.face} ${styles.f1}`} aria-hidden="true" />
      <span className={`${styles.face} ${styles.f2}`} aria-hidden="true" />
      <span className={`${styles.face} ${styles.f3}`} aria-hidden="true" />
      <span className={styles.cap} aria-hidden="true" />
      <span className={styles.label} aria-hidden="true">
        <span className={styles.labelText} data-holo-label="">
          <span className={styles.labelBody}>
            <span className={styles.labelName}>{spec.name}</span>
            <span className={styles.labelLevel}>{spec.level}/10</span>
          </span>
        </span>
      </span>
    </button>
  );
});

/** How a category's zone and nameplate are drawn: the highlighted one, a soft lift (a tower of it is hovered), or stepped back. */
type CatState = 'hot' | 'soft' | 'dim' | undefined;

const NamePlate = memo(function NamePlate({
  cat,
  geo,
  state,
  onActivate,
  onDeactivate,
  onSelect,
}: {
  cat: CategorySpec;
  geo: Geometry;
  state: CatState;
  onActivate: (index: number) => void;
  onDeactivate: (index: number) => void;
  onSelect: (index: number) => void;
}) {
  const style = {
    '--px': `${cat.plateX}px`,
    '--py': `${cat.plateY}px`,
    '--pwid': `${geo.plateWidth}px`,
    '--pf': `${geo.plateFont}px`,
  } as CSSProperties;
  return (
    <div className={styles.plateAnchor} style={style}>
      {/* The button is the visible, billboarded plate itself, so its box is where the reader sees it. */}
      <button
        type="button"
        className={styles.nameplate}
        data-holo-nameplate=""
        data-holo-plate-text=""
        data-cat-state={state}
        aria-label={cat.label}
        onPointerEnter={() => onActivate(cat.index)}
        onPointerLeave={() => onDeactivate(cat.index)}
        onFocus={() => onActivate(cat.index)}
        onBlur={() => onDeactivate(cat.index)}
        onClick={() => onSelect(cat.index)}
      >
        <span className={styles.plateName} aria-hidden="true">
          {cat.name}
        </span>
      </button>
    </div>
  );
});

export default function SkillsHologram({
  page,
  phase,
  onReady,
  onPoweredDown,
  onTurn,
  onClose,
  onPowerUp,
  onPowerDown,
}: SkillsHologramProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const geo = useMemo(() => buildGeometry(page), [page]);
  const [hover, setHover] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const [hoverCat, setHoverCat] = useState<number | null>(null);
  const [pinnedCat, setPinnedCat] = useState<number | null>(null);
  // The 2D readout and close control go into the app container, outside the 3D space.
  const hudRoot = document.querySelector('.app-container');

  // Latest callbacks, so the timeline is built once.
  const cb = useRef({ onReady, onPoweredDown, onPowerUp, onPowerDown });
  useLayoutEffect(() => {
    cb.current = { onReady, onPoweredDown, onPowerUp, onPowerDown };
  });

  const phaseNow = useRef(phase);
  useLayoutEffect(() => {
    phaseNow.current = phase;
  });

  const timeline = useRef<gsap.core.Timeline | null>(null);
  const started = useRef(false);

  // Idle animations pause while the tab is hidden.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const sync = (): void => {
      root.dataset.paused = document.hidden ? 'true' : 'false';
    };
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, []);

  // The projection: built once when the hologram mounts.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    started.current = false;
    const ctx = gsap.context(() => {
      const q = (sel: string): HTMLElement[] => gsap.utils.toArray<HTMLElement>(root.querySelectorAll(sel));
      const towers = q('[data-holo-tower]');
      const labels = q('[data-holo-label]');
      const zones = q('[data-holo-zone]');
      const plates = q('[data-holo-plate-text]');
      const spreadW = page.width * 2;
      if (phaseNow.current === 'on') {
        // Rebuilt after a resize while the projection is up: show the finished state, do not replay the intro.
        started.current = true;
        gsap.set('[data-holo-plate], [data-holo-panel]', { opacity: 1 });
        gsap.set(zones, { opacity: 1 });
        gsap.set(plates, { '--appear': 1 });
        gsap.set(towers, { '--rise': 1, '--flick': 1 });
        gsap.set(labels, { opacity: 1 });
        return;
      }
      const tl = gsap.timeline({
        delay: TM.projectionDelay,
        onStart: () => {
          started.current = true;
        },
        onComplete: () => cb.current.onReady(),
      });
      timeline.current = tl;
      tl.call(() => cb.current.onPowerUp(geo.towers.map((t) => t.delay + TM.rise * 0.55)), [], 0);
      tl.fromTo('[data-holo-plate]', { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power1.out' }, 0);
      tl.fromTo(
        '[data-holo-flash]',
        { opacity: 0 },
        { keyframes: { opacity: [0, 1, 0.15, 0.5, 0] }, duration: TM.flash, ease: 'none' },
        0
      );
      tl.fromTo(
        '[data-holo-scan]',
        { x: -spreadW / 2, opacity: 0 },
        { x: spreadW / 2, duration: TM.scan, ease: 'power1.inOut', keyframes: { opacity: [0, 1, 1, 0] } },
        0.05
      );
      tl.fromTo('[data-holo-panel]', { opacity: 0 }, { opacity: 1, duration: TM.cone, ease: 'power1.out' }, 0.12);
      // Category by category: the zone and the nameplate come up, then that row's towers rise.
      geo.categories.forEach((c, i) => {
        tl.fromTo(zones[i], { opacity: 0 }, { opacity: 1, duration: TM.zoneFade, ease: 'power1.out' }, c.delay);
        tl.fromTo(plates[i], { '--appear': 0 }, { '--appear': 1, duration: TM.zoneFade, ease: 'power1.out' }, c.delay + 0.04);
      });
      towers.forEach((el, i) => {
        const d = geo.towers[i].delay;
        tl.fromTo(el, { '--rise': 0 }, { '--rise': 1, duration: TM.rise, ease: 'power3.out' }, d);
        // Flicker through a variable the faces read: opacity on the tower itself would flatten its 3D box.
        tl.fromTo(
          el,
          { '--flick': 0 },
          { keyframes: { '--flick': [0, 0.9, 0.25, 1, 0.55, 1] }, duration: TM.flicker, ease: 'none' },
          d
        );
        tl.fromTo(labels[i], { opacity: 0 }, { opacity: 1, duration: TM.labelFade, ease: 'power1.out' }, d + TM.labelAfter);
      });
    }, root);
    return () => {
      timeline.current = null;
      ctx.revert();
    };
  }, [page, geo]);

  // Power down on request.
  useEffect(() => {
    if (phase !== 'exiting') return;
    const root = rootRef.current;
    const wasStarted = started.current;
    timeline.current?.kill();
    timeline.current = null;
    if (!root || !wasStarted) {
      // The projection never began (the reader turned the page straight away): nothing to power down.
      const id = window.requestAnimationFrame(() => cb.current.onPoweredDown());
      return () => window.cancelAnimationFrame(id);
    }
    cb.current.onPowerDown();
    const down = gsap.timeline({ onComplete: () => cb.current.onPoweredDown() });
    down.to(root.querySelectorAll('[data-holo-tower]'), { '--rise': 0, duration: TM.powerDown, ease: 'power2.in' }, 0);
    down.to(root.querySelectorAll('[data-holo-label]'), { opacity: 0, duration: TM.powerDown * 0.45 }, 0);
    down.to(
      root.querySelectorAll(
        '[data-holo-plate], [data-holo-panel], [data-holo-zone], [data-holo-scan], [data-holo-flash]'
      ),
      { opacity: 0, duration: TM.powerDown * 0.8 },
      0
    );
    down.to(root.querySelectorAll('[data-holo-plate-text]'), { '--appear': 0, duration: TM.powerDown * 0.8 }, 0);
    down.to(root.querySelectorAll('[data-holo-tower]'), { '--flick': 0, duration: TM.powerDown * 0.5 }, TM.powerDown * 0.5);
    return () => {
      down.kill();
    };
  }, [phase]);

  // What is highlighted: a hovered / focused tower wins, then a hovered / focused nameplate, then whatever was clicked.
  const towerKey = hover ?? (hoverCat === null ? pinned : null);
  const activeTower = geo.towers.find((t) => t.key === towerKey) ?? null;
  const catIndex = activeTower ? null : hover === null ? (hoverCat ?? (pinned === null ? pinnedCat : null)) : null;
  const activeCategory = catIndex === null ? null : (geo.categories[catIndex] ?? null);
  const focusMode = activeTower ? 'tower' : activeCategory ? 'cat' : undefined;
  const highlightedCat = activeTower ? activeTower.cat : (activeCategory?.index ?? null);

  const catState = (index: number): CatState => {
    if (highlightedCat === null) return undefined;
    if (index === highlightedCat) return focusMode === 'cat' ? 'hot' : 'soft';
    return 'dim';
  };

  const selectTower = (key: string): void => {
    setPinnedCat(null);
    setPinned((p) => (p === key ? null : key));
  };
  const selectCat = (index: number): void => {
    setPinned(null);
    setPinnedCat((p) => (p === index ? null : index));
  };

  const toneVars = HOLO.tone;
  const rootStyle = {
    width: page.width * 2,
    height: page.height,
    '--tilt': `${HOLO.pose.tilt}deg`,
    '--pw': `${page.width}px`,
    '--ph': `${page.height}px`,
    '--tw': `${geo.towerWidth}px`,
    '--maxh': `${geo.maxHeight}px`,
    '--float': `${HOLO.idle.floatDistance}px`,
    '--floatPeriod': `${HOLO.idle.floatPeriod}s`,
    '--shimmerPeriod': `${HOLO.idle.shimmerPeriod}s`,
    '--flickerPeriod': `${HOLO.idle.flickerPeriod}s`,
    '--base': HOLO.colors.base,
    '--edge': HOLO.colors.edge,
    '--deep': HOLO.colors.deep,
    '--warm': HOLO.colors.warm,
    '--lFoot': toneVars.foot,
    '--lMid': toneVars.mid,
    '--lTop': toneVars.top,
    '--lCap': toneVars.cap,
    '--lFootHot': toneVars.hot.foot,
    '--lMidHot': toneVars.hot.mid,
    '--lTopHot': toneVars.hot.top,
    '--lCapHot': toneVars.hot.cap,
    '--cFoot': toneVars.footChroma,
    '--cCap': toneVars.capChroma,
    '--plateSpacing': `${C.plateSpacing}em`,
    '--plateLift': `${C.plateLift}px`,
    '--labelLift': `${T.labelLift}px`,
  } as CSSProperties;

  const hud = (
    <div className={styles.hud} data-phase={phase} data-holo-control="">
      <button type="button" className={styles.close} onClick={onClose} aria-label="Close hologram" data-holo-control="">
        <span aria-hidden="true">✕</span>
        <span className={styles.closeText}>ESC</span>
      </button>
      <div
        className={styles.readout}
        data-empty={activeTower || activeCategory ? undefined : 'true'}
        data-kind={activeCategory ? 'category' : undefined}
        aria-live="polite"
      >
        {activeTower ? (
          <>
            <div className={styles.readoutCategory}>{activeTower.category}</div>
            <div className={styles.readoutName}>{activeTower.name}</div>
            <PowerBar level={activeTower.level} accent={activeTower.accent} />
            <div className={styles.readoutLevel}>
              POWER LEVEL <strong>{activeTower.level}</strong>/10
            </div>
          </>
        ) : activeCategory ? (
          <>
            <div className={styles.readoutCategory}>CATEGORY / {activeCategory.skills.length} SKILLS</div>
            <div className={styles.readoutName}>{activeCategory.name}</div>
            <ul className={styles.readoutList}>
              {activeCategory.skills.map((sk) => (
                <li key={sk.name} style={{ '--accent': sk.accent } as CSSProperties}>
                  <span className={styles.swatch} aria-hidden="true" />
                  <span className={styles.listName}>{sk.name}</span>
                  <span className={styles.listLevel}>
                    <strong>{sk.level}</strong>/10
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className={styles.readoutHint}>HOVER OR TAP A TOWER OR CATEGORY</div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div ref={rootRef} className={styles.root} style={rootStyle} data-phase={phase} data-holo-root="">
        <div className={styles.shadow} aria-hidden="true" />
        <div className={styles.hitPlane}>
          <button
            type="button"
            className={styles.hitLeft}
            onClick={() => onTurn('backward')}
            aria-label="Previous page"
            tabIndex={-1}
            data-holo-hit="left"
          />
          <button
            type="button"
            className={styles.hitRight}
            onClick={() => onTurn('forward')}
            aria-label="Next page"
            tabIndex={-1}
            data-holo-hit="right"
          />
        </div>
        <div
          className={styles.stage}
          data-focus={focusMode}
          role="group"
          aria-label={`Skills hologram: ${geo.towers.length} skills in ${geo.categories.length} categories`}
        >
          <div className={styles.plate} data-holo-plate="" aria-hidden="true">
            <span className={styles.spineGlow} />
            <span className={`${styles.bracket} ${styles.b1}`} />
            <span className={`${styles.bracket} ${styles.b2}`} />
            <span className={`${styles.bracket} ${styles.b3}`} />
            <span className={`${styles.bracket} ${styles.b4}`} />
          </div>
          <div className={styles.flash} data-holo-flash="" aria-hidden="true" />
          <div className={styles.scan} data-holo-scan="" aria-hidden="true" />
          <div className={styles.panel} data-holo-panel="" aria-hidden="true">
            <span className={styles.panelBand} />
          </div>
          {geo.categories.map((c) => (
            <div
              key={`zone-${c.name}`}
              className={styles.zone}
              data-holo-zone=""
              data-cat-state={catState(c.index)}
              style={
                {
                  '--zx': `${c.zoneX}px`,
                  '--zy': `${c.zoneY}px`,
                  '--zw': `${c.zoneW}px`,
                  '--zh': `${c.zoneH}px`,
                  '--lx': `${c.leaderX}px`,
                  '--lwid': `${c.leaderW}px`,
                  '--pxz': `${c.plateX}px`,
                  '--pwid': `${geo.plateWidth}px`,
                } as CSSProperties
              }
              aria-hidden="true"
            >
              <span className={styles.zoneBody} />
              <span className={styles.foot2} />
              <span className={styles.leader} />
            </div>
          ))}
          {geo.categories.map((c) => (
            <Fragment key={c.name}>
              <NamePlate
                cat={c}
                geo={geo}
                state={catState(c.index)}
                onActivate={setHoverCat}
                onDeactivate={(index) => setHoverCat((h) => (h === index ? null : h))}
                onSelect={selectCat}
              />
              {geo.towers
                .filter((t) => t.cat === c.index)
                .map((spec) => (
                  <Tower
                    key={spec.key}
                    spec={spec}
                    geo={geo}
                    active={towerKey === spec.key}
                    inCategory={focusMode === 'cat' && highlightedCat === spec.cat}
                    onActivate={setHover}
                    onDeactivate={(key) => setHover((h) => (h === key ? null : h))}
                    onSelect={selectTower}
                  />
                ))}
            </Fragment>
          ))}
        </div>
      </div>
      {hudRoot ? createPortal(hud, hudRoot) : null}
    </>
  );
}
