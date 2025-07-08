import React from 'react';
import Icon from 'components/AppIcon';

const FileList = ({ files, uploadProgress, onRemoveFile, isUploading }) => {
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'FileText';
      case 'doc': case'docx':
        return 'FileText';
      case 'txt':
        return 'File';
      default:
        return 'File';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-success';
      case 'uploading':
        return 'text-primary';
      case 'error':
        return 'text-error';
      default:
        return 'text-text-secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return 'CheckCircle';
      case 'uploading':
        return 'Loader';
      case 'error':
        return 'XCircle';
      default:
        return 'Clock';
    }
  };

  return (
    <div className="bg-surface rounded-lg border border-border-light">
      <div className="p-4 border-b border-border-light">
        <h3 className="font-semibold text-text-primary">Selected Files ({files.length})</h3>
      </div>

      <div className="divide-y divide-border-light max-h-96 overflow-y-auto">
        {files.map((file) => {
          const progress = uploadProgress[file.id] || 0;
          
          return (
            <div key={file.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Icon name={getFileIcon(file.name)} size={20} className="text-gray-600" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-text-primary truncate pr-2">
                        {file.name}
                      </p>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <Icon 
                          name={getStatusIcon(file.status)} 
                          size={16} 
                          className={`${getStatusColor(file.status)} ${
                            file.status === 'uploading' ? 'animate-spin' : ''
                          }`}
                        />
                        {!isUploading && (
                          <button
                            onClick={() => onRemoveFile(file.id)}
                            className="p-1 text-text-secondary hover:text-error transition-colors duration-200"
                            title="Remove file"
                          >
                            <Icon name="X" size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-text-secondary">
                        {formatFileSize(file.size)} • {file.name.split('.').pop().toUpperCase()}
                      </p>
                      {file.status === 'uploading' && (
                        <span className="text-xs text-primary font-medium">
                          {Math.round(progress)}%
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {file.status === 'uploading' && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-primary h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FileList;