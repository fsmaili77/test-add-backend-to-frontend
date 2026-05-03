// src/pages/service-plus/components/CaseAnalysisHistory.jsx

import React, { useState, useEffect } from 'react';
import Icon from 'components/AppIcon';
import { getCaseAnalyses, getCaseAnalysis } from '../../../api/servicePlus';
import { useLanguage } from 'contexts/LanguageContext';
import jsPDF from 'jspdf';

const CaseAnalysisHistory = ({ onStatsUpdate }) => {
  const { texts } = useLanguage();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [detailedAnalysis, setDetailedAnalysis] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filterType, setFilterType] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalyses = async (page = 1, type = 'all', showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const response = await getCaseAnalyses(page, 10, { type, status: 'all' });
      setAnalyses(response.analyses || []);
      setTotalPages(response.pagination?.total_pages || 1);
      setTotalCount(response.pagination?.total_count || 0);
      if (onStatsUpdate && response.analyses) {
        onStatsUpdate(prev => ({
          ...prev,
          caseAnalyses: response.pagination?.total_count || 0
        }));
      }
    } catch (err) {
      console.error('Error fetching analyses:', err);
      setError(err.message || texts.failedToLoadAnalyses);
      setAnalyses([]);
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAnalysisDetails = async (analysisId) => {
    try {
      setSelectedAnalysis(analysisId);
      const details = await getCaseAnalysis(analysisId);
      setDetailedAnalysis(details);
    } catch (err) {
      console.error('Error fetching analysis details:', err);
      setError(texts.failedToLoadAnalysisDetails);
    }
  };

  const exportAnalysisToPDF = (analysis) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = 20;

    const addText = (text, fontSize = 10, isBold = false) => {
      doc.setFontSize(fontSize);
      doc.setFont(undefined, isBold ? 'bold' : 'normal');
      const lines = doc.splitTextToSize(text, maxWidth);
      lines.forEach(line => {
        if (yPosition > 280) { doc.addPage(); yPosition = 20; }
        doc.text(line, margin, yPosition);
        yPosition += fontSize * 0.5;
      });
      yPosition += 5;
    };

    addText(texts.legalCaseAnalysisReport, 16, true);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    addText(`${texts.analysisId}: ${analysis.analysis_id}`, 10);
    addText(`${texts.analysisType}: ${analysis.analysis_type || texts.caseStrategy}`, 10);
    addText(`${texts.status}: ${analysis.status}`, 10);
    addText(`${texts.created}: ${new Date(analysis.created_at).toLocaleString()}`, 10);
    if (analysis.completed_at) {
      addText(`${texts.completed}: ${new Date(analysis.completed_at).toLocaleString()}`, 10);
    }
    yPosition += 5;

    if (analysis.case_context) {
      addText(texts.caseContext.toUpperCase(), 12, true);
      const context = typeof analysis.case_context === 'string'
        ? JSON.parse(analysis.case_context)
        : analysis.case_context;
      if (context.caseType) addText(`${texts.caseType}: ${context.caseType}`, 10);
      if (context.jurisdiction) addText(`${texts.jurisdiction}: ${context.jurisdiction}`, 10);
      if (context.clientPosition) addText(`${texts.clientPosition}: ${context.clientPosition}`, 10);
      yPosition += 5;
    }

    if (analysis.results?.legal_issues?.content) {
      addText(texts.legalIssuesIdentified.toUpperCase(), 12, true);
      const issues = Array.isArray(analysis.results.legal_issues.content)
        ? analysis.results.legal_issues.content
        : JSON.parse(analysis.results.legal_issues.content);
      issues.forEach((issue, index) => { addText(`${index + 1}. ${issue}`, 10); });
      yPosition += 5;
    }

    if (analysis.results?.precedents?.content) {
      addText(texts.relevantPrecedents.toUpperCase(), 12, true);
      const precedents = Array.isArray(analysis.results.precedents.content)
        ? analysis.results.precedents.content
        : JSON.parse(analysis.results.precedents.content);
      precedents.slice(0, 3).forEach((precedent, index) => {
        addText(`${index + 1}. ${precedent.case_name}`, 10, true);
        addText(`   ${texts.citation}: ${precedent.citation}`, 9);
        addText(`   ${precedent.key_holdings}`, 9);
        yPosition += 3;
      });
      yPosition += 5;
    }

    if (analysis.results?.risks?.content) {
      addText(texts.riskAssessment.toUpperCase(), 12, true);
      const risks = Array.isArray(analysis.results.risks.content)
        ? analysis.results.risks.content
        : JSON.parse(analysis.results.risks.content);
      risks.slice(0, 5).forEach((risk, index) => {
        addText(`${index + 1}. ${risk.factor_name} (${risk.severity_level} ${texts.severity})`, 10, true);
        addText(`   ${risk.description}`, 9);
        if (risk.mitigation_strategies) {
          addText(`   ${texts.mitigation}: ${risk.mitigation_strategies}`, 9);
        }
        yPosition += 3;
      });
      yPosition += 5;
    }

    if (analysis.results?.recommendations?.content) {
      addText(texts.strategicRecommendations.toUpperCase(), 12, true);
      addText(analysis.results.recommendations.content, 9);
    }

    doc.setFontSize(8);
    doc.text(
      `${texts.generatedBy} ${new Date().toLocaleDateString()}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );

    doc.save(`case-analysis-${analysis.analysis_id}.pdf`);
  };

  const exportAnalysisToJSON = (analysis) => {
    const dataStr = JSON.stringify(analysis, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `case-analysis-${analysis.analysis_id}.json`);
    linkElement.click();
  };

  useEffect(() => {
    fetchAnalyses(currentPage, filterType);
  }, [currentPage, filterType]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalyses(currentPage, filterType, false);
  };

  if (loading && analyses.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">{texts.loadingCaseAnalyses}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
            className="border border-border-medium rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="all">{texts.allTypes}</option>
            <option value="case-strategy">{texts.caseStrategy}</option>
            <option value="precedent-research">{texts.precedentResearch}</option>
            <option value="risk-assessment">{texts.riskAssessment}</option>
            <option value="settlement-analysis">{texts.settlementAnalysis}</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-text-secondary">
            {totalCount} {texts.analysisTotal}
          </span>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
          >
            <Icon name="RefreshCw" size={16} className={refreshing ? 'animate-spin' : ''} />
            <span>{texts.refresh}</span>
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Icon name="AlertCircle" size={20} className="text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analysis List */}
        <div className="lg:col-span-2 space-y-4">
          {analyses.length === 0 ? (
            <div className="text-center py-12 bg-surface rounded-lg border border-border-light">
              <Icon name="Brain" size={48} className="text-text-secondary mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">{texts.noCaseAnalysesFound}</h3>
              <p className="text-text-secondary">{texts.noCaseAnalysesDesc}</p>
            </div>
          ) : (
            <>
              {analyses.map((analysis) => (
                <div
                  key={analysis.analysis_id}
                  className={`bg-surface rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md ${
                    selectedAnalysis === analysis.analysis_id
                      ? 'ring-2 ring-primary border-primary shadow-md'
                      : 'border-border-light hover:border-primary'
                  }`}
                  onClick={() => fetchAnalysisDetails(analysis.analysis_id)}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Icon name="Brain" size={16} className="text-purple-600" />
                          <span className="text-sm font-medium text-text-primary">
                            {analysis.case_title || `${texts.analysis} #${analysis.analysis_id.substring(0, 8)}`}
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                            {analysis.analysis_type}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-text-secondary">
                            {new Date(analysis.created_at).toLocaleString()}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            analysis.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {analysis.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 ml-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            fetchAnalysisDetails(analysis.analysis_id).then(() => {
                              if (detailedAnalysis) exportAnalysisToPDF(detailedAnalysis);
                            });
                          }}
                          className="p-2 text-text-secondary hover:text-red-600 transition-colors"
                          title={texts.exportAsPDF}
                        >
                          <Icon name="FileText" size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            fetchAnalysisDetails(analysis.analysis_id).then(() => {
                              if (detailedAnalysis) exportAnalysisToJSON(detailedAnalysis);
                            });
                          }}
                          className="p-2 text-text-secondary hover:text-green-600 transition-colors"
                          title={texts.exportAsJSON}
                        >
                          <Icon name="Download" size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-text-secondary">
                {texts.page} {currentPage} {texts.of} {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-border-medium rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <Icon name="ChevronLeft" size={14} />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-border-medium rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <Icon name="ChevronRight" size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Details Panel */}
        <div className="lg:col-span-1">
          {detailedAnalysis ? (
            <div className="bg-surface rounded-lg border border-border-light p-4 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary">{texts.analysisDetails}</h3>
                <button
                  onClick={() => { setSelectedAnalysis(null); setDetailedAnalysis(null); }}
                  className="p-1 text-text-secondary hover:text-text-primary transition-colors"
                >
                  <Icon name="X" size={16} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-text-primary mb-2">{texts.status}</h4>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    detailedAnalysis.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {detailedAnalysis.status}
                  </span>
                </div>

                {detailedAnalysis.results?.legal_issues && (
                  <div>
                    <h4 className="font-medium text-text-primary mb-2">{texts.legalIssuesIdentified}</h4>
                    <div className="space-y-1">
                      {(() => {
                        const issues = Array.isArray(detailedAnalysis.results.legal_issues.content)
                          ? detailedAnalysis.results.legal_issues.content
                          : JSON.parse(detailedAnalysis.results.legal_issues.content);
                        return issues.slice(0, 5).map((issue, index) => (
                          <div key={index} className="text-xs p-2 bg-blue-50 rounded">{issue}</div>
                        ));
                      })()}
                    </div>
                  </div>
                )}

                {detailedAnalysis.results?.precedents && (
                  <div>
                    <h4 className="font-medium text-text-primary mb-2">{texts.precedentsFound}</h4>
                    <p className="text-sm text-text-secondary">
                      {(() => {
                        const precedents = Array.isArray(detailedAnalysis.results.precedents.content)
                          ? detailedAnalysis.results.precedents.content
                          : JSON.parse(detailedAnalysis.results.precedents.content);
                        return precedents.length;
                      })()} {texts.relevantCases}
                    </p>
                  </div>
                )}

                {detailedAnalysis.results?.risks && (
                  <div>
                    <h4 className="font-medium text-text-primary mb-2">{texts.risksIdentified}</h4>
                    <p className="text-sm text-text-secondary">
                      {(() => {
                        const risks = Array.isArray(detailedAnalysis.results.risks.content)
                          ? detailedAnalysis.results.risks.content
                          : JSON.parse(detailedAnalysis.results.risks.content);
                        return risks.length;
                      })()} {texts.riskFactors}
                    </p>
                  </div>
                )}

                <div className="border-t pt-4 space-y-2">
                  <button
                    onClick={() => exportAnalysisToPDF(detailedAnalysis)}
                    className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                  >
                    <Icon name="FileText" size={14} />
                    <span>{texts.exportAsPDF}</span>
                  </button>
                  <button
                    onClick={() => exportAnalysisToJSON(detailedAnalysis)}
                    className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                  >
                    <Icon name="Download" size={14} />
                    <span>{texts.exportAsJSON}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface rounded-lg border border-border-light p-6 text-center sticky top-24">
              <Icon name="MousePointer" size={32} className="text-text-secondary mx-auto mb-3" />
              <h4 className="font-medium text-text-primary mb-2">{texts.selectAnAnalysis}</h4>
              <p className="text-text-secondary text-sm">{texts.selectAnAnalysisDesc}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CaseAnalysisHistory;