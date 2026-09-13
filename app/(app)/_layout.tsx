import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

const iconMap: Record<string,string> = {
  home:'⌂',
  map:'🗺',
  report:'＋',
  notifications:'🔔',
  profile:'👤',
};

export default function AppLayout() {
  const { session, loading } = useAuth();
  if (loading) return <View style={{flex:1,alignItems:'center',justifyContent:'center'}}><ActivityIndicator color="#168A55" /></View>;
  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs screenOptions={({route})=>({
      headerShown:false,
      tabBarActiveTintColor:'#168A55',
      tabBarInactiveTintColor:'#88968F',
      tabBarStyle:{height:72,paddingTop:7,paddingBottom:8,borderTopWidth:1,borderTopColor:'#E4ECE8',backgroundColor:'#FFFFFF'},
      tabBarLabelStyle:{fontWeight:'800',fontSize:11},
      tabBarIcon:({focused})=><View style={{width:34,height:28,borderRadius:12,alignItems:'center',justifyContent:'center',backgroundColor:focused?'#EAF7F0':'transparent'}}><Text style={{fontSize:18,color:focused?'#168A55':'#88968F'}}>{iconMap[route.name]??'•'}</Text></View>,
    })}>
      <Tabs.Screen name="home" options={{ title:'الرئيسية' }} />
      <Tabs.Screen name="map" options={{ title:'الخريطة' }} />
      <Tabs.Screen name="report" options={{ title:'إبلاغ' }} />
      <Tabs.Screen name="notifications" options={{ title:'التنبيهات' }} />
      <Tabs.Screen name="profile" options={{ title:'حسابي' }} />
    </Tabs>
  );
}
