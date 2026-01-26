import { useRef, useEffect, type ReactNode } from 'react';
import { gsap } from 'gsap';
import type { PanelVariant } from '../../types';
import styles from './Panel.module.css';

interface PanelProps {
  children: ReactNode;
  variant?: PanelVariant;
  className?: string;
  backgroundColor?: string;
  halftone?: boolean;
  halftoneColor?: 'red' | 'blue' | 'yellow' | 'default';
  animate?: boolean;
  animationDelay?: number;
  style?: React.CSSProperties;
}

const Panel = ({
  children,
  variant = 'standard',
  className = '',
  backgroundColor,
  halftone = false,
  halftoneColor = 'default',
  animate = true,
  animationDelay = 0,
  style = {},
}: PanelProps) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (animate && panelRef.current) {
      gsap.fromTo(
        panelRef.current,
        {
          opacity: 0,
          scale: 0.95,
        },
        {
          opacity: 1,
          scale: 1,
          duration: 0.4,
          delay: animationDelay,
          ease: 'back.out(1.2)',
        }
      );
    }
  }, [animate, animationDelay]);

  const halftoneClass = halftone
    ? halftoneColor === 'default'
      ? styles.halftone
      : styles[`halftone${halftoneColor.charAt(0).toUpperCase() + halftoneColor.slice(1)}`]
    : '';

  return (
    <div
      ref={panelRef}
      className={`${styles.panel} ${styles[variant]} ${halftoneClass} ${className}`}
      style={{
        backgroundColor: backgroundColor,
        ...style,
      }}
    >
      <div className={styles.panelContent}>{children}</div>
    </div>
  );
};

export default Panel;
