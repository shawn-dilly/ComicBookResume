/** Small colour helpers shared by the reader. */

const cache = new Map<string, string>();

/**
 * Resolve a design token like `var(--comic-blue)` to an "r, g, b" triplet (for `rgba(var(--c), a)`), optionally
 * lightened toward white by `lighten` (0-1). Falls back to the comic blue.
 */
export function rgbTriplet(token: string | undefined, lighten = 0): string {
  const key = `${token ?? ''}|${lighten}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const name = /var\((--[\w-]+)\)/.exec(token ?? '')?.[1];
  const raw = name ? getComputedStyle(document.documentElement).getPropertyValue(name).trim() : (token ?? '');
  const m = /^#?([0-9a-f]{6})$/i.exec(raw);
  const n = m ? parseInt(m[1], 16) : 0x0072bc;
  const parts = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (255 - v) * lighten));
  const out = parts.join(',');
  cache.set(key, out);
  return out;
}
