// src/pages/service-plus/index.jsx - Complete Main Service+ Page
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import GlobalHeader from 'components/ui/GlobalHeader';
import BreadcrumbTrail from 'components/ui/BreadcrumbTrail';
import Icon from 'components/AppIcon';
import DocumentComparisonTool from './components/DocumentComparisonTool';
import ComparisonHistory from './components/ComparisonHistory';
import DocumentGenerationTool from './components/DocumentGenerationTool';
import CaseAnalysisTool from './components/CaseAnalysisTool';
import ServicePlusStats from './components/ServicePlusStats';
import { useLanguage } from 'contexts/LanguageContext';
import { getDocuments, checkMicroservicesHealth } from '../../api';
import { useServicePlusStats } from './hooks/useServicePlusStats';
import CaseAnalysisHistory from './components/CaseAnalysisHistory';

const ServicePlus = () => {
  const { texts } = useLanguage();
  const [activeTab, setActiveTab] = useState('comparison');
  const [documents, setDocuments] = useState([]);
  const [backendHealth, setBackendHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Use the Service+ stats hook
  const { stats, health: servicePlusHealth, updateStats } = useServicePlusStats();

  // Check Service+ backend health
  const checkServicePlusHealth = async () => {
    try {
      const response = await fetch('/service-plus/comparisons?page=1&per_page=1');
      return {
        overall_status: response.ok ? 'healthy' : 'degraded',
        service_plus: response.ok
      };
    } catch (error) {
      return {
        overall_status: 'unavailable',
        service_plus: false,
        error: error.message
      };
    }
  };

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [docs, health, servicePlusHealth] = await Promise.all([
          getDocuments().catch(err => {
            console.warn('Failed to fetch documents:', err);
            return [];
          }),
          checkMicroservicesHealth().catch(err => {
            console.warn('Health check failed:', err);
            return { overall_status: 'unknown' };
          }),
          checkServicePlusHealth().catch(err => {
            console.warn('Service+ health check failed:', err);
            return { overall_status: 'unknown', service_plus: false };
          })
        ]);

        setDocuments(docs);
        setBackendHealth({
          ...health,
          service_plus_status: servicePlusHealth.overall_status,
          service_plus_available: servicePlusHealth.service_plus
        });

        // Update stats with available documents count
        updateStats({
          availableDocuments: docs.length
        });

      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [updateStats]);

  const tabs = [
    {
      id: 'comparison',
      name: 'Document Comparison',
      icon: 'GitCompare',
      description: 'Compare two versions of legal documents using AI semantic analysis',
      available: true
    },
    {
      id: 'history',
      name: 'Comparison History',
      icon: 'History',
      description: 'View and manage past document comparisons with detailed analytics',
      available: true
    },
    {
      id: 'generation',
      name: 'Document Generation',
      icon: 'FileText',
      description: 'Generate legal documents using AI templates and compliance validation',
      available: true,
      comingSoon: false
    },
    {
      id: 'case-analysis',
      name: 'Case Analysis',
      icon: 'Brain',
      description: 'AI-powered legal case analysis with precedent research and strategic recommendations',
      available: true,
      comingSoon: false
    },
    {
      id: 'analysis-history',
      name: 'Analysis History',
      icon: 'History',
      description: 'View and manage past case analyses with export options',
      available: true // Add this new tab
    }
  ];

  const handleStatsUpdate = (newStats) => {
    if (typeof newStats === 'function') {
      updateStats(prevStats => newStats(prevStats));
    } else {
      updateStats(newStats);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <GlobalHeader />
        <main className="pt-16">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-text-secondary">Loading Service+ tools...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          <BreadcrumbTrail />

          {/* Page Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-text-primary">
                Service Plus Advanced Tools
              </h1>
              <p className="text-text-secondary">
                Advanced legal document processing and AI-powered analysis suite
              </p>
            </div>

            {/* Backend Status Indicators */}
            {backendHealth && (
              <div className="flex flex-col space-y-2">
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                  backendHealth.overall_status === 'healthy'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    backendHealth.overall_status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span>Backend: {backendHealth.overall_status === 'healthy' ? 'Online' : 'Issues'}</span>
                </div>
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                  backendHealth.service_plus_available
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    backendHealth.service_plus_available ? 'bg-blue-500' : 'bg-amber-500'
                  }`}></div>
                  <span>Service+: {backendHealth.service_plus_available ? 'Ready' : 'Limited'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Icon name="AlertCircle" size={20} className="text-red-600" />
                <div>
                  <h3 className="font-medium text-red-800">Service Error</h3>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Service Statistics */}
          <ServicePlusStats />

          {/* Service Tabs */}
          <div className="bg-surface rounded-lg border border-border-light">
            {/* Tab Navigation */}
            <div className="border-b border-border-light">
              <nav className="flex space-x-8 px-6" aria-label="Service tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => tab.available && setActiveTab(tab.id)}
                    disabled={!tab.available}
                    className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap relative ${
                      activeTab === tab.id && tab.available
                        ? 'border-primary text-primary'
                        : tab.available
                        ? 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-300'
                        : 'border-transparent text-text-secondary opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon name={tab.icon} size={16} />
                      <span>{tab.name}</span>
                      {tab.comingSoon && (
                        <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800">
                          Coming Soon
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Description */}
            <div className="px-6 py-4 bg-gray-50 border-b border-border-light">
              <div className="flex items-center space-x-2">
                <Icon name="Info" size={16} className="text-blue-600" />
                <span className="text-sm text-blue-800">
                  {tabs.find(tab => tab.id === activeTab)?.description}
                </span>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'comparison' && (
                <DocumentComparisonTool
                  documents={documents}
                  onStatsUpdate={handleStatsUpdate}
                  backendHealth={backendHealth}
                />
              )}
              
              {activeTab === 'history' && (
                <ComparisonHistory
                  onStatsUpdate={handleStatsUpdate}
                  backendHealth={backendHealth}
                />
              )}
              
              {activeTab === 'generation' && (
                <DocumentGenerationTool
                  documents={documents}
                />
              )}
              
              {activeTab === 'case-analysis' && (
                <CaseAnalysisTool
                  documents={documents}
                />
              )}
              {activeTab === 'analysis-history' && (
                <CaseAnalysisHistory
                    onStatsUpdate={handleStatsUpdate}
                />
            )}
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-surface rounded-lg border border-border-light p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center space-x-2">
              <Icon name="Zap" size={20} />
              <span>Quick Actions</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setActiveTab('comparison')}
                className="flex items-center space-x-3 p-4 border border-border-medium rounded-lg hover:bg-gray-50 transition-colors duration-200 text-left group"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <Icon name="GitCompare" size={20} className="text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-text-primary">New Comparison</h4>
                  <p className="text-sm text-text-secondary">Compare document versions</p>
                </div>
              </button>

              <Link
                to="/document-upload"
                className="flex items-center space-x-3 p-4 border border-border-medium rounded-lg hover:bg-gray-50 transition-colors duration-200 text-left group"
              >
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <Icon name="Upload" size={20} className="text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-text-primary">Upload Documents</h4>
                  <p className="text-sm text-text-secondary">Add documents to analyze</p>
                </div>
              </Link>

              <button
                onClick={() => setActiveTab('history')}
                className="flex items-center space-x-3 p-4 border border-border-medium rounded-lg hover:bg-gray-50 transition-colors duration-200 text-left group"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <Icon name="History" size={20} className="text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-text-primary">View History</h4>
                  <p className="text-sm text-text-secondary">Past comparisons & analytics</p>
                </div>
              </button>
            </div>
          </div>

          {/* Feature Roadmap */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Icon name="Map" size={20} className="text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-800">Service+ Development Roadmap</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Available Now */}
                <div className="space-y-4">
                <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-green-800">Available Now</span>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <ul className="text-green-700 space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                        <Icon name="Check" size={14} />
                        <span>AI-powered document comparison with semantic analysis</span>
                    </li>
                    <li className="flex items-center space-x-2">
                        <Icon name="Check" size={14} />
                        <span>Gemini AI integration for advanced change detection</span>
                    </li>
                    <li className="flex items-center space-x-2">
                        <Icon name="Check" size={14} />
                        <span>Comprehensive comparison history and management</span>
                    </li>
                    <li className="flex items-center space-x-2">
                        <Icon name="Check" size={14} />
                        <span>Export detailed comparison reports (JSON format)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                        <Icon name="Check" size={14} />
                        <span>AI document generation (contracts, legal briefs, appeals)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                        <Icon name="Check" size={14} />
                        <span>Multi-document case analysis with strategic recommendations</span> {/* Moved from Coming Soon */}
                    </li>
                    <li className="flex items-center space-x-2">
                        <Icon name="Check" size={14} />
                        <span>Legal precedent research and risk assessment</span> {/* Added */}
                    </li>
                    <li className="flex items-center space-x-2">
                        <Icon name="Check" size={14} />
                        <span>Real-time service health monitoring</span>
                    </li>
                    </ul>
                </div>
                </div>

                {/* Coming Soon - Updated */}
                <div className="space-y-4">
                <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                    <span className="font-medium text-amber-800">Future Enhancements</span>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <ul className="text-amber-700 space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                        <Icon name="Clock" size={14} />
                        <span>Integration with legal databases (Westlaw, Lexis)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                        <Icon name="Clock" size={14} />
                        <span>Advanced case outcome probability modeling</span>
                    </li>
                    <li className="flex items-center space-x-2">
                        <Icon name="Clock" size={14} />
                        <span>Automated legal research and brief generation</span>
                    </li>
                    <li className="flex items-center space-x-2">
                        <Icon name="Clock" size={14} />
                        <span>Client communication and case management integration</span>
                    </li>
                    <li className="flex items-center space-x-2">
                        <Icon name="Clock" size={14} />
                        <span>Real-time court filing and deadline tracking</span>
                    </li>
                    </ul>
                </div>
                </div>
            </div>

            {/* Development Status */}
            <div className="mt-6 p-4 bg-blue-100 rounded-lg border border-blue-300">
              <div className="flex items-start space-x-3">
                <Icon name="Code" size={20} className="text-blue-700 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">Current Development Status</h4>
                  <p className="text-sm text-blue-700 leading-relaxed">
                    All core Service+ features are now operational! Document comparison, generation, and case analysis 
                    services are fully functional with AI integration. The platform provides comprehensive legal 
                    document processing capabilities with semantic analysis, precedent research, risk assessment, 
                    and strategic recommendations. Future enhancements will focus on deeper legal database integration 
                    and advanced predictive analytics.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ServicePlus;