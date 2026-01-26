import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import styles from './common.module.css';

interface PowerMeterProps {
  label: string;
  level: number; // 1-10
  color?: string;
  animate?: boolean;
  animationDelay?: number;
  className?: string;
}

const PowerMeter = ({
  label,
  level,
  color = 'var(--comic-red)',
  animate = true,
  animationDelay = 0,
  className = '',
}: PowerMeterProps) => {
  const fillRef = useRef<HTMLDivElement>(null);
  const clampedLevel = Math.min(10, Math.max(0, level));
  const percentage = (clampedLevel / 10) * 100;

  useEffect(() => {
    if (animate && fillRef.current) {
      gsap.fromTo(
        fillRef.current,
        { width: '0%' },
        {
          width: `${percentage}%`,
          duration: 0.8,
          delay: animationDelay,
          ease: 'power2.out',
        }
      );
    }
  }, [animate, animationDelay, percentage]);

  return (
    <div className={`${styles.powerMeter} ${className}`}>
      <div className={styles.powerLabel}>
        <span className={styles.powerName}>{label}</span>
        <span className={styles.powerLevel}>{clampedLevel}/10</span>
      </div>
      <div className={styles.powerTrack}>
        <div
          ref={fillRef}
          className={styles.powerFill}
          style={{
            backgroundColor: color,
            width: animate ? '0%' : `${percentage}%`,
          }}
        />
        {/* Segment markers */}
        {[...Array(9)].map((_, i) => (
          <div
            key={i}
            className={styles.powerSegment}
            style={{ left: `${(i + 1) * 10}%` }}
          />
        ))}
      </div>
    </div>
  );
};

export default PowerMeter;
