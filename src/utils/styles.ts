import type { CSSProperties } from 'react';

/**
 * Creates a CSS background image style for comic panels.
 * Used by OriginStory pages for image-based panels.
 */
export const panelBgStyle = (imageUrl: string): CSSProperties => ({
  backgroundImage: `url(${import.meta.env.BASE_URL}${imageUrl.replace(/^\//, '')})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
});
