import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useNeighborhood } from '@/contexts/NeighborhoodContext';
import { MintBackground } from '@/ui/VisualShell';
import { colors, radius, shadow } from '@/ui/theme';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { neighborhood } = useNeighborhood();

  async function logout() {
    await signOut();
    router.replace('/');
  }

  const name = String(user?.user_metadata?.full_name ?? 'مستخدم NadhafaDZ');

  return (
    <MintBackground>
      <SafeAreaView style={styles.safe}>
        <Text style={styles.kicker}>إعداداتك</Text>
        <Text style={styles.title}>حسابي</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatar}><Ionicons name="person-outline" size={30} color={colors.primary} /></View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.email}>{user?.email ?? '—'}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowIcon}><Ionicons name="mail-outline" size={20} color={colors.primary} /></View>
            <View style={styles.rowText}><Text style={styles.label}>البريد الإلكتروني</Text><Text style={styles.value}>{user?.email ?? '—'}</Text></View>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <View style={styles.rowIcon}><Ionicons name="location-outline" size={20} color={colors.primary} /></View>
            <View style={styles.rowText}><Text style={styles.label}>الحي المحدد</Text><Text style={styles.value}>حي {neighborhood}</Text></View>
          </View>
        </View>

        <Pressable style={styles.logout} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={styles.logoutText}>تسجيل الخروج</Text>
        </Pressable>
      </SafeAreaView>
    </MintBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, padding: 20 },
  kicker: { color: colors.primary, fontWeight: '900', textAlign: 'right', marginTop: 14 },
  title: { fontSize: 30, fontWeight: '900', color: colors.text, textAlign: 'right', marginTop: 3, marginBottom: 18 },
  profileCard: { backgroundColor: colors.card, borderRadius: radius.xl, padding: 22, alignItems: 'center', borderWidth: 1, borderColor: colors.border, ...shadow },
  avatar: { width: 72, height: 72, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.soft, marginBottom: 12 },
  name: { fontSize: 20, fontWeight: '900', color: colors.text, textAlign: 'center' },
  email: { color: colors.secondary, marginTop: 5, textAlign: 'center' },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 18, borderWidth: 1, borderColor: colors.border, marginTop: 16, ...shadow },
  row: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  rowIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.soft },
  rowText: { flex: 1 },
  label: { textAlign: 'right', color: colors.secondary, fontSize: 13 },
  value: { textAlign: 'right', color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 3 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
  logout: { minHeight: 52, borderWidth: 1, borderColor: '#E7BDBD', borderRadius: radius.md, marginTop: 18, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFF9F9' },
  logoutText: { color: colors.danger, fontWeight: '900', textAlign: 'center' },
});
