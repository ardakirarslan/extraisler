import { Stack } from 'expo-router';

export default function RateLayout() {
  return (
    <Stack screenOptions={{ presentation: 'modal', headerShown: true, title: 'Değerlendir' }}>
      <Stack.Screen name="[applicationId]" />
      <Stack.Screen name="service/[requestId]" />
    </Stack>
  );
}
