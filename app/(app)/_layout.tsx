import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/ui/theme';

const iconMap: Record<string, { active: string; inactive: string }> = {
  home: { active: 'home', inactive: 'home-outline' },
  map: { active: 'map', inactive: 'map-outline' },
  report: { active: 'megaphone', inactive: 'megaphone-outline' },
  notifications: { active: 'notifications', inactive: 'notifications-outline' },
  profile: { active: 'person-circle', inactive: 'person-circle-outline' },
};

export default function AppLayout() {
  const { session, loading } = useAuth();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 10);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!session) return <Redirect href="/" />;

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#88948E',
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          height: 64 + bottomInset,
          paddingTop: 7,
          paddingBottom: bottomInset,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: 'rgba(255,255,255,0.98)',
          elevation: 14,
          shadowColor: colors.primaryDark,
          shadowOpacity: 0.08,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: -4 },
        },
        tabBarLabelStyle: { fontWeight: '800', fontSize: 11, marginTop: 2 },
        tabBarIcon: ({ focused, color }) => {
          const pair = iconMap[route.name] ?? iconMap.home;
          return (
            <View
              style={{
                width: 42,
                height: 31,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? colors.decorative : 'transparent',
              }}
            >
              <Ionicons name={focused ? pair.active : pair.inactive} size={22} color={color} />
            </View>
          );
        },
      })}
    >
      <Tabs.Screen name="home" options={{ title: 'الرئيسية' }} />
      <Tabs.Screen name="map" options={{ title: 'الخريطة' }} />
      <Tabs.Screen name="report" options={{ title: 'إبلاغ' }} />
      <Tabs.Screen name="notifications" options={{ title: 'التنبيهات' }} />
      <Tabs.Screen name="profile" options={{ title: 'حسابي' }} />
    </Tabs>
  );
}
