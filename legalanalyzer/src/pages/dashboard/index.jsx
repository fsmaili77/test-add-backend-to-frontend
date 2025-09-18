// legalanalyzer/src/pages/dashboard/index.jsx - Updated with Size column support
import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import GlobalHeader from 'components/ui/GlobalHeader';
import BreadcrumbTrail from 'components/ui/BreadcrumbTrail';
import Icon from 'components/AppIcon';
import RecentActivity from './components/RecentActivity';
import { useLanguage } from 'contexts/LanguageContext';
import { getDocuments, deleteDocument, analyzeDocument, checkMicroservicesHealth, formatFileSize } from '../../api';

const Dashboard = () => {
  const { texts } = useLanguage();
  const [activeFilter, setActiveFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState({ key: 'uploadDate', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [analyzingDocument, setAnalyzingDocument] = useState(null);
  const [backendHealth, setBackendHealth] = useState(null);
  const itemsPerPage = 10;

  // State for documents, loading, and error
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check backend health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const health = await checkMicroservicesHealth();
        setBackendHealth(health);
      } catch (error) {
        console.warn('Health check failed:', error);
        setBackendHealth({ overall_status: 'unknown' });
      }
    };
    
    checkHealth();
  }, []);

  // Fetch documents from Python backend on mount
  useEffect(() => {
    const fetchDocs = async () => {
      setLoading(true);
      setError(null);
      try {
        const docs = await getDocuments();
        setDocuments(docs);
      } catch (err) {
        console.error('Error fetching documents:', err);
        setError(err.message || 'Failed to load documents from server.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, []);

  // Handle document deletion with proper error handling
  const handleDelete = async (id) => {
    const document = documents.find(doc => doc.id === id);
    const confirmMessage = `Are you sure you want to delete "${document?.filename}"? This action cannot be undone.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        await deleteDocument(id);
        setDocuments(prev => prev.filter(doc => doc.id !== id));
      } catch (err) {
        if (err.message.includes('not implemented') || err.message.includes('not available')) {
          alert('Delete functionality is not implemented in the current Python backend version. Please contact your administrator to enable this feature.');
        } else {
          alert(`Failed to delete document: ${err.message}`);
        }
      }
    }
  };

  // Handle analyze document with better error handling
  const handleAnalyze = async (id, useAdvancedAnalysis = true) => {
    const document = documents.find(doc => doc.id === id);
    
    if (!document) {
      alert('Document not found');
      return;
    }

    if (document.status === 'Analyzed' && document.hasAdvancedAnalysis) {
      // Document already analyzed, just open it
      window.open(`/document-viewer?doc=${encodeURIComponent(id)}&view=analysis`, '_blank');
      return;
    }

    setAnalyzingDocument(id);
    try {
      const result = await analyzeDocument(id, useAdvancedAnalysis);
      
      // Update the document in the local state
      setDocuments(prev => prev.map(doc =>
        doc.id === id
          ? {
              ...doc,
              status: 'Analyzed',
              hasAdvancedAnalysis: true,
              analysisProgress: 100
            }
          : doc
      ));

      // Navigate to the document viewer with analysis view
      window.open(`/document-viewer?doc=${encodeURIComponent(id)}&view=analysis`, '_blank');
    } catch (err) {
      console.error('Analysis error:', err);
      
      if (err.message.includes('not implemented') || err.message.includes('not available')) {
        // If re-analysis is not available but document is already analyzed, just open it
        if (document.status === 'Analyzed') {
          window.open(`/document-viewer?doc=${encodeURIComponent(id)}&view=analysis`, '_blank');
        } else {
          alert('Re-analysis functionality is not available. Document appears to already be processed.');
        }
      } else {
        alert(`Analysis failed: ${err.message}`);
      }
    } finally {
      setAnalyzingDocument(null);
    }
  };

  // Enhanced metrics calculation with Python backend data including file sizes
  const metrics = useMemo(() => {
    const totalDocuments = documents.length;
    const pendingAnalyses = documents.filter(d => 
      d.status === 'Processing' || d.status === 'Pending'
    ).length;
    
    // Calculate actual storage used from file sizes
    const totalBytes = documents.reduce((sum, doc) => sum + (doc.size || 0), 0);
    const storageUsed = formatFileSize(totalBytes);
    const storageLimit = '10 GB'; // Mock limit
    const storagePercentage = Math.min((totalBytes / (10 * 1024 * 1024 * 1024)) * 100, 100); // Calculate percentage of 10GB
    
    const completedToday = documents.filter(d => {
      if (!d.uploadedAt) return false;
      const today = new Date();
      const uploadDate = new Date(d.uploadedAt);
      return (
        uploadDate.getDate() === today.getDate() &&
        uploadDate.getMonth() === today.getMonth() &&
        uploadDate.getFullYear() === today.getFullYear() &&
        d.status === 'Analyzed'
      );
    }).length;

    // Calculate average processing time from analysis_duration_ms
    const analyzedDocs = documents.filter(d => d.analysis_duration_ms);
    const avgDurationMs = analyzedDocs.length > 0 
      ? analyzedDocs.reduce((sum, doc) => sum + doc.analysis_duration_ms, 0) / analyzedDocs.length
      : 0;
    const processingTime = avgDurationMs > 0 ? `${(avgDurationMs / 1000).toFixed(1)} sec` : '0 sec';
    
    const successRate = totalDocuments > 0 
      ? ((documents.filter(d => d.status === 'Analyzed').length / totalDocuments) * 100).toFixed(1)
      : '0';

    return {
      totalDocuments,
      pendingAnalyses,
      storageUsed,
      storageLimit,
      storagePercentage: Math.round(storagePercentage),
      completedToday,
      processingTime,
      successRate: parseFloat(successRate),
      totalBytes
    };
  }, [documents]);

  // Filter documents based on active filter
  const filteredDocuments = useMemo(() => {
    if (activeFilter === 'All') return documents;
    return documents.filter(doc => doc.status === activeFilter);
  }, [activeFilter, documents]);

  // Sort documents with size support
  const sortedDocuments = useMemo(() => {
    const sorted = [...filteredDocuments].sort((a, b) => {
      if (sortConfig.key === 'uploadDate') {
        const aValue = new Date(a[sortConfig.key] || 0);
        const bValue = new Date(b[sortConfig.key] || 0);
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (sortConfig.key === 'size') {
        const aValue = a.size || 0;
        const bValue = b.size || 0;
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      const aValue = a[sortConfig.key] || '';
      const bValue = b[sortConfig.key] || '';
      
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

  const getStatusBadge = (status, progress = 0) => {
    const statusConfig = {
      Analyzed: { color: 'bg-success text-white', icon: 'CheckCircle' },
      Processing: { color: 'bg-warning text-white', icon: 'Clock' },
      Error: { color: 'bg-error text-white', icon: 'XCircle' },
      Pending: { color: 'bg-secondary text-white', icon: 'Clock' }
    };
    
    const config = statusConfig[status] || statusConfig.Pending;
    
    return (
      <div className="flex items-center space-x-2">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
          <Icon name={config.icon} size={12} className="mr-1" />
          {texts[status?.toLowerCase()] || status}
        </span>
        {status === "Processing" && (
          <div className="w-16 bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-warning h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress || 0}%` }}
            />
          </div>
        )}
      </div>
    );
  };

  const filterTabs = [
    { key: 'All', label: texts.allDocuments || 'All Documents', count: documents.length },
    { key: 'Processing', label: texts.processing || 'Processing', count: documents.filter(d => d.status === "Processing").length },
    { key: 'Analyzed', label: texts.complete || 'Complete', count: documents.filter(d => d.status === "Analyzed").length },
    { key: 'Error', label: texts.failed || 'Failed', count: documents.filter(d => d.status === "Error").length },
    { key: 'Pending', label: texts.pending || 'Pending', count: documents.filter(d => d.status === "Pending").length }
  ];

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <BreadcrumbTrail />
          
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-text-primary mb-2">
                  {texts.dashboard || 'Dashboard'}
                </h1>
                <p className="text-text-secondary">
                  {texts.welcomeBack || 'Welcome back'} - Powered by Python Flask & Gemini AI
                </p>
              </div>
              
              {/* Backend Status Indicator */}
              {backendHealth && (
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                  backendHealth.overall_status === 'healthy' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    backendHealth.overall_status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span>
                    {backendHealth.overall_status === 'healthy' ? 'System Online' : 'System Issues'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Loading and Error States */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p>{texts.loading || 'Loading documents from server...'}</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <Icon name="AlertCircle" size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-red-800 mb-1">Connection Error</h3>
                  <p className="text-sm text-red-700">{error}</p>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="mt-2 text-sm text-red-800 underline hover:no-underline"
                  >
                    Retry Connection
                  </button>
                </div>
              </div>
            </div>
          )}

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
                          className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                            activeFilter === tab.key
                              ? 'border-primary text-primary'
                              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-300'
                          }`}
                        >
                          {tab.label}
                          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                            activeFilter === tab.key
                              ? 'bg-primary text-white'
                              : 'bg-gray-100 text-text-secondary'
                          }`}>
                            {tab.count}
                          </span>
                        </button>
                      ))}
                    </nav>
                  </div>

                  {/* Python Backend Info Banner */}
                  <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
                    <div className="flex items-center space-x-2">
                      <Icon name="Server" size={16} className="text-blue-600" />
                      <span className="text-sm text-blue-800">
                        Connected to Python Flask backend with Google Gemini AI analysis
                      </span>
                      {backendHealth?.overall_status === 'healthy' && (
                        <Icon name="CheckCircle" size={14} className="text-green-600" />
                      )}
                    </div>
                  </div>

                  {/* Documents Table */}
                  <div className="overflow-x-auto">
                    {paginatedDocuments.length === 0 ? (
                      <div className="text-center py-12">
                        <Icon name="FileX" size={48} className="text-text-secondary mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-text-primary mb-2">
                          {activeFilter === 'All' ? 'No Documents Found' : `No ${activeFilter} Documents`}
                        </h3>
                        <p className="text-text-secondary mb-4">
                          {activeFilter === 'All' 
                            ? 'Get started by uploading your first legal document'
                            : `There are no documents with ${activeFilter.toLowerCase()} status`
                          }
                        </p>
                        {activeFilter === 'All' && (
                          <Link
                            to="/document-upload"
                            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Icon name="Upload" size={16} className="mr-2" />
                            Upload Documents
                          </Link>
                        )}
                      </div>
                    ) : (
                      <table className="min-w-full divide-y divide-border-light">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('filename')}>
                              <div className="flex items-center space-x-1">
                                <span>{texts.documentName || 'Document Name'}</span>
                                <Icon name="ArrowUpDown" size={12}/>
                              </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('uploadDate')}>
                              <div className="flex items-center space-x-1">
                                <span>{texts.uploadDate || 'Upload Date'}</span>
                                <Icon name="ArrowUpDown" size={12}/>
                              </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                              {texts.status || 'Status'}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('type')}>
                              <div className="flex items-center space-x-1">
                                <span>{texts.type || 'Type'}</span>
                                <Icon name="ArrowUpDown" size={12}/>
                              </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('size')}>
                              <div className="flex items-center space-x-1">
                                <span>{texts.size || 'Size'}</span>
                                <Icon name="ArrowUpDown" size={12}/>
                              </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                              {texts.language || 'Language'}
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                              {texts.actions || 'Actions'}
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
                                      <Icon name="FileText" size={16} className="text-primary"/>
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-text-primary truncate max-w-xs" title={document.filename}>
                                      {document.filename}
                                    </div>
                                    <div className="text-xs text-text-secondary">
                                      {document.fileExtension}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                                {document.uploadedAt ? new Date(document.uploadedAt).toLocaleDateString() : 'Unknown'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(document.status, document.analysisProgress)}
                                {document.status === 'Analyzed' && (
                                  <div className="flex items-center mt-1">
                                    <Icon name="Zap" size={12} className="text-blue-600 mr-1" />
                                    <span className="text-xs text-blue-600">Gemini AI</span>
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                                <span className="capitalize">
                                  {document.type === 'auto' ? 'Auto-detect' : 
                                   document.type?.split('_').join(' ') || 'Unknown'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                                <span className="font-medium">
                                  {document.size ? formatFileSize(document.size) : 'Unknown'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                                {document.document_language || 'Unknown'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end space-x-2">
                                  <Link
                                    to={`/document-viewer?doc=${encodeURIComponent(document.id)}`}
                                    className="text-primary hover:text-blue-700 p-1 rounded hover:bg-blue-50"
                                    title={texts.viewDocument || 'View Document'}
                                  >
                                    <Icon name="Eye" size={16}/>
                                  </Link>
                                  <button
                                    onClick={() => handleAnalyze(document.id, true)}
                                    disabled={analyzingDocument === document.id}
                                    className="text-accent hover:text-amber-600 p-1 rounded hover:bg-amber-50 disabled:opacity-50"
                                    title={document.hasAdvancedAnalysis ? texts.viewAnalyzedDocument || 'View Analysis' : texts.analyzeDocument || 'Analyze Document'}
                                  >
                                    {analyzingDocument === document.id ? (
                                      <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                      <Icon name="Zap" size={16}/>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleDelete(document.id)}
                                    className="text-error hover:text-red-700 p-1 rounded hover:bg-red-50"
                                    title={texts.deleteDocument || 'Delete Document'}
                                  >
                                    <Icon name="Trash2" size={16}/>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
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
                          {texts.previous || 'Previous'}
                        </button>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="ml-3 relative inline-flex items-center px-4 py-2 border border-border-medium text-sm font-medium rounded-md text-text-secondary bg-surface hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {texts.next || 'Next'}
                        </button>
                      </div>
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-text-secondary">
                            {texts.showing || 'Showing'}{' '}
                            <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                            {' '}{texts.to || 'to'}{' '}
                            <span className="font-medium">
                              {Math.min(currentPage * itemsPerPage, sortedDocuments.length)}
                            </span>
                            {' '}{texts.of || 'of'}{' '}
                            <span className="font-medium">{sortedDocuments.length}</span>
                            {' '}{texts.results || 'results'}
                          </p>
                        </div>
                        <div>
                          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              disabled={currentPage === 1}
                              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-border-medium bg-surface text-sm font-medium text-text-secondary hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Icon name="ChevronLeft" size={16}/>
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  currentPage === page
                                    ? 'z-10 bg-primary border-primary text-white'
                                    : 'bg-surface border-border-medium text-text-secondary hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            ))}
                            <button
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                              disabled={currentPage === totalPages}
                              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-border-medium bg-surface text-sm font-medium text-text-secondary hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Icon name="ChevronRight" size={16}/>
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
                          <Icon name="FileText" size={20} className="text-primary"/>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-text-secondary">{texts.totalDocuments || 'Total Documents'}</p>
                        <p className="text-2xl font-bold text-text-primary">{metrics.totalDocuments}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-surface rounded-lg border border-border-light p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-warning/10 rounded-lg flex items-center justify-center">
                          <Icon name="Clock" size={20} className="text-warning"/>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-text-secondary">{texts.pendingAnalyses || 'Pending Analysis'}</p>
                        <p className="text-2xl font-bold text-text-primary">{metrics.pendingAnalyses}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-surface rounded-lg border border-border-light p-6 sm:col-span-2 xl:col-span-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center mr-3">
                          <Icon name="HardDrive" size={20} className="text-success"/>
                        </div>
                        <p className="text-sm font-medium text-text-secondary">Storage Used</p>
                      </div>
                      <p className="text-sm text-text-secondary">{metrics.storageUsed}/{metrics.storageLimit}</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-success h-2 rounded-full transition-all duration-300"
                        style={{ width: `${metrics.storagePercentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Python Backend Status */}
                <div className="bg-surface rounded-lg border border-border-light p-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center space-x-2">
                    <Icon name="Server" size={20} />
                    <span>System Status</span>
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">Python Backend</span>
                      <span className={`text-sm font-medium ${
                        backendHealth?.overall_status === 'healthy' ? 'text-success' : 'text-error'
                      }`}>
                        {backendHealth?.overall_status === 'healthy' ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">Gemini AI</span>
                      <span className="text-sm font-medium text-success">Available</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">Database</span>
                      <span className="text-sm font-medium text-success">Connected</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-surface rounded-lg border border-border-light p-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">{texts.quickActions || 'Quick Actions'}</h3>
                  <div className="space-y-3">
                    <Link
                      to="/document-upload"
                      className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 transition-colors duration-200"
                    >
                      <Icon name="Upload" size={16} className="mr-2"/>
                      {texts.uploadDocuments || 'Upload Documents'}
                    </Link>
                    <Link
                      to="/analysis-dashboard"
                      className="w-full flex items-center justify-center px-4 py-3 border border-border-medium rounded-lg text-sm font-medium text-text-primary bg-surface hover:bg-gray-50 transition-colors duration-200"
                    >
                      <Icon name="BarChart3" size={16} className="mr-2"/>
                      {texts.viewAnalytics || 'View Analytics'}
                    </Link>
                    <Link
                      to="/search-results"
                      className="w-full flex items-center justify-center px-4 py-3 border border-border-medium rounded-lg text-sm font-medium text-text-primary bg-surface hover:bg-gray-50 transition-colors duration-200"
                    >
                      <Icon name="Search" size={16} className="mr-2"/>
                      {texts.searchDocuments || 'Search Documents'}
                    </Link>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="bg-surface rounded-lg border border-border-light p-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">{texts.todaysPerformance || "Today's Performance"}</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">{texts.documentsProcessed || 'Documents Processed'}</span>
                      <span className="text-sm font-medium text-text-primary">{metrics.completedToday}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">{texts.avgProcessingTime || 'Avg Processing Time'}</span>
                      <span className="text-sm font-medium text-text-primary">{metrics.processingTime}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">Analysis Engine</span>
                      <span className="text-sm font-medium text-primary">Gemini AI</span>
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