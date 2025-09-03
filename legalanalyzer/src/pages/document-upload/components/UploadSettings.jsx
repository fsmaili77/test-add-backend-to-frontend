// legalanalyzer/src/pages/document-upload/components/UploadSettings.jsx
import React from 'react';
import Icon from 'components/AppIcon';

const UploadSettings = ({ settings, onSettingsChange, isUploading }) => {
  const handleChange = (key, value) => {
    onSettingsChange(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const classificationOptions = [
    { value: 'auto', label: 'Auto-detect', description: 'Let AI determine document type' },
    { value: 'contract', label: 'Contract', description: 'Legal agreements and contracts' },
    { value: 'brief', label: 'Brief', description: 'Legal briefs and motions' },
    { value: 'regulation', label: 'Regulation', description: 'Laws and regulatory documents' },
    { value: 'case_law', label: 'Case Law', description: 'Court decisions and precedents' },
    { value: 'other', label: 'Other', description: 'General legal documents' }
  ];

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'it', label: 'Italian' }
  ];

  return (
    <div className="bg-surface rounded-lg border border-border-light p-6">
      <h3 className="font-semibold text-text-primary mb-4 flex items-center space-x-2">
        <Icon name="Settings" size={20} />
        <span>Upload Settings</span>
      </h3>

      <div className="space-y-6">
        {/* Document Classification */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Document Type
          </label>
          <select
            value={settings.classification}
            onChange={(e) => handleChange('classification', e.target.value)}
            disabled={isUploading}
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
            disabled={isUploading}
            className="w-full p-3 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
          >
            {languageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Analysis Options */}
        <div className="border-t border-border-light pt-4">
          <h4 className="font-medium text-text-primary mb-3">Analysis Options</h4>
          
          {/* Advanced Analysis Toggle */}
          <div className="mb-4">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableAdvancedAnalysis}
                onChange={(e) => handleChange('enableAdvancedAnalysis', e.target.checked)}
                disabled={isUploading}
                className="mt-1 h-4 w-4 text-primary focus:ring-primary border-border-medium rounded disabled:cursor-not-allowed"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-text-primary">
                  Advanced AI Analysis
                </span>
                <p className="text-xs text-text-secondary mt-1">
                  Use microservice for detailed entity extraction, legal analysis, and AI-powered summaries. 
                  This provides more comprehensive results but takes longer to process.
                </p>
                {settings.enableAdvancedAnalysis && (
                  <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                    <div className="flex items-center space-x-2">
                      <Icon name="Zap" size={14} className="text-blue-600" />
                      <span className="text-xs text-blue-700 font-medium">Enhanced Features:</span>
                    </div>
                    <ul className="text-xs text-blue-600 mt-1 space-y-0.5">
                      <li>• Advanced entity recognition</li>
                      <li>• Detailed contract analysis</li>
                      <li>• AI-generated summaries</li>
                      <li>• Legal classification with confidence scores</li>
                      <li>• Risk assessment analysis</li>
                    </ul>
                  </div>
                )}
              </div>
            </label>
          </div>

          {/* OCR Toggle */}
          <div className="mb-4">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableOCR}
                onChange={(e) => handleChange('enableOCR', e.target.checked)}
                disabled={isUploading}
                className="mt-1 h-4 w-4 text-primary focus:ring-primary border-border-medium rounded disabled:cursor-not-allowed"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-text-primary">
                  Enable OCR
                </span>
                <p className="text-xs text-text-secondary mt-1">
                  Extract text from scanned documents and images. Recommended for PDF documents that may contain scanned content.
                </p>
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
                disabled={isUploading}
                className="mt-1 h-4 w-4 text-primary focus:ring-primary border-border-medium rounded disabled:cursor-not-allowed"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-text-primary">
                  Extract Metadata
                </span>
                <p className="text-xs text-text-secondary mt-1">
                  Extract document properties like creation date, author, and file properties.
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
                disabled={isUploading}
                className="mt-1 h-4 w-4 text-primary focus:ring-primary border-border-medium rounded disabled:cursor-not-allowed"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-text-primary">
                  Process in Background
                </span>
                <p className="text-xs text-text-secondary mt-1">
                  Allow navigation away while processing continues. You'll receive notifications when complete.
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
            disabled={isUploading}
            className="w-full p-3 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed text-sm"
          />
          <p className="text-xs text-text-secondary mt-1">
            Add custom tags to help organize and search your documents
          </p>
        </div>

        {/* Processing Time Estimate */}
        {(settings.enableOCR || settings.enableAdvancedAnalysis) && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <Icon name="Clock" size={16} className="text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Processing Time</p>
                <p className="text-xs text-amber-700">
                  {settings.enableAdvancedAnalysis && settings.enableOCR && 
                    "OCR + Advanced Analysis may take 2-5 minutes per document"}
                  {settings.enableAdvancedAnalysis && !settings.enableOCR && 
                    "Advanced Analysis may take 1-3 minutes per document"}
                  {!settings.enableAdvancedAnalysis && settings.enableOCR && 
                    "OCR processing may take 30-60 seconds per document"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadSettings;