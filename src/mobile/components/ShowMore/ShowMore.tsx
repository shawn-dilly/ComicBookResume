/** ShowMore - the Show more / Show less button of an expandable list. Colours follow the page (`currentColor`). */

import styles from './ShowMore.module.css';

interface ShowMoreProps {
  expanded: boolean;
  /** How many items are hidden while collapsed. */
  hidden: number;
  onToggle: () => void;
  className?: string;
}

export default function ShowMore({ expanded, hidden, onToggle, className = '' }: ShowMoreProps) {
  if (hidden <= 0) return null;
  return (
    <button type="button" className={`${styles.button} ${className}`} aria-expanded={expanded} onClick={onToggle}>
      {expanded ? 'Show less' : `Show more (${hidden})`}
    </button>
  );
}
