// legalanalyzer/src/pages/analysis-dashboard/components/FilterControls.jsx - Updated with real data
import React, { useMemo } from 'react';
import Icon from 'components/AppIcon';

const FilterControls = ({ 
  dateRange, 
  setDateRange, 
  documentType, 
  setDocumentType, 
  practiceArea, 
  setPracticeArea,
  // New props for real data
  analyticsData,
  documents,
  onQuickFilter
}) => {
  const dateRangeOptions = [
    { value: '7days', label: 'Last 7 Days' },
    { value: '30days', label: 'Last 30 Days' },
    { value: '90days', label: 'Last 90 Days' },
    { value: '6months', label: 'Last 6 Months' },
    { value: '1year', label: 'Last Year' },
    { value: 'all', label: 'All Time' },
    { value: 'custom', label: 'Custom Range' }
  ];

  // Generate document type options from real data
  const documentTypeOptions = useMemo(() => {
    const options = [{ value: 'all', label: 'All Types' }];
    
    if (analyticsData?.document_types?.length > 0) {
      analyticsData.document_types.forEach(type => {
        if (type.type && type.count > 0) {
          const displayName = type.type
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
          
          options.push({
            value: type.type.toLowerCase(),
            label: `${displayName} (${type.count})`,
            count: type.count
          });
        }
      });
    }
    
    // Fallback options if no real data
    if (options.length === 1) {
      options.push(
        { value: 'pdf', label: 'PDF Documents' },
        { value: 'docx', label: 'Word Documents' },
        { value: 'txt', label: 'Text Files' },
        { value: 'image', label: 'Image Files' }
      );
    }
    
    return options;
  }, [analyticsData]);

  // Generate practice area options (you might need to add practice_area to your backend data)
  const practiceAreaOptions = useMemo(() => {
    const options = [{ value: 'all', label: 'All Practice Areas' }];
    
    // Try to extract practice areas from document metadata or tags
    if (documents?.length > 0) {
      const practiceAreas = new Map();
      
      documents.forEach(doc => {
        // Check various possible property names for practice area
        const area = doc.practice_area || doc.practiceArea || doc.category || 
                    doc.department || doc.area || doc.tag;
        
        if (area && typeof area === 'string') {
          const normalizedArea = area.toLowerCase().trim();
          if (normalizedArea && normalizedArea !== 'unknown' && normalizedArea !== 'null') {
            practiceAreas.set(normalizedArea, (practiceAreas.get(normalizedArea) || 0) + 1);
          }
        }
      });
      
      // Convert to options with counts
      practiceAreas.forEach((count, area) => {
        const displayName = area
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
        
        options.push({
          value: area,
          label: `${displayName} (${count})`,
          count: count
        });
      });
    }
    
    // Fallback options if no real data found
    if (options.length === 1) {
      options.push(
        { value: 'general', label: 'General Legal' },
        { value: 'corporate', label: 'Corporate Law' },
        { value: 'litigation', label: 'Litigation' },
        { value: 'compliance', label: 'Compliance' },
        { value: 'intellectual', label: 'Intellectual Property' },
        { value: 'employment', label: 'Employment Law' }
      );
    }
    
    return options;
  }, [documents]);

  // Calculate quick filter counts from real data
  const quickFilterStats = useMemo(() => {
    if (!documents?.length) {
      return {
        highPriority: 0,
        completedToday: 0,
        needsReview: 0,
        processingErrors: 0
      };
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    return {
      highPriority: documents.filter(doc => 
        doc.priority === 'high' || doc.priority === 'urgent' || doc.isUrgent
      ).length,
      
      completedToday: documents.filter(doc => {
        const completedDate = doc.completedAt || doc.analyzed_at || doc.updatedAt;
        return completedDate && completedDate.startsWith(today) && 
               (doc.status === 'Analyzed' || doc.status === 'completed');
      }).length,
      
      needsReview: documents.filter(doc => 
        doc.status === 'needs_review' || doc.status === 'pending_review' || 
        doc.needsReview || doc.confidence_score < 0.8
      ).length,
      
      processingErrors: documents.filter(doc => 
        doc.status === 'error' || doc.status === 'failed' || doc.hasError
      ).length
    };
  }, [documents]);

  // Handle quick filter clicks
  const handleQuickFilter = (filterType) => {
    if (onQuickFilter) {
      onQuickFilter(filterType);
    } else {
      // Default behavior - could set filters based on type
      switch (filterType) {
        case 'completed_today':
          setDateRange('7days');
          break;
        case 'processing_errors':
          // Could trigger a status filter if you add one
          console.log('Show processing errors');
          break;
        case 'needs_review':
          console.log('Show documents needing review');
          break;
        case 'high_priority':
          console.log('Show high priority documents');
          break;
        default:
          break;
      }
    }
  };

  return (
    <div className="bg-surface rounded-lg border border-border-light p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Icon name="Filter" size={20} className="text-text-secondary" />
          <h3 className="text-lg font-semibold text-text-primary">Filter Controls</h3>
        </div>
        
        {/* Active filters indicator */}
        {(dateRange !== '30days' || documentType !== 'all' || practiceArea !== 'all') && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-text-secondary">Active filters:</span>
            <div className="flex space-x-1">
              {dateRange !== '30days' && (
                <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded">
                  {dateRangeOptions.find(opt => opt.value === dateRange)?.label}
                </span>
              )}
              {documentType !== 'all' && (
                <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded">
                  {documentTypeOptions.find(opt => opt.value === documentType)?.label}
                </span>
              )}
              {practiceArea !== 'all' && (
                <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded">
                  {practiceAreaOptions.find(opt => opt.value === practiceArea)?.label}
                </span>
              )}
              <button
                onClick={() => {
                  setDateRange('30days');
                  setDocumentType('all');
                  setPracticeArea('all');
                }}
                className="px-2 py-1 text-xs text-text-secondary hover:text-text-primary"
                title="Clear all filters"
              >
                <Icon name="X" size={12} />
              </button>
            </div>
          </div>
        )}
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

      {/* Statistics Bar */}
      {documents?.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">
              Showing {documents.length} documents
            </span>
            <div className="flex items-center space-x-4 text-xs">
              {analyticsData?.document_counts && (
                <>
                  <span className="text-green-600">
                    ✓ {analyticsData.document_counts.analyzed || 0} analyzed
                  </span>
                  <span className="text-blue-600">
                    📊 {analyticsData.document_counts.total || 0} total
                  </span>
                  {analyticsData.document_counts.errors > 0 && (
                    <span className="text-red-600">
                      ⚠ {analyticsData.document_counts.errors} errors
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Filter Buttons */}
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border-light">
        <span className="text-sm text-text-secondary mr-2">Quick Filters:</span>
        
        <button
          onClick={() => handleQuickFilter('high_priority')}
          className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors duration-200 flex items-center space-x-1"
          disabled={quickFilterStats.highPriority === 0}
        >
          <span>High Priority</span>
          <span className="bg-red-200 text-red-800 px-1 rounded">
            {quickFilterStats.highPriority}
          </span>
        </button>
        
        <button
          onClick={() => handleQuickFilter('completed_today')}
          className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors duration-200 flex items-center space-x-1"
          disabled={quickFilterStats.completedToday === 0}
        >
          <span>Completed Today</span>
          <span className="bg-green-200 text-green-800 px-1 rounded">
            {quickFilterStats.completedToday}
          </span>
        </button>
        
        <button
          onClick={() => handleQuickFilter('needs_review')}
          className="px-3 py-1 text-xs bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200 transition-colors duration-200 flex items-center space-x-1"
          disabled={quickFilterStats.needsReview === 0}
        >
          <span>Needs Review</span>
          <span className="bg-amber-200 text-amber-800 px-1 rounded">
            {quickFilterStats.needsReview}
          </span>
        </button>
        
        <button
          onClick={() => handleQuickFilter('processing_errors')}
          className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors duration-200 flex items-center space-x-1"
          disabled={quickFilterStats.processingErrors === 0}
        >
          <span>Processing Errors</span>
          <span className="bg-red-200 text-red-800 px-1 rounded">
            {quickFilterStats.processingErrors}
          </span>
        </button>

        {/* AI Performance Quick Filter */}
        <button
          onClick={() => handleQuickFilter('low_confidence')}
          className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors duration-200"
        >
          Low AI Confidence
        </button>
        
        {/* Clear all filters button */}
        {(dateRange !== '30days' || documentType !== 'all' || practiceArea !== 'all') && (
          <button
            onClick={() => {
              setDateRange('30days');
              setDocumentType('all');
              setPracticeArea('all');
            }}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors duration-200"
          >
            Clear All Filters
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterControls;