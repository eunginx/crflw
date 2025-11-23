import React, { useMemo } from 'react';

interface Job {
  id: string;
  title: string;
  company: string;
  description?: string;
  status: string;
  analysis?: {
    score: number;
  };
}

interface JobCluster {
  name: string;
  jobs: Job[];
  color: string;
  icon: string;
}

interface JobClusteringProps {
  jobs: Job[];
  className?: string;
}

const JobClustering: React.FC<JobClusteringProps> = ({ jobs, className = '' }) => {
  // AI-powered job clustering based on titles and keywords
  const clusters = useMemo(() => {
    const clusterDefinitions = [
      {
        name: 'Engineering',
        keywords: ['engineer', 'developer', 'software', 'programming', 'code', 'technical'],
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: '⚙️'
      },
      {
        name: 'Frontend',
        keywords: ['frontend', 'react', 'vue', 'angular', 'ui', 'ux', 'javascript', 'typescript', 'css'],
        color: 'bg-purple-50 text-purple-700 border-purple-200',
        icon: '🎨'
      },
      {
        name: 'Backend',
        keywords: ['backend', 'server', 'api', 'database', 'node', 'python', 'java', 'go'],
        color: 'bg-green-50 text-green-700 border-green-200',
        icon: '🔧'
      },
      {
        name: 'DevOps',
        keywords: ['devops', 'aws', 'cloud', 'docker', 'kubernetes', 'infrastructure', 'ci/cd'],
        color: 'bg-orange-50 text-orange-700 border-orange-200',
        icon: '☁️'
      },
      {
        name: 'Data Science',
        keywords: ['data', 'science', 'analytics', 'machine learning', 'ml', 'ai', 'python', 'statistics'],
        color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        icon: '📊'
      },
      {
        name: 'Mobile',
        keywords: ['mobile', 'ios', 'android', 'react native', 'flutter', 'swift', 'kotlin'],
        color: 'bg-pink-50 text-pink-700 border-pink-200',
        icon: '📱'
      },
      {
        name: 'Leadership',
        keywords: ['manager', 'lead', 'director', 'vp', 'head', 'chief', 'leadership', 'team'],
        color: 'bg-red-50 text-red-700 border-red-200',
        icon: '👔'
      },
      {
        name: 'Other',
        keywords: [],
        color: 'bg-gray-50 text-gray-700 border-gray-200',
        icon: '📋'
      }
    ];

    // Initialize clusters
    const initializedClusters: JobCluster[] = clusterDefinitions.map(def => ({
      ...def,
      jobs: []
    }));

    // Assign jobs to clusters
    jobs.forEach(job => {
      const jobText = `${job.title} ${job.description || ''}`.toLowerCase();
      
      // Find best matching cluster
      let bestClusterIndex = initializedClusters.length - 1; // Default to 'Other'
      let bestScore = 0;
      
      clusterDefinitions.forEach((cluster, index) => {
        if (cluster.keywords.length === 0) return; // Skip 'Other' cluster for scoring
        
        const score = cluster.keywords.reduce((acc, keyword) => {
          return acc + (jobText.includes(keyword.toLowerCase()) ? 1 : 0);
        }, 0);
        
        if (score > bestScore) {
          bestScore = score;
          bestClusterIndex = index;
        }
      });
      
      initializedClusters[bestClusterIndex].jobs.push(job);
    });

    // Sort clusters by job count (descending) and filter out empty ones
    return initializedClusters
      .filter(cluster => cluster.jobs.length > 0)
      .sort((a, b) => b.jobs.length - a.jobs.length);
  }, [jobs]);

  const getAverageScore = (jobs: Job[]): number => {
    const jobsWithScores = jobs.filter(job => job.analysis?.score);
    if (jobsWithScores.length === 0) return 0;
    
    const totalScore = jobsWithScores.reduce((sum, job) => sum + (job.analysis?.score || 0), 0);
    return Math.round(totalScore / jobsWithScores.length);
  };

  const getStatusDistribution = (jobs: Job[]): { [key: string]: number } => {
    return jobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
  };

  if (jobs.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">🎯 AI Job Clustering</h3>
        <p className="text-sm text-gray-600">Jobs automatically grouped by category and role type</p>
      </div>

      <div className="space-y-4">
        {clusters.map((cluster, index) => {
          const avgScore = getAverageScore(cluster.jobs);
          const statusDist = getStatusDistribution(cluster.jobs);
          
          return (
            <div key={cluster.name} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{cluster.icon}</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">{cluster.name}</h4>
                    <p className="text-sm text-gray-500">{cluster.jobs.length} jobs</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {avgScore > 0 && (
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">Avg Match</div>
                      <div className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full border ${
                        avgScore >= 80 ? 'bg-green-100 text-green-800 border-green-200' :
                        avgScore >= 60 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                        'bg-red-100 text-red-800 border-red-200'
                      }`}>
                        {avgScore}%
                      </div>
                    </div>
                  )}
                  
                  <span className={`px-3 py-1 text-sm font-medium rounded-full border ${cluster.color}`}>
                    {cluster.jobs.length}
                  </span>
                </div>
              </div>
              
              {/* Status distribution */}
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                {Object.entries(statusDist).map(([status, count]) => (
                  <span key={status} className="flex items-center">
                    {status === 'applied' && '🟢'}
                    {status === 'interview' && '🔵'}
                    {status === 'offer' && '🟣'}
                    {status === 'rejected' && '🔴'}
                    {status === 'saved' && '🟡'}
                    <span className="ml-1">{count}</span>
                  </span>
                ))}
              </div>
              
              {/* Top jobs in cluster */}
              {cluster.jobs.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500 mb-2">Top positions:</div>
                  <div className="flex flex-wrap gap-2">
                    {cluster.jobs.slice(0, 3).map(job => (
                      <span key={job.id} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {job.title.length > 25 ? job.title.substring(0, 25) + '...' : job.title}
                      </span>
                    ))}
                    {cluster.jobs.length > 3 && (
                      <span className="text-xs text-gray-500 px-2 py-1">
                        +{cluster.jobs.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="text-xs text-gray-500 text-center">
          🤖 AI-powered clustering based on job titles, descriptions, and keywords
        </div>
      </div>
    </div>
  );
};

export default JobClustering;
