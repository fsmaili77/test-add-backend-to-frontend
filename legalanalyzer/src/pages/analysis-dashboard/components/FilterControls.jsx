import React from 'react';
import Icon from 'components/AppIcon';

const FilterControls = ({ 
  dateRange, 
  setDateRange, 
  documentType, 
  setDocumentType, 
  practiceArea, 
  setPracticeArea 
}) => {
  const dateRangeOptions = [
    { value: '7days', label: 'Last 7 Days' },
    { value: '30days', label: 'Last 30 Days' },
    { value: '90days', label: 'Last 90 Days' },
    { value: '1year', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const documentTypeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'contracts', label: 'Contracts' },
    { value: 'briefs', label: 'Legal Briefs' },
    { value: 'cases', label: 'Case Files' },
    { value: 'regulatory', label: 'Regulatory' }
  ];

  const practiceAreaOptions = [
    { value: 'all', label: 'All Practice Areas' },
    { value: 'corporate', label: 'Corporate Law' },
    { value: 'litigation', label: 'Litigation' },
    { value: 'real-estate', label: 'Real Estate' },
    { value: 'employment', label: 'Employment Law' },
    { value: 'intellectual', label: 'Intellectual Property' }
  ];

  return (
    <div className="bg-surface rounded-lg border border-border-light p-6 mb-8">
      <div className="flex items-center space-x-2 mb-4">
        <Icon name="Filter" size={20} className="text-text-secondary" />
        <h3 className="text-lg font-semibold text-text-primary">Filter Controls</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Date Range Filter */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Date Range
          </label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full px-3 py-2 border border-border-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-background text-text-primary"
          >
            {dateRangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Document Type Filter */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Document Type
          </label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="w-full px-3 py-2 border border-border-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-background text-text-primary"
          >
            {documentTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Practice Area Filter */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Practice Area
          </label>
          <select
            value={practiceArea}
            onChange={(e) => setPracticeArea(e.target.value)}
            className="w-full px-3 py-2 border border-border-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-background text-text-primary"
          >
            {practiceAreaOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Filter Buttons */}
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border-light">
        <span className="text-sm text-text-secondary mr-2">Quick Filters:</span>
        <button className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors duration-200">
          High Priority
        </button>
        <button className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors duration-200">
          Completed Today
        </button>
        <button className="px-3 py-1 text-xs bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200 transition-colors duration-200">
          Needs Review
        </button>
        <button className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors duration-200">
          Processing Errors
        </button>
      </div>
    </div>
  );
};

export default FilterControls;