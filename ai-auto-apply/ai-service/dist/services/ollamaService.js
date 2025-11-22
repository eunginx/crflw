"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeResume = analyzeResume;
exports.generateCoverLetter = generateCoverLetter;
exports.matchJobs = matchJobs;
exports.chat = chat;
const ollamaClient_1 = __importDefault(require("../config/ollamaClient"));
const DEFAULT_MODEL = process.env.OLLAMA_MODEL ?? 'gpt-oss:120b';
async function callModel(prompt, systemPrompt = 'You are the AI assistant for Careerflow Auto Apply. Always respond with valid JSON.') {
    const response = await ollamaClient_1.default.chat({
        model: DEFAULT_MODEL,
        messages: [
            {
                role: 'system',
                content: systemPrompt,
            },
            {
                role: 'user',
                content: prompt,
            },
        ],
        stream: false,
    });
    const content = response?.message?.content?.trim();
    if (!content) {
        throw new Error('Empty response from Ollama');
    }
    return content;
}
function parseJson(raw, fallback) {
    try {
        const start = raw.indexOf('{');
        const end = raw.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
            const jsonSubstring = raw.substring(start, end + 1);
            return JSON.parse(jsonSubstring);
        }
        return fallback;
    }
    catch (error) {
        console.warn('Failed to parse Ollama JSON response. Using fallback.', error);
        return fallback;
    }
}
async function analyzeResume(payload) {
    const { resumeText, jobDescription } = payload;
    const prompt = `Analyze the following resume against the job description.
Return JSON with the shape:
{
  "matchScore": number,
  "skillsMatched": string[],
  "skillsMissing": string[],
  "apply": boolean,
  "reason": string,
  "coverLetter": string,
  "autofill": {
    "fullName": string,
    "email": string,
    "answers": {"question": "answer"}
  }
}
Resume:${resumeText}
Job Description:${jobDescription ?? 'N/A'}`;
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
    const prompt = `Using the resume and job description, craft a concise cover letter (<= 250 words).
Company: ${companyName ?? 'Unknown'}
Role: ${roleTitle ?? 'Role'}
Resume:${resumeText}
Job Description:${jobDescription}`;
    return callModel(prompt);
}
async function matchJobs(payload) {
    const { resumeText, jobDescription, userPreferences } = payload;
    const prompt = `Compare the resume to the job description and output JSON like:
{
  "matchScore": number,
  "skillsAligned": string[],
  "risks": string[],
  "preferenceAlignment": string
}
User Preferences: ${JSON.stringify(userPreferences ?? {}, null, 2)}
Resume:${resumeText}
Job Description:${jobDescription}`;
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
    const response = await callModel(message, systemPrompt ?? 'You are a friendly assistant helping Careerflow users.');
    return { reply: response };
}
