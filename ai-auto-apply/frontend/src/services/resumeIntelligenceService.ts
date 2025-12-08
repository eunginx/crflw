import userService, { UserProfile, JobPreferences } from './userService';
import { ResumeAnalysisService } from './resumeAnalysisService';
import { ResumeSkills, analyzeJobMatch } from '../utils/jobMatchingUtils';

// Types for resume intelligence integration
export interface ResumeIntelligence {
  extractedSkills: string[];
  suggestedKeywords: string[];
  suggestedHeadline: string;
  suggestedSummary: string;
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead';
  recommendedRoles: string[];
  industryInsights: {
    industry: string;
    commonSkills: string[];
    averageSalary: { min: number; max: number };
  };
}

export interface SkillToPreferenceMapping {
  skill: string;
  relatedKeywords: string[];
  suggestedLocations: string[];
  salaryAdjustment: { min: number; max: number };
}

class ResumeIntelligenceService {
  // Skill to keyword mappings for job preferences (Indian market)
  private static skillKeywordMappings: Record<string, SkillToPreferenceMapping> = {
    'JavaScript': {
      skill: 'JavaScript',
      relatedKeywords: ['Frontend Developer', 'React Developer', 'JavaScript Developer', 'Web Developer', 'Full Stack Developer'],
      suggestedLocations: ['Bengaluru, Karnataka', 'Mumbai, Maharashtra', 'Hyderabad, Telangana', 'Pune, Maharashtra', 'Chennai, Tamil Nadu'],
      salaryAdjustment: { min: 800000, max: 2000000 } // 8L - 20L INR
    },
    'React': {
      skill: 'React',
      relatedKeywords: ['React Developer', 'Frontend Developer', 'React.js Developer', 'UI Developer', 'Web Developer'],
      suggestedLocations: ['Bengaluru, Karnataka', 'Mumbai, Maharashtra', 'Hyderabad, Telangana', 'Pune, Maharashtra', 'Gurgaon, Haryana'],
      salaryAdjustment: { min: 1200000, max: 2800000 } // 12L - 28L INR
    },
    'Node.js': {
      skill: 'Node.js',
      relatedKeywords: ['Backend Developer', 'Node.js Developer', 'Full Stack Developer', 'API Developer'],
      suggestedLocations: ['Bengaluru, Karnataka', 'Mumbai, Maharashtra', 'Hyderabad, Telangana', 'Pune, Maharashtra', 'Chennai, Tamil Nadu'],
      salaryAdjustment: { min: 1000000, max: 2500000 } // 10L - 25L INR
    },
    'Python': {
      skill: 'Python',
      relatedKeywords: ['Python Developer', 'Backend Developer', 'Data Scientist', 'Machine Learning Engineer', 'Full Stack Developer'],
      suggestedLocations: ['Bengaluru, Karnataka', 'Mumbai, Maharashtra', 'Hyderabad, Telangana', 'Chennai, Tamil Nadu', 'Pune, Maharashtra'],
      salaryAdjustment: { min: 800000, max: 3000000 } // 8L - 30L INR
    },
    'Machine Learning': {
      skill: 'Machine Learning',
      relatedKeywords: ['Machine Learning Engineer', 'Data Scientist', 'AI Engineer', 'ML Developer', 'Research Scientist'],
      suggestedLocations: ['Bengaluru, Karnataka', 'Mumbai, Maharashtra', 'Hyderabad, Telangana', 'Chennai, Tamil Nadu', 'Pune, Maharashtra'],
      salaryAdjustment: { min: 1500000, max: 4000000 } // 15L - 40L INR
    },
    'AWS': {
      skill: 'AWS',
      relatedKeywords: ['Cloud Engineer', 'DevOps Engineer', 'AWS Developer', 'Cloud Architect', 'Solutions Architect'],
      suggestedLocations: ['Bengaluru, Karnataka', 'Mumbai, Maharashtra', 'Hyderabad, Telangana', 'Pune, Maharashtra', 'Chennai, Tamil Nadu'],
      salaryAdjustment: { min: 1200000, max: 3500000 } // 12L - 35L INR
    },
    'Docker': {
      skill: 'Docker',
      relatedKeywords: ['DevOps Engineer', 'Cloud Engineer', 'Backend Developer', 'Full Stack Developer', 'Platform Engineer'],
      suggestedLocations: ['Bengaluru, Karnataka', 'Mumbai, Maharashtra', 'Hyderabad, Telangana', 'Pune, Maharashtra', 'Chennai, Tamil Nadu'],
      salaryAdjustment: { min: 1000000, max: 2800000 } // 10L - 28L INR
    },
    'TypeScript': {
      skill: 'TypeScript',
      relatedKeywords: ['TypeScript Developer', 'Frontend Developer', 'React Developer', 'Angular Developer', 'Full Stack Developer'],
      suggestedLocations: ['Bengaluru, Karnataka', 'Mumbai, Maharashtra', 'Hyderabad, Telangana', 'Pune, Maharashtra', 'Gurgaon, Haryana'],
      salaryAdjustment: { min: 1200000, max: 3000000 } // 12L - 30L INR
    }
  };

