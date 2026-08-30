import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import CelebrationModal, { type Celebration } from '../components/common/CelebrationModal';

export type CelebrationContextValue = {
  /** Adds a celebration to the queue; popups display one at a time in order. */
  queueCelebration: (celebration: Celebration) => void;
  /** True while a celebration popup is on screen. */
  hasActiveCelebration: boolean;
};

const CelebrationContext = createContext<CelebrationContextValue | null>(null);

/**
 * Owns the global celebration queue and renders the active CelebrationModal
 * above the whole app. Mount it once, near the root of the component tree.
 */
export function CelebrationProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<Celebration[]>([]);

  const queueCelebration = useCallback((celebration: Celebration) => {
    setQueue((current) => [...current, celebration]);
  }, []);

  const dismissCurrent = useCallback(() => {
    setQueue((current) => current.slice(1));
  }, []);

  const value = useMemo(
    () => ({ queueCelebration, hasActiveCelebration: queue.length > 0 }),
    [queueCelebration, queue.length]
  );

  const currentCelebration = queue.length > 0 ? queue[0] : undefined;

  return (
    <CelebrationContext.Provider value={value}>
      {children}
      {currentCelebration && (
        <CelebrationModal celebration={currentCelebration} onDismiss={dismissCurrent} />
      )}
    </CelebrationContext.Provider>
  );
}

export function useCelebrations(): CelebrationContextValue {
  const context = useContext(CelebrationContext);
  if (!context) throw new Error('useCelebrations must be used within CelebrationProvider');
  return context;
}
