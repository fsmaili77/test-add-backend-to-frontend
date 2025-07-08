import React, { useState } from 'react';
import Icon from 'components/AppIcon';

const SearchFilters = ({ selectedFilters, onFilterChange, onClearAll, savedSearches }) => {
  const [expandedSections, setExpandedSections] = useState({
    documentType: true,
    dateRange: true,
    parties: false,
    practiceAreas: true,
    tags: false,
    savedSearches: false
  });

  const documentTypes = [
    { value: 'Contract', count: 45 },
    { value: 'Agreement', count: 32 },
    { value: 'M&A Agreement', count: 18 },
    { value: 'License Agreement', count: 24 },
    { value: 'NDA', count: 67 },
    { value: 'Legal Brief', count: 29 },
    { value: 'Court Filing', count: 15 },
    { value: 'Regulatory Document', count: 12 }
  ];

  const practiceAreas = [
    { value: 'Corporate Law', count: 89 },
    { value: 'Employment Law', count: 56 },
    { value: 'Real Estate', count: 43 },
    { value: 'Intellectual Property', count: 38 },
    { value: 'Litigation', count: 72 },
    { value: 'Tax Law', count: 25 },
    { value: 'Securities', count: 31 },
    { value: 'Healthcare', count: 19 }
  ];

  const commonParties = [
    { value: 'ABC Corporation', count: 23 },
    { value: 'TechCorp Inc.', count: 18 },
    { value: 'Global Enterprises', count: 15 },
    { value: 'Innovation Labs', count: 12 },
    { value: 'Manufacturing Corp', count: 9 }
  ];

  const popularTags = [
    { value: 'confidentiality', count: 45 },
    { value: 'employment', count: 38 },
    { value: 'merger', count: 29 },
    { value: 'license', count: 34 },
    { value: 'intellectual-property', count: 27 },
    { value: 'commercial', count: 41 },
    { value: 'acquisition', count: 22 },
    { value: 'patent', count: 19 }
  ];

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

  const FilterSection = ({ title, section, children }) => (
    <div className="border-b border-border-light last:border-b-0">
      <button
        onClick={() => toggleSection(section)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors duration-200"
      >
        <span className="font-medium text-text-primary">{title}</span>
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
      {items.map((item) => (
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
      ))}
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
      </div>

      {/* Document Type Filter */}
      <FilterSection title="Document Type" section="documentType">
        <CheckboxFilter
          items={documentTypes}
          filterKey="documentType"
          selectedValues={selectedFilters.documentType}
        />
      </FilterSection>

      {/* Date Range Filter */}
      <FilterSection title="Date Range" section="dateRange">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-text-secondary mb-1">From</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-border-light rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                onChange={(e) => onFilterChange('dateRange', `${e.target.value}-${selectedFilters.dateRange.split('-')[1] || ''}`)}
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">To</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-border-light rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                onChange={(e) => onFilterChange('dateRange', `${selectedFilters.dateRange.split('-')[0] || ''}-${e.target.value}`)}
              />
            </div>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Last 7 days', value: 'last-7-days' },
              { label: 'Last 30 days', value: 'last-30-days' },
              { label: 'Last 3 months', value: 'last-3-months' },
              { label: 'Last year', value: 'last-year' }
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
        </div>
      </FilterSection>

      {/* Practice Areas Filter */}
      <FilterSection title="Practice Areas" section="practiceAreas">
        <CheckboxFilter
          items={practiceAreas}
          filterKey="practiceAreas"
          selectedValues={selectedFilters.practiceAreas}
        />
      </FilterSection>

      {/* Parties Filter */}
      <FilterSection title="Parties Involved" section="parties">
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
              className="w-full pl-9 pr-3 py-2 border border-border-light rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <CheckboxFilter
            items={commonParties}
            filterKey="parties"
            selectedValues={selectedFilters.parties}
          />
        </div>
      </FilterSection>

      {/* Tags Filter */}
      <FilterSection title="Tags" section="tags">
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
              className="w-full pl-9 pr-3 py-2 border border-border-light rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag) => (
              <button
                key={tag.value}
                onClick={() => onFilterChange('tags', tag.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${
                  selectedFilters.tags.includes(tag.value)
                    ? 'bg-primary text-white' :'bg-gray-100 text-text-secondary hover:bg-gray-200'
                }`}
              >
                {tag.value} ({tag.count})
              </button>
            ))}
          </div>
        </div>
      </FilterSection>

      {/* Saved Searches */}
      <FilterSection title="Saved Searches" section="savedSearches">
        <div className="space-y-2">
          {savedSearches.map((search) => (
            <div key={search.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-sm text-text-primary">{search.name}</h4>
                <p className="text-xs text-text-secondary">"{search.query}"</p>
                <p className="text-xs text-text-secondary">Created: {search.createdDate}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-1 text-text-secondary hover:text-primary transition-colors duration-200">
                  <Icon name="Play" size={14} />
                </button>
                <button className="p-1 text-text-secondary hover:text-error transition-colors duration-200">
                  <Icon name="Trash2" size={14} />
                </button>
              </div>
            </div>
          ))}
          {savedSearches.length === 0 && (
            <p className="text-sm text-text-secondary text-center py-4">
              No saved searches yet
            </p>
          )}
        </div>
      </FilterSection>
    </div>
  );
};

export default SearchFilters;