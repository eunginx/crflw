interface EmptyStateProps {
  type: 'no-jobs' | 'no-filters' | 'no-search';
  onClearFilters?: () => void;
  onClearSearch?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  type, 
  onClearFilters, 
  onClearSearch 
}) => {
  const getEmptyStateContent = () => {
    switch (type) {
      case 'no-jobs':
        return {
          icon: '📋',
          title: 'No jobs found',
          description: 'Start by adding some job applications to track your progress.',
          action: null
        };
      case 'no-filters':
        return {
          icon: '🥲',
          title: 'No jobs match your filters',
          description: 'Try adjusting your filter criteria or explore all available jobs.',
          action: onClearFilters ? (
            <button
              onClick={onClearFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              Clear Filters
            </button>
          ) : null
        };
      case 'no-search':
        return {
          icon: '🔍',
          title: 'No jobs match your search',
          description: 'Try different keywords or browse all available jobs.',
          action: onClearSearch ? (
            <button
              onClick={onClearSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              Clear Search
            </button>
          ) : null
        };
      default:
        return {
          icon: '📄',
          title: 'Nothing here',
          description: 'Check back later or adjust your criteria.',
          action: null
        };
    }
  };

  const content = getEmptyStateContent();

  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4 animate-bounce">{content.icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {content.title}
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {content.description}
      </p>
      {content.action && (
        <div className="flex justify-center">
          {content.action}
        </div>
      )}
      
      {/* Additional helpful tips */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg max-w-md mx-auto">
        <h4 className="font-medium text-gray-900 mb-2">💡 Tips</h4>
        <ul className="text-sm text-gray-600 text-left space-y-1">
          {type === 'no-filters' && (
            <>
              <li>• Try selecting multiple status filters</li>
              <li>• Check different companies</li>
              <li>• Browse all jobs to see available options</li>
            </>
          )}
          {type === 'no-search' && (
            <>
              <li>• Use broader search terms</li>
              <li>• Search by company name or location</li>
              <li>• Try keywords like "React" or "Senior"</li>
            </>
          )}
          {type === 'no-jobs' && (
            <>
              <li>• Import jobs from your email</li>
              <li>• Add jobs manually</li>
              <li>• Connect your email account</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
};

export default EmptyState;
