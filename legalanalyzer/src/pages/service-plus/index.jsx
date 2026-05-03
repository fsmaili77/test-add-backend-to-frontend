// src/pages/service-plus/index.jsx

import React, { useState, useEffect } from 'react';
import GlobalHeader from 'components/ui/GlobalHeader';
import BreadcrumbTrail from 'components/ui/BreadcrumbTrail';
import Icon from 'components/AppIcon';
import DocumentComparisonTool from './components/DocumentComparisonTool';
import ComparisonHistory from './components/ComparisonHistory';
import DocumentGenerationTool from './components/DocumentGenerationTool';
import CaseAnalysisTool from './components/CaseAnalysisTool';
import ServicePlusStats from './components/ServicePlusStats';
import { useLanguage } from 'contexts/LanguageContext';
import { checkMicroservicesHealth } from '../../api';
import { useServicePlusStats } from './hooks/useServicePlusStats';
import CaseAnalysisHistory from './components/CaseAnalysisHistory';
import { getUserIdFromToken } from '../../services/apiService';

const API_BASE_URL =
  window.API_BASE_URL ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '/api');

const getToken = () =>
  localStorage.getItem('authToken') ||
  localStorage.getItem('token') ||
  localStorage.getItem('access_token') ||
  localStorage.getItem('jwt') ||
  localStorage.getItem('userToken') ||
  sessionStorage.getItem('authToken') ||
  sessionStorage.getItem('token') ||
  null;

const getAuthHeaders = () => {
  const token = getToken();
  if (!token) {
    console.warn('[ServicePlus] No auth token found in storage — requests will fail auth');
  }
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const fetchClients = async () => {
  const response = await fetch(`${API_BASE_URL}/clients`, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`/clients returned ${response.status}: ${text.slice(0, 200)}`);
  }
  return response.json();
};

const fetchDocumentsForClient = async (clientId) => {
  const response = await fetch(`${API_BASE_URL}/documents?clientId=${clientId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`/documents returned ${response.status}: ${text.slice(0, 200)}`);
  }
  const data = await response.json();
  const arr = Array.isArray(data) ? data : [];
  return arr.map(doc => ({
    ...doc,
    name: doc.filename || doc.original_name || doc.title || doc.id,
    uploadedAt: doc.creation_date,
    size: doc.file_size,
    type: doc.document_type,
    hasAdvancedAnalysis: doc.status === 'Analyzed',
  }));
};

const ServicePlus = () => {
  const { texts } = useLanguage();
  const [activeTab, setActiveTab] = useState('comparison');
  const [documents, setDocuments] = useState([]);
  const [backendHealth, setBackendHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [docsLoading, setDocsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const { stats, health: servicePlusHealth, updateStats } = useServicePlusStats();

  const checkServicePlusHealth = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/service-plus/comparisons?page=1&per_page=1`,
        { headers: getAuthHeaders(), credentials: 'include' }
      );
      return {
        overall_status: response.ok ? 'healthy' : 'degraded',
        service_plus: response.ok,
      };
    } catch (err) {
      return { overall_status: 'unavailable', service_plus: false, error: err.message };
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const tok = getToken();
      console.log(
        '[ServicePlus] auth token:',
        tok ? `found (${tok.slice(0, 20)}...)` : 'NOT FOUND — check localStorage key'
      );
      try {
        const [clientsList, health, spHealth] = await Promise.all([
          fetchClients().catch((err) => {
            console.warn('[ServicePlus] fetchClients failed:', err.message);
            return [];
          }),
          checkMicroservicesHealth().catch(() => ({ overall_status: 'unknown' })),
          checkServicePlusHealth().catch(() => ({
            overall_status: 'unknown',
            service_plus: false,
          })),
        ]);
        console.log('[ServicePlus] clients loaded:', clientsList);
        setClients(clientsList);
        setBackendHealth({
          ...health,
          service_plus_status: spHealth.overall_status,
          service_plus_available: spHealth.service_plus,
        });
        const saved = localStorage.getItem('selectedClientId');
        if (saved && clientsList.some((c) => String(c.id) === saved)) {
          setSelectedClientId(saved);
        } else if (clientsList.length === 1) {
          setSelectedClientId(String(clientsList[0].id));
        }
      } catch (err) {
        console.error('[ServicePlus] Init error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedClientId) {
      setDocuments([]);
      updateStats({ availableDocuments: 0 });
      return;
    }
    localStorage.setItem('selectedClientId', selectedClientId);
    const loadDocs = async () => {
      setDocsLoading(true);
      try {
        const docs = await fetchDocumentsForClient(selectedClientId);
        const arr = Array.isArray(docs) ? docs : [];
        console.log('[ServicePlus] documents for client', selectedClientId, ':', arr.length);
        setDocuments(arr);
        updateStats({ availableDocuments: arr.length });
      } catch (err) {
        console.warn('[ServicePlus] fetchDocuments failed:', err.message);
        setDocuments([]);
      } finally {
        setDocsLoading(false);
      }
    };
    loadDocs();
  }, [selectedClientId, updateStats]);

  const selectedClientName =
    clients.find((c) => String(c.id) === String(selectedClientId))?.name ?? null;

  const tabs = [
    {
      id: 'comparison',
      name: texts.documentComparison,
      icon: 'GitCompare',
      description: texts.documentComparisonDesc,
      available: true,
    },
    {
      id: 'history',
      name: texts.comparisonHistory,
      icon: 'History',
      description: texts.comparisonHistoryDesc,
      available: true,
    },
    {
      id: 'generation',
      name: texts.documentGeneration,
      icon: 'FileText',
      description: texts.documentGenerationDesc,
      available: true,
      comingSoon: false,
    },
    {
      id: 'case-analysis',
      name: texts.caseAnalysis,
      icon: 'Brain',
      description: texts.caseAnalysisDesc,
      available: true,
      comingSoon: false,
    },
    {
      id: 'analysis-history',
      name: texts.analysisHistory,
      icon: 'History',
      description: texts.analysisHistoryDesc,
      available: true,
    },
  ];

  const handleStatsUpdate = (newStats) => {
    if (typeof newStats === 'function') {
      updateStats((prev) => newStats(prev));
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
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-text-secondary">{texts.loadingServiceTools}</p>
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
                {texts.servicePlusTitle}
              </h1>
              <p className="text-text-secondary">
                {texts.servicePlusSubtitle}
              </p>
            </div>
            {backendHealth && (
              <div className="flex flex-col space-y-2">
                <div
                  className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                    backendHealth.overall_status === 'healthy'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      backendHealth.overall_status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <span>
                    {texts.backend}: {backendHealth.overall_status === 'healthy' ? texts.statusOnline : texts.statusIssues}
                  </span>
                </div>
                <div
                  className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                    backendHealth.service_plus_available
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      backendHealth.service_plus_available ? 'bg-blue-500' : 'bg-amber-500'
                    }`}
                  />
                  <span>
                    {texts.servicePlusShort}: {backendHealth.service_plus_available ? texts.statusReady : texts.statusLimited}
                  </span>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Icon name="AlertCircle" size={20} className="text-red-600" />
                <div>
                  <h3 className="font-medium text-red-800">{texts.serviceError}</h3>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <ServicePlusStats />

          {/* Client Selector */}
          <div className="bg-surface rounded-lg border border-border-light p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2 shrink-0">
                <Icon name="Users" size={18} className="text-primary" />
                <span className="text-sm font-medium text-text-primary">{texts.filterByClient}</span>
              </div>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="border border-border-medium rounded-md px-3 py-1.5 text-sm
                           bg-background focus:outline-none focus:ring-2 focus:ring-accent
                           min-w-[220px]"
              >
                <option value="">{texts.selectClientPlaceholder}</option>
                {clients.map((client) => (
                  <option key={client.id} value={String(client.id)}>
                    {client.name}
                  </option>
                ))}
              </select>
              {selectedClientId && (
                <button
                  onClick={() => setSelectedClientId('')}
                  className="flex items-center space-x-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
                >
                  <Icon name="X" size={12} />
                  <span>{texts.clear}</span>
                </button>
              )}
              <span className="text-xs text-text-secondary ml-auto">
                {docsLoading ? (
                  <span className="flex items-center space-x-1">
                    <span className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin inline-block" />
                    <span>{texts.loadingDocuments}</span>
                  </span>
                ) : selectedClientId ? (
                  <>
                    <span className="font-medium text-text-primary">{documents.length}</span>{' '}
                    {texts.documentsFor}{' '}
                    <span className="font-medium text-primary">{selectedClientName}</span>
                    {documents.filter((d) => d.status === 'Analyzed').length > 0 && (
                      <span className="ml-2 text-green-600">
                        ({documents.filter((d) => d.status === 'Analyzed').length} {texts.analyzed})
                      </span>
                    )}
                  </>
                ) : clients.length === 0 ? (
                  <span className="text-red-500">{texts.noClientsFound}</span>
                ) : (
                  <span className="text-amber-600">{texts.selectClientPrompt}</span>
                )}
              </span>
            </div>
          </div>

          {/* Service Tabs */}
          <div className="bg-surface rounded-lg border border-border-light">
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
                          {texts.comingSoon}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </nav>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-b border-border-light">
              <div className="flex items-center space-x-2">
                <Icon name="Info" size={16} className="text-blue-600" />
                <span className="text-sm text-blue-800">
                  {tabs.find((tab) => tab.id === activeTab)?.description}
                </span>
              </div>
            </div>
            <div className="p-6">
              {activeTab === 'comparison' && (
                <DocumentComparisonTool
                  documents={documents}
                  onStatsUpdate={handleStatsUpdate}
                  backendHealth={backendHealth}
                  selectedClientId={selectedClientId}
                  clients={clients}
                />
              )}
              {activeTab === 'history' && (
                <ComparisonHistory
                  onStatsUpdate={handleStatsUpdate}
                  backendHealth={backendHealth}
                />
              )}
              {activeTab === 'generation' && (
                <DocumentGenerationTool documents={documents} />
              )}
              {activeTab === 'case-analysis' && (
                <CaseAnalysisTool
                  documents={documents}
                  selectedClientId={selectedClientId}
                  clients={clients}
                />
              )}
              {activeTab === 'analysis-history' && (
                <CaseAnalysisHistory onStatsUpdate={handleStatsUpdate} />
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-surface rounded-lg border border-border-light p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center space-x-2">
              <Icon name="Zap" size={20} />
              <span>{texts.quickActions}</span>
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
                  <h4 className="font-medium text-text-primary">{texts.newComparison}</h4>
                  <p className="text-sm text-text-secondary">{texts.newComparisonDesc}</p>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('case-analysis')}
                className="flex items-center space-x-3 p-4 border border-border-medium rounded-lg hover:bg-gray-50 transition-colors duration-200 text-left group"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <Icon name="Brain" size={20} className="text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-text-primary">{texts.analyzeCase}</h4>
                  <p className="text-sm text-text-secondary">{texts.analyzeCaseDesc}</p>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className="flex items-center space-x-3 p-4 border border-border-medium rounded-lg hover:bg-gray-50 transition-colors duration-200 text-left group"
              >
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <Icon name="History" size={20} className="text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-text-primary">{texts.viewHistory}</h4>
                  <p className="text-sm text-text-secondary">{texts.viewHistoryDesc}</p>
                </div>
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default ServicePlus;