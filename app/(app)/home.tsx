import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { router } from 'expo-router';
import { useNeighborhood } from '@/contexts/NeighborhoodContext';
import { supabase } from '@/lib/supabase';
import { MintBackground, PhotoFadeHero } from '@/ui/VisualShell';
import { colors, radius, shadow } from '@/ui/theme';

type LatestTruck = { id: string; neighborhood: string; latitude: number; longitude: number; confirmed_at: string | null; created_at: string };

function relativeTime(value?: string | null) {
  if (!value) return 'الآن';
  const diff = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (diff < 1) return 'الآن';
  if (diff === 1) return 'منذ دقيقة';
  if (diff < 60) return `منذ ${diff} دقيقة`;
  const h = Math.floor(diff / 60);
  return h === 1 ? 'منذ ساعة' : `منذ ${h} ساعات`;
}

export default function HomeScreen() {
  const { neighborhood, setNeighborhood } = useNeighborhood();
  const [latest, setLatest] = useState<LatestTruck | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.rpc('recent_truck_feed', { target_neighborhood: neighborhood });
      if (active) setLatest(((data ?? [])[0] as LatestTruck | undefined) ?? null);
    })();
    return () => { active = false; };
  }, [neighborhood]);

  return (
    <MintBackground>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <PhotoFadeHero height={255}>
            <Text style={styles.brand}>NadhafaDZ</Text>
            <Text style={styles.title}>نظافة حينا</Text>
            <Text style={styles.heroSub}>تنبيه محلي بسيط، يساعد السكان ويدعم عمل فرق النظافة.</Text>
            <View style={styles.locationBadge}>
              <Ionicons name="location" size={16} color={colors.primary} />
              <Text style={styles.locationText}>حي {neighborhood} • براقي</Text>
            </View>
          </PhotoFadeHero>

          <View style={styles.selectorCard}>
            <Text style={styles.selectorTitle}>اختر حيّك</Text>
            <View style={styles.selectorRow}>
              {(['بن يوب', 'العميرات'] as const).map((item) => (
                <Pressable key={item} onPress={() => setNeighborhood(item)} style={[styles.choice, neighborhood === item && styles.choiceActive]}>
                  <Text style={[styles.choiceText, neighborhood === item && styles.choiceTextActive]}>حي {item}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.statusCard}>
            <View style={styles.statusHead}>
              <View style={styles.statusIcon}><Ionicons name="trash-bin-outline" size={22} color={colors.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>حالة شاحنة النظافة</Text>
                <Text style={styles.status}>{latest ? 'تم رصد الشاحنة' : 'لم يتم رصدها بعد'}</Text>
              </View>
            </View>
            <Text style={styles.muted}>{latest ? `آخر تأكيد ${relativeTime(latest.confirmed_at ?? latest.created_at)} في حي ${latest.neighborhood}.` : 'سيظهر آخر رصد مؤكد هنا فور توفر بيانات المرور.'}</Text>
            {latest && (
              <Pressable style={styles.inlineAction} onPress={() => router.push('/(app)/map')}>
                <Text style={styles.inlineActionText}>عرضها على الخريطة</Text>
                <Ionicons name="navigate-outline" size={17} color={colors.primary} />
              </Pressable>
            )}
          </View>

          <Pressable style={styles.primary} onPress={() => router.push('/(app)/report')}>
            <View style={styles.primaryIcon}><Ionicons name="megaphone" size={27} color={colors.primary} /></View>
            <Text style={styles.primaryTitle}>رأيت شاحنة النظافة الآن</Text>
            <Text style={styles.primarySub}>شارك موقع الشاحنة فقط لتنبيه سكان حي {neighborhood}</Text>
          </Pressable>

          <Text style={styles.sectionTitle}>خدمات سريعة</Text>
          <View style={styles.row}>
            <Pressable style={styles.smallCard} onPress={() => router.push('/(app)/map')}>
              <View style={styles.cardIcon}><Ionicons name="map-outline" size={23} color={colors.primary} /></View>
              <Text style={styles.smallTitle}>الخريطة الحية</Text>
              <Text style={styles.muted}>موقع وآخر رصد</Text>
            </Pressable>
            <Pressable style={styles.smallCard} onPress={() => router.push('/(app)/notifications')}>
              <View style={styles.cardIcon}><Ionicons name="notifications-outline" size={23} color={colors.primary} /></View>
              <Text style={styles.smallTitle}>التنبيهات</Text>
              <Text style={styles.muted}>مرور واقتراب الشاحنة</Text>
            </Pressable>
          </View>

          <View style={styles.info}>
            <View style={styles.infoHead}><Ionicons name="people-outline" size={20} color={colors.primary} /><Text style={styles.infoTitle}>نسخة تجريبية مجتمعية</Text></View>
            <Text style={styles.infoText}>حاليًا يعتمد التطبيق على بلاغات السكان المؤكدة. لاحقًا يمكن ربط التنبيهات مباشرة بشاحنات البلدية.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </MintBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingBottom: 24, gap: 16 },
  brand: { color: colors.primary, fontSize: 16, fontWeight: '900', textAlign: 'right' },
  title: { fontSize: 32, fontWeight: '900', color: colors.primaryDark, textAlign: 'right', marginTop: 2 },
  heroSub: { color: colors.primaryDark, textAlign: 'right', lineHeight: 22, marginTop: 5, maxWidth: '88%', alignSelf: 'flex-end' },
  locationBadge: { marginTop: 10, alignSelf: 'flex-end', flexDirection: 'row-reverse', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.88)', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: colors.border },
  locationText: { color: colors.primaryDark, fontWeight: '800' },
  selectorCard: { marginHorizontal: 18, backgroundColor: colors.card, borderRadius: radius.lg, padding: 18, borderWidth: 1, borderColor: colors.border, ...shadow },
  selectorTitle: { textAlign: 'right', fontWeight: '900', color: colors.text, marginBottom: 12 },
  selectorRow: { flexDirection: 'row', gap: 10 },
  choice: { flex: 1, borderRadius: 14, paddingVertical: 12, borderWidth: 1, borderColor: '#CFE1D7', backgroundColor: '#F7FBF9' },
  choiceActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  choiceText: { textAlign: 'center', fontWeight: '800', color: colors.text },
  choiceTextActive: { color: '#fff' },
  statusCard: { marginHorizontal: 18, backgroundColor: colors.card, borderRadius: radius.lg, padding: 20, borderWidth: 1, borderColor: colors.border, ...shadow },
  statusHead: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  statusIcon: { width: 42, height: 42, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.soft },
  label: { textAlign: 'right', color: colors.secondary, fontWeight: '700' },
  status: { textAlign: 'right', fontSize: 21, fontWeight: '900', color: colors.text, marginTop: 3 },
  muted: { color: colors.secondary, textAlign: 'right', lineHeight: 20, marginTop: 6 },
  inlineAction: { alignSelf: 'flex-end', flexDirection: 'row-reverse', alignItems: 'center', gap: 5, marginTop: 12 },
  inlineActionText: { color: colors.primary, fontWeight: '900' },
  primary: { marginHorizontal: 18, backgroundColor: colors.primary, borderRadius: 24, padding: 22, alignItems: 'center', shadowColor: colors.primaryDark, shadowOpacity: 0.16, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 5 },
  primaryIcon: { width: 50, height: 50, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  primaryTitle: { color: '#fff', fontWeight: '900', fontSize: 21, textAlign: 'center' },
  primarySub: { color: '#EAF7F0', fontSize: 12, textAlign: 'center', marginTop: 6 },
  sectionTitle: { marginHorizontal: 18, textAlign: 'right', fontSize: 18, fontWeight: '900', color: colors.text },
  row: { marginHorizontal: 18, flexDirection: 'row', gap: 12 },
  smallCard: { flex: 1, backgroundColor: colors.card, padding: 18, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, ...shadow },
  cardIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.soft, alignSelf: 'flex-end' },
  smallTitle: { fontWeight: '900', fontSize: 16, color: colors.text, textAlign: 'right', marginTop: 9 },
  info: { marginHorizontal: 18, backgroundColor: colors.decorative, borderRadius: radius.lg, padding: 18 },
  infoHead: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  infoTitle: { textAlign: 'right', fontWeight: '900', color: colors.primary },
  infoText: { textAlign: 'right', color: colors.primaryDark, lineHeight: 22, marginTop: 7 },
});
