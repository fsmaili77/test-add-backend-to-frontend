import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../AppIcon';

const BreadcrumbTrail = () => {
  const location = useLocation();
  
  const routeMap = {
    '/': { label: 'Dashboard', icon: 'Home' },
    '/dashboard': { label: 'Dashboard', icon: 'Home' },
    '/document-upload': { label: 'Document Upload', icon: 'Upload', parent: '/dashboard' },
    '/document-viewer': { label: 'Document Viewer', icon: 'FileText', parent: '/dashboard' },
    '/search-results': { label: 'Search Results', icon: 'Search', parent: '/dashboard' },
    '/analysis-dashboard': { label: 'Analysis Dashboard', icon: 'BarChart3', parent: '/dashboard' },
  };

  const generateBreadcrumbs = () => {
    const currentPath = location.pathname;
    const breadcrumbs = [];
    
    // Always start with Dashboard
    if (currentPath !== '/' && currentPath !== '/dashboard') {
      breadcrumbs.push({
        label: 'Dashboard',
        path: '/dashboard',
        icon: 'Home'
      });
    }

    // Add current page if it's not dashboard
    if (currentPath !== '/' && currentPath !== '/dashboard') {
      const currentRoute = routeMap[currentPath];
      if (currentRoute) {
        breadcrumbs.push({
          label: currentRoute.label,
          path: currentPath,
          icon: currentRoute.icon,
          isActive: true
        });
      }
    }

    // Handle special cases for document viewer with query params
    if (currentPath === '/document-viewer') {
      const urlParams = new URLSearchParams(location.search);
      const docName = urlParams.get('doc');
      if (docName) {
        breadcrumbs[breadcrumbs.length - 1].label = `Viewing: ${decodeURIComponent(docName)}`;
      }
    }

    // Handle search results with query
    if (currentPath === '/search-results') {
      const urlParams = new URLSearchParams(location.search);
      const query = urlParams.get('q');
      if (query) {
        breadcrumbs[breadcrumbs.length - 1].label = `Search: "${decodeURIComponent(query)}"`;
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumbs on login page or if only one item (dashboard)
  if (location.pathname === '/login' || breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 text-sm mb-6" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.path} className="flex items-center">
            {index > 0 && (
              <Icon 
                name="ChevronRight" 
                size={14} 
                className="text-text-secondary mx-2" 
              />
            )}
            
            {crumb.isActive ? (
              <span className="flex items-center space-x-1 text-text-primary font-medium">
                <Icon name={crumb.icon} size={14} />
                <span className="truncate max-w-xs sm:max-w-none">{crumb.label}</span>
              </span>
            ) : (
              <Link
                to={crumb.path}
                className="flex items-center space-x-1 text-text-secondary hover:text-primary nav-hover rounded px-2 py-1 transition-colors duration-200"
              >
                <Icon name={crumb.icon} size={14} />
                <span className="truncate max-w-xs sm:max-w-none">{crumb.label}</span>
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default BreadcrumbTrail;