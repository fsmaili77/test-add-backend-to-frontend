// legalanalyzer/src/pages/search-results/components/SearchFilters.jsx - Updated with real data
import React, { useState, useMemo, useEffect } from 'react';
import Icon from 'components/AppIcon';

const SearchFilters = ({ 
  selectedFilters, 
  onFilterChange, 
  onClearAll, 
  savedSearches = [], 
  documents = [], 
  trends = null 
}) => {
  const [expandedSections, setExpandedSections] = useState({
    documentType: true,
    dateRange: true,
    status: true,
    parties: false,
    practiceAreas: true,
    language: false,
    savedSearches: savedSearches.length > 0
  });

  const [partySearch, setPartySearch] = useState('');
  const [tagSearch, setTagSearch] = useState('');

  // Generate document types from real data
  const documentTypes = useMemo(() => {
    const typeCounts = documents.reduce((acc, doc) => {
      const type = doc.type?.charAt(0).toUpperCase() + doc.type?.slice(1).replace('_', ' ') || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(typeCounts)
      .map(([type, count]) => ({ value: type, count }))
      .sort((a, b) => b.count - a.count);
  }, [documents]);

  // Generate status options from real data
  const statusOptions = useMemo(() => {
    const statusCounts = documents.reduce((acc, doc) => {
      const status = doc.status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusCounts)
      .map(([status, count]) => ({ value: status, count }))
      .sort((a, b) => b.count - a.count);
  }, [documents]);

  // Generate practice areas based on document types
  const practiceAreas = useMemo(() => {
    const practiceMapping = {
      'contract': 'Contract Law',
      'employment': 'Employment Law', 
      'corporate': 'Corporate Law',
      'real_estate': 'Real Estate Law',
      'intellectual_property': 'IP Law',
      'litigation': 'Litigation',
      'regulatory': 'Regulatory Law',
      'merger': 'M&A Law',
      'license': 'Licensing Law',
      'judgment': 'Court Decisions',
      'brief': 'Legal Briefs',
      'pleading': 'Court Pleadings',
      'agreement': 'Legal Agreements'
    };

    const areaCounts = documents.reduce((acc, doc) => {
      const area = practiceMapping[doc.type] || 'General Legal';
      acc[area] = (acc[area] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(areaCounts)
      .map(([area, count]) => ({ value: area, count }))
      .sort((a, b) => b.count - a.count);
  }, [documents]);

  // Generate parties from real data
  const commonParties = useMemo(() => {
    const partyCounts = {};
    
    documents.forEach(doc => {
      if (doc.parties) {
        const parties = doc.parties.split(',').map(p => p.trim()).filter(p => p.length > 0);
        parties.forEach(party => {
          partyCounts[party] = (partyCounts[party] || 0) + 1;
        });
      }
    });

    const filteredParties = Object.entries(partyCounts)
      .filter(([party]) => 
        party.toLowerCase().includes(partySearch.toLowerCase())
      )
      .map(([party, count]) => ({ value: party, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Limit to top 20

    return filteredParties;
  }, [documents, partySearch]);

  // Generate language options from real data
  const languageOptions = useMemo(() => {
    const langCounts = documents.reduce((acc, doc) => {
      const lang = doc.document_language?.toUpperCase() || 'Unknown';
      acc[lang] = (acc[lang] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(langCounts)
      .map(([lang, count]) => ({ value: lang, count }))
      .sort((a, b) => b.count - a.count);
  }, [documents]);

  // Generate tags from real data
  const popularTags = useMemo(() => {
    const tagCounts = {};
    
    documents.forEach(doc => {
      // Generate tags based on document properties
      const tags = [];
      
      if (doc.type) tags.push(doc.type.replace('_', '-'));
      if (doc.document_language) tags.push(doc.document_language);
      if (doc.court) tags.push('court-document');
      if (doc.parties && doc.parties.includes(',')) tags.push('multi-party');
      if (doc.status === 'Analyzed') tags.push('ai-analyzed');
      if (doc.analysis_duration_ms && doc.analysis_duration_ms < 10000) tags.push('fast-analysis');
      if (doc.size && doc.size > 5 * 1024 * 1024) tags.push('large-file');
      
      tags.forEach(tag => {
        if (tag.toLowerCase().includes(tagSearch.toLowerCase())) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      });
    });

    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ value: tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [documents, tagSearch]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getActiveFiltersCount = () => {
    return Object.values(selectedFilters).reduce((count, filter) => 
      count + (Array.isArray(filter) ? filter.length : filter ? 1 : 0), 0
    );
  };

  const handleSavedSearchAction = (search, action) => {
    if (action === 'run') {
      // Apply the saved search filters
      Object.entries(search.filters || {}).forEach(([key, value]) => {
        onFilterChange(key, value);
      });
      // Navigate with the saved query
      window.location.href = `/search-results?q=${encodeURIComponent(search.query)}`;
    } else if (action === 'delete') {
      const saved = JSON.parse(localStorage.getItem('savedSearches') || '[]');
      const updated = saved.filter(s => s.id !== search.id);
      localStorage.setItem('savedSearches', JSON.stringify(updated));
      window.location.reload(); // Refresh to update the list
    }
  };

  const FilterSection = ({ title, section, children, count }) => (
    <div className="border-b border-border-light last:border-b-0">
      <button
        onClick={() => toggleSection(section)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors duration-200"
      >
        <div className="flex items-center space-x-2">
          <span className="font-medium text-text-primary">{title}</span>
          {count !== undefined && (
            <span className="text-xs text-text-secondary bg-gray-100 px-2 py-1 rounded-full">
              {count}
            </span>
          )}
        </div>
        <Icon 
          name={expandedSections[section] ? "ChevronUp" : "ChevronDown"} 
          size={16} 
          className="text-text-secondary"
        />
      </button>
      {expandedSections[section] && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  );

  const CheckboxFilter = ({ items, filterKey, selectedValues }) => (
    <div className="space-y-2 max-h-48 overflow-y-auto">
      {items.length > 0 ? (
        items.map((item) => (
          <label key={item.value} className="flex items-center space-x-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={selectedValues.includes(item.value)}
              onChange={() => onFilterChange(filterKey, item.value)}
              className="w-4 h-4 text-primary border-border-medium rounded focus:ring-accent focus:ring-2"
            />
            <span className="flex-1 text-sm text-text-primary group-hover:text-primary transition-colors duration-200">
              {item.value}
            </span>
            <span className="text-xs text-text-secondary bg-gray-100 px-2 py-1 rounded-full">
              {item.count}
            </span>
          </label>
        ))
      ) : (
        <p className="text-sm text-text-secondary text-center py-2">No options available</p>
      )}
    </div>
  );

  return (
    <div className="bg-surface rounded-lg border border-border-light">
      {/* Filter Header */}
      <div className="p-4 border-b border-border-light">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-text-primary flex items-center space-x-2">
            <Icon name="Filter" size={18} />
            <span>Filters</span>
            {getActiveFiltersCount() > 0 && (
              <span className="bg-accent text-white text-xs px-2 py-1 rounded-full">
                {getActiveFiltersCount()}
              </span>
            )}
          </h3>
          {getActiveFiltersCount() > 0 && (
            <button
              onClick={onClearAll}
              className="text-sm text-primary hover:text-blue-700 font-medium transition-colors duration-200"
            >
              Clear All
            </button>
          )}
        </div>
        {documents.length > 0 && (
          <p className="text-xs text-text-secondary mt-2">
            Filtering {documents.length} documents from your database
          </p>
        )}
      </div>

      {/* Document Type Filter */}
      <FilterSection title="Document Type" section="documentType" count={documentTypes.length}>
        <CheckboxFilter
          items={documentTypes}
          filterKey="documentType"
          selectedValues={selectedFilters.documentType}
        />
      </FilterSection>

      {/* Status Filter */}
      <FilterSection title="Analysis Status" section="status" count={statusOptions.length}>
        <CheckboxFilter
          items={statusOptions}
          filterKey="status"
          selectedValues={selectedFilters.status}
        />
      </FilterSection>

      {/* Date Range Filter */}
      <FilterSection title="Upload Date Range" section="dateRange">
        <div className="space-y-3">
          <div className="space-y-2">
            {[
              { label: 'Last 7 days', value: 'week' },
              { label: 'Last 30 days', value: 'month' },
              { label: 'Last 3 months', value: 'quarter' },
              { label: 'Last year', value: 'year' }
            ].map((range) => (
              <label key={range.value} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="dateRange"
                  value={range.value}
                  checked={selectedFilters.dateRange === range.value}
                  onChange={(e) => onFilterChange('dateRange', e.target.value)}
                  className="w-4 h-4 text-primary border-border-medium focus:ring-accent focus:ring-2"
                />
                <span className="text-sm text-text-primary">{range.label}</span>
              </label>
            ))}
          </div>
          {selectedFilters.dateRange && (
            <button
              onClick={() => onFilterChange('dateRange', '')}
              className="text-xs text-primary hover:text-blue-700"
            >
              Clear date filter
            </button>
          )}
        </div>
      </FilterSection>

      {/* Practice Areas Filter */}
      <FilterSection title="Practice Areas" section="practiceAreas" count={practiceAreas.length}>
        <CheckboxFilter
          items={practiceAreas}
          filterKey="practiceAreas"
          selectedValues={selectedFilters.practiceAreas}
        />
      </FilterSection>

      {/* Language Filter */}
      <FilterSection title="Document Language" section="language" count={languageOptions.length}>
        <CheckboxFilter
          items={languageOptions}
          filterKey="language"
          selectedValues={selectedFilters.language || []}
        />
      </FilterSection>

      {/* Parties Filter */}
      <FilterSection title="Parties Involved" section="parties" count={commonParties.length}>
        <div className="space-y-3">
          <div className="relative">
            <Icon 
              name="Search" 
              size={14} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" 
            />
            <input
              type="text"
              placeholder="Search parties..."
              value={partySearch}
              onChange={(e) => setPartySearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-border-light rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <CheckboxFilter
            items={commonParties}
            filterKey="parties"
            selectedValues={selectedFilters.parties}
          />
          {commonParties.length === 0 && partySearch && (
            <p className="text-xs text-text-secondary">No parties found matching "{partySearch}"</p>
          )}
        </div>
      </FilterSection>

      {/* Tags Filter */}
      <FilterSection title="Tags" section="tags" count={popularTags.length}>
        <div className="space-y-3">
          <div className="relative">
            <Icon 
              name="Search" 
              size={14} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" 
            />
            <input
              type="text"
              placeholder="Search tags..."
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-border-light rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          {popularTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {popularTags.map((tag) => (
                <button
                  key={tag.value}
                  onClick={() => onFilterChange('tags', tag.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${
                    selectedFilters.tags?.includes(tag.value)
                      ? 'bg-primary text-white' : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                  }`}
                >
                  {tag.value} ({tag.count})
                </button>
              ))}
            </div>
          )}
          {popularTags.length === 0 && tagSearch && (
            <p className="text-xs text-text-secondary">No tags found matching "{tagSearch}"</p>
          )}
        </div>
      </FilterSection>

      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <FilterSection title="Saved Searches" section="savedSearches" count={savedSearches.length}>
          <div className="space-y-2">
            {savedSearches.map((search) => (
              <div key={search.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-text-primary truncate">{search.name}</h4>
                  <p className="text-xs text-text-secondary truncate">"{search.query}"</p>
                  <p className="text-xs text-text-secondary">
                    {new Date(search.createdDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2 ml-2">
                  <button 
                    onClick={() => handleSavedSearchAction(search, 'run')}
                    className="p-1 text-primary hover:text-blue-700 transition-colors duration-200"
                    title="Run this search"
                  >
                    <Icon name="Play" size={14} />
                  </button>
                  <button 
                    onClick={() => handleSavedSearchAction(search, 'delete')}
                    className="p-1 text-text-secondary hover:text-error transition-colors duration-200"
                    title="Delete saved search"
                  >
                    <Icon name="Trash2" size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Statistics Footer */}
      {documents.length > 0 && (
        <div className="p-4 bg-gray-50 border-t border-border-light">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-sm font-medium text-success">
                {documents.filter(d => d.status === 'Analyzed').length}
              </div>
              <div className="text-xs text-text-secondary">Analyzed</div>
            </div>
            <div>
              <div className="text-sm font-medium text-primary">
                {documentTypes.length}
              </div>
              <div className="text-xs text-text-secondary">Doc Types</div>
            </div>
          </div>
          {trends && trends.top_entities && (
            <div className="mt-3 pt-3 border-t border-border-light">
              <h4 className="text-xs font-medium text-text-secondary mb-2">Top Entities</h4>
              <div className="flex flex-wrap gap-1">
                {trends.top_entities.slice(0, 5).map(([entity, count]) => (
                  <span key={entity} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {entity} ({count})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchFilters;