// legalanalyzer/src/pages/analysis-dashboard/components/ProcessingJobsTable.jsx - Complete component with real data
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Icon from 'components/AppIcon';
import { formatFileSize } from '../../../api';

const ProcessingJobsTable = ({ documents = [] }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'uploadedAt', direction: 'desc' });
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter documents based on status
  const filteredDocuments = useMemo(() => {
    if (filterStatus === 'all') return documents;
    return documents.filter(doc => doc.status.toLowerCase() === filterStatus.toLowerCase());
  }, [documents, filterStatus]);

  // Sort documents
  const sortedDocuments = useMemo(() => {
    if (!filteredDocuments.length) return [];
    
    const sorted = [...filteredDocuments].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (sortConfig.key === 'uploadedAt') {
        const aDate = new Date(aValue || 0);
        const bDate = new Date(bValue || 0);
        return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
      }
      
      if (sortConfig.key === 'size') {
        const aSize = a.size || 0;
        const bSize = b.size || 0;
        return sortConfig.direction === 'asc' ? aSize - bSize : bSize - aSize;
      }
      
      if (sortConfig.key === 'analysis_duration_ms') {
        const aDuration = a.analysis_duration_ms || 0;
        const bDuration = b.analysis_duration_ms || 0;
        return sortConfig.direction === 'asc' ? aDuration - bDuration : bDuration - aDuration;
      }
      
      // String comparison for other fields
      const aStr = String(aValue || '').toLowerCase();
      const bStr = String(bValue || '').toLowerCase();
      
      if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
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

  const getStatusIcon = (status) => {
    const statusConfig = {
      'Analyzed': { icon: 'CheckCircle', color: 'text-success' },
      'Processing': { icon: 'Clock', color: 'text-warning' },
      'Error': { icon: 'XCircle', color: 'text-error' },
      'Pending': { icon: 'Clock', color: 'text-secondary' }
    };
    
    const config = statusConfig[status] || statusConfig['Pending'];
    return <Icon name={config.icon} size={16} className={config.color} />;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Analyzed': 'bg-success/10 text-success',
      'Processing': 'bg-warning/10 text-warning',
      'Error': 'bg-error/10 text-error',
      'Pending': 'bg-secondary/10 text-secondary'
    };
    
    const colorClass = statusConfig[status] || statusConfig['Pending'];
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {getStatusIcon(status)}
        <span className="ml-1">{status}</span>
      </span>
    );
  };

  const formatDuration = (ms) => {
    if (!ms || ms === 0) return 'N/A';
    
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getDurationClass = (ms) => {
    if (!ms || ms === 0) return 'text-text-secondary';
    if (ms < 10000) return 'text-success'; // Fast (under 10s)
    if (ms < 30000) return 'text-warning'; // Normal (10-30s)
    return 'text-error'; // Slow (over 30s)
  };

  const statusOptions = [
    { value: 'all', label: 'All Status', count: documents.length },
    { value: 'analyzed', label: 'Analyzed', count: documents.filter(d => d.status === 'Analyzed').length },
    { value: 'processing', label: 'Processing', count: documents.filter(d => d.status === 'Processing').length },
    { value: 'pending', label: 'Pending', count: documents.filter(d => d.status === 'Pending').length },
    { value: 'error', label: 'Error', count: documents.filter(d => d.status === 'Error').length }
  ];

  const handleRetryProcessing = async (documentId) => {
    try {
      // In a real implementation, this would call the re-analysis API
      console.log('Retrying processing for document:', documentId);
      // You could add API call here: await analyzeDocument(documentId);
      alert('Retry functionality would trigger re-analysis of the document.');
    } catch (error) {
      console.error('Error retrying document processing:', error);
      alert('Failed to retry processing. Please try again.');
    }
  };

  if (!documents || documents.length === 0) {
    return (
      <div className="bg-surface rounded-lg border border-border-light p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Icon name="Activity" size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-text-primary">Processing Jobs</h3>
        </div>
        <div className="text-center py-12">
          <Icon name="FileX" size={48} className="text-text-secondary mx-auto mb-4" />
          <p className="text-text-secondary mb-2">No processing jobs found</p>
          <p className="text-sm text-text-secondary">Upload documents to see processing status here</p>
          <Link 
            to="/document-upload"
            className="inline-flex items-center px-4 py-2 mt-4 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Icon name="Upload" size={16} className="mr-2" />
            Upload Documents
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg border border-border-light p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Icon name="Activity" size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-text-primary">Processing Jobs</h3>
          <span className="text-sm text-text-secondary">({documents.length} total)</span>
        </div>
        
        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-text-secondary">Filter:</span>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1 border border-border-light rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label} ({option.count})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-success">{documents.filter(d => d.status === 'Analyzed').length}</div>
          <div className="text-xs text-text-secondary">Completed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-warning">{documents.filter(d => d.status === 'Processing').length}</div>
          <div className="text-xs text-text-secondary">Processing</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-secondary">{documents.filter(d => d.status === 'Pending').length}</div>
          <div className="text-xs text-text-secondary">Pending</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-error">{documents.filter(d => d.status === 'Error').length}</div>
          <div className="text-xs text-text-secondary">Failed</div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border-light">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('filename')}
              >
                <div className="flex items-center space-x-1">
                  <span>Document</span>
                  <Icon name="ArrowUpDown" size={12} />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('uploadedAt')}
              >
                <div className="flex items-center space-x-1">
                  <span>Started</span>
                  <Icon name="ArrowUpDown" size={12} />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Status
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('analysis_duration_ms')}
              >
                <div className="flex items-center space-x-1">
                  <span>Duration</span>
                  <Icon name="ArrowUpDown" size={12} />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('size')}
              >
                <div className="flex items-center space-x-1">
                  <span>Size</span>
                  <Icon name="ArrowUpDown" size={12} />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                Actions
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
                      <div className="text-sm font-medium text-text-primary truncate max-w-xs" title={document.filename}>
                        {document.filename}
                      </div>
                      <div className="text-xs text-text-secondary">
                        ID: {document.id} • {document.fileExtension}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-text-secondary">
                    {document.uploadedAt ? new Date(document.uploadedAt).toLocaleDateString() : 'Unknown'}
                  </div>
                  <div className="text-xs text-text-secondary">
                    {document.uploadedAt ? new Date(document.uploadedAt).toLocaleTimeString() : ''}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(document.status)}
                  {document.status === 'Analyzed' && (
                    <div className="flex items-center mt-1">
                      <Icon name="Zap" size={12} className="text-blue-600 mr-1" />
                      <span className="text-xs text-blue-600">Gemini AI</span>
                    </div>
                  )}
                  {document.status === 'Processing' && (
                    <div className="mt-1">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-warning h-1.5 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                      </div>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className={`font-medium text-sm ${getDurationClass(document.analysis_duration_ms)}`}>
                      {formatDuration(document.analysis_duration_ms)}
                    </span>
                    {document.analysis_duration_ms && document.analysis_duration_ms > 0 && (
                      <span className="text-xs text-text-secondary">
                        {document.analysis_duration_ms < 10000 ? 'Fast' :
                         document.analysis_duration_ms < 30000 ? 'Normal' : 'Slow'}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">
                      {document.size ? formatFileSize(document.size) : 'Unknown'}
                    </span>
                    {document.size && (
                      <span className="text-xs text-text-secondary">
                        {document.size > 10 * 1024 * 1024 ? 'Large' : 
                         document.size > 1024 * 1024 ? 'Medium' : 'Small'}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-sm capitalize">
                      {document.type === 'auto' ? 'Auto-detect' : 
                       document.type?.split('_').join(' ') || 'Unknown'}
                    </span>
                    {document.document_language && (
                      <span className="text-xs text-text-secondary">
                        {document.document_language.toUpperCase()}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <Link
                      to={`/document-viewer?doc=${encodeURIComponent(document.id)}`}
                      className="text-primary hover:text-blue-700 p-1 rounded hover:bg-blue-50"
                      title="View Document"
                    >
                      <Icon name="Eye" size={16} />
                    </Link>
                    {document.status === 'Analyzed' && (
                      <Link
                        to={`/document-viewer?doc=${encodeURIComponent(document.id)}&view=analysis`}
                        className="text-success hover:text-green-700 p-1 rounded hover:bg-green-50"
                        title="View Analysis Results"
                      >
                        <Icon name="BarChart3" size={16} />
                      </Link>
                    )}
                    {document.status === 'Error' && (
                      <button
                        className="text-warning hover:text-amber-700 p-1 rounded hover:bg-amber-50"
                        title="Retry Processing"
                        onClick={() => handleRetryProcessing(document.id)}
                      >
                        <Icon name="RefreshCw" size={16} />
                      </button>
                    )}
                    {(document.status === 'Analyzed' || document.status === 'Error') && (
                      <button
                        className="text-text-secondary hover:text-red-700 p-1 rounded hover:bg-red-50"
                        title="Download Document"
                        onClick={() => {
                          console.log('Download document:', document.id);
                          alert('Download functionality would be implemented here.');
                        }}
                      >
                        <Icon name="Download" size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border-light">
          <div>
            <p className="text-sm text-text-secondary">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, sortedDocuments.length)} of{' '}
              {sortedDocuments.length} results
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="flex items-center px-3 py-1 border border-border-medium rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon name="ChevronLeft" size={16} className="mr-1" />
              Previous
            </button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                if (totalPages > 7) {
                  // Show condensed pagination for many pages
                  if (page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 text-sm rounded ${
                          currentPage === page
                            ? 'bg-primary text-white'
                            : 'border border-border-medium hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (page === 2 && currentPage > 4) {
                    return <span key={page} className="px-2 text-text-secondary">...</span>;
                  } else if (page === totalPages - 1 && currentPage < totalPages - 3) {
                    return <span key={page} className="px-2 text-text-secondary">...</span>;
                  }
                  return null;
                } else {
                  // Show all pages if 7 or fewer
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 text-sm rounded ${
                        currentPage === page
                          ? 'bg-primary text-white'
                          : 'border border-border-medium hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                }
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="flex items-center px-3 py-1 border border-border-medium rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <Icon name="ChevronRight" size={16} className="ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessingJobsTable;