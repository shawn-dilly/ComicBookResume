import type { ResumeData } from '../types';
import { loadRecommendationsFromCSV } from '../utils/linkedinRecommendations';
import recommendationsCSV from '../../Recommendations_Received.csv?raw';

// Load LinkedIn recommendations
const linkedInTestimonials = loadRecommendationsFromCSV(recommendationsCSV);

export const resumeData: ResumeData = {
  personal: {
    name: 'Your Name',
    title: 'Engineering Leader',
    heroName: 'IRON ARCHITECT',
    tagline: 'Forging Teams & Building the Future of Technology!',
  },

  summary: `A visionary leader who rose from the trenches of engineering
    to architect solutions that scale teams and transform organizations.
    With great vision comes great responsibility... to build what matters!`,

  skills: [
    {
      category: 'Leadership',
      skills: [
        { name: 'Team Building', level: 9, color: 'var(--comic-blue)' },
        { name: 'Strategic Vision', level: 9, color: 'var(--comic-red)' },
        { name: 'Mentorship', level: 8, color: 'var(--comic-green)' },
        { name: 'Stakeholder Mgmt', level: 8, color: 'var(--comic-purple)' },
      ],
    },
    {
      category: 'Architecture',
      skills: [
        { name: 'System Design', level: 9, color: 'var(--comic-cyan)' },
        { name: 'Cloud (AWS/GCP)', level: 8, color: 'var(--comic-orange)' },
        { name: 'Microservices', level: 8, color: 'var(--comic-green)' },
        { name: 'Data Architecture', level: 7, color: 'var(--comic-yellow)' },
      ],
    },
    {
      category: 'Execution',
      skills: [
        { name: 'Agile/Scrum', level: 9, color: 'var(--comic-blue)' },
        { name: 'Roadmap Planning', level: 8, color: 'var(--comic-red)' },
        { name: 'Tech Due Diligence', level: 8, color: 'var(--comic-purple)' },
        { name: 'Budget Management', level: 7, color: 'var(--comic-green)' },
      ],
    },
  ],

  experience: [
    {
      company: 'Tech Corp Industries',
      role: 'Director of Engineering',
      period: '2022 - Present',
      achievements: [
        'Architected the technical vision for a 50-person engineering org',
        'Built and scaled 3 high-performing teams from the ground up',
        'Drove platform modernization saving $2M annually in tech debt',
        'Established engineering culture that reduced attrition by 40%',
      ],
      villain: 'THE CHAOS OF SCALE',
      powers: ['Strategy', 'Team Building', 'Architecture', 'Culture'],
    },
    {
      company: 'Startup Ventures',
      role: 'Engineering Manager',
      period: '2020 - 2022',
      achievements: [
        'Grew engineering team from 5 to 25 while maintaining velocity',
        'Designed systems architecture supporting 10x user growth',
        'Implemented agile practices that doubled team output',
        'Mentored 8 engineers into senior and lead roles',
      ],
      villain: 'THE SCALING CRISIS',
      powers: ['Leadership', 'System Design', 'Mentorship', 'Agile'],
    },
    {
      company: 'Digital Agency',
      role: 'Tech Lead',
      period: '2018 - 2020',
      achievements: [
        'Led a team of 6 engineers delivering 20+ client projects',
        'Established code review and quality standards for the org',
        'Architected reusable component library cutting dev time 50%',
        'Rose from individual contributor to trusted technical leader',
      ],
      villain: 'DEADLINE DOOM',
      powers: ['Technical Leadership', 'Architecture', 'Delivery', 'Standards'],
    },
  ],

  education: [
    {
      institution: 'University of Technology',
      degree: 'B.S. Computer Science',
      year: '2018',
      highlights: [
        'Graduated with honors',
        'Led 12-person capstone team to victory',
        'Founded campus tech mentorship program',
      ],
    },
    {
      institution: 'Leadership Development',
      degree: 'Executive Education',
      year: '2020 - Present',
      highlights: [
        'AWS Solutions Architect Professional',
        'Engineering Leadership (Stanford Online)',
        'Strategic Decision Making (MIT Sloan)',
      ],
    },
  ],

  // Testimonials loaded from LinkedIn Recommendations
  testimonials: linkedInTestimonials,

  contact: {
    email: 'hero@example.com',
    phone: '(555) 123-4567',
    linkedin: 'linkedin.com/in/yourname',
    github: 'github.com/yourname',
    website: 'yourportfolio.com',
    location: 'Metropolis, USA',
  },
};

export default resumeData;
