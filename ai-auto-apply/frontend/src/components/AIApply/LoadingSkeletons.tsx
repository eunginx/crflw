import React from 'react';

// Skeleton pulse animation
const skeletonClasses = "animate-pulse bg-gray-200 rounded";

export const CardSkeleton: React.FC<{ height?: string }> = ({ height = "h-32" }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div className={`${skeletonClasses} h-6 w-1/3 mb-4`} />
    <div className={`${skeletonClasses} h-4 w-full mb-2`} />
    <div className={`${skeletonClasses} h-4 w-3/4 mb-2`} />
    <div className={`${skeletonClasses} h-4 w-1/2`} />
  </div>
);

export const ResumeListSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div className={`${skeletonClasses} h-6 w-1/4 mb-4`} />
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className={`${skeletonClasses} h-5 w-1/3 mb-2`} />
              <div className={`${skeletonClasses} h-4 w-1/2`} />
            </div>
            <div className="flex gap-2">
              <div className={`${skeletonClasses} h-8 w-16 rounded`} />
              <div className={`${skeletonClasses} h-8 w-16 rounded`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const ProcessingSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div className={`${skeletonClasses} h-6 w-1/3 mb-4`} />
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className={`${skeletonClasses} w-8 h-8 rounded-full`} />
        <div className="flex-1">
          <div className={`${skeletonClasses} h-4 w-full mb-2`} />
          <div className={`${skeletonClasses} h-4 w-3/4`} />
        </div>
      </div>
      <div className={`${skeletonClasses} h-2 w-full rounded-full`} />
      <div className={`${skeletonClasses} h-2 w-3/4 rounded-full`} />
    </div>
  </div>
);

export const AnalysisSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div className={`${skeletonClasses} h-6 w-1/3 mb-4`} />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="border border-gray-200 rounded-lg p-4">
          <div className={`${skeletonClasses} h-4 w-1/2 mb-2`} />
          <div className={`${skeletonClasses} h-3 w-full mb-1`} />
          <div className={`${skeletonClasses} h-3 w-3/4`} />
        </div>
      ))}
    </div>
  </div>
);

export const PreviewSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div className={`${skeletonClasses} h-6 w-1/4 mb-4`} />
    <div className={`${skeletonClasses} h-64 w-full rounded-lg`} />
  </div>
);

export const TextCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div className={`${skeletonClasses} h-6 w-1/3 mb-4`} />
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className={`${skeletonClasses} h-4 w-full`} />
      ))}
      <div className={`${skeletonClasses} h-4 w-2/3`} />
    </div>
  </div>
);
