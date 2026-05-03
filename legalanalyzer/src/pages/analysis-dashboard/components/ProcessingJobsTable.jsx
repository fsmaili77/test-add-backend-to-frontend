// legalanalyzer/src/pages/analysis-dashboard/components/ProcessingJobsTable.jsx
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Icon from 'components/AppIcon';
import { formatFileSize } from '../../../api';
import { useLanguage } from 'contexts/LanguageContext';

const ProcessingJobsTable = ({ documents = [] }) => {
  const { texts } = useLanguage();

  const [sortConfig, setSortConfig] = useState({ key: 'uploadedAt', direction: 'desc' });
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter
  const filteredDocuments = useMemo(() => {
    if (filterStatus === 'all') return documents;
    return documents.filter(doc => doc.status?.toLowerCase() === filterStatus.toLowerCase());
  }, [documents, filterStatus]);

  // Sort
  const sortedDocuments = useMemo(() => {
    if (!filteredDocuments.length) return [];
    return [...filteredDocuments].sort((a, b) => {
      if (sortConfig.key === 'uploadedAt') {
        const aDate = new Date(a.uploadedAt || 0);
        const bDate = new Date(b.uploadedAt || 0);
        return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
      }
      if (sortConfig.key === 'size') {
        return sortConfig.direction === 'asc' ? (a.size || 0) - (b.size || 0) : (b.size || 0) - (a.size || 0);
      }
      if (sortConfig.key === 'analysis_duration_ms') {
        return sortConfig.direction === 'asc'
          ? (a.analysis_duration_ms || 0) - (b.analysis_duration_ms || 0)
          : (b.analysis_duration_ms || 0) - (a.analysis_duration_ms || 0);
      }
      const aStr = String(a[sortConfig.key] || '').toLowerCase();
      const bStr = String(b[sortConfig.key] || '').toLowerCase();
      if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredDocuments, sortConfig]);

  // Paginate
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

  const getStatusBadgeClass = (status) => {
    const map = {
      Analyzed:   'bg-success/10 text-success',
      Processing: 'bg-warning/10 text-warning',
      Error:      'bg-error/10 text-error',
      Pending:    'bg-secondary/10 text-secondary'
    };
    return map[status] || map.Pending;
  };

  const getStatusIconName = (status) => {
    const map = { Analyzed: 'CheckCircle', Processing: 'Clock', Error: 'XCircle', Pending: 'Clock' };
    return map[status] || 'Clock';
  };

  const getStatusLabel = (status) => {
    const map = {
      Analyzed:   texts.complete,
      Processing: texts.processing,
      Error:      texts.failed,
      Pending:    texts.pending
    };
    return map[status] || status;
  };

  const formatDuration = (ms) => {
    if (!ms || ms === 0) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getDurationLabel = (ms) => {
    if (!ms || ms === 0) return '';
    if (ms < 10000) return texts.fast;
    if (ms < 30000) return texts.normal;
    return texts.slow;
  };

  const getDurationClass = (ms) => {
    if (!ms || ms === 0) return 'text-text-secondary';
    if (ms < 10000) return 'text-success';
    if (ms < 30000) return 'text-warning';
    return 'text-error';
  };

  const statusOptions = [
    { value: 'all',        label: texts.allStatus,   count: documents.length },
    { value: 'analyzed',   label: texts.complete,    count: documents.filter(d => d.status === 'Analyzed').length },
    { value: 'processing', label: texts.processing,  count: documents.filter(d => d.status === 'Processing').length },
    { value: 'pending',    label: texts.pending,     count: documents.filter(d => d.status === 'Pending').length },
    { value: 'error',      label: texts.failed,      count: documents.filter(d => d.status === 'Error').length }
  ];

  const handleRetryProcessing = async (documentId) => {
    try {
      console.log('Retrying processing for document:', documentId);
      alert(texts.retryProcessing);
    } catch (error) {
      console.error('Error retrying document processing:', error);
      alert(texts.pleaseTryAgain);
    }
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey)
      return <Icon name="ChevronsUpDown" size={14} className="text-text-secondary ml-1" />;
    return sortConfig.direction === 'asc'
      ? <Icon name="ChevronUp" size={14} className="text-primary ml-1" />
      : <Icon name="ChevronDown" size={14} className="text-primary ml-1" />;
  };

  // Empty state
  if (!documents || documents.length === 0) {
    return (
      <div className="bg-surface rounded-lg border border-border-light p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Icon name="Activity" size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-text-primary">{texts.processingJobs}</h3>
        </div>
        <div className="text-center py-12">
          <Icon name="FileX" size={48} className="text-text-secondary mx-auto mb-4" />
          <p className="text-text-secondary mb-2">{texts.noProcessingJobs}</p>
          <p className="text-sm text-text-secondary">{texts.uploadToSeeProcessing}</p>
          <Link
            to="/document-upload"
            className="inline-flex items-center px-4 py-2 mt-4 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Icon name="Upload" size={16} className="mr-2" />
            {texts.uploadDocuments}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg border border-border-light p-6 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Icon name="Activity" size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-text-primary">{texts.processingJobs}</h3>
          <span className="text-sm text-text-secondary">({documents.length} {texts.results})</span>
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-text-secondary">{texts.filter}</span>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
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

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-border-light">
              {[
                { key: 'filename',             label: texts.document },
                { key: 'status',               label: texts.status },
                { key: 'uploadedAt',           label: texts.uploadDate },
                { key: 'analysis_duration_ms', label: texts.processingTime },
                { key: 'size',                 label: texts.size },
                { key: 'type',                 label: texts.type },
              ].map(col => (
                <th key={col.key} className="px-6 py-3 text-left">
                  <button
                    className="flex items-center text-xs font-medium text-text-secondary uppercase tracking-wider hover:text-text-primary"
                    onClick={() => handleSort(col.key)}
                  >
                    {col.label}
                    <SortIcon columnKey={col.key} />
                  </button>
                </th>
              ))}
              <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                {texts.actions}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {paginatedDocuments.map((document) => (
              <tr key={document.id} className="hover:bg-gray-50 transition-colors duration-150">
                {/* Document name */}
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-medium text-sm text-text-primary truncate max-w-xs" title={document.filename}>
                      {document.filename || document.title || 'Unnamed Document'}
                    </span>
                    <span className="text-xs text-text-secondary">ID: {document.id}</span>
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

                {/* Status badge */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(document.status)}`}>
                    <Icon name={getStatusIconName(document.status)} size={12} className="mr-1" />
                    {getStatusLabel(document.status)}
                  </span>
                </td>

                {/* Upload date */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-sm text-text-primary">
                      {document.uploadedAt
                        ? new Date(document.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                        : '—'}
                    </span>
                    {document.uploadedAt && (
                      <span className="text-xs text-text-secondary">
                        {new Date(document.uploadedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </td>

                {/* Processing time */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className={`font-medium text-sm ${getDurationClass(document.analysis_duration_ms)}`}>
                      {formatDuration(document.analysis_duration_ms)}
                    </span>
                    {document.analysis_duration_ms > 0 && (
                      <span className="text-xs text-text-secondary">
                        {getDurationLabel(document.analysis_duration_ms)}
                      </span>
                    )}
                  </div>
                </td>

                {/* Size */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-medium text-sm">
                    {document.size ? formatFileSize(document.size) : '—'}
                  </span>
                </td>

                {/* Type */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-sm capitalize">
                      {document.type === 'auto' ? 'Auto-detect' : document.type?.split('_').join(' ') || '—'}
                    </span>
                    {document.document_language && (
                      <span className="text-xs text-text-secondary">{document.document_language.toUpperCase()}</span>
                    )}
                  </div>
                </td>

                {/* Actions */}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <Link
                      to={`/document-viewer?doc=${encodeURIComponent(document.id)}`}
                      className="text-primary hover:text-blue-700 p-1 rounded hover:bg-blue-50"
                      title={texts.viewDocument}
                    >
                      <Icon name="Eye" size={16} />
                    </Link>
                    {document.status === 'Analyzed' && (
                      <Link
                        to={`/document-viewer?doc=${encodeURIComponent(document.id)}&view=analysis`}
                        className="text-success hover:text-green-700 p-1 rounded hover:bg-green-50"
                        title={texts.viewAnalysisResults}
                      >
                        <Icon name="BarChart3" size={16} />
                      </Link>
                    )}
                    {document.status === 'Error' && (
                      <button
                        className="text-warning hover:text-amber-700 p-1 rounded hover:bg-amber-50"
                        title={texts.retryProcessing}
                        onClick={() => handleRetryProcessing(document.id)}
                      >
                        <Icon name="RefreshCw" size={16} />
                      </button>
                    )}
                    {(document.status === 'Analyzed' || document.status === 'Error') && (
                      <button
                        className="text-text-secondary hover:text-red-700 p-1 rounded hover:bg-red-50"
                        title={texts.downloadDocument}
                        onClick={() => console.log('Download document:', document.id)}
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
          <p className="text-sm text-text-secondary">
            {texts.showing} {(currentPage - 1) * itemsPerPage + 1} {texts.to}{' '}
            {Math.min(currentPage * itemsPerPage, sortedDocuments.length)} {texts.of}{' '}
            {sortedDocuments.length} {texts.results}
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="flex items-center px-3 py-1 border border-border-medium rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon name="ChevronLeft" size={16} className="mr-1" />
              {texts.previous}
            </button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                const isEdge = page === 1 || page === totalPages;
                const isNear = Math.abs(page - currentPage) <= 1;
                const isEllipsisBefore = page === 2 && currentPage > 4;
                const isEllipsisAfter = page === totalPages - 1 && currentPage < totalPages - 3;

                if (totalPages > 7) {
                  if (isEdge || isNear) {
                    return (
                      <button key={page} onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 text-sm rounded ${currentPage === page ? 'bg-primary text-white' : 'border border-border-medium hover:bg-gray-50'}`}>
                        {page}
                      </button>
                    );
                  }
                  if (isEllipsisBefore || isEllipsisAfter) {
                    return <span key={page} className="px-2 text-text-secondary">...</span>;
                  }
                  return null;
                }
                return (
                  <button key={page} onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 text-sm rounded ${currentPage === page ? 'bg-primary text-white' : 'border border-border-medium hover:bg-gray-50'}`}>
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="flex items-center px-3 py-1 border border-border-medium rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {texts.next}
              <Icon name="ChevronRight" size={16} className="ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessingJobsTable;