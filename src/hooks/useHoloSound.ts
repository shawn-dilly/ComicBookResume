import { useCallback, useEffect, useRef } from 'react';
import { buildPowerDown, buildPowerUp, createHoloOutput, type HoloOutput } from '../components/SkillsHologram/holoSynth';

export interface HoloSound {
  /** Play the power-up; `tickTimes` are seconds after now at which towers resolve. */
  playPowerUp: (tickTimes: readonly number[]) => void;
  playPowerDown: () => void;
}

/**
 * Sounds for the Powers & Abilities hologram, synthesised with Web Audio (see holoSynth.ts).
 * Follows the pattern of useSoundEffects: the AudioContext is created on the first click or key press,
 * and `enabled` switches it all off. useSoundEffects keeps its context private, so this hook owns a second
 * one. If the browser still has it suspended (no user gesture yet) it fails silently.
 */
export default function useHoloSound(enabled: boolean = true): HoloSound {
  const ctxRef = useRef<AudioContext | null>(null);
  const outRef = useRef<HoloOutput | null>(null);

  const ensure = useCallback((): AudioContext | null => {
    if (ctxRef.current) return ctxRef.current;
    try {
      const Ctor =
        window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctxRef.current = new Ctor();
      outRef.current = createHoloOutput(ctxRef.current);
    } catch {
      // Web Audio unavailable: the hologram is simply silent.
    }
    return ctxRef.current;
  }, []);

  useEffect(() => {
    const init = (): void => {
      ensure();
    };
    document.addEventListener('click', init, { once: true });
    document.addEventListener('keydown', init, { once: true });
    return () => {
      document.removeEventListener('click', init);
      document.removeEventListener('keydown', init);
    };
  }, [ensure]);

  const run = useCallback(
    (build: (ctx: AudioContext, out: HoloOutput) => void) => {
      if (!enabled) return;
      const ctx = ensure();
      const out = outRef.current;
      if (!ctx || !out) return;
      const go = (): void => {
        if (ctx.state === 'running') build(ctx, out);
      };
      if (ctx.state === 'suspended') void ctx.resume().then(go, () => undefined);
      else go();
    },
    [enabled, ensure]
  );

  const playPowerUp = useCallback(
    (tickTimes: readonly number[]) => run((ctx, out) => buildPowerUp(ctx, out, ctx.currentTime + 0.02, tickTimes)),
    [run]
  );
  const playPowerDown = useCallback(() => run((ctx, out) => buildPowerDown(ctx, out, ctx.currentTime + 0.01)), [run]);

  return { playPowerUp, playPowerDown };
}
