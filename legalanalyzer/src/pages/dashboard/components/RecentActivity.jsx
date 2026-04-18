// legalanalyzer/src/pages/dashboard/components/RecentActivity.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Icon from 'components/AppIcon';
import { getDocuments, formatFileSize } from '../../../api';

const RecentActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // 🔥 CRITICAL FIX: The backend requires clientId for non-admin users.
        // Without it, get_documents() returns [].
        const selectedClientId = localStorage.getItem('selectedClientId');
        const documents = await getDocuments(selectedClientId || undefined);
        
        console.log('[RecentActivity] Fetched documents:', documents.length);
        
        // Generate activities from real document data
        const recentActivities = generateActivitiesFromDocuments(documents);
        
        // Sort by timestamp (most recent first)
        const sortedActivities = recentActivities
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 20);
        
        setActivities(sortedActivities);
      } catch (err) {
        console.error('Error fetching recent activity:', err);
        setError(err.message);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecentActivity();
  }, []);

  const generateActivitiesFromDocuments = (documents) => {
    const activities = [];
    
    documents.forEach(doc => {
      // ✅ FIX: Support both backend field names (creation_date from Flask, uploadedAt from legacy)
      const uploadDate = doc.creation_date || doc.uploadedAt;
      
      // Upload activity
      if (uploadDate) {
        activities.push({
          id: `upload-${doc.id}`,
          type: 'upload',
          title: doc.filename,
          description: `Document uploaded (${doc.file_size || doc.size ? formatFileSize(doc.file_size || doc.size) : 'Unknown size'})`,
          timestamp: new Date(uploadDate),
          icon: 'Upload',
          iconColor: 'text-primary',
          iconBg: 'bg-primary/10',
          documentId: doc.id,
          status: 'completed'
        });
      }
      
      // Analysis activity based on status
      if (doc.status === 'Analyzed' && doc.analysis_duration_ms) {
        const analysisTime = new Date(uploadDate || Date.now());
        analysisTime.setMilliseconds(analysisTime.getMilliseconds() + doc.analysis_duration_ms);
        
        activities.push({
          id: `analysis-${doc.id}`,
          type: 'analysis',
          title: doc.filename,
          description: `Gemini AI analysis completed in ${(doc.analysis_duration_ms / 1000).toFixed(1)}s`,
          timestamp: analysisTime,
          icon: 'CheckCircle',
          iconColor: 'text-success',
          iconBg: 'bg-success/10',
          documentId: doc.id,
          status: 'completed'
        });
      } else if (doc.status === 'Processing') {
        activities.push({
          id: `processing-${doc.id}`,
          type: 'processing',
          title: doc.filename,
          description: 'Gemini AI analysis in progress...',
          timestamp: new Date(uploadDate || Date.now()),
          icon: 'Clock',
          iconColor: 'text-warning',
          iconBg: 'bg-warning/10',
          documentId: doc.id,
          status: 'in_progress'
        });
      } else if (doc.status === 'Error') {
        activities.push({
          id: `error-${doc.id}`,
          type: 'error',
          title: doc.filename,
          description: 'Analysis failed - Check file format and try again',
          timestamp: new Date(uploadDate || Date.now()),
          icon: 'XCircle',
          iconColor: 'text-error',
          iconBg: 'bg-error/10',
          documentId: doc.id,
          status: 'failed'
        });
      } else if (doc.status === 'Pending') {
        activities.push({
          id: `pending-${doc.id}`,
          type: 'pending',
          title: doc.filename,
          description: 'Queued for Gemini AI analysis',
          timestamp: new Date(uploadDate || Date.now()),
          icon: 'Clock',
          iconColor: 'text-secondary',
          iconBg: 'bg-secondary/10',
          documentId: doc.id,
          status: 'queued'
        });
      }
    });
    
    return activities;
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now - timestamp) / (1000 * 60));
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
  };

  const getActivityAction = (activity) => {
    switch (activity.type) {
      case 'upload':
        return (
          <Link to={`/document-viewer?doc=${encodeURIComponent(activity.documentId)}`} className="text-primary hover:text-blue-700 text-xs font-medium">
            View
          </Link>
        );
      case 'analysis':
        return (
          <Link to={`/document-viewer?doc=${encodeURIComponent(activity.documentId)}&view=analysis`} className="text-success hover:text-green-700 text-xs font-medium">
            View Analysis
          </Link>
        );
      case 'error':
        return (
          <button onClick={() => console.log('Retry analysis for:', activity.documentId)} className="text-error hover:text-red-700 text-xs font-medium">
            Retry
          </button>
        );
      default:
        return null;
    }
  };

  const displayedActivities = showAll ? activities : activities.slice(0, 5);

  if (loading) {
    return (
      <div className="bg-surface rounded-lg border border-border-light p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">Recent Activity</h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface rounded-lg border border-border-light p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">Recent Activity</h3>
        </div>
        <div className="text-center py-4">
          <Icon name="AlertCircle" size={24} className="text-error mx-auto mb-2" />
          <p className="text-sm text-error">Failed to load recent activity</p>
          <button onClick={() => window.location.reload()} className="text-xs text-primary hover:text-blue-700 mt-1">
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-surface rounded-lg border border-border-light p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">Recent Activity</h3>
        </div>
        <div className="text-center py-8">
          <Icon name="Activity" size={32} className="text-text-secondary mx-auto mb-3" />
          <p className="text-sm text-text-secondary mb-2">No recent activity</p>
          <p className="text-xs text-text-secondary">Upload documents to see activity here</p>
          <Link to="/document-upload" className="inline-flex items-center px-3 py-1 mt-3 text-xs bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Icon name="Upload" size={12} className="mr-1" />
            Upload Documents
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg border border-border-light p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">Recent Activity</h3>
        <div className="text-sm text-text-secondary">{activities.length} activities</div>
      </div>
      
      <div className="space-y-4">
        {displayedActivities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3 group">
            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${activity.iconBg} group-hover:scale-110 transition-transform duration-200`}>
              <Icon name={activity.icon} size={16} className={activity.iconColor} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-text-primary truncate pr-2" title={activity.title}>
                  {activity.title}
                </p>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {getActivityAction(activity)}
                  <span className="text-xs text-text-secondary whitespace-nowrap">
                    {formatTimeAgo(activity.timestamp)}
                  </span>
                </div>
              </div>
              <p className="text-xs text-text-secondary mt-1 pr-4">
                {activity.description}
              </p>
              
              {activity.status === 'in_progress' && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div className="bg-warning h-1 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                    </div>
                    <span className="text-xs text-warning font-medium">Processing</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {activities.length > 5 && (
        <div className="mt-4 pt-4 border-t border-border-light">
          <button onClick={() => setShowAll(!showAll)} className="w-full text-center text-sm text-text-secondary hover:text-text-primary transition-colors duration-200">
            <div className="flex items-center justify-center space-x-1">
              <span>{showAll ? 'Show less' : `Show ${activities.length - 5} more activities`}</span>
              <Icon name={showAll ? "ChevronUp" : "ChevronDown"} size={14} />
            </div>
          </button>
        </div>
      )}
      
      {activities.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border-light">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <div className="text-xs font-medium text-success">{activities.filter(a => a.type === 'analysis').length}</div>
              <div className="text-xs text-text-secondary">Analyzed</div>
            </div>
            <div>
              <div className="text-xs font-medium text-warning">{activities.filter(a => a.type === 'processing').length}</div>
              <div className="text-xs text-text-secondary">Processing</div>
            </div>
            <div>
              <div className="text-xs font-medium text-secondary">{activities.filter(a => a.type === 'pending').length}</div>
              <div className="text-xs text-text-secondary">Pending</div>
            </div>
            <div>
              <div className="text-xs font-medium text-error">{activities.filter(a => a.type === 'error').length}</div>
              <div className="text-xs text-text-secondary">Failed</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;