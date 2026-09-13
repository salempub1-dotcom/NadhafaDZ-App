import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useAuth } from '@/contexts/AuthContext';

const iconMap: Record<string, { active: string; inactive: string }> = {
  home: { active: 'home', inactive: 'home-outline' },
  map: { active: 'map', inactive: 'map-outline' },
  report: { active: 'megaphone', inactive: 'megaphone-outline' },
  notifications: { active: 'notifications', inactive: 'notifications-outline' },
  profile: { active: 'person-circle', inactive: 'person-circle-outline' },
};

export default function AppLayout() {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#168A55" />
      </View>
    );
  }
  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#168A55',
        tabBarInactiveTintColor: '#8A9690',
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          height: 76,
          paddingTop: 7,
          paddingBottom: 9,
          borderTopWidth: 1,
          borderTopColor: '#E3ECE7',
          backgroundColor: '#FFFFFF',
          elevation: 12,
          shadowColor: '#17352A',
          shadowOpacity: 0.08,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: -4 },
        },
        tabBarLabelStyle: { fontWeight: '800', fontSize: 11 },
        tabBarIcon: ({ focused, color }) => {
          const pair = iconMap[route.name] ?? iconMap.home;
          return (
            <View
              style={{
                width: 40,
                height: 32,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? '#E8F6EF' : 'transparent',
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
