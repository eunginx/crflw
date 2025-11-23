// Smart Search Utilities

import Fuse from 'fuse.js';

export interface SearchFilters {
  query: string;
  searchBy: 'all' | 'title' | 'company' | 'location' | 'keywords';
}

// Configure Fuse.js options
const fuseOptions = {
  keys: ['title', 'company', 'location', 'description'],
  threshold: 0.4, // Lower threshold = stricter matching
  includeScore: true,
  minMatchCharLength: 2,
  ignoreLocation: true,
  shouldSort: true,
  findAllMatches: true,
};

// Search job by multiple fields using Fuse.js
export const searchJob = (job: {
  title: string;
  company: string;
  location?: string;
  description?: string;
}, filters: SearchFilters): number => {
  if (!filters.query) return 1;

  const { query, searchBy } = filters;

  // Create a single job array for Fuse
  const jobs = [job];

  // Configure keys based on search type
  let keys = ['title', 'company', 'location', 'description'];

  switch (searchBy) {
    case 'title':
      keys = ['title'];
      break;
    case 'company':
      keys = ['company'];
      break;
    case 'location':
      keys = ['location'];
      break;
    case 'keywords':
      keys = ['title', 'description'];
      break;
    case 'all':
    default:
      keys = ['title', 'company', 'location', 'description'];
      break;
  }

  const fuse = new Fuse(jobs, { ...fuseOptions, keys });
  const results = fuse.search(query);

  if (results.length === 0) return 0;

  // Fuse score is lower = better match, so we invert it
  const score = results[0].score || 0;
  return 1 - score; // Convert to 0-1 scale where 1 = perfect match
};

// Filter and sort jobs based on search
export const filterJobsBySearch = (
  jobs: any[],
  filters: SearchFilters,
  minScore: number = 0.3
): any[] => {
  if (!filters.query) return jobs;

  // Use Fuse.js for batch searching
  let keys = ['title', 'company', 'location', 'description'];

  switch (filters.searchBy) {
    case 'title':
      keys = ['title'];
      break;
    case 'company':
      keys = ['company'];
      break;
    case 'location':
      keys = ['location'];
      break;
    case 'keywords':
      keys = ['title', 'description'];
      break;
    case 'all':
    default:
      keys = ['title', 'company', 'location', 'description'];
      break;
  }

  const fuse = new Fuse(jobs, { ...fuseOptions, keys });
  const results = fuse.search(filters.query);

  // Map back to job objects with search scores
  return results.map(result => ({
    ...result.item,
    searchScore: 1 - (result.score || 0)
  }));
};

// Get search suggestions based on current jobs
export const getSearchSuggestions = (jobs: any[], query: string, limit: number = 5): string[] => {
  if (!query || query.length < 2) return [];

  const suggestions = new Set<string>();
  const queryLower = query.toLowerCase();

  jobs.forEach(job => {
    // Check title suggestions
    const titleWords = job.title.toLowerCase().split(/\s+/);
    titleWords.forEach((word: string) => {
      if (word.includes(queryLower) && word.length > query.length) {
        suggestions.add(word);
      }
    });

    // Check company suggestions
    if (job.company.toLowerCase().includes(queryLower)) {
      suggestions.add(job.company);
    }

    // Check location suggestions
    if (job.location && job.location.toLowerCase().includes(queryLower)) {
      suggestions.add(job.location);
    }
  });

  return Array.from(suggestions).slice(0, limit);
};

// Highlight search query in text
export const highlightSearchQuery = (text: string, query: string): string => {
  if (!query) return text;

  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
};
