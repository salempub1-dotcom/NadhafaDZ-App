import { ActivityIndicator, View } from 'react-native';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/ui/theme';

export default function AuthLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}><ActivityIndicator color={colors.primary} /></View>;
  }

  if (session) return <Redirect href="/(app)/home" />;

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />;
}
