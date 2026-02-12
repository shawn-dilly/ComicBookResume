import type { ResumeData } from '../types';
import { loadRecommendationsFromCSV } from '../utils/linkedinRecommendations';
import recommendationsCSV from '../../Recommendations_Received.csv?raw';

// Load LinkedIn recommendations
const linkedInTestimonials = loadRecommendationsFromCSV(recommendationsCSV);

export const resumeData: ResumeData = {
  personal: {
    name: 'Shawn Dillenbeck',
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
        { name: 'Team Building', level: 10, color: 'var(--comic-blue)' },
        { name: 'Management', level: 9, color: 'var(--comic-red)' },
        { name: 'Product Mgmt', level: 8, color: 'var(--comic-green)' },
        { name: 'Agile / Scrum', level: 9, color: 'var(--comic-purple)' },
      ],
    },
    {
      category: 'Architecture',
      skills: [
        { name: 'AWS', level: 9, color: 'var(--comic-cyan)' },
        { name: 'Azure', level: 8, color: 'var(--comic-blue)' },
        { name: 'Microservices', level: 9, color: 'var(--comic-orange)' },
        { name: 'Event-Driven', level: 8, color: 'var(--comic-green)' },
      ],
    },
    {
      category: 'DevOps & SRE',
      skills: [
        { name: 'CI/CD Pipelines', level: 9, color: 'var(--comic-blue)' },
        { name: 'Terraform / IaC', level: 9, color: 'var(--comic-yellow)' },
        { name: 'Observability', level: 9, color: 'var(--comic-green)' },
        { name: 'SRE / Reliability', level: 9, color: 'var(--comic-red)' },
      ],
    },
    {
      category: 'Languages & Data',
      skills: [
        { name: 'C# / .NET', level: 9, color: 'var(--comic-purple)' },
        { name: 'TypeScript / React', level: 8, color: 'var(--comic-cyan)' },
        { name: 'SQL / Postgres', level: 10, color: 'var(--comic-green)' },
        { name: 'REST APIs', level: 8, color: 'var(--comic-orange)' },
      ],
    },
  ],

  experience: [
    {
      company: 'PeopleReady',
      role: 'Director, Software Engineering',
      period: 'Feb 2020 - Dec 2025',
      location: 'Remote',
      achievements: [
        'Architected a scalable, cloud-native platform on AWS to modernize legacy products, supporting 125,000+ daily active users',
        'Envisioned and implemented a robust CI/CD ecosystem empowering teams to deploy to production multiple times daily',
        'Founded and scaled a Site Reliability Engineering (SRE) function, establishing company-wide observability, incident response, and IaaS automation',
        'Built and led multiple high-performing engineering teams, blending nearshore and onshore talent',
        'Designed an automated change management framework integrated into CI/CD, streamlining developer workflows',
        'Established a Performance Engineering team for load, stress, and scalability testing at scale',
        'Architected an event-driven integration strategy for seamless third-party vendor connectivity',
        'Defined and built the organization\'s first DBA practice for a greenfield initiative',
      ],
      villain: 'THE LEGACY MONOLITH',
      powers: ['AWS', 'CI/CD', 'SRE', 'Microservices', 'Terraform', 'Event-Driven'],
    },
    {
      company: 'Ezlinks Golf',
      role: 'Director, Platform Services',
      period: 'Dec 2015 - Feb 2020',
      location: 'Chicago, IL',
      achievements: [
        'Reported directly to the CTO, leading e-commerce development and DevOps teams',
        'Led a cost optimization initiative across Azure and AWS, achieving 25% reduction in monthly infrastructure expenses',
        'Drove platform modernization from SQL Server stored procedures to .NET microservices in Azure',
        'Led implementation of zero-downtime deployment practices',
        'Founded the DevOps function, scaling the team to four engineers',
        'Drove booking failure rate from 9% to 4% through performance optimization',
      ],
      villain: 'THE PLATFORM HYDRA',
      powers: ['Azure', 'AWS', '.NET', 'CI/CD', 'Microservices', 'SQL Server'],
      roles: [
        {
          title: 'Director, Platform Services',
          period: 'Dec 2018 - Feb 2020',
          highlights: [
            'Reported directly to the CTO, leading multiple e-commerce and DevOps teams',
            'Defined and executed company-wide platform strategy to consolidate fragmented services',
            'Achieved 25% cloud cost reduction across Azure and AWS',
            'Oversaw enterprise architecture for existing systems and new ventures',
            'Championed process improvements across the SDLC for velocity and reliability',
            'Provided strategic guidance on product features and long-term resource planning',
            'Led post-incident reviews and outage resolution across functional teams',
          ],
        },
        {
          title: 'Senior Manager, Engineering',
          period: 'Jan 2018 - Nov 2018',
          highlights: [
            'Expanded scope to lead multiple e-commerce development teams',
            'Continued oversight of DevOps supporting 30+ products across diverse tech stack',
            'Drove platform modernization from SQL Server stored procedures to .NET microservices',
            'Led implementation of zero-downtime deployment practices',
            'Mentored and coached developers and operations engineers into leadership roles',
            'Monitored and improved system reliability using data-driven insights',
          ],
        },
        {
          title: 'Lead Development Operations Engineer',
          period: 'Dec 2015 - Dec 2017',
          highlights: [
            'Founded the DevOps function at Ezlinks, scaling the team to four',
            'Owned end-to-end responsibility for 10+ customer-facing products',
            'Developed automated alerting and monitoring for proactive issue detection',
            'Managed and provisioned multi-cloud environments (Azure and AWS)',
            'Introduced CI/CD practices and automated deployment pipelines',
            'Drove booking failure rate from 9% to 4% through performance optimization',
          ],
        },
      ],
    },
    {
      company: 'Geneca',
      role: 'Senior Software Engineer',
      period: 'Apr 2013 - Dec 2015',
      location: 'Oakbrook Terrace, IL',
      achievements: [
        'Enhanced consumer-facing comic grading site with grouping capabilities',
        'Architected solution to replace SSIS packages with user upload/validation',
        'Enhanced website to support multi-region tenancy within same codebase',
        'Maintained and enhanced WPF application and AngularJS website for org restructuring',
        'Migrated WPF Application and website to use shared codebase',
        'Built internal employee recognition tool using AngularJS, REST API, and Entity Framework',
      ],
      villain: 'THE TECH DEBT TITAN',
      powers: ['C#', '.NET', 'AngularJS', 'SQL Server', 'WPF', 'REST APIs'],
    },
    {
      company: 'Healthation',
      role: 'Software Engineer II',
      period: 'Jun 2007 - Apr 2013',
      location: 'Lisle, IL',
      achievements: [
        'Architected ability for manual QA testers to create reusable automated scripts',
        'Developed multi-threaded Deployment utility standardizing code delivery across the application',
        'Architected WCF 4.0 API exposing Eligibility, Billing, and Claims Processing functionality',
        'Led enhancement project team of junior developers, providing mentoring and design decisions',
        'Improved eligibility processing from 1 million records in 24 hours to under 2 hours',
        'TFS 2010 administrator responsible for versioning methodology and automated quality gates',
      ],
      villain: 'THE MANUAL MENACE',
      powers: ['C#', 'WCF', '.NET', 'SQL Server', 'SSIS', 'TFS'],
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

  specialProjects: [
    {
      codename: 'PROJECT TAP',
      title: 'Culture Measurement Platform',
      description: 'Co-founded the TAP platform at Grodivo to measure and define culture\'s place within companies. Architected a distributed SaaS platform using .NET 8 microservices, React/TypeScript frontends, and AWS serverless infrastructure.',
      impact: 'VP Software Engineering (Fractional) — Jul 2024 - Present',
      tech: ['.NET 8', 'React', 'TypeScript', 'Lambda', 'SQS', 'S3', 'Cognito'],
    },
    {
      codename: 'OPERATION RAG',
      title: 'AI-Powered Insights Engine',
      description: 'Designed and implemented a RAG (Retrieval Augmented Generation) pipeline using AWS Bedrock Knowledge Base with hybrid and semantic vector search for intelligent document retrieval. Built AI-powered insights enabling natural language queries over organizational data.',
      impact: 'Foundation model integration (Claude, etc.) with configurable inference',
      tech: ['AWS Bedrock', 'RAG', 'Vector Search', 'LLM', 'Claude'],
    },
    {
      codename: 'PROJECT AGENT FORGE',
      title: 'Agentic Development Workflow',
      description: 'Pioneered adoption of agentic coding practices with a 7-agent Claude-based development workflow spanning architecture, frontend, backend, QA, product management, and UX design roles.',
      impact: 'Full-stack AI-augmented development pipeline',
      tech: ['Claude', 'AI Agents', 'Architecture', 'QA', 'UX'],
    },
  ],

  // Testimonials loaded from LinkedIn Recommendations
  testimonials: linkedInTestimonials,

  contact: {
    email: 'shawndillenbeck@gmail.com',
    phone: '(331) 454-0486',
    linkedin: 'https://www.linkedin.com/in/shawn-dillenbeck/',
    github: 'github.com/shawndillenbeck',
    website: '',
    location: 'Bartlett, IL',
  },
};

export default resumeData;
