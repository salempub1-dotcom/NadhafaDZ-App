import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { Link, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { BrandLogo } from '@/ui/BrandLogo';
import { MintBackground, PhotoFadeHero } from '@/ui/VisualShell';
import { colors, radius, shadow } from '@/ui/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function login() {
    if (!email || !password) return Alert.alert('بيانات ناقصة', 'أدخل البريد الإلكتروني وكلمة المرور.');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) return Alert.alert('تعذر تسجيل الدخول', error.message);
    router.replace('/(app)/home');
  }

  return (
    <MintBackground>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="always" keyboardDismissMode="none" showsVerticalScrollIndicator={false}>
            <PhotoFadeHero height={220}>
              <View style={styles.brandRow}>
                <BrandLogo size={58} />
                <Text style={styles.brand}>NadhafaDZ</Text>
              </View>
              <Text style={styles.heroTitle}>مرحبًا بعودتك</Text>
              <Text style={styles.heroText}>تابع الخريطة والتنبيهات في الحوش وحي بن يوب</Text>
            </PhotoFadeHero>

            <View style={styles.card}>
              <Text style={styles.title}>تسجيل الدخول</Text>
              <Text style={styles.subtitle}>أدخل بيانات حسابك للعودة إلى لوحة المتابعة.</Text>

              <Text style={styles.label}>البريد الإلكتروني</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={20} color="#7D8A84" />
                <TextInput style={styles.input} placeholder="name@email.com" placeholderTextColor="#9AA6A0" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" returnKeyType="next" value={email} onChangeText={setEmail} />
              </View>

              <Text style={styles.label}>كلمة المرور</Text>
              <View style={styles.inputWrap}>
                <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={21} color="#7D8A84" />
                </Pressable>
                <TextInput style={styles.input} placeholder="كلمة المرور" placeholderTextColor="#9AA6A0" secureTextEntry={!showPassword} returnKeyType="done" value={password} onChangeText={setPassword} onSubmitEditing={login} />
              </View>

              <Pressable style={[styles.button, loading && styles.disabled]} onPress={login} disabled={loading}>
                <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>{loading ? 'جارٍ الدخول...' : 'تسجيل الدخول'}</Text>
              </Pressable>
              <Text style={styles.footer}>ليس لديك حساب؟ <Link href="/(auth)/register" style={styles.link}>إنشاء حساب جديد</Link></Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </MintBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingBottom: 30 },
  brandRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, alignSelf: 'flex-end' },
  brand: { fontSize: 18, fontWeight: '900', color: colors.primary, textAlign: 'right' },
  heroTitle: { fontSize: 28, fontWeight: '900', color: colors.primaryDark, textAlign: 'right', marginTop: 4 },
  heroText: { color: colors.secondary, textAlign: 'right', marginTop: 5, fontWeight: '700' },
  card: { marginHorizontal: 18, marginTop: -14, backgroundColor: 'rgba(255,255,255,0.98)', borderRadius: radius.xl, padding: 22, borderWidth: 1, borderColor: colors.border, ...shadow },
  title: { fontSize: 27, fontWeight: '900', color: colors.text, textAlign: 'right' },
  subtitle: { fontSize: 14, color: colors.secondary, textAlign: 'right', lineHeight: 22, marginTop: 6, marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '800', color: colors.primaryDark, textAlign: 'right', marginBottom: 7, marginTop: 12 },
  inputWrap: { minHeight: 56, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, backgroundColor: '#FCFEFD', flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, fontSize: 16, textAlign: 'right', paddingVertical: 12, color: colors.text },
  button: { minHeight: 56, backgroundColor: colors.primary, borderRadius: radius.md, marginTop: 22, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8 },
  disabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '900', fontSize: 16, textAlign: 'center' },
  footer: { textAlign: 'center', color: colors.secondary, marginTop: 20 },
  link: { color: colors.primary, fontWeight: '900' },
});
