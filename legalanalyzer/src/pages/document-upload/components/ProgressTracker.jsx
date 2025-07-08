import React from 'react';
import Icon from 'components/AppIcon';

const ProgressTracker = ({ totalProgress, filesCount, completedCount }) => {
  return (
    <div className="bg-surface rounded-lg border border-border-light p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-text-primary flex items-center space-x-2">
          <Icon name="Upload" size={18} />
          <span>Upload Progress</span>
        </h3>
        <span className="text-sm text-text-secondary">
          {completedCount} of {filesCount} completed
        </span>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-text-primary">Overall Progress</span>
          <span className="text-sm font-medium text-primary">{totalProgress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-primary h-3 rounded-full transition-all duration-500 relative overflow-hidden"
            style={{ width: `${totalProgress}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Status Information */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="text-lg font-semibold text-primary">{filesCount}</div>
          <div className="text-xs text-text-secondary">Total Files</div>
        </div>
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="text-lg font-semibold text-success">{completedCount}</div>
          <div className="text-xs text-text-secondary">Completed</div>
        </div>
        <div className="p-3 bg-amber-50 rounded-lg">
          <div className="text-lg font-semibold text-warning">{filesCount - completedCount}</div>
          <div className="text-xs text-text-secondary">Remaining</div>
        </div>
      </div>

      {/* Processing Status */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <span>Processing documents and extracting content...</span>
        </div>
      </div>
    </div>
  );
};

export default ProgressTracker;