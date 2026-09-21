import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const ONBOARDING_KEY = 'hasSeenOnboarding';

type OnboardingContextValue = {
  loading: boolean;
  hasSeenOnboarding: boolean;
  completeOnboarding: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then((value) => setHasSeenOnboarding(value === 'true'))
      .finally(() => setLoading(false));
  }, []);

  const completeOnboarding = () => {
    setHasSeenOnboarding(true);
    AsyncStorage.setItem(ONBOARDING_KEY, 'true').catch((err) => {
      console.warn('Failed to persist onboarding flag:', err);
    });
  };

  return (
    <OnboardingContext.Provider value={{ loading, hasSeenOnboarding, completeOnboarding }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error('useOnboarding must be used within an OnboardingProvider');
  return context;
}
