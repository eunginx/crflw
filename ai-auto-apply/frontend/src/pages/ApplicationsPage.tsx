import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { applicationsAPI } from '../services/apiService';
import { StatusChip } from '../components/StatusComponents';

const ApplicationsPage = () => {
  const { currentUser } = useAuth();
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

  if (loading) {
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

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Your Applications</h2>
        <p className="text-gray-600 mt-1">Track your job applications</p>
      </div>
      
      {applications.length === 0 ? (
        <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
            <p className="text-gray-600">Start applying to jobs to see them here</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {applications.map((application) => (
            <div key={application.id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{application.title}</h3>
                  <p className="text-gray-600">{application.company}</p>
                  {application.applied_date && (
                    <p className="text-sm text-gray-500 mt-1">
                      Applied on {new Date(application.applied_date).toLocaleDateString()}
                    </p>
                  )}
                  {application.location && (
                    <p className="text-sm text-gray-500 mt-1">
                      📍 {application.location}
                    </p>
                  )}
                  {application.salary_min && application.salary_max && (
                    <p className="text-sm text-gray-500 mt-1">
                      💰 ${application.salary_min.toLocaleString()} - ${application.salary_max.toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end">
                  <StatusChip status={application.status} />
                  {application.job_url && (
                    <a
                      href={application.job_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm mt-2"
                    >
                      View Job Posting
                    </a>
                  )}
                </div>
              </div>
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
