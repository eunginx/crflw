import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { 
  DocumentTextIcon, 
  SparklesIcon, 
  ClipboardDocumentIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

// Types for cover letter
interface CoverLetterData {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  location: string;
  content: string;
  tone: 'professional' | 'enthusiastic' | 'technical' | 'casual';
  length: 'concise' | 'standard' | 'detailed';
  generatedAt: string;
  personalizedScore: number;
  highlightedSkills: string[];
  customizationNotes: string[];
}

interface CoverLetterTemplate {
  id: string;
  name: string;
  description: string;
  tone: CoverLetterData['tone'];
  length: CoverLetterData['length'];
  preview: string;
}

const CoverLetterPreview: React.FC = () => {
  const { profile, preferences } = useUser();
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [coverLetter, setCoverLetter] = useState<CoverLetterData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('professional');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [showPreview, setShowPreview] = useState(true);

  // Mock job data - in real app, this would come from props or API
  const mockJobs = [
    {
      id: 'job-1',
      title: 'Senior Frontend Developer',
      company: 'TechCorp',
      location: 'San Francisco, CA',
      description: 'Looking for experienced React developer with TypeScript skills...'
    },
    {
      id: 'job-2',
      title: 'Full Stack Engineer',
      company: 'StartupXYZ',
      location: 'Remote',
      description: 'Seeking full stack developer with Node.js and React experience...'
    }
  ];

  // Cover letter templates
  const templates: CoverLetterTemplate[] = [
    {
      id: 'professional',
      name: 'Professional',
      description: 'Traditional, formal tone suitable for corporate environments',
      tone: 'professional',
      length: 'standard',
      preview: 'Dear Hiring Manager, I am writing to express my interest in the [Position] role at [Company]...'
    },
    {
      id: 'enthusiastic',
      name: 'Enthusiastic',
      description: ' energetic and passionate tone showing excitement for the role',
      tone: 'enthusiastic',
      length: 'standard',
      preview: 'I am thrilled to apply for the [Position] opportunity at [Company]! The chance to...'
    },
    {
      id: 'technical',
      name: 'Technical Focus',
      description: 'Emphasizes technical skills and technical achievements',
      tone: 'technical',
      length: 'detailed',
      preview: 'With extensive experience in [Key Technologies], I am excited to bring my technical expertise...'
    },
    {
      id: 'concise',
      name: 'Concise',
      description: 'Brief and to-the-point, ideal for applications with strict requirements',
      tone: 'professional',
      length: 'concise',
      preview: 'I am applying for the [Position] role at [Company]. My background includes...'
    }
  ];

  // Generate cover letter
  const generateCoverLetter = async (job: any, templateId: string) => {
    if (!profile || !preferences) return;

    setIsGenerating(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    const template = templates.find(t => t.id === templateId);
    if (!template) {
      setIsGenerating(false);
      return;
    }
    const generatedContent = generateCoverLetterContent(job, profile, template);

    const newCoverLetter: CoverLetterData = {
      id: `cl-${Date.now()}`,
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      location: job.location,
      content: generatedContent,
      tone: template!.tone,
      length: template!.length,
      generatedAt: new Date().toISOString(),
      personalizedScore: Math.floor(Math.random() * 20) + 80, // 80-100
      highlightedSkills: extractSkillsFromContent(generatedContent),
      customizationNotes: generateCustomizationNotes(job, profile)
    };

    setCoverLetter(newCoverLetter);
    setEditedContent(generatedContent);
    setIsGenerating(false);
  };

  // Generate cover letter content based on template and user data
  const generateCoverLetterContent = (job: any, userProfile: any, template: CoverLetterTemplate): string => {
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const userName = userProfile.name || 'Applicant';
    const userLocation = userProfile.location || 'Your Location';
    const userEmail = userProfile.email || 'your.email@example.com';
    const userPhone = userProfile.phone || 'Your Phone';
    
    const skills = userProfile.skills || [];
    const summary = userProfile.summary || '';
    const headline = userProfile.headline || '';

    let content = '';

    switch (template.tone) {
      case 'professional':
        content = `${currentDate}

${userName}
${userLocation}
${userEmail}
${userPhone}

Hiring Manager
${job.company}
${job.location}

Dear Hiring Manager,

I am writing to express my strong interest in the ${job.title} position at ${job.company}. With my background in ${headline}, I am confident that my skills and experience align well with your requirements.

${summary}

My technical expertise includes ${skills.slice(0, 5).join(', ')}. Throughout my career, I have successfully delivered projects that demonstrate my ability to [mention specific achievement]. I am particularly drawn to ${job.company} because of your commitment to [company value or project].

I would welcome the opportunity to discuss how my background can benefit your team. Thank you for considering my application.

Sincerely,
${userName}`;
        break;

      case 'enthusiastic':
        content = `${currentDate}

${userName}
${userLocation}
${userEmail}
${userPhone}

Hiring Manager
${job.company}
${job.location}

Dear Hiring Manager,

I am thrilled to apply for the ${job.title} opportunity at ${job.company}! The chance to contribute my skills to your innovative team excites me greatly.

${summary}

What particularly draws me to this role is the opportunity to work with ${skills.slice(0, 3).join(', ')} in a dynamic environment like ${job.company}. I have been following your work in [specific area] and am impressed by [specific achievement or project].

I am eager to bring my passion and expertise to your team and would love to discuss how I can contribute to your continued success.

Best regards,
${userName}`;
        break;

      case 'technical':
        content = `${currentDate}

${userName}
${userLocation}
${userEmail}
${userPhone}

Hiring Manager
${job.company}
${job.location}

Dear Hiring Manager,

I am applying for the ${job.title} position with extensive experience in ${skills.slice(0, 4).join(', ')}. My technical background aligns perfectly with the requirements outlined in your job description.

Technical Expertise:
• ${skills.slice(0, 6).join('\n• ')}

${summary}

I have successfully implemented [specific technical solution] that resulted in [quantifiable outcome]. My approach to problem-solving involves [technical methodology], which I believe would be valuable to your team at ${job.company}.

I would appreciate the opportunity to discuss the technical aspects of this role and how my expertise can benefit your projects.

Sincerely,
${userName}`;
        break;

      case 'casual':
        content = `${currentDate}

${userName}
${userLocation}
${userEmail}
${userPhone}

Hiring Manager
${job.company}
${job.location}

Dear Hiring Manager,

I'm excited to apply for the ${job.title} position at ${job.company}. With my background in ${headline}, I think I'd be a great fit for your team.

${summary}

My skills include ${skills.slice(0, 5).join(', ')}, and I've really enjoyed following ${job.company}'s work in the industry. I'd love to chat about how I can contribute to your projects.

Looking forward to hearing from you!

Best,
${userName}`;
        break;

      default:
        content = `${currentDate}

${userName}
${userLocation}
${userEmail}
${userPhone}

Hiring Manager
${job.company}
${job.location}

Dear Hiring Manager,

I am writing to express my interest in the ${job.title} position at ${job.company}.

${summary}

I believe my skills and experience would make me a valuable addition to your team.

Sincerely,
${userName}`;
    }

    // Apply length modifications
    switch (template.length) {
      case 'concise':
        // Make content more concise
        content = content.split('\n').filter(line => line.trim()).slice(0, 10).join('\n');
        break;
      case 'detailed':
        // Add more detail (already handled in tone-specific content)
        break;
      case 'standard':
      default:
        // Use content as-is
        break;
    }

    return content;
  };

  // Extract skills mentioned in content
  const extractSkillsFromContent = (content: string): string[] => {
    if (!profile?.skills) return [];
    
    return profile.skills.filter(skill => 
      content.toLowerCase().includes(skill.toLowerCase())
    );
  };

  // Generate customization notes
  const generateCustomizationNotes = (job: any, userProfile: any): string[] => {
    const notes: string[] = [];
    
    if (job.description && userProfile.skills) {
      const jobDesc = job.description.toLowerCase();
      const matchingSkills = userProfile.skills.filter((skill: string) => 
        jobDesc.includes(skill.toLowerCase())
      );
      
      if (matchingSkills.length > 0) {
        notes.push(`Highlighted ${matchingSkills.length} matching skills: ${matchingSkills.slice(0, 3).join(', ')}`);
      }
    }
    
    notes.push(`Customized for ${job.company}'s culture and values`);
    notes.push(`Tailored to ${job.title} requirements`);
    
    return notes;
  };

  // Copy to clipboard
  const copyToClipboard = () => {
    const contentToCopy = isEditing ? editedContent : coverLetter?.content;
    if (contentToCopy) {
      navigator.clipboard.writeText(contentToCopy);
    }
  };

  // Download as text file
  const downloadAsText = () => {
    const contentToDownload = isEditing ? editedContent : coverLetter?.content;
    if (contentToDownload && coverLetter) {
      const blob = new Blob([contentToDownload], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Cover_Letter_${coverLetter.company}_${coverLetter.jobTitle}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Save edited content
  const saveEdits = () => {
    if (coverLetter) {
      setCoverLetter({
        ...coverLetter,
        content: editedContent
      });
      setIsEditing(false);
    }
  };

  if (!profile || !preferences) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Complete Your Profile First</h3>
          <p className="text-gray-600">
            Set up your profile to generate personalized cover letters
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 rounded-lg">
          <DocumentTextIcon className="w-5 h-5 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Cover Letter Generator</h3>
        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
          AI-Powered
        </span>
      </div>

      {/* Job Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Job
        </label>
        <select
          value={selectedJob?.id || ''}
          onChange={(e) => {
            const job = mockJobs.find(j => j.id === e.target.value);
            setSelectedJob(job || null);
            setCoverLetter(null);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Choose a job...</option>
          {mockJobs.map(job => (
            <option key={job.id} value={job.id}>
              {job.title} at {job.company}
            </option>
          ))}
        </select>
      </div>

      {/* Template Selection */}
      {selectedJob && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cover Letter Style
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {templates.map(template => (
              <label
                key={template.id}
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  selectedTemplate === template.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="template"
                  value={template.id}
                  checked={selectedTemplate === template.id}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="sr-only"
                />
                <div className="font-medium text-gray-900">{template.name}</div>
                <div className="text-sm text-gray-600 mt-1">{template.description}</div>
                <div className="text-xs text-gray-500 mt-2 italic">"{template.preview}"</div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Generate Button */}
      {selectedJob && (
        <div className="mb-6">
          <button
            onClick={() => generateCoverLetter(selectedJob, selectedTemplate)}
            disabled={isGenerating}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <SparklesIcon className="w-4 h-4 animate-spin" />
                Generating Cover Letter...
              </>
            ) : (
              <>
                <SparklesIcon className="w-4 h-4" />
                Generate Cover Letter
              </>
            )}
          </button>
        </div>
      )}

      {/* Cover Letter Display */}
      {coverLetter && (
        <div className="space-y-4">
          {/* Header with actions */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">
                Cover Letter for {coverLetter.jobTitle} at {coverLetter.company}
              </h4>
              <div className="text-sm text-gray-600">
                Generated {new Date(coverLetter.generatedAt).toLocaleDateString()} • 
                Personalization Score: {coverLetter.personalizedScore}%
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="p-2 text-gray-600 hover:text-gray-800"
                title={showPreview ? 'Hide Preview' : 'Show Preview'}
              >
                {showPreview ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              </button>
              
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="p-2 text-gray-600 hover:text-gray-800"
                title="Edit"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
              
              <button
                onClick={copyToClipboard}
                className="p-2 text-gray-600 hover:text-gray-800"
                title="Copy to Clipboard"
              >
                <ClipboardDocumentIcon className="w-4 h-4" />
              </button>
              
              <button
                onClick={downloadAsText}
                className="p-2 text-gray-600 hover:text-gray-800"
                title="Download"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Customization Notes */}
          {coverLetter.customizationNotes.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm font-medium text-blue-900 mb-2">Customization Notes:</div>
              <ul className="space-y-1">
                {coverLetter.customizationNotes.map((note, index) => (
                  <li key={index} className="text-sm text-blue-800 flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Highlighted Skills */}
          {coverLetter.highlightedSkills.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-sm font-medium text-green-900 mb-2">Highlighted Skills:</div>
              <div className="flex flex-wrap gap-2">
                {coverLetter.highlightedSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Cover Letter Content */}
          {showPreview && (
            <div className="border border-gray-200 rounded-lg">
              {isEditing ? (
                <div className="p-4">
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full h-96 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    placeholder="Edit your cover letter..."
                  />
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={saveEdits}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditedContent(coverLetter.content);
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-gray-50">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-serif leading-relaxed">
                    {coverLetter.content}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CoverLetterPreview;
