import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { useResumeIntelligence } from '../hooks/useResumeIntelligence';
import { applicationsAPI } from '../services/apiService';
import { StatusChip } from '../components/StatusComponents';
import { analyzeJobMatch, getScoreColor, getScoreIcon } from '../utils/jobMatchingUtils';

const ApplicationsPage = () => {
  const { currentUser } = useAuth();
  const { profile, preferences, loading: userLoading } = useUser();
  const { resumeSkills, hasResume } = useResumeIntelligence();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadApplications = async () => {
      if (currentUser?.email) {
        try {
          setLoading(true);
          const data = await applicationsAPI.getApplications(currentUser.email);
          setApplications(data);
          setError(null);
        } catch (err: any) {
          console.error('Failed to load applications:', err);
          setError(err.message || 'Failed to load applications');
        } finally {
          setLoading(false);
        }
      }
    };

    loadApplications();
  }, [currentUser]);

  // Calculate match scores for applications if resume is available
  const applicationsWithAnalysis = applications.map(app => {
    if (hasResume && resumeSkills) {
      const analysis = analyzeJobMatch(app, resumeSkills);
      return { ...app, analysis };
    }
    return app;
  });

  if (loading || userLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-800">Error: {error}</div>
      </div>
    );
  }

  const appliedJobs = applications.filter(app => app.status === 'applied');
  const interviewJobs = applications.filter(app => app.status === 'interview');
  const offerJobs = applications.filter(app => app.status === 'offer');

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Header with Stats */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Your Applications</h2>
        <p className="text-gray-600 mt-1">Track your job applications and progress</p>

        {/* Quick Stats */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{applications.length}</div>
            <div className="text-sm text-gray-500">Total Applications</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-900">{appliedJobs.length}</div>
            <div className="text-sm text-green-700">Applied</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-900">{interviewJobs.length}</div>
            <div className="text-sm text-blue-700">Interviews</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="text-2xl font-bold text-purple-900">{offerJobs.length}</div>
            <div className="text-sm text-purple-700">Offers</div>
          </div>
        </div>
      </div>

      {/* User Profile Summary */}
      {profile && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-blue-900">
                {profile.firstName} {profile.lastName}
              </h3>
              <p className="text-sm text-blue-700">{profile.headline || 'Professional'}</p>
            </div>
          </div>
        </div>
      )}

      {applications.length === 0 ? (
        <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
            <p className="text-gray-600 mb-4">Start applying to jobs to see them here</p>
            <a
              href="/jobs"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Browse Jobs
            </a>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {applicationsWithAnalysis.map((application) => (
            <div key={application.id} className="bg-white p-6 rounded-lg shadow border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    {/* Company Logo */}
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {application.company?.charAt(0).toUpperCase() || 'C'}
                    </div>

                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{application.title}</h3>
                      <p className="text-gray-600">{application.company}</p>

                      {/* AI Match Score */}
                      {application.analysis && (
                        <div className="mt-2">
                          <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${getScoreColor(application.analysis.score)}`}>
                            <span className="mr-1">{getScoreIcon(application.analysis.score)}</span>
                            {application.analysis.score}% Match
                          </span>
                        </div>
                      )}

                      {/* Application Details */}
                      <div className="mt-3 space-y-1">
                        {application.applied_date && (
                          <p className="text-sm text-gray-500">
                            📅 Applied on {new Date(application.applied_date).toLocaleDateString()}
                          </p>
                        )}
                        {application.location && (
                          <p className="text-sm text-gray-500">
                            📍 {application.location}
                          </p>
                        )}
                        {application.salary_min && application.salary_max && (
                          <p className="text-sm text-gray-500">
                            💰 ${application.salary_min.toLocaleString()} - ${application.salary_max.toLocaleString()}
                          </p>
                        )}
                      </div>

                      {/* AI Insights */}
                      {application.analysis && application.analysis.reasons.length > 0 && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <h4 className="text-xs font-medium text-gray-700 mb-2">Match Insights:</h4>
                          <ul className="space-y-1">
                            {application.analysis.reasons.slice(0, 3).map((reason: any, idx: number) => (
                              <li key={idx} className="text-xs text-gray-600 flex items-start">
                                <span className="mr-1">{reason.matched ? '✓' : '○'}</span>
                                <span>{reason.text}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status and Actions */}
                <div className="flex flex-col items-end gap-2 ml-4">
                  <StatusChip status={application.status} />
                  {application.job_url && (
                    <a
                      href={application.job_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Job →
                    </a>
                  )}
                </div>
              </div>

              {/* Notes */}
              {application.notes && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <strong>Notes:</strong> {application.notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApplicationsPage;
