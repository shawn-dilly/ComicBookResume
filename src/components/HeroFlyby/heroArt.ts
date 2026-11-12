import riseSrc from './assets/hero-rise.webp';
import hoverSrc from './assets/hero-hover.webp';
import climbSrc from './assets/hero-climb.webp';
import flySrc from './assets/hero-fly.webp';

export type Pose = 'rise' | 'hover' | 'climb' | 'fly';

/**
 * The four panel-style cut-outs of the Iron Architect.
 * - w, h: image size in px.
 * - k: image width as a multiple of his head-to-boot length B, so the same person has the same size in every pose
 *   (rise and hover are full height, climb's body length is its diagonal, fly's is its width).
 * - anchor: the chest, as fractions of the image. Each pose is placed and rotated about its anchor, so a swap between poses
 *   does not slide him.
 * - boots: where the boot soles are (fractions), and thrust: the direction the flames leave, in degrees clockwise from
 *   straight down (rise and hover: down; climb: down-left along the body axis; fly: left), plus a flame scale for the sprite.
 * - drawn: the angle (degrees, nose-down positive) the body axis is drawn at: -90 straight up, -45 climbing, 0 level.
 */
export const ART: Record<Pose, { src: string; w: number; h: number; k: number; anchor: [number, number]; boots: Array<[number, number]>; thrust: number; ts: number; drawn: number }> = {
  rise: { src: riseSrc, w: 192, h: 560, k: 0.42, anchor: [0.5, 0.33], boots: [[0.33, 0.965], [0.4, 0.965]], thrust: 0, ts: 0.42, drawn: -90 },
  hover: { src: hoverSrc, w: 316, h: 560, k: 0.59, anchor: [0.5, 0.27], boots: [[0.3, 0.92], [0.72, 0.98]], thrust: 0, ts: 0.75, drawn: -90 },
  climb: { src: climbSrc, w: 522, h: 520, k: 0.99, anchor: [0.58, 0.36], boots: [[0.045, 0.95], [0.12, 0.9]], thrust: 45, ts: 0.9, drawn: -45 },
  fly: { src: flySrc, w: 900, h: 211, k: 1.4, anchor: [0.6, 0.55], boots: [[0.014, 0.82], [0.062, 0.56]], thrust: 90, ts: 0.75, drawn: 0 },
};
