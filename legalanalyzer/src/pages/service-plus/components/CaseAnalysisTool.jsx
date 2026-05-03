// src/pages/service-plus/components/CaseAnalysisTool.jsx

import React, { useState, useEffect } from 'react';
import Icon from 'components/AppIcon';
import { formatFileSize } from '../../../api';
import { useLanguage } from 'contexts/LanguageContext';
import {
  analyzeCaseDocuments,
  researchPrecedents,
  assessCaseRisk,
  getStrategyRecommendations,
  generateCaseTimeline,
  getCaseAnalyses
} from '../../../api/servicePlus';

const CaseAnalysisTool = ({ documents, selectedClientId, clients = [] }) => {
  const { texts } = useLanguage();
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [analysisType, setAnalysisType] = useState('case-strategy');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [caseContext, setCaseContext] = useState({
    clientPosition: '',
    opposingParty: '',
    legalIssues: '',
    desiredOutcome: '',
    jurisdiction: 'federal',
    caseType: 'Contract Dispute',
    budgetRange: '50k-100k',
    timeline: 'medium'
  });

  const analyzedDocs = documents.filter(doc => doc.status === 'Analyzed');

  const getClientName = (clientId) => {
    if (!clientId) return null;
    return clients.find(c => c.id === clientId || String(c.id) === String(clientId))?.name || `${texts.client} #${clientId}`;
  };

  useEffect(() => {
    const fetchRecentAnalyses = async () => {
      try {
        const response = await getCaseAnalyses(1, 5);
        setRecentAnalyses(response.analyses || []);
      } catch (err) {
        console.warn('Could not load recent analyses:', err);
      }
    };
    fetchRecentAnalyses();
  }, [analysisResult]);

  useEffect(() => {
    setSelectedDocuments(prev =>
      prev.filter(id => analyzedDocs.some(d => d.id.toString() === id))
    );
  }, [selectedClientId]);

  const analysisTypes = [
    {
      id: 'case-strategy',
      name: texts.caseStrategyAnalysis,
      description: texts.caseStrategyDesc,
      icon: 'Target',
      complexity: texts.complexityExpert,
      estimatedTime: texts.estimatedTime5to10,
      fields: ['clientPosition', 'opposingParty', 'legalIssues', 'desiredOutcome', 'budgetRange']
    },
    {
      id: 'precedent-research',
      name: texts.precedentResearch,
      description: texts.precedentResearchDesc,
      icon: 'Search',
      complexity: texts.complexityAdvanced,
      estimatedTime: texts.estimatedTime3to5,
      fields: ['legalIssues']
    },
    {
      id: 'risk-assessment',
      name: texts.riskAssessment,
      description: texts.riskAssessmentDesc,
      icon: 'AlertTriangle',
      complexity: texts.complexityAdvanced,
      estimatedTime: texts.estimatedTime4to7,
      fields: ['clientPosition', 'legalIssues']
    },
    {
      id: 'evidence-analysis',
      name: texts.evidenceAnalysis,
      description: texts.evidenceAnalysisDesc,
      icon: 'Search',
      complexity: texts.complexityStandard,
      estimatedTime: texts.estimatedTime3to5,
      fields: ['clientPosition', 'legalIssues']
    },
    {
      id: 'settlement-analysis',
      name: texts.settlementAnalysis,
      description: texts.settlementAnalysisDesc,
      icon: 'Handshake',
      complexity: texts.complexityAdvanced,
      estimatedTime: texts.estimatedTime4to6,
      fields: ['clientPosition', 'opposingParty', 'desiredOutcome']
    }
  ];

  const caseTypes = [
    'Contract Dispute', 'Personal Injury', 'Employment Law', 'Intellectual Property',
    'Real Estate', 'Corporate Law', 'Criminal Defense', 'Family Law',
    'Immigration', 'Bankruptcy', 'Civil Rights', 'Other'
  ];

  const jurisdictions = [
    { value: 'federal', label: texts.jurisdictionFederal },
    { value: 'state-ca', label: texts.jurisdictionCA },
    { value: 'state-ny', label: texts.jurisdictionNY },
    { value: 'state-tx', label: texts.jurisdictionTX },
    { value: 'state-fl', label: texts.jurisdictionFL },
    { value: 'state-il', label: texts.jurisdictionIL },
    { value: 'international', label: texts.jurisdictionInternational },
  ];

  const budgetRanges = [
    { value: 'under-10k', label: texts.budgetUnder10k },
    { value: '10k-50k', label: texts.budget10kTo50k },
    { value: '50k-100k', label: texts.budget50kTo100k },
    { value: '100k-500k', label: texts.budget100kTo500k },
    { value: 'over-500k', label: texts.budgetOver500k },
  ];

  const timelineOptions = [
    { value: 'immediate', label: texts.timelineImmediate },
    { value: 'short', label: texts.timelineShort },
    { value: 'medium', label: texts.timelineMedium },
    { value: 'long', label: texts.timelineLong },
  ];

  const getComplexityColor = (complexity) => {
    if (complexity === texts.complexityExpert) return 'bg-red-100 text-red-800';
    if (complexity === texts.complexityAdvanced) return 'bg-orange-100 text-orange-800';
    return 'bg-blue-100 text-blue-800';
  };

  const handleDocumentSelection = (docId) => {
    setSelectedDocuments(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  const getCurrentAnalysisType = () => analysisTypes.find(type => type.id === analysisType);

  const simulateProgress = () => {
    setProgress(15);
    setTimeout(() => setProgress(35), 1000);
    setTimeout(() => setProgress(60), 3000);
    setTimeout(() => setProgress(85), 6000);
  };

  const handleAnalyzeCase = async () => {
    if (selectedDocuments.length === 0) {
      setError(texts.pleaseSelectDocument);
      return;
    }
    const currentAnalysisType = getCurrentAnalysisType();
    const requiredFields = currentAnalysisType?.fields || [];
    const missingFields = requiredFields.filter(field => {
      const value = caseContext[field];
      return !value || (typeof value === 'string' && value.trim() === '');
    });
    if (missingFields.length > 0) {
      setError(`${texts.pleaseFillFields}: ${missingFields.join(', ')}`);
      return;
    }
    setAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    setProgress(0);
    simulateProgress();
    try {
      let result;
      if (analysisType === 'precedent-research') {
        const legalIssuesArray = caseContext.legalIssues
          ? caseContext.legalIssues.split(',').map(issue => issue.trim())
          : [caseContext.caseType];
        result = await researchPrecedents(legalIssuesArray, caseContext.jurisdiction, caseContext.caseType);
        result.analysis_type = analysisType;
      } else if (analysisType === 'risk-assessment') {
        result = await assessCaseRisk(selectedDocuments, caseContext);
        result.analysis_type = analysisType;
      } else if (analysisType === 'settlement-analysis') {
        result = await analyzeSettlementOpportunities?.(selectedDocuments, caseContext) ||
          await analyzeCaseDocuments(selectedDocuments, analysisType, caseContext);
      } else {
        result = await analyzeCaseDocuments(selectedDocuments, analysisType, caseContext);
      }
      setProgress(100);
      setTimeout(() => setAnalysisResult(result), 500);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || texts.analysisFailed);
      setProgress(0);
    } finally {
      setTimeout(() => { setAnalyzing(false); setProgress(0); }, 1000);
    }
  };

  const resetAnalysis = () => {
    setAnalysisResult(null);
    setError(null);
    setProgress(0);
  };

  const renderAnalysisResults = () => {
    if (!analysisResult) return null;
    return (
      <div className="bg-surface border border-border-light rounded-lg p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-text-primary flex items-center space-x-2">
            <Icon name="CheckCircle" size={24} className="text-green-600" />
            <span>{texts.analysisComplete}</span>
          </h3>
          <div className="text-sm text-text-secondary">
            {texts.analysisId}: {analysisResult.analysis_id}
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-green-900">
              {getCurrentAnalysisType()?.name} {texts.results}
            </h4>
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              {analysisResult.status || texts.completed}
            </span>
          </div>
          <p className="text-sm text-green-700">
            {texts.analyzed} {analysisResult.documents_analyzed || selectedDocuments.length} {texts.documentsCount}
            {analysisResult.completed_at && ` ${texts.on} ${new Date(analysisResult.completed_at).toLocaleString()}`}
          </p>
        </div>

        {analysisResult.legal_issues && analysisResult.legal_issues.length > 0 && (
          <div>
            <h4 className="font-semibold text-text-primary mb-3 flex items-center space-x-2">
              <Icon name="Scale" size={16} />
              <span>{texts.legalIssuesIdentified} ({analysisResult.legal_issues.length})</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {analysisResult.legal_issues.map((issue, index) => (
                <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="text-sm font-medium text-blue-900">{issue}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {analysisResult.precedents && analysisResult.precedents.length > 0 && (
          <div>
            <h4 className="font-semibold text-text-primary mb-3 flex items-center space-x-2">
              <Icon name="BookOpen" size={16} />
              <span>{texts.relevantPrecedents} ({analysisResult.precedents.length})</span>
            </h4>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {analysisResult.precedents.slice(0, 5).map((precedent, index) => (
                <div key={index} className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-medium text-purple-900">{precedent.case_name}</h5>
                    <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
                      {precedent.jurisdiction}
                    </span>
                  </div>
                  <p className="text-sm text-purple-700 mb-2">{precedent.citation}</p>
                  <p className="text-sm text-purple-800">{precedent.key_holdings}</p>
                  {precedent.summary && (
                    <p className="text-xs text-purple-600 mt-2 italic">{precedent.summary}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {analysisResult.risks && analysisResult.risks.length > 0 && (
          <div>
            <h4 className="font-semibold text-text-primary mb-3 flex items-center space-x-2">
              <Icon name="AlertTriangle" size={16} />
              <span>{texts.riskAssessment} ({analysisResult.risks.length} {texts.risksIdentifiedCount})</span>
            </h4>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {analysisResult.risks.slice(0, 6).map((risk, index) => {
                const severityColor = {
                  'high': 'bg-red-50 border-red-300 text-red-800',
                  'medium': 'bg-yellow-50 border-yellow-300 text-yellow-800',
                  'low': 'bg-green-50 border-green-300 text-green-800'
                }[risk.severity_level] || 'bg-gray-50 border-gray-300 text-gray-800';
                return (
                  <div key={index} className={`p-3 border rounded-lg ${severityColor}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{risk.factor_name}</span>
                      <span className="text-xs px-2 py-1 bg-white rounded">{risk.severity_level} {texts.severity}</span>
                    </div>
                    <p className="text-sm mb-2">{risk.description}</p>
                    {risk.mitigation_strategies && (
                      <div className="text-xs">
                        <span className="font-medium">{texts.mitigation}:</span> {risk.mitigation_strategies}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {analysisResult.recommendations && (
          <div>
            <h4 className="font-semibold text-text-primary mb-3 flex items-center space-x-2">
              <Icon name="Lightbulb" size={16} className="text-yellow-600" />
              <span>{texts.strategicRecommendations}</span>
            </h4>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-sm text-yellow-900 leading-relaxed whitespace-pre-wrap">
                {typeof analysisResult.recommendations === 'string'
                  ? analysisResult.recommendations
                  : JSON.stringify(analysisResult.recommendations, null, 2)}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Analysis Type Selection */}
      <div className="bg-surface border border-border-light rounded-lg p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">{texts.selectAnalysisType}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {analysisTypes.map((type) => (
            <div
              key={type.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                analysisType === type.id
                  ? 'border-primary bg-blue-50'
                  : 'border-border-medium hover:border-primary'
              }`}
              onClick={() => setAnalysisType(type.id)}
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Icon name={type.icon} size={20} className="text-purple-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-text-primary">{type.name}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded ${getComplexityColor(type.complexity)}`}>
                      {type.complexity}
                    </span>
                    <span className="text-xs text-text-secondary">{type.estimatedTime}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-text-secondary">{type.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Select Case Documents */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">
            {texts.selectCaseDocuments} ({selectedDocuments.length} {texts.selected})
          </h3>
          {selectedClientId && (
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full font-medium">
              {texts.showing}: {clients.find(c => String(c.id) === String(selectedClientId))?.name || `${texts.client} #${selectedClientId}`}
            </span>
          )}
        </div>
        <div className="bg-surface border border-border-light rounded-lg p-4">
          {analyzedDocs.length === 0 ? (
            <div className="text-center py-8">
              <Icon name="FileX" size={32} className="text-text-secondary mx-auto mb-3" />
              <h4 className="font-medium text-text-primary mb-2">{texts.noAnalyzedDocuments}</h4>
              <p className="text-text-secondary text-sm">
                {selectedClientId
                  ? `${texts.noAnalyzedDocsForClient} ${getClientName(selectedClientId)}. ${texts.tryDifferentClient}`
                  : texts.uploadAndAnalyzeFirst}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
              {analyzedDocs.map((doc) => (
                <div
                  key={doc.id}
                  className={`flex items-center space-x-3 p-3 border rounded-lg transition-all duration-200 cursor-pointer ${
                    selectedDocuments.includes(doc.id.toString())
                      ? 'border-primary bg-blue-50'
                      : 'border-border-medium hover:border-primary'
                  }`}
                  onClick={() => handleDocumentSelection(doc.id.toString())}
                >
                  <input
                    type="checkbox"
                    checked={selectedDocuments.includes(doc.id.toString())}
                    onChange={() => handleDocumentSelection(doc.id.toString())}
                    className="rounded border-border-medium"
                  />
                  <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center shrink-0">
                    <Icon name="FileText" size={16} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{doc.filename}</p>
                    <p className="text-xs text-text-secondary">
                      {doc.type || texts.document} • {formatFileSize(doc.size)}
                    </p>
                    {!selectedClientId && doc.client_id && (
                      <span className="inline-block mt-1 text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded truncate max-w-full">
                        {getClientName(doc.client_id)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Case Context Form */}
      <div className="bg-surface border border-border-light rounded-lg p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">{texts.caseContext}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">{texts.caseType}</label>
            <select
              value={caseContext.caseType}
              onChange={(e) => setCaseContext(prev => ({ ...prev, caseType: e.target.value }))}
              className="w-full border border-border-medium rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {caseTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">{texts.jurisdiction}</label>
            <select
              value={caseContext.jurisdiction}
              onChange={(e) => setCaseContext(prev => ({ ...prev, jurisdiction: e.target.value }))}
              className="w-full border border-border-medium rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {jurisdictions.map((j) => (
                <option key={j.value} value={j.value}>{j.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">{texts.budgetRange}</label>
            <select
              value={caseContext.budgetRange}
              onChange={(e) => setCaseContext(prev => ({ ...prev, budgetRange: e.target.value }))}
              className="w-full border border-border-medium rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {budgetRanges.map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">{texts.timeline}</label>
            <select
              value={caseContext.timeline}
              onChange={(e) => setCaseContext(prev => ({ ...prev, timeline: e.target.value }))}
              className="w-full border border-border-medium rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {timelineOptions.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {getCurrentAnalysisType()?.fields.includes('clientPosition') && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-text-secondary mb-2">{texts.clientPosition} *</label>
            <textarea
              value={caseContext.clientPosition}
              onChange={(e) => setCaseContext(prev => ({ ...prev, clientPosition: e.target.value }))}
              placeholder={texts.clientPositionPlaceholder}
              rows={3}
              className="w-full border border-border-medium rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        )}
        {getCurrentAnalysisType()?.fields.includes('opposingParty') && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-text-secondary mb-2">{texts.opposingParty} *</label>
            <textarea
              value={caseContext.opposingParty}
              onChange={(e) => setCaseContext(prev => ({ ...prev, opposingParty: e.target.value }))}
              placeholder={texts.opposingPartyPlaceholder}
              rows={3}
              className="w-full border border-border-medium rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        )}
        {getCurrentAnalysisType()?.fields.includes('legalIssues') && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-text-secondary mb-2">{texts.legalIssues} *</label>
            <textarea
              value={caseContext.legalIssues}
              onChange={(e) => setCaseContext(prev => ({ ...prev, legalIssues: e.target.value }))}
              placeholder={texts.legalIssuesPlaceholder}
              rows={3}
              className="w-full border border-border-medium rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        )}
        {getCurrentAnalysisType()?.fields.includes('desiredOutcome') && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-text-secondary mb-2">{texts.desiredOutcome} *</label>
            <textarea
              value={caseContext.desiredOutcome}
              onChange={(e) => setCaseContext(prev => ({ ...prev, desiredOutcome: e.target.value }))}
              placeholder={texts.desiredOutcomePlaceholder}
              rows={3}
              className="w-full border border-border-medium rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Icon name="AlertCircle" size={20} className="text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-center space-x-4">
          <button
            onClick={handleAnalyzeCase}
            disabled={analyzing}
            className="flex items-center space-x-2 px-8 py-3 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {analyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{texts.analyzingCase}</span>
              </>
            ) : (
              <>
                <Icon name="Brain" size={20} />
                <span>{texts.analyzeCase}</span>
              </>
            )}
          </button>
          {analysisResult && (
            <button
              onClick={resetAnalysis}
              className="flex items-center space-x-2 px-6 py-3 border border-border-medium text-text-primary rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <Icon name="RotateCcw" size={16} />
              <span>{texts.newAnalysis}</span>
            </button>
          )}
        </div>

        {/* Progress Bar */}
        {analyzing && (
          <div className="mt-6 bg-surface border border-border-light rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-primary">{texts.analyzingCaseProgress}</span>
              <span className="text-sm text-text-secondary">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-text-secondary">
              {progress < 35 && texts.progressExtractingIssues}
              {progress >= 35 && progress < 60 && texts.progressResearchingPrecedents}
              {progress >= 60 && progress < 85 && texts.progressAssessingRisks}
              {progress >= 85 && texts.progressFinalizing}
            </div>
          </div>
        )}
      </div>

      {/* Analysis Results */}
      {renderAnalysisResults()}

      {/* Recent Analyses */}
      {recentAnalyses.length > 0 && (
        <div className="bg-surface border border-border-light rounded-lg p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">{texts.recentCaseAnalyses}</h3>
          <div className="space-y-3">
            {recentAnalyses.map((analysis) => (
              <div key={analysis.analysis_id} className="flex items-center justify-between p-3 border border-border-medium rounded-lg">
                <div className="flex items-center space-x-3">
                  <Icon name="Brain" size={16} className="text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {analysis.case_title || `${analysis.analysis_type} ${texts.analysis}`}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {analysis.analysis_type} • {new Date(analysis.created_at).toLocaleDateString()} • {analysis.status}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  analysis.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : analysis.status === 'processing'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {analysis.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Capabilities Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center space-x-2">
          <Icon name="Zap" size={20} />
          <span>{texts.aiCapabilitiesTitle}</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">{texts.analysisFeatures}:</h4>
            <ul className="list-disc list-inside text-blue-700 text-sm space-y-1">
              <li>{texts.featureMultiDoc}</li>
              <li>{texts.featurePrecedentResearch}</li>
              <li>{texts.featureRiskAssessment}</li>
              <li>{texts.featureStrategicRecommendations}</li>
              <li>{texts.featureSettlementAnalysis}</li>
              <li>{texts.featureEvidenceGap}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">{texts.supportedAnalysisTypes}:</h4>
            <ul className="list-disc list-inside text-blue-700 text-sm space-y-1">
              <li>{texts.supportedCaseStrategy}</li>
              <li>{texts.supportedPrecedent}</li>
              <li>{texts.supportedRisk}</li>
              <li>{texts.supportedEvidence}</li>
              <li>{texts.supportedSettlement}</li>
            </ul>
          </div>
        </div>
        <div className="mt-6 p-4 bg-blue-100 rounded-lg">
          <div className="flex items-start space-x-3">
            <Icon name="Info" size={20} className="text-blue-700 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800 mb-2">{texts.howItWorks}</h4>
              <p className="text-sm text-blue-700 leading-relaxed">{texts.howItWorksDesc}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseAnalysisTool;