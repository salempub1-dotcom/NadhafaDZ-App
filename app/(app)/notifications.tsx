import { useEffect, useState } from 'react';
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useAuth } from '@/contexts/AuthContext';
import { getNeighborhoodDisplayName, useNeighborhood } from '@/contexts/NeighborhoodContext';
import { disablePushToken, getPushNotificationEnabled, registerPushNotifications } from '@/lib/pushNotifications';
import { MintBackground } from '@/ui/VisualShell';
import { colors, radius, shadow } from '@/ui/theme';

export default function NotificationsScreen() {
  const { user } = useAuth();
  const { neighborhood } = useNeighborhood();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const neighborhoodLabel = getNeighborhoodDisplayName(neighborhood);

  useEffect(() => {
    let active = true;

    async function loadState() {
      if (!user) {
        if (active) setChecking(false);
        return;
      }

      try {
        const isEnabled = await getPushNotificationEnabled(user.id);
        if (active) setEnabled(isEnabled);
      } catch {
        // Keep the screen usable even if the network is temporarily unavailable.
      } finally {
        if (active) setChecking(false);
      }
    }

    void loadState();
    return () => { active = false; };
  }, [user]);

  async function enableNotifications() {
    if (!user) return;
    setLoading(true);
    try {
      await registerPushNotifications(user.id, neighborhood);
      setEnabled(true);
      Alert.alert('تم تفعيل التنبيهات', `سيصلك إشعار على الهاتف عند تأكيد مرور شاحنة النظافة في ${neighborhoodLabel}، حتى عندما يكون التطبيق في الخلفية.`);
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
        <Text style={styles.kicker}>إعدادات المنطقة</Text>
        <Text style={styles.title}>التنبيهات</Text>
        <Text style={styles.sub}>الإشعارات الخاصة بـ {neighborhoodLabel}.</Text>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <View style={[styles.iconWrap, enabled && styles.iconWrapEnabled]}>
              <Ionicons name={enabled ? 'notifications' : 'notifications-outline'} size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>تنبيه مرور شاحنة النظافة</Text>
              <Text style={[styles.status, !enabled && styles.statusOff]}>
                {checking ? 'جارٍ التحقق...' : enabled ? 'مفعّلة دائمًا' : 'غير مفعّلة'}
              </Text>
            </View>
          </View>

          <Text style={styles.body}>
            عند تأكيد مرور الشاحنة سيصلك إشعار على الهاتف. إذا كان التطبيق مغلقًا أو في الخلفية، اضغط على الإشعار لفتح الخريطة ومراقبة آخر موقع مؤكد.
          </Text>

          {enabled ? (
            <View style={styles.activeNote}>
              <Ionicons name="checkmark-circle" size={19} color={colors.primary} />
              <Text style={styles.activeNoteText}>سيبقى التنبيه مفعّلًا بعد إغلاق التطبيق وفتحه من جديد.</Text>
            </View>
          ) : null}

          <Pressable
            style={[styles.button, enabled && styles.buttonSecondary, (loading || checking) && styles.disabled]}
            onPress={enabled ? disableNotifications : enableNotifications}
            disabled={loading || checking}
          >
            <Ionicons name={enabled ? 'notifications-off-outline' : 'notifications-outline'} size={19} color={enabled ? colors.primaryDark : '#FFFFFF'} />
            <Text style={[styles.buttonText, enabled && styles.buttonTextSecondary]}>
              {loading ? 'جارٍ الحفظ...' : enabled ? 'إيقاف التنبيهات' : 'تفعيل التنبيهات'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <View style={styles.iconWrap}><Ionicons name="phone-portrait-outline" size={24} color={colors.primary} /></View>
            <Text style={styles.cardTitle}>تنبيه مباشر للهاتف</Text>
          </View>
          <Text style={styles.body}>يصل الإشعار فقط عند وجود رصد مؤكد، ويحتوي على المنطقة أو أقرب معلم معروف. الضغط عليه ينقلك مباشرة إلى الخريطة.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <View style={styles.iconWrap}><Ionicons name="location-outline" size={24} color={colors.primary} /></View>
            <Text style={styles.cardTitle}>تنبيهات مفهومة محليًا</Text>
          </View>
          <Text style={styles.body}>نستخدم إحداثيات الشاحنة المؤكدة فقط لمقارنتها بالمعالم المعروفة داخل الحوش وحي بن يوب. لا يظهر موقع صاحب البلاغ أو هويته.</Text>
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
  iconWrapEnabled: { borderWidth: 1, borderColor: '#B8E0CA' },
  cardTitle: { flex: 1, fontWeight: '900', fontSize: 17, color: colors.text, textAlign: 'right' },
  status: { color: colors.primary, fontSize: 12, fontWeight: '900', textAlign: 'right', marginTop: 2 },
  statusOff: { color: colors.secondary },
  body: { color: colors.secondary, lineHeight: 22, textAlign: 'right', marginTop: 12 },
  activeNote: { marginTop: 14, flexDirection: 'row-reverse', alignItems: 'center', gap: 7, backgroundColor: colors.soft, borderRadius: 14, padding: 12 },
  activeNoteText: { flex: 1, color: colors.primaryDark, fontSize: 12, fontWeight: '800', textAlign: 'right', lineHeight: 18 },
  button: { minHeight: 52, backgroundColor: colors.primary, borderRadius: radius.md, marginTop: 16, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 7 },
  buttonSecondary: { backgroundColor: colors.soft, borderWidth: 1, borderColor: colors.border },
  disabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '900', fontSize: 15, textAlign: 'center' },
  buttonTextSecondary: { color: colors.primaryDark },
});
