// legalanalyzer\src\pages\document-upload\components\FileDropZone.jsx
import React, { useState, useRef } from 'react';
import Icon from 'components/AppIcon';

const FileDropZone = ({ 
  onFilesSelected, 
  supportedFormats, 
  maxFileSize, 
  isUploading 
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading) setIsDragOver(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (isUploading) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFilesSelected(files);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFilesSelected(files);
    }
    // Reset input so the same file can be selected again
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
        className={`relative border-2 border-dashed rounded-xl p-16 text-center transition-all duration-200 cursor-pointer
          ${isDragOver 
            ? 'border-primary bg-blue-50 scale-[1.01]' 
            : isUploading 
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
              : 'border-gray-300 hover:border-primary hover:bg-gray-50'
          }`}
        onDragEnter={handleDragEnter}
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

        <div className="space-y-6">
          {/* Icon */}
          <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center transition-colors
            ${isDragOver ? 'bg-primary text-white scale-110' : 'bg-gray-100 text-gray-400'}`}>
            <Icon 
              name={isDragOver ? "Download" : "UploadCloud"} 
              size={42} 
            />
          </div>

          {/* Text */}
          <div>
            <h3 className={`text-xl font-semibold mb-2 transition-colors
              ${isUploading ? 'text-gray-400' : isDragOver ? 'text-primary' : 'text-text-primary'}`}>
              {isDragOver 
                ? 'Drop your files here' 
                : 'Upload Legal Documents'}
            </h3>
            
            <p className={`text-sm max-w-md mx-auto transition-colors
              ${isUploading ? 'text-gray-400' : 'text-text-secondary'}`}>
              {isUploading 
                ? 'Upload in progress... Please wait' 
                : 'Drag & drop files here, or click to browse from your computer'}
            </p>
          </div>

          {/* Supported Formats & Limits */}
          {!isUploading && (
            <div className="flex flex-col items-center gap-3">
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
                Maximum { (maxFileSize / (1024 * 1024)).toFixed(0) }MB per file • Up to 20 files
              </p>
            </div>
          )}
        </div>

        {/* Drag Overlay */}
        {isDragOver && (
          <div className="absolute inset-0 bg-primary/10 border-2 border-primary border-dashed rounded-xl flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <Icon name="Download" size={48} className="text-primary mx-auto mb-3" />
              <p className="font-medium text-primary text-lg">Release to upload</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileDropZone;