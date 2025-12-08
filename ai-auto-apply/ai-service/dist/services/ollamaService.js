"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeResume = analyzeResume;
exports.generateCoverLetter = generateCoverLetter;
exports.matchJobs = matchJobs;
exports.chat = chat;
exports.analyzeAestheticScore = analyzeAestheticScore;
exports.analyzeSkills = analyzeSkills;
exports.generateRecommendations = generateRecommendations;
exports.callModel = callModel;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config(); // Ensure environment variables are loaded
const DEFAULT_MODEL = process.env.OLLAMA_MODEL ?? 'gpt-oss:120b';
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'https://ollama.com';
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
async function callModel(prompt, systemPrompt = 'You are the AI assistant for Careerflow Auto Apply. Always respond with valid JSON.') {
    // Add timestamp and random seed to encourage different responses
    const timestamp = new Date().toISOString();
    const randomSeed = Math.random().toString(36).substring(7);
    const enhancedPrompt = `${prompt}

ANALYSIS CONTEXT:
- Timestamp: ${timestamp}
- Session ID: ${randomSeed}
- Request ID: ${Date.now()}-${Math.random().toString(36).substring(2)}

Please provide a fresh, unique analysis based on the current context above.`;
    console.log('🤖 OLLAMA REQUEST');
    console.log('Model:', DEFAULT_MODEL);
    console.log('Base URL:', OLLAMA_BASE_URL);
    console.log('API Key Present:', !!OLLAMA_API_KEY);
    console.log('Timestamp:', timestamp);
    console.log('Session ID:', randomSeed);
    console.log('System Prompt:', systemPrompt);
    console.log('User Prompt Length:', enhancedPrompt.length, 'characters');
    console.log('User Prompt (first 500 chars):', enhancedPrompt.substring(0, 500) + (enhancedPrompt.length > 500 ? '...' : ''));
    console.log('---');
    try {
        console.log('📡 Making direct HTTP call to Ollama...');
        console.log('📡 Request details:', {
            model: DEFAULT_MODEL,
            baseUrl: OLLAMA_BASE_URL,
            hasApiKey: !!OLLAMA_API_KEY,
            apiKeyLength: OLLAMA_API_KEY?.length || 0
        });
        // Build headers exactly like the working curl
        const headers = {
            'Content-Type': 'application/json',
        };
        if (OLLAMA_API_KEY) {
            headers['Authorization'] = `Bearer ${OLLAMA_API_KEY}`;
        }
        console.log('📡 Request Headers:', headers);
        console.log('📡 Request Body:', JSON.stringify({
            model: DEFAULT_MODEL,
            messages: [
                {
                    role: 'system',
                    content: systemPrompt,
                },
                {
                    role: 'user',
                    content: enhancedPrompt,
                },
            ],
            stream: false,
        }, null, 2));
        // Make direct HTTP call exactly like curl
        const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                model: DEFAULT_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt,
                    },
                    {
                        role: 'user',
                        content: enhancedPrompt,
                    },
                ],
                stream: false,
            }),
        });
        console.log('📡 Ollama API response received:', response.status, response.statusText);
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ OLLAMA API ERROR:', response.status, response.statusText, errorText);
            throw new Error(`Ollama API error: ${response.status} ${response.statusText} - ${errorText}`);
        }
        const data = await response.json();
        const content = data?.message?.content?.trim();
        if (!content) {
            console.error('❌ Empty response from Ollama');
            throw new Error('Empty response from Ollama');
        }
        console.log('🤖 OLLAMA RESPONSE');
        console.log('Raw Response:', content);
        console.log('---');
        return content;
    }
    catch (error) {
        console.error('❌ OLLAMA API ERROR:', error);
        console.error('Error details:', {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : 'No stack available',
            name: error instanceof Error ? error.name : 'Unknown Error'
        });
        throw error;
    }
}
function parseJson(raw, fallback) {
    try {
        const start = raw.indexOf('{');
        const end = raw.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
            const jsonSubstring = raw.substring(start, end + 1);
            const parsed = JSON.parse(jsonSubstring);
            console.log('✅ JSON Parse Successful');
            return parsed;
        }
        console.warn('⚠️ No JSON found in response, using fallback');
        return fallback;
    }
    catch (error) {
        console.warn('❌ Failed to parse Ollama JSON response. Using fallback.', error instanceof Error ? error.message : String(error));
        console.warn('Raw response that failed to parse:', raw);
        return fallback;
    }
}
async function analyzeResume(payload) {
    const { resumeText, jobDescription } = payload;
    const prompt = `You are an ATS-grade Resume Analysis AI. 
Your task is to compare the applicant's resume against the job description.

Return **only valid JSON** with EXACTLY the fields below. 
If any data is missing, use empty strings or empty arrays—never invent details.

{
  "matchScore": number (0-100),
  "skillsMatched": string[],
  "skillsMissing": string[],
  "apply": boolean,
  "reason": string,
  "coverLetter": string,
  "autofill": {
    "fullName": string,
    "email": string,
    "answers": { "question": "answer" }
  }
}

Rules:
- Match score should reflect alignment of skills, experience, and keywords.
- SkillsMatched must list real skills found in both resume + job.
- SkillsMissing must list important skills missing from the resume.
- Autofill.fullName and autofill.email must be taken **only** from resume text.
- NEVER include text outside JSON.

Resume Text:
${resumeText}

Job Description:
${jobDescription || "N/A"}`;
    const fallback = {
        matchScore: 0,
        skillsMatched: [],
        skillsMissing: [],
        apply: false,
        reason: 'No response from AI. Manual review required.',
        coverLetter: '',
        autofill: {
            fullName: '',
            email: '',
            answers: {},
        },
    };
    const raw = await callModel(prompt);
    return parseJson(raw, fallback);
}
async function generateCoverLetter(payload) {
    const { resumeText, jobDescription, companyName, roleTitle } = payload;
    const prompt = `Write a concise, high-impact professional cover letter (max 250 words).

Requirements:
- Use first-person voice
- Highlight alignment between resume and job description
- Include 2–3 quantifiable strengths from the resume
- Avoid generic filler sentences

CRITICAL INSTRUCTIONS:
- DO NOT return JSON format
- DO NOT use {"coverLetter": "..."} structure
- DO NOT include any brackets or JSON keys
- Return ONLY the plain text cover letter content
- Start directly with "Dear Hiring Team," or similar salutation
- End with signature line
- No metadata, no JSON wrapper, no object structure

Company: ${companyName || "Unknown"}
Role: ${roleTitle || "Unknown"}

Resume:
${resumeText}

Job Description:
${jobDescription}

EXAMPLE OF CORRECT FORMAT:
Dear Hiring Team,

I am excited to apply for the Senior Frontend Developer position at TechCorp India...

[Your cover letter content here...]

Thank you for your consideration. I look forward to discussing how my experience can contribute to your team's success.

Sincerely,
[Your Name]

Now write the cover letter in this exact format - plain text only.`;
    return callModel(prompt, 'You are a professional cover letter writer. Always respond with plain text cover letters, never JSON.');
}
async function matchJobs(payload) {
    const { resumeText, jobDescription, userPreferences } = payload;
    const prompt = `Analyze how well the resume aligns with the job description and user preferences.

Return ONLY valid JSON:
{
  "matchScore": number (0-100),
  "skillsAligned": string[],
  "risks": string[],
  "preferenceAlignment": string
}

Rules:
- SkillsAligned must contain skills present in BOTH resume + job.
- Risks must highlight weak areas, missing skills, or red flags.
- preferenceAlignment describes how well stated preferences match the role.
- No explanations outside JSON.

User Preferences:
${JSON.stringify(userPreferences || {}, null, 2)}

Resume:
${resumeText}

Job Description:
${jobDescription}`;
    const fallback = {
        matchScore: 0,
        skillsAligned: [],
        risks: ['Unable to analyze request'],
        preferenceAlignment: 'unknown',
    };
    const raw = await callModel(prompt);
    return parseJson(raw, fallback);
}
async function chat(payload) {
    const { message, systemPrompt } = payload;
    if (!message?.trim()) {
        throw new Error('Message is required');
    }
    const response = await callModel(message, systemPrompt ?? 'You are a friendly, helpful AI assisting Careerflow users. Give clear, accurate answers. Avoid unnecessary verbosity.');
    return { reply: response };
}
// AI Analysis Functions for Resume Processing
async function analyzeAestheticScore(payload) {
    const { resumeText, resumeContent } = payload;
    console.log('🎨 AESTHETIC SCORE ANALYSIS');
    console.log('Resume Text Length:', resumeText?.length || 0, 'characters');
    console.log('Resume Text (first 300 chars):', (resumeText || '').substring(0, 300) + ((resumeText || '').length > 300 ? '...' : ''));
    console.log('Resume Content Length:', resumeContent?.length || 0, 'characters');
    console.log('---');
    const fallback = {
        score: 75,
        strengths: ['Professional formatting detected', 'Clear structure and organization'],
        improvements: ['Consider adding more quantifiable achievements', 'Enhance visual hierarchy'],
        assessment: 'Resume has good structure with room for improvement in content depth.',
    };
    try {
        const prompt = `Evaluate the resume's aesthetic and professional presentation.

Consider:
- Layout clarity
- Formatting consistency
- Readability and spacing
- Visual hierarchy
- Professional tone

Return ONLY valid JSON:
{
  "score": number (0-100),
  "strengths": string[],
  "improvements": string[],
  "assessment": string
}

Resume Content (visual/HTML structure):
${resumeContent}

Full Extracted Resume Text:
${resumeText}`;
        const raw = await callModel(prompt);
        const result = parseJson(raw, fallback);
        console.log('🎨 AESTHETIC SCORE RESULT');
        console.log('Parsed Result:', JSON.stringify(result, null, 2));
        console.log('---');
        return result;
    }
    catch (error) {
        console.warn('AI analysis unavailable, using fallback for aesthetic score:', error);
        return fallback;
    }
}
async function analyzeSkills(payload) {
    const { resumeText } = payload;
    console.log('🔧 SKILLS ANALYSIS');
    console.log('Resume Text Length:', resumeText?.length || 0, 'characters');
    console.log('Resume Text (first 300 chars):', (resumeText || '').substring(0, 300) + ((resumeText || '').length > 300 ? '...' : ''));
    console.log('---');
    const fallback = {
        technical: ['JavaScript', 'React', 'TypeScript', 'Node.js'],
        soft: ['Communication', 'Team Leadership', 'Problem Solving'],
        tools: ['Git', 'VS Code', 'Docker'],
        overallScore: 80,
        missingSkills: ['Machine Learning', 'AWS'],
        skillLevelAssessment: 'Strong technical foundation with good soft skills. Consider expanding cloud and ML knowledge.',
    };
    try {
        const prompt = `Extract skills from the resume and categorize them.

Return ONLY valid JSON:
{
  "technical": string[],
  "soft": string[],
  "tools": string[],
  "overallScore": number (0-100),
  "missingSkills": string[],
  "skillLevelAssessment": string
}

Rules:
- Extract only skills explicitly mentioned or clearly inferable from experience.
- missingSkills should be skills valuable to most relevant industries.
- No text outside the JSON.

Resume Text:
${resumeText}`;
        const raw = await callModel(prompt);
        const result = parseJson(raw, fallback);
        console.log('🔧 SKILLS ANALYSIS RESULT');
        console.log('Parsed Result:', JSON.stringify(result, null, 2));
        console.log('---');
        return result;
    }
    catch (error) {
        console.warn('AI analysis unavailable, using fallback for skills analysis:', error);
        return fallback;
    }
}
async function generateRecommendations(payload) {
    const { resumeText, resumeSections, currentSkills } = payload;
    console.log('💡 AI RECOMMENDATIONS');
    console.log('Resume Text Length:', resumeText?.length || 0, 'characters');
    console.log('Resume Text (first 300 chars):', (resumeText || '').substring(0, 300) + ((resumeText || '').length > 300 ? '...' : ''));
    console.log('Resume Sections:', JSON.stringify(resumeSections, null, 2));
    console.log('Current Skills:', JSON.stringify(currentSkills, null, 2));
    console.log('---');
    const fallback = {
        recommendations: ['Add quantifiable achievements to your experience sections', 'Include a stronger professional summary', 'Enhance technical skills section with specific technologies'],
        strengths: ['Good work experience progression', 'Clear career trajectory', 'Relevant technical background'],
        improvements: ['Add metrics and KPIs to demonstrate impact', 'Include more specific project details', 'Expand skills section with certifications'],
        priorityActions: ['Quantify achievements with numbers', 'Add professional certifications', 'Include project outcomes'],
        overallAssessment: 'Resume has solid foundation. Focus on adding quantifiable achievements and specific technical details to strengthen impact.',
    };
    try {
        const prompt = `Analyze the resume and provide actionable improvement recommendations.

Return ONLY valid JSON:
{
  "recommendations": string[],
  "strengths": string[],
  "improvements": string[],
  "priorityActions": string[],
  "overallAssessment": string
}

Rules:
- Recommendations must be specific and actionable.
- priorityActions must list the 3 most urgent fixes.
- strengths should highlight what is already well done.
- Never produce generic or vague feedback.

Resume Sections:
${JSON.stringify(resumeSections, null, 2)}

Current Skills:
${JSON.stringify(currentSkills, null, 2)}

Full Resume Text:
${resumeText}`;
        const raw = await callModel(prompt);
        const result = parseJson(raw, fallback);
        console.log('💡 AI RECOMMENDATIONS RESULT');
        console.log('Parsed Result:', JSON.stringify(result, null, 2));
        console.log('---');
        return result;
    }
    catch (error) {
        console.warn('AI analysis unavailable, using fallback for recommendations:', error);
        return fallback;
    }
}
