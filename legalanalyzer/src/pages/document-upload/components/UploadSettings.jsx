import React from 'react';
import Icon from 'components/AppIcon';
import { useLanguage } from 'contexts/LanguageContext';

const UploadSettings = ({ settings, onSettingsChange, isUploading, backendHealth }) => {
  const { texts } = useLanguage();

  const handleChange = (key, value) => {
    onSettingsChange(prev => ({ ...prev, [key]: value }));
  };

  const classificationOptions = [
    { value: 'auto', label: 'Auto-detect' },
    { value: 'contract', label: 'Contract' },
    { value: 'judgment', label: 'Court Judgment' },
    { value: 'brief', label: 'Legal Brief' },
    { value: 'regulation', label: 'Regulation' },
    { value: 'case_law', label: 'Case Law' },
    { value: 'pleading', label: 'Pleading' },
    { value: 'agreement', label: 'Agreement' },
    { value: 'other', label: 'Other' }
  ];

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
    { value: 'es', label: 'Español' },
    { value: 'it', label: 'Italiano' },
    { value: 'pt', label: 'Português' },
    { value: 'nl', label: 'Nederlands' }
  ];

  const isDisabled = isUploading || backendHealth?.overall_status !== 'healthy';

  return (
    <div className="bg-surface rounded-lg border border-border-light p-6">
      <h3 className="font-semibold text-text-primary mb-4 flex items-center space-x-2">
        <Icon name="Settings" size={20} />
        <span>{texts.uploadSettings}</span>
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
                {texts.pythonBackend}: {backendHealth.overall_status === 'healthy' ? texts.online : texts.offline}
              </span>
            </div>
          </div>
        )}

        {/* Document Type */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            {texts.documentType}
          </label>
          <select
            value={settings.classification}
            onChange={(e) => handleChange('classification', e.target.value)}
            disabled={isDisabled}
            className="w-full p-3 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
          >
            {classificationOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        {/* Document Language */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            {texts.documentLanguage}
          </label>
          <select
            value={settings.language || 'en'}
            onChange={(e) => handleChange('language', e.target.value)}
            disabled={isDisabled}
            className="w-full p-3 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
          >
            {languageOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        {/* Processing Options */}
        <div className="border-t border-border-light pt-4">
          <h4 className="font-medium text-text-primary mb-3">{texts.processingOptions}</h4>

          {/* Gemini AI — always enabled */}
          <div className="mb-4">
            <div className="flex items-start space-x-3">
              <div className="mt-1"><Icon name="Zap" size={16} className="text-primary" /></div>
              <div className="flex-1">
                <span className="text-sm font-medium text-text-primary">
                  {texts.geminiAlwaysEnabled}
                </span>
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
                disabled={isDisabled}
                className="mt-1 h-4 w-4 text-primary focus:ring-primary border-border-medium rounded disabled:cursor-not-allowed"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-text-primary">
                  {texts.enableAdvancedOcr}
                </span>
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
                disabled={isDisabled}
                className="mt-1 h-4 w-4 text-primary focus:ring-primary border-border-medium rounded disabled:cursor-not-allowed"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-text-primary">
                  {texts.extractMetadata}
                </span>
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
                disabled={isDisabled}
                className="mt-1 h-4 w-4 text-primary focus:ring-primary border-border-medium rounded disabled:cursor-not-allowed"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-text-primary">
                  {texts.processInBackground}
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Custom Tags */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            {texts.customTags}
          </label>
          <input
            type="text"
            value={settings.customTags}
            onChange={(e) => handleChange('customTags', e.target.value)}
            disabled={isDisabled}
            className="w-full p-3 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed text-sm"
          />
        </div>

        {/* Processing Time Estimate */}
        {(settings.enableOCR || settings.enableAdvancedAnalysis) && backendHealth?.overall_status === 'healthy' && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <Icon name="Clock" size={16} className="text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">{texts.processingTimeEstimate}</p>
              </div>
            </div>
          </div>
        )}

        {/* Backend Unavailable Warning */}
        {backendHealth?.overall_status !== 'healthy' && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <Icon name="AlertTriangle" size={16} className="text-red-600 mt-0.5" />
              <p className="text-sm font-medium text-red-800">{texts.backendUnavailable}</p>
            </div>
          </div>
        )}

        {/* Backend Info */}
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <Icon name="Server" size={16} className="text-gray-600 mt-0.5" />
            <p className="text-sm font-medium text-gray-800">{texts.backendInformation}</p>
          </div>
        </div>

        {/* API Integration */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <Icon name="Code" size={16} className="text-blue-600 mt-0.5" />
            <p className="text-sm font-medium text-blue-800">{texts.apiIntegration}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadSettings;