/**
 * PowersPage - Powers & Abilities: category tabs (in the data's order), the selected category's power meters, and
 * a Project hologram button that tilts the card into a floor with four towers (see HoloStage).
 *
 * The tab strip is a roving-tabindex tablist (arrow keys, Home and End). Leaving the page ends the projection.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { resumeData } from '../../../data/resume';
import { Banner } from '../../components/Banner';
import { PageFace } from '../../components/PageFace';
import { ScrollPage } from '../../components/ScrollPage';
import { TABS } from '../../mobileConfig';
import { prefersReducedMotion } from '../../hooks/useReducedMotion';
import HoloStage from './HoloStage';
import styles from './PowersPage.module.css';

interface Props {
  ref?: React.Ref<HTMLElement>;
  /** This page is the current page. */
  active: boolean;
}

export default function PowersPage({ ref, active }: Props) {
  const categories = resumeData.skills;
  const [cat, setCat] = useState(0);
  const [holo, setHolo] = useState(false);
  const [wasActive, setWasActive] = useState(active);

  // Leaving the page drops the projection at once (adjusted during render, not in an effect).
  if (wasActive !== active) {
    setWasActive(active);
    if (!active) setHolo(false);
  }

  const stripRef = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState({ left: false, right: false });
  const nudged = useRef(false);

  // Whether the strip can scroll further either way, from its real scroll position and size.
  const measure = useCallback(() => {
    const el = stripRef.current;
    if (!el) return;
    const left = el.scrollLeft > TABS.endSlop;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - TABS.endSlop;
    setMore((m) => (m.left === left && m.right === right ? m : { left, right }));
  }, []);

  useLayoutEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  // The chosen tab scrolls to the middle of the strip.
  useEffect(() => {
    const el = stripRef.current;
    const tab = document.getElementById(`powers-tab-${cat}`);
    if (!el || !tab) return;
    const left = Math.max(0, tab.offsetLeft - (el.clientWidth - tab.offsetWidth) / 2);
    el.scrollTo({ left, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [cat]);

  // First arrival at the page: a small slide to the side and back shows the strip moves.
  useEffect(() => {
    if (!active || nudged.current) return;
    nudged.current = true;
    const el = stripRef.current;
    if (!el || prefersReducedMotion()) return;
    let back = 0;
    const out = window.setTimeout(() => {
      if (el.scrollLeft > TABS.endSlop || el.scrollWidth <= el.clientWidth + TABS.nudge) return;
      el.scrollTo({ left: TABS.nudge, behavior: 'smooth' });
      back = window.setTimeout(() => {
        if (Math.abs(el.scrollLeft - TABS.nudge) < 8) el.scrollTo({ left: 0, behavior: 'smooth' });
      }, TABS.nudgeBackMs);
    }, TABS.nudgeDelayMs);
    return () => {
      window.clearTimeout(out);
      window.clearTimeout(back);
    };
  }, [active]);

  const scrollTabs = (dir: -1 | 1) => {
    const el = stripRef.current;
    if (!el) return;
    const one = el.scrollWidth / categories.length;
    el.scrollBy({ left: dir * one, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  const choose = (i: number, focus = false) => {
    setCat(i);
    if (focus) requestAnimationFrame(() => document.getElementById(`powers-tab-${i}`)?.focus());
  };

  const onTabKey = (e: KeyboardEvent) => {
    const n = categories.length;
    let next = -1;
    if (e.key === 'ArrowRight') next = (cat + 1) % n;
    else if (e.key === 'ArrowLeft') next = (cat - 1 + n) % n;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = n - 1;
    if (next < 0) return;
    e.preventDefault();
    e.stopPropagation();
    choose(next, true);
  };

  return (
    <PageFace ref={ref} id="powers-abilities" label="Powers & Abilities">
      <ScrollPage label="Powers & Abilities">
        <Banner>Powers & Abilities</Banner>
        <div className={styles.tabsWrap} data-noswipe>
          <div
              ref={stripRef}
              className={styles.tabs}
              role="tablist"
              aria-label="Skill categories"
              onKeyDown={onTabKey}
              onScroll={measure}
            >
            {categories.map((c, i) => (
              <button
                key={c.category}
                type="button"
                role="tab"
                id={`powers-tab-${i}`}
                aria-selected={i === cat}
                aria-controls="powers-panel"
                tabIndex={i === cat ? 0 : -1}
                className={styles.tab}
                style={{ '--c': c.skills[0]?.color ?? 'var(--comic-yellow)' } as React.CSSProperties}
                onClick={() => choose(i)}
              >
                {c.category}
              </button>
            ))}
          </div>
          {(['left', 'right'] as const).map((side) => (
            <div key={side} className={`${styles.edge} ${styles[side]} ${more[side] ? styles.show : ''}`} aria-hidden={!more[side]}>
              <button
                type="button"
                className={styles.chevron}
                aria-label="Scroll categories"
                tabIndex={more[side] ? 0 : -1}
                onClick={() => scrollTabs(side === 'left' ? -1 : 1)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d={side === 'left' ? 'M15 4 7 12l8 8' : 'M9 4l8 8-8 8'} />
                </svg>
              </button>
            </div>
          ))}
        </div>
        <div id="powers-panel" role="tabpanel" aria-labelledby={`powers-tab-${cat}`}>
          <HoloStage category={categories[cat]} holo={holo} active={active} />
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.project} aria-pressed={holo} onClick={() => setHolo((v) => !v)}>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M3 18 12 22l9-4-9-4z" />
              <path d="M12 14V3M8 7l4-4 4 4" />
            </svg>
            <span>{holo ? 'End projection' : 'Project hologram'}</span>
          </button>
        </div>
      </ScrollPage>
    </PageFace>
  );
}
