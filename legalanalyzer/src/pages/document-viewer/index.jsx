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
                  .split('-')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ')
            : 'Unknown',
          fileExtension: doc.fileExtension || 'Unknown',
        });
      } catch (error) {
        navigate('/dashboard');
      }
    };
    fetchDocuments();
  }, [id, navigate]);

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
            </div>
            
            <div className="flex items-center space-x-2">
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
              
              <button
                onClick={() => setComparisonMode(!comparisonMode)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  comparisonMode 
                    ? 'bg-primary text-white border-primary' : 'bg-surface border-border-light hover:bg-gray-50'
                }`}
              >
                <Icon name="GitCompare" size={16} />
              </button>
              
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

            {!sidebarCollapsed && selectedDocument?.extractedInfo && (
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
                        <span className="text-xs text-success">95%</span>
                      </div>
                      <p className="text-xs text-text-secondary">{selectedDocument.type}</p>
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
                    {selectedDocument.extractedInfo.parties?.map((party, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="font-medium text-sm text-text-primary">{party.name}</div>
                        <div className="text-xs text-text-secondary">{party.role} • {party.type}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Dates */}
                <div>
                  <h3 className="font-medium text-text-primary mb-3 flex items-center space-x-2">
                    <Icon name="Calendar" size={16} />
                    <span>Key Dates</span>
                  </h3>
                  <div className="space-y-2">
                    {selectedDocument.extractedInfo.keyDates?.map((date, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-sm text-text-primary">{date.description}</div>
                          <div className="text-xs text-text-secondary">{date.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Terms */}
                <div>
                  <h3 className="font-medium text-text-primary mb-3 flex items-center space-x-2">
                    <Icon name="DollarSign" size={16} />
                    <span>Financial Terms</span>
                  </h3>
                  <div className="space-y-2">
                    {selectedDocument.extractedInfo.financialTerms?.map((term, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-text-primary">{term.term}</span>
                        <span className="font-medium text-sm text-primary">{term.amount}</span>
                      </div>
                    ))}
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
                          selectedDocument.extractedInfo.riskAssessment?.overall === 'Medium' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                        }`}>
                          {selectedDocument.extractedInfo.riskAssessment?.overall || 'Unknown'}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {selectedDocument.extractedInfo.riskAssessment?.factors?.map((factor, index) => (
                          <div key={index} className="flex items-start space-x-2 text-xs">
                            <span className={`px-1 rounded font-medium ${
                              factor.risk === 'High' ? 'bg-error/20 text-error' :
                              factor.risk === 'Medium' ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'
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
            )}
          </div>

          {/* Document Viewer */}
          <div className="flex-1 flex flex-col">
            {/* Viewer Toolbar */}
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

            {/* Document Content */}
            <div 
              ref={viewerRef}
              className="flex-1 overflow-auto bg-gray-100 p-8"
              onMouseUp={handleTextSelection}
            >
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
                        <pre className="whitespace-pre-wrap">{selectedDocument.content.replace('$25,000', '$24,000').replace('$2,000,000', '$1,500,000')}</pre>
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