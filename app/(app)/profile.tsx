import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen(){
  const {user,signOut}=useAuth();
  async function logout(){await signOut();router.replace('/(auth)/login')}
  return <SafeAreaView style={styles.safe}>
    <Text style={styles.title}>حسابي</Text>
    <View style={styles.card}>
      <Text style={styles.label}>البريد الإلكتروني</Text><Text style={styles.value}>{user?.email ?? '—'}</Text>
      <Text style={styles.label}>الاسم</Text><Text style={styles.value}>{String(user?.user_metadata?.full_name ?? 'غير محدد')}</Text>
      <Text style={styles.label}>الحي التجريبي</Text><Text style={styles.value}>حي بن يوب</Text>
    </View>
    <Pressable style={styles.logout} onPress={logout}><Text style={styles.logoutText}>تسجيل الخروج</Text></Pressable>
  </SafeAreaView>
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:'#F5FAF7',padding:20},title:{fontSize:28,fontWeight:'900',color:'#17352A',textAlign:'right',marginTop:16,marginBottom:18},card:{backgroundColor:'#fff',borderRadius:20,padding:20,borderWidth:1,borderColor:'#DCE7E1'},label:{textAlign:'right',color:'#6B7A73',fontSize:13,marginTop:12},value:{textAlign:'right',color:'#17352A',fontSize:17,fontWeight:'800',marginTop:4},logout:{borderWidth:1,borderColor:'#D95C5C',borderRadius:14,padding:15,marginTop:18},logoutText:{color:'#D95C5C',fontWeight:'900',textAlign:'center'}});
