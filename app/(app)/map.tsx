import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker, Polygon, Polyline, type LatLng } from 'react-native-maps';
import * as Location from 'expo-location';
import Ionicons from '@react-native-vector-icons/ionicons';
import { supabase } from '@/lib/supabase';
import { proximityLabel, SERVICE_LANDMARKS } from '@/lib/landmarks';

type TruckFeedItem = {
  id: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  status: string;
  created_at: string;
  confirmed_at: string | null;
};

type PendingReport = {
  id: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  created_at: string;
};

type MapKind = 'standard' | 'satellite' | 'hybrid';

const PRIMARY = '#168A55';
const DARK = '#17352A';
const LIGHT = '#F5FAF7';
const NEIGHBORHOODS = ['بن يوب', 'العميرات'] as const;

function displayNeighborhood(value: string) {
  return value === 'العميرات' ? 'الحوش' : value === 'بن يوب' ? 'حي بن يوب' : value;
}

// The pilot follows the real main road from the Candia / El Houch side into Ben Youb.
// Hamza mosque belongs to Ben Youb and is kept as a key reference point inside the block.
const MAIN_ROAD: LatLng[] = [
  { latitude: 36.65195, longitude: 3.1042 },
  { latitude: 36.65208, longitude: 3.1072 },
  { latitude: 36.6522, longitude: 3.1087 },
  { latitude: 36.65238, longitude: 3.1112 },
  { latitude: 36.65255, longitude: 3.1128 },
  { latitude: 36.65245, longitude: 3.1142 },
  { latitude: 36.6525756, longitude: 3.1151464 },
  { latitude: 36.65268, longitude: 3.11715 },
  { latitude: 36.65282, longitude: 3.1195 },
  { latitude: 36.653, longitude: 3.1211 },
];

const BEN_YOUB_POLYGON: LatLng[] = [
  { latitude: 36.65235, longitude: 3.1144 },
  { latitude: 36.65225, longitude: 3.1210 },
  { latitude: 36.6560, longitude: 3.1211 },
  { latitude: 36.6562, longitude: 3.1170 },
  { latitude: 36.6553, longitude: 3.1149 },
  { latitude: 36.6535, longitude: 3.1143 },
];

const SERVICE_VIEW_POINTS: LatLng[] = [
  MAIN_ROAD[0],
  MAIN_ROAD[MAIN_ROAD.length - 1],
  { latitude: 36.6560, longitude: 3.1192 },
  { latitude: 36.6523, longitude: 3.1144 },
];

const DEFAULT_REGION = {
  latitude: 36.65345,
  longitude: 3.1129,
  latitudeDelta: 0.0095,
  longitudeDelta: 0.021,
};

function validPoint(lat: unknown, lon: unknown) {
  return typeof lat === 'number' && Number.isFinite(lat) && typeof lon === 'number' && Number.isFinite(lon);
}

function relativeAge(date: string | null | undefined) {
  if (!date) return 'الآن';
  const value = new Date(date).getTime();
  if (!Number.isFinite(value)) return 'الآن';
  const minutes = Math.max(0, Math.floor((Date.now() - value) / 60000));
  if (minutes < 1) return 'الآن';
  if (minutes === 1) return 'منذ دقيقة';
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  return hours === 1 ? 'منذ ساعة' : `منذ ${hours} ساعات`;
}

function TruckPulseMarker({ coordinate }: { coordinate: LatLng }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.85, 2.15] });
  const opacity = pulse.interpolate({ inputRange: [0, 0.65, 1], outputRange: [0.5, 0.2, 0] });

  return (
    <Marker coordinate={coordinate} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges>
      <View style={styles.truckMarkerWrap}>
        <Animated.View style={[styles.pulseRing, { opacity, transform: [{ scale }] }]} />
        <View style={styles.truckMarkerCore}><Text style={styles.truckEmoji}>🚛</Text></View>
      </View>
    </Marker>
  );
}

