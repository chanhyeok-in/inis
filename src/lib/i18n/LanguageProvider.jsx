'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTranslation } from './index';
import { updateUserLanguage } from '@/app/actions'; // Import the server action

const LanguageContext = createContext();

export function LanguageProvider({ initialLanguage, children }) {
  const [language, setLanguage] = useState(initialLanguage);
  const [t, setT] = useState(() => (key, vars) => getTranslation(initialLanguage, key, vars));

  useEffect(() => {
    setT(() => (key, vars) => getTranslation(language, key, vars));
  }, [language]);

  const changeLanguage = async (newLang) => {
    setLanguage(newLang);
    // Call the server action to update the language in the database
    const result = await updateUserLanguage(newLang);
    if (!result.success) {
      console.error('Failed to update user language:', result.message);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
