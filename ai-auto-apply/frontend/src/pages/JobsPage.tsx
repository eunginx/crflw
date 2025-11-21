import { useJobs } from '../context/JobContext';

const JobsPage = () => {
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

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Jobs Page</h2>
          <p className="text-gray-600 mb-4">Browse and apply to jobs</p>
          <div className="space-y-2">
            {jobs.length === 0 ? (
              <p>No jobs found</p>
            ) : (
              jobs.map((job) => (
                <div key={job.id} className="bg-white p-4 rounded shadow">
                  <h3 className="font-semibold">{job.title}</h3>
                  <p className="text-gray-600">{job.company}</p>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    job.status === 'applied' ? 'bg-green-100 text-green-800' :
                    job.status === 'interview' ? 'bg-blue-100 text-blue-800' :
                    job.status === 'offer' ? 'bg-purple-100 text-purple-800' :
                    job.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {job.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobsPage;
