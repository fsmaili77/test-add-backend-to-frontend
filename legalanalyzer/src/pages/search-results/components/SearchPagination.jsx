// legalanalyzer/src/pages/search-results/components/SearchPagination.jsx

import React from 'react';
import Icon from 'components/AppIcon';
import { useLanguage } from 'contexts/LanguageContext';

const SearchPagination = ({ currentPage, totalPages, onPageChange, totalResults, itemsPerPage }) => {
  const { texts } = useLanguage();

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const startResult = (currentPage - 1) * itemsPerPage + 1;
  const endResult = Math.min(currentPage * itemsPerPage, totalResults);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-surface rounded-lg border border-border-light">
      {/* Results info */}
      <div className="text-sm text-text-secondary">
        {texts.showing}{' '}
        <span className="font-medium text-text-primary">{startResult}</span>{' '}
        {texts.to}{' '}
        <span className="font-medium text-text-primary">{endResult}</span>{' '}
        {texts.of}{' '}
        <span className="font-medium text-text-primary">{totalResults}</span>{' '}
        {texts.results}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center space-x-2">
        {/* Previous */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
            currentPage === 1
              ? 'text-text-secondary cursor-not-allowed'
              : 'text-text-primary hover:bg-gray-50 hover:text-primary'
          }`}
        >
          <Icon name="ChevronLeft" size={16} />
          <span className="hidden sm:inline">{texts.previous}</span>
        </button>

        {/* Page numbers */}
        <div className="flex items-center space-x-1">
          {getVisiblePages().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-3 py-2 text-text-secondary">...</span>
              ) : (
                <button
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    currentPage === page
                      ? 'bg-primary text-white'
                      : 'text-text-primary hover:bg-gray-50 hover:text-primary'
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Next */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
            currentPage === totalPages
              ? 'text-text-secondary cursor-not-allowed'
              : 'text-text-primary hover:bg-gray-50 hover:text-primary'
          }`}
        >
          <span className="hidden sm:inline">{texts.next}</span>
          <Icon name="ChevronRight" size={16} />
        </button>
      </div>

      {/* Quick jump */}
      <div className="flex items-center space-x-2 text-sm">
        <span className="text-text-secondary">{texts.pageOf}:</span>
        <input
          type="number"
          min="1"
          max={totalPages}
          value={currentPage}
          onChange={(e) => {
            const page = parseInt(e.target.value);
            if (page >= 1 && page <= totalPages) handlePageChange(page);
          }}
          className="w-16 px-2 py-1 border border-border-light rounded text-center focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <span className="text-text-secondary">{texts.of} {totalPages}</span>
      </div>
    </div>
  );
};

export default SearchPagination;