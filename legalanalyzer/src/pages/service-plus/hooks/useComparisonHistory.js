// src/pages/service-plus/hooks/useComparisonHistory.js
import { useState, useEffect, useCallback } from 'react';
import { 
  getComparisonHistory, 
  getComparisonById, 
  deleteComparison 
} from '../../../api/servicePlus';

export const useComparisonHistory = (initialPage = 1, initialPerPage = 10) => {
  const [comparisons, setComparisons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filterType, setFilterType] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchComparisons = useCallback(async (
    page = currentPage, 
    type = filterType, 
    showLoading = true
  ) => {
    if (showLoading) setLoading(true);
    setError(null);

    try {
      const data = await getComparisonHistory(page, initialPerPage, type);
      
      setComparisons(data.comparisons || []);
      setTotalPages(data.pagination?.total_pages || 1);
      setTotalCount(data.pagination?.total_count || 0);

    } catch (err) {
      console.error('Error fetching comparisons:', err);
      setError(err.message || 'Failed to load comparison history');
      setComparisons([]);
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, filterType, initialPerPage]);

  const fetchComparisonDetails = useCallback(async (comparisonId) => {
    try {
      return await getComparisonById(comparisonId);
    } catch (err) {
      console.error('Error fetching comparison details:', err);
      setError('Failed to load comparison details');
      throw err;
    }
  }, []);

  const removeComparison = useCallback(async (comparisonId) => {
    try {
      await deleteComparison(comparisonId);
      // Refresh the list after deletion
      await fetchComparisons(currentPage, filterType, false);
      return true;
    } catch (err) {
      console.error('Error deleting comparison:', err);
      setError('Failed to delete comparison');
      throw err;
    }
  }, [currentPage, filterType, fetchComparisons]);

  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage);
  }, []);

  const handleFilterChange = useCallback((newType) => {
    setFilterType(newType);
    setCurrentPage(1); // Reset to first page when filtering
  }, []);

  const refresh = useCallback(() => {
    setRefreshing(true);
    fetchComparisons(currentPage, filterType, false);
  }, [fetchComparisons, currentPage, filterType]);

  // Initial load and when dependencies change
  useEffect(() => {
    fetchComparisons();
  }, [currentPage, filterType, fetchComparisons]);

  return {
    comparisons,
    loading,
    error,
    currentPage,
    totalPages,
    totalCount,
    filterType,
    refreshing,
    fetchComparisons,
    fetchComparisonDetails,
    removeComparison,
    handlePageChange,
    handleFilterChange,
    refresh
  };
};

// Export all hooks
export default {
  useComparison,
  useServicePlusStats,
  useComparisonHistory
};