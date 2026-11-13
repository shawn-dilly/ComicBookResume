/**
 * MissionBoard - the two-step "choose your mission" dialog behind every hire-me entry point.
 *
 * Step 1 picks a mission (flip + POW burst), step 2 drafts the message: an editable subject and body, an optional
 * name/company, "Email Shawn" (a real mailto: link) and "Message on LinkedIn" (copies the message, then follows the
 * profile link in a new tab; LinkedIn cannot be pre-filled). Focus is trapped, Esc and the backdrop close it, focus
 * returns to the opener, and the app behind is inert while it is open. It is rendered into <body> in fixed print
 * colours (the board is printed paper in both themes) and loaded lazily by `useMissionBoard`.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { Burst } from '../Burst';
import { resumeData } from '../../data/resume';
import { BOARD_COPY, MISSIONS, draftMessage, type MissionId } from '../../data/hireMe';
import MissionIcon from './MissionIcon';
import styles from './MissionBoard.module.css';

interface MissionBoardProps {
  /** Missions already picked (the ad page coupon): opens straight at step 2. */
  initial: MissionId[];
  /** What had focus when the board was opened; it gets focus back on close. */
  opener?: Element | null;
  onClose: () => void;
}

const FOCUSABLE = 'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const BURSTS = ['#00AEEF', '#F7941D', '#EC008C'];
const reduced = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function MissionBoard({ initial, opener, onClose }: MissionBoardProps) {
  const [step, setStep] = useState<1 | 2>(initial.length ? 2 : 1);
  const [picked, setPicked] = useState<MissionId[]>(initial);
  const first = draftMessage(initial);
  const [subject, setSubject] = useState(initial.length ? first.subject : '');
  const [body, setBody] = useState(initial.length ? first.body : '');
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const powRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const busyRef = useRef(false);

  // Inert app behind, scroll lock, and focus back to the opener on close.
  useLayoutEffect(() => {
    const root = document.getElementById('root');
    if (root) root.inert = true;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      if (root) root.inert = false;
      document.body.style.overflow = prevOverflow;
      // After the commit: the opener (the beacon) is only made reachable again once the board is gone.
      if (opener instanceof HTMLElement) {
        requestAnimationFrame(() => {
          if (document.contains(opener)) opener.focus({ preventScroll: true });
        });
      }
    };
  }, [opener]);

  // Esc closes. Captured on the window so no other shortcut (hologram Escape, page keys) sees the key.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  // Entrance, and focus on the first thing to act on.
  useEffect(() => {
    const dlg = dialogRef.current;
    if (dlg && !reduced()) {
      gsap.fromTo(
        dlg,
        { y: 40, scale: 0.92, rotation: -2, opacity: 0 },
        { y: 0, scale: 1, rotation: 0, opacity: 1, duration: 0.4, ease: 'back.out(1.6)', clearProps: 'transform,opacity' }
      );
    }
    const target = initial.length ? bodyRef.current : cardsRef.current?.querySelector<HTMLElement>('button');
    target?.focus();
    return () => {
      if (dlg) gsap.killTweensOf(dlg);
    };
    // Only on mount: later focus moves are made where the step changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pick = useCallback((id: MissionId, card: HTMLElement) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setPicked([id]);
    const go = () => {
      busyRef.current = false;
      const d = draftMessage([id]);
      setSubject(d.subject);
      setBody(d.body);
      setStatus('');
      setStep(2);
      requestAnimationFrame(() => bodyRef.current?.focus());
    };
    if (reduced()) {
      go();
      return;
    }
    const pow = powRef.current;
    const host = pow?.parentElement;
    if (pow && host) {
      const r = card.getBoundingClientRect();
      const h = host.getBoundingClientRect();
      pow.style.left = `${r.left - h.left + r.width / 2}px`;
      pow.style.top = `${r.top - h.top + r.height / 2}px`;
    }
    const tl = gsap.timeline({ onComplete: go });
    tl.to(card, { rotationY: 360, scale: 1.07, duration: 0.45, ease: 'power2.inOut' }, 0);
    if (pow) {
      tl.fromTo(pow, { opacity: 1, scale: 0.1, rotation: -30 }, { scale: 1.15, rotation: 8, duration: 0.3, ease: 'back.out(2.2)' }, 0.12);
      tl.to(pow, { opacity: 0, scale: 1.4, duration: 0.22, ease: 'power1.in' }, 0.55);
    }
  }, []);

  const back = () => {
    setStep(1);
    setStatus('');
    requestAnimationFrame(() => {
      const cards = cardsRef.current;
      const card = cards?.querySelector<HTMLElement>('[aria-pressed="true"]') ?? cards?.querySelector<HTMLElement>('button');
      if (card) gsap.set(card, { clearProps: 'transform' });
      card?.focus();
    });
  };

  const message = body.replace(/\s+$/, '') + (name.trim() ? `\n\n${name.trim()}` : '');
  const mailto = `mailto:${resumeData.contact.email}?subject=${encodeURIComponent(subject.trim())}&body=${encodeURIComponent(message)}`;
  const shown = subject.trim() ? `Subject: ${subject.trim()}\n\n${message}` : message;

  const selectMessage = () => {
    bodyRef.current?.focus();
    bodyRef.current?.select();
  };

  /** Copies the message from a click handler (so the browser allows it); when refused, selects it for a manual copy. */
  const copyMessage = (): void => {
    const refused = () => {
      selectMessage();
      setStatus(BOARD_COPY.copyBlocked);
    };
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(shown).then(() => setStatus(BOARD_COPY.copied), refused);
        return;
      }
    } catch {
      /* falls through to the refused path */
    }
    refused();
  };

  const onKeyDown = (e: ReactKeyboardEvent) => {
    // Nothing typed in the dialog reaches a site shortcut.
    e.stopPropagation();
    if (e.key !== 'Tab') return;
    const items = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter((el) => el.offsetParent !== null);
    if (!items.length) return;
    const firstEl = items[0];
    const lastEl = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === firstEl || active === dialogRef.current)) {
      e.preventDefault();
      lastEl.focus();
    } else if (!e.shiftKey && active === lastEl) {
      e.preventDefault();
      firstEl.focus();
    }
  };

  return createPortal(
    <div
      className={styles.overlay}
      data-mission-board=""
      data-board-step={step}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={styles.board}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mission-board-title"
        tabIndex={-1}
        onKeyDown={onKeyDown}
      >
        <button type="button" className={styles.close} data-board-close="" aria-label="Close the Mission Board (Esc)" onClick={onClose}>
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
            <path d="M4 4 L18 18 M18 4 L4 18" stroke="#231F20" strokeWidth="5" strokeLinecap="round" />
          </svg>
        </button>
        <div className={styles.head}>
          <span className={styles.kicker}>{step === 1 ? BOARD_COPY.step1Kicker : BOARD_COPY.step2Kicker}</span>
          <h2 id="mission-board-title">{step === 1 ? BOARD_COPY.heading : BOARD_COPY.step2Heading}</h2>
        </div>
        <div className={styles.body}>
          {step === 1 ? (
            <section className={styles.step} aria-label="Choose a mission">
              <div ref={cardsRef} className={styles.cards}>
                {MISSIONS.map((m, i) => (
                  <button
                    key={m.id}
                    type="button"
                    className={styles.card}
                    data-mission-card={m.id}
                    aria-pressed={picked.includes(m.id)}
                    onClick={(e) => pick(m.id, e.currentTarget)}
                  >
                    <span className={styles.num} aria-hidden="true">
                      {i + 1}
                    </span>
                    <span className={styles.icon}>
                      <Burst className={styles.iconBurst} rays={10} outer={49} inner={37} jitter={0.08} fill={BURSTS[i]} />
                      <MissionIcon id={m.id} className={styles.ico} />
                    </span>
                    <h3>{m.title}</h3>
                    <p>{m.blurb}</p>
                    <span className={styles.go}>{BOARD_COPY.pick}</span>
                  </button>
                ))}
              </div>
              <div ref={powRef} className={styles.pow} aria-hidden="true">
                <Burst className={styles.powBurst} rays={12} outer={49} inner={30} jitter={0.2} fill="#FFF200" fill2="#F7941D" />
                <span>{BOARD_COPY.pow}</span>
              </div>
            </section>
          ) : (
            <section className={styles.step} aria-label="Your message" data-board-draft="">
              <div className={styles.chips}>
                {MISSIONS.filter((m) => picked.includes(m.id)).map((m) => (
                  <span key={m.id} className={styles.chip} data-board-chip={m.id}>
                    {m.title}
                  </span>
                ))}
                <span className={styles.tag}>{BOARD_COPY.draftTag}</span>
              </div>
              <label className={styles.field}>
                <span>{BOARD_COPY.subject}</span>
                <input data-board-subject="" type="text" value={subject} autoComplete="off" onChange={(e) => setSubject(e.target.value)} />
              </label>
              <label className={styles.field}>
                <span>{BOARD_COPY.message}</span>
                <textarea
                  ref={bodyRef}
                  data-board-body=""
                  rows={4}
                  value={body}
                  onChange={(e) => {
                    setBody(e.target.value);
                    setStatus('');
                  }}
                />
              </label>
              <label className={styles.field}>
                <span>{BOARD_COPY.nameCompany}</span>
                <input
                  data-board-name=""
                  type="text"
                  value={name}
                  autoComplete="off"
                  placeholder={BOARD_COPY.namePlaceholder}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <div className={styles.actions}>
                <a className={`${styles.btn} ${styles.red}`} data-board-email="" href={mailto}>
                  {BOARD_COPY.email}
                </a>
                <a
                  className={`${styles.btn} ${styles.blue}`}
                  data-board-linkedin=""
                  href={resumeData.contact.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={copyMessage}
                >
                  {BOARD_COPY.linkedin}
                </a>
                <button type="button" className={`${styles.btn} ${styles.yellow}`} data-board-copy="" onClick={copyMessage}>
                  {BOARD_COPY.copy}
                </button>
                <span className={styles.spacer} />
                <button type="button" className={`${styles.btn} ${styles.ghost}`} data-board-back="" onClick={back}>
                  {BOARD_COPY.back}
                </button>
              </div>
              <p className={styles.status} role="status" data-board-status="">
                {status}
              </p>
            </section>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
