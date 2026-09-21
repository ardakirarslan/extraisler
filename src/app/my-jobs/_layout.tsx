import { Stack } from 'expo-router';

export default function MyJobsLayout() {
  return (
    <Stack screenOptions={{ headerShown: true, title: '' }}>
      <Stack.Screen name="[id]" options={{ title: 'İlan Yönetimi' }} />
    </Stack>
  );
}
