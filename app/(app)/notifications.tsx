import { useState } from 'react';
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useNeighborhood } from '@/contexts/NeighborhoodContext';
import { disablePushToken, registerPushNotifications } from '@/lib/pushNotifications';

export default function NotificationsScreen(){
  const { user } = useAuth();
  const { neighborhood } = useNeighborhood();
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);

  async function enableNotifications(){
    if (!user) return;
    setLoading(true);
    try {
      await registerPushNotifications(user.id, neighborhood);
      setEnabled(true);
      Alert.alert('تم تفعيل التنبيهات', `سيصلك إشعار عند تأكيد مرور شاحنة النظافة في حي ${neighborhood}.`);
    } catch (e: any) {
      Alert.alert('تعذر تفعيل التنبيهات', e?.message ?? 'حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }

  async function disableNotifications(){
    if (!user) return;
    setLoading(true);
    try {
      await disablePushToken(user.id);
      setEnabled(false);
      Alert.alert('تم إيقاف التنبيهات', 'لن تصلك تنبيهات الشاحنة حتى تفعّلها من جديد.');
    } catch (e: any) {
      Alert.alert('تعذر إيقاف التنبيهات', e?.message ?? 'حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>التنبيهات</Text>
      <Text style={styles.sub}>الإشعارات الخاصة بحي {neighborhood}.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🚛 تنبيه مرور شاحنة النظافة</Text>
        <Text style={styles.body}>عند تأكيد مرور الشاحنة من مستخدم ثانٍ قريب، نرسل إشعارًا لسكان نفس الحي الذين فعّلوا التنبيهات.</Text>
        <Pressable style={[styles.button, enabled && styles.buttonSecondary]} onPress={enabled ? disableNotifications : enableNotifications} disabled={loading}>
          <Text style={[styles.buttonText, enabled && styles.buttonTextSecondary]}>
            {loading ? 'جارٍ الحفظ...' : enabled ? 'إيقاف التنبيهات' : 'تفعيل التنبيهات'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>الخصوصية</Text>
        <Text style={styles.body}>التنبيه مرتبط بالحي الذي اخترته فقط. لا نرسل موقعك الشخصي أو اسمك إلى السكان الآخرين.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles=StyleSheet.create({
  safe:{flex:1,backgroundColor:'#F5FAF7',padding:20},
  title:{fontSize:28,fontWeight:'900',textAlign:'right',color:'#17352A',marginTop:16},
  sub:{textAlign:'right',color:'#6B7A73',marginTop:6,marginBottom:16},
  card:{backgroundColor:'#fff',borderRadius:18,padding:18,borderWidth:1,borderColor:'#DCE7E1',marginBottom:12},
  cardTitle:{fontWeight:'900',fontSize:17,color:'#17352A',textAlign:'right'},
  body:{color:'#6B7A73',lineHeight:22,textAlign:'right',marginTop:7},
  button:{backgroundColor:'#168A55',borderRadius:14,padding:15,marginTop:16},
  buttonSecondary:{backgroundColor:'#EEF3F0',borderWidth:1,borderColor:'#C9D8D0'},
  buttonText:{color:'#fff',fontWeight:'900',fontSize:16,textAlign:'center'},
  buttonTextSecondary:{color:'#51645A'},
});
