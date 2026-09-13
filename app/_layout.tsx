import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/contexts/AuthContext';
import { NeighborhoodProvider } from '@/contexts/NeighborhoodContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <NeighborhoodProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </NeighborhoodProvider>
    </AuthProvider>
  );
}
