import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { translations, TranslationDictionary, Language } from '../i18n/translations.js';
import {
  projectStatusTranslations,
  riskLevelTranslations,
  alertStatusTranslations,
  alertTypeTranslations,
  verificationStateTranslations,
  categoryTranslations,
  issueTypeTranslations,
  roleTranslations
} from '../i18n/statusTranslations.js';

export type { Language };
export type Translations = TranslationDictionary;

export interface TranslationFunction extends TranslationDictionary {
  (key: keyof TranslationDictionary | string, params?: Record<string, string | number>): string;
}

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationFunction;
  translateStatus: (status?: string | null) => string;
  translateRiskLevel: (level?: string | null) => string;
  translateAlertStatus: (status?: string | null) => string;
  translateAlertType: (type?: string | null) => string;
  translateVerificationState: (state?: string | null) => string;
  translateCategory: (category?: string | null) => string;
  translateIssueType: (issueType?: string | null) => string;
  translateRole: (role?: string | null) => string;
  formatCurrency: (amount: number, options?: { inCrores?: boolean; inLakhs?: boolean; precision?: number }) => string;
  formatDate: (dateStr: string | Date, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (num: number) => string;
}

const buildTranslationFn = (lang: Language): TranslationFunction => {
  const dict = translations[lang] || translations.en;
  const fn = function (key: keyof TranslationDictionary | string, params?: Record<string, string | number>): string {
    let text = (dict as any)[key] ?? (translations.en as any)[key] ?? String(key);
    if (params && typeof text === 'string') {
      Object.entries(params).forEach(([paramKey, paramVal]) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
      });
    }
    return text;
  };
  return Object.assign(fn, dict) as TranslationFunction;
};

const defaultContext: LanguageContextType = {
  language: 'en',
  setLanguage: () => {},
  t: buildTranslationFn('en'),
  translateStatus: s => s || '',
  translateRiskLevel: l => l || '',
  translateAlertStatus: s => s || '',
  translateAlertType: t => t || '',
  translateVerificationState: v => v || '',
  translateCategory: c => c || '',
  translateIssueType: i => i || '',
  translateRole: r => r || '',
  formatCurrency: amt => `₹${amt.toLocaleString('en-IN')}`,
  formatDate: d => new Date(d).toLocaleDateString('en-IN'),
  formatNumber: n => n.toLocaleString('en-IN')
};

const LanguageContext = createContext<LanguageContextType>(defaultContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('mplads_portal_lang');
        if (saved === 'hi' || saved === 'en') return saved;
      }
    } catch (e) {
      console.warn('[LanguageContext] Failed to read localStorage:', e);
    }
    return 'en';
  });

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('mplads_portal_lang', newLang);
        document.documentElement.lang = newLang;
      }
    } catch (e) {
      console.warn('[LanguageContext] Failed to write to localStorage:', e);
    }
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const t = useMemo(() => buildTranslationFn(language), [language]);

  const translateStatus = (status?: string | null): string => {
    if (!status) return '';
    return projectStatusTranslations[language]?.[status] || projectStatusTranslations.en?.[status] || status;
  };

  const translateRiskLevel = (level?: string | null): string => {
    if (!level) return '';
    return riskLevelTranslations[language]?.[level] || riskLevelTranslations.en?.[level] || level;
  };

  const translateAlertStatus = (status?: string | null): string => {
    if (!status) return '';
    return alertStatusTranslations[language]?.[status] || alertStatusTranslations.en?.[status] || status;
  };

  const translateAlertType = (type?: string | null): string => {
    if (!type) return '';
    return alertTypeTranslations[language]?.[type] || alertTypeTranslations.en?.[type] || type;
  };

  const translateVerificationState = (state?: string | null): string => {
    if (!state) return '';
    return verificationStateTranslations[language]?.[state] || verificationStateTranslations.en?.[state] || state;
  };

  const translateCategory = (category?: string | null): string => {
    if (!category) return '';
    return categoryTranslations[language]?.[category] || categoryTranslations.en?.[category] || category;
  };

  const translateIssueType = (issueType?: string | null): string => {
    if (!issueType) return '';
    return issueTypeTranslations[language]?.[issueType] || issueTypeTranslations.en?.[issueType] || issueType;
  };

  const translateRole = (role?: string | null): string => {
    if (!role) return '';
    return roleTranslations[language]?.[role] || roleTranslations.en?.[role] || role;
  };

  const formatCurrency = (
    amount: number,
    options?: { inCrores?: boolean; inLakhs?: boolean; precision?: number }
  ): string => {
    const num = Number(amount) || 0;
    const precision = options?.precision ?? (options?.inCrores ? 2 : options?.inLakhs ? 1 : 0);

    if (options?.inCrores) {
      const crVal = (num / 10000000).toFixed(precision);
      const unit = language === 'hi' ? 'करोड़' : 'Cr';
      return `₹${crVal} ${unit}`;
    }

    if (options?.inLakhs) {
      const lakhVal = (num / 100000).toFixed(precision);
      const unit = language === 'hi' ? 'लाख' : 'Lakh';
      return `₹${lakhVal} ${unit}`;
    }

    try {
      return new Intl.NumberFormat(language === 'hi' ? 'hi-IN' : 'en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: precision
      }).format(num);
    } catch {
      return `₹${num.toLocaleString('en-IN')}`;
    }
  };

  const formatDate = (dateStr: string | Date, options?: Intl.DateTimeFormatOptions): string => {
    if (!dateStr) return '';
    try {
      const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
      if (isNaN(date.getTime())) return String(dateStr);
      return date.toLocaleDateString(
        language === 'hi' ? 'hi-IN' : 'en-IN',
        options || { day: 'numeric', month: 'short', year: 'numeric' }
      );
    } catch {
      return String(dateStr);
    }
  };

  const formatNumber = (num: number): string => {
    const n = Number(num) || 0;
    try {
      return n.toLocaleString(language === 'hi' ? 'hi-IN' : 'en-IN');
    } catch {
      return String(n);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        translateStatus,
        translateRiskLevel,
        translateAlertStatus,
        translateAlertType,
        translateVerificationState,
        translateCategory,
        translateIssueType,
        translateRole,
        formatCurrency,
        formatDate,
        formatNumber
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => useContext(LanguageContext);
