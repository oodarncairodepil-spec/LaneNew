import { createContext, useContext, ReactNode } from 'react';
import { useStudyStore } from '@/hooks/useStudyStore';

type StudyContextType = ReturnType<typeof useStudyStore>;

const StudyContext = createContext<StudyContextType | null>(null);

export function StudyProvider({ children }: { children: ReactNode }) {
  const store = useStudyStore();
  return <StudyContext.Provider value={store}>{children}</StudyContext.Provider>;
}

export function useStudy() {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error('useStudy must be used within a StudyProvider');
  }
  return context;
}
