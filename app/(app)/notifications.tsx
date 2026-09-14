import { useState } from 'react';
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useAuth } from '@/contexts/AuthContext';
import { useNeighborhood } from '@/contexts/NeighborhoodContext';
import { disablePushToken, registerPushNotifications } from '@/lib/pushNotifications';
import { MintBackground } from '@/ui/VisualShell';
import { colors, radius, shadow } from '@/ui/theme';

export default function NotificationsScreen() {
  const { user } = useAuth();
  const { neighborhood } = useNeighborhood();
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);

  async function enableNotifications() {
    if (!user) return;
    setLoading(true);
    try {
      await registerPushNotifications(user.id, neighborhood);
      setEnabled(true);
      Alert.alert('تم تفعيل التنبيهات', `سيصلك إشعار عند تأكيد مرور شاحنة النظافة في حي ${neighborhood}.`);
    } catch (e: any) {
      Alert.alert('تعذر تفعيل التنبيهات', e?.message ?? 'حاول مرة أخرى.');
    } finally { setLoading(false); }
  }

  async function disableNotifications() {
    if (!user) return;
    setLoading(true);
    try {
      await disablePushToken(user.id);
      setEnabled(false);
      Alert.alert('تم إيقاف التنبيهات', 'لن تصلك تنبيهات الشاحنة حتى تفعّلها من جديد.');
    } catch (e: any) {
      Alert.alert('تعذر إيقاف التنبيهات', e?.message ?? 'حاول مرة أخرى.');
    } finally { setLoading(false); }
  }

  return (
    <MintBackground>
      <SafeAreaView style={styles.safe}>
        <Text style={styles.kicker}>إعدادات الحي</Text>
        <Text style={styles.title}>التنبيهات</Text>
        <Text style={styles.sub}>الإشعارات الخاصة بحي {neighborhood}.</Text>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <View style={styles.iconWrap}><Ionicons name="notifications-outline" size={24} color={colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>تنبيه مرور شاحنة النظافة</Text>
              <Text style={styles.status}>{enabled ? 'مفعّلة' : 'غير مفعّلة'}</Text>
            </View>
          </View>
          <Text style={styles.body}>عند تأكيد مرور الشاحنة من مستخدم ثانٍ قريب، نرسل إشعارًا لسكان نفس الحي الذين فعّلوا التنبيهات.</Text>
          <Pressable style={[styles.button, enabled && styles.buttonSecondary, loading && styles.disabled]} onPress={enabled ? disableNotifications : enableNotifications} disabled={loading}>
            <Ionicons name={enabled ? 'notifications-off-outline' : 'notifications-outline'} size={19} color={enabled ? colors.primaryDark : '#FFFFFF'} />
            <Text style={[styles.buttonText, enabled && styles.buttonTextSecondary]}>{loading ? 'جارٍ الحفظ...' : enabled ? 'إيقاف التنبيهات' : 'تفعيل التنبيهات'}</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <View style={styles.iconWrap}><Ionicons name="shield-checkmark-outline" size={24} color={colors.primary} /></View>
            <Text style={styles.cardTitle}>الخصوصية</Text>
          </View>
          <Text style={styles.body}>التنبيه مرتبط بالحي الذي اخترته فقط. لا نرسل موقعك الشخصي أو اسمك إلى السكان الآخرين.</Text>
        </View>
      </SafeAreaView>
    </MintBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, padding: 20 },
  kicker: { color: colors.primary, fontWeight: '900', textAlign: 'right', marginTop: 14 },
  title: { fontSize: 30, fontWeight: '900', textAlign: 'right', color: colors.text, marginTop: 3 },
  sub: { textAlign: 'right', color: colors.secondary, marginTop: 6, marginBottom: 18 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 18, borderWidth: 1, borderColor: colors.border, marginBottom: 14, ...shadow },
  cardHead: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  iconWrap: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.soft },
  cardTitle: { flex: 1, fontWeight: '900', fontSize: 17, color: colors.text, textAlign: 'right' },
  status: { color: colors.primary, fontSize: 12, fontWeight: '900', textAlign: 'right', marginTop: 2 },
  body: { color: colors.secondary, lineHeight: 22, textAlign: 'right', marginTop: 12 },
  button: { minHeight: 52, backgroundColor: colors.primary, borderRadius: radius.md, marginTop: 16, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 7 },
  buttonSecondary: { backgroundColor: colors.soft, borderWidth: 1, borderColor: colors.border },
  disabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '900', fontSize: 15, textAlign: 'center' },
  buttonTextSecondary: { color: colors.primaryDark },
});
