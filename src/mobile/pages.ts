/**
 * pages - the reader's page list and chapters (contents sheet), built from the resume data.
 *
 * Epic Battles is one page per experience grouping, as on the desktop (Grodivo, PeopleReady, Ezlinks Golf,
 * Geneca + Healthation). Company names come from the data; the other titles are the desktop's headings.
 */

import { AD_COPY } from '../data/hireMe';
import { resumeData } from '../data/resume';

export type PageId =
  | 'cover'
  | 'personnel-file'
  | 'origin-story'
  | 'powers-abilities'
  | 'battle-grodivo'
  | 'battle-peopleready'
  | 'battle-ezlinks'
  | 'battle-early-career'
  | 'case-file-dossier'
  | 'case-file-loop'
  | 'mighty-allies'
  | 'ad-page'
  | 'contact';

export interface PageDef {
  id: PageId;
  /** Name shown in the bottom bar and the contents sheet. */
  title: string;
}

export interface ChapterDef {
  id: string;
  title: string;
  /** Page the chapter opens on. */
  first: PageId;
  /** Pages listed under the chapter (Epic Battles). */
  children?: PageId[];
}

const company = (name: string): string => resumeData.experience.find((e) => e.company === name)?.company ?? name;

export const PAGES: readonly PageDef[] = [
  { id: 'cover', title: 'Cover' },
  { id: 'ad-page', title: AD_COPY.wanted.replace(/:$/, '') },
  { id: 'personnel-file', title: 'Personnel File' },
  { id: 'origin-story', title: 'Origin Story' },
  { id: 'powers-abilities', title: 'Powers & Abilities' },
  { id: 'battle-grodivo', title: company('Grodivo') },
  { id: 'battle-peopleready', title: company('PeopleReady') },
  { id: 'battle-ezlinks', title: company('Ezlinks Golf') },
  { id: 'battle-early-career', title: `${company('Geneca')} + ${company('Healthation')}` },
  { id: 'case-file-dossier', title: resumeData.specialProjects.caseFile.codename },
  { id: 'case-file-loop', title: resumeData.specialProjects.caseFile.loop.title },
  { id: 'mighty-allies', title: 'Mighty Allies' },
  { id: 'contact', title: 'Contact' },
];

export const CHAPTERS: readonly ChapterDef[] = [
  { id: 'cover', title: 'Cover', first: 'cover' },
  { id: 'ad-page', title: AD_COPY.wanted.replace(/:$/, ''), first: 'ad-page' },
  { id: 'personnel-file', title: 'Personnel File', first: 'personnel-file' },
  { id: 'origin-story', title: 'Origin Story', first: 'origin-story' },
  { id: 'powers-abilities', title: 'Powers & Abilities', first: 'powers-abilities' },
  {
    id: 'epic-battles',
    title: 'Epic Battles',
    first: 'battle-grodivo',
    children: ['battle-grodivo', 'battle-peopleready', 'battle-ezlinks', 'battle-early-career'],
  },
  {
    id: 'special-projects',
    title: resumeData.specialProjects.title,
    first: 'case-file-dossier',
    children: ['case-file-dossier', 'case-file-loop'],
  },
  { id: 'mighty-allies', title: 'Mighty Allies', first: 'mighty-allies' },
  { id: 'contact', title: 'Contact', first: 'contact' },
];

export const pageIndex = (id: string): number => PAGES.findIndex((p) => p.id === id);

/** Page id from a location hash (`#origin-story`), or -1. */
export function pageFromHash(hash: string): number {
  return pageIndex(hash.replace(/^#/, ''));
}
