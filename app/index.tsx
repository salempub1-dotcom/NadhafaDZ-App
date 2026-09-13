import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const { session, loading } = useAuth();
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#168A55" /></View>;
  return <Redirect href={session ? '/(app)/home' : '/(auth)/login'} />;
}

const styles = StyleSheet.create({ center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7FAF8' } });
