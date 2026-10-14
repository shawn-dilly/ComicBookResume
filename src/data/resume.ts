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
      company: 'Grodivo',
      role: 'VP Software Engineering (Fractional)',
      period: 'Jan 2026 - Present',
      location: 'Remote',
      achievements: [
        'Co-founded the TAP platform, an AI-powered SaaS product measuring culture\'s role in organizations, as a player-coach setting technical direction and shipping code across backend, frontend, and DevOps',
        'Built a spec-first, AI-assisted development workflow on Claude Code: 12 specialized agents, a 5-lens parallel pre-PR code review, and an unattended overnight ticket-to-PR runner, lifting developer velocity 4x',
        'Built an in-product AI assistant that answers users\' questions about their assessment results, grounding every answer in their own data and a RAG knowledge base',
        'Architected a multi-source company-intelligence pipeline ingesting filings, web, job-posting, earnings-call, and review data through pluggable connectors to power a proprietary culture calculation',
        'Established engineering quality standards: an automated test suite, Postgres-backed integration tests, end-to-end Playwright coverage, and Sentry-based incident response',
        'Led the AI/RAG strategy on AWS Bedrock: Knowledge Base ingestion with hybrid and semantic search, Terraform-provisioned agents with automatic RAG fallback, Ragas evaluation, and natural-language insights on Claude models',
        'Architected a distributed platform of .NET 10 microservices and React/TypeScript front-ends on a CQRS/Clean Architecture backend across three applications and a shared TypeScript monorepo',
        'Owned AWS architecture (ECS, Lambda, SQS, S3, Cognito, SES, Secrets Manager, CloudFront), led the migration to Terraform IaC, and shipped 15+ production releases via GitHub Actions CI/CD',
        'Delivered enterprise authentication with AWS Cognito, custom JWT enrichment, and SSO/Entra ID, and hardened multi-tenant authorization',
      ],
      villain: 'THE INVISIBLE CULTURE',
      powers: ['.NET 10', 'React / TS', 'AWS Bedrock', 'RAG', 'Claude Code', 'Terraform', 'Cognito', 'GitHub Actions'],
      stats: [
        { value: '12', label: 'AI Agents' },
        { value: '4x', label: 'Velocity' },
      ],
    },
    {
      company: 'PeopleReady',
      role: 'Director, Software Engineering',
      period: 'Feb 2020 - Dec 2025',
      location: 'Remote',
      achievements: [
        'Architected a cloud-native platform on AWS to modernize legacy products, supporting 125,000+ daily active users and unlocking new revenue streams',
        'Built and scaled a CI/CD ecosystem that lets teams deploy to production multiple times daily, cutting deployment risk and accelerating time-to-market',
        'Founded and scaled a Site Reliability Engineering (SRE) function, setting the company-wide strategy for observability, incident response, and IaaS automation',
        'Built and led multiple nearshore and onshore engineering teams, fostering a collaborative, delivery-focused culture that met aggressive timelines',
        'Designed an automated change management framework integrated into CI/CD, streamlining developer workflows and boosting cross-team productivity',
        'Launched a Performance Engineering team that defined and executed load, stress, and scalability test strategies for resilience under peak demand',
        'Shaped product strategy through deep involvement in product definition and design sessions, aligning technical solutions with business objectives',
        'Delivered an event-driven integration architecture for seamless connectivity with key third-party vendors, expanding the partner ecosystem',
        'Created the organization\'s first DBA practice for greenfield development, establishing data architecture, governance, and scalability standards',
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
        'Led e-commerce development and DevOps teams as a direct report to the CTO, driving platform modernization and growth',
        'Achieved a 25% reduction in monthly infrastructure costs by optimizing multi-cloud architecture across Azure and AWS',
        'Spearheaded modernization of legacy SQL Server stored procedures into .NET microservices in Azure',
        'Implemented zero-downtime deployment practices, elevating release confidence and production stability',
        'Founded the DevOps function, scaling the team from zero to four engineers',
        'Cut booking failure rates from 9% to 4% through database optimization',
      ],
      villain: 'THE PLATFORM HYDRA',
      powers: ['Azure', 'AWS', '.NET', 'CI/CD', 'Microservices', 'SQL Server'],
      roles: [
        {
          title: 'Director, Platform Services',
          period: 'Dec 2018 - Feb 2020',
          highlights: [
            'Led multiple e-commerce development and DevOps teams as a direct report to the CTO, driving modernization and growth',
            'Consolidated fragmented services into reusable platform components through a company-wide platform strategy',
            'Achieved a 25% reduction in monthly infrastructure costs by optimizing multi-cloud architecture across Azure and AWS',
            'Directed enterprise architecture planning for existing systems and new ventures',
            'Drove SDLC process improvements that increased velocity, reliability, and cross-team coordination',
            'Guided product feature decisions, technology evaluations, and resource planning against roadmap objectives',
            'Led post-incident reviews and outage resolution, driving root cause analysis and resilience improvements',
          ],
        },
        {
          title: 'Senior Manager, Engineering',
          period: 'Jan 2018 - Nov 2018',
          highlights: [
            'Expanded leadership scope to multiple e-commerce teams owning core revenue-generating platforms',
            'Oversaw Development Operations for 30+ products across Windows/Linux, .NET, JavaScript, Azure, and AWS',
            'Spearheaded modernization of legacy SQL Server stored procedures into .NET microservices in Azure',
            'Implemented zero-downtime deployment practices, elevating release confidence and production stability',
            'Mentored developers and operations engineers into expanded technical and leadership roles',
            'Improved reliability and performance through data-driven monitoring and proactive risk mitigation',
          ],
        },
        {
          title: 'Lead Development Operations Engineer',
          period: 'Dec 2015 - Dec 2017',
          highlights: [
            'Founded the DevOps function, scaling the team from zero to four and embedding DevOps practices across the SDLC',
            'Owned end-to-end reliability for 10+ customer-facing products: e-commerce platforms, APIs, and POS systems',
            'Built automated alerting and monitoring that enabled proactive issue detection and improved customer experience',
            'Managed and provisioned multi-cloud environments (Azure and AWS) for scalability and high availability',
            'Introduced CI/CD practices and automated deployment pipelines, replacing manual builds and accelerating releases',
            'Optimized stored procedures and partnered with DBAs on indexing and schema design, cutting booking failures from 9% to 4%',
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
        'Enhanced a consumer-facing comic grading site so users can group their comics',
        'Architected a solution replacing SSIS packages with user-driven upload and validation',
        'Extended an existing website to support multi-region tenancy in the same codebase',
        'Maintained and enhanced a WPF application and AngularJS site for reorganizing organizations, migrating both to a shared codebase',
        'Enhanced an HR position-evaluation site (JavaScript, NHibernate, SQL), redesigning base data so users can modify it',
        'Built an internal employee recognition tool with AngularJS, RequireJS, REST APIs, Entity Framework, and SQL Server Data Tools',
      ],
      villain: 'THE TECH DEBT TITAN',
      powers: ['C#', '.NET', 'AngularJS', 'NHibernate', 'WPF', 'SQL Server'],
    },
    {
      company: 'Healthation',
      role: 'Software Engineer II',
      period: 'Jun 2007 - Apr 2013',
      location: 'Lisle, IL',
      achievements: [
        'Architected the ability for manual QA testers to create reusable automated scripts',
        'Developed a multi-threaded deployment utility standardizing delivery of SQL scripts, ASP web code, SSIS packages, and file-system utilities, now run by non-technical staff',
        'Architected a WCF 4.0 API exposing Eligibility, Billing, and Claims Processing so turnkey clients can build their own portals',
        'Led an enhancement team of junior developers: mentoring, design decisions, and clarifying specs with Business Analysts',
        'Standardized SQL Server Agent jobs for multi-environment deployment, letting end users schedule batch processing',
        'Improved eligibility processing from 1 million records in 24 hours to under 2 hours',
        'Administered TFS 2010: defined the versioning methodology and maintained automated quality gates and check-in policies',
      ],
      villain: 'THE MANUAL MENACE',
      powers: ['C#', 'WCF', '.NET', 'SQL Server', 'SSIS', 'TFS'],
    },
  ],

  education: [
    {
      institution: 'Northern Illinois University',
      degree: 'B.S. Computer Science',
      year: '2007',
      highlights: ['DeKalb, IL'],
    },
  ],

  // Testimonials loaded from LinkedIn Recommendations
  testimonials: linkedInTestimonials,

  contact: {
    email: 'shawndillenbeck@gmail.com',
    phone: '(331) 454-0486',
    linkedin: 'https://www.linkedin.com/in/shawn-dillenbeck/',
    github: 'https://github.com/shawn-dilly',
    website: '',
    location: 'Bartlett, IL',
  },
};

export default resumeData;
