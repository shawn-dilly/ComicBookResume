/** Banner - a page heading: yellow display type on an ink label, fitted to one line. */

import type { CSSProperties } from 'react';
import { FitText } from '../FitText';
import styles from './Banner.module.css';

interface BannerProps {
  children: string;
  /** Smaller label used above a company name (Epic Battles). */
  small?: boolean;
  className?: string;
  style?: CSSProperties;
}

export default function Banner({ children, small = false, className = '', style }: BannerProps) {
  return (
    <div className={styles.row}>
      <FitText as="h2" className={`${styles.banner} ${small ? styles.small : ''} ${className}`} style={style}>
        {children}
      </FitText>
    </div>
  );
}
