'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTranslation } from './index';
import { createClient } from '@/lib/supabase/client'; // For updating user profile

const LanguageContext = createContext();

export function LanguageProvider({ initialLanguage, children }) {
  const [language, setLanguage] = useState(initialLanguage);
  const [t, setT] = useState(() => (key, vars) => getTranslation(initialLanguage, key, vars));

  useEffect(() => {
    setT(() => (key, vars) => getTranslation(language, key, vars));
  }, [language]);

  const changeLanguage = async (newLang) => {
    setLanguage(newLang);
    // Update user profile in DB
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ language: newLang })
        .eq('id', user.id);
      if (error) {
        console.error('Error updating user language:', error);
      }
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