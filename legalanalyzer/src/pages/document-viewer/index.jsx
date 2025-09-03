// legalanalyzer/src/pages/document-viewer/index.jsx - Enhanced with microservice analysis results
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import GlobalHeader from 'components/ui/GlobalHeader';
import BreadcrumbTrail from 'components/ui/BreadcrumbTrail';
import Icon from 'components/AppIcon';
import { getDocumentById } from '../../api';

const DocumentViewer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(location.search);
  const id = urlParams.get('doc');
  const viewMode = urlParams.get('view'); // 'analysis' for enhanced view
  
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [selectedText, setSelectedText] = useState('');
  const [showAnnotationMenu, setShowAnnotationMenu] = useState(false);
  const [annotations, setAnnotations] = useState([]);
  const [activeAnnotationTool, setActiveAnnotationTool] = useState(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [activeContentView, setActiveContentView] = useState('document'); // 'document', 'summary', 'analysis'
  
  const viewerRef = useRef(null);
  const annotationMenuRef = useRef(null);

  const mockVersionHistory = [
    { version: "1.3", date: "2024-01-15", user: "Sarah Johnson", changes: "Final execution version" },
    { version: "1.2", date: "2024-01-12", user: "Michael Chen", changes: "Updated insurance requirements" },
    { version: "1.1", date: "2024-01-10", user: "Legal Team", changes: "Added security deposit clause" },
    { version: "1.0", date: "2024-01-08", user: "Sarah Johnson", changes: "Initial draft" }
  ];

  useEffect(() => {
    if (!id) return;
    
    const fetchDocuments = async () => {
      try {
        const doc = await getDocumentById(id);
        setSelectedDocument({
          ...doc,
          type: doc.type
            ? doc.type === 'auto'
              ? 'Auto-detect'
              : doc.type
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')
            : 'Unknown',
          fileExtension: doc.fileExtension || 'Unknown',
          hasAdvancedAnalysis: doc.status === 'Analyzed' && (doc.summary || doc.analysisResult),
          // file size formatting
          size: doc.size
            ? doc.size < 1024
              ? `${doc.size} B`
              : doc.size < 1024 * 1024
                ? `${(doc.size / 1024).toFixed(2)} KB`
                : `${(doc.size / (1024 * 1024)).toFixed(2)} MB`
            : 'Unknown',            
        });

        // If view=analysis is specified, switch to analysis view if available
        if (viewMode === 'analysis' && doc.status === 'Analyzed') {
          setActiveContentView('analysis');
        }
      } catch (error) {
        navigate('/dashboard');
      }
    };
    
    fetchDocuments();
  }, [id, navigate, viewMode]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (annotationMenuRef.current && !annotationMenuRef.current.contains(event.target)) {
        setShowAnnotationMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection.toString().trim()) {
      setSelectedText(selection.toString());
      setShowAnnotationMenu(true);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (term && selectedDocument) {
      const content = selectedDocument.content.toLowerCase();
      const searchTerm = term.toLowerCase();
      const matches = [];
      let index = content.indexOf(searchTerm);
      while (index !== -1) {
        matches.push(index);
        index = content.indexOf(searchTerm, index + 1);
      }
      setSearchResults(matches);
      setCurrentSearchIndex(0);
    } else {
      setSearchResults([]);
    }
  };

  const navigateSearch = (direction) => {
    if (searchResults.length === 0) return;
    if (direction === 'next') {
      setCurrentSearchIndex((prev) => (prev + 1) % searchResults.length);
    } else {
      setCurrentSearchIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
    }
  };

  const addAnnotation = (type, color = '#ffeb3b') => {
    if (!selectedText) return;
    const newAnnotation = {
      id: Date.now(),
      text: selectedText,
      type,
      color,
      timestamp: new Date(),
      user: 'John Doe',
      comment: ''
    };
    setAnnotations([...annotations, newAnnotation]);
    setShowAnnotationMenu(false);
    setSelectedText('');
  };

  const zoomIn = () => setZoomLevel(prev => Math.min(prev + 25, 200));
  const zoomOut = () => setZoomLevel(prev => Math.max(prev - 25, 50));
  const resetZoom = () => setZoomLevel(100);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      viewerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const exportDocument = (format) => {
    console.log(`Exporting document as ${format}`);
  };

  const renderAnalysisSidebar = () => {
    if (!selectedDocument?.extractedInfo) return null;

    return (
      <div className="p-4 space-y-6 overflow-y-auto h-full">
        {/* Document Classification */}
        <div>
          <h3 className="font-medium text-text-primary mb-3 flex items-center space-x-2">
            <Icon name="Tag" size={16} />
            <span>Classification</span>
          </h3>
          <div className="space-y-2">
            <div className="p-3 bg-primary/5 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{selectedDocument.type}</span>
                <span className="text-xs text-success">
                  {selectedDocument.hasAdvancedAnalysis ? '95%' : '85%'}
                </span>
              </div>
              <p className="text-xs text-text-secondary">
                {selectedDocument.hasAdvancedAnalysis ? 'AI-powered classification' : 'Pattern-based classification'}
              </p>
            </div>
          </div>
        </div>

        {/* Key Parties */}
        <div>
          <h3 className="font-medium text-text-primary mb-3 flex items-center space-x-2">
            <Icon name="Users" size={16} />
            <span>Parties</span>
          </h3>
          <div className="space-y-2">
            {selectedDocument.extractedInfo.parties?.length > 0 ? (
              selectedDocument.extractedInfo.parties.map((party, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium text-sm text-text-primary">{party.name}</div>
                  <div className="text-xs text-text-secondary">{party.role} • {party.type}</div>
                </div>
              ))
            ) : (
              <p className="text-sm text-text-secondary">No parties identified</p>
            )}
          </div>
        </div>

        {/* Key Dates */}
        <div>
          <h3 className="font-medium text-text-primary mb-3 flex items-center space-x-2">
            <Icon name="Calendar" size={16} />
            <span>Key Dates</span>
          </h3>
          <div className="space-y-2">
            {selectedDocument.extractedInfo.keyDates?.length > 0 ? (
              selectedDocument.extractedInfo.keyDates.map((date, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm text-text-primary">{date.description}</div>
                    <div className="text-xs text-text-secondary">{date.date}</div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-text-secondary">No key dates identified</p>
            )}
          </div>
        </div>

        {/* Financial Terms */}
        <div>
          <h3 className="font-medium text-text-primary mb-3 flex items-center space-x-2">
            <Icon name="DollarSign" size={16} />
            <span>Financial Terms</span>
          </h3>
          <div className="space-y-2">
            {selectedDocument.extractedInfo.financialTerms?.length > 0 ? (
              selectedDocument.extractedInfo.financialTerms.map((term, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-text-primary">{term.term}</span>
                  <span className="font-medium text-sm text-primary">{term.amount}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-text-secondary">No financial terms identified</p>
            )}
          </div>
        </div>

        {/* Risk Assessment */}
        <div>
          <h3 className="font-medium text-text-primary mb-3 flex items-center space-x-2">
            <Icon name="AlertTriangle" size={16} />
            <span>Risk Assessment</span>
          </h3>
          <div className="space-y-2">
            <div className="p-3 bg-warning/5 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">Overall Risk</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  selectedDocument.extractedInfo.riskAssessment?.overall === 'High' ? 'bg-error/10 text-error' :
                  selectedDocument.extractedInfo.riskAssessment?.overall === 'Medium' ? 'bg-warning/10 text-warning' : 
                  'bg-success/10 text-success'
                }`}>
                  {selectedDocument.extractedInfo.riskAssessment?.overall || 'Unknown'}
                </span>
              </div>
              <div className="space-y-1">
                {selectedDocument.extractedInfo.riskAssessment?.factors?.map((factor, index) => (
                  <div key={index} className="flex items-start space-x-2 text-xs">
                    <span className={`px-1 rounded font-medium ${
                      factor.risk === 'High' ? 'bg-error/20 text-error' :
                      factor.risk === 'Medium' ? 'bg-warning/20 text-warning' : 
                      'bg-success/20 text-success'
                    }`}>
                      {factor.risk}
                    </span>
                    <span className="text-text-secondary">{factor.factor}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AI Analysis Summary - Only show if advanced analysis was used */}
        {selectedDocument.hasAdvancedAnalysis && (
          <div>
            <h3 className="font-medium text-text-primary mb-3 flex items-center space-x-2">
              <Icon name="Zap" size={16} />
              <span>AI Insights</span>
            </h3>
            <div className="space-y-2">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Icon name="Brain" size={14} className="text-blue-600" />
                  <span className="text-xs font-medium text-blue-800">Advanced Analysis Applied</span>
                </div>
                <p className="text-xs text-blue-700">
                  This document was processed using our AI-powered legal analysis microservice for enhanced accuracy.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Annotations */}
        <div>
          <h3 className="font-medium text-text-primary mb-3 flex items-center space-x-2">
            <Icon name="MessageSquare" size={16} />
            <span>Annotations ({annotations.length})</span>
          </h3>
          <div className="space-y-2">
            {annotations.length === 0 ? (
              <p className="text-sm text-text-secondary">No annotations yet</p>
            ) : (
              annotations.map((annotation) => (
                <div key={annotation.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: annotation.color }}
                    />
                    <span className="text-xs font-medium text-text-primary">{annotation.type}</span>
                  </div>
                  <p className="text-sm text-text-secondary mb-1">"{annotation.text}"</p>
                  <p className="text-xs text-text-secondary">by {annotation.user}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderDocumentContent = () => {
    switch (activeContentView) {
      case 'summary':
        return (
          <div className="p-8 max-w-4xl mx-auto">
            <div className="bg-white shadow-lg rounded-lg p-8">
              <h2 className="text-2xl font-bold text-text-primary mb-6">Document Summary</h2>
              
              {selectedDocument.summary && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-text-primary mb-3">Summary</h3>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-text-secondary leading-relaxed">{selectedDocument.summary}</p>
                  </div>
                </div>
              )}

              {selectedDocument.aiSummary && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center space-x-2">
                    <Icon name="Zap" size={20} className="text-primary" />
                    <span>AI-Generated Summary</span>
                  </h3>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-text-secondary leading-relaxed">{selectedDocument.aiSummary}</p>
                  </div>
                </div>
              )}

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-text-primary mb-3">Document Information</h3>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="font-medium text-text-primary">Document Type</dt>
                    <dd className="text-text-secondary">{selectedDocument.type}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-text-primary">Status</dt>
                    <dd className="text-text-secondary">{selectedDocument.status}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-text-primary">Upload Date</dt>
                    <dd className="text-text-secondary">
                      {selectedDocument.uploadedAt ? new Date(selectedDocument.uploadedAt).toLocaleDateString() : 'Unknown'}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-text-primary">File Size</dt>
                    <dd className="text-text-secondary">{selectedDocument.size}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        );

      case 'analysis':
        return (
          <div className="p-8 max-w-4xl mx-auto">
            <div className="bg-white shadow-lg rounded-lg p-8">
              <div className="flex items-center space-x-2 mb-6">
                <Icon name="BarChart3" size={24} className="text-primary" />
                <h2 className="text-2xl font-bold text-text-primary">Advanced Analysis Results</h2>
              </div>

              {selectedDocument.hasAdvancedAnalysis ? (
                <div className="space-y-8">
                  {/* Analysis Summary */}
                  {selectedDocument.summary && (
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary mb-3">Analysis Summary</h3>
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-text-secondary leading-relaxed">{selectedDocument.summary}</p>
                      </div>
                    </div>
                  )}

                  {/* AI Summary */}
                  {selectedDocument.aiSummary && (
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center space-x-2">
                        <Icon name="Brain" size={20} className="text-primary" />
                        <span>AI-Generated Summary</span>
                      </h3>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-text-secondary leading-relaxed">{selectedDocument.aiSummary}</p>
                      </div>
                    </div>
                  )}

                  {/* Key Insights */}
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-3">Key Insights</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-text-primary mb-2">Parties Identified</h4>
                        <p className="text-sm text-text-secondary">
                          {selectedDocument.extractedInfo?.parties?.length || 0} parties detected
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-text-primary mb-2">Financial Terms</h4>
                        <p className="text-sm text-text-secondary">
                          {selectedDocument.extractedInfo?.financialTerms?.length || 0} terms identified
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-text-primary mb-2">Key Dates</h4>
                        <p className="text-sm text-text-secondary">
                          {selectedDocument.extractedInfo?.keyDates?.length || 0} dates extracted
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-text-primary mb-2">Risk Level</h4>
                        <p className={`text-sm font-medium ${
                          selectedDocument.extractedInfo?.riskAssessment?.overall === 'High' ? 'text-error' :
                          selectedDocument.extractedInfo?.riskAssessment?.overall === 'Medium' ? 'text-warning' : 
                          'text-success'
                        }`}>
                          {selectedDocument.extractedInfo?.riskAssessment?.overall || 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Analysis Details */}
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-3">Analysis Metadata</h3>
                    <dl className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <dt className="font-medium text-text-primary">Analysis Type</dt>
                        <dd className="text-text-secondary">Advanced AI Analysis</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-text-primary">Processing Duration</dt>
                        <dd className="text-text-secondary">
                          {selectedDocument.analysisDuration ? 
                            `${Math.round(selectedDocument.analysisDuration / 1000)}s` : 
                            'Unknown'
                          }
                        </dd>
                      </div>
                      <div>
                        <dt className="font-medium text-text-primary">Confidence Score</dt>
                        <dd className="text-text-secondary">95%</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-text-primary">Analysis Status</dt>
                        <dd className="text-success">Complete</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Icon name="AlertCircle" size={48} className="text-text-secondary mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-text-primary mb-2">No Advanced Analysis Available</h3>
                  <p className="text-text-secondary mb-4">
                    This document was processed with basic analysis only.
                  </p>
                  <button 
                    onClick={() => setActiveContentView('document')}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Document
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      default: // 'document'
        return (
          <div className={`mx-auto bg-white shadow-lg ${comparisonMode ? 'max-w-none' : 'max-w-4xl'}`}>
            {comparisonMode ? (
              <div className="flex">
                <div className="w-1/2 border-r border-border-light">
                  <div className="p-6 border-b border-border-light bg-gray-50">
                    <h3 className="font-medium text-text-primary">Current Version (v1.3)</h3>
                  </div>
                  <div
                    className="p-8 font-mono text-sm leading-relaxed"
                    style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}
                  >
                    <pre className="whitespace-pre-wrap">{selectedDocument.content}</pre>
                  </div>
                </div>
                <div className="w-1/2">
                  <div className="p-6 border-b border-border-light bg-gray-50">
                    <h3 className="font-medium text-text-primary">Previous Version (v1.2)</h3>
                  </div>
                  <div
                    className="p-8 font-mono text-sm leading-relaxed"
                    style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}
                  >
                    <pre className="whitespace-pre-wrap">
                      {selectedDocument.content.replace('$25,000', '$24,000').replace('$2,000,000', '$1,500,000')}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="p-8 font-mono text-sm leading-relaxed"
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}
              >
                <pre className="whitespace-pre-wrap">{selectedDocument.content}</pre>
              </div>
            )}
          </div>
        );
    }
  };

  if (!selectedDocument) {
    return (
      <div className="min-h-screen bg-background">
        <GlobalHeader />
        <div className="pt-16 px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Icon name="FileX" size={48} className="text-text-secondary mx-auto mb-4" />
              <p className="text-text-secondary">Document not found</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      
      <div className="pt-16">
        <div className="px-6 py-4 bg-surface border-b border-border-light">
          <BreadcrumbTrail />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-heading font-semibold text-text-primary">
                {selectedDocument.title}
              </h1>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                selectedDocument.status === 'Analyzed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
              }`}>
                {selectedDocument.status}
              </span>
              {selectedDocument.hasAdvancedAnalysis && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  AI Analyzed
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* Content View Toggle */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveContentView('document')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    activeContentView === 'document' 
                      ? 'bg-white text-text-primary shadow-sm' 
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Document
                </button>
                <button
                  onClick={() => setActiveContentView('summary')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    activeContentView === 'summary' 
                      ? 'bg-white text-text-primary shadow-sm' 
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Summary
                </button>
                {selectedDocument.hasAdvancedAnalysis && (
                  <button
                    onClick={() => setActiveContentView('analysis')}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      activeContentView === 'analysis' 
                        ? 'bg-white text-text-primary shadow-sm' 
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Analysis
                  </button>
                )}
              </div>

              {/* Version History */}
              <div className="relative">
                <button
                  onClick={() => setShowVersionHistory(!showVersionHistory)}
                  className="flex items-center space-x-2 px-4 py-2 bg-surface border border-border-light rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Icon name="History" size={16} />
                  <span className="text-sm">Version 1.3</span>
                  <Icon name="ChevronDown" size={14} />
                </button>
                {showVersionHistory && (
                  <div className="absolute right-0 mt-2 w-80 bg-surface rounded-lg shadow-lg border border-border-light z-50">
                    <div className="p-4">
                      <h3 className="font-medium text-text-primary mb-3">Version History</h3>
                      <div className="space-y-3">
                        {mockVersionHistory.map((version) => (
                          <div key={version.version} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <Icon name="FileText" size={14} className="text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-sm">v{version.version}</span>
                                <span className="text-xs text-text-secondary">{version.date}</span>
                              </div>
                              <p className="text-sm text-text-secondary">{version.changes}</p>
                              <p className="text-xs text-text-secondary">by {version.user}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Comparison Mode Toggle */}
              <button
                onClick={() => setComparisonMode(!comparisonMode)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  comparisonMode
                    ? 'bg-primary text-white border-primary' 
                    : 'bg-surface border-border-light hover:bg-gray-50'
                }`}
              >
                <Icon name="GitCompare" size={16} />
              </button>

              {/* Export Menu */}
              <div className="relative">
                <button className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Icon name="Download" size={16} />
                  <span className="text-sm">Export</span>
                  <Icon name="ChevronDown" size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(100vh-140px)]">
          {/* Analysis Sidebar */}
          <div className={`bg-surface border-r border-border-light transition-all duration-300 ${
            sidebarCollapsed ? 'w-12' : 'w-80'
          }`}>
            <div className="p-4 border-b border-border-light">
              <div className="flex items-center justify-between">
                {!sidebarCollapsed && (
                  <h2 className="font-heading font-semibold text-text-primary">Analysis</h2>
                )}
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Icon name={sidebarCollapsed ? "ChevronRight" : "ChevronLeft"} size={16} />
                </button>
              </div>
            </div>
            {!sidebarCollapsed && renderAnalysisSidebar()}
          </div>

          {/* Document Viewer */}
          <div className="flex-1 flex flex-col">
            {/* Viewer Toolbar - Only show for document view */}
            {activeContentView === 'document' && (
              <div className="p-4 bg-surface border-b border-border-light">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Search */}
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <Icon name="Search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
                        <input
                          type="text"
                          placeholder="Search in document..."
                          value={searchTerm}
                          onChange={(e) => handleSearch(e.target.value)}
                          className="pl-10 pr-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-sm w-64"
                        />
                      </div>
                      {searchResults.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-text-secondary">
                            {currentSearchIndex + 1} of {searchResults.length}
                          </span>
                          <button
                            onClick={() => navigateSearch('prev')}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Icon name="ChevronUp" size={16} />
                          </button>
                          <button
                            onClick={() => navigateSearch('next')}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Icon name="ChevronDown" size={16} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Annotation Tools */}
                    <div className="flex items-center space-x-2 border-l border-border-light pl-4">
                      <button
                        onClick={() => setActiveAnnotationTool('highlight')}
                        className={`p-2 rounded-lg transition-colors ${
                          activeAnnotationTool === 'highlight' ? 'bg-yellow-100 text-yellow-700' : 'hover:bg-gray-100'
                        }`}
                        title="Highlight"
                      >
                        <Icon name="Highlighter" size={16} />
                      </button>
                      <button
                        onClick={() => setActiveAnnotationTool('comment')}
                        className={`p-2 rounded-lg transition-colors ${
                          activeAnnotationTool === 'comment' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                        }`}
                        title="Comment"
                      >
                        <Icon name="MessageSquare" size={16} />
                      </button>
                      <button
                        onClick={() => setActiveAnnotationTool('tag')}
                        className={`p-2 rounded-lg transition-colors ${
                          activeAnnotationTool === 'tag' ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100'
                        }`}
                        title="Tag"
                      >
                        <Icon name="Tag" size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Zoom Controls */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={zoomOut}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Zoom Out"
                      >
                        <Icon name="ZoomOut" size={16} />
                      </button>
                      <span className="text-sm text-text-secondary w-12 text-center">{zoomLevel}%</span>
                      <button
                        onClick={zoomIn}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Zoom In"
                      >
                        <Icon name="ZoomIn" size={16} />
                      </button>
                      <button
                        onClick={resetZoom}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-xs"
                        title="Reset Zoom"
                      >
                        Reset
                      </button>
                    </div>

                    {/* Page Navigation */}
                    <div className="flex items-center space-x-2 border-l border-border-light pl-4">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Icon name="ChevronLeft" size={16} />
                      </button>
                      <span className="text-sm text-text-secondary">
                        Page {currentPage} of {selectedDocument.pages || 1}
                      </span>
                      <button
                        onClick={() => setCurrentPage(Math.min(selectedDocument.pages || 1, currentPage + 1))}
                        disabled={currentPage === selectedDocument.pages}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Icon name="ChevronRight" size={16} />
                      </button>
                    </div>

                    {/* Fullscreen */}
                    <button
                      onClick={toggleFullscreen}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Fullscreen"
                    >
                      <Icon name={isFullscreen ? "Minimize2" : "Maximize2"} size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Document Content */}
            <div
              ref={viewerRef}
              className="flex-1 overflow-auto bg-gray-100 p-8"
              onMouseUp={handleTextSelection}
            >
              {renderDocumentContent()}
            </div>

            {/* Annotation Context Menu */}
            {showAnnotationMenu && selectedText && (
              <div
                ref={annotationMenuRef}
                className="fixed bg-surface border border-border-light rounded-lg shadow-lg z-50 p-2"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => addAnnotation('Highlight', '#ffeb3b')}
                    className="flex items-center space-x-2 px-3 py-2 hover:bg-yellow-50 rounded-lg transition-colors"
                  >
                    <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                    <span className="text-sm">Highlight</span>
                  </button>
                  <button
                    onClick={() => addAnnotation('Important', '#ff9800')}
                    className="flex items-center space-x-2 px-3 py-2 hover:bg-orange-50 rounded-lg transition-colors"
                  >
                    <div className="w-3 h-3 bg-orange-400 rounded-full" />
                    <span className="text-sm">Important</span>
                  </button>
                  <button
                    onClick={() => addAnnotation('Question', '#2196f3')}
                    className="flex items-center space-x-2 px-3 py-2 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <div className="w-3 h-3 bg-blue-400 rounded-full" />
                    <span className="text-sm">Question</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;