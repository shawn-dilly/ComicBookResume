import { forwardRef, memo, useId } from 'react';
import { BURST, VIEW } from './burstGeometry';
import styles from './CoverBurst.module.css';

/**
 * The portrait bursting out through the red cover, as one seeded SVG that is
 * stretched over the portrait frame. Groups carry data-burst attributes so the
 * cover entrance can animate them; everything is visible by default.
 */
const CoverBurst = memo(
  forwardRef<SVGSVGElement>(function CoverBurst(_, ref) {
    const uid = useId().replace(/:/g, '');
    const dotsRed = `${uid}-dr`;
    const dotsLight = `${uid}-dl`;
    const heat = `${uid}-heat`;
    return (
      <svg
        ref={ref}
        className={styles.burst}
        viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <pattern id={dotsRed} width="1.7" height="1.7" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
            <circle className={styles.dotRed} cx="0.85" cy="0.85" r="0.42" />
          </pattern>
          <pattern id={dotsLight} width="1.7" height="1.7" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
            <circle className={styles.dotLight} cx="0.85" cy="0.85" r="0.4" />
          </pattern>
          <radialGradient id={heat} cx="0" cy="0" r="72" gradientUnits="userSpaceOnUse">
            <stop offset="0.66" stopColor="#FFFFFF" />
            <stop offset="0.76" stopColor="#FFF9B8" />
            <stop offset="0.86" stopColor="#FFF200" />
            <stop offset="1" stopColor="#F7941D" />
          </radialGradient>
        </defs>

        <g data-burst="cracks">
          <path className={styles.crack} d={BURST.cracks} />
          <path className={styles.speed} d={BURST.speed} />
        </g>

        <g data-burst="debris">
          {BURST.strands.map((s, i) => (
            <g key={`s${i}`} data-burst="piece" data-x={s.x} data-y={s.y} data-r={s.r}>
              <path className={styles.strandSheen} d={s.d} transform="translate(0.5 0.5)" />
              <path className={styles.strand} d={s.d} />
            </g>
          ))}
          {BURST.shards.map((s, i) => (
            <g key={`p${i}`} data-burst="piece" data-x={s.x} data-y={s.y} data-r={s.r}>
              <path className={s.kind === 'red' ? styles.shardRed : styles.shardCream} d={s.d} />
            </g>
          ))}
        </g>

        <g data-burst="hole">
          <path className={styles.holeShadow} d={BURST.hole} transform="translate(1.4 2.2)" />
          <path className={styles.hole} d={BURST.hole} />
          <path className={styles.holeDots} d={BURST.hole} fill={`url(#${dotsLight})`} />
          <path className={styles.rimLines} d={BURST.rimLines} />
          <path className={styles.loose} d={BURST.loose} />
        </g>

        <g data-burst="flaps">
          {BURST.flaps.map((fl, i) => (
            <g key={i} data-burst="flap" data-ox={fl.ox} data-oy={fl.oy}>
              <path className={styles.flapShadow} d={fl.shadow} />
              <path className={styles.flapUnder} d={fl.under} />
              <path className={styles.flapFold} d={fl.fold} />
              <path className={styles.flapCurl} d={fl.curl} />
            </g>
          ))}
        </g>

        <g data-burst="energy">
          <path className={styles.energy} d={BURST.burst} fill={`url(#${heat})`} />
          <path className={styles.energyDots} d={BURST.burst} fill={`url(#${dotsRed})`} />
        </g>
      </svg>
    );
  }),
);

export default CoverBurst;
