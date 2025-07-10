import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import GlobalHeader from 'components/ui/GlobalHeader';
import BreadcrumbTrail from 'components/ui/BreadcrumbTrail';
import Icon from 'components/AppIcon';
import FileDropZone from './components/FileDropZone';
import FileList from './components/FileList';
import UploadSettings from './components/UploadSettings';
import ProgressTracker from './components/ProgressTracker';
import { uploadDocument } from '../../api' // Assuming this is the API function to handle document uploads';

const DocumentUpload = () => {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadSettings, setUploadSettings] = useState({
    classification: 'auto',
    customTags: '',
    enableOCR: true,
    extractMetadata: true,
    processInBackground: false
  });
  const [uploadProgress, setUploadProgress] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState([]);

  const supportedFormats = ['PDF', 'DOC', 'DOCX', 'TXT'];
  const maxFileSize = 50 * 1024 * 1024; // 50MB
  const maxFiles = 20;

  const validateFile = (file) => {
    const errors = [];
    const fileExtension = file.name.split('.').pop().toUpperCase();
    
    if (!supportedFormats.includes(fileExtension)) {
      errors.push(`Unsupported format: ${fileExtension}`);
    }
    
    if (file.size > maxFileSize) {
      errors.push(`File too large: ${(file.size / (1024 * 1024)).toFixed(1)}MB (max 50MB)`);
    }
    
    return errors;
  };

  const handleFilesSelected = useCallback((newFiles) => {
    const validFiles = [];
    const fileErrors = [];

    Array.from(newFiles).forEach((file) => {
      if (selectedFiles.length + validFiles.length >= maxFiles) {
        fileErrors.push(`Maximum ${maxFiles} files allowed`);
        return;
      }

      const fileValidationErrors = validateFile(file);
      if (fileValidationErrors.length === 0) {
        const fileWithId = {
          id: Date.now() + Math.random(),
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'pending'
        };
        validFiles.push(fileWithId);
      } else {
        fileErrors.push(`${file.name}: ${fileValidationErrors.join(', ')}`);
      }
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
    setErrors(fileErrors);
  }, [selectedFiles.length, maxFiles]);

  const removeFile = (fileId) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
  };

  const simulateUpload = async (file) => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          resolve();
        }
        setUploadProgress(prev => ({
          ...prev,
          [file.id]: Math.min(progress, 100)
        }));
      }, 200);
    });
  };

  const startUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setErrors([]);

    try {
      // Update all files to uploading status
      setSelectedFiles(prev => prev.map(f => ({ ...f, status: 'uploading' })));

      // Upload each file to the backend
    await Promise.all(
      selectedFiles.map(async (file) => {
        try {
          await uploadDocument(file.file); // <-- Use the native File object
          setUploadProgress(prev => ({ ...prev, [file.id]: 100 }));
          setSelectedFiles(prev =>
            prev.map(f => f.id === file.id ? { ...f, status: 'completed' } : f)
          );
        } catch (error) {
          setErrors(prev => [...prev, `Failed to upload ${file.name}: ${error.message}`]);
          setSelectedFiles(prev =>
            prev.map(f => f.id === file.id ? { ...f, status: 'error' } : f)
          );
        }
      })
    );

      // Navigate to analysis dashboard after successful upload
      setTimeout(() => {
        navigate('/analysis-dashboard');
      }, 1000);

    } catch (error) {
      setErrors(['Upload failed. Please try again.']);
      setSelectedFiles(prev => prev.map(f => ({ ...f, status: 'error' })));
    } finally {
      setIsUploading(false);
    }
  };

  const getEstimatedTime = () => {
    const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    const estimatedSeconds = Math.ceil(totalSize / (1024 * 1024) * 2); // 2 seconds per MB
    return estimatedSeconds > 60 ? `${Math.ceil(estimatedSeconds / 60)} min` : `${estimatedSeconds} sec`;
  };

  const getTotalProgress = () => {
    if (selectedFiles.length === 0) return 0;
    const totalProgress = Object.values(uploadProgress).reduce((sum, progress) => sum + progress, 0);
    return Math.round(totalProgress / selectedFiles.length);
  };

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <BreadcrumbTrail />
          
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">Document Upload</h1>
            <p className="text-text-secondary">
              Upload legal documents for analysis and processing. Supported formats: {supportedFormats.join(', ')}
            </p>
          </div>

          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
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
                />
              )}
            </div>

            {/* Settings Sidebar */}
            <div className="space-y-6">
              <UploadSettings
                settings={uploadSettings}
                onSettingsChange={setUploadSettings}
                isUploading={isUploading}
              />

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
                  {selectedFiles.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Est. Time:</span>
                      <span className="font-medium text-text-primary">{getEstimatedTime()}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={startUpload}
                  disabled={selectedFiles.length === 0 || isUploading}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200 ${
                    selectedFiles.length === 0 || isUploading
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :'bg-primary text-white hover:bg-blue-700'
                  }`}
                >
                  {isUploading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Uploading...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <Icon name="Upload" size={16} />
                      <span>Start Upload</span>
                    </div>
                  )}
                </button>

                {selectedFiles.length > 0 && !isUploading && (
                  <p className="text-xs text-text-secondary mt-2 text-center">
                    Files will be processed and analyzed automatically
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