// src/components/ui/GlobalHeader.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../AppIcon';
import LanguageSelector from '../LanguageSelector';
import { useLanguage } from '../../contexts/LanguageContext';

const GlobalHeader = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const userMenuRef = useRef(null);
  const { texts } = useLanguage();

  const navigationItems = [
    { label: texts.dashboard, path: '/dashboard', icon: 'LayoutDashboard' },
    { label: texts.documents, path: '/document-upload', icon: 'FileText' },
    { label: texts.search, path: '/search-results', icon: 'Search' },
    { label: texts.analytics, path: '/analysis-dashboard', icon: 'BarChart3' },
  ];

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
      // Navigate to search results with query
      window.location.href = `/search-results?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const handleLogout = () => {
    // Handle logout logic
    localStorage.removeItem('authToken');
    window.location.href = '/login';
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
              {texts.appName}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg nav-hover font-medium text-sm ${isActivePath(item.path) ? 'bg-primary text-white' :'text-text-secondary hover:text-text-primary hover:bg-gray-50'}`}
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
                placeholder={texts.searchPlaceholder}
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
                className="flex items-center space-x-2 p-2 text-text-secondary hover:text-text-primary nav-hover rounded-lg"
              >
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <Icon name="User" size={16} color="white" />
                </div>
                <span className="hidden sm:block font-medium text-sm">John Doe</span>
                <Icon name="ChevronDown" size={16} />
              </button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-surface rounded-lg shadow-elevation-3 border border-border-light z-[1010] animate-fade-in">
                  <div className="py-2">
                    <div className="px-4 py-2 border-b border-border-light">
                      <p className="font-medium text-sm text-text-primary">John Doe</p>
                      <p className="text-xs text-text-secondary">john.doe@lawfirm.com</p>
                    </div>
                    <button className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-gray-50 nav-hover">
                      {texts.accountSettings}
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-error hover:bg-red-50 nav-hover"
                    >
                      {texts.signOut}
                    </button>
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
            className="fixed inset-0 bg-black bg-opacity-50 z-[1019] lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed top-0 left-0 h-full w-80 bg-surface z-[1020] lg:hidden animate-slide-in shadow-elevation-3">
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                    <Icon name="Scale" size={20} color="white" />
                  </div>
                  <span className="font-heading font-semibold text-lg text-primary">
                    {texts.appName}
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
                    placeholder={texts.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-background"
                  />
                </div>
              </form>

              {/* Mobile Navigation */}
              <nav className="space-y-2">
                {navigationItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg nav-hover font-medium ${isActivePath(item.path) ? 'bg-primary text-white' :'text-text-secondary hover:text-text-primary hover:bg-gray-50'}`}
                  >
                    <Icon name={item.icon} size={20} />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>

              {/* Mobile User Info */}
              <div className="mt-8 pt-6 border-t border-border-light">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <Icon name="User" size={20} color="white" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">John Doe</p>
                    <p className="text-sm text-text-secondary">john.doe@lawfirm.com</p>
                  </div>
                </div>
                <button className="w-full text-left px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-gray-50 nav-hover rounded-lg mb-2">
                  {texts.accountSettings}
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-error hover:bg-red-50 nav-hover rounded-lg"
                >
                  {texts.signOut}
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