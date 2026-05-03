// legalanalyzer/src/pages/analysis-dashboard/components/FilterControls.jsx
import React, { useMemo } from 'react';
import Icon from 'components/AppIcon';
import { useLanguage } from 'contexts/LanguageContext';

const FilterControls = ({
  dateRange, setDateRange,
  documentType, setDocumentType,
  practiceArea, setPracticeArea,
  analyticsData, documents, onQuickFilter
}) => {
  const { texts } = useLanguage();

  const dateRangeOptions = [
    { value: '7days',   label: texts.last7Days },
    { value: '30days',  label: texts.last30Days },
    { value: '90days',  label: texts.last90Days },
    { value: '6months', label: texts.last6Months },
    { value: '1year',   label: texts.lastYear },
    { value: 'all',     label: texts.allTime },
    { value: 'custom',  label: texts.customRange },
  ];

  const documentTypeOptions = useMemo(() => {
    const options = [{ value: 'all', label: texts.allTypes }];
    if (analyticsData?.document_types?.length > 0) {
      analyticsData.document_types.forEach(type => {
        if (type.type && type.count > 0) {
          const displayName = type.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          options.push({ value: type.type.toLowerCase(), label: `${displayName} (${type.count})`, count: type.count });
        }
      });
    }
    if (options.length === 1) {
      options.push(
        { value: 'pdf', label: 'PDF' },
        { value: 'docx', label: 'Word' },
        { value: 'txt', label: 'Text' },
        { value: 'image', label: 'Image' }
      );
    }
    return options;
  }, [analyticsData, texts]);

  const practiceAreaOptions = useMemo(() => {
    const options = [{ value: 'all', label: texts.allPracticeAreas }];
    if (documents?.length > 0) {
      const practiceAreas = new Map();
      documents.forEach(doc => {
        const area = doc.practice_area || doc.practiceArea || doc.category || doc.department || doc.area || doc.tag;
        if (area && typeof area === 'string') {
          const normalizedArea = area.toLowerCase().trim();
          if (normalizedArea && normalizedArea !== 'unknown' && normalizedArea !== 'null') {
            practiceAreas.set(normalizedArea, (practiceAreas.get(normalizedArea) || 0) + 1);
          }
        }
      });
      practiceAreas.forEach((count, area) => {
        const displayName = area.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        options.push({ value: area, label: `${displayName} (${count})`, count });
      });
    }
    return options;
  }, [documents, texts]);

  const quickFilterStats = useMemo(() => {
    if (!documents?.length) return { highPriority: 0, completedToday: 0, needsReview: 0, processingErrors: 0 };
    const today = new Date().toISOString().split('T')[0];
    return {
      highPriority: documents.filter(doc => doc.priority === 'high' || doc.priority === 'urgent' || doc.isUrgent).length,
      completedToday: documents.filter(doc => {
        const completedDate = doc.completedAt || doc.analyzed_at || doc.uploadedAt;
        return completedDate && completedDate.startsWith(today) && (doc.status === 'Analyzed' || doc.status === 'completed');
      }).length,
      needsReview: documents.filter(doc =>
        doc.status === 'needs_review' || doc.status === 'pending_review' ||
        doc.needs_review || (doc.confidence_score != null && doc.confidence_score < 0.8)
      ).length,
      processingErrors: documents.filter(doc =>
        doc.status === 'Error' || doc.status === 'error' || doc.status === 'failed' || doc.hasError
      ).length
    };
  }, [documents]);

  const handleQuickFilter = (filterType) => {
    if (onQuickFilter) {
      onQuickFilter(filterType);
    } else {
      if (filterType === 'completed_today') setDateRange('7days');
    }
  };

  const hasActiveFilters = dateRange !== '30days' || documentType !== 'all' || practiceArea !== 'all';
  const clearAll = () => { setDateRange('30days'); setDocumentType('all'); setPracticeArea('all'); };

  return (
    <div className="bg-surface rounded-lg border border-border-light p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Icon name="Filter" size={20} className="text-text-secondary" />
          <h3 className="text-lg font-semibold text-text-primary">{texts.filterControls}</h3>
        </div>
        {hasActiveFilters && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-text-secondary">{texts.activeFilters}</span>
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
              <button onClick={clearAll} className="px-2 py-1 text-xs text-text-secondary hover:text-text-primary" title={texts.clearAllFilters}>
                <Icon name="X" size={12} />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">{texts.dateRange}</label>
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}
            className="w-full px-3 py-2 border border-border-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-background text-text-primary">
            {dateRangeOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">{texts.documentType}</label>
          <select value={documentType} onChange={(e) => setDocumentType(e.target.value)}
            className="w-full px-3 py-2 border border-border-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-background text-text-primary">
            {documentTypeOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">{texts.practiceArea}</label>
          <select value={practiceArea} onChange={(e) => setPracticeArea(e.target.value)}
            className="w-full px-3 py-2 border border-border-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-background text-text-primary">
            {practiceAreaOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
      </div>

      {/* Stats Bar */}
      {documents?.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">{texts.showingDocuments}: {documents.length}</span>
            {analyticsData?.document_counts && (
              <div className="flex items-center space-x-4 text-xs">
                <span className="text-green-600">✓ {analyticsData.document_counts.analyzed || 0} {texts.analyzed}</span>
                <span className="text-blue-600">📊 {analyticsData.document_counts.total || 0} {texts.totalDocuments}</span>
                {analyticsData.document_counts.errors > 0 && (
                  <span className="text-red-600">⚠ {analyticsData.document_counts.errors} {texts.processingErrors}</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Filter Buttons */}
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border-light">
        <span className="text-sm text-text-secondary mr-2">{texts.quickFilters}</span>
        {[
          { key: 'high_priority', label: texts.highPriority, count: quickFilterStats.highPriority, color: 'red' },
          { key: 'completed_today', label: texts.completedToday, count: quickFilterStats.completedToday, color: 'green' },
          { key: 'needs_review', label: texts.needsReview, count: quickFilterStats.needsReview, color: 'amber' },
          { key: 'processing_errors', label: texts.processingErrors, count: quickFilterStats.processingErrors, color: 'red' },
        ].map(({ key, label, count, color }) => (
          <button
            key={key}
            onClick={() => handleQuickFilter(key)}
            disabled={count === 0}
            className={`px-3 py-1 text-xs bg-${color}-100 text-${color}-700 rounded-full hover:bg-${color}-200 transition-colors duration-200 flex items-center space-x-1`}
          >
            <span>{label}</span>
            <span className={`bg-${color}-200 text-${color}-800 px-1 rounded`}>{count}</span>
          </button>
        ))}
        <button
          onClick={() => handleQuickFilter('low_confidence')}
          className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors duration-200"
        >
          {texts.lowAiConfidence}
        </button>
        {hasActiveFilters && (
          <button onClick={clearAll} className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors duration-200">
            {texts.clearAllFilters}
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterControls;