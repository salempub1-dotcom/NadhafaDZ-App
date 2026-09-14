import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { router } from 'expo-router';
import { getNeighborhoodDisplayName, useNeighborhood } from '@/contexts/NeighborhoodContext';
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
  const neighborhoodLabel = getNeighborhoodDisplayName(neighborhood);

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
          <View style={styles.topRow}>
            <View>
              <Text style={styles.hello}>مرحبًا</Text>
              <Text style={styles.locationLine}><Ionicons name="location" size={16} color={colors.primary} /> {neighborhoodLabel}</Text>
            </View>
            <View style={styles.avatar}><Ionicons name="person" size={22} color="#7A8580" /></View>
          </View>

          <View style={styles.heroCard}>
            <PhotoFadeHero height={205}>
              <Text style={styles.brand}>NadhafaDZ</Text>
              <Text style={styles.heroTitle}>نظافة حيّنا</Text>
              <Text style={styles.heroSub}>مسؤوليتنا جميعًا</Text>
            </PhotoFadeHero>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <View style={styles.infoIcon}><Ionicons name="trash-bin" size={24} color={colors.primary} /></View>
              <Text style={styles.infoLabel}>حالة الشاحنة</Text>
              <Text style={[styles.infoValue, latest && styles.infoValueActive]}>{latest ? 'في الخدمة' : 'لا يوجد رصد'}</Text>
              <Text style={styles.infoMeta}>{latest ? `آخر تحديث ${relativeTime(latest.confirmed_at ?? latest.created_at)}` : 'بانتظار رصد مؤكد'}</Text>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoIcon}><Ionicons name="location" size={24} color={colors.primary} /></View>
              <Text style={styles.infoLabel}>المنطقة المحددة</Text>
              <Text style={styles.infoValue}>{neighborhoodLabel}</Text>
              <Text style={styles.infoMeta}>براقي • الجزائر</Text>
            </View>
          </View>

          <View style={styles.selectorCard}>
            <Text style={styles.selectorTitle}>تغيير المنطقة</Text>
            <View style={styles.selectorRow}>
              {(['بن يوب', 'العميرات'] as const).map((item) => (
                <Pressable key={item} onPress={() => setNeighborhood(item)} style={[styles.choice, neighborhood === item && styles.choiceActive]}>
                  <Text style={[styles.choiceText, neighborhood === item && styles.choiceTextActive]}>{getNeighborhoodDisplayName(item)}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Pressable style={styles.reportCta} onPress={() => router.push('/(app)/report')}>
            <View style={styles.reportTextWrap}>
              <Text style={styles.reportTitle}>إبلاغ عن الشاحنة</Text>
              <Text style={styles.reportSub}>ساعد سكان {neighborhoodLabel} بمعرفة مكانها</Text>
            </View>
            <View style={styles.reportIcon}><Ionicons name="megaphone" size={27} color="#FFFFFF" /></View>
          </Pressable>

          <Text style={styles.sectionTitle}>خدمات سريعة</Text>
          <View style={styles.servicesRow}>
            <Pressable style={styles.serviceCard} onPress={() => router.push('/(app)/map')}>
              <View style={styles.serviceIcon}><Ionicons name="map" size={25} color={colors.primary} /></View>
              <Text style={styles.serviceTitle}>الخريطة الحية</Text>
              <Text style={styles.serviceMeta}>موقع الشاحنة والرصد</Text>
            </Pressable>
            <Pressable style={styles.serviceCard} onPress={() => router.push('/(app)/notifications')}>
              <View style={styles.serviceIcon}><Ionicons name="notifications" size={25} color={colors.primary} /></View>
              <Text style={styles.serviceTitle}>التنبيهات</Text>
              <Text style={styles.serviceMeta}>مرور واقتراب الشاحنة</Text>
            </Pressable>
          </View>

          {latest && (
            <Pressable style={styles.liveCard} onPress={() => router.push('/(app)/map')}>
              <View style={styles.liveDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.liveTitle}>الشاحنة في طريقها</Text>
                <Text style={styles.liveText}>آخر رصد مؤكد في {getNeighborhoodDisplayName(latest.neighborhood)} • اضغط لعرض الموقع</Text>
              </View>
              <Ionicons name="chevron-back" size={20} color={colors.primary} />
            </Pressable>
          )}
        </ScrollView>
      </SafeAreaView>
    </MintBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingBottom: 28, gap: 14 },
  topRow: { marginHorizontal: 18, marginTop: 8, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  hello: { color: colors.text, fontSize: 16, fontWeight: '800', textAlign: 'right' },
  locationLine: { color: colors.primary, fontSize: 16, fontWeight: '900', textAlign: 'right', marginTop: 3 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF1EF' },
  heroCard: { marginHorizontal: 18, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, ...shadow },
  brand: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', textAlign: 'right', textShadowColor: 'rgba(0,0,0,0.28)', textShadowRadius: 5 },
  heroTitle: { color: '#FFFFFF', fontSize: 27, fontWeight: '900', textAlign: 'right', marginTop: 3, textShadowColor: 'rgba(0,0,0,0.32)', textShadowRadius: 6 },
  heroSub: { color: '#F4FFF8', textAlign: 'right', fontSize: 18, fontWeight: '800', marginTop: 2, textShadowColor: 'rgba(0,0,0,0.28)', textShadowRadius: 5 },
  infoGrid: { marginHorizontal: 18, flexDirection: 'row', gap: 10 },
  infoCard: { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, padding: 15, borderWidth: 1, borderColor: colors.border, ...shadow },
  infoIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end' },
  infoLabel: { color: colors.secondary, textAlign: 'right', marginTop: 10, fontSize: 12, fontWeight: '700' },
  infoValue: { color: colors.text, textAlign: 'right', fontWeight: '900', fontSize: 17, marginTop: 3 },
  infoValueActive: { color: colors.primary },
  infoMeta: { color: colors.secondary, textAlign: 'right', fontSize: 11, marginTop: 3 },
  selectorCard: { marginHorizontal: 18, backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: colors.border },
  selectorTitle: { textAlign: 'right', color: colors.text, fontWeight: '900', marginBottom: 10 },
  selectorRow: { flexDirection: 'row', gap: 9 },
  choice: { flex: 1, minHeight: 42, borderRadius: 13, borderWidth: 1, borderColor: '#CFE1D7', backgroundColor: '#F8FBF9', alignItems: 'center', justifyContent: 'center' },
  choiceActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  choiceText: { color: colors.text, fontWeight: '800' },
  choiceTextActive: { color: '#FFFFFF' },
  reportCta: { marginHorizontal: 18, minHeight: 82, borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: 18, flexDirection: 'row-reverse', alignItems: 'center', gap: 12, shadowColor: colors.primaryDark, shadowOpacity: 0.16, shadowRadius: 14, elevation: 5 },
  reportTextWrap: { flex: 1 },
  reportTitle: { color: '#FFFFFF', textAlign: 'right', fontSize: 20, fontWeight: '900' },
  reportSub: { color: '#E7F6EE', textAlign: 'right', marginTop: 4, fontSize: 12 },
  reportIcon: { width: 48, height: 48, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.13)', alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { marginHorizontal: 18, color: colors.text, fontSize: 18, fontWeight: '900', textAlign: 'right', marginTop: 2 },
  servicesRow: { marginHorizontal: 18, flexDirection: 'row', gap: 10 },
  serviceCard: { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.border, ...shadow },
  serviceIcon: { width: 43, height: 43, borderRadius: 14, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end' },
  serviceTitle: { color: colors.text, textAlign: 'right', fontWeight: '900', fontSize: 15, marginTop: 8 },
  serviceMeta: { color: colors.secondary, textAlign: 'right', fontSize: 11, marginTop: 3 },
  liveCard: { marginHorizontal: 18, backgroundColor: '#FFFFFF', borderRadius: radius.lg, padding: 15, borderWidth: 1, borderColor: '#CDE5D7', flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  liveTitle: { color: colors.text, textAlign: 'right', fontWeight: '900' },
  liveText: { color: colors.secondary, textAlign: 'right', fontSize: 12, marginTop: 3, lineHeight: 18 },
});
