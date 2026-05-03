// src/pages/service-plus/components/ServicePlusStats.jsx

import React from 'react';
import Icon from 'components/AppIcon';
import { useServicePlusStats } from '../hooks/useServicePlusStats';
import { useLanguage } from 'contexts/LanguageContext';

const ServicePlusStats = ({ className = '', refreshInterval = 30000 }) => {
  const { texts } = useLanguage();
  const { stats, health, loading, error, lastUpdated, fetchStats } = useServicePlusStats(refreshInterval);

  const handleRefresh = () => {
    fetchStats();
  };

  const getHealthStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'unavailable': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatLastUpdated = (date) => {
    if (!date) return texts.never;
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs < 60) return `${diffSecs}s ${texts.ago}`;
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ${texts.ago}`;
    return date.toLocaleTimeString();
  };

  if (loading && !stats.totalComparisons) {
    return (
      <div className={`bg-surface rounded-lg border border-border-light p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-gray-300 rounded w-1/3"></div>
            <div className="h-4 bg-gray-300 rounded w-16"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-2">
                <div className="h-8 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-surface rounded-lg border border-border-light p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Icon name="BarChart3" size={24} className="text-primary" />
          <div>
            <h3 className="text-lg font-semibold text-text-primary">{texts.servicePlusAnalytics}</h3>
            <p className="text-sm text-text-secondary">{texts.servicePlusAnalyticsDesc}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {health && (
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${getHealthStatusColor(health.status)}`}>
              <div className={`w-2 h-2 rounded-full ${
                health.status === 'healthy' ? 'bg-green-500' :
                health.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <span className="font-medium">
                {health.status === 'healthy' ? texts.operational :
                 health.status === 'degraded' ? texts.degraded : texts.unavailable}
              </span>
            </div>
          )}

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
            title={texts.refreshStatistics}
          >
            <Icon name="RefreshCw" size={16} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">{texts.refresh}</span>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Icon name="AlertCircle" size={16} className="text-red-600" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <Icon name="GitCompare" size={20} className="text-blue-600" />
            <span className="text-xs text-blue-600 font-medium">{texts.compare}</span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-blue-800">{stats.totalComparisons}</p>
            <p className="text-xs text-blue-700">{texts.comparisons}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <Icon name="FileText" size={20} className="text-green-600" />
            <span className="text-xs text-green-600 font-medium">{texts.generate}</span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-green-800">{stats.generatedDocuments || 0}</p>
            <p className="text-xs text-green-700">{texts.documents}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <Icon name="Brain" size={20} className="text-purple-600" />
            <span className="text-xs text-purple-600 font-medium">{texts.analyze}</span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-purple-800">{stats.caseAnalyses || 0}</p>
            <p className="text-xs text-purple-700">{texts.analyses}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <Icon name="TrendingUp" size={20} className="text-orange-600" />
            <span className="text-xs text-orange-600 font-medium">{texts.today}</span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-orange-800">
              {(stats.todayComparisons || 0) + (stats.todayGenerations || 0) + (stats.todayAnalyses || 0)}
            </p>
            <p className="text-xs text-orange-700">{texts.totalActivity}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border border-indigo-200">
          <div className="flex items-center justify-between mb-2">
            <Icon name="Target" size={20} className="text-indigo-600" />
            <span className="text-xs text-indigo-600 font-medium">{texts.similarity}</span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-indigo-800">{stats.avgSimilarity || 0}%</p>
            <p className="text-xs text-indigo-700">{texts.avgScore}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
          <div className="flex items-center justify-between mb-2">
            <Icon name="Database" size={20} className="text-amber-600" />
            <span className="text-xs text-amber-600 font-medium">{texts.library}</span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-amber-800">{stats.availableDocuments || 0}</p>
            <p className="text-xs text-amber-700">{texts.documents}</p>
          </div>
        </div>
      </div>

      {/* Service Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center space-x-2 mb-3">
            <Icon name="GitCompare" size={18} className="text-blue-600" />
            <h4 className="font-semibold text-blue-900">{texts.documentComparison}</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-blue-700">{texts.totalComparisons}:</span>
              <span className="font-medium text-blue-900">{stats.totalComparisons || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-blue-700">{texts.today}:</span>
              <span className="font-medium text-blue-900">{stats.todayComparisons || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-blue-700">{texts.avgSimilarityLabel}:</span>
              <span className="font-medium text-blue-900">{stats.avgSimilarity || 0}%</span>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center space-x-2 mb-3">
            <Icon name="FileText" size={18} className="text-green-600" />
            <h4 className="font-semibold text-green-900">{texts.documentGeneration}</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-green-700">{texts.totalGenerated}:</span>
              <span className="font-medium text-green-900">{stats.generatedDocuments || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-green-700">{texts.today}:</span>
              <span className="font-medium text-green-900">{stats.todayGenerations || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-green-700">{texts.status}:</span>
              <span className="font-medium text-green-900">{texts.active}</span>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center space-x-2 mb-3">
            <Icon name="Brain" size={18} className="text-purple-600" />
            <h4 className="font-semibold text-purple-900">{texts.caseAnalysis}</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-purple-700">{texts.totalAnalyses}:</span>
              <span className="font-medium text-purple-900">{stats.caseAnalyses || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-purple-700">{texts.today}:</span>
              <span className="font-medium text-purple-900">{stats.todayAnalyses || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-purple-700">{texts.status}:</span>
              <span className="font-medium text-purple-900">{texts.active}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Service Status Details */}
      <div className="border-t border-border-light pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[texts.documentComparison, texts.documentGeneration, texts.caseAnalysis].map((label) => (
            <div key={label} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${
                health?.service_plus_available ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">{label}</p>
                <p className="text-xs text-text-secondary">
                  {health?.service_plus_available ? texts.operational : texts.serviceUnavailable}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Last Updated */}
      <div className="mt-4 flex items-center justify-between text-xs text-text-secondary">
        <span>{texts.lastUpdated}: {formatLastUpdated(lastUpdated)}</span>
        {refreshInterval && (
          <span>{texts.autoRefresh}: {Math.floor(refreshInterval / 1000)}s</span>
        )}
      </div>
    </div>
  );
};

export default ServicePlusStats;