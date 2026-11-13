import { useEffect, useState } from 'react';
import { BEACON_PROMPTS } from '../../data/hireMe';

const FAST_MS = 3200;
// With reduced motion the bubble text still changes, but slowly and without any entrance animation.
const SLOW_MS = 9000;

/** usePrompt - the beacon's current prompt, cycling through the three prompts. */
export function usePrompt(): { text: string; index: number } {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const ms = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? SLOW_MS : FAST_MS;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % BEACON_PROMPTS.length), ms);
    return () => window.clearInterval(id);
  }, []);
  return { text: BEACON_PROMPTS[index], index };
}
