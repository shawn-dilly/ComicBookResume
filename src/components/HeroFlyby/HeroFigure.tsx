import { ART, type Pose } from './heroArt';
import styles from './HeroFlyby.module.css';

/**
 * The Iron Architect: the real Origin Story panel art (two transparent cut-outs) with code-drawn thrust layered on top.
 *
 * Both poses are always in the DOM (so they are decoded before the first pass and can cross-fade). Each pose carries its
 * own boot thrusters: a flame at each boot pointing down the body axis, and a trail of tile sparks and halftone dots
 * streaming on from it. Because the thrust lives in the figure's own frame, it follows every tilt and mirror.
 */

// Trail sparks below the flame in a 40 x 200 box: [x, y, size, opacity, colour]
const SPARKS: Array<[number, number, number, number, string]> = [
  [4, 52.0, 7, 0.95, '#ffe45c'],
  [27, 76.0, 6, 0.9, '#5fd8ff'],
  [14, 90.0, 6, 0.8, '#f28a2e'],
  [28, 102.0, 5, 0.72, '#5fd8ff'],
  [6, 112.0, 5, 0.62, '#2f6fd6'],
  [20, 126.0, 4, 0.52, '#5fd8ff'],
  [30, 136.0, 4, 0.42, '#2f6fd6'],
  [8, 148.0, 3, 0.34, '#5fd8ff'],
  [22, 162.0, 3, 0.24, '#5fd8ff'],
  [12, 176.0, 2.5, 0.15, '#5fd8ff'],
];
const DOTS: Array<[number, number, number, number]> = [
  [20, 70.0, 2.6, 0.9],
  [10, 82.0, 2.3, 0.78],
  [31, 94.0, 2.1, 0.66],
  [18, 108.0, 1.9, 0.55],
  [34, 120.0, 1.7, 0.45],
  [9, 132.0, 1.5, 0.36],
  [25, 144.0, 1.3, 0.28],
  [15, 156.0, 1.2, 0.2],
  [30, 170.0, 1, 0.12],
];

function Thrust({ x, y, delay, deg }: { x: number; y: number; delay: string; deg: number }) {
  return (
    <div className={styles.thrust} style={{ left: `${x * 100}%`, top: `${y * 100}%`, '--tr': `${deg}deg` } as React.CSSProperties}>
      <svg viewBox="0 0 40 200" aria-hidden="true" focusable="false">
        <g className={styles.trail} style={{ animationDelay: delay }}>
          {SPARKS.map(([sx, sy, s, o, c]) => (
            <rect key={`${sx}-${sy}`} x={sx} y={sy} width={s * 1.4} height={s * 1.4} fill={c} stroke="#0a1128" strokeWidth="1" opacity={o} />
          ))}
          {DOTS.map(([cx, cy, r, o]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r * 1.3} fill="#8fe3ff" opacity={o} />
          ))}
        </g>
        <g className={styles.flame} style={{ animationDelay: delay }}>
          <path d="M9,0 L31,0 C33,20 27,40 20,60 C13,40 7,20 9,0Z" fill="#ff8a1f" stroke="#0a1128" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M13,0 L27,0 C27,14 24,28 20,42 C16,28 13,14 13,0Z" fill="#ffe45c" />
          <path d="M16,0 L24,0 C24,8 22,16 20,22 C18,16 16,8 16,0Z" fill="#fffbe0" />
        </g>
      </svg>
    </div>
  );
}

function HeroFigure() {
  return (
    <>
      {(Object.keys(ART) as Pose[]).map((pose) => {
        const a = ART[pose];
        return (
          <div
            key={pose}
            className={styles.pose}
            data-pose={pose}
            style={{ aspectRatio: `${a.w} / ${a.h}`, '--ax': a.anchor[0], '--ay': a.anchor[1], '--k': a.k, '--ts': a.ts } as React.CSSProperties}
          >
            <div className={styles.glow} />
            <img className={styles.art} src={a.src} width={a.w} height={a.h} decoding="async" alt="" draggable={false} />
            {a.boots.map(([x, y], i) => (
              <Thrust key={i} x={x} y={y} delay={i === 0 ? '0s' : '-0.11s'} deg={a.thrust} />
            ))}
          </div>
        );
      })}
    </>
  );
}

export default HeroFigure;
