import { useState } from 'react';
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function ReportScreen() {
  const { user } = useAuth();
  const [loading,setLoading]=useState(false);

  async function sendReport(){
    if(!user) return;
    setLoading(true);
    try{
      const { status } = await Location.requestForegroundPermissionsAsync();
      if(status !== 'granted') return Alert.alert('الموقع مطلوب','اسمح للتطبيق بالوصول إلى الموقع عند الإبلاغ عن الشاحنة.');
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { error } = await supabase.from('truck_reports').insert({
        reporter_id:user.id,
        latitude:pos.coords.latitude,
        longitude:pos.coords.longitude,
        neighborhood:'بن يوب',
        status:'pending'
      });
      if(error) throw error;
      Alert.alert('تم إرسال البلاغ','شكرًا. سيتم اعتبار البلاغ مؤكدًا بعد تأكيد مستخدم آخر قريب.');
    }catch(e:any){
      Alert.alert('تعذر إرسال البلاغ',e?.message ?? 'حاول مرة أخرى.');
    }finally{setLoading(false)}
  }

  return <SafeAreaView style={styles.safe}>
    <View style={styles.card}>
      <Text style={styles.emoji}>🚛</Text>
      <Text style={styles.title}>هل الشاحنة أمامك الآن؟</Text>
      <Text style={styles.body}>عند الضغط، نسجل إحداثيات موقعك في تلك اللحظة كموقع تقريبي للشاحنة. لا نعرض موقعك الشخصي أو هويتك للسكان.</Text>
      <Pressable style={styles.button} onPress={sendReport} disabled={loading}><Text style={styles.buttonText}>{loading?'جارٍ تحديد الموقع...':'نعم، أرسل البلاغ'}</Text></Pressable>
      <View style={styles.note}><Text style={styles.noteTitle}>حماية من البلاغات الخاطئة</Text><Text style={styles.noteText}>البلاغ الأول يبقى «رصدًا أوليًا». عند تأكيده من مستخدم آخر قريب يتحول إلى مرور مؤكد ويمكن إرسال إشعار لسكان الحي.</Text></View>
    </View>
  </SafeAreaView>
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:'#F5FAF7',padding:20,justifyContent:'center'},card:{backgroundColor:'#fff',borderRadius:24,padding:24,borderWidth:1,borderColor:'#DCE7E1'},emoji:{fontSize:52,textAlign:'center'},title:{fontSize:25,fontWeight:'900',color:'#17352A',textAlign:'center',marginTop:10},body:{textAlign:'right',color:'#6B7A73',lineHeight:23,marginTop:12},button:{backgroundColor:'#168A55',borderRadius:16,padding:17,marginTop:24},buttonText:{color:'#fff',fontWeight:'900',fontSize:17,textAlign:'center'},note:{backgroundColor:'#EAF7F0',borderRadius:16,padding:16,marginTop:18},noteTitle:{textAlign:'right',fontWeight:'900',color:'#168A55'},noteText:{textAlign:'right',color:'#17352A',lineHeight:21,marginTop:6}});
