import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'ru';

interface Translations {
  [key: string]: {
    [K in Language]: string;
  };
}

const translations: Translations = {
  title: {
    en: 'MoodFlow',
    ru: 'MoodFlow',
  },
  subtitle: {
    en: 'Global real-time mood tracker',
    ru: 'Глобальный трекер настроения в реальном времени',
  },
  watching: {
    en: 'watching live',
    ru: 'смотрят сейчас',
  },
  mostCommonMood: {
    en: 'Most Common Mood',
    ru: 'Самое частое настроение',
  },
  percentageSubtitle: {
    en: 'of people feel this way',
    ru: 'людей чувствуют себя так',
  },
  totalResponses: {
    en: 'Total Responses',
    ru: 'Всего ответов',
  },
  collectedToday: {
    en: 'Collected today',
    ru: 'Собрано сегодня',
  },
  yesterdayTop: {
    en: "Yesterday's Top",
    ru: 'Топ вчерашнего дня',
  },
  yesterdayResponses: {
    en: 'total responses',
    ru: 'всего ответов',
  },
  livePulse: {
    en: 'Live Pulse',
    ru: 'Живой пульс',
  },
  latestMood: {
    en: 'Latest global mood',
    ru: 'Последнее настроение',
  },
  howItWorks: {
    en: 'How it works',
    ru: 'Как это работает',
  },
  howItWorksDesc: {
    en: 'MoodFlow collects mood data from Telegram users worldwide. The dashboard updates in real-time as new votes come in.',
    ru: 'MoodFlow собирает данные о настроении пользователей Telegram по всему миру. Дашборд обновляется в реальном времени при поступлении новых голосов.',
  },
  todayVsYesterday: {
    en: 'Today vs Yesterday',
    ru: 'Сегодня против вчера',
  },
  volume: {
    en: 'Volume',
    ru: 'Объем',
  },
  dominantMood: {
    en: 'Dominant Mood',
    ru: 'Доминирующее настроение',
  },
  openInTelegram: {
    en: 'Open in Telegram',
    ru: 'Открыть в Telegram',
  },
  loading: {
    en: 'Loading global vibes...',
    ru: 'Загружаем глобальные вибрации...',
  },
  errorTitle: {
    en: 'Oops!',
    ru: 'Упс!',
  },
  errorDesc: {
    en: 'Failed to load mood statistics.',
    ru: 'Не удалось загрузить статистику настроения.',
  },
  moodMix: {
    en: "Today's Mood Mix",
    ru: 'Смесь настроений сегодня',
  },
  noData: {
    en: 'No mood data yet',
    ru: 'Данных пока нет',
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    // 1. Check local storage
    const saved = localStorage.getItem('moodflow_lang');
    if (saved === 'en' || saved === 'ru') return saved;

    // 2. Check Telegram WebApp
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user?.language_code?.startsWith('ru')) {
      return 'ru';
    }

    // 3. Default
    return 'en';
  });

  useEffect(() => {
    localStorage.setItem('moodflow_lang', language);
  }, [language]);

  const t = (key: string) => {
    return translations[key]?.[language] || key;
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
