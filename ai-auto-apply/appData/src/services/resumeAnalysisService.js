import { pool } from '../db.js';

export class ResumeAnalysisService {
  /**
   * Extract contact information from resume text
   */
  static extractContactInfo(text) {
    const contactInfo = {
      name: null,
      email: null,
      phone: null,
      linkedin: null,
      github: null,
      portfolio: null
    };

    // Email regex pattern
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = text.match(emailRegex);
    if (emails && emails.length > 0) {
      contactInfo.email = emails[0];
    }

    // Phone regex patterns
    const phoneRegexes = [
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // 123-456-7890 or 123.456.7890
      /\b\(\d{3}\)\s*\d{3}[-.]?\d{4}\b/g, // (123) 456-7890
      /\b\d{10}\b/g // 1234567890
    ];

    for (const regex of phoneRegexes) {
      const phones = text.match(regex);
      if (phones && phones.length > 0) {
        contactInfo.phone = phones[0];
        break;
      }
    }

    // LinkedIn regex
    const linkedinRegex = /linkedin\.com\/in\/[\w-]+/gi;
    const linkedinMatch = text.match(linkedinRegex);
    if (linkedinMatch && linkedinMatch.length > 0) {
      contactInfo.linkedin = linkedinMatch[0];
    }

    // GitHub regex
    const githubRegex = /github\.com\/[\w-]+/gi;
    const githubMatch = text.match(githubRegex);
    if (githubMatch && githubMatch.length > 0) {
      contactInfo.github = githubMatch[0];
    }

    // Portfolio/Website regex
    const portfolioRegex = /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[\w-]*)*\/?/gi;
    const portfolioMatches = text.match(portfolioRegex);
    if (portfolioMatches && portfolioMatches.length > 0) {
      // Filter out LinkedIn and GitHub URLs
      const portfolio = portfolioMatches.find(url => 
        !url.includes('linkedin') && !url.includes('github')
      );
      if (portfolio) {
        contactInfo.portfolio = portfolio.startsWith('http') ? portfolio : `https://${portfolio}`;
      }
    }

    // Extract name (simplified - usually at the beginning of resume)
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      // Assume first line is name if it's 2-4 words and doesn't contain special characters
      if (firstLine.split(' ').length >= 2 && firstLine.split(' ').length <= 4 && 
          !firstLine.match(/[\d@]/) && firstLine.length < 50) {
        contactInfo.name = firstLine;
      }
    }

    return contactInfo;
  }

  /**
   * Extract skills from resume text
   */
  static extractSkills(text) {
    // Common technical skills keywords
    const skillKeywords = [
      // Programming Languages
      'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift',
      'kotlin', 'scala', 'perl', 'r', 'matlab', 'sql', 'html', 'css', 'sass', 'less',
      
      // Frameworks & Libraries
      'react', 'angular', 'vue', 'nodejs', 'express', 'django', 'flask', 'spring', 'rails',
      'laravel', 'symfony', 'jquery', 'bootstrap', 'tailwind', 'material ui', 'ant design',
      
      // Databases
      'mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'oracle', 'sql server', 'cassandra',
      'elasticsearch', 'firebase', 'supabase',
      
      // Cloud & DevOps
      'aws', 'azure', 'google cloud', 'gcp', 'docker', 'kubernetes', 'jenkins', 'gitlab ci',
      'github actions', 'terraform', 'ansible', 'nginx', 'apache',
      
      // Tools & Technologies
      'git', 'github', 'gitlab', 'bitbucket', 'jira', 'slack', 'trello', 'vs code', 'intellij',
      'figma', 'sketch', 'adobe', 'photoshop', 'illustrator',
      
      // Concepts
      'rest api', 'graphql', 'microservices', 'serverless', 'ci/cd', 'agile', 'scrum',
      'tdd', 'bdd', 'unit testing', 'integration testing', 'e2e testing',
      
      // Soft Skills
      'leadership', 'communication', 'teamwork', 'problem solving', 'critical thinking',
      'project management', 'time management', 'collaboration', 'adaptability'
    ];

    const foundSkills = new Set();
    const lowerText = text.toLowerCase();

    skillKeywords.forEach(skill => {
      if (lowerText.includes(skill)) {
        foundSkills.add(skill.charAt(0).toUpperCase() + skill.slice(1));
      }
    });

    return Array.from(foundSkills).sort();
  }

  /**
   * Detect resume sections
   */
  static detectSections(text) {
    const sections = {
      summary: false,
      experience: false,
      education: false,
      skills: false,
      projects: false,
      certifications: false,
      awards: false,
      languages: false,
      references: false
    };

    const lowerText = text.toLowerCase();

    // Section patterns
    const sectionPatterns = {
      summary: ['summary', 'objective', 'profile', 'about me', 'professional summary'],
      experience: ['experience', 'work experience', 'employment', 'professional experience', 'work history'],
      education: ['education', 'academic', 'university', 'college', 'degree', 'academic background'],
      skills: ['skills', 'technical skills', 'competencies', 'expertise', 'abilities'],
      projects: ['projects', 'personal projects', 'portfolio', 'work samples'],
      certifications: ['certifications', 'certificates', 'credentials', 'licenses'],
      awards: ['awards', 'honors', 'achievements', 'recognition'],
      languages: ['languages', 'spoken languages', 'language proficiency'],
      references: ['references', 'recommendations', 'referees']
    };

    Object.entries(sectionPatterns).forEach(([section, patterns]) => {
      patterns.forEach(pattern => {
        // Look for patterns as standalone lines or with common formatting
        const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
        if (regex.test(lowerText)) {
          sections[section] = true;
        }
      });
    });

    return sections;
  }

  /**
   * Calculate quality score
   */
  static calculateQualityScore(text, contactInfo, sections, skills) {
    let score = 0;
    const maxScore = 100;

    // Base score for having content
    if (text && text.length > 100) score += 20;

    // Contact information completeness (20 points)
    let contactScore = 0;
    if (contactInfo.email) contactScore += 5;
    if (contactInfo.phone) contactScore += 5;
    if (contactInfo.name) contactScore += 5;
    if (contactInfo.linkedin || contactInfo.github) contactScore += 5;
    score += contactScore;

    // Resume structure (30 points)
    let structureScore = 0;
    if (sections.summary) structureScore += 5;
    if (sections.experience) structureScore += 10;
    if (sections.education) structureScore += 10;
    if (sections.skills) structureScore += 5;
    score += structureScore;

    // Content quality (20 points)
    let contentScore = 0;
    if (text.length > 500) contentScore += 5;
    if (text.length > 1000) contentScore += 5;
    if (skills.length >= 5) contentScore += 5;
    if (skills.length >= 10) contentScore += 5;
    score += contentScore;

    // Additional sections (10 points)
    let additionalScore = 0;
    if (sections.projects) additionalScore += 3;
    if (sections.certifications) additionalScore += 3;
    if (sections.awards) additionalScore += 2;
    if (sections.languages) additionalScore += 2;
    score += additionalScore;

    return Math.min(score, maxScore);
  }

  /**
   * Generate recommendations
   */
  static generateRecommendations(contactInfo, sections, skills, qualityScore) {
    const recommendations = [];

    // Contact info recommendations
    if (!contactInfo.email) {
      recommendations.push('Add your email address to the contact information section');
    }
    if (!contactInfo.phone) {
      recommendations.push('Include your phone number for better contactability');
    }
    if (!contactInfo.linkedin) {
      recommendations.push('Add your LinkedIn profile URL to increase professional visibility');
    }
    if (!contactInfo.github && skills.some(skill => skill.toLowerCase().includes('javascript') || skill.toLowerCase().includes('python'))) {
      recommendations.push('Consider adding your GitHub profile to showcase your coding projects');
    }

    // Section recommendations
    if (!sections.summary) {
      recommendations.push('Add a professional summary or objective at the beginning of your resume');
    }
    if (!sections.experience) {
      recommendations.push('Include your work experience section with detailed responsibilities');
    }
    if (!sections.education) {
      recommendations.push('Add your education background and qualifications');
    }
    if (!sections.skills) {
      recommendations.push('Create a dedicated skills section to highlight your technical abilities');
    }
    if (!sections.projects && skills.some(skill => ['javascript', 'python', 'react', 'nodejs'].includes(skill.toLowerCase()))) {
      recommendations.push('Consider adding a projects section to showcase your practical work');
    }

    // Content quality recommendations
    if (skills.length < 5) {
      recommendations.push('Expand your skills section to include more relevant technical skills');
    }
    if (qualityScore < 70) {
      recommendations.push('Enhance your resume content to improve overall quality score');
    }

    // General recommendations
    if (!sections.certifications && skills.some(skill => ['aws', 'azure', 'google cloud'].includes(skill.toLowerCase()))) {
      recommendations.push('Highlight any cloud certifications in a dedicated section');
    }

    return recommendations;
  }

  /**
   * Perform complete resume analysis
   */
  static async analyzeResume(documentId, extractedText) {
    try {
      const contactInfo = this.extractContactInfo(extractedText);
      const skills = this.extractSkills(extractedText);
      const sections = this.detectSections(extractedText);
      const qualityScore = this.calculateQualityScore(extractedText, contactInfo, sections, skills);
      const recommendations = this.generateRecommendations(contactInfo, sections, skills, qualityScore);

      // Calculate sub-scores
      const structureScore = Object.values(sections).filter(Boolean).length * 10;
      const contentScore = Math.min((extractedText.length / 50), 40);
      const formattingScore = Math.min((skills.length * 2), 20);

      const analysisData = {
        contactInfo,
        sections,
        skills,
        qualityScore: {
          overall: qualityScore,
          structure: Math.min(structureScore, 100),
          content: Math.min(contentScore, 100),
          formatting: Math.min(formattingScore, 100)
        },
        recommendations
      };

      // Store analysis in database
      await pool.query(
        `INSERT INTO resume_analysis 
         (document_id, contact_info, sections_detected, skills, quality_score, recommendations, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
        [
          documentId,
          JSON.stringify(contactInfo),
          JSON.stringify(sections),
          JSON.stringify(skills),
          JSON.stringify(analysisData.qualityScore),
          JSON.stringify(recommendations)
        ]
      );

      return analysisData;

    } catch (error) {
      console.error('Error analyzing resume:', error);
      throw error;
    }
  }

  /**
   * Get stored analysis for a document
   */
  static async getAnalysis(documentId) {
    try {
      const result = await pool.query(
        `SELECT contact_info, sections_detected, skills, quality_score, recommendations, created_at
         FROM resume_analysis 
         WHERE document_id = $1`,
        [documentId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const analysis = result.rows[0];
      return {
        contactInfo: analysis.contact_info,
        sections: analysis.sections_detected,
        skills: analysis.skills,
        qualityScore: analysis.quality_score,
        recommendations: analysis.recommendations,
        createdAt: analysis.created_at
      };

    } catch (error) {
      console.error('Error getting resume analysis:', error);
      throw error;
    }
  }
}

export default ResumeAnalysisService;
