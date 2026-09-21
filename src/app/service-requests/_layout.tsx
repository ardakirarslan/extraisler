import { Stack } from 'expo-router';

export default function ServiceRequestsLayout() {
  return (
    <Stack screenOptions={{ headerShown: true, title: '' }}>
      <Stack.Screen name="index" options={{ title: "Bi' Zahmet" }} />
      <Stack.Screen name="create" options={{ presentation: 'modal', title: 'Talep Oluştur' }} />
      <Stack.Screen name="[id]" options={{ title: 'Talep Detayı' }} />
      <Stack.Screen name="offers/[id]" options={{ title: 'Gelen Teklifler' }} />
      <Stack.Screen name="complete/[id]" options={{ presentation: 'modal', title: 'İşi Tamamla' }} />
    </Stack>
  );
}
