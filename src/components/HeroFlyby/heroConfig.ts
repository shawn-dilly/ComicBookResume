/**
 * heroConfig - every tunable number for the Iron Architect fly-by, in one place.
 *
 * Distances are CSS pixels, times are seconds. "Depth" is a random 0..1 per pass: 0 is far away (small, slow, faint,
 * washed out), 1 is near (larger, faster, solid).
 */
export const FLYBY = {
  /** Wait this long after the book is held before the first pass. */
  firstDelay: 1.6,
  /** Pause between two passes, picked at random from this range. */
  gap: [1.5, 5] as const,
  /** Duration of one pass: far passes take the long end, near passes the short end. */
  duration: { far: 12, near: 7.5, jitter: 0.12 },
  /** Length of the prone figure while crossing at the two ends of the depth range (the flames and trail hang outside it). */
  length: { far: 170, near: 320 },
  /** Height of the upright figure (the rise art) as a fraction of the crossing length: about equal visual mass. */
  uprightRatio: 0.86,
  /** Opacity and colour saturation at the two ends of the depth range. */
  opacity: { far: 0.82, near: 1 },
  saturate: { far: 0.8, near: 1 },

  /** Half the height of the prone figure as a fraction of his length, used to keep him on screen and out from behind the book. */
  halfExtent: 0.16,

  /**
   * Rise passes: he climbs upright from below the bottom edge beside the book, hovers, surges up and forward along a short
   * launch curve (the 45 degree art), levels out into the prone art and crosses. chance is the share of passes that rise
   * (the first pass after the book is held always does).
   */
  rise: {
    chance: 0.45,
    duration: [1.6, 2.4] as const,
    hover: [0.3, 0.6] as const,
    /** The climb art takes over from the hover art when the climb starts, and gives way to the prone art once the path is flatter than this (degrees). */
    levelAt: 23,
    /** The rise art gives way to the hover art once this fraction of the climb is done. */
    hoverAt: 0.85,
    /** Cross-fade between two poses, seconds. */
    fadeSeconds: 0.16,
    /** The launch curve: seconds, and the displacement as multiples of his head-to-boot length (forward, up), plus the start angle (degrees above level). */
    launch: { seconds: 0.95, forward: 1.7, up: 1.1, angle: 60 },
    /** The crossing after a rise is shorter than a full pass: this fraction of the pass duration. */
    crossShare: 0.75,
    /** Lane height range for the crossing that follows the launch, as a fraction of viewport height. */
    lane: { min: 0.22, max: 0.5 },
    /** Flame and trail length multiplier while rising and while crossing. */
    thrust: { rise: 1.3, hover: 1.1, climb: 1.1, cross: 0.8 },
  },

  /** Width (px) of the contact buttons at the right edge, and of the HIRE ME beacon above them; both cover the background. */
  sidebarInset: 140,

  /** Viewports at most this wide (px) get a smaller, calmer hero. */
  narrowMaxWidth: 900,
  narrowScale: 0.7,

  /** Lane (height of the path) as a fraction of viewport height, and the arc swing in figure heights. */
  lane: { min: 0.08, max: 0.92 },
  /** The path is lane + amplitude * sin(2 pi * (waves * p) + phase). waves 0.5 is an arc, 1 an S-curve. */
  waves: [0.5, 1, 1.5] as const,
  amplitude: { min: 0.1, max: 0.8 },
  /** Gentle bob in figure heights and its rate (Hz). */
  bob: { amplitude: 0.03, rate: 0.7 },
  /** How much of the path slope the body follows (0 = always level, 1 = nose on the tangent) and the hard cap (degrees). */
  bank: 0.5,
  maxTilt: 18,

  /**
   * Lane choice. A candidate path is tried at random. In "margin" mode (the chance below) it is accepted when almost none
   * of its on-screen samples sit behind the book, which means a lane in the margin above or below the open book. In
   * "behind" mode any lane is fine as long as he is not hidden the whole way, so he comes out of the side margins,
   * crosses behind the book and comes out again; that sells the depth. When no margin lane fits (a big book on a small
   * window), the best lane found is used instead.
   */
  marginChance: 0.5,
  maxHiddenMargin: 0.12,
  maxHiddenBehind: 0.85,
  /** Rise passes: the crossing after the rise may be hidden this much (the rise column itself is in view). */
  maxHiddenRise: 0.97,
  attempts: 40,
  /** Keep this clearance (px) between him and the hologram towers, in addition to his own size. */
  holoClearance: 24,
  /** Retry delay (s) when the hologram leaves no clear lane. */
  holoRetry: 1.2,

  /** About one pass in this many is a flourish (a climb-and-dive swoop). */
  flourishChance: 0.2,
  swoop: { height: 0.6, length: 0.32 },
  /** Off-screen margin on entry and exit, in figure heights (covers the trail). */
  offscreen: 1.15,

  /** Screenshot-only slow motion used when the page URL has ?flyby=slow. */
  slow: { timeScale: 5 },
  /** Test-only speed-up used when the page URL has ?flyby=fast. */
  fast: { timeScale: 0.2, firstDelay: 0.15, gap: [0.1, 0.3] as const },
} as const;
