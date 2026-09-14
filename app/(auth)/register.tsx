import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { Link, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { MintBackground, PhotoFadeHero } from '@/ui/VisualShell';
import { colors, radius, shadow } from '@/ui/theme';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function register() {
    if (!name || !email || password.length < 6) return Alert.alert('تحقق من البيانات', 'أدخل الاسم والبريد وكلمة مرور من 6 أحرف على الأقل.');
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: name.trim() } },
    });
    setLoading(false);
    if (error) return Alert.alert('تعذر إنشاء الحساب', error.message);
    if (!data.session) return Alert.alert('تحقق من بريدك', 'تم إنشاء الحساب. افتح رسالة التأكيد ثم سجّل الدخول.');
    router.replace('/(app)/home');
  }

  return (
    <MintBackground>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.safe}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="none"
            showsVerticalScrollIndicator={false}
          >
            <PhotoFadeHero height={225}>
              <Text style={styles.brand}>NadhafaDZ</Text>
              <Text style={styles.heroTitle}>معًا من أجل حي أنظف</Text>
            </PhotoFadeHero>

            <View style={styles.card}>
              <Text style={styles.title}>إنشاء حساب</Text>
              <Text style={styles.subtitle}>ابدأ بحي بن يوب أو حي العميرات، ويمكن تغيير الحي لاحقًا.</Text>

              <Text style={styles.label}>الاسم الكامل</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="person-outline" size={20} color="#7D8A84" />
                <TextInput
                  style={styles.input}
                  placeholder="مثال: محمد بن علي"
                  placeholderTextColor="#9AA6A0"
                  value={name}
                  onChangeText={setName}
                  returnKeyType="next"
                />
              </View>

              <Text style={styles.label}>البريد الإلكتروني</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={20} color="#7D8A84" />
                <TextInput
                  style={styles.input}
                  placeholder="name@email.com"
                  placeholderTextColor="#9AA6A0"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  returnKeyType="next"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <Text style={styles.label}>كلمة المرور</Text>
              <View style={styles.inputWrap}>
                <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={21} color="#7D8A84" />
                </Pressable>
                <TextInput
                  style={styles.input}
                  placeholder="6 أحرف على الأقل"
                  placeholderTextColor="#9AA6A0"
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  value={password}
                  onChangeText={setPassword}
                  onSubmitEditing={register}
                />
              </View>

              <Pressable style={[styles.button, loading && styles.disabled]} onPress={register} disabled={loading}>
                <Ionicons name="person-add-outline" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>{loading ? 'جارٍ الإنشاء...' : 'إنشاء الحساب'}</Text>
              </Pressable>
              <Text style={styles.footer}>لديك حساب؟ <Link href="/(auth)/login" style={styles.link}>تسجيل الدخول</Link></Text>
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
  brand: { fontSize: 17, fontWeight: '900', color: colors.primary, textAlign: 'right' },
  heroTitle: { fontSize: 26, fontWeight: '900', color: colors.primaryDark, textAlign: 'right', marginTop: 3 },
  card: { marginHorizontal: 18, marginTop: -16, backgroundColor: 'rgba(255,255,255,0.98)', borderRadius: radius.xl, padding: 22, borderWidth: 1, borderColor: colors.border, ...shadow },
  title: { fontSize: 29, fontWeight: '900', color: colors.text, textAlign: 'right' },
  subtitle: { fontSize: 15, color: colors.secondary, textAlign: 'right', lineHeight: 23, marginTop: 6, marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '800', color: colors.primaryDark, textAlign: 'right', marginBottom: 7, marginTop: 12 },
  inputWrap: { minHeight: 56, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, backgroundColor: '#FCFEFD', flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, fontSize: 16, textAlign: 'right', paddingVertical: 12, color: colors.text },
  button: { minHeight: 56, backgroundColor: colors.primary, borderRadius: radius.md, marginTop: 22, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8 },
  disabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '900', fontSize: 16, textAlign: 'center' },
  footer: { textAlign: 'center', color: colors.secondary, marginTop: 20 },
  link: { color: colors.primary, fontWeight: '900' },
});
