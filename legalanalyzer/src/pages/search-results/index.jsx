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

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    documentType: [],
    dateRange: '',
    parties: [],
    practiceAreas: [],
    tags: [],
    status: []
  });
  const [showSaveSearchModal, setShowSaveSearchModal] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Real data states
  const [searchResults, setSearchResults] = useState([]);
  const [allDocuments, setAllDocuments] = useState([]);
  const [trends, setTrends] = useState(null);
  const [backendHealth, setBackendHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);

  // Load data on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [docs, trendsData, health] = await Promise.all([
          getDocuments().catch(err => {
            console.warn('Failed to fetch documents:', err);
            return [];
          }),
          getTrends().catch(err => {
            console.warn('Failed to fetch trends:', err);
            return null;
          }),
          checkMicroservicesHealth().catch(err => {
            console.warn('Health check failed:', err);
            return { overall_status: 'unknown' };
          })
        ]);
        
        setAllDocuments(docs);
        setTrends(trendsData);
        setBackendHealth(health);
        
        // Generate search suggestions from actual documents
        const suggestions = generateSearchSuggestions(docs, trendsData);
        setSearchSuggestions(suggestions);
        
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to load initial data');
      }
    };

    fetchInitialData();
    loadSavedSearches();
    loadRecentSearches();
  }, []);

  // Handle URL query parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const query = urlParams.get('q');
    if (query) {
      const decodedQuery = decodeURIComponent(query);
      setSearchQuery(decodedQuery);
      performSearch(decodedQuery);
    }
  }, [location.search]);

  const generateSearchSuggestions = (documents, trendsData) => {
    const suggestions = [];
    
    // Add common document types
    const docTypes = [...new Set(documents.map(doc => doc.type).filter(Boolean))];
    suggestions.push(...docTypes.slice(0, 3));
    
    // Add party names from trends
    if (trendsData && trendsData.top_entities) {
      const entities = trendsData.top_entities.slice(0, 3).map(entity => entity[0]);
      suggestions.push(...entities);
    }
    
    // Add common search terms
    suggestions.push('contract analysis', 'court documents', 'legal agreements');
    
    return [...new Set(suggestions)].slice(0, 8);
  };

  const performSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const results = await searchDocuments(query);
      
      // Transform results to match expected format
      const transformedResults = results.map(doc => ({
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
        pageCount: 1, // Default since we don't track pages
        status: doc.status,
        document_language: doc.document_language,
        court: doc.court,
        document_date: doc.document_date,
        analysis_duration_ms: doc.analysis_duration_ms
      }));
      
      setSearchResults(transformedResults);
      saveRecentSearch(query);
      
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'Search failed');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getPracticeArea = (docType) => {
    const practiceAreas = {
      'contract': 'Contract Law',
      'employment': 'Employment Law',
      'corporate': 'Corporate Law',
      'real_estate': 'Real Estate Law',
      'intellectual_property': 'IP Law',
      'litigation': 'Litigation',
      'regulatory': 'Regulatory Law',
      'merger': 'M&A Law',
      'license': 'Licensing Law'
    };
    
    return practiceAreas[docType] || 'General Legal';
  };

  const generateTags = (doc) => {
    const tags = [];
    
    if (doc.type) tags.push(doc.type.replace('_', ' '));
    if (doc.document_language) tags.push(doc.document_language);
    if (doc.court) tags.push('court document');
    if (doc.parties && doc.parties.includes(',')) tags.push('multi party');
    if (doc.status === 'Analyzed') tags.push('ai analyzed');
    
    return tags.slice(0, 5);
  };

  const calculateRelevance = (doc, query) => {
    let score = 50; // Base score
    const queryLower = query.toLowerCase();
    
    // Check filename match
    if (doc.filename && doc.filename.toLowerCase().includes(queryLower)) {
      score += 20;
    }
    
    // Check summary match
    if (doc.summary && doc.summary.toLowerCase().includes(queryLower)) {
      score += 15;
    }
    
    // Check parties match
    if (doc.parties && doc.parties.toLowerCase().includes(queryLower)) {
      score += 10;
    }
    
    // Check document type match
    if (doc.type && doc.type.toLowerCase().includes(queryLower)) {
      score += 10;
    }
    
    // Bonus for analyzed documents
    if (doc.status === 'Analyzed') {
      score += 5;
    }
    
    return Math.min(score, 100);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search-results?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const handleFilterChange = (filterType, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: Array.isArray(prev[filterType]) 
        ? prev[filterType].includes(value)
          ? prev[filterType].filter(item => item !== value)
          : [...prev[filterType], value]
        : value
    }));
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSelectedFilters({
      documentType: [],
      dateRange: '',
      parties: [],
      practiceAreas: [],
      tags: [],
      status: []
    });
    setCurrentPage(1);
  };

  const handleSearchSuggestion = (suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    navigate(`/search-results?q=${encodeURIComponent(suggestion)}`);
  };

  const saveRecentSearch = (query) => {
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    const updated = [query, ...recent.filter(s => s !== query)].slice(0, 10);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
    setRecentSearches(updated);
  };

  const loadRecentSearches = () => {
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    setRecentSearches(recent);
  };

  const loadSavedSearches = () => {
    const saved = JSON.parse(localStorage.getItem('savedSearches') || '[]');
    setSavedSearches(saved);
  };

  const handleSaveSearch = (searchData) => {
    const saved = JSON.parse(localStorage.getItem('savedSearches') || '[]');
    const newSearch = {
      ...searchData,
      id: Date.now(),
      createdDate: new Date().toISOString()
    };
    const updated = [...saved, newSearch];
    localStorage.setItem('savedSearches', JSON.stringify(updated));
    setSavedSearches(updated);
    setShowSaveSearchModal(false);
  };

  // Apply filters and sorting
  const filteredResults = searchResults.filter(result => {
    if (selectedFilters.documentType.length > 0 && !selectedFilters.documentType.includes(result.documentType)) {
      return false;
    }
    if (selectedFilters.practiceAreas.length > 0 && !selectedFilters.practiceAreas.includes(result.practiceArea)) {
      return false;
    }
    if (selectedFilters.status.length > 0 && !selectedFilters.status.includes(result.status)) {
      return false;
    }
    if (selectedFilters.dateRange) {
      const resultDate = new Date(result.date);
      const now = new Date();
      const daysAgo = Math.floor((now - resultDate) / (1000 * 60 * 60 * 24));
      
      switch (selectedFilters.dateRange) {
        case 'week':
          if (daysAgo > 7) return false;
          break;
        case 'month':
          if (daysAgo > 30) return false;
          break;
        case 'year':
          if (daysAgo > 365) return false;
          break;
      }
    }
    return true;
  });

  const sortedResults = [...filteredResults].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'relevance':
        comparison = b.relevanceScore - a.relevanceScore;
        break;
      case 'date':
        comparison = new Date(b.date) - new Date(a.date);
        break;
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'type':
        comparison = a.documentType.localeCompare(b.documentType);
        break;
      default:
        comparison = 0;
    }
    return sortOrder === 'asc' ? -comparison : comparison;
  });

  const totalResults = sortedResults.length;
  const totalPages = Math.ceil(totalResults / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedResults = sortedResults.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <BreadcrumbTrail />
          
          {/* Search Header */}
          <div className="mb-8">
            {/* Backend Status */}
            {backendHealth && (
              <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm mb-4 ${
                backendHealth.overall_status === 'healthy' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  backendHealth.overall_status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span>Search: {backendHealth.overall_status === 'healthy' ? 'Online' : 'Limited'}</span>
              </div>
            )}

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div className="flex-1 max-w-2xl">
                <form onSubmit={handleSearch} className="relative">
                  <div className="relative">
                    <Icon 
                      name="Search" 
                      size={20} 
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-secondary" 
                    />
                    <input
                      type="text"
                      placeholder="Search legal documents..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowSuggestions(e.target.value.length > 2);
                      }}
                      onFocus={() => setShowSuggestions(searchQuery.length > 2)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      className="w-full pl-12 pr-12 py-4 border border-border-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-surface text-lg"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Icon name="Search" size={16} />
                      )}
                    </button>
                  </div>
                  
                  {/* Search Suggestions */}
                  {showSuggestions && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border-light rounded-lg shadow-lg z-50">
                      <div className="p-4">
                        {recentSearches.length > 0 && (
                          <>
                            <h4 className="text-sm font-medium text-text-secondary mb-2">Recent Searches</h4>
                            {recentSearches.slice(0, 5).map((search, index) => (
                              <button
                                key={index}
                                onClick={() => handleSearchSuggestion(search)}
                                className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-md text-sm text-text-primary"
                              >
                                <Icon name="Clock" size={14} className="inline mr-2 text-text-secondary" />
                                {search}
                              </button>
                            ))}
                            <div className="border-t border-border-light my-2"></div>
                          </>
                        )}
                        
                        <h4 className="text-sm font-medium text-text-secondary mb-2">Suggestions</h4>
                        {searchSuggestions.map((search, index) => (
                          <button
                            key={index}
                            onClick={() => handleSearchSuggestion(search)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-md text-sm text-text-primary"
                          >
                            <Icon name="Search" size={14} className="inline mr-2 text-text-secondary" />
                            {search}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </form>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowSaveSearchModal(true)}
                  disabled={!searchQuery.trim()}
                  className="flex items-center space-x-2 px-4 py-2 border border-border-medium rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
                >
                  <Icon name="Bookmark" size={16} />
                  <span className="hidden sm:inline">Save Search</span>
                </button>
                
                <button 
                  onClick={() => {
                    const data = JSON.stringify(paginatedResults, null, 2);
                    const blob = new Blob([data], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `search-results-${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  disabled={paginatedResults.length === 0}
                  className="flex items-center space-x-2 px-4 py-2 border border-border-medium rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
                >
                  <Icon name="Download" size={16} />
                  <span className="hidden sm:inline">Export</span>
                </button>
              </div>
            </div>
            
            {/* Results Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-text-secondary">
                {searchQuery && (
                  <span>
                    {loading ? 'Searching...' : (
                      <>
                        Showing {totalResults > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + itemsPerPage, totalResults)} of {totalResults} results for 
                        <span className="font-medium text-text-primary"> "{searchQuery}"</span>
                      </>
                    )}
                  </span>
                )}
              </div>
              
              <button
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className="lg:hidden flex items-center space-x-2 px-4 py-2 border border-border-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <Icon name="Filter" size={16} />
                <span>Filters</span>
                {Object.values(selectedFilters).some(filter => 
                  Array.isArray(filter) ? filter.length > 0 : filter
                ) && (
                  <span className="bg-accent text-white text-xs px-2 py-1 rounded-full">
                    {Object.values(selectedFilters).reduce((count, filter) => 
                      count + (Array.isArray(filter) ? filter.length : filter ? 1 : 0), 0
                    )}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Icon name="AlertCircle" size={20} className="text-red-600" />
                <div>
                  <h3 className="font-medium text-red-800">Search Error</h3>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex gap-8">
            {/* Filters Sidebar */}
            <div className={`${isFiltersOpen ? 'block' : 'hidden'} lg:block w-full lg:w-80 flex-shrink-0`}>
              <div className="lg:sticky lg:top-24">
                <SearchFilters
                  selectedFilters={selectedFilters}
                  onFilterChange={handleFilterChange}
                  onClearAll={clearAllFilters}
                  savedSearches={savedSearches}
                  documents={allDocuments}
                  trends={trends}
                />
              </div>
            </div>
            
            {/* Main Results Area */}
            <div className="flex-1 min-w-0">
              {/* Sort Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 p-4 bg-surface rounded-lg border border-border-light">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-text-secondary">Sort by:</span>
                  <div className="flex items-center space-x-2">
                    {[
                      { key: 'relevance', label: 'Relevance', icon: 'Target' },
                      { key: 'date', label: 'Date', icon: 'Calendar' },
                      { key: 'title', label: 'Title', icon: 'AlphabeticalSort' },
                      { key: 'type', label: 'Type', icon: 'FileType' }
                    ].map((sort) => (
                      <button
                        key={sort.key}
                        onClick={() => handleSortChange(sort.key)}
                        className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm transition-colors duration-200 ${
                          sortBy === sort.key
                            ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary hover:bg-gray-50'
                        }`}
                      >
                        <Icon name={sort.icon} size={14} />
                        <span>{sort.label}</span>
                        {sortBy === sort.key && (
                          <Icon 
                            name={sortOrder === 'asc' ? 'ChevronUp' : 'ChevronDown'} 
                            size={14} 
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-text-secondary">Show:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-border-light rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                  <span className="text-sm text-text-secondary">per page</span>
                </div>
              </div>
              
              {/* Loading State */}
              {loading && (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-text-secondary">Searching documents...</p>
                </div>
              )}
              
              {/* Search Results */}
              {!loading && (
                <div className="space-y-4">
                  {paginatedResults.length > 0 ? (
                    paginatedResults.map((result) => (
                      <SearchResultCard
                        key={result.id}
                        result={result}
                        searchQuery={searchQuery}
                      />
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon name="Search" size={32} className="text-text-secondary" />
                      </div>
                      <h3 className="text-lg font-medium text-text-primary mb-2">
                        {searchQuery ? 'No results found' : 'Enter a search query'}
                      </h3>
                      <p className="text-text-secondary mb-4">
                        {searchQuery 
                          ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
                          : 'Search through your legal documents using keywords, party names, or document types.'
                        }
                      </p>
                      {selectedFilters && Object.values(selectedFilters).some(filter => 
                        Array.isArray(filter) ? filter.length > 0 : filter
                      ) && (
                        <button
                          onClick={clearAllFilters}
                          className="text-primary hover:text-blue-700 font-medium"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Pagination */}
              {!loading && totalPages > 1 && (
                <div className="mt-8">
                  <SearchPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalResults={totalResults}
                    itemsPerPage={itemsPerPage}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Save Search Modal */}
      {showSaveSearchModal && (
        <SavedSearchModal
          searchQuery={searchQuery}
          selectedFilters={selectedFilters}
          onClose={() => setShowSaveSearchModal(false)}
          onSave={handleSaveSearch}
        />
      )}
    </div>
  );
};

export default SearchResults;