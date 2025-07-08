import React from 'react';
import Icon from 'components/AppIcon';

const RecentActivity = () => {
  const recentActivities = [
    {
      id: 1,
      type: 'upload',
      title: 'Contract_Amendment_2024.pdf',
      description: 'Document uploaded successfully',
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      icon: 'Upload',
      iconColor: 'text-success',
      iconBg: 'bg-success/10'
    },
    {
      id: 2,
      type: 'analysis',
      title: 'Legal_Brief_Case_456.docx',
      description: 'Analysis completed - 15 key terms identified',
      timestamp: new Date(Date.now() - 900000), // 15 minutes ago
      icon: 'CheckCircle',
      iconColor: 'text-success',
      iconBg: 'bg-success/10'
    },
    {
      id: 3,
      type: 'processing',
      title: 'Merger_Agreement_Draft.docx',
      description: 'Analysis in progress (35% complete)',
      timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
      icon: 'Clock',
      iconColor: 'text-warning',
      iconBg: 'bg-warning/10'
    },
    {
      id: 4,
      type: 'error',
      title: 'Patent_Application_789.pdf',
      description: 'Analysis failed - file format not supported',
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      icon: 'XCircle',
      iconColor: 'text-error',
      iconBg: 'bg-error/10'
    },
    {
      id: 5,
      type: 'upload',
      title: 'Compliance_Report_Q4.pdf',
      description: 'Document uploaded and queued for analysis',
      timestamp: new Date(Date.now() - 7200000), // 2 hours ago
      icon: 'Upload',
      iconColor: 'text-primary',
      iconBg: 'bg-primary/10'
    }
  ];

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now - timestamp) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div className="bg-surface rounded-lg border border-border-light p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">Recent Activity</h3>
        <button className="text-sm text-primary hover:text-blue-700 font-medium">
          View All
        </button>
      </div>
      
      <div className="space-y-4">
        {recentActivities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3">
            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${activity.iconBg}`}>
              <Icon name={activity.icon} size={16} className={activity.iconColor} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-text-primary truncate">
                  {activity.title}
                </p>
                <span className="text-xs text-text-secondary whitespace-nowrap ml-2">
                  {formatTimeAgo(activity.timestamp)}
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-1">
                {activity.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {/* View More Button */}
      <div className="mt-4 pt-4 border-t border-border-light">
        <button className="w-full text-center text-sm text-text-secondary hover:text-text-primary transition-colors duration-200">
          <div className="flex items-center justify-center space-x-1">
            <span>Load more activities</span>
            <Icon name="ChevronDown" size={14} />
          </div>
        </button>
      </div>
    </div>
  );
};

export default RecentActivity;