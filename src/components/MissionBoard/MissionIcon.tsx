import type { MissionId } from '../../data/hireMe';

const INK = '#231F20';

/** MissionIcon - the three mission pictograms, drawn in fixed print colours. */
export default function MissionIcon({ id, className }: { id: MissionId; className?: string }) {
  if (id === 'assess') {
    return (
      <svg className={className} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <rect x="6" y="26" width="7" height="14" fill="#0072BC" stroke={INK} strokeWidth="2.5" />
        <rect x="16" y="18" width="7" height="22" fill="#ED1C24" stroke={INK} strokeWidth="2.5" />
        <circle cx="29" cy="19" r="10" fill="rgba(255,255,255,.8)" stroke={INK} strokeWidth="4" />
        <path d="M36 26 L44 35" stroke={INK} strokeWidth="6" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === 'project') {
    return (
      <svg className={className} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <circle cx="24" cy="24" r="15" fill="none" stroke={INK} strokeWidth="9" strokeDasharray="5.9 5.9" />
        <circle cx="24" cy="24" r="13" fill="#FFF200" stroke={INK} strokeWidth="3.5" />
        <circle cx="24" cy="24" r="4.5" fill="#fff" stroke={INK} strokeWidth="2.5" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path d="M6 8 H42 V32 H28 L20 42 V32 H6 Z" fill="#fff" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
      <text
        x="24"
        y="28"
        textAnchor="middle"
        fontFamily="Bangers, Impact, sans-serif"
        fontSize="25"
        fill="#ED1C24"
        stroke={INK}
        strokeWidth="1.2"
        paintOrder="stroke"
      >
        ?
      </text>
    </svg>
  );
}
