/**
 * LoopDiagram - the agent loop: seven step nodes round an ellipse, a pulse travelling the loop, and a caption in the
 * middle that follows the node being hovered, focused or last clicked.
 *
 * Nodes are real buttons (Tab reaches them, Enter/Space select) marked `data-no-turn`: the flipbook's click zones hand
 * clicks and hover (`book-enter` / `book-leave` events) to them instead of turning the page.
 */

import { useEffect, useRef, useState } from 'react';
import type { CaseFileLoopNode } from '../../types';
import styles from './CaseFile.module.css';

interface LoopDiagramProps {
  nodes: CaseFileLoopNode[];
  hint: string;
  /** The pulse moves only while the page is on screen (and motion is allowed). */
  running: boolean;
}

// The diagram is 38em x 22em; the ellipse the nodes sit on has radii 14em x 8.8em.
const W = 380;
const H = 176;
const RX = 140;
const RY = 64;
const LOOP_SECONDS = 10;

const angle = (i: number, n: number): number => -Math.PI / 2 + (i * 2 * Math.PI) / n;

export default function LoopDiagram({ nodes, hint, running }: LoopDiagramProps) {
  const n = nodes.length;
  const [selected, setSelected] = useState(-1);
  const [hovered, setHovered] = useState(-1);
  const [nearRaw, setNear] = useState(-1);
  const near = running ? nearRaw : -1;
  const rootRef = useRef<HTMLDivElement>(null);
  const pulseRef = useRef<SVGGElement>(null);

  const shown = hovered > -1 ? hovered : selected;

  // Hover handed over by the book's click zones.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const cleanups: Array<() => void> = [];
    root.querySelectorAll<HTMLElement>('[data-loop-node]').forEach((el) => {
      const i = Number(el.dataset.loopNode);
      const enter = () => setHovered(i);
      const leave = () => setHovered((h) => (h === i ? -1 : h));
      el.addEventListener('book-enter', enter);
      el.addEventListener('book-leave', leave);
      cleanups.push(() => {
        el.removeEventListener('book-enter', enter);
        el.removeEventListener('book-leave', leave);
      });
    });
    return () => cleanups.forEach((fn) => fn());
  }, [n]);

  // The travelling pulse.
  useEffect(() => {
    const pulse = pulseRef.current;
    if (!pulse) return;
    const place = (t: number) => {
      const a = -Math.PI / 2 + t * 2 * Math.PI;
      pulse.setAttribute('transform', `translate(${(W / 2 + RX * Math.cos(a)).toFixed(1)} ${(H / 2 + RY * Math.sin(a)).toFixed(1)})`);
    };
    place(0.07);
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    let t = 0.07;
    let lastNear = -1;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      t = (t + Math.min(0.05, (now - last) / 1000) / LOOP_SECONDS) % 1;
      last = now;
      place(t);
      const d = Math.abs(t * n - Math.round(t * n));
      const next = d < 0.14 ? Math.round(t * n) % n : -1;
      if (next !== lastNear) {
        lastNear = next;
        setNear(next);
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [running, n]);

  return (
    <div ref={rootRef} className={styles.loop} data-loop-diagram="">
      <svg className={styles.loopArt} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false">
        <ellipse cx={W / 2} cy={H / 2} rx={RX} ry={RY} fill="none" stroke="var(--comic-black)" strokeWidth="4" strokeDasharray="2 8" strokeLinecap="round" />
        {nodes.map((node, i) => {
          const a = angle(i, n) + Math.PI / n;
          const x = W / 2 + RX * Math.cos(a);
          const y = H / 2 + RY * Math.sin(a);
          const deg = (Math.atan2(RY * Math.cos(a), -RX * Math.sin(a)) * 180) / Math.PI;
          return (
            <path
              key={node.label}
              d="M-7 -6 L7 0 L-7 6 Z"
              fill="#ED1C24"
              stroke="#231F20"
              strokeWidth="2.2"
              strokeLinejoin="round"
              transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${deg.toFixed(1)})`}
            />
          );
        })}
        <g ref={pulseRef}>
          <circle r="9" fill="#FFF200" stroke="#231F20" strokeWidth="2.5" />
          <circle r="3.4" fill="#ED1C24" />
        </g>
      </svg>
      {nodes.map((node, i) => {
        const a = angle(i, n);
        const style = { left: `${50 + (RX / W) * 100 * Math.cos(a)}%`, top: `${50 + (RY / H) * 100 * Math.sin(a)}%` };
        return (
          <button
            key={node.label}
            type="button"
            style={style}
            className={`${styles.node} ${shown === i ? styles.nodeOn : ''} ${near === i ? styles.nodePass : ''}`}
            data-no-turn=""
            data-loop-node={i}
            aria-label={`Step ${i + 1}: ${node.label}`}
            aria-pressed={selected === i}
            onPointerEnter={() => setHovered(i)}
            onPointerLeave={() => setHovered((h) => (h === i ? -1 : h))}
            onFocus={() => setHovered(i)}
            onBlur={() => setHovered((h) => (h === i ? -1 : h))}
            onClick={() => setSelected(i)}
          >
            <span className={styles.nodeNo}>{i + 1}</span>
            {node.label}
          </button>
        );
      })}
      <div className={styles.loopCap} role="status" data-loop-caption="">
        {shown > -1 ? (
          <>
            <b>{`${shown + 1}. ${nodes[shown].label.toUpperCase()}`}</b>
            {nodes[shown].caption}
          </>
        ) : (
          hint
        )}
      </div>
    </div>
  );
}
