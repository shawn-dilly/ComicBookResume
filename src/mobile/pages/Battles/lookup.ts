import type { Experience } from '../../../types';

/** Experience entry by company name (resilient to the data being reordered, like the desktop). */
export const lookup = (experience: readonly Experience[], company: string): Experience | undefined =>
  experience.find((e) => e.company === company);
