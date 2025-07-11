import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import GlobalHeader from 'components/ui/GlobalHeader';
import BreadcrumbTrail from 'components/ui/BreadcrumbTrail';
import Icon from 'components/AppIcon';
import RecentActivity from './components/RecentActivity';
import { useLanguage } from '../../contexts/LanguageContext';
import { getDocuments } from '../../api';

const Dashboard = () => {
  const { texts } = useLanguage();
  const [activeFilter, setActiveFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState({ key: 'uploadDate', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // State for documents, loading, and error
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch documents from backend on mount
  useEffect(() => {
    const fetchDocs = async () => {
      setLoading(true);
      setError(null);
      try {
      const docs = await getDocuments();
      const mappedDocs = docs.map(doc => ({
        id: doc.id,
        filename: doc.title || doc.filename || 'Untitled',
        uploadDate: doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString() : 'Just now' || doc.createdAt || '',
        status: doc.status || 'Pending',
        type: doc.type || doc.fileType || '',
        size: doc.size ? formatFileSize(doc.size) : '0 bytes',
        analysisProgress: doc.analysisProgress || 0,
      }));
      setDocuments(mappedDocs);
    } catch (err) {
      setError('Failed to load documents.');
    } finally {
      setLoading(false);
    }
  };
  fetchDocs();
  }, []);

  // Helper function to format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Metrics based on fetched documents
  const metrics = useMemo(() => {
    const totalDocuments = documents.length;
    const pendingAnalyses = documents.filter(d => d.status === 'Processing' || d.status === 'Pending').length;
    // These are placeholders; you can calculate based on your backend data if available
    const storageUsed = '2.4 GB';
    const storageLimit = '10 GB';
    const storagePercentage = 24;
    const completedToday = documents.filter(d => {
      const today = new Date();
      const uploadDate = new Date(d.uploadDate);
      return (
        uploadDate.getDate() === today.getDate() &&
        uploadDate.getMonth() === today.getMonth() &&
        uploadDate.getFullYear() === today.getFullYear() &&
        d.status === 'Complete'
      );
    }).length;
    const processingTime = '3.2 min';
    return {
      totalDocuments,
      pendingAnalyses,
      storageUsed,
      storageLimit,
      storagePercentage,
      completedToday,
      processingTime,
    };
  }, [documents]);

  // Filter documents based on active filter
  const filteredDocuments = useMemo(() => {
    if (activeFilter === 'All') return documents;
    return documents.filter(doc => doc.status === activeFilter);
  }, [activeFilter, documents]);

  // Sort documents
  const sortedDocuments = useMemo(() => {
    const sorted = [...filteredDocuments].sort((a, b) => {
      if (sortConfig.key === 'uploadDate' || sortConfig.key === 'lastModified') {
        const aValue = new Date(a[sortConfig.key]);
        const bValue = new Date(b[sortConfig.key]);
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredDocuments, sortConfig]);

  // Paginate documents
  const paginatedDocuments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedDocuments.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedDocuments, currentPage]);

  const totalPages = Math.ceil(sortedDocuments.length / itemsPerPage);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getStatusBadge = (status, progress) => {
    const statusConfig = {
      Complete: { color: 'bg-success text-white', icon: 'CheckCircle' },
      Processing: { color: 'bg-warning text-white', icon: 'Clock' },
      Failed: { color: 'bg-error text-white', icon: 'XCircle' },
      Pending: { color: 'bg-secondary text-white', icon: 'Clock' }
    };

    const config = statusConfig[status] || statusConfig.Pending;

    return (
      <div className="flex items-center space-x-2">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
          <Icon name={config.icon} size={12} className="mr-1" />
          {texts[status?.toLowerCase()] || status}
        </span>
        {status === 'Processing' && (
          <div className="w-16 bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-warning h-1.5 rounded-full transition-all duration-300" 
              style={{ width: `${progress || 0}%` }}
            ></div>
          </div>
        )}
      </div>
    );
  };

  const filterTabs = [
    { key: 'All', label: texts.allDocuments, count: documents.length },
    { key: 'Processing', label: texts.processing, count: documents.filter(d => d.status === 'Processing').length },
    { key: 'Complete', label: texts.complete, count: documents.filter(d => d.status === 'Complete').length },
    { key: 'Failed', label: texts.failed, count: documents.filter(d => d.status === 'Failed').length }
  ];

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <BreadcrumbTrail />
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">{texts.dashboard}</h1>
            <p className="text-text-secondary">{texts.welcomeBack}</p>
          </div>
          {/* Loading and Error States */}
          {loading && <div>{texts.loading || 'Loading...'}</div>}
          {error && <div className="text-red-600">{error}</div>}
          {/* Main Grid Layout */}
          {!loading && !error && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              {/* Left Section - Documents Table (8 cols) */}
              <div className="xl:col-span-8">
                {/* Filter Tabs */}
                <div className="bg-surface rounded-lg border border-border-light mb-6">
                  <div className="border-b border-border-light">
                    <nav className="flex space-x-8 px-6" aria-label="Document filters">
                      {filterTabs.map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => {
                            setActiveFilter(tab.key);
                            setCurrentPage(1);
                          }}
                          className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeFilter === tab.key ? 'border-primary text-primary' :'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-300'}`}
                        >
                          {tab.label}
                          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeFilter === tab.key ? 'bg-primary text-white' :'bg-gray-100 text-text-secondary'}`}>
                            {tab.count}
                          </span>
                        </button>
                      ))}
                    </nav>
                  </div>
                  {/* Documents Table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border-light">
                      <thead className="bg-gray-50">
                        <tr>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('filename')}
                          >
                            <div className="flex items-center space-x-1">
                              <span>{texts.documentName}</span>
                              <Icon name="ArrowUpDown" size={12} />
                            </div>
                          </th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('uploadDate')}
                          >
                            <div className="flex items-center space-x-1">
                              <span>{texts.uploadDate}</span>
                              <Icon name="ArrowUpDown" size={12} />
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                            {texts.status}
                          </th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('type')}
                          >
                            <div className="flex items-center space-x-1">
                              <span>{texts.type}</span>
                              <Icon name="ArrowUpDown" size={12} />
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                            {texts.size}
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                            {texts.actions}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-surface divide-y divide-border-light">
                        {paginatedDocuments.map((document) => (
                          <tr key={document.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8">
                                  <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                                    <Icon name="FileText" size={16} className="text-primary" />
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-text-primary truncate max-w-xs">
                                    {document.filename}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                              {document.uploadDate ? new Date(document.uploadDate).toLocaleDateString() : ''}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(document.status, document.analysisProgress)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                              {document.type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                              {document.size}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <Link
                                  to={`/document-viewer?doc=${encodeURIComponent(document.filename)}`}
                                  className="text-primary hover:text-blue-700 p-1 rounded hover:bg-blue-50"
                                  title={texts.viewDocument}
                                >
                                  <Icon name="Eye" size={16} />
                                </Link>
                                <button
                                  className="text-accent hover:text-amber-600 p-1 rounded hover:bg-amber-50"
                                  title={texts.analyzeDocument}
                                >
                                  <Icon name="Zap" size={16} />
                                </button>
                                <button
                                  className="text-error hover:text-red-700 p-1 rounded hover:bg-red-50"
                                  title={texts.deleteDocument}
                                >
                                  <Icon name="Trash2" size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="bg-surface px-6 py-3 flex items-center justify-between border-t border-border-light">
                      <div className="flex-1 flex justify-between sm:hidden">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-4 py-2 border border-border-medium text-sm font-medium rounded-md text-text-secondary bg-surface hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {texts.previous}
                        </button>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="ml-3 relative inline-flex items-center px-4 py-2 border border-border-medium text-sm font-medium rounded-md text-text-secondary bg-surface hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {texts.next}
                        </button>
                      </div>
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-text-secondary">
                            {texts.showing}{' '}
                            <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                            {' '}{texts.to}{' '}
                            <span className="font-medium">
                              {Math.min(currentPage * itemsPerPage, sortedDocuments.length)}
                            </span>
                            {' '}{texts.of}{' '}
                            <span className="font-medium">{sortedDocuments.length}</span>
                            {' '}{texts.results}
                          </p>
                        </div>
                        <div>
                          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              disabled={currentPage === 1}
                              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-border-medium bg-surface text-sm font-medium text-text-secondary hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Icon name="ChevronLeft" size={16} />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === page ? 'z-10 bg-primary border-primary text-white' :'bg-surface border-border-medium text-text-secondary hover:bg-gray-50'}`}
                              >
                                {page}
                              </button>
                            ))}
                            <button
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                              disabled={currentPage === totalPages}
                              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-border-medium bg-surface text-sm font-medium text-text-secondary hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Icon name="ChevronRight" size={16} />
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Right Section - Metrics & Actions (4 cols) */}
              <div className="xl:col-span-4 space-y-6">
                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
                  <div className="bg-surface rounded-lg border border-border-light p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Icon name="FileText" size={20} className="text-primary" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-text-secondary">{texts.totalDocuments}</p>
                        <p className="text-2xl font-bold text-text-primary">{metrics.totalDocuments}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-surface rounded-lg border border-border-light p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-warning/10 rounded-lg flex items-center justify-center">
                          <Icon name="Clock" size={20} className="text-warning" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-text-secondary">{texts.pendingAnalyses}</p>
                        <p className="text-2xl font-bold text-text-primary">{metrics.pendingAnalyses}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-surface rounded-lg border border-border-light p-6 sm:col-span-2 xl:col-span-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center mr-3">
                          <Icon name="HardDrive" size={20} className="text-success" />
                        </div>
                        <p className="text-sm font-medium text-text-secondary">{texts.storageUsed}</p>
                      </div>
                      <p className="text-sm text-text-secondary">{metrics.storageUsed} / {metrics.storageLimit}</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-success h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${metrics.storagePercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                {/* Quick Actions Panel */}
                <div className="bg-surface rounded-lg border border-border-light p-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">{texts.quickActions}</h3>
                  <div className="space-y-3">
                    <Link
                      to="/document-upload"
                      className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 transition-colors duration-200"
                    >
                      <Icon name="Upload" size={16} className="mr-2" />
                      {texts.uploadDocuments}
                    </Link>
                    <Link
                      to="/analysis-dashboard"
                      className="w-full flex items-center justify-center px-4 py-3 border border-border-medium rounded-lg text-sm font-medium text-text-primary bg-surface hover:bg-gray-50 transition-colors duration-200"
                    >
                      <Icon name="BarChart3" size={16} className="mr-2" />
                      {texts.viewAnalytics}
                    </Link>
                    <Link
                      to="/search-results"
                      className="w-full flex items-center justify-center px-4 py-3 border border-border-medium rounded-lg text-sm font-medium text-text-primary bg-surface hover:bg-gray-50 transition-colors duration-200"
                    >
                      <Icon name="Search" size={16} className="mr-2" />
                      {texts.searchDocuments}
                    </Link>
                  </div>
                </div>
                {/* Performance Metrics */}
                <div className="bg-surface rounded-lg border border-border-light p-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">{texts.todaysPerformance}</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">{texts.documentsProcessed}</span>
                      <span className="text-sm font-medium text-text-primary">{metrics.completedToday}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">{texts.avgProcessingTime}</span>
                      <span className="text-sm font-medium text-text-primary">{metrics.processingTime}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">{texts.successRate}</span>
                      <span className="text-sm font-medium text-success">94.2%</span>
                    </div>
                  </div>
                </div>
                {/* Recent Activity */}
                <RecentActivity />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;