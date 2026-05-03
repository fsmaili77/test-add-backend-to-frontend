// legalanalyzer/src/pages/search-results/components/SavedSearchModal.jsx

import React, { useState } from 'react';
import Icon from 'components/AppIcon';
import { useLanguage } from 'contexts/LanguageContext';

const SavedSearchModal = ({ searchQuery, selectedFilters, onClose, onSave }) => {
  const { texts } = useLanguage();
  const [searchName, setSearchName] = useState('');
  const [enableNotifications, setEnableNotifications] = useState(false);
  const [notificationFrequency, setNotificationFrequency] = useState('daily');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!searchName.trim()) return;
    setIsLoading(true);
    setTimeout(() => {
      onSave({
        name: searchName.trim(),
        query: searchQuery,
        filters: selectedFilters,
        notifications: { enabled: enableNotifications, frequency: notificationFrequency },
        createdDate: new Date().toISOString().split('T')[0]
      });
      setIsLoading(false);
    }, 1000);
  };

  const getActiveFiltersCount = () =>
    Object.values(selectedFilters).reduce((c, f) => c + (Array.isArray(f) ? f.length : f ? 1 : 0), 0);

  const getFilterSummary = () => {
    const summary = [];
    if (selectedFilters.documentType.length > 0) summary.push(`${texts.documentType}: ${selectedFilters.documentType.join(', ')}`);
    if (selectedFilters.practiceAreas.length > 0) summary.push(`${texts.practiceArea}: ${selectedFilters.practiceAreas.join(', ')}`);
    if (selectedFilters.dateRange) summary.push(`${texts.dateRange}: ${selectedFilters.dateRange}`);
    if (selectedFilters.parties.length > 0) summary.push(`${texts.parties}: ${selectedFilters.parties.join(', ')}`);
    if (selectedFilters.tags.length > 0) summary.push(`Tags: ${selectedFilters.tags.join(', ')}`);
    return summary;
  };

  const frequencyOptions = [
    { value: 'immediate', label: 'Immediate' },
    { value: 'daily',     label: texts.last7Days.replace('Last 7 Days', 'Daily') },
    { value: 'weekly',    label: 'Weekly' },
    { value: 'monthly',   label: 'Monthly' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-light">
          <h2 className="text-xl font-semibold text-text-primary">{texts.saveChanges}</h2>
          <button onClick={onClose} className="p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-gray-50 transition-colors">
            <Icon name="X" size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          {/* Search Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-text-primary mb-2">{texts.uploadSummary}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <Icon name="Search" size={14} className="text-text-secondary" />
                <span className="text-text-secondary">{texts.search}:</span>
                <span className="font-medium text-text-primary">"{searchQuery}"</span>
              </div>
              {getActiveFiltersCount() > 0 && (
                <div className="flex items-start space-x-2">
                  <Icon name="Filter" size={14} className="text-text-secondary mt-0.5" />
                  <div>
                    <span className="text-text-secondary">{texts.activeFilters} ({getActiveFiltersCount()}):</span>
                    <ul className="mt-1 space-y-1">
                      {getFilterSummary().map((filter, index) => (
                        <li key={index} className="text-text-primary text-xs">• {filter}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search Name */}
          <div>
            <label htmlFor="searchName" className="block text-sm font-medium text-text-primary mb-2">
              {texts.searchDocuments} *
            </label>
            <input
              type="text" id="searchName" value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder={`${texts.searchPlaceholder}`}
              className="w-full px-3 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              required
            />
          </div>

          {/* Notifications */}
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <input type="checkbox" id="enableNotifications" checked={enableNotifications}
                onChange={(e) => setEnableNotifications(e.target.checked)}
                className="w-4 h-4 text-primary border-border-medium rounded focus:ring-accent focus:ring-2" />
              <label htmlFor="enableNotifications" className="text-sm font-medium text-text-primary">
                Enable notifications for new matching documents
              </label>
            </div>
            {enableNotifications && (
              <div className="ml-7">
                <label htmlFor="notificationFrequency" className="block text-sm text-text-secondary mb-2">
                  Notification Frequency
                </label>
                <select id="notificationFrequency" value={notificationFrequency}
                  onChange={(e) => setNotificationFrequency(e.target.value)}
                  className="w-full px-3 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-sm">
                  {frequencyOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border-light">
            <button type="button" onClick={onClose} className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors font-medium">
              {texts.cancel}
            </button>
            <button type="submit" disabled={!searchName.trim() || isLoading}
              className="flex items-center space-x-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>{texts.loading}</span></>
              ) : (
                <><Icon name="Bookmark" size={16} /><span>{texts.saveChanges}</span></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SavedSearchModal;