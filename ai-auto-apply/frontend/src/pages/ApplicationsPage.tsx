import { useJobs } from '../context/JobContext';

const ApplicationsPage = () => {
  const { jobs, loading, error } = useJobs();

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

  const appliedJobs = jobs.filter(job => job.status === 'applied');

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Your Applications</h2>
        <p className="text-gray-600 mt-1">Track your job applications</p>
      </div>
      
      {appliedJobs.length === 0 ? (
        <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
            <p className="text-gray-600">Start applying to jobs to see them here</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {appliedJobs.map((job) => (
            <div key={job.id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                  <p className="text-gray-600">{job.company}</p>
                  {job.appliedDate && (
                    <p className="text-sm text-gray-500 mt-1">
                      Applied on {job.appliedDate.toLocaleDateString()}
                    </p>
                  )}
                </div>
                <span className="inline-block px-3 py-1 text-sm rounded-full bg-green-100 text-green-800">
                  Applied
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApplicationsPage;
