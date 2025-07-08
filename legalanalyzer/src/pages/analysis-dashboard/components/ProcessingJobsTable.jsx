import React, { useState } from 'react';
import Icon from 'components/AppIcon';

const ProcessingJobsTable = () => {
  const [sortField, setSortField] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Mock data for processing jobs
  const processingJobs = [
    {
      id: 'job-001',
      documentName: 'Corporate_Merger_Agreement_2024.pdf',
      type: 'Contract',
      status: 'completed',
      duration: '2.3 min',
      entitiesExtracted: 47,
      confidenceScore: 96.2,
      timestamp: new Date('2024-01-15T10:30:00'),
      practiceArea: 'Corporate Law'
    },
    {
      id: 'job-002',
      documentName: 'Employment_Dispute_Brief.docx',
      type: 'Legal Brief',
      status: 'processing',
      duration: '1.8 min',
      entitiesExtracted: 23,
      confidenceScore: 94.1,
      timestamp: new Date('2024-01-15T10:25:00'),
      practiceArea: 'Employment Law'
    },
    {
      id: 'job-003',
      documentName: 'Real_Estate_Purchase_Contract.pdf',
      type: 'Contract',
      status: 'completed',
      duration: '3.1 min',
      entitiesExtracted: 62,
      confidenceScore: 98.7,
      timestamp: new Date('2024-01-15T10:20:00'),
      practiceArea: 'Real Estate'
    },
    {
      id: 'job-004',
      documentName: 'Patent_Application_Review.pdf',
      type: 'Regulatory',
      status: 'failed',
      duration: '0.5 min',
      entitiesExtracted: 0,
      confidenceScore: 0,
      timestamp: new Date('2024-01-15T10:15:00'),
      practiceArea: 'Intellectual Property'
    },
    {
      id: 'job-005',
      documentName: 'Litigation_Case_Summary.docx',
      type: 'Case File',
      status: 'completed',
      duration: '4.2 min',
      entitiesExtracted: 89,
      confidenceScore: 92.8,
      timestamp: new Date('2024-01-15T10:10:00'),
      practiceArea: 'Litigation'
    },
    {
      id: 'job-006',
      documentName: 'Compliance_Audit_Report.pdf',
      type: 'Regulatory',
      status: 'completed',
      duration: '2.7 min',
      entitiesExtracted: 34,
      confidenceScore: 95.4,
      timestamp: new Date('2024-01-15T10:05:00'),
      practiceArea: 'Corporate Law'
    },
    {
      id: 'job-007',
      documentName: 'Service_Agreement_Template.docx',
      type: 'Contract',
      status: 'processing',
      duration: '1.2 min',
      entitiesExtracted: 18,
      confidenceScore: 91.3,
      timestamp: new Date('2024-01-15T10:00:00'),
      practiceArea: 'Corporate Law'
    },
    {
      id: 'job-008',
      documentName: 'Court_Filing_Motion.pdf',
      type: 'Legal Brief',
      status: 'completed',
      duration: '3.8 min',
      entitiesExtracted: 56,
      confidenceScore: 97.1,
      timestamp: new Date('2024-01-15T09:55:00'),
      practiceArea: 'Litigation'
    }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <Icon name="CheckCircle" size={16} className="text-success" />;
      case 'processing':
        return <Icon name="Clock" size={16} className="text-warning" />;
      case 'failed':
        return <Icon name="XCircle" size={16} className="text-error" />;
      default:
        return <Icon name="Circle" size={16} className="text-text-secondary" />;
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-700`;
      case 'processing':
        return `${baseClasses} bg-yellow-100 text-yellow-700`;
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-700`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-700`;
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedJobs = [...processingJobs].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    if (sortField === 'timestamp') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const totalPages = Math.ceil(sortedJobs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedJobs = sortedJobs.slice(startIndex, startIndex + itemsPerPage);

  const formatTimestamp = (timestamp) => {
    return timestamp.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-surface rounded-lg border border-border-light p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-text-primary">Recent Processing Jobs</h3>
        <div className="flex items-center space-x-2">
          <button className="flex items-center space-x-2 px-3 py-1 text-sm text-text-secondary hover:text-text-primary border border-border-medium rounded hover:bg-gray-50 transition-colors duration-200">
            <Icon name="RefreshCw" size={14} />
            <span>Refresh</span>
          </button>
          <button className="flex items-center space-x-2 px-3 py-1 text-sm text-text-secondary hover:text-text-primary border border-border-medium rounded hover:bg-gray-50 transition-colors duration-200">
            <Icon name="Filter" size={14} />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-light">
              <th className="text-left py-3 px-4 font-medium text-text-secondary">
                <button
                  onClick={() => handleSort('documentName')}
                  className="flex items-center space-x-1 hover:text-text-primary"
                >
                  <span>Document</span>
                  <Icon name="ArrowUpDown" size={14} />
                </button>
              </th>
              <th className="text-left py-3 px-4 font-medium text-text-secondary">
                <button
                  onClick={() => handleSort('type')}
                  className="flex items-center space-x-1 hover:text-text-primary"
                >
                  <span>Type</span>
                  <Icon name="ArrowUpDown" size={14} />
                </button>
              </th>
              <th className="text-left py-3 px-4 font-medium text-text-secondary">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center space-x-1 hover:text-text-primary"
                >
                  <span>Status</span>
                  <Icon name="ArrowUpDown" size={14} />
                </button>
              </th>
              <th className="text-left py-3 px-4 font-medium text-text-secondary">
                <button
                  onClick={() => handleSort('duration')}
                  className="flex items-center space-x-1 hover:text-text-primary"
                >
                  <span>Duration</span>
                  <Icon name="ArrowUpDown" size={14} />
                </button>
              </th>
              <th className="text-left py-3 px-4 font-medium text-text-secondary">
                <button
                  onClick={() => handleSort('entitiesExtracted')}
                  className="flex items-center space-x-1 hover:text-text-primary"
                >
                  <span>Entities</span>
                  <Icon name="ArrowUpDown" size={14} />
                </button>
              </th>
              <th className="text-left py-3 px-4 font-medium text-text-secondary">
                <button
                  onClick={() => handleSort('confidenceScore')}
                  className="flex items-center space-x-1 hover:text-text-primary"
                >
                  <span>Confidence</span>
                  <Icon name="ArrowUpDown" size={14} />
                </button>
              </th>
              <th className="text-left py-3 px-4 font-medium text-text-secondary">
                <button
                  onClick={() => handleSort('timestamp')}
                  className="flex items-center space-x-1 hover:text-text-primary"
                >
                  <span>Time</span>
                  <Icon name="ArrowUpDown" size={14} />
                </button>
              </th>
              <th className="text-left py-3 px-4 font-medium text-text-secondary">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedJobs.map((job) => (
              <tr key={job.id} className="border-b border-border-light hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <Icon name="FileText" size={16} className="text-text-secondary" />
                    <span className="font-medium text-text-primary truncate max-w-xs">
                      {job.documentName}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-text-secondary">{job.type}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(job.status)}
                    <span className={getStatusBadge(job.status)}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-text-secondary">{job.duration}</td>
                <td className="py-3 px-4 text-text-secondary">{job.entitiesExtracted}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-text-secondary">{job.confidenceScore}%</span>
                    <div className="w-16 h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 bg-primary rounded-full"
                        style={{ width: `${job.confidenceScore}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-text-secondary text-sm">
                  {formatTimestamp(job.timestamp)}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <button className="p-1 text-text-secondary hover:text-primary">
                      <Icon name="Eye" size={16} />
                    </button>
                    <button className="p-1 text-text-secondary hover:text-primary">
                      <Icon name="Download" size={16} />
                    </button>
                    <button className="p-1 text-text-secondary hover:text-error">
                      <Icon name="Trash2" size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4">
        {paginatedJobs.map((job) => (
          <div key={job.id} className="border border-border-light rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-medium text-text-primary truncate pr-2">
                  {job.documentName}
                </h4>
                <p className="text-sm text-text-secondary">{job.type} • {job.practiceArea}</p>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(job.status)}
                <span className={getStatusBadge(job.status)}>
                  {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-text-secondary">Duration:</span>
                <span className="ml-1 text-text-primary">{job.duration}</span>
              </div>
              <div>
                <span className="text-text-secondary">Entities:</span>
                <span className="ml-1 text-text-primary">{job.entitiesExtracted}</span>
              </div>
              <div>
                <span className="text-text-secondary">Confidence:</span>
                <span className="ml-1 text-text-primary">{job.confidenceScore}%</span>
              </div>
              <div>
                <span className="text-text-secondary">Time:</span>
                <span className="ml-1 text-text-primary">{formatTimestamp(job.timestamp)}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-2 mt-3 pt-3 border-t border-border-light">
              <button className="p-2 text-text-secondary hover:text-primary">
                <Icon name="Eye" size={16} />
              </button>
              <button className="p-2 text-text-secondary hover:text-primary">
                <Icon name="Download" size={16} />
              </button>
              <button className="p-2 text-text-secondary hover:text-error">
                <Icon name="Trash2" size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border-light">
          <div className="text-sm text-text-secondary">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedJobs.length)} of {sortedJobs.length} results
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-border-medium rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 text-sm rounded ${
                    currentPage === page
                      ? 'bg-primary text-white' :'text-text-secondary hover:text-text-primary hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-border-medium rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessingJobsTable;