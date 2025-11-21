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
