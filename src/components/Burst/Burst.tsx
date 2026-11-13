import { starPoints } from '../../utils/burst';

interface BurstProps {
  rays?: number;
  outer?: number;
  inner?: number;
  jitter?: number;
  fill: string;
  /** A second, offset burst drawn behind the first (the off-register look). */
  fill2?: string;
  className?: string;
}

const INK = '#231F20';

/** Burst - a flat comic starburst drawn as inline SVG in fixed print colours (it does not flip in dark mode). */
export default function Burst({ rays = 14, outer = 49, inner = 34, jitter = 0.14, fill, fill2, className }: BurstProps) {
  const k = fill2 ? 0.92 : 1;
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      {fill2 && (
        <polygon
          points={starPoints(rays, outer, inner * 0.9, jitter)}
          fill={fill2}
          stroke={INK}
          strokeWidth="3"
          strokeLinejoin="round"
          transform="translate(3 3)"
        />
      )}
      <polygon points={starPoints(rays, outer * k, inner * k, jitter)} fill={fill} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}