export default function MapScreen() {
  const mapRef = useRef<MapView | null>(null);
  const [items, setItems] = useState<TruckFeedItem[]>([]);
  const [pending, setPending] = useState<PendingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapType, setMapType] = useState<MapKind>('hybrid');

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError(null);
    const results = await Promise.all(
      NEIGHBORHOODS.map(async (target) => {
        const [confirmedResult, pendingResult] = await Promise.all([
          supabase.rpc('recent_truck_feed', { target_neighborhood: target }),
          supabase.rpc('recent_pending_truck_reports', { target_neighborhood: target }),
        ]);
        return { confirmedResult, pendingResult };
      }),
    );

    const confirmed: TruckFeedItem[] = [];
    const pendingRows: PendingReport[] = [];
    const errors: string[] = [];
    for (const result of results) {
      if (result.confirmedResult.error) errors.push(result.confirmedResult.error.message);
      else confirmed.push(...((result.confirmedResult.data ?? []) as TruckFeedItem[]).filter((x) => validPoint(x.latitude, x.longitude)));
      if (!result.pendingResult.error) pendingRows.push(...((result.pendingResult.data ?? []) as PendingReport[]).filter((x) => validPoint(x.latitude, x.longitude)));
    }
    confirmed.sort((a, b) => new Date(b.confirmed_at ?? b.created_at).getTime() - new Date(a.confirmed_at ?? a.created_at).getTime());
    pendingRows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setItems(confirmed);
    setPending(pendingRows);
    setError(errors.length === NEIGHBORHOODS.length ? errors[0] : null);
    setLoading(false);
  }, []);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  const latest = items[0];
  const pendingLatest = pending[0];
  const latestPlace = latest ? proximityLabel(latest.latitude, latest.longitude) : null;

  const focusServiceArea = useCallback(() => {
    if (!mapReady || !mapRef.current) return;
    mapRef.current.fitToCoordinates(SERVICE_VIEW_POINTS, {
      edgePadding: { top: 55, right: 35, bottom: 150, left: 35 },
      animated: true,
    });
  }, [mapReady]);

  useEffect(() => {
    if (!mapReady) return;
    const timeout = setTimeout(focusServiceArea, 250);
    return () => clearTimeout(timeout);
  }, [focusServiceArea, mapReady]);

  const focusTruck = useCallback(() => {
    if (!mapReady || !mapRef.current || !latest || !validPoint(latest.latitude, latest.longitude)) return;
    mapRef.current.animateCamera({ center: { latitude: latest.latitude, longitude: latest.longitude }, zoom: 18 }, { duration: 650 });
  }, [latest, mapReady]);

  const cycleMapType = () => {
    setMapType((current) => current === 'hybrid' ? 'standard' : current === 'standard' ? 'satellite' : 'hybrid');
  };

  async function confirmSighting(report: PendingReport) {
    setConfirmingId(report.id);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('الموقع مطلوب', 'نحتاج موقعك فقط للتحقق أنك قريب من مكان الرصد قبل التأكيد.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { error: rpcError } = await supabase.rpc('confirm_truck_report', {
        target_report: report.id,
        confirmer_lat: pos.coords.latitude,
        confirmer_lon: pos.coords.longitude,
      });
      if (rpcError) throw rpcError;
      const { error: notifyError } = await supabase.functions.invoke('notify-neighborhood', { body: { report_id: report.id } });
      if (notifyError) console.warn('Push notification dispatch failed:', notifyError.message);
      Alert.alert('تم التأكيد', 'تم تأكيد الرصد وسيظهر موقع الشاحنة لسكان المنطقة.');
      await loadFeed();
    } catch (e: any) {
      Alert.alert('تعذر تأكيد الرصد', e?.message ?? 'حاول مرة أخرى.');
    } finally {
      setConfirmingId(null);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>الخريطة الحية</Text>
          <Text style={styles.sub}>الحوش • الطريق الرئيسي • حي بن يوب</Text>
        </View>
        <Pressable style={styles.refresh} onPress={loadFeed} disabled={loading}>
          <Ionicons name="refresh" size={18} color={PRIMARY} />
          <Text style={styles.refreshText}>{loading ? '...' : 'تحديث'}</Text>
        </Pressable>
      </View>

      {loading && !latest && !pendingLatest ? (
        <View style={styles.center}><ActivityIndicator size="large" color={PRIMARY} /><Text style={styles.muted}>جارٍ تحميل الرصد...</Text></View>
      ) : error ? (
        <View style={styles.center}><Text style={styles.errorTitle}>تعذر تحميل بيانات الخريطة</Text><Text style={styles.muted}>{error}</Text><Pressable style={styles.retry} onPress={loadFeed}><Text style={styles.retryText}>إعادة المحاولة</Text></Pressable></View>
      ) : (
        <View style={styles.mapShell}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={DEFAULT_REGION}
            minZoomLevel={15.2}
            maxZoomLevel={20}
            mapType={mapType}
            showsBuildings
            showsPointsOfInterest
            showsTraffic={false}
            toolbarEnabled={false}
            onMapReady={() => setMapReady(true)}
            mapPadding={{ top: 12, right: 8, bottom: 115, left: 8 }}
          >
            <Polyline coordinates={MAIN_ROAD} strokeColor="rgba(22,138,85,0.72)" strokeWidth={8} />
            <Polyline coordinates={MAIN_ROAD} strokeColor="rgba(255,255,255,0.78)" strokeWidth={2} lineDashPattern={[8, 8]} />
            <Polygon coordinates={BEN_YOUB_POLYGON} strokeColor="rgba(22,138,85,0.7)" fillColor="rgba(22,138,85,0.045)" strokeWidth={2} />

            {SERVICE_LANDMARKS.map((landmark) => (
              <Marker
                key={landmark.key}
                coordinate={{ latitude: landmark.latitude, longitude: landmark.longitude }}
                title={landmark.name}
                description={displayNeighborhood(landmark.neighborhood)}
                pinColor={landmark.kind === 'pharmacy' ? '#E65353' : landmark.kind === 'mosque' ? '#168A55' : '#567A8A'}
              />
            ))}

            {latest && <TruckPulseMarker coordinate={{ latitude: latest.latitude, longitude: latest.longitude }} />}
            {items.slice(1, 4).map((item) => <Marker key={item.id} coordinate={{ latitude: item.latitude, longitude: item.longitude }} title="رصد مؤكد سابق" pinColor={PRIMARY} />)}
            {pending.map((item) => <Marker key={`pending-${item.id}`} coordinate={{ latitude: item.latitude, longitude: item.longitude }} title="رصد أولي ينتظر التأكيد" pinColor="#D98E04" />)}
          </MapView>

          <View style={styles.floatingActions}>
            <Pressable style={styles.floatingButton} onPress={focusServiceArea}><Ionicons name="map" size={19} color={PRIMARY} /><Text style={styles.floatingText}>الحي</Text></Pressable>
            <Pressable style={styles.floatingButton} onPress={cycleMapType}><Ionicons name="layers" size={19} color={PRIMARY} /><Text style={styles.floatingText}>الطبقات</Text></Pressable>
            {latest && <Pressable style={[styles.floatingButton, styles.floatingButtonPrimary]} onPress={focusTruck}><Ionicons name="locate" size={19} color="#FFFFFF" /><Text style={styles.floatingTextPrimary}>الشاحنة</Text></Pressable>}
          </View>

          {pendingLatest && !latest && (
            <View style={styles.pendingCard}>
              <Text style={styles.pendingBadge}>رصد أولي – في انتظار التأكيد</Text>
              <Text style={styles.pendingTitle}>بلاغ قريب في {displayNeighborhood(pendingLatest.neighborhood)}</Text>
              <Pressable style={styles.confirmButton} disabled={confirmingId === pendingLatest.id} onPress={() => confirmSighting(pendingLatest)}>
                <Text style={styles.confirmButtonText}>{confirmingId === pendingLatest.id ? 'جارٍ التحقق من موقعك...' : 'نعم، أرى الشاحنة أيضًا'}</Text>
              </Pressable>
            </View>
          )}

          {latest && (
            <View style={styles.liveCard}>
              <View style={styles.liveTopRow}>
                <View style={styles.liveIcon}><Text style={styles.liveTruckEmoji}>🚛</Text></View>
                <View style={styles.liveTextWrap}>
                  <Text style={styles.liveTitle}>شاحنة النظافة قريبة</Text>
                  <Text style={styles.liveNeighborhood}>{latestPlace ?? displayNeighborhood(latest.neighborhood)}</Text>
                </View>
                <View style={styles.confirmedBadge}><Text style={styles.confirmedBadgeText}>مرور مؤكد</Text></View>
              </View>
              <View style={styles.liveBottomRow}>
                <Text style={styles.liveTime}>آخر تأكيد {relativeAge(latest.confirmed_at ?? latest.created_at)}</Text>
                <Pressable style={styles.showTruckButton} onPress={focusTruck}><Text style={styles.showTruckText}>عرض الموقع</Text><Ionicons name="navigate" size={16} color="#FFFFFF" /></Pressable>
              </View>
            </View>
          )}

          {!latest && !pendingLatest && <View style={styles.emptyCard}><Text style={styles.emptyTitle}>لا يوجد رصد مؤكد حاليًا</Text><Text style={styles.emptyText}>عند تأكيد مرور الشاحنة سيظهر موقعها المتوهج على الطريق أو قرب أقرب معلم معروف.</Text></View>}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LIGHT },
  header: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 10, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', backgroundColor: LIGHT },
  title: { fontSize: 27, fontWeight: '900', color: DARK, textAlign: 'right' },
  sub: { textAlign: 'right', color: '#6B7A73', marginTop: 4, fontSize: 12 },
  refresh: { backgroundColor: '#EAF7F0', borderRadius: 14, paddingHorizontal: 13, paddingVertical: 9, flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  refreshText: { color: PRIMARY, fontWeight: '900' },
  mapShell: { flex: 1, position: 'relative', overflow: 'hidden' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 12 },
  muted: { color: '#6B7A73', textAlign: 'center', lineHeight: 22 },
  errorTitle: { fontSize: 20, fontWeight: '900', color: '#9B2C2C', textAlign: 'center' },
  retry: { backgroundColor: PRIMARY, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, marginTop: 6 },
  retryText: { color: '#fff', fontWeight: '900' },
  floatingActions: { position: 'absolute', top: 14, left: 12, gap: 8 },
  floatingButton: { minWidth: 80, height: 42, paddingHorizontal: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.97)', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: '#DCE7E1', elevation: 4 },
  floatingButtonPrimary: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  floatingText: { color: PRIMARY, fontWeight: '900', fontSize: 12 },
  floatingTextPrimary: { color: '#fff', fontWeight: '900', fontSize: 12 },
  truckMarkerWrap: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  pulseRing: { position: 'absolute', width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(22,138,85,0.28)', borderWidth: 1, borderColor: 'rgba(22,138,85,0.5)' },
  truckMarkerCore: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: PRIMARY, elevation: 7, shadowColor: PRIMARY, shadowOpacity: 0.35, shadowRadius: 9 },
  truckEmoji: { fontSize: 28 },
  liveCard: { position: 'absolute', left: 12, right: 12, bottom: 12, backgroundColor: 'rgba(255,255,255,0.98)', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: '#DCE7E1', elevation: 8 },
  liveTopRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  liveIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#EAF7F0', alignItems: 'center', justifyContent: 'center' },
  liveTruckEmoji: { fontSize: 22 },
  liveTextWrap: { flex: 1 },
  liveTitle: { textAlign: 'right', fontSize: 16, fontWeight: '900', color: DARK },
  liveNeighborhood: { textAlign: 'right', color: '#45665A', marginTop: 3, lineHeight: 19 },
  confirmedBadge: { backgroundColor: '#EAF7F0', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 6 },
  confirmedBadgeText: { color: PRIMARY, fontWeight: '900', fontSize: 11 },
  liveBottomRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  liveTime: { color: '#6B7A73', fontSize: 12 },
  showTruckButton: { backgroundColor: PRIMARY, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row-reverse', alignItems: 'center', gap: 5 },
  showTruckText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  pendingCard: { position: 'absolute', left: 12, right: 12, bottom: 12, backgroundColor: '#FFF9EA', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: '#F0D89A', elevation: 6 },
  pendingBadge: { color: '#9A6500', fontWeight: '900', textAlign: 'right', fontSize: 12 },
  pendingTitle: { textAlign: 'right', fontWeight: '900', fontSize: 16, color: '#6E4D00', marginTop: 5 },
  confirmButton: { backgroundColor: '#D98E04', borderRadius: 12, padding: 12, marginTop: 10 },
  confirmButtonText: { color: '#fff', fontWeight: '900', textAlign: 'center' },
  emptyCard: { position: 'absolute', left: 12, right: 12, bottom: 12, backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#DCE7E1' },
  emptyTitle: { textAlign: 'right', fontWeight: '900', fontSize: 16, color: DARK },
  emptyText: { textAlign: 'right', color: '#6B7A73', lineHeight: 20, marginTop: 4 },
});
