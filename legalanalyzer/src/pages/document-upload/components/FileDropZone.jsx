import React, { useState, useRef } from 'react';
import Icon from 'components/AppIcon';

const FileDropZone = ({ onFilesSelected, supportedFormats, maxFileSize, isUploading }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isUploading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (isUploading) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      onFilesSelected(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const openFileDialog = () => {
    if (!isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="bg-surface rounded-lg border border-border-light p-6">
      <div
        className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200 ${
          isDragOver
            ? 'border-primary bg-blue-50'
            : isUploading
            ? 'border-gray-200 bg-gray-50' :'border-gray-300 hover:border-primary hover:bg-gray-50'
        } ${isUploading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />

        <div className="space-y-4">
          <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
            isDragOver ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
          }`}>
            <Icon name={isDragOver ? "Download" : "Upload"} size={32} />
          </div>

          <div>
            <h3 className={`text-lg font-semibold mb-2 ${
              isUploading ? 'text-gray-400' : 'text-text-primary'
            }`}>
              {isDragOver ? 'Drop files here' : 'Upload Documents'}
            </h3>
            <p className={`text-sm mb-4 ${
              isUploading ? 'text-gray-400' : 'text-text-secondary'
            }`}>
              {isUploading 
                ? 'Upload in progress...' :'Drag and drop files here, or click to browse'
              }
            </p>
          </div>

          {!isUploading && (
            <div className="space-y-2">
              <div className="flex flex-wrap justify-center gap-2">
                {supportedFormats.map((format) => (
                  <span
                    key={format}
                    className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full"
                  >
                    {format}
                  </span>
                ))}
              </div>
              <p className="text-xs text-text-secondary">
                Maximum file size: {(maxFileSize / (1024 * 1024)).toFixed(0)}MB • Up to 20 files
              </p>
            </div>
          )}
        </div>

        {isDragOver && (
          <div className="absolute inset-0 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
            <div className="text-primary font-medium">Release to upload files</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileDropZone;