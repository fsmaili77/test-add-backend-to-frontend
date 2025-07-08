import React from 'react';
import Icon from 'components/AppIcon';

const SearchPagination = ({ currentPage, totalPages, onPageChange, totalResults, itemsPerPage }) => {
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
      // Scroll to top of results
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-surface rounded-lg border border-border-light">
      {/* Results Info */}
      <div className="text-sm text-text-secondary">
        Showing <span className="font-medium text-text-primary">{startResult}</span> to{' '}
        <span className="font-medium text-text-primary">{endResult}</span> of{' '}
        <span className="font-medium text-text-primary">{totalResults}</span> results
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center space-x-2">
        {/* Previous Button */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
            currentPage === 1
              ? 'text-text-secondary cursor-not-allowed' :'text-text-primary hover:bg-gray-50 hover:text-primary'
          }`}
        >
          <Icon name="ChevronLeft" size={16} />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Page Numbers */}
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
                      ? 'bg-primary text-white' :'text-text-primary hover:bg-gray-50 hover:text-primary'
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Next Button */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
            currentPage === totalPages
              ? 'text-text-secondary cursor-not-allowed' :'text-text-primary hover:bg-gray-50 hover:text-primary'
          }`}
        >
          <span className="hidden sm:inline">Next</span>
          <Icon name="ChevronRight" size={16} />
        </button>
      </div>

      {/* Quick Jump */}
      <div className="flex items-center space-x-2 text-sm">
        <span className="text-text-secondary">Go to page:</span>
        <input
          type="number"
          min="1"
          max={totalPages}
          value={currentPage}
          onChange={(e) => {
            const page = parseInt(e.target.value);
            if (page >= 1 && page <= totalPages) {
              handlePageChange(page);
            }
          }}
          className="w-16 px-2 py-1 border border-border-light rounded text-center focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <span className="text-text-secondary">of {totalPages}</span>
      </div>
    </div>
  );
};

export default SearchPagination;