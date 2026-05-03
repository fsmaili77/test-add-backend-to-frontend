// src/pages/service-plus/components/DocumentGenerationTool.jsx - Functional component

import React, { useState, useEffect } from 'react';
import Icon from 'components/AppIcon';
import {
  getDocumentTemplates,
  generateDocument,
  getGeneratedDocuments,
  downloadGeneratedDocument,
  validateGenerationParameters
} from '../../../api/servicePlus';
import { useLanguage } from 'contexts/LanguageContext';

const DocumentGenerationTool = ({ documents }) => {
  const { texts } = useLanguage();

  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const [documentParams, setDocumentParams] = useState({
    service_provider: '',
    client: '',
    services_description: '',
    payment_terms: '',
    duration: '',
    start_date: '',
    notice_period: '',
    jurisdiction: 'california',
    effective_date: '',
    language: 'en',
    format: 'docx',
    ai_provider: 'gemini'
  });

  const [recentDocuments, setRecentDocuments] = useState([]);

  // Load templates on component mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoadingTemplates(true);
        const response = await getDocumentTemplates();
        setTemplates(response.templates || []);
      } catch (err) {
        console.error('Error loading templates:', err);
        setError(texts.failedToLoadTemplates);
      } finally {
        setLoadingTemplates(false);
      }
    };
    fetchTemplates();
  }, []);

  // Load recent generated documents
  useEffect(() => {
    const fetchRecentDocuments = async () => {
      try {
        const response = await getGeneratedDocuments(1, 5);
        setRecentDocuments(response.documents || []);
      } catch (err) {
        console.warn('Could not load recent documents:', err);
      }
    };
    fetchRecentDocuments();
  }, [generationResult]);

  const jurisdictions = [
    { value: 'federal',       label: 'Federal (US)' },
    { value: 'california',    label: 'California' },
    { value: 'newyork',       label: 'New York' },
    { value: 'texas',         label: 'Texas' },
    { value: 'florida',       label: 'Florida' },
    { value: 'illinois',      label: 'Illinois' },
    { value: 'international', label: texts.international },
  ];

  const getComplexityColor = (complexity) => {
    switch (complexity) {
      case 'Simple':  return 'bg-green-100 text-green-800';
      case 'Medium':  return 'bg-yellow-100 text-yellow-800';
      case 'Complex': return 'bg-orange-100 text-orange-800';
      case 'Expert':  return 'bg-red-100 text-red-800';
      default:        return 'bg-gray-100 text-gray-800';
    }
  };

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);

  const simulateProgress = () => {
    setProgress(10);
    setTimeout(() => setProgress(30),  500);
    setTimeout(() => setProgress(60), 2000);
    setTimeout(() => setProgress(90), 4000);
  };

  const handleGenerateDocument = async () => {
    if (!selectedTemplate) {
      setError(texts.selectTemplateFirst);
      return;
    }
    const requiredFields = selectedTemplateData?.required_fields || [];
    const validationErrors = validateGenerationParameters(selectedTemplate, documentParams, requiredFields);
    if (validationErrors.length > 0) {
      setError(validationErrors.join('; '));
      return;
    }
    setGenerating(true);
    setError(null);
    setGenerationResult(null);
    setProgress(0);
    simulateProgress();
    try {
      const params = {
        ...documentParams,
        effective_date: documentParams.effective_date || new Date().toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric'
        })
      };
      const result = await generateDocument(selectedTemplate, params, {
        format: documentParams.format,
        aiProvider: documentParams.ai_provider,
        validateCompliance: true
      });
      setProgress(100);
      setTimeout(() => { setGenerationResult(result); }, 500);
    } catch (err) {
      console.error('Generation error:', err);
      setError(err.message || texts.generationFailed);
      setProgress(0);
    } finally {
      setTimeout(() => { setGenerating(false); setProgress(0); }, 1000);
    }
  };

  const handleDownloadDocument = async (generationId) => {
    try {
      await downloadGeneratedDocument(generationId);
    } catch (err) {
      console.error('Download error:', err);
      setError(texts.failedToDownload);
    }
  };

  const resetGeneration = () => {
    setGenerationResult(null);
    setError(null);
    setProgress(0);
    if (selectedTemplateData?.sample_data) {
      setDocumentParams(prev => ({ ...prev, ...selectedTemplateData.sample_data }));
    }
  };

  // Update form when template changes
  useEffect(() => {
    if (selectedTemplateData?.sample_data) {
      setDocumentParams(prev => ({
        ...prev,
        ...selectedTemplateData.sample_data,
        jurisdiction: prev.jurisdiction,
        language: prev.language,
        format: prev.format,
        ai_provider: prev.ai_provider
      }));
    }
  }, [selectedTemplate, selectedTemplateData]);

  if (loadingTemplates) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">{texts.loadingTemplates}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Active Features Banner */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-3">
          <Icon name="CheckCircle" size={24} className="text-green-600" />
          <h3 className="text-lg font-semibold text-green-800">
            {texts.documentGenerationActive}
          </h3>
        </div>
        <p className="text-green-700 mb-4">{texts.documentGenerationDesc}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ul className="list-disc list-inside text-green-700 space-y-1">
            <li>{texts.featureProfessionalTemplates}</li>
            <li>{texts.featureAiEnhancement}</li>
            <li>{texts.featureComplianceValidation}</li>
            <li>{texts.featureMultipleFormats}</li>
          </ul>
          <ul className="list-disc list-inside text-green-700 space-y-1">
            <li>{texts.featureJurisdiction}</li>
            <li>{texts.featureParameterValidation}</li>
            <li>{texts.featureGenerationHistory}</li>
            <li>{texts.featureProfessionalFormatting}</li>
          </ul>
        </div>
      </div>

      {/* Template Selection */}
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          {texts.availableTemplates} ({templates.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`bg-surface border border-border-light rounded-lg p-4 transition-all duration-200 cursor-pointer ${
                selectedTemplate === template.id
                  ? 'border-primary ring-2 ring-primary ring-opacity-20'
                  : 'hover:border-primary'
              }`}
              onClick={() => setSelectedTemplate(template.id)}
            >
              <div className="flex items-start space-x-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon name="FileText" size={20} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-text-primary truncate">{template.name}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-text-secondary">{template.category}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${getComplexityColor(template.complexity)}`}>
                      {template.complexity}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-text-secondary mb-3 line-clamp-2">{template.description}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">
                  {template.required_fields?.length || 0} {texts.requiredFields}
                </span>
                <span className="text-primary font-medium">{template.jurisdiction}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Generation Form */}
      {selectedTemplate && (
        <div className="bg-surface border border-border-light rounded-lg p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            {texts.generate} {selectedTemplateData?.name}
          </h3>

          {selectedTemplateData && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Icon name="FileText" size={20} className="text-blue-600" />
                <div>
                  <h4 className="font-medium text-blue-900">{selectedTemplateData.name}</h4>
                  <p className="text-sm text-blue-700">{selectedTemplateData.description}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {selectedTemplateData?.required_fields?.includes('service_provider') && (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  {texts.serviceProvider} *
                </label>
                <textarea
                  value={documentParams.service_provider || ''}
                  onChange={(e) => setDocumentParams(prev => ({ ...prev, service_provider: e.target.value }))}
                  placeholder={texts.serviceProviderPlaceholder}
                  rows={3}
                  className="w-full border border-border-medium rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            )}

            {selectedTemplateData?.required_fields?.includes('client') && (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  {texts.client} *
                </label>
                <textarea
                  value={documentParams.client || ''}
                  onChange={(e) => setDocumentParams(prev => ({ ...prev, client: e.target.value }))}
                  placeholder={texts.clientDetailsPlaceholder}
                  rows={3}
                  className="w-full border border-border-medium rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            )}

            {selectedTemplateData?.required_fields?.includes('services_description') && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  {texts.servicesDescription} *
                </label>
                <textarea
                  value={documentParams.services_description || ''}
                  onChange={(e) => setDocumentParams(prev => ({ ...prev, services_description: e.target.value }))}
                  placeholder={texts.servicesDescriptionPlaceholder}
                  rows={4}
                  className="w-full border border-border-medium rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            )}

            {selectedTemplateData?.required_fields?.includes('payment_terms') && (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  {texts.paymentTerms} *
                </label>
                <textarea
                  value={documentParams.payment_terms || ''}
                  onChange={(e) => setDocumentParams(prev => ({ ...prev, payment_terms: e.target.value }))}
                  placeholder={texts.paymentTermsPlaceholder}
                  rows={3}
                  className="w-full border border-border-medium rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            )}

            {selectedTemplateData?.required_fields?.includes('duration') && (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  {texts.duration} *
                </label>
                <input
                  type="text"
                  value={documentParams.duration || ''}
                  onChange={(e) => setDocumentParams(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder={texts.durationPlaceholder}
                  className="w-full border border-border-medium rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            )}

            {/* Jurisdiction */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                {texts.jurisdiction}
              </label>
              <select
                value={documentParams.jurisdiction}
                onChange={(e) => setDocumentParams(prev => ({ ...prev, jurisdiction: e.target.value }))}
                className="w-full border border-border-medium rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {jurisdictions.map((j) => (
                  <option key={j.value} value={j.value}>{j.label}</option>
                ))}
              </select>
            </div>

            {/* Export Format */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                {texts.exportFormat}
              </label>
              <select
                value={documentParams.format}
                onChange={(e) => setDocumentParams(prev => ({ ...prev, format: e.target.value }))}
                className="w-full border border-border-medium rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="docx">{texts.formatDocx}</option>
                <option value="pdf">{texts.formatPdf}</option>
                <option value="txt">{texts.formatTxt}</option>
              </select>
            </div>

            {/* AI Provider */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                {texts.aiProvider}
              </label>
              <select
                value={documentParams.ai_provider}
                onChange={(e) => setDocumentParams(prev => ({ ...prev, ai_provider: e.target.value }))}
                className="w-full border border-border-medium rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="gemini">Gemini AI</option>
                <option value="openai">OpenAI GPT</option>
              </select>
            </div>

            {/* Effective Date */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                {texts.effectiveDate}
              </label>
              <input
                type="date"
                value={documentParams.effective_date
                  ? new Date(documentParams.effective_date).toISOString().split('T')[0]
                  : ''}
                onChange={(e) => setDocumentParams(prev => ({
                  ...prev,
                  effective_date: e.target.value
                    ? new Date(e.target.value).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                    : ''
                }))}
                className="w-full border border-border-medium rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Icon name="AlertCircle" size={20} className="text-red-600" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex justify-center space-x-4">
            <button
              onClick={handleGenerateDocument}
              disabled={generating || !selectedTemplate}
              className="flex items-center space-x-2 px-8 py-3 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{texts.generatingDocument}</span>
                </>
              ) : (
                <>
                  <Icon name="FileText" size={20} />
                  <span>{texts.generateDocument}</span>
                </>
              )}
            </button>
            {generationResult && (
              <button
                onClick={resetGeneration}
                className="flex items-center space-x-2 px-6 py-3 border border-border-medium text-text-primary rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <Icon name="RotateCcw" size={16} />
                <span>{texts.newGeneration}</span>
              </button>
            )}
          </div>

          {/* Progress Bar */}
          {generating && (
            <div className="mt-6 bg-surface border border-border-light rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-text-primary">{texts.generatingDocument}...</span>
                <span className="text-sm text-text-secondary">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-text-secondary">
                {progress < 30  && texts.progressProcessingTemplate}
                {progress >= 30 && progress < 60 && texts.progressGeneratingContent}
                {progress >= 60 && progress < 90 && texts.progressValidatingCompliance}
                {progress >= 90 && texts.progressFinalizing}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generation Result */}
      {generationResult && (
        <div className="bg-surface border border-border-light rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-text-primary flex items-center space-x-2">
              <Icon name="CheckCircle" size={24} className="text-green-600" />
              <span>{texts.documentGeneratedSuccessfully}</span>
            </h3>
            <button
              onClick={() => handleDownloadDocument(generationResult.generation_id)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
            >
              <Icon name="Download" size={16} />
              <span>{texts.downloadDocument}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-medium text-text-primary mb-2">{texts.documentDetails}</h4>
              <div className="space-y-2 text-sm">
                {[
                  { label: texts.templateLabel,      value: generationResult.template_name },
                  { label: texts.exportFormat,        value: generationResult.format_type?.toUpperCase() },
                  { label: texts.aiProvider,          value: generationResult.ai_provider },
                  { label: texts.generationTime,      value: `${generationResult.generation_time_ms}ms` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-text-secondary">{label}:</span>
                    <span className="text-text-primary">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {generationResult.compliance_validation && (
              <div>
                <h4 className="font-medium text-text-primary mb-2">{texts.complianceStatus}</h4>
                <div className={`p-3 rounded-lg ${
                  generationResult.compliance_validation.status === 'compliant'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-yellow-50 border border-yellow-200'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <Icon
                      name={generationResult.compliance_validation.status === 'compliant' ? 'CheckCircle' : 'AlertTriangle'}
                      size={16}
                      className={generationResult.compliance_validation.status === 'compliant' ? 'text-green-600' : 'text-yellow-600'}
                    />
                    <span className={`text-sm font-medium ${
                      generationResult.compliance_validation.status === 'compliant' ? 'text-green-800' : 'text-yellow-800'
                    }`}>
                      {generationResult.compliance_validation.status === 'compliant'
                        ? texts.compliant
                        : texts.reviewRequired}
                    </span>
                  </div>
                  {generationResult.compliance_validation.issues?.length > 0 && (
                    <ul className="text-xs space-y-1">
                      {generationResult.compliance_validation.issues.slice(0, 3).map((issue, index) => (
                        <li key={index} className="text-yellow-700">• {issue}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium text-text-primary mb-2">{texts.generatedContentPreview}</h4>
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                {generationResult.generated_content?.substring(0, 1000)}
                {generationResult.generated_content?.length > 1000 && '\n\n... [Content truncated for preview]'}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Recent Generated Documents */}
      {recentDocuments.length > 0 && (
        <div className="bg-surface border border-border-light rounded-lg p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            {texts.recentGeneratedDocuments}
          </h3>
          <div className="space-y-3">
            {recentDocuments.map((doc) => (
              <div
                key={doc.generation_id}
                className="flex items-center justify-between p-3 border border-border-medium rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Icon name="FileText" size={16} className="text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">{doc.document_name}</p>
                    <p className="text-xs text-text-secondary">
                      {doc.template_id} • {doc.format_type} • {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadDocument(doc.generation_id)}
                  className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  <Icon name="Download" size={14} />
                  <span>{texts.downloadDocument}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentGenerationTool;