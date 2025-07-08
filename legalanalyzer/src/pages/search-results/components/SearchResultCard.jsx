import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from 'components/AppIcon';
import Image from 'components/AppImage';

const SearchResultCard = ({ result, searchQuery }) => {
  const navigate = useNavigate();

  const highlightText = (text, query) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  const handleViewDocument = () => {
    navigate(`/document-viewer?doc=${encodeURIComponent(result.title)}&id=${result.id}`);
  };

  const handleAnalyzeDocument = () => {
    navigate(`/analysis-dashboard?doc=${encodeURIComponent(result.title)}&id=${result.id}`);
  };

  const getRelevanceColor = (score) => {
    if (score >= 90) return 'text-success bg-green-100';
    if (score >= 75) return 'text-warning bg-yellow-100';
    return 'text-text-secondary bg-gray-100';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-surface border border-border-light rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex gap-4">
        {/* Document Thumbnail */}
        <div className="flex-shrink-0 w-20 h-24 bg-gray-100 rounded-lg overflow-hidden">
          <Image
            src={result.thumbnail}
            alt={`${result.title} thumbnail`}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Document Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-text-primary mb-2 line-clamp-2">
                <button
                  onClick={handleViewDocument}
                  className="hover:text-primary transition-colors duration-200 text-left"
                >
                  {highlightText(result.title, searchQuery)}
                </button>
              </h3>
              
              <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary mb-2">
                <span className="flex items-center space-x-1">
                  <Icon name="FileText" size={14} />
                  <span>{result.documentType}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Icon name="Calendar" size={14} />
                  <span>{formatDate(result.date)}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Icon name="HardDrive" size={14} />
                  <span>{result.fileSize}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Icon name="FileText" size={14} />
                  <span>{result.pageCount} pages</span>
                </span>
              </div>
            </div>

            {/* Relevance Score */}
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${getRelevanceColor(result.relevanceScore)}`}>
              {result.relevanceScore}% match
            </div>
          </div>

          {/* Document Snippet */}
          <p className="text-text-secondary text-sm leading-relaxed mb-4 line-clamp-3">
            {highlightText(result.snippet, searchQuery)}
          </p>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            {/* Practice Area */}
            <div className="flex items-center space-x-1">
              <Icon name="Scale" size={14} className="text-text-secondary" />
              <span className="text-sm text-text-secondary">{result.practiceArea}</span>
            </div>

            {/* Parties */}
            {result.parties.length > 0 && (
              <div className="flex items-center space-x-1">
                <Icon name="Users" size={14} className="text-text-secondary" />
                <span className="text-sm text-text-secondary">
                  {result.parties.slice(0, 2).join(', ')}
                  {result.parties.length > 2 && ` +${result.parties.length - 2} more`}
                </span>
              </div>
            )}
          </div>

          {/* Tags */}
          {result.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {result.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-text-secondary text-xs rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleViewDocument}
                className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
              >
                <Icon name="Eye" size={16} />
                <span>View</span>
              </button>
              
              <button
                onClick={handleAnalyzeDocument}
                className="flex items-center space-x-2 px-4 py-2 border border-border-medium text-text-primary rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm font-medium"
              >
                <Icon name="BarChart3" size={16} />
                <span>Analyze</span>
              </button>
              
              <button className="flex items-center space-x-2 px-4 py-2 border border-border-medium text-text-primary rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm font-medium">
                <Icon name="Plus" size={16} />
                <span className="hidden sm:inline">Add to Collection</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              <button className="p-2 text-text-secondary hover:text-primary transition-colors duration-200 rounded-lg hover:bg-gray-50">
                <Icon name="Download" size={16} />
              </button>
              <button className="p-2 text-text-secondary hover:text-primary transition-colors duration-200 rounded-lg hover:bg-gray-50">
                <Icon name="Share2" size={16} />
              </button>
              <button className="p-2 text-text-secondary hover:text-primary transition-colors duration-200 rounded-lg hover:bg-gray-50">
                <Icon name="Bookmark" size={16} />
              </button>
              <button className="p-2 text-text-secondary hover:text-primary transition-colors duration-200 rounded-lg hover:bg-gray-50">
                <Icon name="MoreVertical" size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResultCard;