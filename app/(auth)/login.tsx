import { useState } from 'react';
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, router } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function login() {
    if (!email || !password) return Alert.alert('بيانات ناقصة', 'أدخل البريد الإلكتروني وكلمة المرور.');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) return Alert.alert('تعذر تسجيل الدخول', error.message);
    router.replace('/(app)/home');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.card}>
        <Text style={styles.brand}>NadhafaDZ</Text>
        <Text style={styles.title}>مرحبا بك</Text>
        <Text style={styles.subtitle}>سجّل الدخول لتلقي تنبيهات شاحنة النظافة في حيّك.</Text>
        <TextInput style={styles.input} placeholder="البريد الإلكتروني" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <TextInput style={styles.input} placeholder="كلمة المرور" secureTextEntry value={password} onChangeText={setPassword} />
        <Pressable style={styles.button} onPress={login} disabled={loading}><Text style={styles.buttonText}>{loading ? 'جارٍ الدخول...' : 'تسجيل الدخول'}</Text></Pressable>
        <Text style={styles.footer}>ليس لديك حساب؟ <Link href="/(auth)/register" style={styles.link}>أنشئ حسابًا</Link></Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#F5FAF7',justifyContent:'center',padding:24},card:{backgroundColor:'#fff',padding:24,borderRadius:24,gap:14},brand:{fontSize:18,fontWeight:'800',color:'#168A55',textAlign:'right'},title:{fontSize:30,fontWeight:'800',color:'#17352A',textAlign:'right'},subtitle:{fontSize:15,color:'#6B7A73',textAlign:'right',lineHeight:23},input:{borderWidth:1,borderColor:'#DCE7E1',borderRadius:14,paddingHorizontal:16,paddingVertical:14,fontSize:16,textAlign:'right',backgroundColor:'#FBFDFC'},button:{backgroundColor:'#168A55',borderRadius:14,padding:16,marginTop:4},buttonText:{color:'#fff',fontWeight:'800',fontSize:16,textAlign:'center'},footer:{textAlign:'center',color:'#6B7A73',marginTop:6},link:{color:'#168A55',fontWeight:'800'}
});
