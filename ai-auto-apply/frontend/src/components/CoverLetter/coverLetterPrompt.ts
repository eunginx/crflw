// Cover Letter Prompt Builder
// Integrates resume intelligence + job intelligence to create unified prompts

export interface CoverLetterPromptData {
  // Resume Intelligence Data
  resumeSummary?: string;
  resumeSkills?: string[];
  resumeSeniority?: string;
  resumeExperienceLevel?: string;
  
  // Job Intelligence Data  
  jobTitle?: string;
  company?: string;
  jobKeywords?: string[];
  jobResponsibilities?: string[];
  jobRequirements?: string[];
  
  // Style Selection
  tone: 'professional' | 'enthusiastic' | 'technical' | 'concise';
}

export function buildCoverLetterPrompt(data: CoverLetterPromptData): string {
  const {
    resumeSummary = '',
    resumeSkills = [],
    resumeSeniority = '',
    resumeExperienceLevel = '',
    jobTitle = '',
    company = '',
    jobKeywords = [],
    jobResponsibilities = [],
    jobRequirements = [],
    tone
  } = data;

  const toneInstructions = getToneInstructions(tone);
  
  return `You are generating a tailored cover letter for a job applicant.

Use these inputs:

Job:
- Position: ${jobTitle}
- Company: ${company}
- Keywords: ${jobKeywords.join(', ') || 'N/A'}
- Responsibilities: ${jobResponsibilities.join('\n') || 'N/A'}
- Requirements: ${jobRequirements.join('\n') || 'N/A'}

Resume:
- Summary: ${resumeSummary}
- Skills: ${resumeSkills.join(', ') || 'N/A'}
- Seniority: ${resumeSeniority}
- Level: ${resumeExperienceLevel}

Style: ${tone}

Instructions:
- Write a strong, human-sounding cover letter.
- Match the tone selected by the user.
- Use concrete achievements based on the resume.
- Replace placeholders like [Position] and [Company].
- Keep the letter concise: 3–4 paragraphs.
${toneInstructions}

Format:
Paragraph-style cover letter without closing signature.`;
}

function getToneInstructions(tone: string): string {
  switch (tone) {
    case 'professional':
      return `
- Use formal, business-appropriate language
- Focus on qualifications and professional experience
- Maintain respectful, traditional tone`;
    case 'enthusiastic':
      return `
- Show excitement and passion for the role
- Use energetic, positive language
- Express genuine interest in the company`;
    case 'technical':
      return `
- Emphasize technical skills and expertise
- Include specific technologies and methodologies
- Focus on technical achievements and problem-solving`;
    case 'concise':
      return `
- Keep sentences short and to the point
- Remove filler words and phrases
- Focus on impact and results`;
    default:
      return '';
  }
}

// Helper function to extract data from ResumeIntelligence
export function extractResumeData(intelligence: any): Pick<CoverLetterPromptData, 'resumeSummary' | 'resumeSkills' | 'resumeSeniority' | 'resumeExperienceLevel'> {
  return {
    resumeSummary: intelligence?.suggestedSummary || '',
    resumeSkills: intelligence?.extractedSkills || [],
    resumeSeniority: intelligence?.suggestedHeadline || '',
    resumeExperienceLevel: intelligence?.experienceLevel || ''
  };
}

// Helper function to extract data from selected job
export function extractJobData(job: any): Pick<CoverLetterPromptData, 'jobTitle' | 'company' | 'jobKeywords' | 'jobResponsibilities' | 'jobRequirements'> {
  return {
    jobTitle: job?.title || '',
    company: job?.company || '',
    jobKeywords: job?.keywords || [],
    jobResponsibilities: job?.responsibilities || [],
    jobRequirements: job?.requirements || []
  };
}
