/**
 * HireBeacon - the pulsing HIRE ME! starburst with a speech bubble that cycles three prompts, fixed above the
 * contact buttons at the right edge of the desktop layout. It opens the Mission Board.
 *
 * The dock ignores the pointer (only the burst takes clicks), so it never gets in the way of the book's click zones.
 */

import { BEACON_LABEL } from '../../data/hireMe';
import { Burst } from '../Burst';
import { usePrompt } from './usePrompt';
import styles from './HireBeacon.module.css';

interface HireBeaconProps {
  visible: boolean;
  onOpen: () => void;
}

export default function HireBeacon({ visible, onOpen }: HireBeaconProps) {
  const prompt = usePrompt();
  return (
    <div className={`${styles.dock} ${visible ? styles.on : ''}`} data-hire-beacon-dock="" inert={!visible}>
      <div key={prompt.index} className={styles.bubble} aria-hidden="true" data-hire-prompt="">
        {prompt.text}
      </div>
      <button type="button" className={styles.beacon} data-hire-beacon="" aria-label="Hire me: open the Mission Board" onClick={onOpen}>
        <Burst className={styles.burst} rays={16} outer={49} inner={34} jitter={0.14} fill="#FFF200" fill2="#ED1C24" />
        <span className={styles.text}>{BEACON_LABEL}</span>
      </button>
    </div>
  );
}
