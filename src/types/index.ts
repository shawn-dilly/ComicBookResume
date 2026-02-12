// Type definitions for the Comic Resume

export interface ResumeData {
  personal: PersonalInfo;
  summary: string;
  skills: SkillCategory[];
  experience: Experience[];
  education: Education[];
  specialProjects?: SpecialProject[];
  testimonials: Testimonial[];
  contact: ContactInfo;
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

export interface Experience {
  company: string;
  role: string;
  period: string;
  location?: string;
  achievements: string[];
  villain?: string; // The "challenge" overcome
  powers?: string[]; // Technologies/skills used
  roles?: ExperienceRole[]; // For companies with multiple roles (timeline display)
}

export interface Education {
  institution: string;
  degree: string;
  year: string;
  highlights?: string[];
}

export interface SpecialProject {
  codename: string;
  title: string;
  description: string;
  impact: string;
  tech: string[];
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
