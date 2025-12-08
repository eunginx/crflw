import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import PersonalizedJobService from '../../services/personalizedJobService';
import { 
  PlayIcon, 
  StopIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  ChartBarIcon,
  DocumentTextIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

// Types for dry run simulation
interface DryRunJob {
  id: string;
  title: string;
  company: string;
  location: string;
  matchScore: number;
  personalizedScore: number;
  status: 'pending' | 'analyzing' | 'approved' | 'rejected' | 'blocked';
  reason?: string;
  applicationType: 'automatic' | 'manual' | 'blocked';
  estimatedTime: number;
  resumeVersion: string;
  coverLetterRequired: boolean;
  followUpRequired: boolean;
  notes: string[];
}

interface DryRunSettings {
  maxApplications: number;
  minMatchScore: number;
  minPersonalizedScore: number;
  includeRemoteOnly: boolean;
  includeManualApplications: boolean;
  dryRunMode: 'conservative' | 'balanced' | 'aggressive';
}

interface DryRunResults {
  totalJobs: number;
  approvedApplications: number;
  rejectedApplications: number;
  blockedApplications: number;
  manualApplications: number;
  estimatedTime: number;
  successRate: number;
  averageMatchScore: number;
  averagePersonalizedScore: number;
  totalCoverLetters: number;
}

const DryRunSimulation: React.FC = () => {
  const { profile, preferences } = useUser();
  const [isRunning, setIsRunning] = useState(false);
  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [jobs, setJobs] = useState<DryRunJob[]>([]);
  const [settings, setSettings] = useState<DryRunSettings>({
    maxApplications: 10,
    minMatchScore: 60,
    minPersonalizedScore: 65,
    includeRemoteOnly: false,
    includeManualApplications: false,
    dryRunMode: 'balanced'
  });
  const [results, setResults] = useState<DryRunResults | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Mock job data - in real app, this would come from API
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
    },
    {
      id: 'job-3',
      title: 'React Developer',
      company: 'InnovateCo',
      location: 'New York, NY',
      description: 'Junior to mid-level React position with growth opportunities...'
    },
    {
      id: 'job-4',
      title: 'JavaScript Developer',
      company: 'WebSolutions',
      location: 'Austin, TX',
      description: 'Frontend developer role with modern JavaScript frameworks...'
    },
    {
      id: 'job-5',
      title: 'Frontend Engineer',
      company: 'DesignAgency',
      location: 'Remote',
      description: 'Creative frontend developer with design sensibility needed...'
    }
  ];

  // Initialize jobs with analysis
  useEffect(() => {
    if (profile && preferences) {
      const analyzedJobs = mockJobs.map(job => {
        const analysis = PersonalizedJobService.analyzePersonalizedMatch(job, { profile, preferences });
        
        return {
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          matchScore: analysis.score,
          personalizedScore: analysis.personalizedScore,
          status: 'pending' as const,
          applicationType: 'automatic' as const,
          estimatedTime: Math.floor(Math.random() * 60) + 30, // 30-90 seconds
          resumeVersion: 'resume_v2.pdf',
          coverLetterRequired: true,
          followUpRequired: Math.random() > 0.7,
          notes: []
        };
      });
      
      setJobs(analyzedJobs);
    }
  }, [profile, preferences]);

  // Run dry run simulation
  const startDryRun = async () => {
    if (!profile || !preferences) return;

    setIsRunning(true);
    setCurrentJobIndex(0);
    setResults(null);

    // Reset all jobs to pending
    setJobs(prevJobs => prevJobs.map(job => ({ ...job, status: 'pending', notes: [] })));

    // Process each job
    for (let i = 0; i < Math.min(settings.maxApplications, jobs.length); i++) {
      setCurrentJobIndex(i);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setJobs(prevJobs => {
        const newJobs = [...prevJobs];
        const job = newJobs[i];
        
        job.status = 'analyzing';
        return newJobs;
      });

      // Simulate analysis time
      await new Promise(resolve => setTimeout(resolve, 500));

      // Determine application decision
      const currentJob = jobs[i];
      const decision = analyzeApplicationDecision(currentJob, settings);
      
      setJobs(prevJobs => {
        const newJobs = [...prevJobs];
        const job = newJobs[i];
        
        job.status = decision.status;
        job.reason = decision.reason;
        job.applicationType = decision.applicationType;
        job.notes = decision.notes;
        
        return newJobs;
      });
    }

    // Calculate final results
    const finalResults = calculateResults(jobs.slice(0, settings.maxApplications));
    setResults(finalResults);
    setIsRunning(false);
    setCurrentJobIndex(0);
  };

  // Analyze whether to apply to a job
  const analyzeApplicationDecision = (job: DryRunJob, settings: DryRunSettings) => {
    const notes: string[] = [];
    let status: DryRunJob['status'] = 'pending';
    let reason = '';
    let applicationType: DryRunJob['applicationType'] = 'automatic';

    // Check minimum score thresholds
    if (job.personalizedScore < settings.minPersonalizedScore) {
      status = 'blocked';
      reason = `Below personalized score threshold (${settings.minPersonalizedScore}%)`;
      notes.push(`Personalized score: ${job.personalizedScore}%`);
      applicationType = 'blocked';
    } else if (job.matchScore < settings.minMatchScore) {
      status = 'blocked';
      reason = `Below match score threshold (${settings.minMatchScore}%)`;
      notes.push(`Match score: ${job.matchScore}%`);
      applicationType = 'blocked';
    }
    // Check remote preference
    else if (settings.includeRemoteOnly && !job.location.toLowerCase().includes('remote')) {
      status = 'rejected';
      reason = 'Location preference (remote only)';
      notes.push('Job requires on-site presence');
      applicationType = 'manual';
    }
    // Check if manual application based on complexity
    else if (job.coverLetterRequired && !settings.includeManualApplications && Math.random() > 0.7) {
      status = 'rejected';
      reason = 'Requires manual cover letter';
      notes.push('Complex application requires manual review');
      applicationType = 'manual';
    }
    // Approve for automatic application
    else {
      status = 'approved';
      reason = 'Meets all criteria for automatic application';
      notes.push('High match score', 'Good location fit', 'Resume alignment');
      applicationType = 'automatic';
    }

    return { status, reason, applicationType, notes };
  };

  // Calculate simulation results
  const calculateResults = (processedJobs: DryRunJob[]): DryRunResults => {
    const approved = processedJobs.filter(j => j.status === 'approved').length;
    const rejected = processedJobs.filter(j => j.status === 'rejected').length;
    const blocked = processedJobs.filter(j => j.status === 'blocked').length;
    const manual = processedJobs.filter(j => j.applicationType === 'manual').length;
    
    const totalTime = processedJobs.reduce((sum, job) => sum + job.estimatedTime, 0);
    const avgMatch = processedJobs.reduce((sum, job) => sum + job.matchScore, 0) / processedJobs.length;
    const avgPersonalized = processedJobs.reduce((sum, job) => sum + job.personalizedScore, 0) / processedJobs.length;
    const coverLetters = processedJobs.filter(j => j.coverLetterRequired && j.status === 'approved').length;

    return {
      totalJobs: processedJobs.length,
      approvedApplications: approved,
      rejectedApplications: rejected,
      blockedApplications: blocked,
      manualApplications: manual,
      estimatedTime: totalTime,
      successRate: processedJobs.length > 0 ? (approved / processedJobs.length) * 100 : 0,
      averageMatchScore: Math.round(avgMatch),
      averagePersonalizedScore: Math.round(avgPersonalized),
      totalCoverLetters: coverLetters
    };
  };

  const getStatusIcon = (status: DryRunJob['status']) => {
    switch (status) {
      case 'approved': return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'rejected': return <XCircleIcon className="w-5 h-5 text-red-600" />;
      case 'blocked': return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />;
      case 'analyzing': return <ClockIcon className="w-5 h-5 text-blue-600 animate-spin" />;
      default: return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: DryRunJob['status']) => {
    switch (status) {
      case 'approved': return 'bg-green-50 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-50 text-red-800 border-red-200';
      case 'blocked': return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'analyzing': return 'bg-blue-50 text-blue-800 border-blue-200';
      default: return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (!profile || !preferences) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <SparklesIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Complete Your Profile First</h3>
          <p className="text-gray-600">
            Set up your profile and preferences to run dry-run simulations
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 rounded-lg">
          <ChartBarIcon className="w-5 h-5 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Dry-Run Simulation</h3>
        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
          Test Before Applying
        </span>
      </div>

      {/* Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Applications
          </label>
          <input
            type="number"
            min="1"
            max="50"
            value={settings.maxApplications}
            onChange={(e) => setSettings({...settings, maxApplications: parseInt(e.target.value) || 1})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isRunning}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Match Score (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={settings.minMatchScore}
            onChange={(e) => setSettings({...settings, minMatchScore: parseInt(e.target.value) || 0})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isRunning}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Personalized Score (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={settings.minPersonalizedScore}
            onChange={(e) => setSettings({...settings, minPersonalizedScore: parseInt(e.target.value) || 0})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isRunning}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Simulation Mode
          </label>
          <select
            value={settings.dryRunMode}
            onChange={(e) => setSettings({...settings, dryRunMode: e.target.value as 'conservative' | 'balanced' | 'aggressive'})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isRunning}
          >
            <option value="conservative">Conservative (High standards)</option>
            <option value="balanced">Balanced (Moderate standards)</option>
            <option value="aggressive">Aggressive (Low standards)</option>
          </select>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="remote-only"
            checked={settings.includeRemoteOnly}
            onChange={(e) => setSettings({...settings, includeRemoteOnly: e.target.checked})}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            disabled={isRunning}
          />
          <label htmlFor="remote-only" className="ml-2 text-sm text-gray-700">
            Remote jobs only
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="include-manual"
            checked={settings.includeManualApplications}
            onChange={(e) => setSettings({...settings, includeManualApplications: e.target.checked})}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            disabled={isRunning}
          />
          <label htmlFor="include-manual" className="ml-2 text-sm text-gray-700">
            Include manual applications
          </label>
        </div>
      </div>

      {/* Control Button */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={isRunning ? () => {} : startDryRun}
          disabled={isRunning || jobs.length === 0}
          className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            isRunning
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isRunning ? (
            <>
              <ClockIcon className="w-4 h-4 animate-spin" />
              Simulating... ({currentJobIndex + 1}/{settings.maxApplications})
            </>
          ) : (
            <>
              <PlayIcon className="w-4 h-4" />
              Start Dry-Run
            </>
          )}
        </button>

        {results && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </button>
        )}
      </div>

      {/* Results Summary */}
      {results && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Simulation Results</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{results.approvedApplications}</div>
              <div className="text-xs text-gray-600">Auto-Apply</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{results.manualApplications}</div>
              <div className="text-xs text-gray-600">Manual</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{results.blockedApplications}</div>
              <div className="text-xs text-gray-600">Blocked</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{Math.round(results.successRate)}%</div>
              <div className="text-xs text-gray-600">Success Rate</div>
            </div>
          </div>
        </div>
      )}

      {/* Job Details */}
      {showDetails && jobs.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Job Analysis</h4>
          {jobs.slice(0, settings.maxApplications).map((job, index) => (
            <div key={job.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(job.status)}
                    <h5 className="font-medium text-gray-900">{job.title}</h5>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {job.company} • {job.location}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Match</div>
                  <div className="font-bold">{job.matchScore}% / {job.personalizedScore}%</div>
                </div>
              </div>
              
              {job.reason && (
                <div className="text-sm text-gray-700 mt-2">
                  <strong>Reason:</strong> {job.reason}
                </div>
              )}
              
              {job.notes.length > 0 && (
                <div className="text-xs text-gray-600 mt-1">
                  {job.notes.join(' • ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DryRunSimulation;
