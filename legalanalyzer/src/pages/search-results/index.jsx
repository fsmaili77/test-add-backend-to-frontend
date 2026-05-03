// legalanalyzer/src/pages/search-results/index.jsx - Updated with real Python backend data

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import GlobalHeader from 'components/ui/GlobalHeader';
import BreadcrumbTrail from 'components/ui/BreadcrumbTrail';
import Icon from 'components/AppIcon';
import SearchFilters from './components/SearchFilters';
import SearchResultCard from './components/SearchResultCard';
import SearchPagination from './components/SearchPagination';
import SavedSearchModal from './components/SavedSearchModal';
import { searchDocuments, getDocuments, getTrends, checkMicroservicesHealth, formatFileSize } from '../../api';
import { useLanguage } from 'contexts/LanguageContext';

const SearchResults = () => {
  const { texts } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({ documentType: [], dateRange: '', parties: [], practiceAreas: [], tags: [], status: [] });
  const [showSaveSearchModal, setShowSaveSearchModal] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [searchResults, setSearchResults] = useState([]);
  const [allDocuments, setAllDocuments] = useState([]);
  const [trends, setTrends] = useState(null);
  const [backendHealth, setBackendHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [docs, trendsData, health] = await Promise.all([
          getDocuments().catch(err => { console.warn('Failed to fetch documents:', err); return []; }),
          getTrends().catch(err => { console.warn('Failed to fetch trends:', err); return null; }),
          checkMicroservicesHealth().catch(err => { console.warn('Health check failed:', err); return { overall_status: 'unknown' }; })
        ]);
        setAllDocuments(docs);
        setTrends(trendsData);
        setBackendHealth(health);
        setSearchSuggestions(generateSearchSuggestions(docs, trendsData));
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to load initial data');
      }
    };
    fetchInitialData();
    loadSavedSearches();
    loadRecentSearches();
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const query = urlParams.get('q');
    if (query) { const decoded = decodeURIComponent(query); setSearchQuery(decoded); performSearch(decoded); }
  }, [location.search]);

  const generateSearchSuggestions = (documents, trendsData) => {
    const suggestions = [...new Set(documents.map(doc => doc.type).filter(Boolean))].slice(0, 3);
    if (trendsData?.top_entities) suggestions.push(...trendsData.top_entities.slice(0, 3).map(e => e[0]));
    suggestions.push('contract analysis', 'court documents', 'legal agreements');
    return [...new Set(suggestions)].slice(0, 8);
  };

  const performSearch = async (query) => {
    if (!query.trim()) { setSearchResults([]); return; }
    setLoading(true);
    setError(null);
    try {
      const results = await searchDocuments(query);
      setSearchResults(results.map(doc => ({
        id: doc.id,
        title: doc.title || doc.filename,
        snippet: doc.summary || `${doc.filename} - ${doc.type || 'Legal Document'}. ${doc.parties ? `Parties: ${doc.parties}` : ''}`,
        documentType: doc.type?.charAt(0).toUpperCase() + doc.type?.slice(1).replace('_', ' ') || 'Unknown',
        date: doc.uploadedAt || new Date().toISOString(),
        parties: doc.parties ? doc.parties.split(',').map(p => p.trim()) : [],
        practiceArea: getPracticeArea(doc.type),
        tags: generateTags(doc),
        relevanceScore: calculateRelevance(doc, query),
        fileSize: doc.size ? formatFileSize(doc.size) : 'Unknown',
        pageCount: 1,
        status: doc.status,
        document_language: doc.document_language,
        court: doc.court,
        document_date: doc.document_date,
        analysis_duration_ms: doc.analysis_duration_ms
      })));
      saveRecentSearch(query);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'Search failed');
      setSearchResults([]);
    } finally { setLoading(false); }
  };

  const getPracticeArea = (docType) => {
    const map = { contract: 'Contract Law', employment: 'Employment Law', corporate: 'Corporate Law', real_estate: 'Real Estate Law', intellectual_property: 'IP Law', litigation: 'Litigation', regulatory: 'Regulatory Law', merger: 'M&A Law', license: 'Licensing Law' };
    return map[docType] || 'General Legal';
  };

  const generateTags = (doc) => {
    const tags = [];
    if (doc.type) tags.push(doc.type.replace('_', ' '));
    if (doc.document_language) tags.push(doc.document_language);
    if (doc.court) tags.push('court document');
    if (doc.parties?.includes(',')) tags.push('multi party');
    if (doc.status === 'Analyzed') tags.push('ai analyzed');
    return tags.slice(0, 5);
  };

  const calculateRelevance = (doc, query) => {
    let score = 50;
    const q = query.toLowerCase();
    if (doc.filename?.toLowerCase().includes(q)) score += 20;
    if (doc.summary?.toLowerCase().includes(q)) score += 15;
    if (doc.parties?.toLowerCase().includes(q)) score += 10;
    if (doc.type?.toLowerCase().includes(q)) score += 10;
    if (doc.status === 'Analyzed') score += 5;
    return Math.min(score, 100);
  };

  const handleSearch = (e) => { e.preventDefault(); if (searchQuery.trim()) navigate(`/search-results?q=${encodeURIComponent(searchQuery)}`); };
  const handleSortChange = (newSortBy) => { if (sortBy === newSortBy) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); else { setSortBy(newSortBy); setSortOrder('desc'); } };
  const handleFilterChange = (filterType, value) => { setSelectedFilters(prev => ({ ...prev, [filterType]: Array.isArray(prev[filterType]) ? prev[filterType].includes(value) ? prev[filterType].filter(i => i !== value) : [...prev[filterType], value] : value })); setCurrentPage(1); };
  const clearAllFilters = () => { setSelectedFilters({ documentType: [], dateRange: '', parties: [], practiceAreas: [], tags: [], status: [] }); setCurrentPage(1); };
  const handleSearchSuggestion = (suggestion) => { setSearchQuery(suggestion); setShowSuggestions(false); navigate(`/search-results?q=${encodeURIComponent(suggestion)}`); };
  const saveRecentSearch = (query) => { const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]'); const updated = [query, ...recent.filter(s => s !== query)].slice(0, 10); localStorage.setItem('recentSearches', JSON.stringify(updated)); setRecentSearches(updated); };
  const loadRecentSearches = () => setRecentSearches(JSON.parse(localStorage.getItem('recentSearches') || '[]'));
  const loadSavedSearches = () => setSavedSearches(JSON.parse(localStorage.getItem('savedSearches') || '[]'));
  const handleSaveSearch = (searchData) => { const saved = JSON.parse(localStorage.getItem('savedSearches') || '[]'); const updated = [...saved, { ...searchData, id: Date.now(), createdDate: new Date().toISOString() }]; localStorage.setItem('savedSearches', JSON.stringify(updated)); setSavedSearches(updated); setShowSaveSearchModal(false); };

  const filteredResults = searchResults.filter(result => {
    if (selectedFilters.documentType.length > 0 && !selectedFilters.documentType.includes(result.documentType)) return false;
    if (selectedFilters.practiceAreas.length > 0 && !selectedFilters.practiceAreas.includes(result.practiceArea)) return false;
    if (selectedFilters.status.length > 0 && !selectedFilters.status.includes(result.status)) return false;
    if (selectedFilters.dateRange) {
      const daysAgo = Math.floor((new Date() - new Date(result.date)) / (1000 * 60 * 60 * 24));
      if (selectedFilters.dateRange === 'week' && daysAgo > 7) return false;
      if (selectedFilters.dateRange === 'month' && daysAgo > 30) return false;
      if (selectedFilters.dateRange === 'year' && daysAgo > 365) return false;
    }
    return true;
  });

  const sortedResults = [...filteredResults].sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'relevance') cmp = b.relevanceScore - a.relevanceScore;
    else if (sortBy === 'date') cmp = new Date(b.date) - new Date(a.date);
    else if (sortBy === 'title') cmp = a.title.localeCompare(b.title);
    else if (sortBy === 'type') cmp = a.documentType.localeCompare(b.documentType);
    return sortOrder === 'asc' ? -cmp : cmp;
  });

  const totalResults = sortedResults.length;
  const totalPages = Math.ceil(totalResults / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedResults = sortedResults.slice(startIndex, startIndex + itemsPerPage);

  const sortOptions = [
    { key: 'relevance', label: 'Relevance', icon: 'Target' },
    { key: 'date',      label: texts.uploadDate, icon: 'Calendar' },
    { key: 'title',     label: texts.documentName, icon: 'AlphabeticalSort' },
    { key: 'type',      label: texts.type, icon: 'FileType' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <BreadcrumbTrail />

          {/* Search Header */}
          <div className="mb-8">
            {backendHealth && (
              <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm mb-4 ${backendHealth.overall_status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <div className={`w-2 h-2 rounded-full ${backendHealth.overall_status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>{texts.search}: {backendHealth.overall_status === 'healthy' ? texts.online : 'Limited'}</span>
              </div>
            )}

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div className="flex-1 max-w-2xl">
                <form onSubmit={handleSearch} className="relative">
                  <div className="relative">
                    <Icon name="Search" size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-secondary" />
                    <input
                      type="text"
                      placeholder={texts.searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(e.target.value.length > 2); }}
                      onFocus={() => setShowSuggestions(searchQuery.length > 2)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      className="w-full pl-12 pr-12 py-4 border border-border-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-surface text-lg"
                    />
                    <button type="submit" disabled={loading} className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50">
                      {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Icon name="Search" size={16} />}
                    </button>
                  </div>

                  {/* Suggestions dropdown */}
                  {showSuggestions && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border-light rounded-lg shadow-lg z-50">
                      <div className="p-4">
                        {recentSearches.length > 0 && (
                          <>
                            <h4 className="text-sm font-medium text-text-secondary mb-2">{texts.recentActivity}</h4>
                            {recentSearches.slice(0, 5).map((search, index) => (
                              <button key={index} onClick={() => handleSearchSuggestion(search)} className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-md text-sm text-text-primary">
                                <Icon name="Clock" size={14} className="inline mr-2 text-text-secondary" />{search}
                              </button>
                            ))}
                            <div className="border-t border-border-light my-2"></div>
                          </>
                        )}
                        <h4 className="text-sm font-medium text-text-secondary mb-2">{texts.searchDocuments}</h4>
                        {searchSuggestions.map((suggestion, index) => (
                          <button key={index} onClick={() => handleSearchSuggestion(suggestion)} className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-md text-sm text-text-primary">
                            <Icon name="Search" size={14} className="inline mr-2 text-text-secondary" />{suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </form>
              </div>

              <div className="flex items-center space-x-4">
                <button onClick={() => setShowSaveSearchModal(true)} disabled={!searchQuery.trim()} className="flex items-center space-x-2 px-4 py-2 border border-border-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
                  <Icon name="Bookmark" size={16} />
                  <span className="hidden sm:inline">{texts.saveChanges}</span>
                </button>
                <button onClick={() => { const data = JSON.stringify(paginatedResults, null, 2); const blob = new Blob([data], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `search-results-${new Date().toISOString().split('T')[0]}.json`; a.click(); URL.revokeObjectURL(url); }} disabled={paginatedResults.length === 0} className="flex items-center space-x-2 px-4 py-2 border border-border-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
                  <Icon name="Download" size={16} />
                  <span className="hidden sm:inline">{texts.exportDocument}</span>
                </button>
              </div>
            </div>

            {/* Results summary */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-text-secondary">
                {searchQuery && (
                  <span>
                    {loading ? `${texts.search}...` : (
                      <>{texts.showing} {totalResults > 0 ? startIndex + 1 : 0}–{Math.min(startIndex + itemsPerPage, totalResults)} {texts.of} {totalResults} {texts.results} {texts.of} <span className="font-medium text-text-primary">"{searchQuery}"</span></>
                    )}
                  </span>
                )}
              </div>
              <button onClick={() => setIsFiltersOpen(!isFiltersOpen)} className="lg:hidden flex items-center space-x-2 px-4 py-2 border border-border-medium rounded-lg hover:bg-gray-50 transition-colors">
                <Icon name="Filter" size={16} />
                <span>{texts.filterControls}</span>
                {Object.values(selectedFilters).some(f => Array.isArray(f) ? f.length > 0 : f) && (
                  <span className="bg-accent text-white text-xs px-2 py-1 rounded-full">
                    {Object.values(selectedFilters).reduce((c, f) => c + (Array.isArray(f) ? f.length : f ? 1 : 0), 0)}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Icon name="AlertCircle" size={20} className="text-red-600" />
                <div>
                  <h3 className="font-medium text-red-800">{texts.error}</h3>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-8">
            {/* Filters sidebar */}
            <div className={`${isFiltersOpen ? 'block' : 'hidden'} lg:block w-full lg:w-80 flex-shrink-0`}>
              <div className="lg:sticky lg:top-24">
                <SearchFilters selectedFilters={selectedFilters} onFilterChange={handleFilterChange} onClearAll={clearAllFilters} savedSearches={savedSearches} documents={allDocuments} trends={trends} />
              </div>
            </div>

            {/* Main results */}
            <div className="flex-1 min-w-0">
              {/* Sort controls */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 p-4 bg-surface rounded-lg border border-border-light">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-text-secondary">{texts.filter}</span>
                  <div className="flex items-center space-x-2">
                    {sortOptions.map((sort) => (
                      <button key={sort.key} onClick={() => handleSortChange(sort.key)}
                        className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm transition-colors ${sortBy === sort.key ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary hover:bg-gray-50'}`}>
                        <Icon name={sort.icon} size={14} />
                        <span>{sort.label}</span>
                        {sortBy === sort.key && <Icon name={sortOrder === 'asc' ? 'ChevronUp' : 'ChevronDown'} size={14} />}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-text-secondary">{texts.showing}:</span>
                  <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="border border-border-light rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-accent">
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                  <span className="text-sm text-text-secondary">{texts.results}</span>
                </div>
              </div>

              {/* Loading */}
              {loading && (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-text-secondary">{texts.loading}</p>
                </div>
              )}

              {/* Results */}
              {!loading && (
                <div className="space-y-4">
                  {paginatedResults.length > 0 ? (
                    paginatedResults.map((result) => <SearchResultCard key={result.id} result={result} searchQuery={searchQuery} />)
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon name="Search" size={32} className="text-text-secondary" />
                      </div>
                      <h3 className="text-lg font-medium text-text-primary mb-2">
                        {searchQuery ? texts.noDocumentsFound : texts.searchDocuments}
                      </h3>
                      <p className="text-text-secondary mb-4">
                        {searchQuery
                          ? texts.tryAdjustingFilters
                          : 'Search through your legal documents using keywords, party names, or document types.'}
                      </p>
                      {Object.values(selectedFilters).some(f => Array.isArray(f) ? f.length > 0 : f) && (
                        <button onClick={clearAllFilters} className="text-primary hover:text-blue-700 font-medium">
                          {texts.clearAllFilters}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Pagination */}
              {!loading && totalPages > 1 && (
                <div className="mt-8">
                  <SearchPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalResults={totalResults} itemsPerPage={itemsPerPage} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showSaveSearchModal && (
        <SavedSearchModal searchQuery={searchQuery} selectedFilters={selectedFilters} onClose={() => setShowSaveSearchModal(false)} onSave={handleSaveSearch} />
      )}
    </div>
  );
};

export default SearchResults;