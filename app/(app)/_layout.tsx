import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function AppLayout() {
  const { session, loading } = useAuth();
  if (loading) return <View style={{flex:1,alignItems:'center',justifyContent:'center'}}><ActivityIndicator color="#168A55" /></View>;
  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs screenOptions={{ headerShown:false, tabBarActiveTintColor:'#168A55', tabBarLabelStyle:{fontWeight:'700'} }}>
      <Tabs.Screen name="home" options={{ title:'الرئيسية' }} />
      <Tabs.Screen name="map" options={{ title:'الخريطة' }} />
      <Tabs.Screen name="report" options={{ title:'إبلاغ' }} />
      <Tabs.Screen name="notifications" options={{ title:'التنبيهات' }} />
      <Tabs.Screen name="profile" options={{ title:'حسابي' }} />
    </Tabs>
  );
}
