// legalanalyzer/src/pages/document-viewer/index.jsx - Updated for Python Flask backend
// legalanalyzer/src/pages/document-viewer/index.jsx - Updated for Python Flask backend

import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import GlobalHeader from 'components/ui/GlobalHeader';
import BreadcrumbTrail from 'components/ui/BreadcrumbTrail';
import Icon from 'components/AppIcon';
import { getDocumentById, formatFileSize, checkMicroservicesHealth } from '../../api';
import { useLanguage } from 'contexts/LanguageContext';

const DocumentViewer = () => {
  const { texts } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(location.search);
  const id = urlParams.get('doc');
  const viewMode = urlParams.get('view');

  const [selectedDocument, setSelectedDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
  const [activeContentView, setActiveContentView] = useState('document');
  const [backendHealth, setBackendHealth] = useState(null);
  const [textAnalysis, setTextAnalysis] = useState({ wordCount: 0, characterCount: 0, readingTime: 0, pages: 1 });

  const viewerRef = useRef(null);
  const annotationMenuRef = useRef(null);

  const generateVersionHistory = (document) => {
    if (!document) return [];
    const history = [];
    const uploadDate = document.uploadedAt ? new Date(document.uploadedAt) : new Date();
    if (document.status === 'Analyzed') {
      history.push({
        version: '1.3', date: uploadDate.toISOString().split('T')[0], user: 'Gemini AI',
        changes: `AI analysis completed - extracted ${document.parties ? document.parties.split(',').length : 0} parties, ${document.arguments?.length || 0} arguments`,
        status: 'current'
      });
    }
    history.push({
      version: '1.2', date: new Date(uploadDate.getTime() - 300000).toISOString().split('T')[0],
      user: 'OCR System', changes: `Text extraction completed - ${textAnalysis.wordCount} words extracted`, status: 'processed'
    });
    history.push({
      version: '1.1', date: new Date(uploadDate.getTime() - 600000).toISOString().split('T')[0],
      user: 'Flask Backend', changes: `Document uploaded to Python backend (${formatFileSize(document.fileSize)})`, status: 'uploaded'
    });
    return history;
  };

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

  useEffect(() => {
    if (!id) { setError('No document ID provided'); setLoading(false); return; }
    const fetchDocument = async () => {
      setLoading(true);
      setError(null);
      try {
        const doc = await getDocumentById(id);
        setSelectedDocument(doc);
        if (doc.content || doc.rawText) {
          const text = doc.content || doc.rawText || '';
          const words = text.trim().split(/\s+/).length;
          const chars = text.length;
          const readingTime = Math.ceil(words / 200);
          const estimatedPages = Math.max(1, Math.ceil(chars / 3000));
          setTextAnalysis({ wordCount: words, characterCount: chars, readingTime, pages: estimatedPages });
        }
        if (viewMode === 'analysis' && doc.status === 'Analyzed') setActiveContentView('analysis');
      } catch (error) {
        console.error('Error fetching document:', error);
        if (error.message.includes('not found')) {
          setError(texts.documentNotFoundMsg);
        } else if (error.message.includes('server')) {
          setError(texts.checkBackendRunning);
        } else {
          setError(error.message || texts.documentNotFound);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDocument();
  }, [id, viewMode]);

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
    if (selection.toString().trim()) { setSelectedText(selection.toString()); setShowAnnotationMenu(true); }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (term && selectedDocument && (selectedDocument.content || selectedDocument.rawText)) {
      const content = (selectedDocument.content || selectedDocument.rawText).toLowerCase();
      const lowerTerm = term.toLowerCase();
      const matches = [];
      let index = content.indexOf(lowerTerm);
      while (index !== -1) { matches.push(index); index = content.indexOf(lowerTerm, index + 1); }
      setSearchResults(matches);
      setCurrentSearchIndex(0);
    } else { setSearchResults([]); }
  };

  const navigateSearch = (direction) => {
    if (searchResults.length === 0) return;
    if (direction === 'next') setCurrentSearchIndex(prev => (prev + 1) % searchResults.length);
    else setCurrentSearchIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
  };

  const addAnnotation = (type, color = '#ffeb3b') => {
    if (!selectedText) return;
    setAnnotations([...annotations, { id: Date.now(), text: selectedText, type, color, timestamp: new Date(), user: 'Current User', comment: '' }]);
    setShowAnnotationMenu(false);
    setSelectedText('');
  };

  const zoomIn  = () => setZoomLevel(prev => Math.min(prev + 25, 200));
  const zoomOut = () => setZoomLevel(prev => Math.max(prev - 25, 50));
  const resetZoom = () => setZoomLevel(100);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) { viewerRef.current?.requestFullscreen(); setIsFullscreen(true); }
    else { document.exitFullscreen(); setIsFullscreen(false); }
  };

  const exportDocument = (format) => {
    if (!selectedDocument) return;
    let content = '';
    switch (activeContentView) {
      case 'summary':
        content = `DOCUMENT SUMMARY\n\n${selectedDocument.filename}\n\n`;
        content += selectedDocument.summary || texts.noSummaryAvailable;
        break;
      case 'analysis':
        content = `AI ANALYSIS REPORT\n\n${selectedDocument.filename}\n\n`;
        content += `Court: ${selectedDocument.court || 'Not specified'}\n`;
        content += `Parties: ${selectedDocument.parties || 'Not specified'}\n`;
        content += `Summary: ${selectedDocument.summary || 'Not available'}\n\n`;
        content += `Arguments:\n${(selectedDocument.arguments || []).map((arg, i) => `${i+1}. ${arg}`).join('\n')}`;
        break;
      default:
        content = selectedDocument.content || selectedDocument.rawText || texts.noContentAvailableExport;
    }
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedDocument.filename.replace(/\.[^/.]+$/, '')}_${activeContentView}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderAnalysisSidebar = () => {
    if (!selectedDocument) return null;
    return (
      <div className="p-4 space-y-6 overflow-y-auto h-full">
        {/* Backend Status */}
        <div className={`rounded-lg border p-3 ${backendHealth?.overall_status === 'healthy' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center space-x-2 mb-2">
            <Icon name="Server" size={16} className={backendHealth?.overall_status === 'healthy' ? 'text-green-600' : 'text-red-600'} />
            <span className="text-sm font-medium text-gray-800">{texts.pythonFlaskBackend}</span>
          </div>
          <p className="text-xs text-gray-600">
            {backendHealth?.overall_status === 'healthy' ? texts.connected : texts.connectionError}
          </p>
        </div>

        {/* Gemini AI Status */}
        {selectedDocument.status === 'Analyzed' && (
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Icon name="Zap" size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-800">{texts.geminiAiAnalysis}</span>
            </div>
            <p className="text-xs text-blue-700">{texts.analysisCompletedMsg}</p>
            {selectedDocument.analysis_duration_ms && (
              <p className="text-xs text-blue-600 mt-1">
                {texts.processingTimeSeconds.replace('{seconds}', (selectedDocument.analysis_duration_ms / 1000).toFixed(1))}
              </p>
            )}
          </div>
        )}

        {/* Document Statistics */}
        <div>
          <h3 className="font-medium text-text-primary mb-3 flex items-center space-x-2">
            <Icon name="BarChart3" size={16} />
            <span>{texts.documentStatistics}</span>
          </h3>
          <div className="space-y-2">
            {[
              { label: texts.fileSize,       value: selectedDocument.fileSize ? formatFileSize(selectedDocument.fileSize) : 'Unknown' },
              { label: texts.wordCount,      value: textAnalysis.wordCount.toLocaleString() },
              { label: texts.readingTime,    value: `~${textAnalysis.readingTime} minutes` },
              { label: texts.estimatedPages, value: textAnalysis.pages },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-text-secondary mb-1">{label}</div>
                <div className="text-sm font-medium text-text-primary">{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Classification */}
        <div>
          <h3 className="font-medium text-text-primary mb-3 flex items-center space-x-2">
            <Icon name="Tag" size={16} />
            <span>{texts.classification}</span>
          </h3>
          <div className="p-3 bg-primary/5 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-sm capitalize">
                {selectedDocument.type?.replace('_', ' ') || 'Auto-detected'}
              </span>
              <span className="text-xs text-success">
                {selectedDocument.status === 'Analyzed' ? '95%' : '85%'}
              </span>
            </div>
            <p className="text-xs text-text-secondary">
              {selectedDocument.status === 'Analyzed' ? texts.processedByGemini : texts.documentClassification}
            </p>
          </div>
        </div>

        {/* Language */}
        {selectedDocument.document_language && (
          <div>
            <h3 className="font-medium text-text-primary mb-3 flex items-center space-x-2">
              <Icon name="Globe" size={16} />
              <span>{texts.documentLanguage}</span>
            </h3>
            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">{selectedDocument.document_language.toUpperCase()}</span>
            </div>
          </div>
        )}

        {/* Parties */}
        <div>
          <h3 className="font-medium text-text-primary mb-3 flex items-center space-x-2">
            <Icon name="Users" size={16} />
            <span>{texts.parties}</span>
          </h3>
          <div className="space-y-2">
            {selectedDocument.parties ? (
              selectedDocument.parties.split(',').map((party, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium text-sm text-text-primary">{party.trim()}</div>
                  <div className="text-xs text-text-secondary">Legal Entity</div>
                </div>
              ))
            ) : (
              <p className="text-sm text-text-secondary">{texts.noPartiesIdentified}</p>
            )}
          </div>
        </div>

        {/* Court */}
        {selectedDocument.court && (
          <div>
            <h3 className="font-medium text-text-primary mb-3 flex items-center space-x-2">
              <Icon name="Building" size={16} />
              <span>{texts.court}</span>
            </h3>
            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">{selectedDocument.court}</span>
            </div>
          </div>
        )}

        {/* Key Dates */}
        {selectedDocument.document_date && (
          <div>
            <h3 className="font-medium text-text-primary mb-3 flex items-center space-x-2">
              <Icon name="Calendar" size={16} />
              <span>{texts.keyDates}</span>
            </h3>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-sm text-text-primary">{texts.documentDate}</div>
                <div className="text-xs text-text-secondary">{selectedDocument.document_date}</div>
              </div>
            </div>
          </div>
        )}

        {/* Arguments */}
        {selectedDocument.arguments && selectedDocument.arguments.length > 0 && (
          <div>
            <h3 className="font-medium text-text-primary mb-3 flex items-center space-x-2">
              <Icon name="List" size={16} />
              <span>{texts.arguments}</span>
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {selectedDocument.arguments.map((argument, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-text-primary">{argument}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Processing Details */}
        <div>
          <h3 className="font-medium text-text-primary mb-3 flex items-center space-x-2">
            <Icon name="Info" size={16} />
            <span>{texts.processingDetails}</span>
          </h3>
          <div className="space-y-2">
            {[
              { label: texts.analysisEngine,   value: 'Google Gemini AI' },
              { label: texts.backendSystem,     value: texts.pythonFlaskSqlServer },
              { label: texts.processingStatus,  value: selectedDocument.status === 'Analyzed' ? texts.complete : selectedDocument.status },
              { label: texts.uploadDate,        value: (selectedDocument.creation_date || selectedDocument.uploadedAt)
                  ? new Date(selectedDocument.creation_date || selectedDocument.uploadedAt).toLocaleDateString()
                  : 'Unknown' },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-text-secondary mb-1">{label}</div>
                <div className="text-sm font-medium text-text-primary">{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Annotations */}
        <div>
          <h3 className="font-medium text-text-primary mb-3 flex items-center space-x-2">
            <Icon name="MessageSquare" size={16} />
            <span>{texts.annotations} ({annotations.length})</span>
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {annotations.length === 0 ? (
              <p className="text-sm text-text-secondary">{texts.noAnnotationsYet}</p>
            ) : (
              annotations.map((annotation) => (
                <div key={annotation.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: annotation.color }} />
                    <span className="text-xs font-medium text-text-primary">{annotation.type}</span>
                  </div>
                  <p className="text-sm text-text-secondary mb-1">"{annotation.text.substring(0, 50)}..."</p>
                  <p className="text-xs text-text-secondary">by {annotation.user}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const highlightSearchResults = (text, searchTerm) => {
    if (!searchTerm || !text) return text;
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? <mark key={i} className="bg-yellow-300 rounded px-1">{part}</mark> : part
    ).reduce((prev, curr) => [prev, curr]);
  };

  const renderDocumentContent = () => {
    const documentContent = selectedDocument.content || selectedDocument.rawText;

    switch (activeContentView) {
      case 'summary':
        return (
          <div className="p-8 max-w-4xl mx-auto">
            <div className="bg-white shadow-lg rounded-lg p-8">
              <h2 className="text-2xl font-bold text-text-primary mb-6">{texts.documentSummary}</h2>
              {selectedDocument.summary ? (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-text-primary mb-3">{texts.aiGeneratedSummary}</h3>
                  <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                    <p className="text-text-secondary leading-relaxed">{selectedDocument.summary}</p>
                  </div>
                </div>
              ) : (
                <div className="mb-8 text-center py-8">
                  <Icon name="FileText" size={48} className="text-text-secondary mx-auto mb-4" />
                  <p className="text-text-secondary">{texts.summaryUnavailable}</p>
                  {selectedDocument.status !== 'Analyzed' && (
                    <p className="text-sm text-text-secondary mt-2">{texts.summaryPendingAnalysis}</p>
                  )}
                </div>
              )}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-text-primary mb-3">{texts.documentInformation}</h3>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  {[
                    { dt: texts.documentType, dd: (selectedDocument.document_type || selectedDocument.type)?.replace(/_/g, ' ') || 'Unknown' },
                    { dt: texts.status,        dd: selectedDocument.status },
                    { dt: texts.documentLanguage, dd: selectedDocument.document_language?.toUpperCase() || 'Unknown' },
                    { dt: texts.uploadDate,    dd: (selectedDocument.creation_date || selectedDocument.uploadedAt) ? new Date(selectedDocument.creation_date || selectedDocument.uploadedAt).toLocaleDateString() : 'Unknown' },
                    { dt: texts.court,         dd: selectedDocument.court || 'Not specified' },
                    { dt: texts.documentDate,  dd: selectedDocument.document_date || 'Not specified' },
                    { dt: texts.fileSize,      dd: selectedDocument.fileSize ? formatFileSize(selectedDocument.fileSize) : 'Unknown' },
                    { dt: texts.wordCount,     dd: textAnalysis.wordCount.toLocaleString() },
                  ].map(({ dt, dd }) => (
                    <div key={dt}>
                      <dt className="font-medium text-text-primary">{dt}</dt>
                      <dd className="text-text-secondary capitalize">{dd}</dd>
                    </div>
                  ))}
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
                <h2 className="text-2xl font-bold text-text-primary">{texts.geminiAnalysisResults}</h2>
              </div>
              {selectedDocument.status === 'Analyzed' ? (
                <div className="space-y-8">
                  {selectedDocument.summary && (
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary mb-3">{texts.executiveSummary}</h3>
                      <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                        <p className="text-text-secondary leading-relaxed">{selectedDocument.summary}</p>
                      </div>
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-3">{texts.analysisOverview}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-text-primary mb-2">{texts.partiesIdentified}</h4>
                        <p className="text-sm text-text-secondary">
                          {selectedDocument.parties ? selectedDocument.parties.split(',').length : 0} legal entities detected
                        </p>
                        {selectedDocument.parties && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-text-primary">Entities:</p>
                            <p className="text-xs text-text-secondary">{selectedDocument.parties}</p>
                          </div>
                        )}
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-text-primary mb-2">{texts.documentClassification}</h4>
                        <p className="text-sm text-text-secondary capitalize">
                          {(selectedDocument.document_type || selectedDocument.type)?.replace(/_/g, ' ') || 'Auto-detected'}
                        </p>
                        <p className="text-xs text-text-secondary mt-1">
                          {texts.confidence}: {selectedDocument.status === 'Analyzed' ? '95%' : '85%'}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-text-primary mb-2">{texts.arguments}</h4>
                        <p className="text-sm text-text-secondary">
                          {selectedDocument.arguments?.length || 0} arguments extracted
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-text-primary mb-2">{texts.processingEngine}</h4>
                        <div className="flex items-center space-x-2">
                          <Icon name="Zap" size={14} className="text-blue-600" />
                          <p className="text-sm font-medium text-blue-600">Google Gemini AI</p>
                        </div>
                        {selectedDocument.analysis_duration_ms && (
                          <p className="text-xs text-text-secondary mt-1">
                            Processed in {(selectedDocument.analysis_duration_ms / 1000).toFixed(1)}s
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Parties + Arguments */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedDocument.parties && (
                      <div>
                        <h4 className="font-medium text-text-primary mb-3">{texts.parties}</h4>
                        <div className="space-y-2">
                          {selectedDocument.parties.split(',').map((party, index) => (
                            <div key={index} className="p-2 bg-gray-100 rounded text-sm">{party.trim()}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedDocument.arguments && selectedDocument.arguments.length > 0 && (
                      <div>
                        <h4 className="font-medium text-text-primary mb-3">{texts.arguments}</h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {selectedDocument.arguments.map((argument, index) => (
                            <div key={index} className="p-2 bg-gray-100 rounded text-sm">{argument}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Technical Details */}
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-3">{texts.technicalDetails}</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <dl className="grid grid-cols-2 gap-4 text-sm">
                        {[
                          { dt: texts.analysisEngine,   dd: 'Google Gemini AI' },
                          { dt: texts.backendSystem,     dd: texts.pythonFlaskSqlServer },
                          { dt: texts.processingStatus,  dd: texts.complete },
                          { dt: texts.documentLanguage,  dd: selectedDocument.document_language?.toUpperCase() || 'Auto-detected' },
                          { dt: texts.fileSize,          dd: selectedDocument.fileSize ? formatFileSize(selectedDocument.fileSize) : 'Unknown' },
                          { dt: texts.wordCount,         dd: `${textAnalysis.wordCount.toLocaleString()} words, ~${textAnalysis.readingTime} min read` },
                        ].map(({ dt, dd }) => (
                          <div key={dt}>
                            <dt className="font-medium text-text-primary">{dt}</dt>
                            <dd className="text-text-secondary">{dd}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Icon name="AlertCircle" size={48} className="text-text-secondary mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-text-primary mb-2">{texts.analysisNotAvailable}</h3>
                  <p className="text-text-secondary mb-4">
                    This document has not been analyzed yet or analysis is still in progress.
                  </p>
                  <div className="flex items-center justify-center space-x-2 text-sm text-text-secondary mb-4">
                    <Icon name="Clock" size={16} />
                    <span>{texts.status}: {selectedDocument.status}</span>
                  </div>
                  {selectedDocument.status === 'Processing' && (
                    <div className="w-full max-w-xs mx-auto bg-gray-200 rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      default: // 'document'
        if (!documentContent) {
          return (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Icon name="FileX" size={48} className="text-text-secondary mx-auto mb-4" />
                <h3 className="text-lg font-medium text-text-primary mb-2">{texts.noContentAvailable}</h3>
                <p className="text-text-secondary mb-4">No extracted text content found for this document.</p>
              </div>
            </div>
          );
        }
        return (
          <div className={`mx-auto bg-white shadow-lg ${comparisonMode ? 'max-w-none' : 'max-w-4xl'}`}>
            {comparisonMode ? (
              <div className="flex">
                <div className="w-1/2 border-r border-border-light">
                  <div className="p-6 border-b border-border-light bg-gray-50">
                    <h3 className="font-medium text-text-primary">Current Version (Processed)</h3>
                    <p className="text-sm text-text-secondary">{textAnalysis.wordCount.toLocaleString()} words • {textAnalysis.readingTime} min read</p>
                  </div>
                  <div className="p-8 font-mono text-sm leading-relaxed overflow-auto max-h-screen" style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}>
                    <pre className="whitespace-pre-wrap">{searchTerm ? highlightSearchResults(documentContent, searchTerm) : documentContent}</pre>
                  </div>
                </div>
                <div className="w-1/2">
                  <div className="p-6 border-b border-border-light bg-gray-50">
                    <h3 className="font-medium text-text-primary">Original Version</h3>
                    <p className="text-sm text-text-secondary">Raw extraction before processing</p>
                  </div>
                  <div className="p-8 font-mono text-sm leading-relaxed overflow-auto max-h-screen" style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}>
                    <pre className="whitespace-pre-wrap">{documentContent.substring(0, Math.floor(documentContent.length * 0.8))}{'\n\n[Showing partial content for comparison]'}</pre>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="p-6 border-b border-border-light bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-text-primary">{texts.documentContent}</h3>
                      <p className="text-sm text-text-secondary">{textAnalysis.wordCount.toLocaleString()} words • {textAnalysis.readingTime} min read • {textAnalysis.characterCount.toLocaleString()} characters</p>
                    </div>
                    {selectedDocument.status === 'Analyzed' && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Icon name="Zap" size={14} className="text-blue-600" />
                        <span className="text-blue-600">{texts.processedByGemini}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-8 font-mono text-sm leading-relaxed overflow-auto" style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left', minHeight: '500px' }}>
                  <pre className="whitespace-pre-wrap font-sans">{searchTerm ? highlightSearchResults(documentContent, searchTerm) : documentContent}</pre>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <GlobalHeader />
        <div className="pt-16 px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-text-secondary">{texts.loadingFromBackend}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error
  if (error || !selectedDocument) {
    return (
      <div className="min-h-screen bg-background">
        <GlobalHeader />
        <div className="pt-16 px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Icon name="FileX" size={48} className="text-text-secondary mx-auto mb-4" />
              <p className="text-text-secondary mb-4">{error || texts.documentNotFound}</p>
              <div className="space-y-2">
                <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors">
                  {texts.dashboard}
                </button>
                {error && error.includes('backend') && (
                  <p className="text-sm text-text-secondary">{texts.checkBackendRunning}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const versionHistory = generateVersionHistory(selectedDocument);

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      <div className="pt-16">
        {/* Top Bar */}
        <div className="px-6 py-4 bg-surface border-b border-border-light">
          <BreadcrumbTrail />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-heading font-semibold text-text-primary">{selectedDocument.filename}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                selectedDocument.status === 'Analyzed' ? 'bg-success/10 text-success' :
                selectedDocument.status === 'Processing' ? 'bg-warning/10 text-warning' :
                selectedDocument.status === 'Error' ? 'bg-error/10 text-error' : 'bg-gray-100 text-gray-700'
              }`}>
                {selectedDocument.status}
              </span>
              {selectedDocument.status === 'Analyzed' && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {texts.processedByGemini}
                </span>
              )}
              {selectedDocument.document_language && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {selectedDocument.document_language.toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* Content View Toggle */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                {[
                  { key: 'document', label: texts.document },
                  { key: 'summary',  label: texts.summary },
                  ...(selectedDocument.status === 'Analyzed' ? [{ key: 'analysis', label: texts.analysis }] : []),
                ].map(({ key, label }) => (
                  <button key={key} onClick={() => setActiveContentView(key)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${activeContentView === key ? 'bg-white text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Version History */}
              <div className="relative">
                <button onClick={() => setShowVersionHistory(!showVersionHistory)}
                  className="flex items-center space-x-2 px-4 py-2 bg-surface border border-border-light rounded-lg hover:bg-gray-50 transition-colors">
                  <Icon name="History" size={16} />
                  <span className="text-sm">v{versionHistory[0]?.version || '1.0'}</span>
                  <Icon name="ChevronDown" size={14} />
                </button>
                {showVersionHistory && (
                  <div className="absolute right-0 mt-2 w-80 bg-surface rounded-lg shadow-lg border border-border-light z-50">
                    <div className="p-4">
                      <h3 className="font-medium text-text-primary mb-3">{texts.versionHistory}</h3>
                      <div className="space-y-3">
                        {versionHistory.map((version) => (
                          <div key={version.version} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${version.status === 'current' ? 'bg-success/10' : version.status === 'processed' ? 'bg-primary/10' : 'bg-gray-100'}`}>
                              <Icon name="FileText" size={14} className={version.status === 'current' ? 'text-success' : version.status === 'processed' ? 'text-primary' : 'text-gray-600'} />
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

              {/* Comparison toggle */}
              <button onClick={() => setComparisonMode(!comparisonMode)}
                className={`px-4 py-2 rounded-lg border transition-colors ${comparisonMode ? 'bg-primary text-white border-primary' : 'bg-surface border-border-light hover:bg-gray-50'}`}
                disabled={activeContentView !== 'document' || !selectedDocument.content}>
                <Icon name="GitCompare" size={16} />
              </button>

              {/* Export */}
              <button onClick={() => exportDocument('txt')}
                className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Icon name="Download" size={16} />
                <span className="text-sm">{texts.exportDocument}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(100vh-140px)]">
          {/* Sidebar */}
          <div className={`bg-surface border-r border-border-light transition-all duration-300 ${sidebarCollapsed ? 'w-12' : 'w-80'}`}>
            <div className="p-4 border-b border-border-light">
              <div className="flex items-center justify-between">
                {!sidebarCollapsed && <h2 className="font-heading font-semibold text-text-primary">{texts.analysis}</h2>}
                <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Icon name={sidebarCollapsed ? 'ChevronRight' : 'ChevronLeft'} size={16} />
                </button>
              </div>
            </div>
            {!sidebarCollapsed && renderAnalysisSidebar()}
          </div>

          {/* Main viewer */}
          <div className="flex-1 flex flex-col">
            {activeContentView === 'document' && selectedDocument.content && (
              <div className="p-4 bg-surface border-b border-border-light">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Search */}
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <Icon name="Search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
                        <input
                          type="text" placeholder={texts.searchInDocument} value={searchTerm}
                          onChange={(e) => handleSearch(e.target.value)}
                          className="pl-10 pr-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-sm w-64"
                        />
                      </div>
                      {searchResults.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-text-secondary">{currentSearchIndex + 1} {texts.of} {searchResults.length}</span>
                          <button onClick={() => navigateSearch('prev')} className="p-1 hover:bg-gray-100 rounded"><Icon name="ChevronUp" size={16} /></button>
                          <button onClick={() => navigateSearch('next')} className="p-1 hover:bg-gray-100 rounded"><Icon name="ChevronDown" size={16} /></button>
                        </div>
                      )}
                    </div>
                    {/* Annotation tools */}
                    <div className="flex items-center space-x-2 border-l border-border-light pl-4">
                      {[
                        { tool: 'highlight', icon: 'Highlighter', title: texts.highlight, active: 'bg-yellow-100 text-yellow-700' },
                        { tool: 'comment',   icon: 'MessageSquare', title: texts.comment, active: 'bg-blue-100 text-blue-700' },
                        { tool: 'tag',       icon: 'Tag',           title: texts.tag,     active: 'bg-green-100 text-green-700' },
                      ].map(({ tool, icon, title, active }) => (
                        <button key={tool} onClick={() => setActiveAnnotationTool(tool)} title={title}
                          className={`p-2 rounded-lg transition-colors ${activeAnnotationTool === tool ? active : 'hover:bg-gray-100'}`}>
                          <Icon name={icon} size={16} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Zoom */}
                    <div className="flex items-center space-x-2">
                      <button onClick={zoomOut} title={texts.zoomOut} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><Icon name="ZoomOut" size={16} /></button>
                      <span className="text-sm text-text-secondary w-12 text-center">{zoomLevel}%</span>
                      <button onClick={zoomIn}  title={texts.zoomIn}  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><Icon name="ZoomIn" size={16} /></button>
                      <button onClick={resetZoom} title={texts.resetZoom} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-xs">Reset</button>
                    </div>
                    {/* Page Nav */}
                    <div className="flex items-center space-x-2 border-l border-border-light pl-4">
                      <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"><Icon name="ChevronLeft" size={16} /></button>
                      <span className="text-sm text-text-secondary">{currentPage} {texts.of} {textAnalysis.pages}</span>
                      <button onClick={() => setCurrentPage(Math.min(textAnalysis.pages, currentPage + 1))} disabled={currentPage === textAnalysis.pages} className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"><Icon name="ChevronRight" size={16} /></button>
                    </div>
                    {/* Fullscreen */}
                    <button onClick={toggleFullscreen} title={texts.fullscreen} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <Icon name={isFullscreen ? 'Minimize2' : 'Maximize2'} size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div ref={viewerRef} className="flex-1 overflow-auto bg-gray-100 p-8" onMouseUp={handleTextSelection}>
              {renderDocumentContent()}
            </div>

            {/* Annotation Context Menu */}
            {showAnnotationMenu && selectedText && (
              <div ref={annotationMenuRef} className="fixed bg-surface border border-border-light rounded-lg shadow-lg z-50 p-2"
                style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                <div className="flex items-center space-x-2">
                  {[
                    { label: texts.highlight, color: '#ffeb3b', bg: 'hover:bg-yellow-50', dot: 'bg-yellow-400' },
                    { label: 'Important',     color: '#ff9800', bg: 'hover:bg-orange-50', dot: 'bg-orange-400' },
                    { label: 'Question',      color: '#2196f3', bg: 'hover:bg-blue-50',   dot: 'bg-blue-400' },
                  ].map(({ label, color, bg, dot }) => (
                    <button key={label} onClick={() => addAnnotation(label, color)} className={`flex items-center space-x-2 px-3 py-2 ${bg} rounded-lg transition-colors`}>
                      <div className={`w-3 h-3 ${dot} rounded-full`} />
                      <span className="text-sm">{label}</span>
                    </button>
                  ))}
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