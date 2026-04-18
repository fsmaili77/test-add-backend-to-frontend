// src/pages/service-plus/components/DocumentComparisonTool.jsx

import React, { useState, useRef } from 'react';
import Icon from 'components/AppIcon';
import { formatFileSize } from '../../../api';

// NEW props: selectedClientId, clients
const DocumentComparisonTool = ({ documents, onStatsUpdate, backendHealth, selectedClientId, clients = [] }) => {
  const [comparisonMode, setComparisonMode] = useState('database'); // 'database' or 'upload'
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

  // Documents are already pre-filtered by parent (user + optional client).
  // Only show analyzed ones for the database comparison mode.
  const analyzedDocs = documents.filter(doc => doc.status === 'Analyzed');

  // Helper: get client name for label
  const getClientName = (clientId) => {
    if (!clientId) return null;
    return clients.find(c => c.id === clientId || String(c.id) === String(clientId))?.name || `Client #${clientId}`;
  };

  const validateFile = (file) => {
    const errors = [];
    const maxFileSize = 50 * 1024 * 1024; // 50MB
    const supportedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    if (!supportedTypes.includes(file.type)) {
      errors.push(`Unsupported format: ${file.name.split('.').pop().toUpperCase()}. Supported: PDF, DOCX, TXT`);
    }
    if (file.size > maxFileSize) {
      errors.push(`File too large: ${formatFileSize(file.size)} (max 50MB)`);
    }
    return errors;
  };

  const handleFileUpload = (file, docNumber) => {
    if (!file) return;
    const errors = validateFile(file);
    if (errors.length > 0) {
      setError(errors.join('; '));
      return;
    }
    if (docNumber === 1) {
      setUploadedFile1(file);
    } else {
      setUploadedFile2(file);
    }
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
        if (!selectedDoc1 || !selectedDoc2) {
          throw new Error('Please select two documents to compare.');
        }
        if (selectedDoc1 === selectedDoc2) {
          throw new Error('Cannot compare a document with itself. Please select two different documents.');
        }
        formData.append('doc1_id', selectedDoc1);
        formData.append('doc2_id', selectedDoc2);
      } else {
        if (!uploadedFile1 || !uploadedFile2) {
          throw new Error('Please upload two files to compare.');
        }
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
      setError(err.message || 'Comparison failed. Please try again.');
      setProgress(0);
    } finally {
      setTimeout(() => {
        setComparing(false);
        setProgress(0);
      }, 1000);
    }
  };

  const getDocumentName = (docId) => {
    const doc = documents.find(d => d.id == docId);
    return doc ? doc.filename : 'Unknown Document';
  };

  const getDocumentInfo = (docId) => {
    const doc = documents.find(d => d.id == docId);
    return doc ? {
      name: doc.filename,
      size: formatFileSize(doc.size || 0),
      type: doc.type || 'Document',
      uploadDate: doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'Unknown',
      clientName: doc.client_id ? getClientName(doc.client_id) : null,
    } : null;
  };

  // Export as JSON
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

  // Export as PDF using browser print dialog
  const exportAsPdf = () => {
    if (!comparisonResult) return;

    const doc1Name = comparisonMode === 'database' ? getDocumentName(selectedDoc1) : uploadedFile1?.name;
    const doc2Name = comparisonMode === 'database' ? getDocumentName(selectedDoc2) : uploadedFile2?.name;
    const timestamp = new Date().toLocaleString();
    const similarity = comparisonResult.overall_similarity != null
      ? `${(comparisonResult.overall_similarity * 100).toFixed(1)}%`
      : 'N/A';
    const similarityPct = comparisonResult.overall_similarity != null
      ? comparisonResult.overall_similarity * 100
      : 0;

    const diffRows = (comparisonResult.key_differences || [])
      .map((d, i) => `<tr><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;color:#92400e;">${i + 1}.</td><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;color:#78350f;">${d}</td></tr>`)
      .join('');

    const clauseRows = (comparisonResult.semantic_clause_diff || []).slice(0, 10)
      .map((item) => {
        const colorMap = { added: '#d1fae5', removed: '#fee2e2', modified: '#fef3c7' };
        const bg = colorMap[item.change_type] || '#f3f4f6';
        return `
          <div style="margin-bottom:10px;padding:10px;background:${bg};border-radius:6px;font-size:12px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
              <strong style="text-transform:uppercase;font-size:11px;">${item.change_type || 'IDENTICAL'}</strong>
              ${item.semantic_similarity != null ? `<span>Similarity: ${(item.semantic_similarity * 100).toFixed(1)}%</span>` : ''}
            </div>
            ${item.doc1_clause ? `<div><strong>Original:</strong> <em>${item.doc1_clause.substring(0, 200)}...</em></div>` : ''}
            ${item.doc2_clause ? `<div style="margin-top:4px;"><strong>Revised:</strong> <em>${item.doc2_clause.substring(0, 200)}...</em></div>` : ''}
          </div>`;
      }).join('');

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Document Comparison Report</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; margin: 0; padding: 40px; color: #111827; font-size: 13px; line-height: 1.5; }
    h1 { font-size: 24px; color: #1d4ed8; border-bottom: 3px solid #1d4ed8; padding-bottom: 10px; margin-bottom: 20px; }
    h2 { font-size: 15px; color: #374151; margin: 24px 0 10px; display: flex; align-items: center; gap: 6px; }
    h2::before { content: ''; display: inline-block; width: 4px; height: 16px; background: #1d4ed8; border-radius: 2px; }
    .meta-grid { display: grid; grid-template-columns: 160px 1fr; gap: 4px 12px; background: #eff6ff; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px; }
    .meta-grid .label { font-weight: 600; color: #1e40af; }
    .meta-grid .value { color: #1d4ed8; }
    .similarity-section { background: linear-gradient(135deg, #eff6ff, #f5f3ff); border-radius: 8px; padding: 14px 16px; margin-bottom: 20px; }
    .similarity-number { font-size: 32px; font-weight: 700; color: #1e3a8a; }
    .bar-bg { background: #bfdbfe; border-radius: 999px; height: 12px; margin: 8px 0 4px; }
    .bar-fill { background: linear-gradient(90deg, #3b82f6, #8b5cf6); height: 12px; border-radius: 999px; }
    .bar-label { font-size: 12px; color: #3730a3; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #f97316; color: white; padding: 8px; text-align: left; }
    .ai-box { background: #f5f3ff; border-left: 4px solid #7c3aed; padding: 14px 16px; border-radius: 4px; white-space: pre-wrap; font-size: 12px; color: #4c1d95; line-height: 1.6; }
    .stats-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; text-align: center; background: #f9fafb; border-radius: 8px; padding: 14px; }
    .stat-num { font-size: 24px; font-weight: 700; }
    .stat-lbl { font-size: 11px; color: #6b7280; }
    .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }
    @media print {
      body { padding: 20px; }
      @page { margin: 15mm; }
    }
  </style>
</head>
<body>
  <h1>📄 Document Comparison Report</h1>

  <div class="meta-grid">
    <span class="label">Generated</span><span class="value">${timestamp}</span>
    <span class="label">Document 1</span><span class="value">${doc1Name || '—'}</span>
    <span class="label">Document 2</span><span class="value">${doc2Name || '—'}</span>
    <span class="label">Mode</span><span class="value">${comparisonMode === 'database' ? 'Analyzed Documents' : 'Uploaded Files'}</span>
    ${comparisonResult.comparison_id ? `<span class="label">Comparison ID</span><span class="value">${comparisonResult.comparison_id}</span>` : ''}
  </div>

  <h2>Overall Similarity</h2>
  <div class="similarity-section">
    <div class="similarity-number">${similarity}</div>
    <div class="bar-bg"><div class="bar-fill" style="width:${similarityPct}%"></div></div>
    <div class="bar-label">
      ${similarityPct > 90 ? 'Very similar documents' :
        similarityPct > 70 ? 'Moderately similar documents' :
        similarityPct > 50 ? 'Somewhat similar documents' :
        'Significantly different documents'}
    </div>
  </div>

  ${comparisonResult.clauses_compared ? `
  <h2>Analysis Statistics</h2>
  <div class="stats-grid">
    <div><div class="stat-num" style="color:#3b82f6">${comparisonResult.clauses_compared.document1 || 0}</div><div class="stat-lbl">Clauses Doc 1</div></div>
    <div><div class="stat-num" style="color:#10b981">${comparisonResult.clauses_compared.document2 || 0}</div><div class="stat-lbl">Clauses Doc 2</div></div>
    <div><div class="stat-num" style="color:#10b981">${(comparisonResult.semantic_clause_diff || []).filter(i => i.change_type === 'added').length}</div><div class="stat-lbl">Added</div></div>
    <div><div class="stat-num" style="color:#ef4444">${(comparisonResult.semantic_clause_diff || []).filter(i => i.change_type === 'removed').length}</div><div class="stat-lbl">Removed</div></div>
    <div><div class="stat-num" style="color:#f59e0b">${(comparisonResult.semantic_clause_diff || []).filter(i => i.change_type === 'modified').length}</div><div class="stat-lbl">Modified</div></div>
  </div>` : ''}

  ${diffRows ? `
  <h2>Key Differences (${(comparisonResult.key_differences || []).length})</h2>
  <table>
    <thead><tr><th style="width:40px">#</th><th>Difference</th></tr></thead>
    <tbody>${diffRows}</tbody>
  </table>` : ''}

  ${comparisonResult.gemini_summary ? `
  <h2>AI Analysis (Gemini)</h2>
  <div class="ai-box">${comparisonResult.gemini_summary}</div>` : ''}

  ${clauseRows ? `
  <h2>Clause-by-Clause Analysis (first 10)</h2>
  ${clauseRows}` : ''}

  <div class="footer">Generated by Legal Analyzer Service+ &nbsp;|&nbsp; ${timestamp}</div>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (!win) {
      setError('Pop-up blocked. Please allow pop-ups and try again.');
      return;
    }
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

  return (
    <div className="space-y-6">

      {/* Backend Status Warning */}
      {!isServicePlusAvailable && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Icon name="AlertTriangle" size={20} className="text-amber-600" />
            <div>
              <h4 className="font-medium text-amber-800">Service+ Backend Status</h4>
              <p className="text-sm text-amber-700">
                Document comparison service may be limited. Please ensure the backend is running properly.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Mode Selection */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-text-primary mb-3">Comparison Mode</h3>
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
              <span>Compare Analyzed Documents</span>
              <span className="text-xs text-text-secondary">
                ({analyzedDocs.length} available{selectedClientId ? ' for this client' : ''})
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
              <span>Upload New Files</span>
            </div>
          </label>
        </div>
      </div>

      {/* Document Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Document 1 */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-text-primary mb-4 flex items-center space-x-2">
            <Icon name="FileText" size={20} className="text-blue-600" />
            <span>Document 1</span>
          </h3>

          {comparisonMode === 'database' ? (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Select Document
              </label>
              {analyzedDocs.length === 0 ? (
                <div className="text-center py-6 text-text-secondary text-sm border border-dashed border-border-medium rounded-lg">
                  <Icon name="FileX" size={24} className="mx-auto mb-2 opacity-50" />
                  <p>
                    {selectedClientId
                      ? 'No analyzed documents for this client.'
                      : 'No analyzed documents available.'}
                  </p>
                </div>
              ) : (
                <select
                  value={selectedDoc1}
                  onChange={(e) => setSelectedDoc1(e.target.value)}
                  className="w-full border border-border-medium rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">Choose a document...</option>
                  {analyzedDocs.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.filename} ({formatFileSize(doc.size)}) — {doc.type}
                      {!selectedClientId && doc.client_id ? ` · ${getClientName(doc.client_id)}` : ''}
                    </option>
                  ))}
                </select>
              )}
              {selectedDoc1 && (() => {
                const docInfo = getDocumentInfo(selectedDoc1);
                return docInfo ? (
                  <div className="mt-3 p-3 bg-blue-50 rounded-md text-sm">
                    <div className="font-medium text-blue-900">{docInfo.name}</div>
                    <div className="text-blue-700 space-y-0.5 mt-1">
                      <div>Size: {docInfo.size}</div>
                      <div>Type: {docInfo.type}</div>
                      <div>Uploaded: {docInfo.uploadDate}</div>
                      {docInfo.clientName && <div>Client: {docInfo.clientName}</div>}
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Upload File</label>
              <div
                className="border-2 border-dashed border-border-medium rounded-lg p-6 text-center hover:border-primary transition-colors duration-200 cursor-pointer"
                onClick={() => fileInput1Ref.current?.click()}
              >
                <input
                  ref={fileInput1Ref}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => handleFileUpload(e.target.files[0], 1)}
                  className="hidden"
                />
                <Icon name="Upload" size={32} className="text-text-secondary mx-auto mb-2" />
                <p className="text-sm text-text-primary font-medium">Click to upload or drag and drop</p>
                <p className="text-xs text-text-secondary mt-1">PDF, DOCX, TXT (max 50MB)</p>
              </div>
              {uploadedFile1 && (
                <div className="mt-3 p-3 bg-green-50 rounded-md">
                  <div className="flex items-center space-x-2">
                    <Icon name="CheckCircle" size={16} className="text-green-600" />
                    <div className="text-sm">
                      <div className="font-medium text-green-900">{uploadedFile1.name}</div>
                      <div className="text-green-700">{formatFileSize(uploadedFile1.size)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Document 2 */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-text-primary mb-4 flex items-center space-x-2">
            <Icon name="FileText" size={20} className="text-green-600" />
            <span>Document 2</span>
          </h3>

          {comparisonMode === 'database' ? (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Select Document
              </label>
              {analyzedDocs.length === 0 ? (
                <div className="text-center py-6 text-text-secondary text-sm border border-dashed border-border-medium rounded-lg">
                  <Icon name="FileX" size={24} className="mx-auto mb-2 opacity-50" />
                  <p>
                    {selectedClientId
                      ? 'No analyzed documents for this client.'
                      : 'No analyzed documents available.'}
                  </p>
                </div>
              ) : (
                <select
                  value={selectedDoc2}
                  onChange={(e) => setSelectedDoc2(e.target.value)}
                  className="w-full border border-border-medium rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">Choose a document...</option>
                  {analyzedDocs.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.filename} ({formatFileSize(doc.size)}) — {doc.type}
                      {!selectedClientId && doc.client_id ? ` · ${getClientName(doc.client_id)}` : ''}
                    </option>
                  ))}
                </select>
              )}
              {selectedDoc2 && (() => {
                const docInfo = getDocumentInfo(selectedDoc2);
                return docInfo ? (
                  <div className="mt-3 p-3 bg-green-50 rounded-md text-sm">
                    <div className="font-medium text-green-900">{docInfo.name}</div>
                    <div className="text-green-700 space-y-0.5 mt-1">
                      <div>Size: {docInfo.size}</div>
                      <div>Type: {docInfo.type}</div>
                      <div>Uploaded: {docInfo.uploadDate}</div>
                      {docInfo.clientName && <div>Client: {docInfo.clientName}</div>}
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Upload File</label>
              <div
                className="border-2 border-dashed border-border-medium rounded-lg p-6 text-center hover:border-primary transition-colors duration-200 cursor-pointer"
                onClick={() => fileInput2Ref.current?.click()}
              >
                <input
                  ref={fileInput2Ref}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => handleFileUpload(e.target.files[0], 2)}
                  className="hidden"
                />
                <Icon name="Upload" size={32} className="text-text-secondary mx-auto mb-2" />
                <p className="text-sm text-text-primary font-medium">Click to upload or drag and drop</p>
                <p className="text-xs text-text-secondary mt-1">PDF, DOCX, TXT (max 50MB)</p>
              </div>
              {uploadedFile2 && (
                <div className="mt-3 p-3 bg-green-50 rounded-md">
                  <div className="flex items-center space-x-2">
                    <Icon name="CheckCircle" size={16} className="text-green-600" />
                    <div className="text-sm">
                      <div className="font-medium text-green-900">{uploadedFile2.name}</div>
                      <div className="text-green-700">{formatFileSize(uploadedFile2.size)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
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
              <span>Comparing Documents...</span>
            </>
          ) : (
            <>
              <Icon name="GitCompare" size={20} />
              <span>Compare Documents</span>
            </>
          )}
        </button>

        {comparisonResult && (
          <button
            onClick={resetComparison}
            className="flex items-center space-x-2 px-6 py-3 border border-border-medium text-text-primary rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <Icon name="RotateCcw" size={16} />
            <span>New Comparison</span>
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {comparing && (
        <div className="bg-surface border border-border-light rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-primary">Processing comparison...</span>
            <span className="text-sm text-text-secondary">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-text-secondary">
            {progress < 30 && 'Analyzing document structure...'}
            {progress >= 30 && progress < 60 && 'Performing semantic comparison...'}
            {progress >= 60 && progress < 90 && 'Running AI analysis...'}
            {progress >= 90 && 'Finalizing results...'}
          </div>
        </div>
      )}

      {/* ── Comparison Results ── */}
      {comparisonResult && (
        <div className="bg-surface border border-border-light rounded-lg p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-text-primary flex items-center space-x-2">
              <Icon name="BarChart3" size={24} className="text-primary" />
              <span>Comparison Results</span>
            </h3>

            {/* ── Export Buttons ── */}
            <div className="flex items-center space-x-2">
              <button
                onClick={exportAsPdf}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                title="Export report as PDF"
              >
                <Icon name="FileOutput" size={16} />
                <span>Export PDF</span>
              </button>
              <button
                onClick={exportComparisonReport}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                title="Export raw data as JSON"
              >
                <Icon name="Download" size={16} />
                <span>Export JSON</span>
              </button>
            </div>
          </div>

          {/* Documents Being Compared */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Documents Compared</h4>
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
                  <span>Overall Similarity</span>
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
                {comparisonResult.overall_similarity > 0.9 && 'Very similar documents'}
                {comparisonResult.overall_similarity > 0.7 && comparisonResult.overall_similarity <= 0.9 && 'Moderately similar documents'}
                {comparisonResult.overall_similarity > 0.5 && comparisonResult.overall_similarity <= 0.7 && 'Somewhat similar documents'}
                {comparisonResult.overall_similarity <= 0.5 && 'Significantly different documents'}
              </div>
            </div>
          )}

          {/* Key Differences */}
          {comparisonResult.key_differences && comparisonResult.key_differences.length > 0 && (
            <div>
              <h4 className="font-semibold text-text-primary mb-3 flex items-center space-x-2">
                <Icon name="List" size={16} />
                <span>Key Differences ({comparisonResult.key_differences.length})</span>
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {comparisonResult.key_differences.slice(0, 8).map((diff, index) => (
                  <div key={index} className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-md">
                    <p className="text-sm text-yellow-800">{diff}</p>
                  </div>
                ))}
                {comparisonResult.key_differences.length > 8 && (
                  <div className="text-center text-sm text-text-secondary py-2">
                    ... and {comparisonResult.key_differences.length - 8} more differences
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Gemini AI Analysis */}
          {comparisonResult.gemini_summary && (
            <div>
              <h4 className="font-semibold text-text-primary mb-3 flex items-center space-x-2">
                <Icon name="Zap" size={16} className="text-purple-600" />
                <span>AI Analysis</span>
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
                <span>Clause-by-Clause Analysis</span>
                <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                  {comparisonResult.semantic_clause_diff.length} clauses
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
                        <span className="text-xs">Similarity: {(item.semantic_similarity * 100).toFixed(1)}%</span>
                      )}
                    </div>
                    <div className="text-sm space-y-2">
                      {item.doc1_clause && (
                        <div>
                          <span className="font-medium text-red-700">Original:</span>
                          <p className="text-red-800 mt-1 italic">{item.doc1_clause.substring(0, 150)}...</p>
                        </div>
                      )}
                      {item.doc2_clause && (
                        <div>
                          <span className="font-medium text-green-700">Revised:</span>
                          <p className="text-green-800 mt-1 italic">{item.doc2_clause.substring(0, 150)}...</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {comparisonResult.semantic_clause_diff.length > 5 && (
                  <div className="text-center py-3 text-text-secondary border-t">
                    <Icon name="MoreHorizontal" size={16} className="mx-auto mb-1" />
                    <span className="text-sm">{comparisonResult.semantic_clause_diff.length - 5} more clauses analyzed</span>
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
                <span>Analysis Statistics</span>
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{comparisonResult.clauses_compared.document1}</div>
                  <div className="text-xs text-text-secondary">Clauses in Doc 1</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{comparisonResult.clauses_compared.document2}</div>
                  <div className="text-xs text-text-secondary">Clauses in Doc 2</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {comparisonResult.semantic_clause_diff?.filter(item => item.change_type === 'added').length || 0}
                  </div>
                  <div className="text-xs text-text-secondary">Added</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {comparisonResult.semantic_clause_diff?.filter(item => item.change_type === 'removed').length || 0}
                  </div>
                  <div className="text-xs text-text-secondary">Removed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {comparisonResult.semantic_clause_diff?.filter(item => item.change_type === 'modified').length || 0}
                  </div>
                  <div className="text-xs text-text-secondary">Modified</div>
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