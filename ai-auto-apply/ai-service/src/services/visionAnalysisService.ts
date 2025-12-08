import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

dotenv.config();

// === CONFIGURATION ===
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "https://ollama.com";
const VISION_MODEL = process.env.VISION_MODEL || "qwen3-vl:235b";

interface VisionAnalysisResult {
    aesthetic: {
        score: number;
        strengths: string[];
        improvements: string[];
        assessment: string;
    };
    skills: {
        technical: string[];
        soft: string[];
        certifications: string[];
        tools: string[];
    };
    recommendations: {
        recommendations: string[];
        strengths: string[];
        improvements: string[];
    };
}

/**
 * Analyze resume using vision model with screenshots and extracted text
 * Based on working OCR sample code
 */
export async function analyzeResumeWithVision(
    screenshotPaths: string[],
    extractedText: string
): Promise<VisionAnalysisResult> {
    console.log('👁️ === VISION ANALYSIS START ===');
    console.log('👁️ Screenshot paths:', screenshotPaths);
    console.log('👁️ Extracted text length:', extractedText?.length || 0);
    console.log('👁️ Vision Model:', VISION_MODEL);
    console.log('👁️ Ollama Base URL:', OLLAMA_BASE_URL);

    try {
        // Convert screenshots to base64
        const images: string[] = [];
        for (const screenshotPath of screenshotPaths) {
            try {
                // Check if file exists
                if (!fs.existsSync(screenshotPath)) {
                    console.warn(`👁️ Screenshot not found: ${screenshotPath}`);
                    continue;
                }

                const imgBytes = fs.readFileSync(screenshotPath);
                const imgB64 = imgBytes.toString('base64');
                images.push(imgB64);
                console.log(`👁️ Converted screenshot to base64: ${path.basename(screenshotPath)}`);
            } catch (error) {
                console.error(`👁️ Error reading screenshot ${screenshotPath}:`, error);
            }
        }

        if (images.length === 0) {
            console.warn('👁️ No screenshots available, falling back to text-only analysis');
            return generateFallbackAnalysis(extractedText);
        }

        console.log(`👁️ Total images converted: ${images.length}`);

        // === REQUEST PAYLOAD ===
        const payload = {
            model: VISION_MODEL,
            messages: [
                {
                    role: 'user',
                    content:
                        'You are an expert ATS-grade resume analyst. Analyze the attached resume images and extracted text to provide comprehensive AI-powered insights. ' +
                        'Evaluate the resume\'s visual aesthetic, categorize skills, and provide actionable recommendations. ' +
                        'Return ONLY a valid JSON object with the following structure:\\n' +
                        '{\\n' +
                        '  \"aesthetic\": {\\n' +
                        '    \"score\": number (0-100),\\n' +
                        '    \"strengths\": string[] (visual/formatting strengths),\\n' +
                        '    \"improvements\": string[] (visual/formatting suggestions),\\n' +
                        '    \"assessment\": string (overall visual assessment)\\n' +
                        '  },\\n' +
                        '  \"skills\": {\\n' +
                        '    \"technical\": string[] (programming, tools, technologies),\\n' +
                        '    \"soft\": string[] (communication, leadership, etc),\\n' +
                        '    \"certifications\": string[] (degrees, certs),\\n' +
                        '    \"tools\": string[] (software, platforms)\\n' +
                        '  },\\n' +
                        '  \"recommendations\": {\\n' +
                        '    \"recommendations\": string[] (specific actionable advice),\\n' +
                        '    \"strengths\": string[] (what the resume does well),\\n' +
                        '    \"improvements\": string[] (areas to enhance)\\n' +
                        '  }\\n' +
                        '}\\n\\n' +
                        `Extracted Text:\\n${extractedText}\\n\\n` +
                        'Analyze both the visual layout from images and the extracted text. Be specific and actionable in your recommendations.',
                    images: images,
                },
            ],
            stream: false,
        };

        // === HEADERS ===
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (OLLAMA_API_KEY) {
            headers['Authorization'] = `Bearer ${OLLAMA_API_KEY}`;
        }

        console.log('👁️ Making API request to Ollama...');
        console.log('👁️ Request payload size:', JSON.stringify(payload).length, 'bytes');

        // === API REQUEST ===
        const response = await axios.post(
            `${OLLAMA_BASE_URL}/api/chat`,
            payload,
            {
                headers,
                timeout: 180000, // 3 minutes timeout for vision analysis
            }
        );

        console.log('👁️ API response received:', response.status, response.statusText);

        const data = response.data;
        const raw = data?.message?.content || '';

        console.log('👁️ Raw model output length:', raw.length);
        console.log('👁️ Raw model output (first 500 chars):', raw.substring(0, 500));

        // === CLEAN JSON ===
        const cleaned = raw
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();

        try {
            const parsed = JSON.parse(cleaned) as VisionAnalysisResult;
            console.log('✅ Vision analysis completed successfully');
            console.log('👁️ === VISION ANALYSIS END ===');
            return parsed;
        } catch (parseError) {
            console.error('⚠️ Failed to parse JSON from vision model:', parseError);
            console.error('⚠️ Raw output:', raw);
            console.error('⚠️ Cleaned output:', cleaned);

            // Return fallback analysis
            return generateFallbackAnalysis(extractedText);
        }
    } catch (error) {
        console.error('❌ Error during vision analysis:', error);
        if (axios.isAxiosError(error)) {
            console.error('❌ Axios error details:', {
                message: error.message,
                code: error.code,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
            });
        }

        // Return fallback analysis on error
        return generateFallbackAnalysis(extractedText);
    }
}

/**
 * Generate fallback analysis when vision model fails
 */
function generateFallbackAnalysis(extractedText: string): VisionAnalysisResult {
    console.log('👁️ Generating fallback analysis from extracted text');

    // Simple text-based skill extraction
    const technicalSkills = ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'AWS', 'Docker', 'Kubernetes', 'Git', 'SQL', 'MongoDB'];
    const softSkills = ['Leadership', 'Communication', 'Problem Solving', 'Team Management', 'Project Management'];

    const foundTechnical = technicalSkills.filter(skill =>
        extractedText.toLowerCase().includes(skill.toLowerCase())
    );

    const foundSoft = softSkills.filter(skill =>
        extractedText.toLowerCase().includes(skill.toLowerCase())
    );

    return {
        aesthetic: {
            score: 70,
            strengths: ['Clean layout', 'Professional formatting', 'Good use of whitespace'],
            improvements: ['Consider adding more visual hierarchy', 'Use consistent font sizes', 'Add section dividers'],
            assessment: 'The resume has a professional appearance with room for visual enhancements to improve ATS compatibility and readability.'
        },
        skills: {
            technical: foundTechnical.length > 0 ? foundTechnical : ['Professional Experience'],
            soft: foundSoft.length > 0 ? foundSoft : ['Communication', 'Teamwork'],
            certifications: [],
            tools: []
        },
        recommendations: {
            recommendations: [
                'Add quantifiable achievements with metrics',
                'Include relevant keywords for ATS optimization',
                'Ensure consistent formatting throughout'
            ],
            strengths: [
                'Clear professional experience section',
                'Well-organized content structure'
            ],
            improvements: [
                'Add more specific technical skills',
                'Include measurable results and impact',
                'Optimize for applicant tracking systems'
            ]
        }
    };
}

export default {
    analyzeResumeWithVision,
};
