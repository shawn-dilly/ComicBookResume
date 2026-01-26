import type { ResumeData } from '../types';

export const resumeData: ResumeData = {
  personal: {
    name: 'Your Name',
    title: 'Software Developer',
    heroName: 'THE CODE CRUSADER',
    tagline: 'Defender of Clean Code & Vanquisher of Bugs!',
  },

  summary: `A fearless developer who emerged from the depths of debugging dungeons,
    wielding the power of clean architecture and test-driven development.
    With great power comes great responsibility... to ship features on time!`,

  skills: [
    {
      category: 'Languages',
      skills: [
        { name: 'TypeScript', level: 9, color: 'var(--comic-blue)' },
        { name: 'JavaScript', level: 9, color: 'var(--comic-yellow)' },
        { name: 'Python', level: 7, color: 'var(--comic-green)' },
        { name: 'Go', level: 6, color: 'var(--comic-cyan)' },
      ],
    },
    {
      category: 'Frameworks',
      skills: [
        { name: 'React', level: 9, color: 'var(--comic-cyan)' },
        { name: 'Node.js', level: 8, color: 'var(--comic-green)' },
        { name: 'Next.js', level: 8, color: 'var(--comic-black)' },
        { name: 'Express', level: 7, color: 'var(--comic-yellow)' },
      ],
    },
    {
      category: 'Tools & Practices',
      skills: [
        { name: 'Git', level: 9, color: 'var(--comic-orange)' },
        { name: 'Docker', level: 7, color: 'var(--comic-blue)' },
        { name: 'CI/CD', level: 8, color: 'var(--comic-green)' },
        { name: 'Testing', level: 8, color: 'var(--comic-red)' },
      ],
    },
  ],

  experience: [
    {
      company: 'Tech Corp Industries',
      role: 'Senior Software Engineer',
      period: '2022 - Present',
      achievements: [
        'Led the charge against legacy code, refactoring 50,000+ lines',
        'Reduced deployment time from hours to minutes using CI/CD',
        'Mentored junior developers in the ways of clean code',
        'Saved the day by resolving critical production incidents',
      ],
      villain: 'THE LEGACY MONOLITH',
      powers: ['React', 'Node.js', 'AWS', 'PostgreSQL'],
    },
    {
      company: 'Startup Ventures',
      role: 'Full Stack Developer',
      period: '2020 - 2022',
      achievements: [
        'Built real-time collaboration features from scratch',
        'Scaled the platform to handle 100K+ concurrent users',
        'Implemented secure authentication & authorization',
        'Reduced page load times by 60% through optimization',
      ],
      villain: 'THE SCALING CRISIS',
      powers: ['TypeScript', 'React', 'Redis', 'MongoDB'],
    },
    {
      company: 'Digital Agency',
      role: 'Junior Developer',
      period: '2018 - 2020',
      achievements: [
        'Delivered 20+ client projects on time and under budget',
        'Developed responsive, accessible web applications',
        'Learned the ancient arts of debugging and coffee brewing',
        'Graduated from bug-fixing sidekick to feature-building hero',
      ],
      villain: 'DEADLINE DOOM',
      powers: ['JavaScript', 'HTML/CSS', 'PHP', 'MySQL'],
    },
  ],

  education: [
    {
      institution: 'University of Technology',
      degree: 'B.S. Computer Science',
      year: '2018',
      highlights: [
        'Graduated with honors',
        'Lead developer on capstone project',
        'Teaching assistant for Algorithms course',
      ],
    },
    {
      institution: 'Online Learning Academy',
      degree: 'Various Certifications',
      year: '2018 - Present',
      highlights: [
        'AWS Solutions Architect',
        'Advanced React Patterns',
        'System Design Fundamentals',
      ],
    },
  ],

  testimonials: [
    {
      name: 'Jane Smith',
      role: 'Engineering Manager',
      quote: 'A true hero in our darkest hours of debugging. Always ready to jump in and save the sprint!',
      heroAlias: 'The Debugging Wizard',
    },
    {
      name: 'John Doe',
      role: 'Product Manager',
      quote: 'Delivers features faster than a speeding bullet. Our most reliable developer!',
      heroAlias: 'Captain Reliable',
    },
    {
      name: 'Alex Johnson',
      role: 'Senior Developer',
      quote: 'The best pair programming partner. Together we defeated countless bugs!',
      heroAlias: 'The Code Companion',
    },
  ],

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
