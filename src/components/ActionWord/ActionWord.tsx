import { memo, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import type { ActionWordType } from '../../types';
import styles from './ActionWord.module.css';

interface ActionWordProps {
  word?: ActionWordType | string;
  color?: string;
  outlineColor?: string;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  animate?: boolean;
  animationDelay?: number;
  showBurst?: boolean;
  rotation?: number;
  onAnimationComplete?: () => void;
}

const colorMap: Record<string, { fill: string; stroke: string }> = {
  pow: { fill: '#FFF200', stroke: '#ED1C24' },
  bam: { fill: '#ED1C24', stroke: '#FFF200' },
  zap: { fill: '#0072BC', stroke: '#FFF200' },
  wham: { fill: '#F7941D', stroke: '#231F20' },
  boom: { fill: '#ED1C24', stroke: '#F7941D' },
  crack: { fill: '#8DC63F', stroke: '#231F20' },
  slam: { fill: '#662D91', stroke: '#FFF200' },
  kapow: { fill: '#EC008C', stroke: '#FFF200' },
};

const ActionWord = ({
  word = 'POW',
  color,
  outlineColor,
  className = '',
  size = 'medium',
  animate = true,
  animationDelay = 0,
  showBurst = true,
  rotation = -5,
  onAnimationComplete,
}: ActionWordProps) => {
  const wordRef = useRef<HTMLDivElement>(null);
  const normalizedWord = word.toLowerCase();
  const colors = colorMap[normalizedWord] || { fill: '#FFF200', stroke: '#231F20' };

  const fillColor = color || colors.fill;
  const strokeColor = outlineColor || colors.stroke;

  useEffect(() => {
    if (animate && wordRef.current) {
      const tl = gsap.timeline({
        onComplete: onAnimationComplete,
      });

      tl.fromTo(
        wordRef.current,
        {
          opacity: 0,
          scale: 0,
          rotation: rotation - 20,
        },
        {
          opacity: 1,
          scale: 1,
          rotation: rotation,
          duration: 0.4,
          delay: animationDelay,
          ease: 'elastic.out(1, 0.5)',
        }
      );

      // Subtle bounce after entrance
      tl.to(wordRef.current, {
        scale: 1.05,
        duration: 0.1,
        ease: 'power1.inOut',
        yoyo: true,
        repeat: 1,
      });

      return () => { tl.kill(); };
    }
  }, [animate, animationDelay, rotation, onAnimationComplete]);

  return (
    <div
      ref={wordRef}
      className={`${styles.actionWord} ${styles[size]} ${className}`}
      style={
        {
          '--action-fill': fillColor,
          '--action-stroke': strokeColor,
          transform: `rotate(${rotation}deg)`,
        } as React.CSSProperties
      }
    >
      {showBurst && <div className={styles.burst} />}
      <span className={styles.text}>{word.toUpperCase()}</span>
    </div>
  );
};

export default memo(ActionWord);
