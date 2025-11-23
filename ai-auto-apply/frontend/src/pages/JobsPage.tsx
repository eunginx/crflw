import { useState } from 'react';
import { useJobs } from '../context/JobContext';

const JobsPage = () => {
  const { jobs, loading, error } = useJobs();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('');

  const filteredJobs = jobs.filter(job => {
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    const matchesCompany = !companyFilter || job.company.toLowerCase().includes(companyFilter.toLowerCase());
    return matchesStatus && matchesCompany;
  });

  const uniqueCompanies = Array.from(new Set(jobs.map(job => job.company)));

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
      {/* Filter Section - Outside the border container */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Filter Jobs</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="saved">Saved</option>
              <option value="applied">Applied</option>
              <option value="interview">Interview</option>
              <option value="offer">Offer</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company
            </label>
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Companies</option>
              {uniqueCompanies.map(company => (
                <option key={company} value={company}>{company}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Jobs List Container - Inside the border container */}
      <div className="border-4 border-dashed border-gray-200 rounded-lg">
        <div className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Jobs Page</h2>
            <p className="text-gray-600">Browse and apply to jobs</p>
            <p className="text-sm text-gray-500 mt-2">
              Showing {filteredJobs.length} of {jobs.length} jobs
            </p>
          </div>
          
          <div className="space-y-3">
            {filteredJobs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {jobs.length === 0 ? 'No jobs found' : 'No jobs match your filters'}
                </p>
              </div>
            ) : (
              filteredJobs.map((job) => (
                <div key={job.id} className="bg-white p-4 rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900">{job.title}</h3>
                      <p className="text-gray-600 mb-2">{job.company}</p>
                      {job.location && (
                        <p className="text-sm text-gray-500 mb-2">📍 {job.location}</p>
                      )}
                      {job.appliedDate && (
                        <p className="text-sm text-gray-500">
                          Applied: {job.appliedDate.toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                      job.status === 'applied' ? 'bg-green-100 text-green-800' :
                      job.status === 'interview' ? 'bg-blue-100 text-blue-800' :
                      job.status === 'offer' ? 'bg-purple-100 text-purple-800' :
                      job.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      job.status === 'saved' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                  </div>
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
