import React from 'react';
import { CheckCircleIcon, BuildingOfficeIcon, MapPinIcon } from '@heroicons/react/24/outline';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description?: string;
  keywords?: string[];
  responsibilities?: string[];
  requirements?: string[];
  matchScore?: number;
  personalizedScore?: number;
  salary?: string;
}

interface JobSelectionProps {
  jobs: Job[];
  selectedJob: Job | null;
  onJobSelect: (job: Job | null) => void;
  isLoading?: boolean;
}

const JobSelection: React.FC<JobSelectionProps> = ({ 
  jobs, 
  selectedJob, 
  onJobSelect, 
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <div className="text-center py-8">
          <BuildingOfficeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No Jobs Available</p>
          <p className="text-gray-500 text-sm">
            Start your job search to see opportunities here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-green-50 rounded-lg">
          <BuildingOfficeIcon className="w-5 h-5 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Select Job</h3>
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
          {jobs.length} Available
        </span>
      </div>

      <div className="space-y-3">
        {jobs.map((job) => (
          <label
            key={job.id}
            className={`block border rounded-lg p-4 cursor-pointer transition-all ${
              selectedJob?.id === job.id
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <input
              type="radio"
              name="job-selection"
              value={job.id}
              checked={selectedJob?.id === job.id}
              onChange={(e) => {
                if (e.target.checked) {
                  onJobSelect(job);
                }
              }}
              className="sr-only"
            />
            
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {selectedJob?.id === job.id && (
                    <CheckCircleIcon className="w-4 h-4 text-blue-600" />
                  )}
                  <h4 className="font-medium text-gray-900">{job.title}</h4>
                </div>
                
                <div className="text-sm text-gray-600 mb-2">
                  {job.company} • {job.location}
                </div>
                
                {job.description && (
                  <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                    {job.description}
                  </p>
                )}
                
                {/* Score indicators */}
                {(job.matchScore !== undefined || job.personalizedScore !== undefined) && (
                  <div className="flex items-center gap-4 text-xs">
                    {job.matchScore !== undefined && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Match:</span>
                        <span className={`font-medium ${
                          job.matchScore >= 80 ? 'text-green-600' :
                          job.matchScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {job.matchScore}%
                        </span>
                      </div>
                    )}
                    {job.personalizedScore !== undefined && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Personalized:</span>
                        <span className={`font-medium ${
                          job.personalizedScore >= 80 ? 'text-green-600' :
                          job.personalizedScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {job.personalizedScore}%
                        </span>
                      </div>
                    )}
                  </div>
                )}
                
                {job.salary && (
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-gray-500">Salary:</span>
                    <span className="font-medium text-gray-900">{job.salary}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-1 text-gray-400">
                <MapPinIcon className="w-4 h-4" />
                <span className="text-xs">
                  {job.location.includes('Remote') ? 'Remote' : job.location}
                </span>
              </div>
            </div>
          </label>
        ))}
      </div>
      
      {selectedJob && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Selected: <span className="font-medium text-gray-900">{selectedJob.title}</span> at {selectedJob.company}
            </div>
            <button
              onClick={() => onJobSelect(null)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobSelection;
