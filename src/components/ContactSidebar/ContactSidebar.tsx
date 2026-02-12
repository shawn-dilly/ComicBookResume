import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { resumeData } from '../../data/resume';
import styles from './ContactSidebar.module.css';

const { contact } = resumeData;

export function ContactSidebar() {
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sidebarRef.current) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) return;

    const badges = sidebarRef.current.querySelectorAll('a');

    gsap.fromTo(
      badges,
      { x: 40, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: 0.5,
        stagger: 0.15,
        ease: 'back.out(1.5)',
        delay: 1,
      }
    );
  }, []);

  return (
    <div ref={sidebarRef} className={styles.sidebar}>
      {/* Email - Speech Bubble */}
      <a
        href={`mailto:${contact.email}`}
        className={`${styles.badge} ${styles.email}`}
        aria-label={`Email ${contact.email}`}
      >
        <span className={styles.badgeIcon}>@</span>
        <span className={styles.badgeLabel}>{contact.email}</span>
      </a>

      {/* Phone - Action Burst */}
      {contact.phone && (
        <a
          href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`}
          className={`${styles.badge} ${styles.phone}`}
          aria-label={`Call ${contact.phone}`}
        >
          <span className={styles.badgeIcon}>CALL!</span>
          <span className={styles.badgeLabel}>{contact.phone}</span>
        </a>
      )}

      {/* LinkedIn - Panel Badge */}
      {contact.linkedin && (
        <a
          href={contact.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className={`${styles.badge} ${styles.linkedin}`}
          aria-label="LinkedIn profile"
        >
          <span className={styles.badgeIcon}>in</span>
          <span className={styles.badgeLabel}>LinkedIn</span>
        </a>
      )}

      {/* GitHub - Terminal */}
      {contact.github && (
        <a
          href={contact.github}
          target="_blank"
          rel="noopener noreferrer"
          className={`${styles.badge} ${styles.github}`}
          aria-label="GitHub profile"
        >
          <span className={styles.badgeIcon}>$ GH</span>
          <span className={styles.badgeLabel}>GitHub</span>
        </a>
      )}
    </div>
  );
}
