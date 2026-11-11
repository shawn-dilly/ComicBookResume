/**
 * mobileConfig - every tunable number for the phone reader, in one place.
 *
 * Durations are milliseconds unless the name says seconds. Angles are degrees. Fractions are of the reader
 * width unless noted.
 */

export const READER = {
  /** Page turn tween (button / key / flick release), ms. */
  turnMs: 640,
  /** Minimum settle tween after a drag released short of the commit point, ms. */
  settleMinMs: 160,
  /** Full-width settle tween, ms (scaled by the distance left to travel). */
  settleMs: 560,
  /** Perspective of the single-page turn (px) and where the vanishing point sits (x, y %). */
  perspective: 1700,
  perspectiveOrigin: '30% 50%',
  /** Darkest page shade during a turn (0-1) and the shade on the page underneath. */
  turnShade: 0.55,
  underShade: 0.45,
} as const;

export const GESTURE = {
  /** Finger travel (px) before a gesture picks a direction. */
  slop: 9,
  /** A gesture within this angle of horizontal (degrees) is a page drag; steeper hands over to scrolling. */
  horizontalAngle: 34,
  /** Drag distance (fraction of the width) that commits a turn on release. */
  commitFraction: 0.22,
  /** Release speed (px/ms) that commits a turn however short the drag. */
  flickVelocity: 0.45,
  /** A drag counts as covering the page after this fraction of the width. */
  dragReach: 0.9,
  /** Rubber band at the first and last page: max pull (px) and how much of the drag is shown. */
  rubberMax: 26,
  rubberRatio: 0.22,
  rubberReturnMs: 260,
  /** A touch shorter than this (ms) and smaller than `slop` is a tap. */
  tapMaxMs: 600,
  /** Tap zones: right of this fraction turns forward, left of `1 - ` it turns back. */
  tapForward: 0.74,
  tapBack: 0.26,
  /** On the origin story the edge zones are wider: below this fraction goes back, the rest forward. */
  originTapBack: 0.3,
} as const;

export const ORIGIN = {
  /** Panel change: slide and fade, ms. */
  changeMs: 380,
  /** Mount this many panels either side of the current one (images load lazily). */
  mountRadius: 1,
  /** Slow zoom (Ken Burns) length, seconds. */
  zoomSeconds: 9,
} as const;

export const ALLIES = {
  /** Quotes longer than this many characters are clamped with a Read more button. */
  clampChars: 260,
  clampLines: 6,
} as const;

export const BATTLES = {
  /** Achievements shown before the Show more button. */
  grodivo: 3,
  peopleReady: 4,
  early: 3,
  /** Ezlinks: highlights shown per role before the Show more button. */
  ezlinksPerRole: 2,
} as const;

/** Powers category tabs: the scroll hint (edge fades and chevrons) and the one-time nudge. */
export const TABS = {
  /** Width of the edge fade and of the chevron button (px). */
  fade: 40,
  /** The strip is at an end when within this many px of it. */
  endSlop: 2,
  /** First arrival at the page: the strip slides this far (px) and back, once. */
  nudge: 46,
  nudgeDelayMs: 900,
  nudgeBackMs: 520,
} as const;

/**
 * The hologram: a tilted floor with one solid tower per skill. Pixel sizes are in the scene's own box, which is
 * `designW` wide and at least `designH` tall; the whole scene is scaled to the screen (see HoloStage). When the
 * screen is taller than the scene, the towers and the floor grow with `tallness` instead of leaving a blank band.
 */
export const HOLO = {
  designW: 340,
  designH: 440,
  /** The flat card's height in the scene box (the floor box). */
  floorH: 372,
  /** rotateX of the floor, degrees. */
  tilt: 58,
  perspective: 1100,
  towerWidth: 46,
  towerHeight: 190,
  /** Distance between towers (px). Label plates are wider than this; neighbours sit on different rows. */
  towerPitch: 78,
  /** Tower x positions in pitches, and y offsets (px) of the floor zone. */
  towerX: [-1.5, -0.5, 0.5, 1.5],
  towerY: [34, -26, -26, 34],
  /** Label plates: width (px), the lift of the low and the high row above the tower tops (px). */
  plateWidth: 76,
  labelLift: [8, 70],
  /** Label name font size (px): fitted so the longest word fits the plate, within these limits. */
  labelFont: { min: 8.5, max: 11.5, charWidth: 0.68 },
  /** Towers are drawn this much lighter than the skill colour (0-1). */
  lighten: 0.3,
  /** Orbit drag: degrees of yaw per px, and the limit either way. */
  yawPerPx: 0.45,
  yawMax: 48,
  /** A tap is a drag under this many px. */
  tapSlop: 6,
  /** Floor scale while projecting. */
  scaleOn: 0.86,
  /** Floor-to-towers y of the flat card (design px). */
  yOff: 186,
  /** The projected floor is deeper than the towers' stretch by this much (it fills the space the towers leave below). */
  floorBoost: 1.3,
  /**
   * How tall the projection draws in the scene box, measured from the world origin, as a function of the tower stretch t:
   * above the origin (tallest label top) `up0 + up1 * t`, below it (floor's near edge) `dn0 + dn1 * t + dn2 * t * t`.
   * The floor's near edge is wider than the scene by `span0 + span1 * t` (perspective), which the width has to allow for.
   * Fitted to the rendered scene; the stage picks the stretch that makes the whole thing fill its height.
   */
  fit: { up0: 117, up1: 150, dn0: 11.9, dn1: 71.2, dn2: 78.9, span0: 0.82, span1: 0.2 },
  /** Space kept above the tallest label and below the floor (design px). */
  padTop: 6,
  padBottom: 10,
  /** How far the stage reaches past the page's side padding (px each side). */
  bleed: 10,
  /** Space left at each side of the stage (px). */
  sideMargin: 10,
  /** Room kept below the stage for the button (px). */
  bottomReserve: 112,
  /** The flat card's largest scale. */
  maxFlatScale: 1.12,
  /** How far the towers and floor may stretch on a tall screen, and squash on a short one (1 = design size). */
  maxTallness: 1.6,
  minTallness: 0.6,
  /** Timings (seconds). */
  tiltIn: 0.7,
  tiltOut: 0.5,
  riseDuration: 0.62,
  riseStagger: 0.12,
  labelDelay: 0.34,
  labelFade: 0.3,
  swapOut: 0.2,
  swapGapMs: 230,
} as const;

export const LAYOUT = {
  /** Height of the bottom bar (px) before the safe-area inset. */
  barHeight: 60,
  /** The SCROLL hint appears when more than this many px are hidden below. */
  moreThreshold: 40,
} as const;
