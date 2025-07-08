import React from 'react';
import Icon from 'components/AppIcon';

const UploadSettings = ({ settings, onSettingsChange, isUploading }) => {
  const classificationOptions = [
    { value: 'auto', label: 'Auto-detect', description: 'Automatically classify document type' },
    { value: 'contract', label: 'Contract', description: 'Legal contracts and agreements' },
    { value: 'brief', label: 'Legal Brief', description: 'Court briefs and motions' },
    { value: 'regulation', label: 'Regulation', description: 'Regulatory documents' },
    { value: 'case-law', label: 'Case Law', description: 'Court decisions and precedents' },
    { value: 'other', label: 'Other', description: 'General legal documents' }
  ];

  const handleSettingChange = (key, value) => {
    if (isUploading) return;
    onSettingsChange(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-surface rounded-lg border border-border-light p-6">
      <h3 className="font-semibold text-text-primary mb-4 flex items-center space-x-2">
        <Icon name="Settings" size={18} />
        <span>Upload Settings</span>
      </h3>

      <div className="space-y-6">
        {/* Document Classification */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-3">
            Document Classification
          </label>
          <div className="space-y-2">
            {classificationOptions.map((option) => (
              <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="classification"
                  value={option.value}
                  checked={settings.classification === option.value}
                  onChange={(e) => handleSettingChange('classification', e.target.value)}
                  disabled={isUploading}
                  className="mt-1 w-4 h-4 text-primary border-gray-300 focus:ring-primary focus:ring-2"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-text-primary">{option.label}</div>
                  <div className="text-xs text-text-secondary">{option.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Custom Tags */}
        <div>
          <label htmlFor="customTags" className="block text-sm font-medium text-text-primary mb-2">
            Custom Tags
          </label>
          <input
            id="customTags"
            type="text"
            placeholder="e.g., client-name, case-2024, confidential"
            value={settings.customTags}
            onChange={(e) => handleSettingChange('customTags', e.target.value)}
            disabled={isUploading}
            className="w-full px-3 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm disabled:bg-gray-50 disabled:text-gray-500"
          />
          <p className="text-xs text-text-secondary mt-1">
            Separate multiple tags with commas
          </p>
        </div>

        {/* Processing Options */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-3">
            Processing Options
          </label>
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableOCR}
                onChange={(e) => handleSettingChange('enableOCR', e.target.checked)}
                disabled={isUploading}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-text-primary">Enable OCR</div>
                <div className="text-xs text-text-secondary">Extract text from scanned documents</div>
              </div>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.extractMetadata}
                onChange={(e) => handleSettingChange('extractMetadata', e.target.checked)}
                disabled={isUploading}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-text-primary">Extract Metadata</div>
                <div className="text-xs text-text-secondary">Identify dates, parties, and key terms</div>
              </div>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.processInBackground}
                onChange={(e) => handleSettingChange('processInBackground', e.target.checked)}
                disabled={isUploading}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-text-primary">Background Processing</div>
                <div className="text-xs text-text-secondary">Continue working while files process</div>
              </div>
            </label>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="pt-4 border-t border-border-light">
          <button
            type="button"
            className="flex items-center space-x-2 text-sm text-primary hover:text-blue-700 transition-colors duration-200"
            disabled={isUploading}
          >
            <Icon name="ChevronRight" size={14} />
            <span>Advanced OCR Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadSettings;