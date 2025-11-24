import React from 'react';
import { 
  SparklesIcon, 
  UserCircleIcon, 
  AcademicCapIcon,
  BriefcaseIcon,
  CodeBracketIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface ResumeAnalysisProps {
  analysis?: {
    contactInfo?: {
      name?: string;
      email?: string;
      phone?: string;
      linkedin?: string;
      github?: string;
      portfolio?: string;
    };
    sections?: {
      education?: boolean;
      experience?: boolean;
      skills?: boolean;
      projects?: boolean;
      certifications?: boolean;
      summary?: boolean;
    };
    skills?: string[];
    qualityScore?: {
      overall: number;
      structure: number;
      content: number;
      formatting: number;
    };
    recommendations?: string[];
  };
}

const ResumeAnalysisCard: React.FC<ResumeAnalysisProps> = ({ analysis }) => {
  if (!analysis) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <SparklesIcon className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="mt-3 text-lg font-semibold text-gray-900">AI Resume Analysis</h3>
          <p className="mt-2 text-sm text-gray-600">
            Process your resume to get AI-powered insights and recommendations.
          </p>
        </div>
      </div>
    );
  }

  const { contactInfo, sections, skills, qualityScore, recommendations } = analysis;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <SparklesIcon className="h-6 w-6 text-purple-500 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">AI Resume Analysis</h3>
      </div>

      <div className="space-y-6">
        {/* Contact Information */}
        {contactInfo && (
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
              <UserCircleIcon className="h-5 w-5 text-blue-500 mr-2" />
              Contact Information
            </h4>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {contactInfo.name && (
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2 font-medium text-gray-900">{contactInfo.name}</span>
                  </div>
                )}
                {contactInfo.email && (
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-medium text-gray-900">{contactInfo.email}</span>
                  </div>
                )}
                {contactInfo.phone && (
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <span className="ml-2 font-medium text-gray-900">{contactInfo.phone}</span>
                  </div>
                )}
                {contactInfo.linkedin && (
                  <div>
                    <span className="text-gray-600">LinkedIn:</span>
                    <span className="ml-2 font-medium text-blue-600 truncate">{contactInfo.linkedin}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Resume Sections */}
        {sections && (
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Resume Sections Detected</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(sections).map(([section, detected]) => (
                <div
                  key={section}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                    detected
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {detected ? (
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                  ) : (
                    <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                  )}
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {skills && skills.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
              <CodeBracketIcon className="h-5 w-5 text-green-500 mr-2" />
              Skills Detected
            </h4>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Quality Score */}
        {qualityScore && (
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Quality Assessment</h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Overall Score</span>
                  <span className="font-medium text-gray-900">{qualityScore.overall}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      qualityScore.overall >= 80
                        ? 'bg-green-500'
                        : qualityScore.overall >= 60
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${qualityScore.overall}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="text-center">
                  <div className="font-medium text-gray-900">{qualityScore.structure}/100</div>
                  <div className="text-gray-600">Structure</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-900">{qualityScore.content}/100</div>
                  <div className="text-gray-600">Content</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-900">{qualityScore.formatting}/100</div>
                  <div className="text-gray-600">Formatting</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
              <AcademicCapIcon className="h-5 w-5 text-yellow-500 mr-2" />
              AI Recommendations
            </h4>
            <div className="space-y-2">
              {recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start p-3 bg-yellow-50 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-yellow-200 text-yellow-800 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                    {index + 1}
                  </div>
                  <p className="text-sm text-gray-700">{recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeAnalysisCard;
