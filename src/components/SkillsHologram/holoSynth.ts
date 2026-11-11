/**
 * holoSynth - the hologram's sounds, built from Web Audio nodes (no audio files).
 *
 * The builders only need a `BaseAudioContext`, so the same graph runs live (AudioContext) and offline
 * (OfflineAudioContext, used to check peak / RMS / duration without listening).
 *
 * Power-up (about 1.5 s):
 * - sub thump: a sine falling 92 -> 36 Hz with a fast attack and 0.3 s decay
 * - rising sweep: two slightly detuned sawtooth oscillators gliding 110 -> 1760 Hz through a resonant low-pass
 *   that opens 260 -> 6500 Hz, plus a sine an octave above for a clean top
 * - airy shimmer: filtered noise (band-pass gliding 5.5 -> 9 kHz) that blooms near the top and rings out
 * - ticks: very quiet short sine blips as each tower resolves
 * Power-down: a short descending triangle blip through a closing low-pass with a faint noise click.
 * Everything goes through one master gain and a compressor so the peak stays modest and never clips.
 */

import { HOLO } from './holoConfig';

export interface HoloOutput {
  /** Connect sources here. */
  input: GainNode;
}

/** Master gain (peak level) followed by a gentle compressor into the destination. */
export function createHoloOutput(ctx: BaseAudioContext): HoloOutput {
  const input = ctx.createGain();
  input.gain.value = HOLO.sound.peak;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.knee.value = 12;
  comp.ratio.value = 4;
  comp.attack.value = 0.004;
  comp.release.value = 0.15;
  input.connect(comp);
  comp.connect(ctx.destination);
  return { input };
}

function noiseBuffer(ctx: BaseAudioContext, seconds: number): AudioBuffer {
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  // Deterministic noise so renders are repeatable.
  let a = 0x9e3779b9;
  for (let i = 0; i < length; i++) {
    a = (Math.imul(a, 1664525) + 1013904223) >>> 0;
    data[i] = (a / 4294967296) * 2 - 1;
  }
  return buffer;
}

/** Schedule the power-up starting at `t0`. `tickTimes` are seconds after t0 (tower resolve moments). */
export function buildPowerUp(ctx: BaseAudioContext, out: HoloOutput, t0: number, tickTimes: readonly number[]): void {
  const dur = HOLO.sound.duration;

  // Sub thump.
  const thump = ctx.createOscillator();
  const thumpGain = ctx.createGain();
  thump.type = 'sine';
  thump.frequency.setValueAtTime(92, t0);
  thump.frequency.exponentialRampToValueAtTime(36, t0 + 0.3);
  thumpGain.gain.setValueAtTime(0.0001, t0);
  thumpGain.gain.linearRampToValueAtTime(0.9, t0 + 0.012);
  thumpGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.34);
  thump.connect(thumpGain).connect(out.input);
  thump.start(t0);
  thump.stop(t0 + 0.4);

  // Rising filtered sweep.
  const sweepFilter = ctx.createBiquadFilter();
  sweepFilter.type = 'lowpass';
  sweepFilter.Q.value = 5;
  sweepFilter.frequency.setValueAtTime(260, t0);
  sweepFilter.frequency.exponentialRampToValueAtTime(6500, t0 + dur * 0.78);
  const sweepGain = ctx.createGain();
  sweepGain.gain.setValueAtTime(0.0001, t0);
  sweepGain.gain.linearRampToValueAtTime(0.32, t0 + 0.35);
  sweepGain.gain.linearRampToValueAtTime(0.4, t0 + dur * 0.7);
  sweepGain.gain.exponentialRampToValueAtTime(0.0008, t0 + dur * 0.92);
  sweepFilter.connect(sweepGain).connect(out.input);
  for (const detune of [-9, 9]) {
    const saw = ctx.createOscillator();
    saw.type = 'sawtooth';
    saw.detune.value = detune;
    saw.frequency.setValueAtTime(110, t0);
    saw.frequency.exponentialRampToValueAtTime(1760, t0 + dur * 0.78);
    const g = ctx.createGain();
    g.gain.value = 0.5;
    saw.connect(g).connect(sweepFilter);
    saw.start(t0);
    saw.stop(t0 + dur);
  }
  const top = ctx.createOscillator();
  const topGain = ctx.createGain();
  top.type = 'sine';
  top.frequency.setValueAtTime(220, t0);
  top.frequency.exponentialRampToValueAtTime(3520, t0 + dur * 0.78);
  topGain.gain.setValueAtTime(0.0001, t0);
  topGain.gain.linearRampToValueAtTime(0.14, t0 + dur * 0.6);
  topGain.gain.exponentialRampToValueAtTime(0.0008, t0 + dur * 0.9);
  top.connect(topGain).connect(out.input);
  top.start(t0);
  top.stop(t0 + dur);

  // Airy shimmer tail.
  const air = ctx.createBufferSource();
  air.buffer = noiseBuffer(ctx, dur + 0.1);
  const airFilter = ctx.createBiquadFilter();
  airFilter.type = 'bandpass';
  airFilter.Q.value = 3.5;
  airFilter.frequency.setValueAtTime(5500, t0);
  airFilter.frequency.exponentialRampToValueAtTime(9000, t0 + dur);
  const airGain = ctx.createGain();
  airGain.gain.setValueAtTime(0.0001, t0);
  airGain.gain.linearRampToValueAtTime(0.05, t0 + dur * 0.35);
  airGain.gain.linearRampToValueAtTime(0.22, t0 + dur * 0.66);
  airGain.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
  air.connect(airFilter).connect(airGain).connect(out.input);
  air.start(t0);
  air.stop(t0 + dur + 0.05);

  // Quiet ticks as the towers resolve, climbing a little in pitch.
  const ticks = [...tickTimes].sort((a, b) => a - b);
  const pitchStep = 1100 / Math.max(1, ticks.length - 1);
  ticks.forEach((time, i) => {
    const at = t0 + time;
    if (at + 0.04 > t0 + dur) return;
    const tick = ctx.createOscillator();
    const g = ctx.createGain();
    tick.type = 'sine';
    tick.frequency.value = 1400 + i * pitchStep;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.linearRampToValueAtTime(HOLO.sound.tickGain, at + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0005, at + 0.035);
    tick.connect(g).connect(out.input);
    tick.start(at);
    tick.stop(at + 0.045);
  });
}

/** Schedule the short descending power-down blip starting at `t0`. */
export function buildPowerDown(ctx: BaseAudioContext, out: HoloOutput, t0: number): void {
  const dur = HOLO.sound.downDuration;
  const blip = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const g = ctx.createGain();
  blip.type = 'triangle';
  blip.frequency.setValueAtTime(980, t0);
  blip.frequency.exponentialRampToValueAtTime(170, t0 + dur);
  filter.type = 'lowpass';
  filter.Q.value = 3;
  filter.frequency.setValueAtTime(5000, t0);
  filter.frequency.exponentialRampToValueAtTime(400, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(0.9, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
  blip.connect(filter).connect(g).connect(out.input);
  blip.start(t0);
  blip.stop(t0 + dur + 0.02);

  const click = ctx.createBufferSource();
  click.buffer = noiseBuffer(ctx, 0.03);
  const cg = ctx.createGain();
  cg.gain.setValueAtTime(0.12, t0);
  cg.gain.exponentialRampToValueAtTime(0.0005, t0 + 0.025);
  click.connect(cg).connect(out.input);
  click.start(t0);
}
