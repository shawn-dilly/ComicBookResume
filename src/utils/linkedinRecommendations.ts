import type { Testimonial } from '../types';

interface LinkedInRecommendation {
  firstName: string;
  lastName: string;
  company: string;
  jobTitle: string;
  text: string;
  creationDate: string;
  status: string;
}

// Generate a fun hero alias based on job title
function generateHeroAlias(jobTitle: string): string {
  const title = jobTitle.toLowerCase();

  if (title.includes('director') && title.includes('quality')) {
    return 'The Quality Guardian';
  }
  if (title.includes('director') && title.includes('program')) {
    return 'The Program Commander';
  }
  if (title.includes('director') && title.includes('technology')) {
    return 'The Tech Visionary';
  }
  if (title.includes('director')) {
    return 'The Strategic Director';
  }
  if (title.includes('principal')) {
    return 'The Code Sage';
  }
  if (title.includes('senior') && title.includes('full stack')) {
    return 'The Full Stack Hero';
  }
  if (title.includes('senior')) {
    return 'The Senior Sentinel';
  }
  if (title.includes('manager')) {
    return 'The Team Captain';
  }
  if (title.includes('lead')) {
    return 'The Tech Lead';
  }
  if (title.includes('architect')) {
    return 'The System Architect';
  }
  if (title.includes('engineer')) {
    return 'The Code Warrior';
  }
  if (title.includes('developer')) {
    return 'The Dev Champion';
  }

  return 'The Ally';
}

// Parse CSV content into recommendation objects
function parseCSV(csvContent: string): LinkedInRecommendation[] {
  const lines = csvContent.trim().split('\n');
  const recommendations: LinkedInRecommendation[] = [];

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Handle CSV with quoted fields containing commas
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current.trim()); // Push last field

    if (fields.length >= 7) {
      recommendations.push({
        firstName: fields[0],
        lastName: fields[1],
        company: fields[2],
        jobTitle: fields[3],
        text: fields[4],
        creationDate: fields[5],
        status: fields[6],
      });
    }
  }

  return recommendations;
}

// Transform LinkedIn recommendations to testimonial format
export function transformToTestimonials(recommendations: LinkedInRecommendation[]): Testimonial[] {
  return recommendations
    .filter(rec => rec.status === 'VISIBLE')
    .map(rec => ({
      name: `${rec.firstName} ${rec.lastName}`,
      role: `${rec.jobTitle}, ${rec.company}`,
      quote: rec.text.trim(),
      heroAlias: generateHeroAlias(rec.jobTitle),
    }));
}

// Load recommendations from CSV file content
export function loadRecommendationsFromCSV(csvContent: string): Testimonial[] {
  const recommendations = parseCSV(csvContent);
  return transformToTestimonials(recommendations);
}

// Export the raw parser for testing
export { parseCSV, generateHeroAlias };
