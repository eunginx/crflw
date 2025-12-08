import { CoverLetterRequest } from '../types/ai';

const DEFAULT_MODEL = process.env.OLLAMA_MODEL ?? 'qwen3-vl:235b';
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'https://ollama.com';
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;

// Dedicated cover letter generation service
async function callCoverLetterModel(prompt: string): Promise<string> {
  // Add timestamp and random seed to encourage different responses
  const timestamp = new Date().toISOString();
  const randomSeed = Math.random().toString(36).substring(7);
  
  // Add style variation and temperature for natural variations
  const styleVariants = ["formal", "impactful", "concise", "executive"];
  const chosenVariant = styleVariants[Math.floor(Math.random() * styleVariants.length)];
  const randomTemperature = (0.6 + Math.random() * 0.3).toFixed(2);

  const enhancedPrompt = `${prompt}

ANALYSIS CONTEXT:
- Timestamp: ${timestamp}
- Session ID: ${randomSeed}
- Request ID: ${Date.now()}-${Math.random().toString(36).substring(2)}
- STYLE_VARIANT: ${chosenVariant}
- TEMPERATURE_HINT: ${randomTemperature}

Please provide a fresh, unique cover letter based on the current context above.`;

  console.log('📝 COVER LETTER REQUEST');
  console.log('🤖 AI MODEL:', DEFAULT_MODEL);
  console.log('🌐 Base URL:', OLLAMA_BASE_URL);
  console.log('🔑 API Key Present:', !!OLLAMA_API_KEY);
  console.log('📅 Timestamp:', timestamp);
  console.log('🆔 Session ID:', randomSeed);
  console.log('📏 User Prompt Length:', enhancedPrompt.length, 'characters');
  console.log('User Prompt (first 500 chars):', enhancedPrompt.substring(0, 500) + (enhancedPrompt.length > 500 ? '...' : ''));
  console.log('---');
  
  try {
    console.log('📡 Making direct HTTP call to Ollama for cover letter...');
    console.log('📡 REQUEST DETAILS:');
    console.log('  🤖 Model:', DEFAULT_MODEL);
    console.log('  🌐 Base URL:', OLLAMA_BASE_URL);
    console.log('  🔑 API Key Present:', !!OLLAMA_API_KEY);
    console.log('  🔑 API Key Length:', OLLAMA_API_KEY?.length || 0);
    
    // Build headers exactly like the working curl
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (OLLAMA_API_KEY) {
      headers['Authorization'] = `Bearer ${OLLAMA_API_KEY}`;
    }
    
    console.log('📡 Request Headers:', headers);
    
    // Build request body
    const requestBody = {
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are an expert cover-letter writer trained to create concise, persuasive business letters.
Your output must ALWAYS be plain text with professional formatting.

RULES:
- Never output JSON or code blocks.
- Never include analysis, meta-commentary, or explanations.
- Always produce a clean, single, well-formatted business letter.
- Use a confident and professional tone.
- Ensure the letter is tailored to the provided resume and job description.
- Extract the candidate's REAL name from the resume. Never invent names.
- If no name is present, use "[Your Name]".
- Max length: 250–270 words.
- Never repeat the job description.
- Never restate the resume content verbatim.
- Never output placeholders like <company> unless unavoidable.

Perform all internal reasoning silently. Do NOT reveal analysis or chain-of-thought. Only output the final letter.`
        },
        {
          role: 'user',
          content: enhancedPrompt
        }
      ],
      stream: false
    };
    
    console.log('📡 Request Body:', JSON.stringify(requestBody, null, 2));
    
    // Make the HTTP request
    const response = await fetch(`${OLLAMA_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });
    
    console.log('📡 Ollama API response received:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('📡 Ollama API error response:', errorText);
      throw new Error(`Ollama API responded with status: ${response.status}, body: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('📡 Ollama API response parsed successfully');
    console.log('📡 Response structure:', {
      hasChoices: !!result.choices,
      choicesLength: result.choices?.length,
      hasMessage: !!result.choices?.[0]?.message,
      hasContent: !!result.choices?.[0]?.message?.content,
      contentLength: result.choices?.[0]?.message?.content?.length
    });
    
    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
      console.error('📡 Invalid response structure from Ollama:', result);
      throw new Error('Invalid response structure from Ollama API');
    }
    
    const coverLetterText = result.choices[0].message.content;
    console.log('📡 Cover letter generated successfully, length:', coverLetterText.length);
    console.log('📡 Cover letter preview (first 200 chars):', coverLetterText.substring(0, 200) + (coverLetterText.length > 200 ? '...' : ''));
    
    return coverLetterText;
    
  } catch (error) {
    console.error('📡 Cover letter generation failed:', error);
    throw error;
  }
}

export async function generateCoverLetter(
  payload: CoverLetterRequest,
): Promise<string> {
  const { resumeText, jobDescription, companyName, roleTitle } = payload;

  const prompt = `
Write a concise, high-impact professional cover letter.

OUTPUT RULES:
- Max 250 words.
- Plain text only (no JSON, no symbols, no headings, no bullets).
- Start with a greeting such as "Dear Hiring Team,".
- End with a professional sign-off and the candidate's real name.
- Use first-person voice.
- Use a confident but concise professional tone.

CONTENT RULES:
- Extract the candidate's real name from the resume (never invent one).
- If no name is found, use "[Your Name]".
- Highlight 2–3 quantifiable achievements from the resume.
- Show clear alignment with the job description.
- Avoid repeating resume lines or job description text verbatim.
- Do NOT fabricate experience or unrealistic accomplishments.
- Avoid generic filler or clichés.
- Tailor the letter tone to the seniority of the role.

CONTEXT:
Company: ${companyName || "Unknown"}
Role: ${roleTitle || "Unknown"}

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Write the final cover letter now.
`;

  // Add retry logic for Ollama reliability
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`📝 Cover letter generation attempt ${attempt}/3`);
      return await callCoverLetterModel(prompt);
    } catch (err) {
      console.warn(`⚠️ Retry ${attempt} failed:`, err);
      if (attempt === 3) {
        console.error('❌ All retry attempts failed for cover letter generation');
        throw err;
      }
      // Exponential backoff: 800ms, 1600ms
      const delay = 800 * attempt;
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // This should never be reached due to the loop logic
  throw new Error('Cover letter generation failed after all retries');
}
