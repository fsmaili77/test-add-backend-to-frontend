// src/i18n/index.js
import en from './translations/en';
import fr from './translations/fr';
import de from './translations/de';

export const translations = {
  en,
  fr,
  de
};

export const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
];

export const defaultLanguage = 'en';