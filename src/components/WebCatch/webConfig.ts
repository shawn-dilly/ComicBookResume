/**
 * webConfig - every tunable number for the web catch effect, in one place.
 *
 * UNITS
 * - "unit" distances are measured in half page widths, exactly like the world
 *   units of the approved prototype (page width = 2 units, page height = 3
 *   units). One unit is `pageWidth / 2` CSS pixels, so the whole effect scales
 *   with the book. Time is in seconds.
 * - World space for the physics is y-UP with its origin at the rest centre of
 *   the visible book. Screen space (y-down) conversion happens only when
 *   drawing or writing the hanger transform.
 * - Anything labelled "px" is a screen size in CSS pixels and does not scale.
 */

/** Physics of the hanging book (prototype values, world units). */
export const PHYSICS = {
  /** Rope stiffness: force per unit of stretch. Ropes only ever pull. */
  ropeStiffness: 130,
  /** Book mass. */
  mass: 1,
  /** Rotational inertia of the book. */
  inertia: 1.1,
  /** Gravity pulling the book down (units / s^2 per unit mass). */
  gravity: 3.2,
  /** Sub-steps per frame; the ropes are stiff, so keep this at 4 or more. */
  substeps: 4,
  /** Longest frame time the physics will integrate (seconds). */
  maxFrameTime: 1 / 20,
  /** Linear velocity damping while ropes hold the book (per second). */
  heldLinearDamping: 3.2,
  /** Angular velocity damping while ropes hold the book (per second). */
  heldAngularDamping: 4,
  /** While falling freely: horizontal air drag, vertical air drag, angular drag. */
  fallDrag: { x: 1, y: 1.1, angular: 0.8 },
  /** While falling freely: gentle gust forces [horizontal, torque] and their rates (rad/s). */
  fallGust: { force: 1.2, forceRate: 2.2, torque: 0.9, torqueRate: 1.7 },
  /**
   * Idle gust on the held book (horizontal force, torque). The prototype used
   * 0.3 / 0.1. They are off here so the held book is perfectly still (crisp
   * text, and the loop can go fully idle). Raise to bring back a faint sway.
   */
  heldGust: { force: 0, torque: 0 },
  /** Bottom ropes are cut this much longer than the geometry, so they droop. */
  slackRopeFactor: 1.04,
  /** Never let a taut rope's rest length drop below this fraction of its span. */
  minRestFraction: 0.5,
  /** Tolerances under which a held book counts as at rest. */
  rest: { position: 0.002, velocity: 0.002, angle: 0.0004, angularVelocity: 0.004, amplitude: 0.002 },
} as const;

/** The drop and the catch. */
export const INTRO = {
  /** Seconds each line takes to reach the book. */
  shot: 0.3,
  /** Pause between a line attaching and its corner web starting to grow. */
  hold: 0.14,
  /** Seconds between corners firing (TL, TR, BR, BL). */
  stagger: 0.15,
  /** Lines fire when the book is this far above its rest position (units). */
  triggerHeight: 0.9,
  /** The book starts this far above the top of the viewport (units, measured to the book's centre minus half its height). */
  startClearance: 0.55,
  /** Initial sideways offset (units), tilt (radians) and velocities. */
  start: { x: -0.5, angle: 0.5, vx: 0.3, vy: -2.5, va: -0.5 },
  /** Seconds after the last line attaches before the book counts as `held`. */
  settleDelay: 0.15,
  /** Rate (per second) at which the 3D tumble fades once a line holds the book (it is also zeroed when `held` starts). */
  tumbleFade: 8,
  /** 3D tumble while falling: amplitude (radians) and rate (rad/s) about X and Y. */
  tumbleX: { amplitude: 0.55, rate: 1.9 },
  tumbleY: { amplitude: 0.7, rate: 1.3, phase: 1 },
  /** sessionStorage key marking that the drop already played this session. */
  sessionKey: 'resume-web-catch-played',
} as const;

