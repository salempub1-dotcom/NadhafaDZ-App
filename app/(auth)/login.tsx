import { useState } from 'react';
import { Alert, ImageBackground, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { supabase } from '@/lib/supabase';

const HERO_IMAGE = { uri: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Loading_Refuse_into_Dustbin_Truck.jpg?width=1600' };

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
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <ImageBackground source={HERO_IMAGE} style={styles.hero} imageStyle={styles.heroImage}>
          <View style={styles.heroOverlay}>
            <Text style={styles.brand}>NadhafaDZ</Text>
            <Text style={styles.heroTitle}>مرحبًا بك</Text>
            <Text style={styles.heroText}>تابع مرور شاحنة النظافة واستقبل تنبيهات حيّك.</Text>
          </View>
        </ImageBackground>

        <View style={styles.card}>
          <Text style={styles.title}>تسجيل الدخول</Text>
          <Text style={styles.subtitle}>ادخل إلى حسابك لمتابعة حيّك والبلاغات القريبة.</Text>

          <Text style={styles.label}>البريد الإلكتروني</Text>
          <View style={styles.inputWrap}><Ionicons name="mail-outline" size={20} color="#7C8A83" /><TextInput style={styles.input} placeholder="name@email.com" placeholderTextColor="#9AA6A0" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} /></View>

          <Text style={styles.label}>كلمة المرور</Text>
          <View style={styles.inputWrap}><Pressable onPress={() => setShowPassword(v => !v)}><Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={21} color="#7C8A83" /></Pressable><TextInput style={styles.input} placeholder="كلمة المرور" placeholderTextColor="#9AA6A0" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} /></View>

          <Pressable style={styles.button} onPress={login} disabled={loading}><Text style={styles.buttonText}>{loading ? 'جارٍ الدخول...' : 'تسجيل الدخول'}</Text></Pressable>
          <Text style={styles.footer}>ليس لديك حساب؟ <Link href="/(auth)/register" style={styles.link}>أنشئ حسابًا</Link></Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#F5FAF7'},
  content:{padding:18,paddingBottom:32,justifyContent:'center',minHeight:'100%'},
  hero:{height:250,borderRadius:28,overflow:'hidden',justifyContent:'flex-end'},
  heroImage:{borderRadius:28},
  heroOverlay:{backgroundColor:'rgba(8,48,34,0.60)',padding:22},
  brand:{fontSize:18,fontWeight:'900',color:'#A7F0C9',textAlign:'right'},
  heroTitle:{fontSize:28,fontWeight:'900',color:'#FFFFFF',textAlign:'right',marginTop:4},
  heroText:{color:'#ECFFF4',textAlign:'right',lineHeight:22,marginTop:7},
  card:{backgroundColor:'#FFFFFF',borderRadius:26,padding:22,marginTop:-18,borderWidth:1,borderColor:'#E1EAE5'},
  title:{fontSize:30,fontWeight:'900',color:'#17352A',textAlign:'right'},
  subtitle:{fontSize:15,color:'#6B7A73',textAlign:'right',lineHeight:23,marginTop:6,marginBottom:12},
  label:{fontSize:14,fontWeight:'800',color:'#365C4B',textAlign:'right',marginBottom:6,marginTop:10},
  inputWrap:{minHeight:54,borderWidth:1,borderColor:'#DCE7E1',borderRadius:15,paddingHorizontal:14,backgroundColor:'#FBFDFC',flexDirection:'row',alignItems:'center',gap:10},
  input:{flex:1,fontSize:16,textAlign:'right',paddingVertical:12,color:'#17352A'},
  button:{backgroundColor:'#168A55',borderRadius:15,padding:17,marginTop:20},
  buttonText:{color:'#fff',fontWeight:'900',fontSize:16,textAlign:'center'},
  footer:{textAlign:'center',color:'#6B7A73',marginTop:20},
  link:{color:'#168A55',fontWeight:'900'}
});
