/** Chips - a wrapping row of small badges (technologies, powers). Colours come from the page's CSS variables. */

import styles from './Chips.module.css';

interface ChipsProps {
  items: readonly string[];
  className?: string;
  chipClassName?: string;
}

export default function Chips({ items, className = '', chipClassName = '' }: ChipsProps) {
  return (
    <ul className={`${styles.chips} ${className}`}>
      {items.map((item) => (
        <li key={item} className={`${styles.chip} ${chipClassName}`}>
          {item}
        </li>
      ))}
    </ul>
  );
}