/** Where the ropes are tied. */
export const ANCHORS = {
  /** Anchors sit this fraction of half the viewport beyond the screen corners. */
  overshoot: 0.04,
  /**
   * Corner order for firing and for the webs: TL, TR, BR, BL.
   * `sx`/`sy` are the signs of the corner in world space (y up).
   */
  corners: [
    { name: 'topLeft', sx: -1, sy: 1 },
    { name: 'topRight', sx: 1, sy: 1 },
    { name: 'bottomRight', sx: 1, sy: -1 },
    { name: 'bottomLeft', sx: -1, sy: -1 },
  ],
  /**
   * Where web hubs sit on the book corner, as a fraction of the half extents.
   * [1, 1] is the book corner itself (the wrapped look).
   */
  hub: [1, 1],
} as const;

/**
 * One corner web per book corner, each with its own size and shape (TL, TR, BR, BL).
 * - `outer`: how far the web reaches along both book edges from the corner (units). The two edge
 *   spokes end exactly there; this is the on-page footprint.
 * - `hubOut`: how far the hub sits out on the line from the book corner, toward the screen anchor (units).
 * - `rings`: number of rings between the hub and the outer outline.
 * - `wrapSpokes`: interior spokes between the two edge spokes.
 * - `seed`: fixes the interior spokes' jitter/overshoot and the ring spacing, so webs look the same every visit.
 */
export const WEB_SHAPES = [
  { seed: 1, wrapSpokes: 4, outer: 0.6102, hubOut: 0.46, rings: 7 },
  { seed: 2, wrapSpokes: 2, outer: 0.3546, hubOut: 0.27, rings: 5 },
  { seed: 3, wrapSpokes: 3, outer: 0.4418, hubOut: 0.33, rings: 6 },
  { seed: 4, wrapSpokes: 3, outer: 0.379, hubOut: 0.28, rings: 6 },
] as const;

/** Line (rope) drawing. */
export const LINE = {
  /** Straight-line segments per rope. */
  segments: 16,
  /** Ease power for the shot travelling to the book. */
  shotPower: 1.4,
  /** Droop of a slack rope: fraction of the slack length, and its cap (units). */
  droop: { factor: 0.42, max: 0.5 },
  /** Vibration right after attaching / on a twang: amplitude (units) and decay rate (per second). */
  attachAmplitude: 0.09,
  twangAmplitude: 0.08,
  amplitudeDecay: 3,
  /** Vibration frequency (rad/s). */
  vibrationRate: 40,
} as const;

/**
 * Stroke widths in CSS pixels. They do not scale with the page, so the strands
 * stay fine at every size. Each kind of strand multiplies the base width.
 */
export const STROKE = {
  /** Visible strand width (px). */
  strandPx: 1.4,
  /** Darker outline stroke under every strand (px). Colours come from the CSS variables on both canvases. */
  haloPx: 4.5,
  /** Width multipliers per kind of strand. */
  weight: { line: 1, spoke: 0.8, ring: 0.7 },
  /** A line the pointer is over in `?webs=cut` mode. */
  hoverWeight: 1.7,
} as const;

/**
 * The corner webs. Each web's hub sits out on the line, a little before the book corner, and fans
 * toward the book: part of it hangs outside the book (drawn behind it), part overlaps the page
 * corner (drawn again in front, clipped to the page). It starts growing right after the line
 * attaches (and the short HOLD beat). Not shown on phone-sized screens.
 */
export const WRAP = {
  /** Seconds for the spokes to extend (back-out ease) and the overshoot of that ease. */
  growDuration: 0.45,
  backOvershoot: 1.70158,
  /** Rate (per second) the on-page part collapses while a page turns, and regrows after. */
  releaseRate: 16,
  restoreRate: 6,
  /** Wrap amount at which the spokes are fully extended (below it they are partly out). */
  spokesFullAt: 0.5,
  /** First-time weave: rings start this long after the spokes, then every ring is this much later (hub outward). */
  ringDelay: 0.3,
  ringStagger: 0.07,
  ringDuration: 0.5,
  /** Regrow after a turn (and shrink on a cut): ring k is woven once the amount passes `from + k * step`, over `span`. */
  regrow: { from: 0.3, step: 0.04, span: 0.3 },
  /** Quick regrow after a re-attach (page turn): same meanings as the four fields above. */
  quick: { growDuration: 0.25, ringDelay: 0.1, ringStagger: 0.035, ringDuration: 0.22 },
  /** Interior spokes: angular jitter (radians) and how far past the outer outline they may run (fraction). */
  jitter: 0.08,
  overshoot: 0.05,
  /** The innermost ring sits this fraction of the way from the hub to the outer outline; the outermost is 1. */
  ringFrom: 0.25,
  /** Seeded wobble of the ring spacing (fraction of the way along a spoke). */
  ringJitter: 0.025,
  /** Ring sag toward the hub, as a fraction of the span. */
  ringSag: 0.16,
  /** Curve segments per ring section. */
  ringSteps: 4,
  /** Below this extent nothing is drawn. */
  minVisible: 0.03,
} as const;

