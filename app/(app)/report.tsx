import { useState } from 'react';
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getNeighborhoodDisplayName, useNeighborhood } from '@/contexts/NeighborhoodContext';
import { MintBackground } from '@/ui/VisualShell';
import { colors, radius, shadow } from '@/ui/theme';

export default function ReportScreen() {
  const { user } = useAuth();
  const { neighborhood } = useNeighborhood();
  const [loading, setLoading] = useState(false);
  const neighborhoodLabel = getNeighborhoodDisplayName(neighborhood);

  async function sendReport() {
    if (!user) return;
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return Alert.alert('الموقع مطلوب', 'اسمح للتطبيق بالوصول إلى الموقع عند الإبلاغ عن الشاحنة.');
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { error } = await supabase.from('truck_reports').insert({
        reporter_id: user.id,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        neighborhood,
        status: 'pending',
      });
      if (error) throw error;
      Alert.alert('تم إرسال البلاغ', `سُجل البلاغ في ${neighborhoodLabel}. سيتم اعتباره مؤكدًا بعد تأكيد مستخدم آخر قريب.`);
    } catch (e: any) {
      Alert.alert('تعذر إرسال البلاغ', e?.message ?? 'حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <MintBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.kicker}>إبلاغ سريع</Text>
          <Text style={styles.heading}>رأيت شاحنة النظافة؟</Text>
          <Text style={styles.sub}>نستخدم موقعك في هذه اللحظة كموقع تقريبي للشاحنة فقط.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.iconWrap}><Ionicons name="trash-bin-outline" size={38} color={colors.primary} /></View>
          <Text style={styles.title}>هل الشاحنة أمامك الآن؟</Text>
          <View style={styles.neighborhoodPill}><Ionicons name="location-outline" size={16} color={colors.primary} /><Text style={styles.neighborhood}>{neighborhoodLabel}</Text></View>
          <Text style={styles.body}>عند الضغط، نسجل إحداثيات الموقع في تلك اللحظة كموقع تقريبي للشاحنة. لا نعرض هويتك أو موقعك الشخصي للسكان.</Text>
          <Pressable style={[styles.button, loading && styles.disabled]} onPress={sendReport} disabled={loading}>
            <Ionicons name="navigate-outline" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>{loading ? 'جارٍ تحديد الموقع...' : 'نعم، أرسل البلاغ'}</Text>
          </Pressable>
        </View>

        <View style={styles.note}>
          <View style={styles.noteHead}><Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} /><Text style={styles.noteTitle}>حماية من البلاغات الخاطئة</Text></View>
          <Text style={styles.noteText}>البلاغ الأول يبقى «رصدًا أوليًا». بعد تأكيده من مستخدم آخر قريب يتحول إلى مرور مؤكد ويمكن تنبيه سكان المنطقة.</Text>
        </View>
      </SafeAreaView>
    </MintBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, padding: 20, justifyContent: 'center' },
  header: { marginBottom: 18 },
  kicker: { color: colors.primary, fontWeight: '900', textAlign: 'right' },
  heading: { fontSize: 28, fontWeight: '900', color: colors.text, textAlign: 'right', marginTop: 4 },
  sub: { color: colors.secondary, textAlign: 'right', lineHeight: 22, marginTop: 7 },
  card: { backgroundColor: colors.card, borderRadius: radius.xl, padding: 24, borderWidth: 1, borderColor: colors.border, ...shadow },
  iconWrap: { width: 70, height: 70, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.soft, alignSelf: 'center' },
  title: { fontSize: 24, fontWeight: '900', color: colors.text, textAlign: 'center', marginTop: 14 },
  neighborhoodPill: { alignSelf: 'center', flexDirection: 'row-reverse', alignItems: 'center', gap: 5, backgroundColor: colors.soft, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7, marginTop: 10 },
  neighborhood: { color: colors.primary, fontWeight: '900' },
  body: { textAlign: 'right', color: colors.secondary, lineHeight: 23, marginTop: 16 },
  button: { minHeight: 56, backgroundColor: colors.primary, borderRadius: radius.md, marginTop: 22, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8 },
  disabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '900', fontSize: 17, textAlign: 'center' },
  note: { backgroundColor: colors.decorative, borderRadius: radius.lg, padding: 17, marginTop: 16 },
  noteHead: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7 },
  noteTitle: { textAlign: 'right', fontWeight: '900', color: colors.primary },
  noteText: { textAlign: 'right', color: colors.primaryDark, lineHeight: 21, marginTop: 6 },
});
