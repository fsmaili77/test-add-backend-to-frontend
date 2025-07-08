import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import GlobalHeader from 'components/ui/GlobalHeader';
import BreadcrumbTrail from 'components/ui/BreadcrumbTrail';
import Icon from 'components/AppIcon';

import SearchFilters from './components/SearchFilters';
import SearchResultCard from './components/SearchResultCard';
import SearchPagination from './components/SearchPagination';
import SavedSearchModal from './components/SavedSearchModal';

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
    tags: []
  });
  const [showSaveSearchModal, setShowSaveSearchModal] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Mock search results data
  const mockSearchResults = [
    {
      id: 1,
      title: "Commercial Lease Agreement - Downtown Office Complex",
      snippet: "This lease agreement establishes the terms and conditions for the rental of commercial office space located at 123 Business District. The agreement includes provisions for rent escalation, maintenance responsibilities, and termination clauses...",
      documentType: "Contract",
      date: "2024-01-15",
      parties: ["ABC Corporation", "Downtown Properties LLC"],
      practiceArea: "Real Estate",
      tags: ["lease", "commercial", "office"],
      relevanceScore: 95,
      thumbnail: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=150&h=200&fit=crop",
      fileSize: "2.4 MB",
      pageCount: 24
    },
    {
      id: 2,
      title: "Employment Contract - Senior Software Engineer",
      snippet: "Employment agreement between TechCorp Inc. and John Smith for the position of Senior Software Engineer. The contract outlines compensation, benefits, confidentiality obligations, and intellectual property rights...",
      documentType: "Contract",
      date: "2024-01-10",
      parties: ["TechCorp Inc.", "John Smith"],
      practiceArea: "Employment Law",
      tags: ["employment", "software", "engineer"],
      relevanceScore: 88,
      thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=200&fit=crop",
      fileSize: "1.8 MB",
      pageCount: 12
    },
    {
      id: 3,
      title: "Merger and Acquisition Agreement - Tech Startup",
      snippet: "Agreement for the acquisition of InnovateTech Solutions by Global Enterprises. The document details the purchase price, due diligence requirements, representations and warranties, and closing conditions...",
      documentType: "M&A Agreement",
      date: "2024-01-08",
      parties: ["Global Enterprises", "InnovateTech Solutions"],
      practiceArea: "Corporate Law",
      tags: ["merger", "acquisition", "startup"],
      relevanceScore: 92,
      thumbnail: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=150&h=200&fit=crop",
      fileSize: "5.2 MB",
      pageCount: 48
    },
    {
      id: 4,
      title: "Intellectual Property License Agreement",
      snippet: "License agreement granting rights to use patented technology for manufacturing processes. The agreement includes royalty terms, territory restrictions, and quality control provisions...",
      documentType: "License Agreement",
      date: "2024-01-05",
      parties: ["TechPatents LLC", "Manufacturing Corp"],
      practiceArea: "Intellectual Property",
      tags: ["license", "patent", "technology"],
      relevanceScore: 85,
      thumbnail: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=150&h=200&fit=crop",
      fileSize: "3.1 MB",
      pageCount: 18
    },
    {
      id: 5,
      title: "Non-Disclosure Agreement - Product Development",
      snippet: "Confidentiality agreement between parties for sharing sensitive information related to new product development. The NDA covers proprietary technology, trade secrets, and market research data...",
      documentType: "NDA",
      date: "2024-01-03",
      parties: ["Innovation Labs", "Development Partners"],
      practiceArea: "Corporate Law",
      tags: ["nda", "confidentiality", "product"],
      relevanceScore: 78,
      thumbnail: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=150&h=200&fit=crop",
      fileSize: "1.2 MB",
      pageCount: 8
    }
  ];

  const mockRecentSearches = [
    "employment contract terms",
    "merger agreement clauses",
    "intellectual property license",
    "commercial lease provisions"
  ];

  const mockSavedSearches = [
    {
      id: 1,
      name: "Employment Contracts 2024",
      query: "employment contract",
      filters: { documentType: ["Contract"], practiceAreas: ["Employment Law"] },
      createdDate: "2024-01-10"
    },
    {
      id: 2,
      name: "M&A Agreements",
      query: "merger acquisition",
      filters: { documentType: ["M&A Agreement"], practiceAreas: ["Corporate Law"] },
      createdDate: "2024-01-08"
    }
  ];

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const query = urlParams.get('q');
    if (query) {
      setSearchQuery(decodeURIComponent(query));
    }
  }, [location.search]);

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
      tags: []
    });
    setCurrentPage(1);
  };

  const handleSearchSuggestion = (suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    navigate(`/search-results?q=${encodeURIComponent(suggestion)}`);
  };

  const filteredResults = mockSearchResults.filter(result => {
    if (selectedFilters.documentType.length > 0 && !selectedFilters.documentType.includes(result.documentType)) {
      return false;
    }
    if (selectedFilters.practiceAreas.length > 0 && !selectedFilters.practiceAreas.includes(result.practiceArea)) {
      return false;
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
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200"
                    >
                      <Icon name="Search" size={16} />
                    </button>
                  </div>
                  
                  {/* Search Suggestions */}
                  {showSuggestions && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border-light rounded-lg shadow-lg z-50">
                      <div className="p-4">
                        <h4 className="text-sm font-medium text-text-secondary mb-2">Recent Searches</h4>
                        {mockRecentSearches.map((search, index) => (
                          <button
                            key={index}
                            onClick={() => handleSearchSuggestion(search)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-md text-sm text-text-primary"
                          >
                            <Icon name="Clock" size={14} className="inline mr-2 text-text-secondary" />
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
                  className="flex items-center space-x-2 px-4 py-2 border border-border-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  <Icon name="Bookmark" size={16} />
                  <span className="hidden sm:inline">Save Search</span>
                </button>
                
                <button className="flex items-center space-x-2 px-4 py-2 border border-border-medium rounded-lg hover:bg-gray-50 transition-colors duration-200">
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
                    Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalResults)} of {totalResults} results for 
                    <span className="font-medium text-text-primary"> "{searchQuery}"</span>
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
          
          <div className="flex gap-8">
            {/* Filters Sidebar */}
            <div className={`${isFiltersOpen ? 'block' : 'hidden'} lg:block w-full lg:w-80 flex-shrink-0`}>
              <div className="lg:sticky lg:top-24">
                <SearchFilters
                  selectedFilters={selectedFilters}
                  onFilterChange={handleFilterChange}
                  onClearAll={clearAllFilters}
                  savedSearches={mockSavedSearches}
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
                            ? 'bg-primary text-white' :'text-text-secondary hover:text-text-primary hover:bg-gray-50'
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
              
              {/* Search Results */}
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
                    <h3 className="text-lg font-medium text-text-primary mb-2">No results found</h3>
                    <p className="text-text-secondary mb-4">
                      Try adjusting your search terms or filters to find what you're looking for.
                    </p>
                    <button
                      onClick={clearAllFilters}
                      className="text-primary hover:text-blue-700 font-medium"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
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
          onSave={(searchData) => {
            console.log('Saving search:', searchData);
            setShowSaveSearchModal(false);
          }}
        />
      )}
    </div>
  );
};

export default SearchResults;