  // AI-powered resume analysis using Ollama
  static async analyzeResumeIntelligence(resumeText: string): Promise<ResumeIntelligence> {
    try {
      console.log('🤖 Starting AI-powered resume intelligence analysis...');
      
      // First extract basic info using existing service
      const basicAnalysis = ResumeAnalysisService.extractResumeInfo(resumeText);
      
      // Use AI for enhanced analysis
      const aiPrompt = `Analyze this resume and provide comprehensive intelligence insights for the Indian job market.

Resume Text:
${resumeText}

Extracted Skills: ${basicAnalysis.skills.join(', ')}

Return ONLY valid JSON with EXACTLY this structure:
{
  "suggestedHeadline": "Professional headline based on skills and experience",
  "suggestedSummary": "2-3 sentence professional summary highlighting key strengths",
  "experienceLevel": "entry|mid|senior|lead based on years and responsibilities",
  "recommendedRoles": ["role1", "role2", "role3"],
  "industryInsights": {
    "industry": "Primary industry in Indian context",
    "commonSkills": ["skill1", "skill2", "skill3"],
    "averageSalary": {"min": 600000, "max": 2500000}
  },
  "suggestedKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}

Rules:
- Experience level: entry (0-2 years), mid (2-5 years), senior (5-10 years), lead (10+ years)
- Suggested roles should be realistic for the Indian tech industry
- Salary ranges must be in INR (Indian Rupees) reflecting current Indian market rates:
  * Entry level: 4L - 8L INR
  * Mid level: 8L - 15L INR  
  * Senior level: 15L - 30L INR
  * Lead level: 25L - 50L+ INR
- Keywords should be relevant for job searches in the Indian tech market
- Consider major Indian tech hubs: Bengaluru, Mumbai, Hyderabad, Pune, Chennai, Gurgaon
- Industry should reflect Indian tech sector categories`;

      const response = await fetch('http://localhost:9000/api/ai/ollama/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3.1:70b',
          prompt: aiPrompt,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.status}`);
      }

      const aiResult = await response.json();
      console.log('🤖 AI Response received:', aiResult);

      // Parse AI response
      let aiIntelligence;
      try {
        // Extract JSON from response
        const jsonMatch = aiResult.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiIntelligence = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in AI response');
        }
      } catch (parseError) {
        console.warn('⚠️ Failed to parse AI response, using fallback:', parseError);
        return this.getFallbackAnalysis(basicAnalysis);
      }

      // Validate and combine with basic analysis
      return {
        extractedSkills: basicAnalysis.skills,
        suggestedKeywords: aiIntelligence.suggestedKeywords || this.generateSuggestedKeywords(basicAnalysis.skills),
        suggestedHeadline: aiIntelligence.suggestedHeadline || this.generateHeadline(basicAnalysis.skills, 'mid'),
        suggestedSummary: aiIntelligence.suggestedSummary || this.generateSummary(basicAnalysis, 'mid'),
        experienceLevel: aiIntelligence.experienceLevel || this.determineExperienceLevel(resumeText, basicAnalysis),
        recommendedRoles: aiIntelligence.recommendedRoles || this.getRecommendedRoles(basicAnalysis.skills, 'mid'),
        industryInsights: aiIntelligence.industryInsights || this.getIndustryInsights(basicAnalysis.skills)
      };

    } catch (error) {
      console.error('❌ AI analysis failed, using fallback:', error);
      const basicAnalysis = ResumeAnalysisService.extractResumeInfo(resumeText);
      return this.getFallbackAnalysis(basicAnalysis);
    }
  }

  // Fallback analysis when AI is unavailable
  private static getFallbackAnalysis(analysis: any): ResumeIntelligence {
    const experienceLevel = this.determineExperienceLevel('', analysis);
    
    return {
      extractedSkills: analysis.skills,
      suggestedKeywords: this.generateSuggestedKeywords(analysis.skills),
      suggestedHeadline: this.generateHeadline(analysis.skills, experienceLevel),
      suggestedSummary: this.generateSummary(analysis, experienceLevel),
      experienceLevel,
      recommendedRoles: this.getRecommendedRoles(analysis.skills, experienceLevel),
      industryInsights: this.getIndustryInsights(analysis.skills)
    };
  }

  // Sync extracted skills with user preferences
  static async syncSkillsToPreferences(email: string, skills: string[]): Promise<JobPreferences> {
    try {
      // Get current preferences
      const currentPrefs = await userService.getJobPreferences(email);
      
      // Generate enhanced keywords from skills
      const enhancedKeywords = this.generateEnhancedKeywords(skills);
      
      // Get salary suggestions based on skills
      const salarySuggestions = this.getSalarySuggestions(skills);
      
      // Get location suggestions based on skills
      const locationSuggestions = this.getLocationSuggestions(skills);
      
      // Update preferences with intelligent suggestions
      const updatedPreferences: Partial<JobPreferences> = {
        keywords: enhancedKeywords.join(', '),
        salaryMin: Math.max(salarySuggestions.min, currentPrefs.salaryMin || 0),
        salaryMax: Math.max(salarySuggestions.max, currentPrefs.salaryMax || 0),
        locations: locationSuggestions.join(', ') || currentPrefs.locations,
        // Preserve existing job types, industries, etc.
        jobTypes: currentPrefs.jobTypes || ['full-time', 'contract'],
        industries: currentPrefs.industries || [],
        companySizes: currentPrefs.companySizes || []
      };

      return await userService.updateJobPreferences(email, updatedPreferences);
    } catch (error) {
      console.error('Error syncing skills to preferences:', error);
      throw error;
    }
  }

  // Sync AI analysis to user profile
  static async syncAnalysisToProfile(email: string, intelligence: ResumeIntelligence): Promise<UserProfile> {
    try {
      // Get current profile
      const currentProfile = await userService.getProfile(email);
      
      // Update profile with AI-generated content
      const updatedProfile: Partial<UserProfile> = {
        headline: intelligence.suggestedHeadline,
        summary: intelligence.suggestedSummary,
        skills: intelligence.extractedSkills,
        // Preserve other profile fields
        firstName: currentProfile.firstName,
        lastName: currentProfile.lastName,
        phone: currentProfile.phone,
        location: currentProfile.location,
        linkedinUrl: currentProfile.linkedinUrl,
        githubUrl: currentProfile.githubUrl,
        portfolioUrl: currentProfile.portfolioUrl
      };

      return await userService.updateProfile(email, updatedProfile);
    } catch (error) {
      console.error('Error syncing analysis to profile:', error);
      throw error;
    }
  }

  // Helper methods
  private static determineExperienceLevel(resumeText: string, analysis: any): 'entry' | 'mid' | 'senior' | 'lead' {
    const text = resumeText.toLowerCase();
    const wordCount = resumeText.split(/\s+/).length;
    const skillCount = analysis.skills.length;
    
    // Look for experience indicators
    const yearsExperience = this.extractYearsExperience(text);
    
    if (yearsExperience >= 10 || skillCount >= 10) return 'lead';
    if (yearsExperience >= 5 || skillCount >= 7) return 'senior';
    if (yearsExperience >= 2 || skillCount >= 5) return 'mid';
    return 'entry';
  }

  private static extractYearsExperience(text: string): number {
    const patterns = [
      /(\d+)\+?\s*years?\s*(?:of\s*)?experience/i,
      /(\d+)\s*\+?\s*years?/i,
      /experience\s*[:\-]?\s*(\d+)/i
    ];

    let maxYears = 0;
    patterns.forEach(pattern => {
      const match = text.match(pattern);
      if (match) {
        const years = parseInt(match[1]);
        if (years > maxYears) maxYears = years;
      }
    });

    return maxYears;
  }

  private static generateHeadline(skills: string[], experienceLevel: string): string {
    if (skills.length === 0) return 'Professional';

    // Find primary skill category
    const primarySkill = this.getPrimarySkill(skills);
    const levelPrefix = this.getExperienceLevelPrefix(experienceLevel);
    
    return `${levelPrefix} ${primarySkill} Developer`;
  }

  private static getPrimarySkill(skills: string[]): string {
    // Priority order for primary skills
    const prioritySkills = [
      'Machine Learning', 'React', 'Angular', 'Vue.js', 'Node.js', 
      'Python', 'Java', 'C++', 'JavaScript', 'TypeScript', 'AWS', 'Docker'
    ];

    for (const priority of prioritySkills) {
      if (skills.some(skill => skill.toLowerCase().includes(priority.toLowerCase()))) {
        return priority;
      }
    }

    // Return first skill if no priority match
    return skills[0] || 'Software';
  }

  private static getExperienceLevelPrefix(level: string): string {
    switch (level) {
      case 'lead': return 'Lead';
      case 'senior': return 'Senior';
      case 'mid': return 'Mid-Level';
      case 'entry': return 'Junior';
      default: return '';
    }
  }

  private static generateSummary(analysis: any, experienceLevel: string): string {
    const skills = analysis.skills.slice(0, 5).join(', ');
    const yearsText = this.getExperienceYearsText(experienceLevel);
    
    return `${yearsText} software developer with expertise in ${skills}. Passionate about building scalable applications and solving complex problems. Strong background in modern development practices and collaborative team environments.`;
  }

  private static getExperienceYearsText(level: string): string {
    switch (level) {
      case 'lead': return '10+ years';
      case 'senior': return '5+ years';
      case 'mid': return '2+ years';
      case 'entry': return 'Recent graduate';
      default: return 'Experienced';
    }
  }

  private static getRecommendedRoles(skills: string[], experienceLevel: string): string[] {
    const roles: string[] = [];
    
    // Map skills to roles
    if (skills.some(s => s.includes('React') || s.includes('Angular') || s.includes('Vue'))) {
      roles.push('Frontend Developer', 'UI Developer');
    }
    
    if (skills.some(s => s.includes('Node.js') || s.includes('Python') || s.includes('Java'))) {
      roles.push('Backend Developer', 'API Developer');
    }
    
    if (skills.some(s => s.includes('Machine Learning') || s.includes('Data Science'))) {
      roles.push('Data Scientist', 'Machine Learning Engineer');
    }
    
    if (skills.some(s => s.includes('AWS') || s.includes('Docker') || s.includes('Kubernetes'))) {
      roles.push('DevOps Engineer', 'Cloud Engineer');
    }

    // Add experience-level specific roles
    switch (experienceLevel) {
      case 'lead':
        roles.push('Tech Lead', 'Engineering Manager');
        break;
      case 'senior':
        roles.push('Senior Developer', 'Principal Engineer');
        break;
    }

    return Array.from(new Set(roles)); // Remove duplicates
  }

  private static getIndustryInsights(skills: string[]): ResumeIntelligence['industryInsights'] {
    // Determine primary industry based on skills (Indian context)
    if (skills.some(s => s.includes('Machine Learning') || s.includes('Data Science'))) {
      return {
        industry: 'Technology/Artificial Intelligence',
        commonSkills: ['Python', 'Machine Learning', 'TensorFlow', 'PyTorch', 'Data Analysis'],
        averageSalary: { min: 1500000, max: 4000000 } // 15L - 40L INR
      };
    }
    
    if (skills.some(s => s.includes('AWS') || s.includes('Docker') || s.includes('Kubernetes'))) {
      return {
        industry: 'Technology/Cloud Computing',
        commonSkills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Infrastructure as Code'],
        averageSalary: { min: 1200000, max: 3500000 } // 12L - 35L INR
      };
    }

    return {
      industry: 'Technology/Software Development',
      commonSkills: ['JavaScript', 'React', 'Node.js', 'Python', 'Agile'],
      averageSalary: { min: 800000, max: 2500000 } // 8L - 25L INR
    };
  }

  private static generateSuggestedKeywords(skills: string[]): string[] {
    const keywords: string[] = [];
    
    skills.forEach(skill => {
      const mapping = this.skillKeywordMappings[skill];
      if (mapping) {
        keywords.push(...mapping.relatedKeywords);
      } else {
        keywords.push(skill);
      }
    });

    return Array.from(new Set(keywords)); // Remove duplicates
  }

  private static generateEnhancedKeywords(skills: string[]): string[] {
    const keywords = new Set<string>();
    
    skills.forEach(skill => {
      keywords.add(skill);
      const mapping = this.skillKeywordMappings[skill];
      if (mapping) {
        mapping.relatedKeywords.forEach(keyword => keywords.add(keyword));
      }
    });

    return Array.from(keywords);
  }

  private static getSalarySuggestions(skills: string[]): { min: number; max: number } {
    let totalMin = 0;
    let totalMax = 0;
    let count = 0;

    skills.forEach(skill => {
      const mapping = this.skillKeywordMappings[skill];
      if (mapping) {
        totalMin += mapping.salaryAdjustment.min;
        totalMax += mapping.salaryAdjustment.max;
        count++;
      }
    });

    if (count === 0) {
      return { min: 600000, max: 1500000 }; // Default range: 6L - 15L INR
    }

    return {
      min: Math.round(totalMin / count),
      max: Math.round(totalMax / count)
    };
  }

  private static getLocationSuggestions(skills: string[]): string[] {
    const locations = new Set<string>();
    
    skills.forEach(skill => {
      const mapping = this.skillKeywordMappings[skill];
      if (mapping) {
        mapping.suggestedLocations.forEach(location => locations.add(location));
      }
    });

    return Array.from(locations);
  }

  // Convert resume analysis to ResumeSkills format for job matching
  static convertToResumeSkills(analysis: any): ResumeSkills {
    const skills: ResumeSkills = {
      technical: [],
      soft: [],
      experience: [],
      certifications: []
    };

    try {
      // Extract from analysis.skills array
      if (analysis?.skills && Array.isArray(analysis.skills)) {
        skills.technical = analysis.skills.filter((skill: string) => 
          this.isTechnicalSkill(skill)
        );
        skills.soft = analysis.skills.filter((skill: string) => 
          this.isSoftSkill(skill)
        );
      }

      // Extract from analysis.sections if available
      if (analysis?.sections) {
        if (analysis.sections.experience) {
          skills.experience = this.extractExperienceSkills(analysis.sections.experience);
        }
        if (analysis.sections.education) {
          skills.technical.push(...this.extractEducationSkills(analysis.sections.education));
        }
      }

      // Extract certifications
      if (analysis?.contactInfo?.certifications) {
        skills.certifications = Array.isArray(analysis.contactInfo.certifications) 
          ? analysis.contactInfo.certifications 
          : [analysis.contactInfo.certifications];
      }

      // Clean and deduplicate
      (Object.keys(skills) as Array<keyof ResumeSkills>).forEach(key => {
        skills[key] = Array.from(new Set(skills[key]));
      });

    } catch (error) {
      console.error('❌ Error converting resume analysis to skills:', error);
    }

    return skills;
  }

  // Enhanced job matching using resume intelligence
  static analyzeJobMatchWithResume(job: any, resumeAnalysis: any) {
    const resumeSkills = this.convertToResumeSkills(resumeAnalysis);
    return analyzeJobMatch(job, resumeSkills);
  }

  // Generate cover letter highlights based on job-resume match
  static generateCoverLetterHighlights(job: any, resumeAnalysis: any): string[] {
    const highlights: string[] = [];
    const resumeSkills = this.convertToResumeSkills(resumeAnalysis);
    const jobAnalysis = analyzeJobMatch(job, resumeSkills);
    
    // Extract matching skills from job analysis
    const matchingSkills = jobAnalysis.reasons
      .filter(reason => reason.type === 'skill' && reason.matched)
      .map(reason => reason.text)
      .filter(text => text.includes('Matching skills:'))
      .map(text => text.replace('Matching skills: ', ''));

    if (matchingSkills.length > 0) {
      highlights.push(`My expertise in ${matchingSkills.join(', ')} aligns perfectly with your requirements.`);
    }

    // Add experience highlights
    if (resumeAnalysis?.experienceLevel && resumeAnalysis.experienceLevel !== 'entry') {
      highlights.push(`With ${resumeAnalysis.experienceLevel} level experience, I bring valuable insights to your team.`);
    }

    // Add achievement highlights
    if (resumeAnalysis?.sections?.experience) {
      highlights.push('I have a proven track record of delivering successful projects and meeting deadlines.');
    }

    return highlights;
  }

  // Private helper methods for skill classification
  private static isTechnicalSkill(skill: string): boolean {
    const technicalKeywords = [
      'react', 'vue', 'angular', 'javascript', 'typescript', 'node', 'python', 'java', 'c++', 'c#',
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ci/cd', 'git',
      'sql', 'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch',
      'html', 'css', 'sass', 'webpack', 'vite', 'next.js', 'express', 'django', 'flask'
    ];
    return technicalKeywords.some(keyword => 
      skill.toLowerCase().includes(keyword)
    );
  }

  private static isSoftSkill(skill: string): boolean {
    const softKeywords = [
      'leadership', 'communication', 'teamwork', 'problem solving', 'agile', 'scrum',
      'project management', 'collaboration', 'analytical', 'creative', 'detail-oriented'
    ];
    return softKeywords.some(keyword => 
      skill.toLowerCase().includes(keyword)
    );
  }

  private static extractExperienceSkills(experience: any): string[] {
    const skills: string[] = [];
    if (typeof experience === 'string') {
      const techKeywords = ['react', 'node', 'python', 'aws', 'docker', 'sql', 'javascript'];
      techKeywords.forEach(keyword => {
        if (experience.toLowerCase().includes(keyword)) {
          skills.push(keyword);
        }
      });
    }
    return skills;
  }

  private static extractEducationSkills(education: any): string[] {
    const skills: string[] = [];
    if (typeof education === 'string') {
      const eduKeywords = ['computer science', 'engineering', 'mathematics', 'data science'];
      eduKeywords.forEach(keyword => {
        if (education.toLowerCase().includes(keyword)) {
          skills.push(keyword);
        }
      });
    }
    return skills;
  }
}

export default ResumeIntelligenceService;
