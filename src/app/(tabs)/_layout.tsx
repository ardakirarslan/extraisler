import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';

import { AccentColor, Colors } from '@/constants/theme';
import { countUnreadMessages } from '@/lib/messages';
import { useAuth } from '@/providers/auth-provider';

const UNREAD_POLL_INTERVAL_MS = 20_000;

export default function TabsLayout() {
  const { profile, session } = useAuth();
  const isEmployer = profile?.role === 'employer';
  const userId = session?.user.id;
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    const refresh = () => {
      countUnreadMessages(userId).then((count) => {
        if (!cancelled) setUnreadCount(count);
      });
    };

    refresh();
    const interval = setInterval(refresh, UNREAD_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [userId]);

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        headerShadowVisible: false,
        tabBarStyle: { backgroundColor: '#FFFFFF' },
        tabBarActiveTintColor: AccentColor,
        tabBarInactiveTintColor: Colors.textSecondary,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="applications"
        options={{
          title: isEmployer ? 'İlanlarım' : 'Başvurularım',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={isEmployer ? 'briefcase-outline' : 'document-text-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Mesajlar',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles-outline" size={size} color={color} />,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Ayarlar',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
