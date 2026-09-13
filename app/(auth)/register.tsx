import { useState } from 'react';
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, TextInput } from 'react-native';
import { Link, router } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
    <SafeAreaView style={styles.safe}>
      <Text style={styles.brand}>NadhafaDZ</Text>
      <Text style={styles.title}>إنشاء حساب</Text>
      <Text style={styles.subtitle}>ابدأ بحي بن يوب أو حي العميرات، ويمكن تغيير الحي لاحقًا.</Text>
      <TextInput style={styles.input} placeholder="الاسم الكامل" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="البريد الإلكتروني" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="كلمة المرور" secureTextEntry value={password} onChangeText={setPassword} />
      <Pressable style={styles.button} onPress={register} disabled={loading}><Text style={styles.buttonText}>{loading ? 'جارٍ الإنشاء...' : 'إنشاء الحساب'}</Text></Pressable>
      <Text style={styles.footer}>لديك حساب؟ <Link href="/(auth)/login" style={styles.link}>تسجيل الدخول</Link></Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({safe:{flex:1,backgroundColor:'#F5FAF7',justifyContent:'center',padding:24,gap:14},brand:{fontSize:18,fontWeight:'800',color:'#168A55',textAlign:'right'},title:{fontSize:30,fontWeight:'800',color:'#17352A',textAlign:'right'},subtitle:{fontSize:15,color:'#6B7A73',textAlign:'right',lineHeight:23,marginBottom:8},input:{borderWidth:1,borderColor:'#DCE7E1',borderRadius:14,paddingHorizontal:16,paddingVertical:14,fontSize:16,textAlign:'right',backgroundColor:'#fff'},button:{backgroundColor:'#168A55',borderRadius:14,padding:16,marginTop:4},buttonText:{color:'#fff',fontWeight:'800',fontSize:16,textAlign:'center'},footer:{textAlign:'center',color:'#6B7A73'},link:{color:'#168A55',fontWeight:'800'}});
