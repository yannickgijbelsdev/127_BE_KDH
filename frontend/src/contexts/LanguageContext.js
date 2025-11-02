import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Get from localStorage or default to 'nl'
    return localStorage.getItem('language') || 'nl';
  });

  useEffect(() => {
    // Save to localStorage whenever language changes
    localStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'nl' ? 'en' : 'nl');
  };

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    t: (nl, en) => language === 'nl' ? nl : en
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
