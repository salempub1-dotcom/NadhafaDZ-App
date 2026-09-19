import { useState } from 'react';
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getNeighborhoodDisplayName, useNeighborhood } from '@/contexts/NeighborhoodContext';
import { proximityLabel } from '@/lib/landmarks';
import { MintBackground } from '@/ui/VisualShell';
import { colors, radius, shadow } from '@/ui/theme';

type SubmitResult = {
  report_id: string;
  report_status: 'pending' | 'confirmed';
  report_session_id: string | null;
  report_sighting_kind: 'candidate' | 'session_point';
  auto_confirmed: boolean;
};

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
      if (status !== 'granted') {
        Alert.alert('الموقع مطلوب', 'اسمح للتطبيق بالوصول إلى الموقع عند الإبلاغ عن الشاحنة.');
        return;
      }

      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = pos.coords;

      const { data, error } = await supabase.rpc('submit_truck_sighting', {
        target_neighborhood: neighborhood,
        target_lat: latitude,
        target_lon: longitude,
      });
      if (error) throw error;

      const result = ((data ?? [])[0] as SubmitResult | undefined);
      if (!result) throw new Error('لم يتم تسجيل الرصد.');

      const nearby = proximityLabel(latitude, longitude);

      if (result.auto_confirmed) {
        const { error: notifyError } = await supabase.functions.invoke('notify-neighborhood', {
          body: { report_id: result.report_id },
        });
        if (notifyError) console.warn('Push notification dispatch failed:', notifyError.message);

        Alert.alert(
          'تم تحديث الموقع الحي',
          nearby
            ? `الشاحنة في جلسة رصد مؤكدة. أضيف موقع جديد ${nearby} إلى الخريطة الحية.`
            : `الشاحنة في جلسة رصد مؤكدة. أضيف موقع جديد داخل ${neighborhoodLabel} إلى الخريطة الحية.`,
        );
      } else {
        Alert.alert(
          'تم إرسال الرصد الأولي',
          nearby
            ? `سُجل موقع الشاحنة ${nearby}. يحتاج إلى تأكيد مستخدم آخر قريب لبدء جلسة الرصد الحية.`
            : `سُجل البلاغ في ${neighborhoodLabel}. يحتاج إلى تأكيد مستخدم آخر قريب لبدء جلسة الرصد الحية.`,
        );
      }
    } catch (e: any) {
      const message = String(e?.message ?? '');
      if (message.includes('OUTSIDE_SERVICE_AREA')) {
        Alert.alert(
          'الرصد خارج نطاق الخدمة',
          'هذا الموقع بعيد عن حي بن يوب والحوش وعن محيط نقاط المسار المعتمدة، لذلك لن يتم احتسابه كرصد للشاحنة.',
        );
      } else {
        Alert.alert('تعذر إرسال البلاغ', message || 'حاول مرة أخرى.');
      }
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
          <Text style={styles.sub}>موقعك في هذه اللحظة يُستخدم كموقع تقريبي للشاحنة فقط.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.truckVisual}>
            <View style={styles.truckGlow} />
            <Text style={styles.truckEmoji}>🚛</Text>
          </View>
          <Text style={styles.title}>هل الشاحنة أمامك الآن؟</Text>
          <View style={styles.neighborhoodPill}>
            <Ionicons name="location-outline" size={16} color={colors.primary} />
            <Text style={styles.neighborhood}>{neighborhoodLabel}</Text>
          </View>
          <Text style={styles.body}>
            إذا لم توجد جلسة رصد حية، يكون بلاغك أوليًا ويحتاج تأكيد شخص ثانٍ قريب. إذا كانت الشاحنة مؤكدة بالفعل، يضاف بلاغك مباشرة كنقطة جديدة لمسارها الحي بشرط أن يكون قريبًا منطقيًا من آخر رصد وداخل نطاق الخدمة المعتمد.
          </Text>
          <Pressable style={[styles.button, loading && styles.disabled]} onPress={sendReport} disabled={loading}>
            <Ionicons name="navigate-outline" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>{loading ? 'جارٍ تحديد الموقع...' : 'نعم، الشاحنة هنا'}</Text>
          </Pressable>
        </View>

        <View style={styles.note}>
          <View style={styles.noteHead}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
            <Text style={styles.noteTitle}>رصد حي مع حماية من الأخطاء</Text>
          </View>
          <Text style={styles.noteText}>لا يُعتمد أي رصد بعيد عن الحي أو عن محيط نقاط المسار المعتمدة. بعد أول تأكيد من شخصين تبدأ جلسة رصد لمدة 45 دقيقة، وتتجدد مع كل مشاهدة حديثة ومنطقية للشاحنة.</Text>
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
  truckVisual: { width: 106, height: 86, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  truckGlow: { position: 'absolute', width: 86, height: 58, borderRadius: 30, backgroundColor: colors.soft, borderWidth: 1, borderColor: '#CAE6D5' },
  truckEmoji: { fontSize: 52, lineHeight: 62 },
  title: { fontSize: 24, fontWeight: '900', color: colors.text, textAlign: 'center', marginTop: 8 },
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
