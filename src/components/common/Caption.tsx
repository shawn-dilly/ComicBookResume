import { type ReactNode } from 'react';
import styles from './common.module.css';

interface CaptionProps {
  children: ReactNode;
  variant?: 'narrator' | 'location' | 'time';
  className?: string;
}

const Caption = ({ children, variant = 'narrator', className = '' }: CaptionProps) => {
  return (
    <div className={`${styles.caption} ${styles[`caption${variant.charAt(0).toUpperCase() + variant.slice(1)}`]} ${className}`}>
      {children}
    </div>
  );
};

export default Caption;
