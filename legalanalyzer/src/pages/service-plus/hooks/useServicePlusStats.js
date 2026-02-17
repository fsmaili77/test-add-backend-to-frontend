// src/pages/service-plus/hooks/useServicePlusStats.js
import { useState, useEffect, useCallback } from 'react';
import { getServicePlusStats, checkServicePlusHealth } from '../../../api/servicePlus';

export const useServicePlusStats = (refreshInterval = 30000) => {
  const [stats, setStats] = useState({
    totalComparisons: 0,
    todayComparisons: 0,
    avgSimilarity: 0,
    availableDocuments: 0,
    generatedDocuments: 0,
    caseAnalyses: 0
  });
  
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchStats = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);

    try {
      const [statsData, healthData] = await Promise.all([
        getServicePlusStats().catch(err => {
          console.warn('Failed to fetch stats:', err);
          return {
            totalComparisons: 0,
            todayComparisons: 0,
            avgSimilarity: 0,
            generatedDocuments: 0,
            caseAnalyses: 0,
            error: err.message
          };
        }),
        checkServicePlusHealth().catch(err => {
          console.warn('Health check failed:', err);
          return {
            status: 'unknown',
            service_plus_available: false,
            error: err.message
          };
        })
      ]);

      setStats(prevStats => ({
        ...prevStats,
        ...statsData
      }));
      
      setHealth(healthData);
      setLastUpdated(new Date());

    } catch (err) {
      console.error('Error fetching Service+ stats:', err);
      setError(err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  const updateStats = useCallback((updates) => {
    setStats(prevStats => ({
      ...prevStats,
      ...updates
    }));
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Auto-refresh
  useEffect(() => {
    if (!refreshInterval) return;

    const interval = setInterval(() => {
      fetchStats(false); // Don't show loading for auto-refresh
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchStats, refreshInterval]);

  return {
    stats,
    health,
    loading,
    error,
    lastUpdated,
    fetchStats,
    updateStats
  };
};