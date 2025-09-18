// legalanalyzer/src/pages/document-upload/index.jsx - Updated for Python Flask backend
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GlobalHeader from 'components/ui/GlobalHeader';
import BreadcrumbTrail from 'components/ui/BreadcrumbTrail';
import Icon from 'components/AppIcon';
import FileDropZone from './components/FileDropZone';
import FileList from './components/FileList';
import UploadSettings from './components/UploadSettings';
import ProgressTracker from './components/ProgressTracker';
import { uploadDocument, batchUploadDocuments, validateFile, checkMicroservicesHealth } from '../../api';

const DocumentUpload = () => {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadSettings, setUploadSettings] = useState({
    classification: 'auto',
    customTags: '',
    enableOCR: true,
    enableAdvancedAnalysis: true, // Always true for Python backend (Gemini analysis)
    extractMetadata: true,
    processInBackground: false,
    language: 'en' // Added language setting
  });
  const [uploadProgress, setUploadProgress] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [backendHealth, setBackendHealth] = useState(null);
  const [uploadResults, setUploadResults] = useState([]);

  // Python backend supports PDF, DOCX, TXT, DOC
  const supportedFormats = ['PDF', 'DOCX', 'TXT', 'DOC'];
  const maxFileSize = 50 * 1024 * 1024; // 50MB (matching Python backend limit)
  const maxFiles = 20;

  // Check backend health on mount
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

  const handleFilesSelected = useCallback((newFiles) => {
    const validFiles = [];
    const fileErrors = [];

    Array.from(newFiles).forEach((file) => {
      if (selectedFiles.length + validFiles.length >= maxFiles) {
        fileErrors.push(`Maximum ${maxFiles} files allowed`);
        return;
      }

      // Check for duplicates
      const isDuplicate = selectedFiles.some(existing => 
        existing.name === file.name && existing.size === file.size
      );
      
      if (isDuplicate) {
        fileErrors.push(`Duplicate file: ${file.name}`);
        return;
      }

      const fileValidationErrors = validateFile(file);
      if (fileValidationErrors.length === 0) {
        const fileWithId = {
          id: Date.now() + Math.random(),
          file: file,
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'pending',
          extension: file.name.split('.').pop().toUpperCase()
        };
        validFiles.push(fileWithId);
      } else {
        fileErrors.push(`${file.name}: ${fileValidationErrors.join(', ')}`);
      }
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
    if (fileErrors.length > 0) {
      setErrors(prev => [...prev, ...fileErrors]);
    }
  }, [selectedFiles]);

  const removeFile = (fileId) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
    // Clear any errors related to this file
    setErrors([]);
  };

  const simulateProgress = (fileId, duration = 30000) => {
    let progress = 0;
    const increment = 100 / (duration / 500); // Update every 500ms
    
    const interval = setInterval(() => {
      progress += increment + Math.random() * 5; // Add some randomness
      if (progress >= 95) {
        progress = 95; // Stop at 95% until actual completion
        clearInterval(interval);
      }
      setUploadProgress(prev => ({
        ...prev,
        [fileId]: Math.min(progress, 95)
      }));
    }, 500);
    
    return interval;
  };

  const startUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    // Check backend health before starting
    if (backendHealth?.overall_status === 'unavailable') {
      setErrors(['Backend service is currently unavailable. Please check your connection and try again.']);
      return;
    }

    setIsUploading(true);
    setErrors([]);
    setUploadResults([]);

    try {
      // Update all files to uploading status
      setSelectedFiles(prev => prev.map(f => ({ ...f, status: 'uploading' })));

      if (selectedFiles.length === 1) {
        // Single file upload
        const file = selectedFiles[0];
        const progressInterval = simulateProgress(file.id, 35000); // 35 seconds for Gemini analysis
        
        try {
          const result = await uploadDocument(
            file.file,
            file.name,
            uploadSettings.language,
            uploadSettings.classification,
            uploadSettings.enableOCR,
            uploadSettings.enableAdvancedAnalysis
          );
          
          clearInterval(progressInterval);
          setUploadProgress(prev => ({ ...prev, [file.id]: 100 }));
          setSelectedFiles(prev =>
            prev.map(f => f.id === file.id ? { ...f, status: 'completed' } : f)
          );
          
          setUploadResults([{
            filename: file.name,
            status: 'success',
            message: 'Document uploaded and analyzed successfully',
            id: result.id
          }]);
          
          console.log('Upload successful:', result);
        } catch (error) {
          clearInterval(progressInterval);
          console.error('Upload error:', error);
          setErrors(prev => [...prev, `Failed to upload ${file.name}: ${error.message}`]);
          setSelectedFiles(prev =>
            prev.map(f => f.id === file.id ? { ...f, status: 'error' } : f)
          );
          
          setUploadResults([{
            filename: file.name,
            status: 'failed',
            error: error.message
          }]);
        }
      } else {
        // Batch upload - Python backend processes files sequentially
        const files = selectedFiles.map(f => f.file);
        const titles = selectedFiles.map(f => f.name);
        const languages = selectedFiles.map(() => uploadSettings.language);
        const classifications = selectedFiles.map(() => uploadSettings.classification);

        // Start progress simulation for all files
        const progressIntervals = selectedFiles.map(file =>
          simulateProgress(file.id, 35000) // 35 seconds per file for Gemini analysis
        );

        try {
          const results = await batchUploadDocuments(
            files,
            titles,
            languages,
            classifications,
            uploadSettings.enableOCR,
            uploadSettings.enableAdvancedAnalysis
          );

          // Clear all progress intervals
          progressIntervals.forEach(interval => clearInterval(interval));

          // Process results and update status
          const uploadResults = [];
          let hasErrors = false;

          results.forEach((result, index) => {
            const fileId = selectedFiles[index].id;
            const filename = selectedFiles[index].name;

            if (result.error) {
              hasErrors = true;
              setErrors(prev => [...prev, `${filename}: ${result.error}`]);
              setSelectedFiles(prev => prev.map(f =>
                f.id === fileId ? { ...f, status: 'error' } : f
              ));
              uploadResults.push({
                filename,
                status: 'failed',
                error: result.error
              });
            } else {
              setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
              setSelectedFiles(prev => prev.map(f =>
                f.id === fileId ? { ...f, status: 'completed' } : f
              ));
              uploadResults.push({
                filename,
                status: 'success',
                message: 'Document uploaded and analyzed successfully',
                id: result.id
              });
            }
          });

          setUploadResults(uploadResults);

          if (!hasErrors) {
            console.log('Batch upload successful:', results);
          }
        } catch (error) {
          // Clear all progress intervals
          progressIntervals.forEach(interval => clearInterval(interval));
          console.error('Batch upload error:', error);
          setErrors(prev => [...prev, `Batch upload failed: ${error.message}`]);
          setSelectedFiles(prev => prev.map(f => ({ ...f, status: 'error' })));
          
          setUploadResults(selectedFiles.map(file => ({
            filename: file.name,
            status: 'failed',
            error: error.message
          })));
        }
      }

      // Navigate to dashboard after showing results
      if (!uploadSettings.processInBackground) {
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      }
    } catch (error) {
      console.error('Upload process error:', error);
      setErrors(prev => [...prev, 'Upload failed. Please check your connection and try again.']);
      setSelectedFiles(prev => prev.map(f => ({ ...f, status: 'error' })));
    } finally {
      setIsUploading(false);
    }
  };

  const getEstimatedTime = () => {
    if (selectedFiles.length === 0) return '0 sec';
    
    const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    const baseSizeTime = Math.ceil(totalSize / (1024 * 1024) * 2); // 2 seconds per MB base time
    
    // Python backend with Gemini analysis takes longer
    let analysisTime = selectedFiles.length * 30; // 30 seconds per file for Gemini analysis
    
    // Add OCR time if enabled
    if (uploadSettings.enableOCR) {
      analysisTime += selectedFiles.length * 15; // Additional 15 seconds per file for OCR
    }
    
    const estimatedSeconds = baseSizeTime + analysisTime;
    return estimatedSeconds > 60 ? `${Math.ceil(estimatedSeconds / 60)} min` : `${estimatedSeconds} sec`;
  };

  const getTotalProgress = () => {
    if (selectedFiles.length === 0) return 0;
    const totalProgress = Object.values(uploadProgress).reduce((sum, progress) => sum + progress, 0);
    return Math.round(totalProgress / selectedFiles.length);
  };

  const clearErrors = () => {
    setErrors([]);
  };

  const resetUpload = () => {
    setSelectedFiles([]);
    setUploadProgress({});
    setErrors([]);
    setUploadResults([]);
    setIsUploading(false);
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
                <h1 className="text-3xl font-bold text-text-primary mb-2">Document Upload</h1>
                <p className="text-text-secondary">
                  Upload legal documents for AI-powered analysis using Gemini. Supported formats: {supportedFormats.join(', ')}
                </p>
              </div>
              
              {/* Backend Status Indicator */}
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
                    {backendHealth.overall_status === 'healthy' ? 'Python Backend Online' : 'Backend Issues'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2">
                  <Icon name="AlertCircle" size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-red-800 mb-1">Upload Errors</h3>
                    <ul className="text-sm text-red-700 space-y-1">
                      {errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <button 
                  onClick={clearErrors}
                  className="text-red-600 hover:text-red-800 transition-colors"
                >
                  <Icon name="X" size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Upload Results */}
          {uploadResults.length > 0 && !isUploading && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <Icon name="CheckCircle" size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-blue-800 mb-2">Upload Complete</h3>
                  <div className="space-y-1">
                    {uploadResults.map((result, index) => (
                      <div key={index} className="text-sm">
                        <span className="font-medium">{result.filename}</span>: {' '}
                        <span className={result.status === 'success' ? 'text-green-700' : 'text-red-700'}>
                          {result.status === 'success' ? result.message : result.error}
                        </span>
                      </div>
                    ))}
                  </div>
                  {!uploadSettings.processInBackground && (
                    <p className="text-sm text-blue-700 mt-2">
                      Redirecting to dashboard in 3 seconds...
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Upload Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* File Drop Zone */}
              <FileDropZone
                onFilesSelected={handleFilesSelected}
                supportedFormats={supportedFormats}
                maxFileSize={maxFileSize}
                isUploading={isUploading}
                backendStatus={backendHealth?.overall_status}
              />

              {/* Selected Files List */}
              {selectedFiles.length > 0 && (
                <FileList
                  files={selectedFiles}
                  uploadProgress={uploadProgress}
                  onRemoveFile={removeFile}
                  isUploading={isUploading}
                />
              )}

              {/* Upload Progress */}
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

              {/* Gemini AI Analysis Info */}
              <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                <div className="flex items-start space-x-2">
                  <Icon name="Zap" size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-blue-800 mb-1">
                      Gemini AI Analysis Enabled
                    </h3>
                    <p className="text-sm text-blue-700">
                      Documents will be analyzed using Google's Gemini AI for comprehensive legal analysis, including:
                    </p>
                    <ul className="text-xs text-blue-600 mt-2 space-y-1">
                      <li>• Court and jurisdiction identification</li>
                      <li>• Party extraction and classification</li>
                      <li>• Document date recognition</li>
                      <li>• Legal argument summarization</li>
                      <li>• Document type classification</li>
                      <li>• Multi-language support</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* OCR Capability Info */}
              {uploadSettings.enableOCR && (
                <div className="bg-green-50 rounded-lg border border-green-200 p-4">
                  <div className="flex items-start space-x-2">
                    <Icon name="Eye" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-green-800 mb-1">
                        Advanced OCR Enabled
                      </h3>
                      <p className="text-sm text-green-700">
                        Scanned documents and images will be processed using multi-language OCR with support for:
                      </p>
                      <ul className="text-xs text-green-600 mt-2 space-y-1">
                        <li>• English, French, German, Spanish</li>
                        <li>• Italian, Portuguese, Dutch</li>
                        <li>• High-resolution image processing</li>
                        <li>• Text cleanup and formatting</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Action */}
              <div className="bg-surface rounded-lg border border-border-light p-6">
                <h3 className="font-semibold text-text-primary mb-4">Upload Summary</h3>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Selected Files:</span>
                    <span className="font-medium text-text-primary">{selectedFiles.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Total Size:</span>
                    <span className="font-medium text-text-primary">
                      {(selectedFiles.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">AI Analysis:</span>
                    <span className="font-medium text-primary">Gemini Powered</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">OCR:</span>
                    <span className={`font-medium ${uploadSettings.enableOCR ? 'text-success' : 'text-text-secondary'}`}>
                      {uploadSettings.enableOCR ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Backend Status:</span>
                    <span className={`font-medium ${
                      backendHealth?.overall_status === 'healthy' ? 'text-success' : 'text-error'
                    }`}>
                      {backendHealth?.overall_status === 'healthy' ? 'Online' : 'Unavailable'}
                    </span>
                  </div>
                  {selectedFiles.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Est. Time:</span>
                      <span className="font-medium text-text-primary">{getEstimatedTime()}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <button
                    onClick={startUpload}
                    disabled={selectedFiles.length === 0 || isUploading || backendHealth?.overall_status !== 'healthy'}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200 ${
                      selectedFiles.length === 0 || isUploading || backendHealth?.overall_status !== 'healthy'
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-primary text-white hover:bg-blue-700'
                    }`}
                  >
                    {isUploading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Uploading & Analyzing with Gemini...</span>
                      </div>
                    ) : backendHealth?.overall_status !== 'healthy' ? (
                      <div className="flex items-center justify-center space-x-2">
                        <Icon name="AlertCircle" size={16} />
                        <span>Backend Unavailable</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <Icon name="Upload" size={16} />
                        <span>Start Upload & Analysis</span>
                      </div>
                    )}
                  </button>

                  {selectedFiles.length > 0 && !isUploading && (
                    <button
                      onClick={resetUpload}
                      className="w-full py-2 px-4 border border-border-medium rounded-lg text-sm font-medium text-text-secondary hover:bg-gray-50 transition-colors"
                    >
                      Clear All Files
                    </button>
                  )}
                </div>

                {selectedFiles.length > 0 && !isUploading && backendHealth?.overall_status === 'healthy' && (
                  <p className="text-xs text-text-secondary mt-2 text-center">
                    Files will be processed with Gemini AI analysis automatically
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DocumentUpload;