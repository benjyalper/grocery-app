import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations, interpolate } from './i18n';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('grocery-lang') || 'he');

  // Apply direction + lang to <html> whenever language changes
  useEffect(() => {
    const dir = lang === 'en' ? 'ltr' : 'rtl';
    document.documentElement.dir  = dir;
    document.documentElement.lang = lang;
    document.body.dir             = dir;
    localStorage.setItem('grocery-lang', lang);
  }, [lang]);

  const toggle = useCallback(() => {
    setLang((prev) => (prev === 'he' ? 'en' : 'he'));
  }, []);

  /** Translate a key, with optional variable interpolation */
  const t = useCallback((key, vars) => {
    const str = translations[lang]?.[key] ?? translations.he[key] ?? key;
    return vars ? interpolate(str, vars) : str;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, toggle, t, isRTL: lang === 'he' }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
}
