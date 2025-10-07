import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { translations } from '../translations';

type Language = 'en' | 'sw';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    loadUserLanguage();
  }, [user]);

  const loadUserLanguage = async () => {
    if (!user?.id) {
      const savedLang = localStorage.getItem('preferredLanguage') as Language;
      if (savedLang) {
        setLanguageState(savedLang);
      }
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('preferred_language')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data?.preferred_language) {
        setLanguageState(data.preferred_language as Language);
        localStorage.setItem('preferredLanguage', data.preferred_language);
      }
    } catch (error) {
      console.error('Error loading language preference:', error);
    }
  };

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('preferredLanguage', lang);

    if (user?.id) {
      try {
        await supabase
          .from('users')
          .update({ preferred_language: lang, updated_at: new Date().toISOString() })
          .eq('id', user.id);
      } catch (error) {
        console.error('Error saving language preference:', error);
      }
    }
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];

    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        console.warn(`Translation missing for key: ${key} in language: ${language}`);
        return key;
      }
    }

    return value;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
