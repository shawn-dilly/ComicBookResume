import { mulberry32 } from '../WebCatch/webGeometry';

export const WEB_W = 400;
export const WEB_H = 600;
/** Hub: centre of the portrait, a little below the middle of the cover. */
export const HUB_X = 200;
export const HUB_Y = 318;
const SPOKES = 20;
const REACH = 520; // past the farthest corner
const f = (n: number) => n.toFixed(1);

function spokeAngles(): number[] {
  // Same stream as buildWeb: the first SPOKES draws are the angle jitter.
  const rand = mulberry32(20240611);
  const step = (Math.PI * 2) / SPOKES;
  const angles: number[] = [];
  for (let i = 0; i < SPOKES; i++) {
    const j = -0.28 + 0.56 * rand();
    angles.push(i * step + j * step + 0.12);
  }
  return angles;
}

/** Spoke angles (radians), shared with the burst so cracks can follow them. */
export const SPOKE_ANGLES: readonly number[] = spokeAngles();

export function buildWeb(): { spokes: string; rings: string } {
  const rand = mulberry32(20240611);
  const span = (a: number, b: number) => a + (b - a) * rand();

  const angles: number[] = [];
  const step = (Math.PI * 2) / SPOKES;
  for (let i = 0; i < SPOKES; i++) angles.push(i * step + span(-0.28, 0.28) * step + 0.12);
  const dirs = angles.map((a) => [Math.cos(a), Math.sin(a)] as const);

  // Spokes: one path. A couple stop a little short of the edge. Near the hole
  // each spoke starts at its own ragged radius, as if snapped off.
  let spokes = '';
  dirs.forEach(([dx, dy], i) => {
    const r0 = 14;
    const r1 = i === 4 || i === 13 ? span(300, 360) : REACH * span(0.97, 1.03);
    spokes += `M${f(HUB_X + dx * r0)} ${f(HUB_Y + dy * r0)}L${f(HUB_X + dx * r1)} ${f(HUB_Y + dy * r1)}`;
  });

  const radii: number[] = [];
  let r = 34;
  let gap = 15;
  while (r < 470) {
    radii.push(r);
    r += gap;
    gap *= 1.085;
  }

  const missing = new Set(['6:3', '9:11', '12:16']);
  // A couple of rings sit slightly off-register near the hole.
  const offset = new Set(['8:7', '11:14', '9:2', '10:15', '11:5']);

  let rings = '';
  radii.forEach((base, k) => {
    const rr = dirs.map(() => base * span(0.985, 1.015));
    let pen = false;
    for (let i = 0; i < SPOKES; i++) {
      const j = (i + 1) % SPOKES;
      const key = `${k}:${i}`;
      const ra = rr[i];
      let rb = rr[j];
      if (offset.has(key)) rb *= 1.05;
      const ax = HUB_X + dirs[i][0] * ra;
      const ay = HUB_Y + dirs[i][1] * ra;
      const bx = HUB_X + dirs[j][0] * rb;
      const by = HUB_Y + dirs[j][1] * rb;
      if (missing.has(key)) {
        pen = false;
        continue;
      }
      const chord = Math.hypot(bx - ax, by - ay);
      const mx = (ax + bx) / 2;
      const my = (ay + by) / 2;
      const md = Math.hypot(mx - HUB_X, my - HUB_Y) || 1;
      const pull = chord * span(0.2, 0.34);
      const cx = mx - ((mx - HUB_X) / md) * pull;
      const cy = my - ((my - HUB_Y) / md) * pull;
      if (!pen) {
        rings += `M${f(ax)} ${f(ay)}`;
        pen = true;
      }
      rings += `Q${f(cx)} ${f(cy)} ${f(bx)} ${f(by)}`;
    }
  });

  return { spokes, rings };
}
