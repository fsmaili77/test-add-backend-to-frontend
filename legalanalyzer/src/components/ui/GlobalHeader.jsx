// src/components/ui/GlobalHeader.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import LanguageSelector from '../LanguageSelector';
import { useLanguage } from '../../contexts/LanguageContext';
import authService from '../../services/authService';

const GlobalHeader = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const userMenuRef = useRef(null);
  const { texts } = useLanguage();

  useEffect(() => {
    // Load user from auth service
    const loadUser = async () => {
      if (authService.isAuthenticated()) {
        try {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          console.error('Failed to load user:', error);
          const cachedUser = authService.getUser();
          setUser(cachedUser);
        }
      }
    };

    loadUser();
  }, []);

  const navigationItems = [
    { label: texts.dashboard || 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
    { label: texts.documents || 'Documents', path: '/document-upload', icon: 'FileText' },
    { label: texts.clients || 'Clients', path: '/clients', icon: 'Users' },
    { label: texts.search || 'Search', path: '/search-results', icon: 'Search' },
    { label: texts.analytics || 'Analytics', path: '/analysis-dashboard', icon: 'BarChart3' },
    { label: texts.servicePlus || 'Service+', path: '/service-plus', icon: 'Star' },
  ];

  // Filter navigation based on user roles
  const filteredNavigation = navigationItems.filter(item => {
    if (item.path === '/service-plus' && !authService.canAccessAdvancedFeatures()) {
      return false;
    }
    return true;
  });

  const isActivePath = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname === path;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search-results?q=${encodeURIComponent(searchQuery)}`);
      setIsMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API call fails
      authService.clearTokens();
      navigate('/login');
    }
  };

  const getUserInitials = () => {
    if (!user) return '?';
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    return user.email?.charAt(0).toUpperCase() || '?';
  };

  const getUserDisplayName = () => {
    if (!user) return 'User';
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.username) {
      return user.username;
    }
    return user.email?.split('@')[0] || 'User';
  };

  const getUserRole = () => {
    if (!user || !user.roles || user.roles.length === 0) return 'User';
    return user.roles[0]; // Display primary role
  };

  const getQuotaPercentage = () => {
    if (!user || !user.documentQuota || user.documentQuota <= 0) return 0;
    return Math.min(100, (user.documentsProcessedThisMonth / user.documentQuota) * 100);
  };

  const getQuotaColor = () => {
    const percentage = getQuotaPercentage();
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-amber-500';
    return 'bg-green-500';
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-surface border-b border-border-light z-[1000]">
        <div className="px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-3 nav-hover rounded-lg px-2 py-1">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <Icon name="Scale" size={20} color="white" />
            </div>
            <span className="font-heading font-semibold text-lg text-primary hidden sm:block">
              {texts.appName || 'LegalAnalyzer'}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {filteredNavigation.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg nav-hover font-medium text-sm transition-colors ${
                  isActivePath(item.path)
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:text-text-primary hover:bg-gray-50'
                }`}
              >
                <Icon name={item.icon} size={16} />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Icon
                name="Search"
                size={16}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary"
              />
              <input
                type="text"
                placeholder={texts.searchPlaceholder || 'Search documents...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-background text-sm"
              />
            </div>
          </form>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <LanguageSelector />

            {/* Mobile Search Icon */}
            <Link
              to="/search-results"
              className="md:hidden p-2 text-text-secondary hover:text-text-primary nav-hover rounded-lg"
            >
              <Icon name="Search" size={20} />
            </Link>

            {/* Notifications */}
            <button className="p-2 text-text-secondary hover:text-text-primary nav-hover rounded-lg relative">
              <Icon name="Bell" size={20} />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-error rounded-full"></span>
            </button>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 p-2 text-text-secondary hover:text-text-primary nav-hover rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">{getUserInitials()}</span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="font-medium text-sm text-text-primary">{getUserDisplayName()}</p>
                  <p className="text-xs text-text-secondary">{getUserRole()}</p>
                </div>
                <Icon name="ChevronDown" size={16} className={`transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-surface rounded-lg shadow-elevation-3 border border-border-light z-[1010] animate-fade-in">
                  <div className="py-2">
                    {/* User Info Section */}
                    <div className="px-4 py-3 border-b border-border-light">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-white text-lg font-semibold">{getUserInitials()}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm text-text-primary">{getUserDisplayName()}</p>
                          <p className="text-xs text-text-secondary truncate">{user?.email}</p>
                        </div>
                      </div>
                      
                      {/* Role and Subscription Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {getUserRole()}
                        </span>
                        {user?.subscriptionTier && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            {user.subscriptionTier}
                          </span>
                        )}
                      </div>

                      {/* Document Quota Progress */}
                      {user?.documentQuota && user.documentQuota > 0 && (
                        <div className="mt-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-text-secondary">Document Quota</span>
                            <span className="text-xs font-medium text-text-primary">
                              {user.documentsProcessedThisMonth}/{user.documentQuota}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full transition-all ${getQuotaColor()}`}
                              style={{ width: `${getQuotaPercentage()}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Menu Items */}
                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-gray-50 nav-hover flex items-center gap-2 transition-colors"
                      >
                        <Icon name="User" size={16} />
                        {texts.accountSettings || 'Account Settings'}
                      </Link>

                      <Link
                        to="/clients"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-gray-50 nav-hover flex items-center gap-2 transition-colors"
                      >
                        <Icon name="Users" size={16} />
                        {texts.clients || 'Clients'}
                      </Link>

                      {authService.canManageUsers() && (
                        <Link
                          to="/admin/users"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-gray-50 nav-hover flex items-center gap-2 transition-colors"
                        >
                          <Icon name="Users" size={16} />
                          User Management
                        </Link>
                      )}

                      <Link
                        to="/settings"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-gray-50 nav-hover flex items-center gap-2 transition-colors"
                      >
                        <Icon name="Settings" size={16} />
                        Settings
                      </Link>

                      <div className="border-t border-border-light my-1"></div>

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-error hover:bg-red-50 nav-hover flex items-center gap-2 transition-colors"
                      >
                        <Icon name="LogOut" size={16} />
                        {texts.signOut || 'Sign Out'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-text-secondary hover:text-text-primary nav-hover rounded-lg"
            >
              <Icon name={isMobileMenuOpen ? "X" : "Menu"} size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-[1019] lg:hidden animate-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed top-0 left-0 h-full w-80 bg-surface z-[1020] lg:hidden animate-slide-in shadow-elevation-3 overflow-y-auto">
            <div className="p-6">
              {/* Mobile Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                    <Icon name="Scale" size={20} color="white" />
                  </div>
                  <span className="font-heading font-semibold text-lg text-primary">
                    {texts.appName || 'LegalAnalyzer'}
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-text-secondary hover:text-text-primary nav-hover rounded-lg"
                >
                  <Icon name="X" size={20} />
                </button>
              </div>

              {/* Language Selector in Mobile Menu */}
              <div className="mb-4">
                <LanguageSelector />
              </div>

              {/* Mobile Search */}
              <form onSubmit={handleSearchSubmit} className="mb-6">
                <div className="relative">
                  <Icon
                    name="Search"
                    size={16}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary"
                  />
                  <input
                    type="text"
                    placeholder={texts.searchPlaceholder || 'Search documents...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-background"
                  />
                </div>
              </form>

              {/* Mobile Navigation */}
              <nav className="space-y-2 mb-6">
                {filteredNavigation.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg nav-hover font-medium transition-colors ${
                      isActivePath(item.path)
                        ? 'bg-primary text-white'
                        : 'text-text-secondary hover:text-text-primary hover:bg-gray-50'
                    }`}
                  >
                    <Icon name={item.icon} size={20} />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>

              {/* Mobile User Info */}
              <div className="pt-6 border-t border-border-light">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-lg font-semibold">{getUserInitials()}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-text-primary">{getUserDisplayName()}</p>
                    <p className="text-sm text-text-secondary truncate">{user?.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {getUserRole()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Document Quota in Mobile */}
                {user?.documentQuota && user.documentQuota > 0 && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-text-secondary">Document Quota</span>
                      <span className="text-xs font-medium text-text-primary">
                        {user.documentsProcessedThisMonth}/{user.documentQuota}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${getQuotaColor()}`}
                        style={{ width: `${getQuotaPercentage()}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-left px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-gray-50 nav-hover rounded-lg mb-2 flex items-center gap-2"
                >
                  <Icon name="User" size={16} />
                  {texts.accountSettings || 'Account Settings'}
                </Link>

                {authService.canManageUsers() && (
                  <Link
                    to="/admin/users"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full text-left px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-gray-50 nav-hover rounded-lg mb-2 flex items-center gap-2"
                  >
                    <Icon name="Users" size={16} />
                    User Management
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-error hover:bg-red-50 nav-hover rounded-lg flex items-center gap-2"
                >
                  <Icon name="LogOut" size={16} />
                  {texts.signOut || 'Sign Out'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default GlobalHeader;