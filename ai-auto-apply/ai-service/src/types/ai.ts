export interface ResumeAnalysisRequest {
  resumeText: string;
  jobDescription?: string;
}

export interface ResumeAnalysisResult {
  matchScore: number;
  skillsMatched: string[];
  skillsMissing: string[];
  apply: boolean;
  reason: string;
  coverLetter: string;
  autofill: {
    fullName: string;
    email: string;
    answers: Record<string, string>;
  };
}

export interface AestheticScoreRequest {
  resumeText: string;
  resumeContent: string;
}

export interface AestheticScoreResult {
  score: number;
  strengths: string[];
  improvements: string[];
  assessment: string;
}

export interface SkillsAnalysisRequest {
  resumeText: string;
}

export interface SkillsAnalysisResult {
  technical: string[];
  soft: string[];
  tools: string[];
  overallScore: number;
  missingSkills: string[];
  skillLevelAssessment: string;
}

export interface AIRecommendationsRequest {
  resumeText: string;
  resumeSections: any[];
  currentSkills: any;
}

export interface AIRecommendationsResult {
  recommendations: string[];
  strengths: string[];
  improvements: string[];
  priorityActions: string[];
  overallAssessment: string;
}

export interface CoverLetterRequest {
  resumeText: string;
  jobDescription: string;
  companyName?: string;
  roleTitle?: string;
}

export interface JobMatchRequest {
  resumeText: string;
  jobDescription: string;
  userPreferences?: Record<string, unknown>;
}

export interface ChatRequest {
  message: string;
  systemPrompt?: string;
}

export interface ChatResponse {
  reply: string;
}
