// legalanalyzer/src/pages/document-upload/index.jsx - Updated with Client Selection & Duplicate Handling
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import GlobalHeader from 'components/ui/GlobalHeader';
import BreadcrumbTrail from 'components/ui/BreadcrumbTrail';
import Icon from 'components/AppIcon';
import FileDropZone from './components/FileDropZone';
import FileList from './components/FileList';
import UploadSettings from './components/UploadSettings';
import ProgressTracker from './components/ProgressTracker';
import { getAuthHeaders, getMultipartAuthHeaders } from 'services/authService';
import { uploadDocument, batchUploadDocuments, validateFile, checkMicroservicesHealth } from '../../api';
import { useLanguage } from 'contexts/LanguageContext';

const API_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:5093/api';
const PYTHON_API_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:3001';

const DocumentUpload = () => {
  const navigate = useNavigate();
  const { texts } = useLanguage();

  // Client management state
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(
    localStorage.getItem('selectedClientId') || ''
  );
  const [loadingClients, setLoadingClients] = useState(true);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadSettings, setUploadSettings] = useState({
    classification: 'auto',
    customTags: '',
    enableOCR: true,
    enableAdvancedAnalysis: true,
    extractMetadata: true,
    processInBackground: false,
    language: 'en',
    priority: 'normal',
    practiceArea: ''
  });
  const [uploadProgress, setUploadProgress] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [backendHealth, setBackendHealth] = useState(null);
  const [uploadResults, setUploadResults] = useState([]);

  const supportedFormats = ['PDF', 'DOCX', 'TXT', 'DOC'];
  const maxFileSize = 50 * 1024 * 1024; // 50MB
  const maxFiles = 20;

  useEffect(() => { fetchClients(); }, []);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const health = await checkMicroservicesHealth();
        setBackendHealth(health);
        if (health.overall_status !== 'healthy') {
          setErrors(prev => [...prev, 'Backend service is currently unavailable. Please try again later.']);
        }
      } catch (error) {
        console.warn('Health check failed:', error);
        setBackendHealth({ overall_status: 'unknown' });
      }
    };
    checkHealth();
  }, []);

  const fetchClients = async () => {
    setLoadingClients(true);
    try {
      const response = await axios.get(`${API_URL}/clientmanagement/clients`, {
        params: { isActive: true },
        headers: getAuthHeaders()
      });
      setClients(response.data.clients);
    } catch (err) {
      console.error('Failed to fetch clients:', err);
      setErrors(prev => [...prev, 'Failed to load clients. Please refresh the page.']);
    } finally {
      setLoadingClients(false);
    }
  };

  const handleFilesSelected = useCallback((newFiles) => {
    const validFiles = [];
    const fileErrors = [];

    Array.from(newFiles).forEach((file) => {
      if (selectedFiles.length + validFiles.length >= maxFiles) {
        fileErrors.push(`Maximum ${maxFiles} files allowed`);
        return;
      }
      const isDuplicate = selectedFiles.some(
        existing => existing.name === file.name && existing.size === file.size
      );
      if (isDuplicate) {
        fileErrors.push(`${texts.duplicateFile}: ${file.name}`);
        return;
      }
      const fileValidationErrors = validateFile(file);
      if (fileValidationErrors.length === 0) {
        validFiles.push({
          id: Date.now() + Math.random(),
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'pending',
          extension: file.name.split('.').pop().toUpperCase()
        });
      } else {
        fileErrors.push(`${file.name}: ${fileValidationErrors.join(', ')}`);
      }
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
    if (fileErrors.length > 0) setErrors(prev => [...prev, ...fileErrors]);
  }, [selectedFiles, texts]);

  const removeFile = (fileId) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
    setErrors([]);
  };

  const simulateProgress = (fileId, duration = 30000) => {
    let progress = 0;
    const increment = 100 / (duration / 500);
    const interval = setInterval(() => {
      progress += increment + Math.random() * 5;
      if (progress >= 95) { progress = 95; clearInterval(interval); }
      setUploadProgress(prev => ({ ...prev, [fileId]: Math.min(progress, 95) }));
    }, 500);
    return interval;
  };

  const startUpload = async () => {
    if (selectedFiles.length === 0 || !selectedClientId) {
      setErrors([`${texts.selectClientFirst}`]);
      return;
    }
    setIsUploading(true);
    setErrors([]);
    setUploadResults([]);
    try {
      setSelectedFiles(prev => prev.map(f => ({ ...f, status: 'uploading' })));
      let results;
      if (selectedFiles.length === 1) {
        const file = selectedFiles[0];
        const progressInterval = simulateProgress(file.id, 35000);
        results = [await uploadDocument(
          file.file, file.name, uploadSettings.language,
          uploadSettings.classification, uploadSettings.enableOCR,
          uploadSettings.enableAdvancedAnalysis, selectedClientId
        )];
        clearInterval(progressInterval);
        setUploadProgress(prev => ({ ...prev, [file.id]: 100 }));
        setSelectedFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'completed' } : f));
      } else {
        const progressIntervals = selectedFiles.map(file => simulateProgress(file.id, 35000));
        results = await batchUploadDocuments(
          selectedFiles.map(f => f.file),
          selectedFiles.map(f => f.name),
          selectedFiles.map(() => uploadSettings.language),
          selectedFiles.map(() => uploadSettings.classification),
          uploadSettings.enableOCR, uploadSettings.enableAdvancedAnalysis, selectedClientId
        );
        progressIntervals.forEach(i => clearInterval(i));
      }
      setUploadResults(results);
      if (!uploadSettings.processInBackground) setTimeout(() => navigate('/dashboard'), 3000);
    } catch (error) {
      console.error('Upload error:', error);
      setErrors([error.message || 'Upload failed']);
    } finally {
      setIsUploading(false);
    }
  };

  const getEstimatedTime = () => {
    if (selectedFiles.length === 0) return '0 sec';
    const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    const baseSizeTime = Math.ceil(totalSize / (1024 * 1024) * 2);
    let analysisTime = selectedFiles.length * 30;
    if (uploadSettings.enableOCR) analysisTime += selectedFiles.length * 15;
    const estimatedSeconds = baseSizeTime + analysisTime;
    return estimatedSeconds > 60 ? `${Math.ceil(estimatedSeconds / 60)} min` : `${estimatedSeconds} sec`;
  };

  const getTotalProgress = () => {
    if (selectedFiles.length === 0) return 0;
    const totalProgress = Object.values(uploadProgress).reduce((sum, p) => sum + p, 0);
    return Math.round(totalProgress / selectedFiles.length);
  };

  const clearErrors = () => setErrors([]);
  const resetUpload = () => {
    setSelectedFiles([]);
    setUploadProgress({});
    setErrors([]);
    setUploadResults([]);
    setIsUploading(false);
  };

  const selectedClient = clients.find(c => c.id === parseInt(selectedClientId));

  // Derive result title
  const getResultTitle = () => {
    if (uploadResults.some(r => r.status === 'duplicate')) return texts.uploadCompleteWithDuplicates;
    if (uploadResults.some(r => r.status === 'failed')) return texts.uploadCompleteWithErrors;
    return texts.uploadComplete;
  };

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <BreadcrumbTrail />

          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-text-primary mb-2">{texts.documentUpload}</h1>
                <p className="text-text-secondary">
                  {texts.documentUploadDesc}. {supportedFormats.join(', ')}
                </p>
              </div>
              {backendHealth && (
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                  backendHealth.overall_status === 'healthy'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    backendHealth.overall_status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span>
                    {backendHealth.overall_status === 'healthy'
                      ? texts.pythonBackendOnline
                      : texts.backendIssues}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Client Selection */}
          <div className="mb-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Icon name="User" size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-blue-900 mb-2">
                  {texts.selectClient} * {loadingClients && <span className="text-xs font-normal">({texts.loading})</span>}
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => {
                    setSelectedClientId(e.target.value);
                    localStorage.setItem('selectedClientId', e.target.value);
                  }}
                  disabled={loadingClients || isUploading}
                  required
                  className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white text-base disabled:opacity-50"
                >
                  <option value="">{texts.selectClientPlaceholder}</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.firstName} {client.lastName} ({client.email})
                      {client.company && ` - ${client.company}`}
                    </option>
                  ))}
                </select>
                {selectedClient && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-blue-700">
                    <Icon name="CheckCircle" size={16} />
                    <span>
                      {texts.selected}: {selectedClient.firstName} {selectedClient.lastName}
                      {selectedClient.company && ` - ${selectedClient.company}`}
                    </span>
                  </div>
                )}
                {!selectedClientId && !loadingClients && (
                  <p className="mt-2 text-sm text-blue-700">
                    {texts.dontSeeClient}{' '}
                    <button
                      onClick={() => navigate('/clients')}
                      className="font-medium underline hover:text-blue-900"
                    >
                      {texts.addNewClient}
                    </button>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2">
                  <Icon name="AlertCircle" size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-red-800 mb-1">{texts.uploadErrors}</h3>
                    <ul className="text-sm text-red-700 space-y-1">
                      {errors.map((error, index) => <li key={index}>• {error}</li>)}
                    </ul>
                  </div>
                </div>
                <button onClick={clearErrors} className="text-red-600 hover:text-red-800 transition-colors">
                  <Icon name="X" size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Upload Results */}
          {uploadResults.length > 0 && !isUploading && (
            <div className={`mb-6 p-4 border rounded-lg ${
              uploadResults.some(r => r.status === 'duplicate')
                ? 'bg-amber-50 border-amber-200'
                : uploadResults.some(r => r.status === 'failed')
                ? 'bg-red-50 border-red-200'
                : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-start space-x-2">
                <Icon
                  name={
                    uploadResults.some(r => r.status === 'duplicate') ? 'Info' :
                    uploadResults.some(r => r.status === 'failed') ? 'XCircle' : 'CheckCircle'
                  }
                  size={20}
                  className={`mt-0.5 flex-shrink-0 ${
                    uploadResults.some(r => r.status === 'duplicate') ? 'text-amber-600' :
                    uploadResults.some(r => r.status === 'failed') ? 'text-red-600' : 'text-blue-600'
                  }`}
                />
                <div className="flex-1">
                  <h3 className={`font-medium mb-2 ${
                    uploadResults.some(r => r.status === 'duplicate') ? 'text-amber-800' :
                    uploadResults.some(r => r.status === 'failed') ? 'text-red-800' : 'text-blue-800'
                  }`}>
                    {getResultTitle()}
                  </h3>
                  <div className="space-y-1">
                    {uploadResults.map((result, index) => (
                      <div key={index} className="text-sm">
                        <span className="font-medium">{result.filename}</span>:{' '}
                        <span className={
                          result.status === 'success' ? 'text-green-700' :
                          result.status === 'duplicate' ? 'text-amber-700' : 'text-red-700'
                        }>
                          {result.status === 'duplicate'
                            ? texts.duplicateDocument
                            : result.status === 'success'
                            ? result.message
                            : result.error}
                        </span>
                      </div>
                    ))}
                  </div>
                  {!uploadSettings.processInBackground && (
                    <p className="text-sm text-blue-700 mt-2">{texts.redirectingToDashboard}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Upload Area */}
            <div className="lg:col-span-2 space-y-6">
              <FileDropZone
                onFilesSelected={handleFilesSelected}
                supportedFormats={supportedFormats}
                maxFileSize={maxFileSize}
                isUploading={isUploading}
                backendStatus={backendHealth?.overall_status}
              />
              {selectedFiles.length > 0 && (
                <FileList
                  files={selectedFiles}
                  uploadProgress={uploadProgress}
                  onRemoveFile={removeFile}
                  isUploading={isUploading}
                />
              )}
              {isUploading && (
                <ProgressTracker
                  totalProgress={getTotalProgress()}
                  filesCount={selectedFiles.length}
                  completedCount={selectedFiles.filter(f => f.status === 'completed').length}
                  errorCount={selectedFiles.filter(f => f.status === 'error').length}
                />
              )}
            </div>

            {/* Settings Sidebar */}
            <div className="space-y-6">
              <UploadSettings
                settings={uploadSettings}
                onSettingsChange={setUploadSettings}
                isUploading={isUploading}
                backendHealth={backendHealth}
              />

              {/* Upload Summary */}
              <div className="bg-surface rounded-lg border border-border-light p-6">
                <h3 className="font-semibold text-text-primary mb-4">{texts.uploadSummary}</h3>
                <div className="space-y-3 mb-6">
                  {selectedClient && (
                    <div className="flex justify-between text-sm pb-3 border-b border-border-light">
                      <span className="text-text-secondary">{texts.client}:</span>
                      <span className="font-medium text-primary">
                        {selectedClient.firstName} {selectedClient.lastName}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">{texts.selectedFiles}:</span>
                    <span className="font-medium text-text-primary">{selectedFiles.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">{texts.totalSize}:</span>
                    <span className="font-medium text-text-primary">
                      {(selectedFiles.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">{texts.aiAnalysis}:</span>
                    <span className="font-medium text-primary">Gemini</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">{texts.ocr}:</span>
                    <span className={`font-medium ${uploadSettings.enableOCR ? 'text-success' : 'text-text-secondary'}`}>
                      {uploadSettings.enableOCR ? texts.ocrEnabled : texts.offline}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">{texts.backendStatus}:</span>
                    <span className={`font-medium ${
                      backendHealth?.overall_status === 'healthy' ? 'text-success' : 'text-error'
                    }`}>
                      {backendHealth?.overall_status === 'healthy' ? texts.online : texts.backendUnavailable}
                    </span>
                  </div>
                  {selectedFiles.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">{texts.estTime}:</span>
                      <span className="font-medium text-text-primary">{getEstimatedTime()}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <button
                    onClick={startUpload}
                    disabled={!selectedClientId || selectedFiles.length === 0 || isUploading || backendHealth?.overall_status !== 'healthy'}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200 ${
                      !selectedClientId || selectedFiles.length === 0 || isUploading || backendHealth?.overall_status !== 'healthy'
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-primary text-white hover:bg-blue-700'
                    }`}
                  >
                    {isUploading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>{texts.uploadingAnalyzing}</span>
                      </div>
                    ) : !selectedClientId ? (
                      <div className="flex items-center justify-center space-x-2">
                        <Icon name="AlertCircle" size={16} />
                        <span>{texts.selectClientFirst}</span>
                      </div>
                    ) : backendHealth?.overall_status !== 'healthy' ? (
                      <div className="flex items-center justify-center space-x-2">
                        <Icon name="AlertCircle" size={16} />
                        <span>{texts.backendUnavailable}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <Icon name="Upload" size={16} />
                        <span>{texts.startUploadAnalysis}</span>
                      </div>
                    )}
                  </button>
                  {selectedFiles.length > 0 && !isUploading && (
                    <button
                      onClick={resetUpload}
                      className="w-full py-2 px-4 border border-border-medium rounded-lg text-sm font-medium text-text-secondary hover:bg-gray-50 transition-colors"
                    >
                      {texts.clearAllFiles}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DocumentUpload;