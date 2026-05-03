// legalanalyzer/src/pages/search-results/components/SearchFilters.jsx

import React, { useState, useMemo } from 'react';
import Icon from 'components/AppIcon';
import { useLanguage } from 'contexts/LanguageContext';

const SearchFilters = ({ selectedFilters, onFilterChange, onClearAll, savedSearches = [], documents = [], trends = null }) => {
  const { texts } = useLanguage();

  const [expandedSections, setExpandedSections] = useState({
    documentType: true, dateRange: true, status: true,
    parties: false, practiceAreas: true, language: false,
    savedSearches: savedSearches.length > 0
  });
  const [partySearch, setPartySearch] = useState('');
  const [tagSearch, setTagSearch] = useState('');

  const documentTypes = useMemo(() => {
    const counts = documents.reduce((acc, doc) => {
      const type = doc.type?.charAt(0).toUpperCase() + doc.type?.slice(1).replace('_', ' ') || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([type, count]) => ({ value: type, count })).sort((a, b) => b.count - a.count);
  }, [documents]);

  const statusOptions = useMemo(() => {
    const counts = documents.reduce((acc, doc) => { const s = doc.status || 'Unknown'; acc[s] = (acc[s] || 0) + 1; return acc; }, {});
    return Object.entries(counts).map(([status, count]) => ({ value: status, count })).sort((a, b) => b.count - a.count);
  }, [documents]);

  const practiceAreas = useMemo(() => {
    const map = { contract: 'Contract Law', employment: 'Employment Law', corporate: 'Corporate Law', real_estate: 'Real Estate Law', intellectual_property: 'IP Law', litigation: 'Litigation', regulatory: 'Regulatory Law', merger: 'M&A Law', license: 'Licensing Law', judgment: 'Court Decisions', brief: 'Legal Briefs', pleading: 'Court Pleadings', agreement: 'Legal Agreements' };
    const counts = documents.reduce((acc, doc) => { const area = map[doc.type] || 'General Legal'; acc[area] = (acc[area] || 0) + 1; return acc; }, {});
    return Object.entries(counts).map(([area, count]) => ({ value: area, count })).sort((a, b) => b.count - a.count);
  }, [documents]);

  const commonParties = useMemo(() => {
    const counts = {};
    documents.forEach(doc => { if (doc.parties) doc.parties.split(',').map(p => p.trim()).filter(p => p.length > 0).forEach(party => { counts[party] = (counts[party] || 0) + 1; }); });
    return Object.entries(counts).filter(([party]) => party.toLowerCase().includes(partySearch.toLowerCase())).map(([party, count]) => ({ value: party, count })).sort((a, b) => b.count - a.count).slice(0, 20);
  }, [documents, partySearch]);

  const languageOptions = useMemo(() => {
    const counts = documents.reduce((acc, doc) => { const lang = doc.document_language?.toUpperCase() || 'Unknown'; acc[lang] = (acc[lang] || 0) + 1; return acc; }, {});
    return Object.entries(counts).map(([lang, count]) => ({ value: lang, count })).sort((a, b) => b.count - a.count);
  }, [documents]);

  const popularTags = useMemo(() => {
    const counts = {};
    documents.forEach(doc => {
      const tags = [];
      if (doc.type) tags.push(doc.type.replace('_', '-'));
      if (doc.document_language) tags.push(doc.document_language);
      if (doc.court) tags.push('court-document');
      if (doc.parties?.includes(',')) tags.push('multi-party');
      if (doc.status === 'Analyzed') tags.push('ai-analyzed');
      if (doc.analysis_duration_ms && doc.analysis_duration_ms < 10000) tags.push('fast-analysis');
      if (doc.size && doc.size > 5 * 1024 * 1024) tags.push('large-file');
      tags.forEach(tag => { if (tag.toLowerCase().includes(tagSearch.toLowerCase())) counts[tag] = (counts[tag] || 0) + 1; });
    });
    return Object.entries(counts).map(([tag, count]) => ({ value: tag, count })).sort((a, b) => b.count - a.count).slice(0, 15);
  }, [documents, tagSearch]);

  const toggleSection = (section) => setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  const getActiveFiltersCount = () => Object.values(selectedFilters).reduce((c, f) => c + (Array.isArray(f) ? f.length : f ? 1 : 0), 0);

  const handleSavedSearchAction = (search, action) => {
    if (action === 'run') { Object.entries(search.filters || {}).forEach(([key, value]) => onFilterChange(key, value)); window.location.href = `/search-results?q=${encodeURIComponent(search.query)}`; }
    else if (action === 'delete') { const saved = JSON.parse(localStorage.getItem('savedSearches') || '[]'); localStorage.setItem('savedSearches', JSON.stringify(saved.filter(s => s.id !== search.id))); window.location.reload(); }
  };

  const dateRangeOptions = [
    { label: texts.last7Days,  value: 'week' },
    { label: texts.last30Days, value: 'month' },
    { label: '3 months',       value: 'quarter' },
    { label: texts.lastYear,   value: 'year' },
  ];

  const FilterSection = ({ title, section, children, count }) => (
    <div className="border-b border-border-light last:border-b-0">
      <button onClick={() => toggleSection(section)} className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-text-primary">{title}</span>
          {count !== undefined && <span className="text-xs text-text-secondary bg-gray-100 px-2 py-1 rounded-full">{count}</span>}
        </div>
        <Icon name={expandedSections[section] ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-text-secondary" />
      </button>
      {expandedSections[section] && <div className="px-4 pb-4">{children}</div>}
    </div>
  );

  const CheckboxFilter = ({ items, filterKey, selectedValues }) => (
    <div className="space-y-2 max-h-48 overflow-y-auto">
      {items.length > 0 ? items.map((item) => (
        <label key={item.value} className="flex items-center space-x-3 cursor-pointer group">
          <input type="checkbox" checked={selectedValues.includes(item.value)} onChange={() => onFilterChange(filterKey, item.value)} className="w-4 h-4 text-primary border-border-medium rounded focus:ring-accent focus:ring-2" />
          <span className="flex-1 text-sm text-text-primary group-hover:text-primary transition-colors">{item.value}</span>
          <span className="text-xs text-text-secondary bg-gray-100 px-2 py-1 rounded-full">{item.count}</span>
        </label>
      )) : <p className="text-sm text-text-secondary text-center py-2">{texts.noDocumentsFound}</p>}
    </div>
  );

  return (
    <div className="bg-surface rounded-lg border border-border-light">
      {/* Header */}
      <div className="p-4 border-b border-border-light">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-text-primary flex items-center space-x-2">
            <Icon name="Filter" size={18} />
            <span>{texts.filterControls}</span>
            {getActiveFiltersCount() > 0 && <span className="bg-accent text-white text-xs px-2 py-1 rounded-full">{getActiveFiltersCount()}</span>}
          </h3>
          {getActiveFiltersCount() > 0 && (
            <button onClick={onClearAll} className="text-sm text-primary hover:text-blue-700 font-medium transition-colors">{texts.clearAllFilters}</button>
          )}
        </div>
        {documents.length > 0 && <p className="text-xs text-text-secondary mt-2">{texts.showingDocuments}: {documents.length}</p>}
      </div>

      <FilterSection title={texts.documentType} section="documentType" count={documentTypes.length}>
        <CheckboxFilter items={documentTypes} filterKey="documentType" selectedValues={selectedFilters.documentType} />
      </FilterSection>

      <FilterSection title={texts.status} section="status" count={statusOptions.length}>
        <CheckboxFilter items={statusOptions} filterKey="status" selectedValues={selectedFilters.status} />
      </FilterSection>

      <FilterSection title={texts.dateRange} section="dateRange">
        <div className="space-y-3">
          <div className="space-y-2">
            {dateRangeOptions.map((range) => (
              <label key={range.value} className="flex items-center space-x-2 cursor-pointer">
                <input type="radio" name="dateRange" value={range.value} checked={selectedFilters.dateRange === range.value} onChange={(e) => onFilterChange('dateRange', e.target.value)} className="w-4 h-4 text-primary border-border-medium focus:ring-accent focus:ring-2" />
                <span className="text-sm text-text-primary">{range.label}</span>
              </label>
            ))}
          </div>
          {selectedFilters.dateRange && (
            <button onClick={() => onFilterChange('dateRange', '')} className="text-xs text-primary hover:text-blue-700">{texts.clearFilters}</button>
          )}
        </div>
      </FilterSection>

      <FilterSection title={texts.practiceArea} section="practiceAreas" count={practiceAreas.length}>
        <CheckboxFilter items={practiceAreas} filterKey="practiceAreas" selectedValues={selectedFilters.practiceAreas} />
      </FilterSection>

      <FilterSection title={texts.documentLanguage} section="language" count={languageOptions.length}>
        <CheckboxFilter items={languageOptions} filterKey="language" selectedValues={selectedFilters.language || []} />
      </FilterSection>

      <FilterSection title={texts.parties} section="parties" count={commonParties.length}>
        <div className="space-y-3">
          <div className="relative">
            <Icon name="Search" size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
            <input type="text" placeholder={`${texts.search} ${texts.parties.toLowerCase()}...`} value={partySearch} onChange={(e) => setPartySearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-border-light rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
          </div>
          <CheckboxFilter items={commonParties} filterKey="parties" selectedValues={selectedFilters.parties} />
          {commonParties.length === 0 && partySearch && <p className="text-xs text-text-secondary">{texts.noUsersFound.replace('users', `parties matching "${partySearch}"`)}</p>}
        </div>
      </FilterSection>

      <FilterSection title="Tags" section="tags" count={popularTags.length}>
        <div className="space-y-3">
          <div className="relative">
            <Icon name="Search" size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
            <input type="text" placeholder={`${texts.search} tags...`} value={tagSearch} onChange={(e) => setTagSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-border-light rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
          </div>
          {popularTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {popularTags.map((tag) => (
                <button key={tag.value} onClick={() => onFilterChange('tags', tag.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedFilters.tags?.includes(tag.value) ? 'bg-primary text-white' : 'bg-gray-100 text-text-secondary hover:bg-gray-200'}`}>
                  {tag.value} ({tag.count})
                </button>
              ))}
            </div>
          )}
        </div>
      </FilterSection>

      {savedSearches.length > 0 && (
        <FilterSection title="Saved Searches" section="savedSearches" count={savedSearches.length}>
          <div className="space-y-2">
            {savedSearches.map((search) => (
              <div key={search.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-text-primary truncate">{search.name}</h4>
                  <p className="text-xs text-text-secondary truncate">"{search.query}"</p>
                  <p className="text-xs text-text-secondary">{new Date(search.createdDate).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center space-x-2 ml-2">
                  <button onClick={() => handleSavedSearchAction(search, 'run')} className="p-1 text-primary hover:text-blue-700 transition-colors" title="Run this search"><Icon name="Play" size={14} /></button>
                  <button onClick={() => handleSavedSearchAction(search, 'delete')} className="p-1 text-text-secondary hover:text-error transition-colors" title={texts.delete}><Icon name="Trash2" size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </FilterSection>
      )}

      {documents.length > 0 && (
        <div className="p-4 bg-gray-50 border-t border-border-light">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-sm font-medium text-success">{documents.filter(d => d.status === 'Analyzed').length}</div>
              <div className="text-xs text-text-secondary">{texts.analyzed}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-primary">{documentTypes.length}</div>
              <div className="text-xs text-text-secondary">{texts.documentType}</div>
            </div>
          </div>
          {trends?.top_entities && (
            <div className="mt-3 pt-3 border-t border-border-light">
              <h4 className="text-xs font-medium text-text-secondary mb-2">{texts.partiesIdentified}</h4>
              <div className="flex flex-wrap gap-1">
                {trends.top_entities.slice(0, 5).map(([entity, count]) => (
                  <span key={entity} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{entity} ({count})</span>
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