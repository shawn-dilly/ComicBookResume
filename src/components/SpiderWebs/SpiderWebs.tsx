/**
 * SpiderWebs - Animated corner webs that frame the comic book
 *
 * A fixed, pointer-transparent SVG layer that sits behind the book. On mount,
 * each corner fires a single straight web line (the "thwip"), the spokes fan
 * out from that line, and the spiral rings weave in. The webs then settle into
 * a slow idle sway. Each page flip sends a ripple outward through the rings
 * via the exposed `pulse()` method.
 *
 * Implementation notes:
 * - Draw-on uses `pathLength="1"` + stroke-dasharray/dashoffset, which is
 *   plain SVG supported by every major browser. No GSAP plugins required.
 * - The fan is a rotation tween on each spoke around the corner origin
 *   (`svgOrigin: '0 0'`), from the lead line's angle to its own angle.
 * - Each corner renders the same path set twice: a wide, faint "halo" layer
 *   for glow and a thin "strand" layer on top. This avoids SVG filters, which
 *   are expensive to re-rasterize every animation frame.
 * - Geometry is seeded per corner so every web has its own organic shape.
 */

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { gsap } from 'gsap';
import { generateWeb, type WebGeometry } from './webGeometry';
import styles from './SpiderWebs.module.css';

export interface SpiderWebsRef {
  /** Send a quick ripple outward through every web's rings. */
  pulse: () => void;
}

interface SpiderWebsProps {
  /** Seconds to wait before the webs start shooting. */
  delay?: number;
}

type CornerKey = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

interface CornerConfig {
  key: CornerKey;
  seed: number;
  /** Stagger between corners so they fire one after another. */
  delay: number;
  /** Idle sway amplitude in degrees (sign sets direction). */
  sway: number;
  /** Idle sway half-period in seconds; varied so corners drift out of phase. */
  swayDuration: number;
}

const CORNERS: readonly CornerConfig[] = [
  { key: 'topLeft', seed: 11, delay: 0, sway: 0.7, swayDuration: 5.2 },
  { key: 'bottomRight', seed: 51, delay: 0.2, sway: 0.5, swayDuration: 6.6 },
  { key: 'topRight', seed: 23, delay: 0.4, sway: -0.6, swayDuration: 6.1 },
  { key: 'bottomLeft', seed: 37, delay: 0.6, sway: -0.8, swayDuration: 5.7 },
];

const LAYERS = ['halo', 'strand'] as const;

/** stroke-dashoffset that fully hides a strand; must match the CSS module. */
const HIDDEN = 1.02;

/** Phase 1: a single line fires straight out of the corner. */
const THWIP = { duration: 0.32, ease: 'power4.out' };
/** Phase 2: spokes draw along the lead line and swing out to their angles. */
const FAN = { startAt: 0.28, drawDuration: 0.3, swingDuration: 0.65, swingEase: 'back.out(1.3)', each: 0.04 };
/** Phase 3: rings weave in from the centre outward. */
const WEAVE = { startAt: 0.6, duration: 0.7, ease: 'power2.inOut', each: 0.09 };

/**
 * Collect paths by data attribute, sorted by index. Because every path exists
 * twice (halo + strand), consecutive pairs share an index. Stagger callbacks
 * use Math.floor(i / 2) so both copies of a strand animate in lockstep.
 */
function pathsByIndex(svg: SVGSVGElement, attr: 'spoke' | 'ring'): SVGPathElement[] {
  return Array.from(svg.querySelectorAll<SVGPathElement>(`path[data-${attr}]`)).sort(
    (a, b) => Number(a.getAttribute(`data-${attr}`)) - Number(b.getAttribute(`data-${attr}`))
  );
}

const pairStagger = (each: number) => (i: number) => Math.floor(i / 2) * each;

/** Stagger outward from the middle pair, so the fan opens from the lead line. */
const fanStagger = (each: number, count: number) => {
  const mid = (count - 1) / 2;
  return (i: number) => Math.abs(Math.floor(i / 2) - mid) * each;
};

const SpiderWebs = forwardRef<SpiderWebsRef, SpiderWebsProps>(({ delay = 0 }, ref) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<gsap.Context | null>(null);
  const reducedMotionRef = useRef(false);

  const webs = useMemo<Record<CornerKey, WebGeometry>>(() => {
    const result = {} as Record<CornerKey, WebGeometry>;
    for (const corner of CORNERS) {
      result[corner.key] = generateWeb({ seed: corner.seed });
    }
    return result;
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    reducedMotionRef.current = reduce;

    const ctx = gsap.context(() => {
      for (const corner of CORNERS) {
        const svg = root.querySelector<SVGSVGElement>(`svg[data-corner="${corner.key}"]`);
        if (!svg) continue;

        const leads = Array.from(svg.querySelectorAll<SVGPathElement>('path[data-lead]'));
        const spokes = pathsByIndex(svg, 'spoke');
        const rings = pathsByIndex(svg, 'ring');
        const { leadAngle, spokeAngles } = webs[corner.key];

        // Reduced motion: show the finished web immediately, no sway.
        if (reduce) {
          gsap.set([...leads, ...spokes, ...rings], { strokeDashoffset: 0 });
          continue;
        }

        const tl = gsap.timeline({ delay: delay + corner.delay });

        // 1. THWIP - one line fires straight out of the corner and snaps taut.
        tl.fromTo(
          leads,
          { strokeDashoffset: HIDDEN },
          { strokeDashoffset: 0, duration: THWIP.duration, ease: THWIP.ease },
          0
        );

        // 2. FAN - spokes appear along the lead line, then swing out to their
        //    own angles. Two tweens on the same targets because they need
        //    different eases: the swing may overshoot, the dash must not.
        tl.fromTo(
          spokes,
          { strokeDashoffset: HIDDEN },
          {
            strokeDashoffset: 0,
            duration: FAN.drawDuration,
            ease: 'power3.out',
            stagger: fanStagger(FAN.each, spokeAngles.length),
          },
          FAN.startAt
        );
        tl.fromTo(
          spokes,
          {
            // Rotate each spoke so it starts lying exactly on the lead line.
            rotation: (i: number) => leadAngle - spokeAngles[Math.floor(i / 2)],
            svgOrigin: '0 0',
          },
          {
            rotation: 0,
            duration: FAN.swingDuration,
            ease: FAN.swingEase,
            stagger: fanStagger(FAN.each, spokeAngles.length),
          },
          FAN.startAt
        );

        // 3. WEAVE - rings draw in from the centre outward.
        tl.fromTo(
          rings,
          { strokeDashoffset: HIDDEN },
          {
            strokeDashoffset: 0,
            duration: WEAVE.duration,
            ease: WEAVE.ease,
            stagger: pairStagger(WEAVE.each),
          },
          WEAVE.startAt
        );

        // 4. IDLE - a slow breeze-like sway pivoting on the corner anchor, plus
        //    a gentle shimmer. Infinite repeats keep the timeline alive until revert.
        tl.to(
          svg,
          {
            rotation: corner.sway,
            transformOrigin: '0px 0px',
            duration: corner.swayDuration,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
          },
          '>-0.2'
        );
        tl.to(
          svg,
          {
            opacity: 0.78,
            duration: corner.swayDuration * 0.6,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
          },
          '<'
        );
      }
    }, root);

    ctxRef.current = ctx;
    return () => {
      ctx.revert();
      ctxRef.current = null;
    };
  }, [delay, webs]);

  const pulse = useCallback(() => {
    const root = rootRef.current;
    const ctx = ctxRef.current;
    if (!root || !ctx || reducedMotionRef.current) return;

    // Register inside the context so these tweens are cleaned up on unmount.
    ctx.add(() => {
      for (const corner of CORNERS) {
        const svg = root.querySelector<SVGSVGElement>(`svg[data-corner="${corner.key}"]`);
        if (!svg) continue;
        gsap.fromTo(
          pathsByIndex(svg, 'ring'),
          { opacity: 1 },
          {
            opacity: 0.15,
            duration: 0.14,
            ease: 'power1.inOut',
            yoyo: true,
            repeat: 1,
            stagger: pairStagger(0.045),
            overwrite: 'auto',
          }
        );
      }
    });
  }, []);

  useImperativeHandle(ref, () => ({ pulse }), [pulse]);

  return (
    <div ref={rootRef} className={styles.layer} aria-hidden="true">
      {CORNERS.map((corner) => {
        const web = webs[corner.key];
        return (
          <div key={corner.key} className={`${styles.corner} ${styles[corner.key]}`}>
            <svg
              className={styles.web}
              data-corner={corner.key}
              viewBox="0 0 100 100"
              preserveAspectRatio="xMinYMin meet"
              overflow="visible"
              focusable="false"
            >
              {LAYERS.map((layer) => (
                <g key={layer} className={styles[layer]}>
                  <path d={web.lead} pathLength={1} data-lead="" className={styles.lead} />
                  {web.spokes.map((d, i) => (
                    <path key={`s${i}`} d={d} pathLength={1} data-spoke={i} className={styles.spoke} />
                  ))}
                  {web.rings.map((d, i) => (
                    <path key={`r${i}`} d={d} pathLength={1} data-ring={i} className={styles.ring} />
                  ))}
                </g>
              ))}
            </svg>
          </div>
        );
      })}
    </div>
  );
});

SpiderWebs.displayName = 'SpiderWebs';

export default SpiderWebs;
