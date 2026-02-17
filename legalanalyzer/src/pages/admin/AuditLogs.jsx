// src/pages/admin/AuditLogs.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Icon from 'components/AppIcon';
import GlobalHeader from 'components/ui/GlobalHeader';
import authService from 'services/authService';

const PYTHON_API_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:3001';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    userId: '',
    action: 'all'
  });

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${PYTHON_API_URL}/admin/audit-logs`, {
        params: filters,
        headers: authService.getAuthHeaders()
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
      'case_analyzed': 'Search'
    };
    return icons[action] || 'Activity';
  };

  const getActionColor = (action) => {
    if (action.includes('delete')) return 'text-red-600';
    if (action.includes('login')) return 'text-green-600';
    if (action.includes('analyzed')) return 'text-blue-600';
    return 'text-gray-600';
  };

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      
      <div className="pt-20 px-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Audit Logs</h1>
          <p className="text-text-secondary">Track all user actions and system events</p>
        </div>

        {/* Filters */}
        <div className="bg-surface rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Action Type</label>
              <select
                value={filters.action}
                onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
                className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="all">All Actions</option>
                <option value="document_analyzed">Document Analyzed</option>
                <option value="document_deleted">Document Deleted</option>
                <option value="user_login">User Login</option>
                <option value="document_compared">Document Compared</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchAuditLogs}
                className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Icon name="Search" size={16} />
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Audit Log Timeline */}
        {loading ? (
          <div className="bg-surface rounded-lg shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-text-secondary">Loading audit logs...</p>
          </div>
        ) : (
          <div className="bg-surface rounded-lg shadow-sm p-6">
            <div className="space-y-4">
              {logs.length === 0 ? (
                <div className="text-center py-12 text-text-secondary">
                  <Icon name="FileText" size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No audit logs found</p>
                </div>
              ) : (
                logs.map((log, index) => (
                  <div key={log.id || index} className="flex gap-4 pb-4 border-b border-border-light last:border-0">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center ${getActionColor(log.action)}`}>
                      <Icon name={getActionIcon(log.action)} size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-text-primary">{log.userEmail}</p>
                          <p className="text-sm text-text-secondary">{log.action.replace(/_/g, ' ').toUpperCase()}</p>
                          {log.details && (
                            <p className="text-sm text-text-secondary mt-1">{log.details}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-text-secondary">{new Date(log.timestamp).toLocaleString()}</p>
                          <p className="text-xs text-text-secondary">{log.ipAddress}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;