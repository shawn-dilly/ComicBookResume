/**
 * boot - decides which page the reader opens on: the cover, or the page a `#page` deep link names.
 */

import { pageFromHash } from '../pages';

export const startIndex = (): number => Math.max(0, pageFromHash(window.location.hash));