/**
 * Page-turn choreography: when a page starts to turn, the two corners on the side it leaves let go
 * (web folds into its hub, the line end snaps off the corner and recoils toward its screen anchor).
 * When the page lands they re-attach one after the other: the line shoots back, hits, and the web
 * regrows with the quick timings in WRAP.quick. The book stays supported meanwhile (the ropes still
 * carry it); only a small sag and tilt shows.
 */
export const RELEASE = {
  /** Seconds the web takes to fold up into its hub. */
  fold: 0.14,
  /** Seconds the line end takes to snap back, and how springy it is (overshoot of the back-out ease). */
  retract: 0.22,
  whip: 1.2,
  /** Fraction of the line (from the screen anchor) that stays hanging after the snap; 0 retracts it fully. */
  recoil: 0.18,
  /** Line vibration at the snap and at the hit (units). */
  whipAmplitude: 0.1,
  hitAmplitude: 0.06,
  /** Seconds the line takes to shoot back to the corner. */
  shot: 0.16,
  /** Seconds after landing before the top corner shoots, and extra delay for the bottom corner. */
  topDelay: 0,
  bottomDelay: 0.15,
  /** Delay between corners (TL, TR, BR, BL) when all four shoot back after hologram mode. */
  allStagger: 0.1,
  /** Pause between the hit and the web starting to regrow. */
  hold: 0.03,
  /** Book reaction when a corner pair lets go: downward speed (units / s) and tilt (rad / s) toward the released side. */
  sag: { velocity: 0.04, tilt: 0.02 },
  /** Small pull when a line hits again, mirror of the release: tilt back (rad / s) and upward speed. */
  hit: { velocity: 0.015, tilt: 0.008 },
} as const;

/** The book reacts when a page lands (small, settles in about a second). */
export const DIP = {
  /** Downward kick (units / s) and tilt kick (rad / s, sign follows the turn direction). */
  velocity: 0.12,
  tilt: 0.05,
  /** Line vibration amplitude. */
  amplitude: 0.08,
} as const;

/** Pulling the book with the pointer. */
export const DRAG = {
  /** Spring pulling the grabbed point toward the pointer. */
  stiffness: 150,
  /** Damping while grabbed (per second). */
  damping: 9,
  /** Line vibration amplitude on release. */
  releaseAmplitude: 0.1,
  /** Ignore the click that follows a drag for this long (ms). */
  clickGuardMs: 150,
} as const;

/** Cutting and re-catching (only with the URL flag `?webs=cut`). */
export const CUT = {
  /** Pointer must be within this distance (units) of a line to grab it. */
  pickRadius: 0.2,
  /** Seconds a cut line takes to retract. */
  retractTime: 0.25,
  /** Vibration given to the remaining lines when one is cut. */
  neighbourAmplitude: 0.12,
  /** Most extra lines the visitor can add. */
  maxExtra: 8,
  /** A new line is cut to this fraction of its span so it pulls taut. */
  extraRestFraction: 0.96,
  /** The hub of a new line sits at this fraction of the way to the book's edge. */
  extraReach: 0.9,
  /** URL query parameter and value that switch the feature on. */
  flag: { name: 'webs', value: 'cut' },
} as const;

/** Thresholds. */
export const THRESHOLDS = {
  /** A press that moves further than this (px) is a pull, not a click. */
  dragPx: 6,
  /** Viewports at most this wide (px) count as phones: no drag, no wrap, smaller webs. */
  phoneMaxWidth: 600,
  /** Open-progress change that counts as "the cover is moving" while idle. */
  openEpsilon: 0.0005,
  /** A tumble smaller than this (radians) is not written to the transform. */
  tumbleEpsilon: 0.002,
} as const;

/** Names of the CSS variables the colours come from. */
export const COLOR_VARS = {
  strand: '--web-strand-color',
  halo: '--web-halo-color',
} as const;
