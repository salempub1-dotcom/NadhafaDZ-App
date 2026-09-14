import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { Redirect, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { CitySilhouette, MintBackground, PhotoFadeHero } from '@/ui/VisualShell';
import { colors, radius, shadow } from '@/ui/theme';

export default function Index() {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  if (session) return <Redirect href="/(app)/home" />;

  return (
    <MintBackground>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <PhotoFadeHero height={360}>
            <View style={styles.logoMark}><Ionicons name="leaf" size={26} color="#FFFFFF" /></View>
            <Text style={styles.brand}>NadhafaDZ</Text>
            <Text style={styles.tagline}>حي أنظف يبدأ بتنبيه بسيط</Text>
          </PhotoFadeHero>

          <View style={styles.panel}>
            <Text style={styles.title}>مرحبًا بك في NadhafaDZ</Text>
            <Text style={styles.subtitle}>تابع مرور شاحنة النظافة، شارك الرصد، واستقبل تنبيهات حي بن يوب وحي العميرات.</Text>

            <Pressable style={styles.primary} onPress={() => router.push('/(auth)/login')}>
              <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
              <Text style={styles.primaryText}>تسجيل الدخول</Text>
            </Pressable>
            <Pressable style={styles.secondary} onPress={() => router.push('/(auth)/register')}>
              <Ionicons name="person-add-outline" size={20} color={colors.primary} />
              <Text style={styles.secondaryText}>إنشاء حساب جديد</Text>
            </Pressable>

            <View style={styles.infoRow}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
              <Text style={styles.infoText}>موقعك لا يظهر للسكان؛ نستخدمه فقط لتحديد مكان الشاحنة عند الإبلاغ.</Text>
            </View>
          </View>
          <CitySilhouette />
        </ScrollView>
      </SafeAreaView>
    </MintBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingBottom: 18 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  logoMark: { width: 52, height: 52, borderRadius: 18, backgroundColor: 'rgba(0,139,76,0.92)', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end', marginBottom: 10 },
  brand: { fontSize: 33, fontWeight: '900', color: colors.primaryDark, textAlign: 'right' },
  tagline: { color: colors.primaryDark, textAlign: 'right', fontSize: 16, fontWeight: '700', marginTop: 4 },
  panel: { marginHorizontal: 18, marginTop: -18, backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: radius.xl, padding: 22, borderWidth: 1, borderColor: colors.border, ...shadow },
  title: { fontSize: 27, fontWeight: '900', color: colors.text, textAlign: 'right' },
  subtitle: { color: colors.secondary, textAlign: 'right', lineHeight: 24, marginTop: 8, marginBottom: 20 },
  primary: { minHeight: 56, borderRadius: radius.md, backgroundColor: colors.primary, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 18 },
  primaryText: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
  secondary: { minHeight: 54, borderRadius: radius.md, backgroundColor: colors.soft, borderWidth: 1, borderColor: '#CFE5D7', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 18, marginTop: 10 },
  secondaryText: { color: colors.primary, fontWeight: '900', fontSize: 16 },
  infoRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 8, marginTop: 18, backgroundColor: colors.background, borderRadius: radius.md, padding: 12 },
  infoText: { flex: 1, color: colors.secondary, textAlign: 'right', lineHeight: 20, fontSize: 13 },
});
