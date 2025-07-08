import React from 'react';
import { Link } from 'react-router-dom';
import Icon from 'components/AppIcon';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icon name="FileX" size={48} className="text-primary" />
          </div>
          <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-text-primary mb-4">Page Not Found</h2>
          <p className="text-text-secondary mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center space-x-2 w-full bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            <Icon name="Home" size={20} />
            <span>Back to Dashboard</span>
          </Link>
          
          <Link
            to="/search-results"
            className="inline-flex items-center justify-center space-x-2 w-full border border-border-medium text-text-primary px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
          >
            <Icon name="Search" size={20} />
            <span>Search Documents</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;