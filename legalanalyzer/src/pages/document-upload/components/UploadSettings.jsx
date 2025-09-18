// legalanalyzer/src/pages/document-upload/components/UploadSettings.jsx - Updated for Python backend
import React from 'react';
import Icon from 'components/AppIcon';

const UploadSettings = ({ settings, onSettingsChange, isUploading, backendHealth }) => {
  const handleChange = (key, value) => {
    onSettingsChange(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Updated classification options to match Python backend document types
  const classificationOptions = [
    { value: 'auto', label: 'Auto-detect', description: 'Let Gemini AI determine document type automatically' },
    { value: 'contract', label: 'Contract', description: 'Legal agreements and contracts' },
    { value: 'judgment', label: 'Court Judgment', description: 'Court decisions and rulings' },
    { value: 'brief', label: 'Legal Brief', description: 'Legal briefs and motions' },
    { value: 'regulation', label: 'Regulation', description: 'Laws and regulatory documents' },
    { value: 'case_law', label: 'Case Law', description: 'Court decisions and precedents' },
    { value: 'pleading', label: 'Pleading', description: 'Court pleadings and filings' },
    { value: 'agreement', label: 'Agreement', description: 'Legal agreements and settlements' },
    { value: 'other', label: 'Other', description: 'General legal documents' }
  ];

  // Language options based on Python backend OCR support
  const languageOptions = [
    { value: 'en', label: 'English', code: 'eng' },
    { value: 'fr', label: 'French', code: 'fra' },
    { value: 'de', label: 'German', code: 'deu' },
    { value: 'es', label: 'Spanish', code: 'spa' },
    { value: 'it', label: 'Italian', code: 'ita' },
    { value: 'pt', label: 'Portuguese', code: 'por' },
    { value: 'nl', label: 'Dutch', code: 'nld' }
  ];

  return (
    <div className="bg-surface rounded-lg border border-border-light p-6">
      <h3 className="font-semibold text-text-primary mb-4 flex items-center space-x-2">
        <Icon name="Settings" size={20} />
        <span>Upload Settings</span>
      </h3>

      <div className="space-y-6">
        {/* Backend Status Banner */}
        {backendHealth && (
          <div className={`p-3 rounded-lg border ${
            backendHealth.overall_status === 'healthy'
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center space-x-2">
              <Icon 
                name={backendHealth.overall_status === 'healthy' ? 'CheckCircle' : 'AlertCircle'} 
                size={16} 
                className={backendHealth.overall_status === 'healthy' ? 'text-green-600' : 'text-red-600'} 
              />
              <span className={`text-sm font-medium ${
                backendHealth.overall_status === 'healthy' ? 'text-green-800' : 'text-red-800'
              }`}>
                Python Backend: {backendHealth.overall_status === 'healthy' ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        )}

        {/* Document Classification */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Document Type
          </label>
          <select
            value={settings.classification}
            onChange={(e) => handleChange('classification', e.target.value)}
            disabled={isUploading || backendHealth?.overall_status !== 'healthy'}
            className="w-full p-3 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
          >
            {classificationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-text-secondary mt-1">
            {classificationOptions.find(opt => opt.value === settings.classification)?.description}
          </p>
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Document Language
          </label>
          <select
            value={settings.language || 'en'}
            onChange={(e) => handleChange('language', e.target.value)}
            disabled={isUploading || backendHealth?.overall_status !== 'healthy'}
            className="w-full p-3 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
          >
            {languageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-text-secondary mt-1">
            Primary language for OCR and analysis processing
          </p>
        </div>

        {/* Analysis Options */}
        <div className="border-t border-border-light pt-4">
          <h4 className="font-medium text-text-primary mb-3">Processing Options</h4>
          
          {/* Gemini AI Analysis - Always enabled for Python backend */}
          <div className="mb-4">
            <div className="flex items-start space-x-3">
              <div className="mt-1">
                <Icon name="Zap" size={16} className="text-primary" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-text-primary">
                  Gemini AI Analysis (Always Enabled)
                </span>
                <p className="text-xs text-text-secondary mt-1">
                  All documents are automatically analyzed using Google's Gemini AI for comprehensive legal analysis including court identification, party extraction, date recognition, and argument summarization.
                </p>
                <div className="mt-2 p-3 bg-blue-50 rounded border border-blue-200">
                  <div className="flex items-center space-x-2 mb-1">
                    <Icon name="Brain" size={14} className="text-blue-600" />
                    <span className="text-xs text-blue-700 font-medium">Gemini Features:</span>
                  </div>
                  <ul className="text-xs text-blue-600 space-y-0.5">
                    <li>• Intelligent document type classification</li>
                    <li>• Multi-language analysis support</li>
                    <li>• JSON-structured data extraction</li>
                    <li>• Court and jurisdiction identification</li>
                    <li>• Party and entity extraction</li>
                    <li>• Legal argument analysis</li>
                    <li>• Summary generation</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* OCR Toggle */}
          <div className="mb-4">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableOCR}
                onChange={(e) => handleChange('enableOCR', e.target.checked)}
                disabled={isUploading || backendHealth?.overall_status !== 'healthy'}
                className="mt-1 h-4 w-4 text-primary focus:ring-primary border-border-medium rounded disabled:cursor-not-allowed"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-text-primary">
                  Enable Advanced OCR
                </span>
                <p className="text-xs text-text-secondary mt-1">
                  Extract text from scanned documents and images using multi-language OCR powered by Tesseract.
                  Supports {languageOptions.length} languages with automatic text cleanup and formatting.
                </p>
                {settings.enableOCR && (
                  <div className="mt-2 p-3 bg-green-50 rounded border border-green-200">
                    <div className="flex items-center space-x-2 mb-1">
                      <Icon name="Eye" size={14} className="text-green-600" />
                      <span className="text-xs text-green-700 font-medium">OCR Capabilities:</span>
                    </div>
                    <ul className="text-xs text-green-600 space-y-0.5">
                      <li>• High-resolution image processing (300 DPI)</li>
                      <li>• Multi-language detection and processing</li>
                      <li>• Automatic text cleanup and formatting</li>
                      <li>• Fallback OCR for text-less PDF pages</li>
                      <li>• Enhanced accuracy for legal documents</li>
                    </ul>
                  </div>
                )}
              </div>
            </label>
          </div>

          {/* Extract Metadata Toggle */}
          <div className="mb-4">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.extractMetadata}
                onChange={(e) => handleChange('extractMetadata', e.target.checked)}
                disabled={isUploading || backendHealth?.overall_status !== 'healthy'}
                className="mt-1 h-4 w-4 text-primary focus:ring-primary border-border-medium rounded disabled:cursor-not-allowed"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-text-primary">
                  Extract Document Metadata
                </span>
                <p className="text-xs text-text-secondary mt-1">
                  Extract document properties like creation date, author, file format, and other metadata for enhanced analysis context.
                </p>
              </div>
            </label>
          </div>

          {/* Process in Background Toggle */}
          <div>
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.processInBackground}
                onChange={(e) => handleChange('processInBackground', e.target.checked)}
                disabled={isUploading || backendHealth?.overall_status !== 'healthy'}
                className="mt-1 h-4 w-4 text-primary focus:ring-primary border-border-medium rounded disabled:cursor-not-allowed"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-text-primary">
                  Process in Background
                </span>
                <p className="text-xs text-text-secondary mt-1">
                  Allow navigation away while Gemini analysis continues. You'll be notified when processing completes.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Custom Tags (Optional) */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Custom Tags (Optional)
          </label>
          <input
            type="text"
            value={settings.customTags}
            onChange={(e) => handleChange('customTags', e.target.value)}
            placeholder="Enter tags separated by commas"
            disabled={isUploading || backendHealth?.overall_status !== 'healthy'}
            className="w-full p-3 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed text-sm"
          />
          <p className="text-xs text-text-secondary mt-1">
            Add custom tags to help organize and search your documents
          </p>
        </div>

        {/* Processing Time Estimate */}
        {(settings.enableOCR || settings.enableAdvancedAnalysis) && backendHealth?.overall_status === 'healthy' && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <Icon name="Clock" size={16} className="text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Processing Time Estimate</p>
                <p className="text-xs text-amber-700">
                  {settings.enableOCR 
                    ? "Gemini AI Analysis + OCR: ~45-60 seconds per document"
                    : "Gemini AI Analysis: ~30-45 seconds per document"
                  }
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Processing time depends on document size, complexity, and current server load.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Backend Unavailable Warning */}
        {backendHealth?.overall_status !== 'healthy' && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <Icon name="AlertTriangle" size={16} className="text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Backend Service Unavailable</p>
                <p className="text-xs text-red-700">
                  The Python Flask backend is currently unavailable. Please check your connection and try again.
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Upload functionality will be disabled until the service is restored.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Python Backend Technical Info */}
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <Icon name="Server" size={16} className="text-gray-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-800">Backend Information</p>
              <p className="text-xs text-gray-700">
                Powered by Python Flask with Google Gemini AI integration. Documents are processed and stored in SQL Server database with structured JSON analysis results.
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div>
                  <strong>Supported formats:</strong><br/>
                  PDF, DOCX, TXT, DOC
                </div>
                <div>
                  <strong>Max file size:</strong><br/>
                  50 MB per file
                </div>
                <div>
                  <strong>Database:</strong><br/>
                  SQL Server
                </div>
                <div>
                  <strong>AI Engine:</strong><br/>
                  Google Gemini
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Flask API Endpoints Info (for developers) */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <Icon name="Code" size={16} className="text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">API Integration</p>
              <p className="text-xs text-blue-700">
                Frontend integrates with Python Flask REST API endpoints for document processing and analysis.
              </p>
              <div className="mt-2">
                <p className="text-xs text-blue-600">
                  <strong>Key endpoints:</strong> /analyze, /cases, /search, /trends, /analytics
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadSettings;