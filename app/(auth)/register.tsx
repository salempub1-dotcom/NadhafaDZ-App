import { useState } from 'react';
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
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
      email: email.trim(), password,
      options: { data: { full_name: name.trim() } },
    });
    setLoading(false);
    if (error) return Alert.alert('تعذر إنشاء الحساب', error.message);
    if (!data.session) return Alert.alert('تحقق من بريدك', 'تم إنشاء الحساب. افتح رسالة التأكيد ثم سجّل الدخول.');
    router.replace('/(app)/home');
  }

  return <SafeAreaView style={styles.safe}>
    <View style={styles.hero}><Text style={styles.heroIcon}>🚛</Text><View><Text style={styles.brand}>NadhafaDZ</Text><Text style={styles.heroText}>حيّ أنظف يبدأ بمشاركة بسيطة</Text></View></View>
    <Text style={styles.title}>إنشاء حساب</Text>
    <Text style={styles.subtitle}>ابدأ بحي بن يوب أو حي العميرات، ويمكن تغيير الحي لاحقًا.</Text>

    <Text style={styles.label}>الاسم الكامل</Text>
    <TextInput style={styles.input} placeholder="مثال: محمد بن علي" placeholderTextColor="#9AA6A0" value={name} onChangeText={setName} />
    <Text style={styles.label}>البريد الإلكتروني</Text>
    <TextInput style={styles.input} placeholder="name@email.com" placeholderTextColor="#9AA6A0" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
    <Text style={styles.label}>كلمة المرور</Text>
    <TextInput style={styles.input} placeholder="6 أحرف على الأقل" placeholderTextColor="#9AA6A0" secureTextEntry value={password} onChangeText={setPassword} />

    <Pressable style={styles.button} onPress={register} disabled={loading}><Text style={styles.buttonText}>{loading ? 'جارٍ الإنشاء...' : 'إنشاء الحساب'}</Text></Pressable>
    <Text style={styles.footer}>لديك حساب؟ <Link href="/(auth)/login" style={styles.link}>تسجيل الدخول</Link></Text>
  </SafeAreaView>;
}

const styles=StyleSheet.create({safe:{flex:1,backgroundColor:'#F5FAF7',justifyContent:'center',padding:24},hero:{backgroundColor:'#EAF7F0',borderRadius:20,padding:16,flexDirection:'row-reverse',alignItems:'center',gap:12,marginBottom:18},heroIcon:{fontSize:38},brand:{fontSize:18,fontWeight:'900',color:'#168A55',textAlign:'right'},heroText:{color:'#365C4B',fontWeight:'700',textAlign:'right',marginTop:3},title:{fontSize:30,fontWeight:'900',color:'#17352A',textAlign:'right'},subtitle:{fontSize:15,color:'#6B7A73',textAlign:'right',lineHeight:23,marginTop:6,marginBottom:16},label:{fontSize:14,fontWeight:'800',color:'#365C4B',textAlign:'right',marginBottom:6,marginTop:8},input:{borderWidth:1,borderColor:'#DCE7E1',borderRadius:14,paddingHorizontal:16,paddingVertical:14,fontSize:16,textAlign:'right',backgroundColor:'#fff'},button:{backgroundColor:'#168A55',borderRadius:14,padding:16,marginTop:18},buttonText:{color:'#fff',fontWeight:'900',fontSize:16,textAlign:'center'},footer:{textAlign:'center',color:'#6B7A73',marginTop:20},link:{color:'#168A55',fontWeight:'900'}});
