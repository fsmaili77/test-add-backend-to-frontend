// legalanalyzer/src/pages/analysis-dashboard/components/ProcessingJobsTable.jsx
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
    return documents.filter(doc => doc.status?.toLowerCase() === filterStatus.toLowerCase());
  }, [documents, filterStatus]);

  // Sort documents
  // Field mapping (from getDocuments in api.js):
  //   uploadedAt    ← creation_date
  //   filename      ← filename
  //   type          ← document_type
  //   size          ← file_size / size
  //   status        ← status
  //   analysis_duration_ms ← analysis_duration_ms
  //   document_language    ← document_language
  const sortedDocuments = useMemo(() => {
    if (!filteredDocuments.length) return [];

    const sorted = [...filteredDocuments].sort((a, b) => {
      if (sortConfig.key === 'uploadedAt') {
        const aDate = new Date(a.uploadedAt || 0);
        const bDate = new Date(b.uploadedAt || 0);
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

      const aStr = String(a[sortConfig.key] || '').toLowerCase();
      const bStr = String(b[sortConfig.key] || '').toLowerCase();
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
    if (ms < 10000) return 'text-success';   // Fast (under 10s)
    if (ms < 30000) return 'text-warning';   // Normal (10-30s)
    return 'text-error';                     // Slow (over 30s)
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
      console.log('Retrying processing for document:', documentId);
      alert('Retry functionality would trigger re-analysis of the document.');
    } catch (error) {
      console.error('Error retrying document processing:', error);
      alert('Failed to retry processing. Please try again.');
    }
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <Icon name="ChevronsUpDown" size={14} className="text-text-secondary ml-1" />;
    }
    return sortConfig.direction === 'asc'
      ? <Icon name="ChevronUp" size={14} className="text-primary ml-1" />
      : <Icon name="ChevronDown" size={14} className="text-primary ml-1" />;
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

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-border-light">
              {/* Document Name */}
              <th className="px-6 py-3 text-left">
                <button
                  className="flex items-center text-xs font-medium text-text-secondary uppercase tracking-wider hover:text-text-primary"
                  onClick={() => handleSort('filename')}
                >
                  Document
                  <SortIcon columnKey="filename" />
                </button>
              </th>
              {/* Status */}
              <th className="px-6 py-3 text-left">
                <button
                  className="flex items-center text-xs font-medium text-text-secondary uppercase tracking-wider hover:text-text-primary"
                  onClick={() => handleSort('status')}
                >
                  Status
                  <SortIcon columnKey="status" />
                </button>
              </th>
              {/* Upload Date */}
              <th className="px-6 py-3 text-left">
                <button
                  className="flex items-center text-xs font-medium text-text-secondary uppercase tracking-wider hover:text-text-primary"
                  onClick={() => handleSort('uploadedAt')}
                >
                  Upload Date
                  <SortIcon columnKey="uploadedAt" />
                </button>
              </th>
              {/* Processing Time */}
              <th className="px-6 py-3 text-left">
                <button
                  className="flex items-center text-xs font-medium text-text-secondary uppercase tracking-wider hover:text-text-primary"
                  onClick={() => handleSort('analysis_duration_ms')}
                >
                  Processing Time
                  <SortIcon columnKey="analysis_duration_ms" />
                </button>
              </th>
              {/* Size */}
              <th className="px-6 py-3 text-left">
                <button
                  className="flex items-center text-xs font-medium text-text-secondary uppercase tracking-wider hover:text-text-primary"
                  onClick={() => handleSort('size')}
                >
                  Size
                  <SortIcon columnKey="size" />
                </button>
              </th>
              {/* Type */}
              <th className="px-6 py-3 text-left">
                <button
                  className="flex items-center text-xs font-medium text-text-secondary uppercase tracking-wider hover:text-text-primary"
                  onClick={() => handleSort('type')}
                >
                  Type
                  <SortIcon columnKey="type" />
                </button>
              </th>
              {/* Actions */}
              <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {paginatedDocuments.map((document) => (
              <tr key={document.id} className="hover:bg-gray-50 transition-colors duration-150">
                {/* Document Name */}
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    {/* filename is mapped from case_item.filename in getDocuments */}
                    <span className="font-medium text-sm text-text-primary truncate max-w-xs" title={document.filename}>
                      {document.filename || document.title || 'Unnamed Document'}
                    </span>
                    <span className="text-xs text-text-secondary">ID: {document.id}</span>
                    {/* Show Gemini AI badge for analyzed docs */}
                    {document.status === 'Analyzed' && (
                      <div className="flex items-center mt-1">
                        <Icon name="Cpu" size={12} className="text-blue-600 mr-1" />
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
                  </div>
                </td>

                {/* Status */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(document.status)}
                </td>

                {/* Upload Date — uses uploadedAt (mapped from creation_date) */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-sm text-text-primary">
                      {document.uploadedAt
                        ? new Date(document.uploadedAt).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric'
                          })
                        : 'Unknown'}
                    </span>
                    {document.uploadedAt && (
                      <span className="text-xs text-text-secondary">
                        {new Date(document.uploadedAt).toLocaleTimeString('en-US', {
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    )}
                  </div>
                </td>

                {/* Processing Time — analysis_duration_ms from backend */}
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

                {/* Size — mapped from file_size / size in getDocuments */}
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

                {/* Type — mapped from document_type; language from document_language */}
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

                {/* Actions */}
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