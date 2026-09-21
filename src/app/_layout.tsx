import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { AuthProvider, useAuth } from '@/providers/auth-provider';
import { OnboardingProvider, useOnboarding } from '@/providers/onboarding-provider';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { session, profile, hasProfileDetails, loading } = useAuth();
  const { loading: onboardingLoading, hasSeenOnboarding } = useOnboarding();

  useEffect(() => {
    if (!loading && !onboardingLoading) SplashScreen.hideAsync();
  }, [loading, onboardingLoading]);

  if (loading || onboardingLoading) return null;

  const needsOnboarding = !hasSeenOnboarding;
  const needsProfileSetup = !!session && !!profile?.role && hasProfileDetails === false;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={needsOnboarding}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={!needsOnboarding && needsProfileSetup}>
        <Stack.Screen name="complete-profile" />
      </Stack.Protected>
      <Stack.Protected guard={!needsOnboarding && !!session && !needsProfileSetup}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="jobs" />
        <Stack.Screen name="my-jobs" />
        <Stack.Screen name="service-requests" />
        <Stack.Screen name="post-job" options={{ presentation: 'modal', headerShown: true, title: 'İlan Oluştur' }} />
        <Stack.Screen name="favorites" options={{ headerShown: true, title: 'Favori Personelim' }} />
        <Stack.Screen name="master-setup" options={{ presentation: 'modal', headerShown: true, title: 'Usta Ol' }} />
        <Stack.Screen name="rate" />
        <Stack.Screen name="masters" options={{ headerShown: true, title: 'Ustalar' }} />
        <Stack.Screen name="edit-profile" options={{ presentation: 'modal', headerShown: true, title: 'Profili Düzenle' }} />
        <Stack.Screen name="my-profile" />
        <Stack.Screen name="coming-soon" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="change-password" options={{ presentation: 'modal', headerShown: true, title: 'Şifre Değiştir' }} />
        <Stack.Screen name="support-center" options={{ headerShown: true, title: 'Destek Merkezi' }} />
        <Stack.Screen name="saved-jobs" options={{ headerShown: true, title: 'Kaydedilen İlanlar' }} />
      </Stack.Protected>
      <Stack.Protected guard={!needsOnboarding && !session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <OnboardingProvider>
      <AuthProvider>
        <ThemeProvider value={DefaultTheme}>
          <RootNavigator />
        </ThemeProvider>
      </AuthProvider>
    </OnboardingProvider>
  );
}
