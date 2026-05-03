// src/pages/admin/AuditLogs.jsx
// src/pages/admin/AuditLogs.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Icon from 'components/AppIcon';
import GlobalHeader from 'components/ui/GlobalHeader';
import { useLanguage } from 'contexts/LanguageContext';

const PYTHON_API_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:3001';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const AuditLogs = () => {
  const { texts } = useLanguage();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    userId: '',
    action: 'all'
  });

  useEffect(() => { fetchAuditLogs(); }, []);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${PYTHON_API_URL}/admin/audit-logs`, {
        params: filters,
        headers: getAuthHeaders()
      });
      setLogs(response.data.logs || []);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    const icons = {
      'document_analyzed': 'FileText',
      'document_deleted': 'Trash2',
      'user_login': 'LogIn',
      'user_logout': 'LogOut',
      'document_compared': 'GitCompare',
      'document_generated': 'FilePlus',
      'case_analyzed': 'Search',
      'client_created': 'UserPlus',
      'client_deleted': 'UserMinus',
      'client_updated': 'UserCheck'
    };
    return icons[action] || 'Activity';
  };

  const getActionColor = (action) => {
    if (action.includes('delete')) return 'text-red-600';
    if (action.includes('login')) return 'text-green-600';
    if (action.includes('analyzed')) return 'text-blue-600';
    if (action.includes('created')) return 'text-green-600';
    if (action.includes('updated')) return 'text-amber-600';
    return 'text-gray-600';
  };

  // Map action values to translated option labels
  const actionOptions = [
    { value: 'all',                label: texts.allActions },
    { value: 'document_analyzed',  label: texts.documentAnalyzed },
    { value: 'document_deleted',   label: texts.documentDeleted },
    { value: 'user_login',         label: texts.userLogin },
    { value: 'user_logout',        label: texts.userLogout },
    { value: 'document_compared',  label: texts.documentCompared },
    { value: 'document_generated', label: texts.documentGenerated },
    { value: 'case_analyzed',      label: texts.caseAnalyzed },
    { value: 'client_created',     label: texts.clientCreated },
    { value: 'client_deleted',     label: texts.clientDeleted },
    { value: 'client_updated',     label: texts.clientUpdated },
  ];

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />

      <div className="pt-20 px-6 max-w-7xl mx-auto pb-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">{texts.auditLogs}</h1>
              <p className="text-text-secondary">{texts.auditLogsDesc}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-text-secondary">{texts.totalEvents}</p>
              <p className="text-2xl font-bold text-primary">{logs.length}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-surface rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {texts.startDate}
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {texts.endDate}
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {texts.actionType}
              </label>
              <select
                value={filters.action}
                onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
                className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {actionOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchAuditLogs}
                className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors"
              >
                <Icon name="Search" size={16} />
                {texts.applyFilters}
              </button>
            </div>
          </div>
        </div>

        {/* Audit Log Timeline */}
        {loading ? (
          <div className="bg-surface rounded-lg shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-text-secondary">{texts.loadingAuditLogs}</p>
          </div>
        ) : (
          <div className="bg-surface rounded-lg shadow-sm p-6">
            <div className="space-y-4">
              {logs.length === 0 ? (
                <div className="text-center py-12 text-text-secondary">
                  <Icon name="FileText" size={48} className="mx-auto mb-4 opacity-50" />
                  <p>{texts.noAuditLogsFound}</p>
                  <p className="text-sm mt-2">{texts.tryAdjustingFilters}</p>
                </div>
              ) : (
                <>
                  {/* Timeline header */}
                  <div className="flex items-center justify-between pb-4 border-b-2 border-gray-200">
                    <h3 className="text-lg font-semibold text-text-primary">{texts.activityTimeline}</h3>
                    <button
                      onClick={() => {
                        setFilters({ startDate: '', endDate: '', userId: '', action: 'all' });
                        fetchAuditLogs();
                      }}
                      className="text-sm text-primary hover:text-blue-700 flex items-center gap-1"
                    >
                      <Icon name="X" size={14} />
                      {texts.clearFilters}
                    </button>
                  </div>

                  {/* Timeline entries */}
                  {logs.map((log, index) => (
                    <div
                      key={log.id || index}
                      className="flex gap-4 pb-4 border-b border-border-light last:border-0 hover:bg-gray-50 p-3 rounded-lg transition-colors"
                    >
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center ${getActionColor(log.action)}`}>
                        <Icon name={getActionIcon(log.action)} size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-text-primary truncate">
                                {log.userEmail || texts.unknownUser}
                              </p>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                {log.action.replace(/_/g, ' ').toUpperCase()}
                              </span>
                            </div>
                            {log.details && (
                              <p className="text-sm text-text-secondary mt-1 break-words">{log.details}</p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm text-text-secondary whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleString()}
                            </p>
                            {log.ipAddress && (
                              <p className="text-xs text-text-secondary mt-0.5">{log.ipAddress}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;