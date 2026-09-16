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

  return (
    <MintBackground>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadArrivals(true)} tintColor={colors.primary} />}
        >
          <Text style={styles.kicker}>إعداداتك</Text>
          <Text style={styles.title}>حسابي</Text>

          <View style={styles.profileCard}>
            <View style={styles.avatar}><Ionicons name="person-outline" size={30} color={colors.primary} /></View>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.email}>{user?.email ?? '—'}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowIcon}><Ionicons name="mail-outline" size={20} color={colors.primary} /></View>
              <View style={styles.rowText}><Text style={styles.label}>البريد الإلكتروني</Text><Text style={styles.value}>{user?.email ?? '—'}</Text></View>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <View style={styles.rowIcon}><Ionicons name="location-outline" size={20} color={colors.primary} /></View>
              <View style={styles.rowText}><Text style={styles.label}>المنطقة المحددة</Text><Text style={styles.value}>{neighborhoodLabel}</Text></View>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}><Ionicons name="time-outline" size={22} color={colors.primary} /></View>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>إحصائيات دخول الشاحنة</Text>
              <Text style={styles.sectionSubtitle}>تُسجّل فقط بعد تأكيد مرور الشاحنة</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{arrivals.length}</Text>
              <Text style={styles.statLabel}>إجمالي السجل</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{monthCount}</Text>
              <Text style={styles.statLabel}>هذا الشهر</Text>
            </View>
          </View>

          <View style={styles.historyCard}>
            <View style={styles.historyTopRow}>
              <Text style={styles.historyTitle}>آخر مرات الدخول</Text>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
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
                <Ionicons name="truck-outline" size={26} color={colors.secondary} />
                <Text style={styles.stateText}>لا توجد مرات دخول مؤكدة مسجلة بعد في {neighborhoodLabel}.</Text>
              </View>
            ) : (
              arrivals.slice(0, 10).map((arrival, index) => (
                <View key={arrival.id}>
                  <View style={styles.arrivalRow}>
                    <View style={styles.arrivalTimeBox}>
                      <Text style={styles.arrivalTime}>{formatArrivalTime(arrival.confirmed_at)}</Text>
                      <Text style={styles.arrivalTimeLabel}>التوقيت</Text>
                    </View>
                    <View style={styles.arrivalInfo}>
                      <Text style={styles.arrivalDate}>{formatArrivalDate(arrival.confirmed_at)}</Text>
                      <View style={styles.confirmedLine}>
                        <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                        <Text style={styles.confirmedText}>مرور مؤكد • {getNeighborhoodDisplayName(arrival.neighborhood)}</Text>
                      </View>
                    </View>
                  </View>
                  {index < Math.min(arrivals.length, 10) - 1 ? <View style={styles.historyDivider} /> : null}
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
  content: { padding: 20, paddingBottom: 34 },
  kicker: { color: colors.primary, fontWeight: '900', textAlign: 'right', marginTop: 14 },
  title: { fontSize: 30, fontWeight: '900', color: colors.text, textAlign: 'right', marginTop: 3, marginBottom: 18 },
  profileCard: { backgroundColor: colors.card, borderRadius: radius.xl, padding: 22, alignItems: 'center', borderWidth: 1, borderColor: colors.border, ...shadow },
  avatar: { width: 72, height: 72, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.soft, marginBottom: 12 },
  name: { fontSize: 20, fontWeight: '900', color: colors.text, textAlign: 'center' },
  email: { color: colors.secondary, marginTop: 5, textAlign: 'center' },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 18, borderWidth: 1, borderColor: colors.border, marginTop: 16, ...shadow },
  row: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  rowIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.soft },
  rowText: { flex: 1 },
  label: { textAlign: 'right', color: colors.secondary, fontSize: 13 },
  value: { textAlign: 'right', color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 3 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
  sectionHeader: { marginTop: 22, flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  sectionIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.soft },
  sectionHeaderText: { flex: 1 },
  sectionTitle: { textAlign: 'right', color: colors.text, fontSize: 18, fontWeight: '900' },
  sectionSubtitle: { textAlign: 'right', color: colors.secondary, fontSize: 12, marginTop: 3 },
  statsRow: { flexDirection: 'row-reverse', gap: 10, marginTop: 12 },
  statCard: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, paddingVertical: 15, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center', ...shadow },
  statNumber: { color: colors.primary, fontSize: 25, fontWeight: '900' },
  statLabel: { color: colors.secondary, fontSize: 12, fontWeight: '700', marginTop: 3 },
  historyCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.border, marginTop: 12, ...shadow },
  historyTopRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  historyTitle: { color: colors.text, fontSize: 16, fontWeight: '900', textAlign: 'right' },
  stateBox: { minHeight: 116, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 20 },
  stateText: { color: colors.secondary, textAlign: 'center', lineHeight: 20 },
  retryButton: { marginTop: 2, backgroundColor: colors.soft, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  retryText: { color: colors.primary, fontWeight: '900' },
  arrivalRow: { flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: 13, gap: 12 },
  arrivalTimeBox: { width: 82, borderRadius: 14, backgroundColor: colors.soft, paddingVertical: 9, alignItems: 'center' },
  arrivalTime: { color: colors.primary, fontSize: 16, fontWeight: '900' },
  arrivalTimeLabel: { color: colors.secondary, fontSize: 10, marginTop: 2 },
  arrivalInfo: { flex: 1 },
  arrivalDate: { color: colors.text, fontSize: 14, fontWeight: '900', textAlign: 'right' },
  confirmedLine: { marginTop: 5, flexDirection: 'row-reverse', alignItems: 'center', gap: 5 },
  confirmedText: { color: colors.secondary, fontSize: 12, textAlign: 'right' },
  historyDivider: { height: 1, backgroundColor: colors.border },
  logout: { minHeight: 52, borderWidth: 1, borderColor: '#E7BDBD', borderRadius: radius.md, marginTop: 18, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFF9F9' },
  logoutText: { color: colors.danger, fontWeight: '900', textAlign: 'center' },
});
