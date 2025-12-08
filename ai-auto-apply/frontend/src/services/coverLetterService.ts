import ResumeIntelligenceService from './resumeIntelligenceService';
import { ResumeSkills, analyzeJobMatch } from '../utils/jobMatchingUtils';

export interface CoverLetterContent {
  introduction: string;
  body: string[];
  highlights: string[];
  closing: string;
  signature: string;
  // Add formatted text for copy-paste
  formattedText: string;
  // Add HTML version for better display
  htmlContent: string;
}

export interface CoverLetterTemplate {
  company: string;
  position: string;
  location: string;
  salary: string;
  startDate: string;
  workType: string;
}

class CoverLetterService {
  private static instance: CoverLetterService;

  static getInstance(): CoverLetterService {
    if (!this.instance) {
      this.instance = new CoverLetterService();
    }
    return this.instance;
  }

  // Generate personalized cover letter based on job and resume
  generateCoverLetter(
    job: any, 
    resumeAnalysis: any, 
    template?: Partial<CoverLetterTemplate>
  ): CoverLetterContent {
    const resumeSkills = ResumeIntelligenceService.convertToResumeSkills(resumeAnalysis);
    const jobAnalysis = analyzeJobMatch(job, resumeSkills);
    const highlights = ResumeIntelligenceService.generateCoverLetterHighlights(job, resumeAnalysis);
    
    // Extract key information
    const companyName = job.company || 'the company';
    const position = job.title || 'the position';
    const location = job.location || '';
    
    // Generate introduction
    const introduction = this.generateIntroduction(companyName, position, resumeAnalysis);
    
    // Generate body paragraphs
    const body = this.generateBody(job, resumeAnalysis, jobAnalysis, highlights);
    
    // Generate closing
    const closing = this.generateClosing(companyName, position);
    
    // Generate formatted text for copy-paste
    const formattedText = this.generateFormattedText(introduction, body, closing, template);
    
    // Generate HTML content for display
    const htmlContent = this.generateHtmlContent(introduction, body, closing, template);
    
    return {
      introduction,
      body,
      highlights,
      closing,
      signature: 'Sincerely,',
      formattedText,
      htmlContent
    };
  }

  // Generate cover letter with template integration
  generateCoverLetterWithTemplate(
    job: any,
    resumeAnalysis: any,
    template: CoverLetterTemplate
  ): CoverLetterContent {
    const baseContent = this.generateCoverLetter(job, resumeAnalysis);
    
    // Integrate template information
    const enhancedBody = [
      ...baseContent.body,
      this.addTemplateDetails(template)
    ];

    return {
      ...baseContent,
      body: enhancedBody
    };
  }

  // Generate introduction paragraph
  private generateIntroduction(companyName: string, position: string, resumeAnalysis: any): string {
    const experienceLevel = resumeAnalysis?.experienceLevel || 'professional';
    const keySkills = resumeAnalysis?.skills?.slice(0, 3) || [];
    
    let intro = `I am excited to apply for the ${position} position at ${companyName}.`;
    
    if (keySkills.length > 0) {
      intro += ` As a ${experienceLevel} with expertise in ${keySkills.join(', ')}, I bring deep experience in building scalable applications—exactly what drives innovative companies like ${companyName}.`;
    } else {
      intro += ` As a dedicated ${experienceLevel}, I am confident that my skills and experience align perfectly with your requirements.`;
    }
    
    return intro;
  }

  // Generate body paragraphs
  private generateBody(
    job: any, 
    resumeAnalysis: any, 
    jobAnalysis: any, 
    highlights: string[]
  ): string[] {
    const body: string[] = [];
    
    // Paragraph 1: Skills and experience match with concrete examples
    const matchingSkills = this.extractMatchingSkills(jobAnalysis);
    if (matchingSkills.length > 0) {
      body.push(
        `My hands‑on experience with ${matchingSkills.join(', ')} perfectly aligns with your requirements. ` +
        `In my current role, I designed and delivered a multi‑tenant SaaS platform that integrated React front‑end, ` +
        `Node.js micro‑services, and MongoDB data stores, serving over 50,000 active users while cutting deployment time by 30 % ` +
        `through CI/CD automation on Kubernetes. This experience translates directly to ${job.company}'s mission of building robust full‑stack applications.`
      );
    }

    // Paragraph 2: Leadership and process improvements
    const experienceLevel = resumeAnalysis?.experienceLevel || 'mid';
    if (experienceLevel === 'senior' || experienceLevel === 'lead') {
      body.push(
        `Beyond technical delivery, I championed a DevSecOps culture—embedding security scans, automated testing, and blue‑green deployments ` +
        `that reduced production incidents by 40 %. My passion for rapid iteration and collaborative Agile practices ensures I can hit the ground running, ` +
        `contribute to your product roadmap, and help ${job.company} scale its engineering impact.`
      );
    } else if (experienceLevel === 'mid') {
      body.push(
        `I am passionate about rapid iteration and collaborative Agile practices. My experience with CI/CD automation and DevSecOps principles ` +
        `has consistently improved team productivity and reduced deployment risks. I am eager to contribute these skills to help ${job.company} achieve its goals.`
      );
    }

    // Paragraph 3: Company-specific alignment and future contribution
    const companyAlignment = this.generateCompanySpecificContent(job, resumeAnalysis);
    if (companyAlignment) {
      body.push(companyAlignment);
    } else {
      body.push(
        `I am genuinely excited about the opportunity to bring my full‑stack and cloud expertise to ${job.company}'s dynamic team, ` +
        `and I look forward to contributing to groundbreaking products that push the boundaries of innovation.`
      );
    }

    return body;
  }

  // Generate closing paragraph
  private generateClosing(companyName: string, position: string): string {
    return (
      `I am particularly drawn to ${companyName} because of your commitment to innovation and excellence. ` +
      `I would welcome the opportunity to discuss how my skills and experience can contribute to your team's success. ` +
      `Thank you for considering my application for the ${position} role.`
    );
  }

  // Add template-specific details
  private addTemplateDetails(template: CoverLetterTemplate): string {
    const details: string[] = [];
    
    if (template.salary) {
      details.push(`Regarding compensation, I am seeking a salary in the range of ${template.salary}.`);
    }
    
    if (template.startDate) {
      details.push(`I am available to start from ${template.startDate}.`);
    }
    
    if (template.workType) {
      details.push(`I am interested in ${template.workType} work arrangements.`);
    }
    
    if (template.location) {
      details.push(`I am excited about the opportunity to work in ${template.location}.`);
    }
    
    return details.join(' ');
  }

  // Extract matching skills from job analysis
  private extractMatchingSkills(jobAnalysis: any): string[] {
    const matchingSkills: string[] = [];
    
    if (jobAnalysis?.reasons) {
      jobAnalysis.reasons.forEach((reason: any) => {
        if (reason.type === 'skill' && reason.matched && reason.text.includes('Matching skills:')) {
          const skills = reason.text.replace('Matching skills: ', '').split(', ');
          matchingSkills.push(...skills);
        }
      });
    }
    
    // Remove duplicates and limit to top 5
    return Array.from(new Set(matchingSkills)).slice(0, 5);
  }

  // Generate company-specific content based on job description
  private generateCompanySpecificContent(job: any, resumeAnalysis: any): string {
    const jobDescription = job.description || '';
    const resumeText = resumeAnalysis?.extractedText || '';
    
    // Look for company values or specific requirements
    const companyKeywords = ['innovation', 'team', 'growth', 'impact', 'collaboration', 'excellence'];
    const foundKeywords = companyKeywords.filter(keyword => 
      jobDescription.toLowerCase().includes(keyword)
    );

    if (foundKeywords.length > 0) {
      return (
        `I am particularly impressed by ${job.company}'s focus on ${foundKeywords.join(' and ')}. ` +
        `My own values and work style align perfectly with this approach, and I am eager to contribute to a team that shares these priorities.`
      );
    }

    return '';
  }

  // Generate different cover letter variants
  generateCoverLetterVariants(
    job: any, 
    resumeAnalysis: any, 
    count: number = 3
  ): CoverLetterContent[] {
    const variants: CoverLetterContent[] = [];
    
    for (let i = 0; i < count; i++) {
      const variant = this.generateCoverLetter(job, resumeAnalysis);
      
      // Add variation to each variant
      if (i === 1) {
        // More formal tone
        variant.introduction = variant.introduction.replace('I am excited to apply', 'I am writing to express my strong interest');
        variant.closing = variant.closing.replace('I am particularly drawn', 'I am particularly interested');
      } else if (i === 2) {
        // More conversational tone
        variant.introduction = variant.introduction.replace('I am excited to apply', "I'm thrilled to apply");
        variant.closing = variant.closing.replace('I would welcome the opportunity', "I'd love the opportunity");
      }
      
      variants.push(variant);
    }
    
    return variants;
  }

  // Generate cover letter for specific scenarios
  generateCareerChangeCoverLetter(job: any, resumeAnalysis: any): CoverLetterContent {
    const baseContent = this.generateCoverLetter(job, resumeAnalysis);
    
    // Add career change specific content
    const careerChangeParagraph = (
      `While my background may be in a different field, I have been proactively developing the skills required for this role. ` +
      `My transferable skills in problem-solving, communication, and project management, combined with my recent technical training, ` +
      `position me to bring a unique perspective to your team.`
    );

    return {
      ...baseContent,
      body: [careerChangeParagraph, ...baseContent.body]
    };
  }

  generateEntryLevelCoverLetter(job: any, resumeAnalysis: any): CoverLetterContent {
    const baseContent = this.generateCoverLetter(job, resumeAnalysis);
    
    // Add entry level specific content
    const entryLevelParagraph = (
      `As an enthusiastic and motivated entry-level candidate, I bring fresh perspectives and a strong desire to learn and grow. ` +
      `My academic background and practical projects have equipped me with the foundational skills needed to contribute effectively to your team.`
    );

    return {
      ...baseContent,
      body: [entryLevelParagraph, ...baseContent.body]
    };
  }

  // Generate properly formatted text for copy-paste
  private generateFormattedText(
    introduction: string,
    body: string[],
    closing: string,
    template?: Partial<CoverLetterTemplate>
  ): string {
    const paragraphs: string[] = [];
    
    // Add salutation
    paragraphs.push('Dear Hiring Committee,');
    paragraphs.push('');
    
    // Add introduction
    paragraphs.push(introduction);
    paragraphs.push('');
    
    // Add body paragraphs with proper spacing
    body.forEach(paragraph => {
      paragraphs.push(paragraph);
      paragraphs.push('');
    });
    
    // Add closing
    paragraphs.push(closing);
    paragraphs.push('');
    paragraphs.push('Thank you for considering my application. I look forward to the opportunity to discuss how my experience can contribute to the success of your team.');
    paragraphs.push('');
    paragraphs.push('Sincerely,');
    paragraphs.push('');
    paragraphs.push('[Your Name]');
    
    // Join with proper line breaks and ensure no escape characters
    return paragraphs.join('\n').replace(/\\n/g, '\n');
  }

  // Generate HTML content for display
  private generateHtmlContent(
    introduction: string,
    body: string[],
    closing: string,
    template?: Partial<CoverLetterTemplate>
  ): string {
    const paragraphs: string[] = [];
    
    // Add date and recipient information if template is provided
    if (template) {
      const today = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      paragraphs.push(`<p class="cover-letter-date">${today}</p>`);
      
      if (template.company) {
        paragraphs.push(`<p class="cover-letter-recipient">`);
        paragraphs.push(`Hiring Manager<br/>`);
        paragraphs.push(`${template.company}<br/>`);
        if (template.location) {
          paragraphs.push(`${template.location}<br/>`);
        }
        paragraphs.push(`</p>`);
      }
    }
    
    // Add introduction
    paragraphs.push(`<p class="cover-letter-introduction">${introduction}</p>`);
    
    // Add body paragraphs
    body.forEach(paragraph => {
      paragraphs.push(`<p class="cover-letter-body">${paragraph}</p>`);
    });
    
    // Add closing
    paragraphs.push(`<p class="cover-letter-closing">${closing}</p>`);
    paragraphs.push(`<p class="cover-letter-signature">Sincerely,<br/>[Your Name]</p>`);
    
    return paragraphs.join('\n');
  }

  // Generate clean text without any formatting artifacts
  generateCleanText(content: CoverLetterContent): string {
    // Remove any potential formatting artifacts and ensure clean text
    return content.formattedText
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Remove excessive empty lines
      .replace(/[^\x20-\x7E\n]/g, '') // Remove non-ASCII characters except newlines
      .trim();
  }

  // Generate text optimized for email/online applications
  generateEmailFormat(content: CoverLetterContent): string {
    const lines = content.formattedText.split('\n');
    const emailLines: string[] = [];
    
    let inParagraph = false;
    lines.forEach(line => {
      const trimmed = line.trim();
      
      if (trimmed === '') {
        if (inParagraph) {
          emailLines.push(''); // Add single line break between paragraphs
          inParagraph = false;
        }
      } else {
        if (!inParagraph) {
          emailLines.push(trimmed);
          inParagraph = true;
        } else {
          // Continue paragraph on same line for email format
          emailLines[emailLines.length - 1] += ' ' + trimmed;
        }
      }
    });
    
    return emailLines.join('\n');
  }

  // Generate enhanced AI prompt for better cover letter generation
  generateEnhancedPrompt(job: any, resumeAnalysis: any): string {
    const companyName = job.company || 'the company';
    const position = job.title || 'the position';
    const jobDescription = job.description || '';
    const skills = resumeAnalysis?.skills || [];
    const experienceLevel = resumeAnalysis?.experienceLevel || 'mid';
    
    return `Generate a professional, compelling cover letter for a ${position} position at ${companyName}.

CONTEXT:
- Company: ${companyName}
- Position: ${position}
- Job Description: ${jobDescription}
- Candidate Skills: ${skills.join(', ')}
- Experience Level: ${experienceLevel}

REQUIREMENTS:
1. Write in a professional, confident tone
2. Include specific, quantifiable achievements (metrics, percentages, user numbers)
3. Highlight how candidate's skills directly match job requirements
4. Show understanding of the company's mission and values
5. Demonstrate leadership and collaboration experience
6. Include technical depth with specific technologies mentioned
7. Add concrete examples of project impact and business results
8. Close with strong call-to-action and enthusiasm

STRUCTURE:
- Salutation: "Dear Hiring Committee,"
- Introduction: Express excitement and highlight key qualifications
- Body Paragraph 1: Technical skills with specific project examples and metrics
- Body Paragraph 2: Leadership, collaboration, and process improvements
- Body Paragraph 3: Company alignment and future contribution
- Closing: Professional closing with forward-looking statement
- Sign-off: "Thank you for considering my application. I look forward to discussing how my experience can contribute to the success of ${companyName}."

FORMAT REQUIREMENTS:
- Use proper paragraph breaks (double line breaks between paragraphs)
- Write in clean, copy-paste ready format
- No escape characters or formatting artifacts
- Professional business letter format
- Length: 3-4 paragraphs total

EXAMPLE STYLE:
"I am excited to apply for the Senior Frontend Developer position at TechCorp India. With over a decade of experience delivering AI‑enabled, cloud‑native solutions for Fortune‑500 clients, I have repeatedly translated complex business requirements into highly responsive, user‑centric web applications."

Generate the complete cover letter now.`;
  }

  // Process AI-generated text to ensure proper formatting
  processAIGeneratedText(aiText: string): CoverLetterContent {
    // Clean up the AI-generated text more aggressively
    let cleanText = aiText
      .replace(/\\n/g, '\n') // Convert escape sequences to actual line breaks
      .replace(/\\t/g, ' ') // Convert tab escapes to spaces
      .replace(/\\r/g, '') // Remove carriage return escapes
      .replace(/\\"/g, '"') // Fix escaped quotes
      .replace(/\\'/g, "'") // Fix escaped single quotes
      .replace(/\\\\/g, '\\') // Fix double backslashes
      .replace(/\n{3,}/g, '\n\n') // Remove excessive empty lines
      .replace(/^\s+|\s+$/g, '') // Trim leading/trailing whitespace
      .replace(/[^\x20-\x7E\n\r\t]/g, '') // Remove non-ASCII characters except basic whitespace
      .replace(/\s{2,}/g, ' ') // Replace multiple spaces with single space
      .replace(/\n\s+\n/g, '\n\n') // Remove spaces between paragraphs
      .trim();

    // Handle case where text might be wrapped in quotes or have JSON formatting
    if (cleanText.startsWith('"') && cleanText.endsWith('"')) {
      cleanText = cleanText.slice(1, -1);
    }
    
    // Remove any remaining JSON-like formatting
    cleanText = cleanText.replace(/^"cover_letter":\s*"/, '').replace(/"\s*$/, '');

    // Split into paragraphs
    const paragraphs = cleanText.split('\n\n').filter(p => p.trim().length > 0);
    
    // If no paragraphs found, try splitting by single line breaks
    const finalParagraphs = paragraphs.length > 0 ? paragraphs : 
      cleanText.split('\n').filter(p => p.trim().length > 0);
    
    // Extract components
    let salutation = 'Dear Hiring Committee,';
    let introduction = '';
    let body: string[] = [];
    let closing = '';
    let signature = 'Sincerely,';
    
    let currentSection = 'introduction';
    
    finalParagraphs.forEach((paragraph, index) => {
      const trimmed = paragraph.trim();
      
      // Skip empty paragraphs
      if (!trimmed) return;
      
      // Detect salutation
      if (trimmed.toLowerCase().includes('dear') && 
          (trimmed.toLowerCase().includes('hiring') || 
           trimmed.toLowerCase().includes('committee') || 
           trimmed.toLowerCase().includes('manager') ||
           trimmed.toLowerCase().includes('team'))) {
        salutation = trimmed;
        return;
      }
      
      // Detect signature/closing
      if (trimmed.toLowerCase().includes('sincerely') || 
          trimmed.toLowerCase().includes('regards') || 
          trimmed.toLowerCase().includes('best regards') ||
          trimmed.toLowerCase().includes('respectfully')) {
        signature = trimmed;
        return;
      }
      
      // Detect thank you/closing statement
      if (trimmed.toLowerCase().includes('thank you') || 
          trimmed.toLowerCase().includes('look forward') ||
          trimmed.toLowerCase().includes('excited to discuss') ||
          trimmed.toLowerCase().includes('opportunity to')) {
        closing = trimmed;
        return;
      }
      
      // Assign to appropriate section
      if (currentSection === 'introduction' && introduction === '') {
        introduction = trimmed;
      } else if (currentSection === 'introduction' && body.length === 0) {
        // If this looks like a body paragraph (longer text), start body section
        if (trimmed.length > 100) {
          body.push(trimmed);
          currentSection = 'body';
        } else {
          // Still part of introduction
          introduction += ' ' + trimmed;
        }
      } else if (currentSection === 'body') {
        body.push(trimmed);
      }
    });
    
    // Ensure we have content in each section
    if (!introduction && finalParagraphs.length > 0) {
      introduction = finalParagraphs[0];
      if (finalParagraphs.length > 1) {
        body = finalParagraphs.slice(1);
      }
    }
    
    // Generate formatted text with proper structure
    const formattedParagraphs = [salutation, '', introduction];
    body.forEach(p => {
      formattedParagraphs.push('');
      formattedParagraphs.push(p);
    });
    if (closing) {
      formattedParagraphs.push('');
      formattedParagraphs.push(closing);
    }
    formattedParagraphs.push('', 'Thank you for considering my application. I look forward to the opportunity to discuss how my experience can contribute to the success of your team.', '', signature, '', '[Your Name]');
    
    // Final cleanup of formatted text
    let formattedText = formattedParagraphs.join('\n');
    formattedText = formattedText
      .replace(/\n{3,}/g, '\n\n') // Remove excessive empty lines
      .replace(/[^\x20-\x7E\n\r]/g, '') // Remove any remaining non-ASCII characters
      .trim();
    
    // Generate HTML content
    const htmlParagraphs = [
      `<p class="cover-letter-salutation">${salutation}</p>`,
      `<p class="cover-letter-introduction">${introduction}</p>`
    ];
    body.forEach(p => {
      htmlParagraphs.push(`<p class="cover-letter-body">${p}</p>`);
    });
    if (closing) {
      htmlParagraphs.push(`<p class="cover-letter-closing">${closing}</p>`);
    }
    htmlParagraphs.push(`<p class="cover-letter-thank-you">Thank you for considering my application. I look forward to the opportunity to discuss how my experience can contribute to the success of your team.</p>`);
    htmlParagraphs.push(`<p class="cover-letter-signature">${signature}<br/>[Your Name]</p>`);
    
    const htmlContent = htmlParagraphs.join('\n');
    
    return {
      introduction,
      body,
      highlights: [], // Would be populated separately
      closing,
      signature: 'Sincerely,',
      formattedText,
      htmlContent
    };
  }
}

export default CoverLetterService.getInstance();
