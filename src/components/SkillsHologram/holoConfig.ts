/**
 * holoConfig - every tunable number for the Powers & Abilities hologram, in one place.
 *
 * The hologram is a set of CSS 3D elements that live next to the book inside the hanger, so it shares the
 * book's tilt. Lengths given as fractions are fractions of the page width (`pw`) or page height (`ph`) so
 * everything scales with the book. Durations are seconds. Angles are degrees.
 */

export const HOLO = {
  /** The spread that triggers the mode: `currentPage` value after a flip lands on Powers & Abilities. */
  triggerPage: 6,
  /** Viewports at most this wide (px) never show the hologram. */
  phoneMaxWidth: 600,

  /** The book lying down. */
  pose: {
    /** rotateX of the flat book (55-62 reads as a book on a table seen from above-front). */
    tilt: 58,
    /** Must equal the `.scene` perspective in ComicBookGSAP.module.css. */
    perspective: 2500,
    /** Seconds to lie down and to stand back up. */
    enterDuration: 0.65,
    exitDuration: 0.45,
    /** The flat book's near edge sits this far above the viewport bottom (px). */
    bottomMargin: 66,
    /** Keep this much room left and right of the flat spread (px). */
    sideMargin: 36,
    /** The flat spread takes at most this fraction of the viewport height. */
    maxHeight: 0.46,
    /** Never shrink the flat book below this scale. */
    minScale: 0.6,
  },

  /** Timeline of the projection, from the moment the page lands (the pose starts at 0). */
  timing: {
    /** Seconds after landing before the emitter flash starts (the book is nearly flat by then). */
    projectionDelay: 0.38,
    /** Scan line sweep across the spread, and the emitter flash. */
    scan: 0.5,
    flash: 0.35,
    /** Light panel behind the towers fades up. */
    cone: 0.55,
    /** The first category's floor zone and nameplate appear this long after the projection starts. */
    riseStart: 0.16,
    /** Later rows (ordered back to front by depth) start up to this much later, spread by their depth. */
    rowSpan: 0.5,
    /** A row's towers start rising this long after its zone and nameplate appeared. */
    towerLead: 0.16,
    /** Gap between the towers of one row starting to rise (nearest the nameplate first). */
    towerStagger: 0.06,
    /** Zone and nameplate fade-in. */
    zoneFade: 0.32,
    rise: 0.5,
    /** Flicker while a tower resolves. */
    flicker: 0.4,
    /** Labels fade in this long after their tower starts rising, over `labelFade`. */
    labelAfter: 0.32,
    labelFade: 0.3,
    /** Power down (towers sink, everything fades). */
    powerDown: 0.25,
  },

  /** Tower layout and size (lengths are fractions of the page width unless noted). */
  towers: {
    /** Footprint (square). */
    width: 0.072,
    /** Distance between towers in a row. */
    pitch: 0.165,
    /** Every other row is pushed outward (away from the spine) by this fraction of the pitch, so towers of neighbouring rows do not line up. */
    rowStagger: 0.3,
    /** Rows (one per category on a page) are `rowGap` apart (fraction of page height), centred on the page, and squeezed so the outermost rows stay within +-`rowHalfSpanMax`. */
    rowGap: 0.44,
    rowHalfSpanMax: 0.335,
    /** Height of a level-10 tower, as a fraction of page height. */
    maxHeight: 0.31,
    /** Billboarded labels: font size (fraction of page width) and the gap above the tower top (px). */
    labelFont: 0.0245,
    labelLift: 8,
  },

  /**
   * Category layout: every row has a standing nameplate next to the spine (on both pages), its towers running
   * outward from it, and a floor zone drawn around the towers' bases. Nameplates sit at the spine because the
   * perspective squeezes far rows toward the middle: anywhere else a nearer row's tall towers would cover them.
   */
  categories: {
    /** Space between the spine and the nameplate. */
    margin: 0.04,
    /** Nameplate width, and the gap between it and the first tower. */
    plateWidth: 0.27,
    plateGap: 0.045,
    /** Nameplate text size (fraction of page width), letter spacing (em) and lift above the floor (px). */
    plateFont: 0.027,
    plateSpacing: 0.08,
    plateLift: 3,
    /** Floor zone padding around the tower bases: sideways (fraction of page width) and in depth (fraction of page height). */
    zonePadX: 0.035,
    zonePadY: 0.05,
  },

  /** Colours. Each tower mixes this base light with its skill's accent colour. */
  colors: {
    base: '90, 215, 255',
    edge: '190, 245, 255',
    deep: '10, 60, 110',
    warm: '255, 214, 120',
  },

  /**
   * Tower sides carry each skill's own colour, re-lit to these OKLCH lightness levels (foot, middle, top, cap)
   * so yellow does not blow out and dark blue or purple does not vanish. `hot` is the hovered / focused tower.
   * Chroma factors scale the skill colour's chroma at the foot and the cap. (Browsers without relative colour
   * syntax fall back to a plain mix, see the `.tower` rules.)
   */
  tone: {
    foot: 0.3,
    mid: 0.52,
    top: 0.72,
    cap: 0.9,
    hot: { foot: 0.42, mid: 0.64, top: 0.84, cap: 0.97 },
    footChroma: 0.85,
    capChroma: 0.7,
  },

  /** Idle behaviour (CSS animations on transform / opacity only). */
  idle: {
    /** The whole hologram floats this far (px) and this slowly (s). */
    floatDistance: 4,
    floatPeriod: 7,
    /** Scanline band travel period (s) and an occasional flicker period (s). */
    shimmerPeriod: 5.5,
    flickerPeriod: 9,
  },

  /** Sound (see holoSynth.ts). Peak gain is the master level before the compressor. */
  sound: {
    peak: 0.2,
    /** Seconds from the start of the projection to the first tower tick. */
    tickGain: 0.035,
    /** Seconds the power-up lasts, and the power-down blip. */
    duration: 1.5,
    downDuration: 0.26,
  },
} as const;
