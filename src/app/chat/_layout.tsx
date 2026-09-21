import { Stack } from 'expo-router';

export default function ChatLayout() {
  return (
    <Stack screenOptions={{ headerShown: true, title: '' }}>
      <Stack.Screen name="[id]" options={{ title: 'Mesaj' }} />
    </Stack>
  );
}
