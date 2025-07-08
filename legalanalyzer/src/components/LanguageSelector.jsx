// src/components/LanguageSelector.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { languages } from '../i18n';
import Icon from './AppIcon';

const LanguageSelector = () => {
  const { language, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLanguage = languages.find(lang => lang.code === language);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 text-text-secondary hover:text-text-primary nav-hover rounded-lg"
        aria-label="Select language"
      >
        <span className="language-flag text-xl">{currentLanguage?.flag}</span>
        <span className="hidden sm:block text-sm font-medium">{currentLanguage?.name}</span>
        <Icon name="ChevronDown" size={16} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-surface rounded-lg shadow-elevation-3 border border-border-light z-[1010] animate-fade-in">
          <div className="py-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  changeLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-2 ${language === lang.code ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-gray-50'}`}
              >
                <span className="text-xl">{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;