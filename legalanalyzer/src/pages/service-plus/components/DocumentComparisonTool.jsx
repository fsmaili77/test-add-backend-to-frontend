// src/pages/service-plus/components/DocumentComparisonTool.jsx

import React, { useState, useRef } from 'react';
import Icon from 'components/AppIcon';
import { formatFileSize } from '../../../api';
import { useLanguage } from 'contexts/LanguageContext';

const DocumentComparisonTool = ({ documents, onStatsUpdate, backendHealth, selectedClientId, clients = [] }) => {
  const { texts } = useLanguage();
  const [comparisonMode, setComparisonMode] = useState('database');
  const [selectedDoc1, setSelectedDoc1] = useState('');
  const [selectedDoc2, setSelectedDoc2] = useState('');
  const [uploadedFile1, setUploadedFile1] = useState(null);
  const [uploadedFile2, setUploadedFile2] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const fileInput1Ref = useRef(null);
  const fileInput2Ref = useRef(null);
  const API_BASE_URL = window.API_BASE_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '/api');

  const analyzedDocs = documents.filter(doc => doc.status === 'Analyzed');

  const getClientName = (clientId) => {
    if (!clientId) return null;
    return clients.find(c => c.id === clientId || String(c.id) === String(clientId))?.name || `${texts.client} #${clientId}`;
  };

  const validateFile = (file) => {
    const errors = [];
    const maxFileSize = 50 * 1024 * 1024;
    const supportedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    if (!supportedTypes.includes(file.type)) {
      errors.push(`${texts.unsupportedFormat}: ${file.name.split('.').pop().toUpperCase()}. ${texts.supported}: PDF, DOCX, TXT`);
    }
    if (file.size > maxFileSize) {
      errors.push(`${texts.fileTooLarge}: ${formatFileSize(file.size)} (${texts.max} 50MB)`);
    }
    return errors;
  };

  const handleFileUpload = (file, docNumber) => {
    if (!file) return;
    const errors = validateFile(file);
    if (errors.length > 0) { setError(errors.join('; ')); return; }
    if (docNumber === 1) setUploadedFile1(file);
    else setUploadedFile2(file);
    setError(null);
  };

  const simulateProgress = () => {
    setProgress(10);
    setTimeout(() => setProgress(30), 500);
    setTimeout(() => setProgress(60), 1500);
    setTimeout(() => setProgress(90), 3000);
  };

  const performComparison = async () => {
    setComparing(true);
    setError(null);
    setComparisonResult(null);
    setProgress(0);
    simulateProgress();
    try {
      const formData = new FormData();
      if (comparisonMode === 'database') {
        if (!selectedDoc1 || !selectedDoc2) throw new Error(texts.pleaseSelectTwoDocuments);
        if (selectedDoc1 === selectedDoc2) throw new Error(texts.cannotCompareSameDocument);
        formData.append('doc1_id', selectedDoc1);
        formData.append('doc2_id', selectedDoc2);
      } else {
        if (!uploadedFile1 || !uploadedFile2) throw new Error(texts.pleaseUploadTwoFiles);
        formData.append('file1', uploadedFile1);
        formData.append('file2', uploadedFile2);
      }
      const endpoint = comparisonMode === 'database' ? 'advanced-compare' : 'compare';
      const response = await fetch(`${API_BASE_URL}/service-plus/${endpoint}`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      setProgress(100);
      setTimeout(() => {
        setComparisonResult(result);
        if (onStatsUpdate) {
          onStatsUpdate(prev => ({
            ...prev,
            todayComparisons: prev.todayComparisons + 1,
            totalComparisons: prev.totalComparisons + 1,
            avgSimilarity: result.overall_similarity
              ? Math.round(result.overall_similarity * 100)
              : prev.avgSimilarity
          }));
        }
      }, 500);
    } catch (err) {
      console.error('Comparison error:', err);
      setError(err.message || texts.comparisonFailed);
      setProgress(0);
    } finally {
      setTimeout(() => { setComparing(false); setProgress(0); }, 1000);
    }
  };

  const getDocumentName = (docId) => {
    const doc = documents.find(d => d.id == docId);
    return doc ? doc.filename : texts.unknownDocument;
  };

  const getDocumentInfo = (docId) => {
    const doc = documents.find(d => d.id == docId);
    return doc ? {
      name: doc.filename,
      size: formatFileSize(doc.size || 0),
      type: doc.type || texts.document,
      uploadDate: doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : texts.unknown,
      clientName: doc.client_id ? getClientName(doc.client_id) : null,
    } : null;
  };

  const exportComparisonReport = () => {
    if (!comparisonResult) return;
    const report = {
      comparison_id: comparisonResult.comparison_id,
      timestamp: new Date().toISOString(),
      documents: {
        document1: comparisonMode === 'database' ? getDocumentName(selectedDoc1) : uploadedFile1?.name,
        document2: comparisonMode === 'database' ? getDocumentName(selectedDoc2) : uploadedFile2?.name,
      },
      comparison_mode: comparisonMode,
      overall_similarity: comparisonResult.overall_similarity,
      key_differences: comparisonResult.key_differences,
      gemini_analysis: comparisonResult.gemini_summary,
      semantic_analysis: comparisonResult.semantic_clause_diff,
      clauses_analyzed: comparisonResult.clauses_compared,
      generated_by: 'Legal Analyzer Service+'
    };
    const dataStr = JSON.stringify(report, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const timestamp = new Date().toISOString().split('T')[0];
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', `comparison-report-${timestamp}.json`);
    link.click();
  };

  const exportAsPdf = () => {
    if (!comparisonResult) return;
    const doc1Name = comparisonMode === 'database' ? getDocumentName(selectedDoc1) : uploadedFile1?.name;
    const doc2Name = comparisonMode === 'database' ? getDocumentName(selectedDoc2) : uploadedFile2?.name;
    const timestamp = new Date().toLocaleString();
    const similarity = comparisonResult.overall_similarity != null
      ? `${(comparisonResult.overall_similarity * 100).toFixed(1)}%` : 'N/A';
    const similarityPct = comparisonResult.overall_similarity != null
      ? comparisonResult.overall_similarity * 100 : 0;

    const diffRows = (comparisonResult.key_differences || [])
      .map((d, i) => `<tr><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;color:#92400e;">${i + 1}.</td><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;color:#78350f;">${d}</td></tr>`)
      .join('');

    const clauseRows = (comparisonResult.semantic_clause_diff || []).slice(0, 10)
      .map((item) => {
        const colorMap = { added: '#d1fae5', removed: '#fee2e2', modified: '#fef3c7' };
        const bg = colorMap[item.change_type] || '#f3f4f6';
        return `<div style="margin-bottom:10px;padding:10px;background:${bg};border-radius:6px;font-size:12px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <strong style="text-transform:uppercase;font-size:11px;">${item.change_type || 'IDENTICAL'}</strong>
            ${item.semantic_similarity != null ? `<span>Similarity: ${(item.semantic_similarity * 100).toFixed(1)}%</span>` : ''}
          </div>
          ${item.doc1_clause ? `<div><strong>Original:</strong> <em>${item.doc1_clause.substring(0, 200)}...</em></div>` : ''}
          ${item.doc2_clause ? `<div style="margin-top:4px;"><strong>Revised:</strong> <em>${item.doc2_clause.substring(0, 200)}...</em></div>` : ''}
        </div>`;
      }).join('');

    const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>Document Comparison Report</title>
<style>* { box-sizing: border-box; } body { font-family: Arial, sans-serif; margin: 0; padding: 40px; color: #111827; font-size: 13px; line-height: 1.5; }
h1 { font-size: 24px; color: #1d4ed8; border-bottom: 3px solid #1d4ed8; padding-bottom: 10px; margin-bottom: 20px; }
h2 { font-size: 15px; color: #374151; margin: 24px 0 10px; } .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }
@media print { body { padding: 20px; } @page { margin: 15mm; } }</style></head><body>
<h1>📄 ${texts.documentComparisonReport}</h1>
<p>${texts.generated}: ${timestamp}</p>
<p>${texts.document1}: ${doc1Name || '—'}</p><p>${texts.document2}: ${doc2Name || '—'}</p>
<h2>${texts.overallSimilarity}: ${similarity}</h2>
${diffRows ? `<h2>${texts.keyDifferences} (${(comparisonResult.key_differences || []).length})</h2><table><thead><tr><th>#</th><th>${texts.difference}</th></tr></thead><tbody>${diffRows}</tbody></table>` : ''}
${comparisonResult.gemini_summary ? `<h2>${texts.aiAnalysis} (Gemini)</h2><p>${comparisonResult.gemini_summary}</p>` : ''}
${clauseRows ? `<h2>${texts.clauseByClauseAnalysis}</h2>${clauseRows}` : ''}
<div class="footer">${texts.generatedBy} | ${timestamp}</div>
</body></html>`;

    const win = window.open('', '_blank');
    if (!win) { setError(texts.popupBlocked); return; }
    win.document.write(htmlContent);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 600);
  };

  const resetComparison = () => {
    setComparisonResult(null);
    setError(null);
    setProgress(0);
    if (comparisonMode === 'upload') {
      setUploadedFile1(null);
      setUploadedFile2(null);
      if (fileInput1Ref.current) fileInput1Ref.current.value = '';
      if (fileInput2Ref.current) fileInput2Ref.current.value = '';
    }
  };

  const getChangeTypeColor = (changeType) => {
    switch (changeType) {
      case 'added': return 'bg-green-50 border-green-400 text-green-800';
      case 'removed': return 'bg-red-50 border-red-400 text-red-800';
      case 'modified': return 'bg-yellow-50 border-yellow-400 text-yellow-800';
      default: return 'bg-gray-50 border-gray-400 text-gray-800';
    }
  };

  const getChangeTypeIcon = (changeType) => {
    switch (changeType) {
      case 'added': return 'Plus';
      case 'removed': return 'Minus';
      case 'modified': return 'Edit';
      default: return 'Equal';
    }
  };

  const isServicePlusAvailable = backendHealth?.service_plus_available;

  const renderDocumentSelector = (docNum) => {
    const selectedDoc = docNum === 1 ? selectedDoc1 : selectedDoc2;
    const setSelectedDoc = docNum === 1 ? setSelectedDoc1 : setSelectedDoc2;
    const uploadedFile = docNum === 1 ? uploadedFile1 : uploadedFile2;
    const fileInputRef = docNum === 1 ? fileInput1Ref : fileInput2Ref;
    const colorClass = docNum === 1 ? 'text-blue-600' : 'text-green-600';
    const infoBg = docNum === 1 ? 'bg-blue-50' : 'bg-green-50';
    const infoText = docNum === 1 ? 'text-blue-900' : 'text-green-900';
    const infoSub = docNum === 1 ? 'text-blue-700' : 'text-green-700';

    return (
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-text-primary mb-4 flex items-center space-x-2">
          <Icon name="FileText" size={20} className={colorClass} />
          <span>{docNum === 1 ? texts.document1 : texts.document2}</span>
        </h3>
        {comparisonMode === 'database' ? (
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">{texts.selectDocument}</label>
            {analyzedDocs.length === 0 ? (
              <div className="text-center py-6 text-text-secondary text-sm border border-dashed border-border-medium rounded-lg">
                <Icon name="FileX" size={24} className="mx-auto mb-2 opacity-50" />
                <p>{selectedClientId ? texts.noAnalyzedDocsForThisClient : texts.noAnalyzedDocumentsAvailable}</p>
              </div>
            ) : (
              <select
                value={selectedDoc}
                onChange={(e) => setSelectedDoc(e.target.value)}
                className="w-full border border-border-medium rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">{texts.chooseDocument}</option>
                {analyzedDocs.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.filename} ({formatFileSize(doc.size)}) — {doc.type}
                    {!selectedClientId && doc.client_id ? ` · ${getClientName(doc.client_id)}` : ''}
                  </option>
                ))}
              </select>
            )}
            {selectedDoc && (() => {
              const docInfo = getDocumentInfo(selectedDoc);
              return docInfo ? (
                <div className={`mt-3 p-3 ${infoBg} rounded-md text-sm`}>
                  <div className={`font-medium ${infoText}`}>{docInfo.name}</div>
                  <div className={`${infoSub} space-y-0.5 mt-1`}>
                    <div>{texts.size}: {docInfo.size}</div>
                    <div>{texts.type}: {docInfo.type}</div>
                    <div>{texts.uploadDate}: {docInfo.uploadDate}</div>
                    {docInfo.clientName && <div>{texts.client}: {docInfo.clientName}</div>}
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">{texts.uploadFile}</label>
            <div
              className="border-2 border-dashed border-border-medium rounded-lg p-6 text-center hover:border-primary transition-colors duration-200 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={(e) => handleFileUpload(e.target.files[0], docNum)}
                className="hidden"
              />
              <Icon name="Upload" size={32} className="text-text-secondary mx-auto mb-2" />
              <p className="text-sm text-text-primary font-medium">{texts.clickToUpload}</p>
              <p className="text-xs text-text-secondary mt-1">{texts.uploadHint}</p>
            </div>
            {uploadedFile && (
              <div className="mt-3 p-3 bg-green-50 rounded-md">
                <div className="flex items-center space-x-2">
                  <Icon name="CheckCircle" size={16} className="text-green-600" />
                  <div className="text-sm">
                    <div className="font-medium text-green-900">{uploadedFile.name}</div>
                    <div className="text-green-700">{formatFileSize(uploadedFile.size)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Backend Status Warning */}
      {!isServicePlusAvailable && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Icon name="AlertTriangle" size={20} className="text-amber-600" />
            <div>
              <h4 className="font-medium text-amber-800">{texts.servicePlusBackendStatus}</h4>
              <p className="text-sm text-amber-700">{texts.comparisonServiceLimited}</p>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Mode Selection */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-text-primary mb-3">{texts.comparisonMode}</h3>
        <div className="flex space-x-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="comparisonMode"
              value="database"
              checked={comparisonMode === 'database'}
              onChange={(e) => { setComparisonMode(e.target.value); resetComparison(); }}
              className="mr-2"
            />
            <div className="flex items-center space-x-2">
              <Icon name="Database" size={16} />
              <span>{texts.compareAnalyzedDocuments}</span>
              <span className="text-xs text-text-secondary">
                ({analyzedDocs.length} {texts.available}{selectedClientId ? ` ${texts.forThisClient}` : ''})
              </span>
            </div>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="comparisonMode"
              value="upload"
              checked={comparisonMode === 'upload'}
              onChange={(e) => { setComparisonMode(e.target.value); resetComparison(); }}
              className="mr-2"
            />
            <div className="flex items-center space-x-2">
              <Icon name="Upload" size={16} />
              <span>{texts.uploadNewFiles}</span>
            </div>
          </label>
        </div>
      </div>

      {/* Document Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderDocumentSelector(1)}
        {renderDocumentSelector(2)}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Icon name="AlertCircle" size={20} className="text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Compare / Reset Buttons */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={performComparison}
          disabled={
            comparing ||
            (comparisonMode === 'database' && (!selectedDoc1 || !selectedDoc2)) ||
            (comparisonMode === 'upload' && (!uploadedFile1 || !uploadedFile2))
          }
          className="flex items-center space-x-2 px-8 py-3 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {comparing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>{texts.comparingDocuments}</span>
            </>
          ) : (
            <>
              <Icon name="GitCompare" size={20} />
              <span>{texts.compareDocuments}</span>
            </>
          )}
        </button>
        {comparisonResult && (
          <button
            onClick={resetComparison}
            className="flex items-center space-x-2 px-6 py-3 border border-border-medium text-text-primary rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <Icon name="RotateCcw" size={16} />
            <span>{texts.newComparison}</span>
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {comparing && (
        <div className="bg-surface border border-border-light rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-primary">{texts.processingComparison}</span>
            <span className="text-sm text-text-secondary">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-text-secondary">
            {progress < 30 && texts.progressAnalyzingStructure}
            {progress >= 30 && progress < 60 && texts.progressSemanticComparison}
            {progress >= 60 && progress < 90 && texts.progressRunningAI}
            {progress >= 90 && texts.progressFinalizing}
          </div>
        </div>
      )}

      {/* Comparison Results */}
      {comparisonResult && (
        <div className="bg-surface border border-border-light rounded-lg p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-text-primary flex items-center space-x-2">
              <Icon name="BarChart3" size={24} className="text-primary" />
              <span>{texts.comparisonResults}</span>
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={exportAsPdf}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                title={texts.exportAsPDF}
              >
                <Icon name="FileOutput" size={16} />
                <span>{texts.exportPDF}</span>
              </button>
              <button
                onClick={exportComparisonReport}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                title={texts.exportAsJSON}
              >
                <Icon name="Download" size={16} />
                <span>{texts.exportJSON}</span>
              </button>
            </div>
          </div>

          {/* Documents Compared */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">{texts.documentsCompared}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Icon name="FileText" size={16} className="text-blue-600" />
                <span className="text-sm text-blue-800">
                  {comparisonMode === 'database' ? getDocumentName(selectedDoc1) : uploadedFile1?.name}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Icon name="FileText" size={16} className="text-green-600" />
                <span className="text-sm text-green-800">
                  {comparisonMode === 'database' ? getDocumentName(selectedDoc2) : uploadedFile2?.name}
                </span>
              </div>
            </div>
          </div>

          {/* Overall Similarity */}
          {comparisonResult.overall_similarity !== undefined && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-blue-900 flex items-center space-x-2">
                  <Icon name="Target" size={16} />
                  <span>{texts.overallSimilarity}</span>
                </h4>
                <span className="text-2xl font-bold text-blue-900">
                  {(comparisonResult.overall_similarity * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${comparisonResult.overall_similarity * 100}%` }}
                />
              </div>
              <div className="mt-2 text-sm text-blue-700">
                {comparisonResult.overall_similarity > 0.9 && texts.verySimilarDocuments}
                {comparisonResult.overall_similarity > 0.7 && comparisonResult.overall_similarity <= 0.9 && texts.moderatelySimilar}
                {comparisonResult.overall_similarity > 0.5 && comparisonResult.overall_similarity <= 0.7 && texts.somewhatSimilar}
                {comparisonResult.overall_similarity <= 0.5 && texts.significantlyDifferent}
              </div>
            </div>
          )}

          {/* Key Differences */}
          {comparisonResult.key_differences && comparisonResult.key_differences.length > 0 && (
            <div>
              <h4 className="font-semibold text-text-primary mb-3 flex items-center space-x-2">
                <Icon name="List" size={16} />
                <span>{texts.keyDifferences} ({comparisonResult.key_differences.length})</span>
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {comparisonResult.key_differences.slice(0, 8).map((diff, index) => (
                  <div key={index} className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-md">
                    <p className="text-sm text-yellow-800">{diff}</p>
                  </div>
                ))}
                {comparisonResult.key_differences.length > 8 && (
                  <div className="text-center text-sm text-text-secondary py-2">
                    ... {texts.and} {comparisonResult.key_differences.length - 8} {texts.moreDifferences}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI Analysis */}
          {comparisonResult.gemini_summary && (
            <div>
              <h4 className="font-semibold text-text-primary mb-3 flex items-center space-x-2">
                <Icon name="Zap" size={16} className="text-purple-600" />
                <span>{texts.aiAnalysis}</span>
                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">Gemini AI</span>
              </h4>
              <div className="bg-purple-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <div className="prose max-w-none text-sm text-purple-900">
                  {comparisonResult.gemini_summary.split('\n').map((paragraph, index) => (
                    paragraph.trim() && (
                      <p key={index} className="mb-3 leading-relaxed">{paragraph.trim()}</p>
                    )
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Clause-by-Clause Analysis */}
          {comparisonResult.semantic_clause_diff && comparisonResult.semantic_clause_diff.length > 0 && (
            <div>
              <h4 className="font-semibold text-text-primary mb-3 flex items-center space-x-2">
                <Icon name="Search" size={16} />
                <span>{texts.clauseByClauseAnalysis}</span>
                <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                  {comparisonResult.semantic_clause_diff.length} {texts.clauses}
                </span>
              </h4>
              <div className="space-y-3 max-h-96 overflow-y-auto border border-border-light rounded-lg p-4">
                {comparisonResult.semantic_clause_diff.slice(0, 5).map((item, index) => (
                  <div key={index} className={`p-3 rounded-lg border-l-4 ${getChangeTypeColor(item.change_type)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="flex items-center space-x-2">
                        <Icon name={getChangeTypeIcon(item.change_type)} size={14} />
                        <span className="text-xs font-medium uppercase">{item.change_type || 'IDENTICAL'}</span>
                      </span>
                      {item.semantic_similarity !== undefined && (
                        <span className="text-xs">{texts.similarity}: {(item.semantic_similarity * 100).toFixed(1)}%</span>
                      )}
                    </div>
                    <div className="text-sm space-y-2">
                      {item.doc1_clause && (
                        <div>
                          <span className="font-medium text-red-700">{texts.original}:</span>
                          <p className="text-red-800 mt-1 italic">{item.doc1_clause.substring(0, 150)}...</p>
                        </div>
                      )}
                      {item.doc2_clause && (
                        <div>
                          <span className="font-medium text-green-700">{texts.revised}:</span>
                          <p className="text-green-800 mt-1 italic">{item.doc2_clause.substring(0, 150)}...</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {comparisonResult.semantic_clause_diff.length > 5 && (
                  <div className="text-center py-3 text-text-secondary border-t">
                    <Icon name="MoreHorizontal" size={16} className="mx-auto mb-1" />
                    <span className="text-sm">{comparisonResult.semantic_clause_diff.length - 5} {texts.moreClausesAnalyzed}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Statistics */}
          {comparisonResult.clauses_compared && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-text-primary mb-3 flex items-center space-x-2">
                <Icon name="BarChart" size={16} />
                <span>{texts.analysisStatistics}</span>
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{comparisonResult.clauses_compared.document1}</div>
                  <div className="text-xs text-text-secondary">{texts.clausesInDoc1}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{comparisonResult.clauses_compared.document2}</div>
                  <div className="text-xs text-text-secondary">{texts.clausesInDoc2}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {comparisonResult.semantic_clause_diff?.filter(item => item.change_type === 'added').length || 0}
                  </div>
                  <div className="text-xs text-text-secondary">{texts.added}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {comparisonResult.semantic_clause_diff?.filter(item => item.change_type === 'removed').length || 0}
                  </div>
                  <div className="text-xs text-text-secondary">{texts.removed}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {comparisonResult.semantic_clause_diff?.filter(item => item.change_type === 'modified').length || 0}
                  </div>
                  <div className="text-xs text-text-secondary">{texts.modified}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentComparisonTool;