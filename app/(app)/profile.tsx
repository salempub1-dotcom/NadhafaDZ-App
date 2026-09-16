import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { getNeighborhoodDisplayName, useNeighborhood } from '@/contexts/NeighborhoodContext';
import { supabase } from '@/lib/supabase';
import { MintBackground } from '@/ui/VisualShell';
import { colors, radius, shadow } from '@/ui/theme';

type Arrival = {
  id: string;
  neighborhood: string;
  confirmed_at: string;
};

const ALGIERS_TIME_ZONE = 'Africa/Algiers';

function formatArrivalDate(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat('ar-DZ', {
    timeZone: ALGIERS_TIME_ZONE,
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function formatArrivalTime(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat('ar-DZ', {
    timeZone: ALGIERS_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { neighborhood } = useNeighborhood();
  const [arrivals, setArrivals] = useState<Arrival[]>([]);
  const [loadingArrivals, setLoadingArrivals] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [arrivalError, setArrivalError] = useState<string | null>(null);

  async function logout() {
    await signOut();
    router.replace('/');
  }

  const name = String(user?.user_metadata?.full_name ?? 'مستخدم NadhafaDZ');
  const neighborhoodLabel = getNeighborhoodDisplayName(neighborhood);

  const loadArrivals = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoadingArrivals(true);

    setArrivalError(null);
    const { data, error } = await supabase.rpc('truck_arrival_history', {
      target_neighborhood: neighborhood,
      history_limit: 50,
    });

    if (error) {
      setArrivalError('تعذر تحميل سجل دخول الشاحنة حالياً.');
      setArrivals([]);
    } else {
      setArrivals((data ?? []) as Arrival[]);
    }

    setLoadingArrivals(false);
    setRefreshing(false);
  }, [neighborhood]);

  useEffect(() => {
    void loadArrivals();
  }, [loadArrivals]);

  const monthCount = useMemo(() => {
    const nowParts = new Intl.DateTimeFormat('en-CA', {
      timeZone: ALGIERS_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
    }).format(new Date());

    return arrivals.filter((arrival) => {
      const arrivalParts = new Intl.DateTimeFormat('en-CA', {
        timeZone: ALGIERS_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
      }).format(new Date(arrival.confirmed_at));
      return arrivalParts === nowParts;
    }).length;
  }, [arrivals]);

  const latestArrival = arrivals[0];

  return (
    <MintBackground>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadArrivals(true)} tintColor={colors.primary} />}
        >
          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              <Text style={styles.kicker}>إعداداتك</Text>
              <Text style={styles.title}>حسابي</Text>
              <Text style={styles.headerSubtitle}>ملفك الشخصي وسجل مرور شاحنة النظافة</Text>
            </View>
            <View style={styles.headerIcon}>
              <Ionicons name="person-circle-outline" size={30} color={colors.primary} />
            </View>
          </View>

          <View style={styles.profileCard}>
            <View style={styles.profileTop}>
              <View style={styles.avatar}>
                <Ionicons name="person-outline" size={31} color={colors.primary} />
              </View>
              <View style={styles.profileText}>
                <Text style={styles.name}>{name}</Text>
                <Text style={styles.email}>{user?.email ?? '—'}</Text>
              </View>
            </View>

            <View style={styles.neighborhoodPill}>
              <Ionicons name="location" size={16} color={colors.primary} />
              <Text style={styles.neighborhoodPillText}>{neighborhoodLabel} • براقي</Text>
            </View>
          </View>

          <View style={styles.accountCard}>
            <Text style={styles.cardHeading}>بيانات الحساب</Text>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}><Ionicons name="mail-outline" size={20} color={colors.primary} /></View>
              <View style={styles.infoTextWrap}>
                <Text style={styles.infoLabel}>البريد الإلكتروني</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{user?.email ?? '—'}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}><Ionicons name="navigate-outline" size={20} color={colors.primary} /></View>
              <View style={styles.infoTextWrap}>
                <Text style={styles.infoLabel}>المنطقة المحددة</Text>
                <Text style={styles.infoValue}>{neighborhoodLabel}</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>إحصائيات دخول الشاحنة</Text>
              <Text style={styles.sectionSubtitle}>يظهر هنا المرور الذي تم تأكيده فقط</Text>
            </View>
            <View style={styles.sectionIcon}>
              <Ionicons name="stats-chart-outline" size={21} color={colors.primary} />
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCardPrimary}>
              <View style={styles.statIconPrimary}><Ionicons name="checkmark-done-outline" size={20} color="#FFFFFF" /></View>
              <Text style={styles.statNumberPrimary}>{arrivals.length}</Text>
              <Text style={styles.statLabelPrimary}>مرور مؤكد</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIcon}><Ionicons name="calendar-outline" size={20} color={colors.primary} /></View>
              <Text style={styles.statNumber}>{monthCount}</Text>
              <Text style={styles.statLabel}>هذا الشهر</Text>
            </View>
          </View>

          <View style={styles.latestCard}>
            <View style={styles.latestIcon}>
              <Ionicons name="time-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.latestTextWrap}>
              <Text style={styles.latestLabel}>آخر دخول مؤكد</Text>
              {latestArrival ? (
                <>
                  <Text style={styles.latestDate}>{formatArrivalDate(latestArrival.confirmed_at)}</Text>
                  <Text style={styles.latestTime}>الساعة {formatArrivalTime(latestArrival.confirmed_at)}</Text>
                </>
              ) : (
                <Text style={styles.latestEmpty}>لا يوجد سجل مؤكد بعد</Text>
              )}
            </View>
          </View>

          <View style={styles.historyCard}>
            <View style={styles.historyTopRow}>
              <View>
                <Text style={styles.historyTitle}>سجل الدخول</Text>
                <Text style={styles.historySubtitle}>آخر 10 مرات مؤكدة</Text>
              </View>
              <View style={styles.historyIcon}><Ionicons name="list-outline" size={20} color={colors.primary} /></View>
            </View>

            {loadingArrivals ? (
              <View style={styles.stateBox}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.stateText}>جاري تحميل السجل...</Text>
              </View>
            ) : arrivalError ? (
              <View style={styles.stateBox}>
                <Ionicons name="alert-circle-outline" size={24} color={colors.secondary} />
                <Text style={styles.stateText}>{arrivalError}</Text>
                <Pressable onPress={() => void loadArrivals()} style={styles.retryButton}>
                  <Text style={styles.retryText}>إعادة المحاولة</Text>
                </Pressable>
              </View>
            ) : arrivals.length === 0 ? (
              <View style={styles.stateBox}>
                <View style={styles.emptyIcon}><Ionicons name="bus-outline" size={25} color={colors.primary} /></View>
                <Text style={styles.emptyTitle}>لا توجد زيارات مؤكدة بعد</Text>
                <Text style={styles.stateText}>عند تأكيد مرور الشاحنة في {neighborhoodLabel} سيظهر اليوم والتوقيت هنا.</Text>
              </View>
            ) : (
              arrivals.slice(0, 10).map((arrival, index) => (
                <View key={arrival.id}>
                  <View style={styles.arrivalRow}>
                    <View style={styles.timelineColumn}>
                      <View style={styles.timelineDot}><Ionicons name="checkmark" size={12} color="#FFFFFF" /></View>
                      {index < Math.min(arrivals.length, 10) - 1 ? <View style={styles.timelineLine} /> : null}
                    </View>
                    <View style={styles.arrivalInfo}>
                      <Text style={styles.arrivalDate}>{formatArrivalDate(arrival.confirmed_at)}</Text>
                      <Text style={styles.arrivalArea}>{getNeighborhoodDisplayName(arrival.neighborhood)}</Text>
                    </View>
                    <View style={styles.arrivalTimeBox}>
                      <Text style={styles.arrivalTime}>{formatArrivalTime(arrival.confirmed_at)}</Text>
                      <Text style={styles.arrivalTimeLabel}>مؤكد</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>

          <Pressable style={styles.logout} onPress={logout}>
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
            <Text style={styles.logoutText}>تسجيل الخروج</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </MintBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 34 },

  headerRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerCopy: { flex: 1 },
  kicker: { color: colors.primary, fontWeight: '900', textAlign: 'right', fontSize: 13 },
  title: { fontSize: 31, fontWeight: '900', color: colors.text, textAlign: 'right', marginTop: 1 },
  headerSubtitle: { color: colors.secondary, textAlign: 'right', fontSize: 12, marginTop: 4 },
  headerIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.soft, marginLeft: 12 },

  profileCard: { backgroundColor: colors.card, borderRadius: radius.xl, padding: 18, borderWidth: 1, borderColor: colors.border, ...shadow },
  profileTop: { flexDirection: 'row-reverse', alignItems: 'center', gap: 13 },
  avatar: { width: 70, height: 70, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.soft },
  profileText: { flex: 1 },
  name: { fontSize: 21, fontWeight: '900', color: colors.text, textAlign: 'right' },
  email: { color: colors.secondary, marginTop: 4, textAlign: 'right', fontSize: 13 },
  neighborhoodPill: { alignSelf: 'flex-end', marginTop: 14, flexDirection: 'row-reverse', alignItems: 'center', gap: 6, backgroundColor: colors.soft, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  neighborhoodPillText: { color: colors.primary, fontWeight: '800', fontSize: 12 },

  accountCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.border, marginTop: 14, ...shadow },
  cardHeading: { color: colors.text, fontWeight: '900', fontSize: 15, textAlign: 'right', marginBottom: 13 },
  infoRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  infoIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.soft },
  infoTextWrap: { flex: 1 },
  infoLabel: { textAlign: 'right', color: colors.secondary, fontSize: 12 },
  infoValue: { textAlign: 'right', color: colors.text, fontSize: 15, fontWeight: '800', marginTop: 3 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 13 },

  sectionHeader: { marginTop: 22, flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  sectionHeaderText: { flex: 1 },
  sectionTitle: { textAlign: 'right', color: colors.text, fontSize: 19, fontWeight: '900' },
  sectionSubtitle: { textAlign: 'right', color: colors.secondary, fontSize: 12, marginTop: 3 },
  sectionIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.soft },

  statsRow: { flexDirection: 'row-reverse', gap: 10, marginTop: 12 },
  statCardPrimary: { flex: 1, minHeight: 128, backgroundColor: colors.primary, borderRadius: radius.lg, padding: 15, justifyContent: 'space-between', ...shadow },
  statIconPrimary: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)', alignSelf: 'flex-end' },
  statNumberPrimary: { color: '#FFFFFF', fontSize: 29, fontWeight: '900', textAlign: 'right' },
  statLabelPrimary: { color: 'rgba(255,255,255,0.86)', fontSize: 12, fontWeight: '800', textAlign: 'right' },
  statCard: { flex: 1, minHeight: 128, backgroundColor: colors.card, borderRadius: radius.lg, padding: 15, borderWidth: 1, borderColor: colors.border, justifyContent: 'space-between', ...shadow },
  statIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.soft, alignSelf: 'flex-end' },
  statNumber: { color: colors.text, fontSize: 29, fontWeight: '900', textAlign: 'right' },
  statLabel: { color: colors.secondary, fontSize: 12, fontWeight: '800', textAlign: 'right' },

  latestCard: { marginTop: 10, backgroundColor: colors.card, borderRadius: radius.lg, padding: 15, borderWidth: 1, borderColor: colors.border, flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  latestIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.soft },
  latestTextWrap: { flex: 1 },
  latestLabel: { color: colors.secondary, fontSize: 11, textAlign: 'right' },
  latestDate: { color: colors.text, fontSize: 15, fontWeight: '900', textAlign: 'right', marginTop: 2 },
  latestTime: { color: colors.primary, fontSize: 12, fontWeight: '800', textAlign: 'right', marginTop: 3 },
  latestEmpty: { color: colors.secondary, fontSize: 13, textAlign: 'right', marginTop: 3 },

  historyCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.border, marginTop: 12, ...shadow },
  historyTopRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  historyTitle: { color: colors.text, fontSize: 17, fontWeight: '900', textAlign: 'right' },
  historySubtitle: { color: colors.secondary, fontSize: 11, textAlign: 'right', marginTop: 2 },
  historyIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.soft },
  stateBox: { minHeight: 150, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 20 },
  stateText: { color: colors.secondary, textAlign: 'center', lineHeight: 20, fontSize: 12 },
  emptyIcon: { width: 50, height: 50, borderRadius: 17, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: colors.text, fontWeight: '900', fontSize: 14 },
  retryButton: { marginTop: 2, backgroundColor: colors.soft, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  retryText: { color: colors.primary, fontWeight: '900' },

  arrivalRow: { flexDirection: 'row-reverse', alignItems: 'stretch', minHeight: 76, paddingVertical: 8, gap: 10 },
  timelineColumn: { width: 22, alignItems: 'center' },
  timelineDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 5, zIndex: 2 },
  timelineLine: { width: 2, flex: 1, backgroundColor: colors.border, marginTop: -1, marginBottom: -13 },
  arrivalInfo: { flex: 1, justifyContent: 'center' },
  arrivalDate: { color: colors.text, fontSize: 14, fontWeight: '900', textAlign: 'right' },
  arrivalArea: { color: colors.secondary, fontSize: 12, textAlign: 'right', marginTop: 4 },
  arrivalTimeBox: { width: 74, borderRadius: 14, backgroundColor: colors.soft, paddingVertical: 9, paddingHorizontal: 8, alignItems: 'center', alignSelf: 'center' },
  arrivalTime: { color: colors.primary, fontSize: 15, fontWeight: '900' },
  arrivalTimeLabel: { color: colors.secondary, fontSize: 10, marginTop: 2 },

  logout: { minHeight: 54, borderWidth: 1, borderColor: '#E7BDBD', borderRadius: radius.md, marginTop: 18, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFF9F9' },
  logoutText: { color: colors.danger, fontWeight: '900', textAlign: 'center' },
});
