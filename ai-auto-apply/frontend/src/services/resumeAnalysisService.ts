interface ResumeInfo {
  name?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  skills: string[];
  sections: {
    experience: boolean;
    education: boolean;
    skills: boolean;
    projects: boolean;
    summary: boolean;
  };
  qualityScore: {
    overall: number;
    wordCount: number;
    missingContactInfo: string[];
    missingSections: string[];
    suggestions: string[];
  };
}

export class ResumeAnalysisService {
  static extractResumeInfo(text: string): ResumeInfo {
    const info: ResumeInfo = {
      skills: [],
      sections: {
        experience: false,
        education: false,
        skills: false,
        projects: false,
        summary: false
      },
      qualityScore: {
        overall: 0,
        wordCount: 0,
        missingContactInfo: [],
        missingSections: [],
        suggestions: []
      }
    };

    // Extract contact information using regex
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
    const linkedinRegex = /linkedin\.com\/in\/[\w-]+/gi;
    const githubRegex = /github\.com\/[\w-]+/gi;

    const emailMatch = text.match(emailRegex);
    const phoneMatch = text.match(phoneRegex);
    const linkedinMatch = text.match(linkedinRegex);
    const githubMatch = text.match(githubRegex);

    if (emailMatch) info.email = emailMatch[0];
    if (phoneMatch) info.phone = phoneMatch[0];
    if (linkedinMatch) info.linkedin = linkedinMatch[0];
    if (githubMatch) info.github = githubMatch[0];

    // Extract name (simple heuristic - look for capitalized words near contact info)
    const lines = text.split('\n');
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i].trim();
      if (line.length > 0 && line.length < 50 && /^[A-Z][a-z]+ [A-Z][a-z]+/.test(line)) {
        info.name = line;
        break;
      }
    }

    // Extract skills (common technical skills)
    const commonSkills = [
      'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'SQL',
      'HTML', 'CSS', 'AWS', 'Docker', 'Kubernetes', 'Git', 'MongoDB', 'PostgreSQL',
      'Angular', 'Vue.js', 'Express', 'REST API', 'GraphQL', 'Machine Learning',
      'Data Science', 'DevOps', 'CI/CD', 'Agile', 'Scrum', 'Jira', 'Linux'
    ];

    commonSkills.forEach(skill => {
      if (text.toLowerCase().includes(skill.toLowerCase())) {
        info.skills.push(skill);
      }
    });

    // Detect sections
    const upperText = text.toUpperCase();
    info.sections.experience = /EXPERIENCE|WORK HISTORY|PROFESSIONAL EXPERIENCE|EMPLOYMENT/.test(upperText);
    info.sections.education = /EDUCATION|ACADEMIC|DEGREE|UNIVERSITY|COLLEGE/.test(upperText);
    info.sections.skills = /SKILLS|TECHNICAL SKILLS|COMPETENCIES|EXPERTISE/.test(upperText);
    info.sections.projects = /PROJECTS|PORTFOLIO|WORK SAMPLES/.test(upperText);
    info.sections.summary = /SUMMARY|OBJECTIVE|PROFILE|OVERVIEW/.test(upperText);

    // Calculate quality score
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    info.qualityScore.wordCount = wordCount;

    let score = 0;
    const maxScore = 100;

    // Contact info scoring (30 points)
    if (info.email) score += 10;
    if (info.phone) score += 10;
    if (info.name) score += 10;

    // Section scoring (40 points)
    if (info.sections.experience) score += 10;
    if (info.sections.education) score += 10;
    if (info.sections.skills) score += 10;
    if (info.sections.summary) score += 10;

    // Content quality scoring (30 points)
    if (wordCount >= 200) score += 10;
    if (wordCount >= 400) score += 10;
    if (info.skills.length >= 5) score += 10;

    info.qualityScore.overall = score;

    // Identify missing information
    if (!info.email) info.qualityScore.missingContactInfo.push('Email');
    if (!info.phone) info.qualityScore.missingContactInfo.push('Phone');
    if (!info.name) info.qualityScore.missingContactInfo.push('Name');

    if (!info.sections.experience) info.qualityScore.missingSections.push('Experience');
    if (!info.sections.education) info.qualityScore.missingSections.push('Education');
    if (!info.sections.skills) info.qualityScore.missingSections.push('Skills');

    // Generate suggestions
    if (wordCount < 200) {
      info.qualityScore.suggestions.push('Consider adding more detail to your resume (target 200+ words)');
    }
    if (info.skills.length < 5) {
      info.qualityScore.suggestions.push('Add more technical skills to showcase your expertise');
    }
    if (!info.sections.summary) {
      info.qualityScore.suggestions.push('Add a professional summary to highlight your key qualifications');
    }

    return info;
  }

  static calculateJobMatch(resumeText: string, jobDescription: string): {
    score: number;
    commonKeywords: string[];
    missingKeywords: string[];
  } {
    const resumeWords = resumeText.toLowerCase().split(/\s+/);
    const jobWords = jobDescription.toLowerCase().split(/\s+/);
    
    // Extract keywords (simple approach - filter out common words)
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'];
    
    const jobKeywords = jobWords.filter(word => 
      word.length > 3 && !stopWords.includes(word)
    ).filter((word, index, array) => array.indexOf(word) === index); // unique

    const commonKeywords = jobKeywords.filter(keyword => resumeWords.includes(keyword));
    const missingKeywords = jobKeywords.filter(keyword => !resumeWords.includes(keyword));
    
    const score = jobKeywords.length > 0 ? (commonKeywords.length / jobKeywords.length) * 100 : 0;

    return {
      score: Math.round(score),
      commonKeywords,
      missingKeywords
    };
  }
}
