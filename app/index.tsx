import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { Redirect, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { BrandLogo } from '@/ui/BrandLogo';
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
          <PhotoFadeHero height={430}>
            <View style={styles.heroBrandRow}>
              <BrandLogo size={86} />
              <Text style={styles.brand}>NadhafaDZ</Text>
            </View>
            <Text style={styles.tagline}>معًا من أجل حي أنظف</Text>
            <Text style={styles.heroText}>بلّغ • تابع • شارك في نظافة حيّك</Text>
          </PhotoFadeHero>

          <View style={styles.panel}>
            <Text style={styles.title}>نظافة حيّنا مسؤوليتنا جميعًا</Text>
            <Text style={styles.subtitle}>تابع مرور شاحنة النظافة، شارك الرصد، واستقبل تنبيهات الحوش وحي بن يوب.</Text>

            <Pressable style={styles.primary} onPress={() => router.push('/(auth)/register')}>
              <Ionicons name="person-add-outline" size={20} color="#FFFFFF" />
              <Text style={styles.primaryText}>إنشاء حساب جديد</Text>
            </Pressable>
            <Pressable style={styles.secondary} onPress={() => router.push('/(auth)/login')}>
              <Ionicons name="log-in-outline" size={20} color={colors.primary} />
              <Text style={styles.secondaryText}>تسجيل الدخول</Text>
            </Pressable>

            <View style={styles.infoRow}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
              <Text style={styles.infoText}>موقعك لا يظهر للسكان؛ نستخدمه فقط عند الإبلاغ لتحديد مكان الشاحنة.</Text>
            </View>
          </View>
          <CitySilhouette />
          <Text style={styles.footer}>حي نظيف • حياة أفضل</Text>
        </ScrollView>
      </SafeAreaView>
    </MintBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingBottom: 18 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  heroBrandRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, alignSelf: 'flex-end' },
  brand: { fontSize: 32, fontWeight: '900', color: colors.primaryDark, textAlign: 'right' },
  tagline: { color: colors.primaryDark, textAlign: 'right', fontSize: 22, fontWeight: '900', marginTop: 12 },
  heroText: { color: colors.secondary, textAlign: 'right', fontSize: 15, fontWeight: '700', marginTop: 6 },
  panel: { marginHorizontal: 18, marginTop: -12, backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: radius.xl, padding: 22, borderWidth: 1, borderColor: colors.border, ...shadow },
  title: { fontSize: 25, fontWeight: '900', color: colors.text, textAlign: 'right' },
  subtitle: { color: colors.secondary, textAlign: 'right', lineHeight: 24, marginTop: 8, marginBottom: 20 },
  primary: { minHeight: 56, borderRadius: radius.md, backgroundColor: colors.primary, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 18 },
  primaryText: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
  secondary: { minHeight: 54, borderRadius: radius.md, backgroundColor: '#FFFFFF', borderWidth: 1.3, borderColor: colors.primary, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 18, marginTop: 10 },
  secondaryText: { color: colors.primary, fontWeight: '900', fontSize: 16 },
  infoRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 8, marginTop: 18, backgroundColor: colors.background, borderRadius: radius.md, padding: 12 },
  infoText: { flex: 1, color: colors.secondary, textAlign: 'right', lineHeight: 20, fontSize: 13 },
  footer: { textAlign: 'center', color: colors.primaryDark, fontWeight: '800', marginTop: 8, opacity: 0.8 },
});
