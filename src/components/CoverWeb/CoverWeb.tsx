import { memo } from 'react';
import { WEB_W as W, WEB_H as H, buildWeb } from './coverWebGeometry';
import styles from './CoverWeb.module.css';

const WEB = buildWeb();

/** Static, seeded spider web drawn behind the cover art. */
const CoverWeb = memo(function CoverWeb() {
  return (
    <svg
      className={styles.web}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <g transform="translate(0.7 0.7)">
        <path className={styles.sheen} d={WEB.spokes} />
        <path className={styles.sheen} d={WEB.rings} />
      </g>
      <path className={styles.strand} d={WEB.spokes} />
      <path className={styles.strand} d={WEB.rings} />
    </svg>
  );
});

export default CoverWeb;
