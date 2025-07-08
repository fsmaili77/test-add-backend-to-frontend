import React, { useState } from 'react';
import Icon from 'components/AppIcon';

const ExportModal = ({ isOpen, onClose, onExport }) => {
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

  const handleExport = () => {
    onExport(exportFormat, exportOptions);
  };

  const handleOptionChange = (option, value) => {
    setExportOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border-light">
          <h3 className="text-lg font-semibold text-text-primary">Export Analysis Report</h3>
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
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setExportFormat('pdf')}
                className={`flex items-center space-x-2 p-3 border rounded-lg transition-colors duration-200 ${
                  exportFormat === 'pdf' ?'border-primary bg-blue-50 text-primary' :'border-border-medium text-text-secondary hover:border-primary hover:text-primary'
                }`}
              >
                <Icon name="FileText" size={20} />
                <span className="font-medium">PDF Report</span>
              </button>
              <button
                onClick={() => setExportFormat('excel')}
                className={`flex items-center space-x-2 p-3 border rounded-lg transition-colors duration-200 ${
                  exportFormat === 'excel' ?'border-primary bg-blue-50 text-primary' :'border-border-medium text-text-secondary hover:border-primary hover:text-primary'
                }`}
              >
                <Icon name="Table" size={20} />
                <span className="font-medium">Excel Data</span>
              </button>
            </div>
          </div>

          {/* Export Options */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-3">
              Include in Export
            </label>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={exportOptions.includeCharts}
                  onChange={(e) => handleOptionChange('includeCharts', e.target.checked)}
                  className="w-4 h-4 text-primary border-border-medium rounded focus:ring-accent"
                />
                <span className="text-sm text-text-primary">Charts and Visualizations</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={exportOptions.includeMetrics}
                  onChange={(e) => handleOptionChange('includeMetrics', e.target.checked)}
                  className="w-4 h-4 text-primary border-border-medium rounded focus:ring-accent"
                />
                <span className="text-sm text-text-primary">Key Performance Metrics</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={exportOptions.includeJobDetails}
                  onChange={(e) => handleOptionChange('includeJobDetails', e.target.checked)}
                  className="w-4 h-4 text-primary border-border-medium rounded focus:ring-accent"
                />
                <span className="text-sm text-text-primary">Processing Job Details</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={exportOptions.includeAlerts}
                  onChange={(e) => handleOptionChange('includeAlerts', e.target.checked)}
                  className="w-4 h-4 text-primary border-border-medium rounded focus:ring-accent"
                />
                <span className="text-sm text-text-primary">System Alerts and Notifications</span>
              </label>
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-3">
              Date Range
            </label>
            <select
              value={exportOptions.dateRange}
              onChange={(e) => handleOptionChange('dateRange', e.target.value)}
              className="w-full px-3 py-2 border border-border-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-background text-text-primary"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="1year">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>
            
            {exportOptions.dateRange === 'custom' && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Start Date</label>
                  <input
                    type="date"
                    value={exportOptions.customDateStart}
                    onChange={(e) => handleOptionChange('customDateStart', e.target.value)}
                    className="w-full px-3 py-2 border border-border-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-background text-text-primary text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">End Date</label>
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
              <span className="text-sm font-medium text-text-primary">Export Preview</span>
            </div>
            <div className="text-sm text-text-secondary space-y-1">
              <p>Format: {exportFormat.toUpperCase()}</p>
              <p>Estimated size: ~2.5 MB</p>
              <p>Processing time: ~30 seconds</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-border-light">
          <button
            onClick={onClose}
            className="px-4 py-2 text-text-secondary hover:text-text-primary border border-border-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <Icon name="Download" size={16} />
            <span>Export Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;