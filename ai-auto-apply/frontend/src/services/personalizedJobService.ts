import { useUser } from '../context/UserContext';
import { analyzeJobMatch, JobMatchAnalysis, MatchReason } from '../utils/jobMatchingUtils';

// Types for personalized job matching
export interface PersonalizedJobFilters {
  keywords: string[];
  locations: string[];
  salaryMin: number;
  salaryMax: number;
  jobTypes: string[];
  industries: string[];
  companySizes: string[];
  skills: string[];
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead';
  remoteOnly: boolean;
}

export interface PersonalizedMatch extends JobMatchAnalysis {
  personalizedScore: number;
  preferenceMatches: {
    keywords: number;
    location: number;
    salary: number;
    jobType: number;
    industry: number;
    skills: number;
    experience: number;
  };
  improvementSuggestions: string[];
  recommendedActions: string[];
}

export interface JobInsight {
  type: 'strength' | 'gap' | 'opportunity' | 'warning';
  title: string;
  description: string;
  actionable: boolean;
  priority: 'high' | 'medium' | 'low';
}

class PersonalizedJobService {
  // Get personalized filters from user context
  static getPersonalizedFilters(user: any): PersonalizedJobFilters {
    const preferences = user.preferences || {};
    const profile = user.profile || {};
    
    return {
      keywords: this.parseKeywords(preferences.keywords || ''),
      locations: this.parseLocations(preferences.locations || ''),
      salaryMin: preferences.salaryMin || 0,
      salaryMax: preferences.salaryMax || 200000,
      jobTypes: preferences.jobTypes || ['full-time'],
      industries: preferences.industries || [],
      companySizes: preferences.companySizes || [],
      skills: profile.skills || [],
      experienceLevel: this.determineExperienceLevel(profile.summary || '', profile.skills || []),
      remoteOnly: preferences.remoteOnly || false
    };
  }

  // Analyze job with personalization
  static analyzePersonalizedMatch(job: any, user: any): PersonalizedMatch {
    const filters = this.getPersonalizedFilters(user);
    const baseAnalysis = analyzeJobMatch(job);
    
    // Calculate preference matches
    const preferenceMatches = this.calculatePreferenceMatches(job, filters);
    
    // Calculate personalized score (base score + preference adjustments)
    const personalizedScore = this.calculatePersonalizedScore(
      baseAnalysis.score,
      preferenceMatches,
      filters
    );
    
    // Generate improvement suggestions
    const improvementSuggestions = this.generateImprovementSuggestions(
      job,
      filters,
      preferenceMatches
    );
    
    // Generate recommended actions
    const recommendedActions = this.generateRecommendedActions(
      job,
      filters,
      personalizedScore
    );

    return {
      ...baseAnalysis,
      personalizedScore,
      preferenceMatches,
      improvementSuggestions,
      recommendedActions
    };
  }

  // Filter jobs based on user preferences
  static filterJobsByPreferences(jobs: any[], user: any): any[] {
    const filters = this.getPersonalizedFilters(user);
    
    return jobs.filter(job => {
      // Keyword matching
      if (filters.keywords.length > 0) {
        const jobText = `${job.title} ${job.description || ''}`.toLowerCase();
        const hasKeywordMatch = filters.keywords.some(keyword =>
          jobText.includes(keyword.toLowerCase())
        );
        if (!hasKeywordMatch) return false;
      }
      
      // Location filtering
      if (filters.locations.length > 0 && !filters.remoteOnly) {
        const locationMatch = filters.locations.some(location =>
          job.location?.toLowerCase().includes(location.toLowerCase())
        );
        if (!locationMatch && !job.location?.toLowerCase().includes('remote')) return false;
      }
      
      // Remote preference
      if (filters.remoteOnly && !job.location?.toLowerCase().includes('remote')) {
        return false;
      }
      
      // Salary filtering (if salary info available)
      if (job.salaryMin && job.salaryMin > filters.salaryMax) return false;
      if (job.salaryMax && job.salaryMax < filters.salaryMin) return false;
      
      return true;
    });
  }

  // Sort jobs by personalized relevance
  static sortJobsByPersonalization(jobs: any[], user: any): any[] {
    return jobs
      .map(job => ({
        ...job,
        personalizedAnalysis: this.analyzePersonalizedMatch(job, user)
      }))
      .sort((a, b) => b.personalizedAnalysis.personalizedScore - a.personalizedAnalysis.personalizedScore);
  }

  // Generate job insights for user
  static generateJobInsights(jobs: any[], user: any): JobInsight[] {
    const insights: JobInsight[] = [];
    const filters = this.getPersonalizedFilters(user);
    
    // Analyze job market for user's skills
    const skillDemand = this.analyzeSkillDemand(jobs, filters.skills);
    insights.push(...skillDemand);
    
    // Analyze salary expectations
    const salaryInsights = this.analyzeSalaryExpectations(jobs, filters);
    insights.push(...salaryInsights);
    
    // Analyze location opportunities
    const locationInsights = this.analyzeLocationOpportunities(jobs, filters);
    insights.push(...locationInsights);
    
    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Helper methods
  private static parseKeywords(keywords: string): string[] {
    return keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
  }

  private static parseLocations(locations: string): string[] {
    return locations.split(',').map(l => l.trim()).filter(l => l.length > 0);
  }

  private static determineExperienceLevel(summary: string, skills: string[]): 'entry' | 'mid' | 'senior' | 'lead' {
    const text = `${summary} ${skills.join(' ')}`.toLowerCase();
    
    if (text.includes('lead') || text.includes('principal') || text.includes('architect') || text.includes('10+')) {
      return 'lead';
    }
    if (text.includes('senior') || text.includes('5+') || text.includes('manager')) {
      return 'senior';
    }
    if (text.includes('mid') || text.includes('2+') || text.includes('3+')) {
      return 'mid';
    }
    return 'entry';
  }

  private static calculatePreferenceMatches(job: any, filters: PersonalizedJobFilters) {
    const matches = {
      keywords: 0,
      location: 0,
      salary: 0,
      jobType: 0,
      industry: 0,
      skills: 0,
      experience: 0
    };

    // Keyword matching
    if (filters.keywords.length > 0) {
      const jobText = `${job.title} ${job.description || ''}`.toLowerCase();
      const matchedKeywords = filters.keywords.filter(keyword =>
        jobText.includes(keyword.toLowerCase())
      );
      matches.keywords = (matchedKeywords.length / filters.keywords.length) * 100;
    }

    // Location matching
    if (filters.locations.length > 0) {
      const locationMatch = filters.locations.some(location =>
        job.location?.toLowerCase().includes(location.toLowerCase())
      );
      matches.location = locationMatch ? 100 : 0;
    } else if (job.location?.toLowerCase().includes('remote')) {
      matches.location = 100;
    }

    // Salary matching
    if (job.salaryMin && job.salaryMax) {
      const salaryRange = job.salaryMax - job.salaryMin;
      const userRange = filters.salaryMax - filters.salaryMin;
      const overlap = Math.min(job.salaryMax, filters.salaryMax) - Math.max(job.salaryMin, filters.salaryMin);
      matches.salary = overlap > 0 ? (overlap / Math.max(salaryRange, userRange)) * 100 : 0;
    }

    // Skills matching
    if (filters.skills.length > 0 && job.description) {
      const jobText = job.description.toLowerCase();
      const matchedSkills = filters.skills.filter(skill =>
        jobText.includes(skill.toLowerCase())
      );
      matches.skills = (matchedSkills.length / filters.skills.length) * 100;
    }

    return matches;
  }

  private static calculatePersonalizedScore(
    baseScore: number,
    preferenceMatches: any,
    filters: PersonalizedJobFilters
  ): number {
    // Weight different factors
    const weights = {
      base: 0.4,
      keywords: 0.2,
      location: 0.15,
      salary: 0.1,
      skills: 0.15
    };

    const weightedScore = 
      baseScore * weights.base +
      preferenceMatches.keywords * weights.keywords +
      preferenceMatches.location * weights.location +
      preferenceMatches.salary * weights.salary +
      preferenceMatches.skills * weights.skills;

    return Math.round(Math.min(100, weightedScore));
  }

  private static generateImprovementSuggestions(
    job: any,
    filters: PersonalizedJobFilters,
    preferenceMatches: any
  ): string[] {
    const suggestions: string[] = [];

    if (preferenceMatches.keywords < 50) {
      suggestions.push('Consider updating your keywords to better match jobs like this');
    }

    if (preferenceMatches.skills < 30) {
      suggestions.push('Develop skills mentioned in this job description to improve match');
    }

    if (preferenceMatches.location === 0 && !job.location?.toLowerCase().includes('remote')) {
      suggestions.push('Consider remote work or expanding location preferences');
    }

    if (filters.salaryMin > 0 && job.salaryMax && job.salaryMax < filters.salaryMin) {
      suggestions.push('Review salary expectations for this role type');
    }

    return suggestions.slice(0, 3); // Limit to top 3 suggestions
  }

  private static generateRecommendedActions(
    job: any,
    filters: PersonalizedJobFilters,
    personalizedScore: number
  ): string[] {
    const actions: string[] = [];

    if (personalizedScore >= 80) {
      actions.push('Apply immediately - high match score');
      actions.push('Customize resume for this specific role');
    } else if (personalizedScore >= 60) {
      actions.push('Apply with tailored application');
      actions.push('Highlight relevant skills in cover letter');
    } else if (personalizedScore >= 40) {
      actions.push('Consider if role aligns with career goals');
      actions.push('Network to learn more about the position');
    } else {
      actions.push('Focus on skill development first');
      actions.push('Save for future reference if skills align');
    }

    return actions;
  }

  private static analyzeSkillDemand(jobs: any[], userSkills: string[]): JobInsight[] {
    const insights: JobInsight[] = [];
    const skillFrequency: Record<string, number> = {};

    jobs.forEach(job => {
      const jobText = `${job.title} ${job.description || ''}`.toLowerCase();
      userSkills.forEach(skill => {
        if (jobText.includes(skill.toLowerCase())) {
          skillFrequency[skill] = (skillFrequency[skill] || 0) + 1;
        }
      });
    });

    const totalJobs = jobs.length;
    Object.entries(skillFrequency).forEach(([skill, count]) => {
      const percentage = (count / totalJobs) * 100;
      
      if (percentage >= 50) {
        insights.push({
          type: 'strength',
          title: `${skill} is in high demand`,
          description: `${percentage.toFixed(0)}% of jobs mention ${skill}. This is your strongest marketable skill.`,
          actionable: false,
          priority: 'high'
        });
      } else if (percentage < 20) {
        insights.push({
          type: 'gap',
          title: `Limited demand for ${skill}`,
          description: `Only ${percentage.toFixed(0)}% of jobs mention ${skill}. Consider developing more in-demand skills.`,
          actionable: true,
          priority: 'medium'
        });
      }
    });

    return insights;
  }

  private static analyzeSalaryExpectations(jobs: any[], filters: PersonalizedJobFilters): JobInsight[] {
    const insights: JobInsight[] = [];
    const jobsWithSalary = jobs.filter(job => job.salaryMin || job.salaryMax);
    
    if (jobsWithSalary.length > 0) {
      const avgSalary = jobsWithSalary.reduce((sum, job) => {
        const salary = job.salaryMax || job.salaryMin || 0;
        return sum + salary;
      }, 0) / jobsWithSalary.length;

      if (filters.salaryMin > avgSalary * 1.2) {
        insights.push({
          type: 'warning',
          title: 'Salary expectations above market rate',
          description: `Average salary is $${Math.round(avgSalary).toLocaleString()}, but you're looking for $${filters.salaryMin.toLocaleString()}.`,
          actionable: true,
          priority: 'high'
        });
      } else if (filters.salaryMax < avgSalary * 0.8) {
        insights.push({
          type: 'opportunity',
          title: 'You could be earning more',
          description: `Average salary is $${Math.round(avgSalary).toLocaleString()}, higher than your maximum of $${filters.salaryMax.toLocaleString()}.`,
          actionable: true,
          priority: 'medium'
        });
      }
    }

    return insights;
  }

  private static analyzeLocationOpportunities(jobs: any[], filters: PersonalizedJobFilters): JobInsight[] {
    const insights: JobInsight[] = [];
    
    if (filters.locations.length > 0) {
      const locationCounts: Record<string, number> = {};
      
      jobs.forEach(job => {
        if (job.location) {
          filters.locations.forEach(userLocation => {
            if (job.location.toLowerCase().includes(userLocation.toLowerCase())) {
              locationCounts[userLocation] = (locationCounts[userLocation] || 0) + 1;
            }
          });
        }
      });

      const bestLocation = Object.entries(locationCounts)
        .sort(([,a], [,b]) => b - a)[0];

      if (bestLocation && bestLocation[1] > 0) {
        insights.push({
          type: 'opportunity',
          title: `Most opportunities in ${bestLocation[0]}`,
          description: `${bestLocation[1]} jobs found in ${bestLocation[0]}. Consider focusing your search here.`,
          actionable: false,
          priority: 'medium'
        });
      }
    }

    return insights;
  }
}

export default PersonalizedJobService;
