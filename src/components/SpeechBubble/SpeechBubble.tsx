import { memo, useRef, useEffect, type ReactNode } from 'react';
import { gsap } from 'gsap';
import type { BubbleVariant, TailDirection } from '../../types';
import styles from './SpeechBubble.module.css';

interface SpeechBubbleProps {
  children: ReactNode;
  variant?: BubbleVariant;
  tailDirection?: TailDirection;
  className?: string;
  animate?: boolean;
  animationDelay?: number;
  maxWidth?: string;
}

const SpeechBubble = ({
  children,
  variant = 'speech',
  tailDirection = 'bottom-left',
  className = '',
  animate = true,
  animationDelay = 0,
  maxWidth = '280px',
}: SpeechBubbleProps) => {
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (animate && bubbleRef.current) {
      const tween = gsap.fromTo(
        bubbleRef.current,
        {
          opacity: 0,
          scale: 0.8,
          y: 10,
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.3,
          delay: animationDelay,
          ease: 'back.out(1.5)',
        }
      );
      return () => { tween.kill(); };
    }
  }, [animate, animationDelay]);

  const textClass =
    variant === 'thought'
      ? 'thought-text'
      : variant === 'shout'
      ? 'shout-text'
      : 'speech-text';

  return (
    <div
      ref={bubbleRef}
      className={`${styles.bubble} ${styles[variant]} ${styles[tailDirection]} ${className}`}
      style={{ maxWidth }}
    >
      <div className={`${styles.content} ${textClass}`}>{children}</div>
    </div>
  );
};

export default memo(SpeechBubble);
