// Type definitions for the Comic Resume

export interface ResumeData {
  personal: PersonalInfo;
  summary: string;
  skills: SkillCategory[];
  experience: Experience[];
  education: Education[];
  testimonials: Testimonial[];
  contact: ContactInfo;
  specialProjects: SpecialProjects;
}

export interface PersonalInfo {
  name: string;
  title: string;
  heroName?: string;
  tagline?: string;
}

export interface SkillCategory {
  category: string;
  skills: Skill[];
}

export interface Skill {
  name: string;
  level: number; // 1-10
  color?: string;
}

export interface ExperienceRole {
  title: string;
  period: string;
  highlights: string[];
}

export interface ExperienceStat {
  value: string; // e.g. "4x", "15+"
  label: string; // e.g. "Velocity"
}

export interface Experience {
  company: string;
  role: string;
  period: string;
  location?: string;
  achievements: string[];
  villain?: string; // The "challenge" overcome
  powers?: string[]; // Technologies/skills used
  roles?: ExperienceRole[]; // For companies with multiple roles (timeline display)
  stats?: ExperienceStat[]; // Headline numbers for stat-strip layouts
}

export interface Education {
  institution: string;
  degree: string;
  year: string;
  highlights?: string[];
}

export interface Testimonial {
  name: string;
  role: string;
  quote: string;
  heroAlias?: string;
}

export interface ContactInfo {
  email: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  location?: string;
}

// Special Projects (the Secret Lab Projects case file)
export interface CaseFileSection {
  title: string;
  text: string;
}

export interface CaseFileStat {
  value: string;
  label: string;
}

export interface CaseFileLoopNode {
  label: string;
  caption: string;
}

export interface CaseFile {
  /** Small label above the title (the dossier tab). */
  label: string;
  codename: string;
  title: string;
  mission: { title: string; text: string; goals: string[] };
  machine: CaseFileSection;
  lab: CaseFileSection;
  rules: CaseFileSection;
  verdict: { stamp: string[]; text: string };
  stillInTheLab: CaseFileSection;
  loop: { title: string; hint: string; nodes: CaseFileLoopNode[] };
  bakeOff: { title: string; headline: string; text: string; tokens: number; referee: string };
  stats: CaseFileStat[];
  findingsTitle: string;
  findings: CaseFileSection[];
}

export interface SpecialProjects {
  /** Heading of the chapter (the old page's title). */
  title: string;
  footer: string;
  caseFile: CaseFile;
}

// Component Props Types
export type PageDensity = 'hard' | 'soft';

export type BubbleVariant = 'speech' | 'thought' | 'shout';

export type TailDirection = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'left' | 'right';

export type PanelVariant = 'standard' | 'angled' | 'burst' | 'rounded' | 'splash';

export type ActionWordType = 'pow' | 'bam' | 'zap' | 'wham' | 'boom' | 'crack' | 'slam' | 'kapow';

export interface PageFlipEvent {
  data: number;
}

// Animation types
export type AnimationState = 'entering' | 'visible' | 'exiting' | 'hidden';
