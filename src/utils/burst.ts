/** Points of a comic starburst polygon in a 0-100 box (`jitter` makes the rays uneven, deterministically). */
export function starPoints(rays: number, outer: number, inner: number, jitter = 0): string {
  const pts: string[] = [];
  for (let i = 0; i < rays * 2; i++) {
    const r = i % 2 ? inner : outer * (1 + Math.sin(i * 12.9898 + rays) * 0.5 * jitter);
    const a = (Math.PI * i) / rays - Math.PI / 2;
    pts.push(`${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
}
