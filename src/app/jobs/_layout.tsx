import { Stack } from 'expo-router';

export default function JobsLayout() {
  return (
    <Stack screenOptions={{ headerShown: true, title: '' }}>
      <Stack.Screen name="index" options={{ title: 'İş İlanları' }} />
      <Stack.Screen name="[id]" options={{ title: 'İlan Detayı' }} />
    </Stack>
  );
}
