// legalanalyzer/src/pages/analysis-dashboard/components/ExportModal.jsx
// legalanalyzer/src/pages/analysis-dashboard/components/ExportModal.jsx

import React, { useState } from 'react';
import Icon from 'components/AppIcon';
import { useLanguage } from 'contexts/LanguageContext';

const ExportModal = ({ isOpen, onClose, onExport }) => {
  const { texts } = useLanguage();

  const [exportFormat, setExportFormat] = useState('pdf');
  const [exportOptions, setExportOptions] = useState({
    includeCharts: true,
    includeMetrics: true,
    includeJobDetails: true,
    includeAlerts: false,
    dateRange: '30days',
    customDateStart: '',
    customDateEnd: ''
  });

  const handleExport = () => { onExport(exportFormat, exportOptions); };

  const handleOptionChange = (option, value) => {
    setExportOptions(prev => ({ ...prev, [option]: value }));
  };

  const dateRangeOptions = [
    { value: '7days',  label: texts.last7Days },
    { value: '30days', label: texts.last30Days },
    { value: '90days', label: texts.last90Days },
    { value: '1year',  label: texts.lastYear },
    { value: 'custom', label: texts.customRange },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">

        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-light">
          <h3 className="text-lg font-semibold text-text-primary">{texts.exportAnalysisReport}</h3>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-gray-50"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Export Format */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-3">
              {texts.exportFormat}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setExportFormat('pdf')}
                className={`flex items-center space-x-2 p-3 border rounded-lg transition-colors duration-200 ${
                  exportFormat === 'pdf'
                    ? 'border-primary bg-blue-50 text-primary'
                    : 'border-border-medium text-text-secondary hover:border-primary hover:text-primary'
                }`}
              >
                <Icon name="FileText" size={20} />
                <span className="font-medium">{texts.pdfReport}</span>
              </button>
              <button
                onClick={() => setExportFormat('excel')}
                className={`flex items-center space-x-2 p-3 border rounded-lg transition-colors duration-200 ${
                  exportFormat === 'excel'
                    ? 'border-primary bg-blue-50 text-primary'
                    : 'border-border-medium text-text-secondary hover:border-primary hover:text-primary'
                }`}
              >
                <Icon name="Table" size={20} />
                <span className="font-medium">{texts.excelData}</span>
              </button>
            </div>
          </div>

          {/* Include in Export */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-3">
              {texts.includeInExport}
            </label>
            <div className="space-y-3">
              {[
                { key: 'includeCharts',     label: texts.chartsAndVisualizations },
                { key: 'includeMetrics',    label: texts.keyPerformanceMetrics },
                { key: 'includeJobDetails', label: texts.processingJobDetails },
                { key: 'includeAlerts',     label: texts.systemAlertsNotifications },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={exportOptions[key]}
                    onChange={(e) => handleOptionChange(key, e.target.checked)}
                    className="w-4 h-4 text-primary border-border-medium rounded focus:ring-accent"
                  />
                  <span className="text-sm text-text-primary">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-3">
              {texts.dateRange}
            </label>
            <select
              value={exportOptions.dateRange}
              onChange={(e) => handleOptionChange('dateRange', e.target.value)}
              className="w-full px-3 py-2 border border-border-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-background text-text-primary"
            >
              {dateRangeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {exportOptions.dateRange === 'custom' && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-xs text-text-secondary mb-1">{texts.startDate}</label>
                  <input
                    type="date"
                    value={exportOptions.customDateStart}
                    onChange={(e) => handleOptionChange('customDateStart', e.target.value)}
                    className="w-full px-3 py-2 border border-border-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-background text-text-primary text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">{texts.endDate}</label>
                  <input
                    type="date"
                    value={exportOptions.customDateEnd}
                    onChange={(e) => handleOptionChange('customDateEnd', e.target.value)}
                    className="w-full px-3 py-2 border border-border-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-background text-text-primary text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Export Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Icon name="Info" size={16} className="text-primary" />
              <span className="text-sm font-medium text-text-primary">{texts.exportPreview}</span>
            </div>
            <div className="text-sm text-text-secondary space-y-1">
              <p>Format: {exportFormat.toUpperCase()}</p>
              <p>Estimated size: ~2.5 MB</p>
              <p>{texts.processingTimeApprox}</p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-border-light">
          <button
            onClick={onClose}
            className="px-4 py-2 text-text-secondary hover:text-text-primary border border-border-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            {texts.cancel}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <Icon name="Download" size={16} />
            <span>{texts.exportReport}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;