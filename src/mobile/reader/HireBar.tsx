/**
 * HireBar - the phone's HIRE ME! bar: the cycling prompt on the left, a pulsing burst on the right. The whole strip
 * is one button that opens the Mission Board. It sits directly above the bottom bar and is not shown on the contact page.
 */

import { Burst } from '../../components/Burst';
import { usePrompt } from '../../components/HireBeacon';
import { BEACON_LABEL } from '../../data/hireMe';
import styles from './HireBar.module.css';

interface HireBarProps {
  hidden: boolean;
  onOpen: () => void;
}

export default function HireBar({ hidden, onOpen }: HireBarProps) {
  const prompt = usePrompt();
  return (
    <button
      type="button"
      className={`${styles.bar} ${hidden ? styles.off : ''}`}
      data-hire-bar=""
      aria-label="Hire me: open the Mission Board"
      aria-hidden={hidden}
      tabIndex={hidden ? -1 : 0}
      onClick={onOpen}
    >
      <span key={prompt.index} className={styles.prompt} aria-hidden="true">
        {prompt.text}
      </span>
      <span className={styles.burstBox} aria-hidden="true">
        <Burst className={styles.burst} rays={12} outer={49} inner={33} jitter={0.1} fill="#FFF200" fill2="#ED1C24" />
        <span className={styles.label}>{BEACON_LABEL}</span>
      </span>
    </button>
  );
}
