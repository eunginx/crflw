const JobCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-3">
            {/* Company Logo Skeleton */}
            <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse mr-4"></div>
            <div className="flex-1">
              {/* Title Skeleton */}
              <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4 mb-2"></div>
              {/* Company Skeleton */}
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
            </div>
          </div>
          
          {/* Job Details Skeleton */}
          <div className="space-y-2 mb-4">
            {/* Location Skeleton */}
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
            {/* Description Skeleton */}
            <div className="space-y-1">
              <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-5/6"></div>
            </div>
            {/* Date Skeleton */}
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
          </div>

          {/* Action Links Skeleton */}
          <div className="flex items-center justify-between">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
          </div>
        </div>
        
        {/* Status Badge Skeleton */}
        <div className="ml-4">
          <div className="w-16 h-6 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default JobCardSkeleton;
