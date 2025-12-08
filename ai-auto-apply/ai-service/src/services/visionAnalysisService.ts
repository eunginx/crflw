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
    extractedSkills: string[];
    suggestedKeywords: string[];
    suggestedHeadline: string;
    suggestedSummary: string;
    experienceLevel: string;
    industryInsights: {
        averageSalary: {
            min: number;
            max: number;
        };
        topCompanies: string[];
        demandLevel: string;
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
                        'You are an expert resume analyst. Analyze the attached resume images and extracted text to provide comprehensive insights. ' +
                        'Extract skills, suggest professional headline, write a compelling summary, determine experience level, and provide industry insights including salary range. ' +
                        'Return ONLY a valid JSON object with the following structure:\n' +
                        '{\n' +
                        '  "extractedSkills": string[],\n' +
                        '  "suggestedKeywords": string[],\n' +
                        '  "suggestedHeadline": string,\n' +
                        '  "suggestedSummary": string,\n' +
                        '  "experienceLevel": "entry" | "mid" | "senior" | "lead",\n' +
                        '  "industryInsights": {\n' +
                        '    "averageSalary": { "min": number, "max": number },\n' +
                        '    "topCompanies": string[],\n' +
                        '    "demandLevel": "low" | "medium" | "high"\n' +
                        '  }\n' +
                        '}\n\n' +
                        `Extracted Text:\n${extractedText}\n\n` +
                        'Analyze both the visual layout from images and the extracted text to provide accurate insights.',
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
    const commonSkills = [
        'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java',
        'AWS', 'Docker', 'Kubernetes', 'Git', 'SQL', 'MongoDB',
        'Leadership', 'Communication', 'Problem Solving', 'Team Management'
    ];

    const extractedSkills = commonSkills.filter(skill =>
        extractedText.toLowerCase().includes(skill.toLowerCase())
    );

    return {
        extractedSkills: extractedSkills.length > 0 ? extractedSkills : ['Professional Experience', 'Technical Skills'],
        suggestedKeywords: extractedSkills.slice(0, 5),
        suggestedHeadline: 'Experienced Professional | Technology & Innovation',
        suggestedSummary: 'Results-driven professional with proven track record in delivering high-impact solutions. Strong technical background with excellent communication and leadership skills.',
        experienceLevel: 'mid',
        industryInsights: {
            averageSalary: {
                min: 80000,
                max: 120000,
            },
            topCompanies: ['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple'],
            demandLevel: 'high',
        },
    };
}

export default {
    analyzeResumeWithVision,
};
