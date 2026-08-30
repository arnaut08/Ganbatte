import { createContext, useContext, type Dispatch, type SetStateAction, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import type { AppStatus, SelectorScreen } from '../types';

export type AppContextValue = {
  authLoading: boolean;
  authRequired: boolean;
  user: User | null;
  appHomeKey: number;
  status: AppStatus;
  selectorScreen: SelectorScreen;
  setSelectorScreen: Dispatch<SetStateAction<SelectorScreen>>;
  handleBackToPractice: () => void;
  handleOpenFriends: () => void;
  handleOpenHistory: () => void;
  handleGoBack: () => void;
  handleOpenKanaStudy: () => void;
  handleOpenKanjiStudy: () => void;
  handleStartKanjiLearning: () => void;
  handleOpenVocabStudy: () => void;
  handleStartVocabLearning: () => void;
  handleOpenGrammarStudy: () => void;
  handleOpenGrammarPractice: (maxLesson?: number, count?: number, mode?: string) => Promise<void>;
  selectedKana: Set<string>;
  handleContinueKanaIntro: () => void;
  handleOpenKanaFilter: () => void;
  handleApplyKanaFilters: (selectedKana: Set<string>) => void;
  handleKanaReviewComplete: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ value, children }: { value: AppContextValue; children: ReactNode }) {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
}