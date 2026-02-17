import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Download, Trash2, Search, RefreshCw, AlertCircle, AlertTriangle, History, GitCompare, File, ArrowRight, ChevronLeft, ChevronRight, X, MousePointer, Zap } from 'lucide-react';

// PDF Export utility using jsPDF
const exportComparisonToPDF = async (comparison, API_BASE_URL) => {
  // Dynamically load jsPDF from CDN
  if (!window.jspdf) {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    await new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - (2 * margin);
  let yPosition = margin;

  // Helper function to add text with word wrap
  const addText = (text, fontSize = 10, isBold = false, color = [0, 0, 0]) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(...color);
    
    const lines = doc.splitTextToSize(text, maxWidth);
    
    lines.forEach(line => {
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += fontSize * 0.5;
    });
    
    yPosition += 3;
  };

  // Helper function to add a section header
  const addSection = (title) => {
    yPosition += 5;
    doc.setFillColor(59, 130, 246); // Blue background
    doc.rect(margin, yPosition - 5, maxWidth, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin + 2, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += 10;
  };

  // Fetch full comparison data
  let fullData = comparison;
  try {
    const response = await fetch(`${API_BASE_URL}/service-plus/comparison/${comparison.id}`);
    if (response.ok) {
      fullData = await response.json();
    }
  } catch (err) {
    console.error('Could not fetch full data:', err);
  }

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235); // Blue
  doc.text('Document Comparison Report', margin, yPosition);
  yPosition += 10;

  // Comparison ID and Date
  addText(`Comparison ID: #${fullData.id}`, 10, true);
  addText(`Generated: ${new Date().toLocaleString()}`, 9);
  addText(`Compared: ${new Date(fullData.compared_at).toLocaleString()}`, 9);
  yPosition += 5;

  // Documents Section
  addSection('Documents Compared');
  addText(`Document 1: ${fullData.doc1_name || 'Unknown'}`, 10, true);
  addText(`Document 2: ${fullData.doc2_name || 'Unknown'}`, 10, true);

  // Analysis Type
  addSection('Analysis Information');
  const analysisType = fullData.comparison_type === 'advanced-gemini' ? 'AI-Powered Analysis' : 'Basic Comparison';
  addText(`Type: ${analysisType}`, 10);
  addText(`Status: ${fullData.status || 'Completed'}`, 10);

  // Similarity Score
  if (fullData.similarity_score !== undefined) {
    addSection('Similarity Score');
    const score = (fullData.similarity_score * 100).toFixed(1);
    addText(`Overall Similarity: ${score}%`, 11, true, [37, 99, 235]);
    
    // Draw similarity bar
    const barWidth = maxWidth * 0.7;
    const barHeight = 8;
    doc.setFillColor(229, 231, 235); // Gray background
    doc.rect(margin, yPosition, barWidth, barHeight, 'F');
    doc.setFillColor(37, 99, 235); // Blue fill
    doc.rect(margin, yPosition, barWidth * (fullData.similarity_score), barHeight, 'F');
    yPosition += barHeight + 8;
  }

  // AI Analysis Summary
  if (fullData.gemini_summary) {
    addSection('AI Analysis Summary');
    addText(fullData.gemini_summary, 9);
  }

  // Key Differences
  if (fullData.key_differences && fullData.key_differences.length > 0) {
    addSection(`Key Changes (${fullData.key_differences.length})`);
    fullData.key_differences.forEach((diff, index) => {
      if (yPosition > pageHeight - margin - 20) {
        doc.addPage();
        yPosition = margin;
      }
      
      // Bullet point
      doc.setFillColor(251, 191, 36); // Yellow
      doc.circle(margin + 2, yPosition - 1.5, 1.5, 'F');
      
      // Difference text
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(diff, maxWidth - 8);
      lines.forEach(line => {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin + 6, yPosition);
        yPosition += 4.5;
      });
      yPosition += 2;
    });
  }

  // Detailed Differences
  if (fullData.differences && fullData.differences.length > 0) {
    addSection('Detailed Line-by-Line Changes');
    fullData.differences.slice(0, 50).forEach((diff, index) => {
      if (yPosition > pageHeight - margin - 30) {
        doc.addPage();
        yPosition = margin;
      }
      
      addText(`Change ${index + 1}:`, 9, true);
      if (diff.type) addText(`Type: ${diff.type}`, 8);
      if (diff.before) addText(`Before: ${diff.before}`, 8, false, [220, 38, 38]);
      if (diff.after) addText(`After: ${diff.after}`, 8, false, [22, 163, 74]);
      yPosition += 2;
    });
    
    if (fullData.differences.length > 50) {
      addText(`... and ${fullData.differences.length - 50} more changes`, 8, true);
    }
  }

  // Footer on last page
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} of ${pageCount} | Generated by Service+ Document Comparison`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Save the PDF
  const fileName = `comparison-${fullData.id}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

const ComparisonHistory = ({ onStatsUpdate, backendHealth }) => {
  const [comparisons, setComparisons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedComparison, setSelectedComparison] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filterType, setFilterType] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(null);

  const API_BASE_URL = window.API_BASE_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '/api');

  // Fetch comparison history
  const fetchComparisons = useCallback(async (page = 1, type = 'all', showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '10',
        ...(type !== 'all' && { type })
      });

      const response = await fetch(`${API_BASE_URL}/service-plus/comparisons?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setComparisons([]);
          setTotalPages(1);
          setTotalCount(0);
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setComparisons(data.comparisons || []);
      setTotalPages(data.pagination?.total_pages || 1);
      setTotalCount(data.pagination?.total_count || 0);
      
      if (onStatsUpdate && data.comparisons) {
        const today = new Date();
        const todayComparisons = data.comparisons.filter(comp => {
          if (!comp.compared_at) return false;
          const compDate = new Date(comp.compared_at);
          return compDate.toDateString() === today.toDateString();
        }).length;

        const avgSimilarity = data.comparisons.length > 0
          ? Math.round(data.comparisons.reduce((sum, comp) => sum + (comp.similarity_score || 0), 0) / data.comparisons.length * 100)
          : 0;

        onStatsUpdate(prev => ({
          ...prev,
          totalComparisons: data.pagination?.total_count || 0,
          todayComparisons,
          avgSimilarity
        }));
      }
    } catch (err) {
      console.error('Error fetching comparisons:', err);
      setError(err.message || 'Failed to load comparison history');
      setComparisons([]);
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  }, [API_BASE_URL, onStatsUpdate]);

  const fetchComparisonDetails = async (comparisonId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/service-plus/comparison/${comparisonId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setSelectedComparison(data);
    } catch (err) {
      console.error('Error fetching comparison details:', err);
      setError('Failed to load comparison details');
    }
  };

  const deleteComparison = async (comparisonId) => {
    const comparison = comparisons.find(c => c.id === comparisonId);
    const confirmMessage = `Are you sure you want to delete the comparison between "${comparison?.doc1_name}" and "${comparison?.doc2_name}"? This action cannot be undone.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/service-plus/comparison/${comparisonId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      await fetchComparisons(currentPage, filterType, false);
      setSelectedComparison(null);
    } catch (err) {
      console.error('Error deleting comparison:', err);
      setError('Failed to delete comparison');
    }
  };

  const handleExportPDF = async (comparison, event) => {
    event.stopPropagation();
    setExportingPDF(comparison.id);
    
    try {
      await exportComparisonToPDF(comparison, API_BASE_URL);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExportingPDF(null);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchComparisons(currentPage, filterType, false);
  };

  useEffect(() => {
    fetchComparisons(currentPage, filterType);
  }, [currentPage, filterType, fetchComparisons]);

  const filteredComparisons = comparisons.filter(comparison => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      comparison.doc1_name?.toLowerCase().includes(query) ||
      comparison.doc2_name?.toLowerCase().includes(query) ||
      comparison.comparison_type?.toLowerCase().includes(query) ||
      comparison.id?.toString().includes(query)
    );
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSimilarityBadgeColor = (score) => {
    if (!score) return 'bg-gray-100 text-gray-700';
    const percentage = score * 100;
    if (percentage >= 90) return 'bg-green-100 text-green-800';
    if (percentage >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading && comparisons.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading comparison history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {!backendHealth?.service_plus_available && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle size={20} className="text-amber-600" />
            <div>
              <h4 className="font-medium text-amber-800">Service+ Backend Status</h4>
              <p className="text-sm text-amber-700">
                History loading may be limited. Ensure the Service+ backend is running properly.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search comparisons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="advanced-gemini">AI Analysis</option>
            <option value="basic">Basic Comparison</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            {totalCount} comparison{totalCount !== 1 ? 's' : ''} total
          </span>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle size={20} className="text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {filteredComparisons.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <History size={48} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'No Matching Comparisons' : 'No Comparisons Found'}
              </h3>
              <p className="text-gray-600">
                {searchQuery 
                  ? 'Try adjusting your search terms or filters.' 
                  : 'Start by comparing documents to see your history here.'
                }
              </p>
            </div>
          ) : (
            <>
              {filteredComparisons.map((comparison) => (
                <div
                  key={comparison.id}
                  className={`bg-white rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md ${
                    selectedComparison?.id === comparison.id 
                      ? 'ring-2 ring-blue-500 border-blue-500 shadow-md' 
                      : 'border-gray-200 hover:border-blue-500'
                  }`}
                  onClick={() => fetchComparisonDetails(comparison.id)}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <GitCompare size={16} className="text-blue-600" />
                          <span className="text-sm font-medium text-gray-900">
                            Comparison #{comparison.id}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            comparison.comparison_type === 'advanced-gemini' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {comparison.comparison_type === 'advanced-gemini' ? 'AI Analysis' : 'Basic'}
                          </span>
                          {comparison.similarity_score !== undefined && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSimilarityBadgeColor(comparison.similarity_score)}`}>
                              {(comparison.similarity_score * 100).toFixed(0)}% similar
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center space-x-2">
                            <File size={14} className="text-blue-600 flex-shrink-0" />
                            <span className="text-gray-900 truncate">
                              {comparison.doc1_name || 'Document 1'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <ArrowRight size={14} className="text-gray-400 flex-shrink-0" />
                            <span className="text-gray-900 truncate">
                              {comparison.doc2_name || 'Document 2'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-gray-600">
                            {formatDate(comparison.compared_at)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 ml-4">
                        <button
                          onClick={(e) => handleExportPDF(comparison, e)}
                          disabled={exportingPDF === comparison.id}
                          className="p-2 text-gray-600 hover:text-red-600 transition-colors disabled:opacity-50 relative"
                          title="Export as PDF"
                        >
                          {exportingPDF === comparison.id ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <FileText size={16} />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteComparison(comparison.id);
                          }}
                          className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-gray-600">
                Showing {Math.min((currentPage - 1) * 10 + 1, totalCount)} to {Math.min(currentPage * 10, totalCount)} of {totalCount} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center space-x-1"
                >
                  <ChevronLeft size={14} />
                  <span>Previous</span>
                </button>
                
                <span className="text-sm text-gray-600 px-3">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center space-x-1"
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          {selectedComparison ? (
            <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Comparison #{selectedComparison.id}
                </h3>
                <button
                  onClick={() => setSelectedComparison(null)}
                  className="p-1 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Documents</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <File size={14} className="text-blue-600" />
                      <span className="truncate">{selectedComparison.doc1_name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <File size={14} className="text-green-600" />
                      <span className="truncate">{selectedComparison.doc2_name}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <button
                    onClick={() => handleExportPDF(selectedComparison, { stopPropagation: () => {} })}
                    disabled={exportingPDF === selectedComparison.id}
                    className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
                  >
                    {exportingPDF === selectedComparison.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Generating PDF...</span>
                      </>
                    ) : (
                      <>
                        <FileText size={14} />
                        <span>Export as PDF</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center sticky top-24">
              <MousePointer size={32} className="text-gray-400 mx-auto mb-3" />
              <h4 className="font-medium text-gray-900 mb-2">Select a Comparison</h4>
              <p className="text-gray-600 text-sm">
                Click on a comparison from the list to view detailed results.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComparisonHistory;