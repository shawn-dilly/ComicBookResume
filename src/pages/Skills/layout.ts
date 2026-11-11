import type { SkillCategory } from '../../types';

/** Categories printed on the left page; every further category goes on the right page. */
export const SKILLS_LEFT_COUNT = 2;

export function splitSkillCategories(categories: SkillCategory[]): {
  left: SkillCategory[];
  right: SkillCategory[];
} {
  return {
    left: categories.slice(0, SKILLS_LEFT_COUNT),
    right: categories.slice(SKILLS_LEFT_COUNT),
  };
}
