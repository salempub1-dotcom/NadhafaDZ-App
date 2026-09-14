import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import MapView, { Marker, Polygon, type LatLng } from 'react-native-maps';
import * as Location from 'expo-location';
import Ionicons from '@react-native-vector-icons/ionicons';
import { supabase } from '@/lib/supabase';
import { useNeighborhood } from '@/contexts/NeighborhoodContext';

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

type LocalAnchor = LatLng & { key: string; label: string };

const PRIMARY = '#168A55';
const DARK = '#17352A';
const LIGHT = '#F5FAF7';
const NEIGHBORHOODS = ['بن يوب', 'العميرات'] as const;

// Verified map anchor for Cité Benyoub (M438+MR8, Baraki).
// Other locality anchors are resolved at runtime with the Android geocoder so we do not invent coordinates.
const BEN_YOUB_ANCHOR: LocalAnchor = {
  key: 'ben-youb',
  label: 'حي بن يوب',
  latitude: 36.6541875,
  longitude: 3.1170625,
};

// Publicly mapped Baraki landmarks around the local service corridor. These are only safe fallback
// points if Android geocoding cannot resolve the requested school / El Omirat names.
const FALLBACK_SERVICE_POINTS: LocalAnchor[] = [
  { key: 'west-fallback', label: 'براقي - غرب نطاق الخدمة', latitude: 36.6540625, longitude: 3.1003125 },
  { key: 'north-fallback', label: 'براقي - شمال نطاق الخدمة', latitude: 36.6699375, longitude: 3.1050625 },
  BEN_YOUB_ANCHOR,
];

const DEFAULT_REGION = {
  latitude: 36.6618,
  longitude: 3.109,
  latitudeDelta: 0.023,
  longitudeDelta: 0.023,
};

const hasGoogleMapsKey = Boolean(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY);

function validPoint(lat: unknown, lon: unknown) {
  return (
    typeof lat === 'number' &&
    Number.isFinite(lat) &&
    lat >= -90 &&
    lat <= 90 &&
    typeof lon === 'number' &&
    Number.isFinite(lon) &&
    lon >= -180 &&
    lon <= 180
  );
}

function distanceKm(a: LatLng, b: LatLng) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function ageMinutes(date: string | null | undefined) {
  if (!date) return null;
  const value = new Date(date).getTime();
  if (!Number.isFinite(value)) return null;
  return Math.max(0, Math.floor((Date.now() - value) / 60000));
}

function relativeAge(date: string | null | undefined) {
  const minutes = ageMinutes(date);
  if (minutes === null) return 'الآن';
  if (minutes < 1) return 'الآن';
  if (minutes === 1) return 'منذ دقيقة';
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  return hours === 1 ? 'منذ ساعة' : `منذ ${hours} ساعات`;
}

function boundsFromPoints(points: LatLng[]) {
  if (!points.length) return null;
  let minLat = points[0].latitude;
  let maxLat = points[0].latitude;
  let minLon = points[0].longitude;
  let maxLon = points[0].longitude;
  for (const p of points.slice(1)) {
    minLat = Math.min(minLat, p.latitude);
    maxLat = Math.max(maxLat, p.latitude);
    minLon = Math.min(minLon, p.longitude);
    maxLon = Math.max(maxLon, p.longitude);
  }
  const latPad = Math.max((maxLat - minLat) * 0.18, 0.0018);
  const lonPad = Math.max((maxLon - minLon) * 0.18, 0.0018);
  return {
    northEast: { latitude: maxLat + latPad, longitude: maxLon + lonPad },
    southWest: { latitude: minLat - latPad, longitude: minLon - lonPad },
  };
}

function servicePolygon(points: LatLng[]) {
  const bounds = boundsFromPoints(points);
  if (!bounds) return [];
  const { northEast, southWest } = bounds;
  return [
    { latitude: southWest.latitude, longitude: southWest.longitude },
    { latitude: northEast.latitude, longitude: southWest.longitude },
    { latitude: northEast.latitude, longitude: northEast.longitude },
    { latitude: southWest.latitude, longitude: northEast.longitude },
  ];
}

async function geocodeFirstNearby(query: string, key: string, label: string): Promise<LocalAnchor | null> {
  try {
    const results = await Location.geocodeAsync(query);
    const nearby = results.find(
      (item) => validPoint(item.latitude, item.longitude) && distanceKm(BEN_YOUB_ANCHOR, item) <= 6,
    );
    if (!nearby) return null;
    return { key, label, latitude: nearby.latitude, longitude: nearby.longitude };
  } catch {
    return null;
  }
}

function TruckPulseMarker({ coordinate }: { coordinate: LatLng }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.8, 2.05] });
  const opacity = pulse.interpolate({ inputRange: [0, 0.65, 1], outputRange: [0.48, 0.2, 0] });

  return (
    <Marker coordinate={coordinate} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges>
      <View style={styles.truckMarkerWrap}>
        <Animated.View style={[styles.pulseRing, { opacity, transform: [{ scale }] }]} />
        <View style={styles.truckMarkerCore}>
          <Ionicons name="trash-bin" size={25} color={PRIMARY} />
        </View>
      </View>
    </Marker>
  );
}

export default function MapScreen() {
  const { neighborhood } = useNeighborhood();
  const mapRef = useRef<MapView | null>(null);
  const [items, setItems] = useState<TruckFeedItem[]>([]);
  const [pending, setPending] = useState<PendingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [anchors, setAnchors] = useState<LocalAnchor[]>([BEN_YOUB_ANCHOR]);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError(null);

    const results = await Promise.all(
      NEIGHBORHOODS.map(async (target) => {
        const [confirmedResult, pendingResult] = await Promise.all([
          supabase.rpc('recent_truck_feed', { target_neighborhood: target }),
          supabase.rpc('recent_pending_truck_reports', { target_neighborhood: target }),
        ]);
        return { target, confirmedResult, pendingResult };
      }),
    );

    const confirmed: TruckFeedItem[] = [];
    const pendingRows: PendingReport[] = [];
    const errors: string[] = [];

    for (const result of results) {
      if (result.confirmedResult.error) errors.push(result.confirmedResult.error.message);
      else {
        confirmed.push(
          ...((result.confirmedResult.data ?? []) as TruckFeedItem[]).filter((x) =>
            validPoint(x.latitude, x.longitude),
          ),
        );
      }
      if (!result.pendingResult.error) {
        pendingRows.push(
          ...((result.pendingResult.data ?? []) as PendingReport[]).filter((x) =>
            validPoint(x.latitude, x.longitude),
          ),
        );
      }
    }

    confirmed.sort((a, b) => new Date(b.confirmed_at ?? b.created_at).getTime() - new Date(a.confirmed_at ?? a.created_at).getTime());
    pendingRows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setItems(confirmed);
    setPending(pendingRows);
    setError(errors.length === NEIGHBORHOODS.length ? errors[0] : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [school, elOmirat, benYoub] = await Promise.all([
        geocodeFirstNearby(
          'École Primaire 1 Novembre 1954, Lafluid, Baraki, Alger, Algeria',
          'school-1-nov-1954',
          'مدرسة 1 نوفمبر 1954',
        ),
        geocodeFirstNearby('حي العميرات، براقي، الجزائر', 'el-omirat', 'حي العميرات'),
        geocodeFirstNearby('Cité Benyoub, Baraki, Algeria', 'ben-youb-geocoded', 'حي بن يوب'),
      ]);
      if (!alive) return;

      const resolved = [school, elOmirat, benYoub, BEN_YOUB_ANCHOR].filter(Boolean) as LocalAnchor[];
      const unique: LocalAnchor[] = [];
      for (const point of resolved) {
        if (!unique.some((u) => distanceKm(u, point) < 0.06)) unique.push(point);
      }
      setAnchors(unique.length >= 2 ? unique : FALLBACK_SERVICE_POINTS);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const servicePoints = anchors.length >= 2 ? anchors : FALLBACK_SERVICE_POINTS;
  const polygon = useMemo(() => servicePolygon(servicePoints), [servicePoints]);
  const latest = items[0];
  const pendingLatest = pending[0];

  const focusServiceArea = useCallback(() => {
    if (!mapReady || !mapRef.current) return;
    mapRef.current.fitToCoordinates(servicePoints, {
      edgePadding: { top: 70, right: 45, bottom: 150, left: 45 },
      animated: true,
    });
  }, [mapReady, servicePoints]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const bounds = boundsFromPoints(servicePoints);
    if (bounds) {
      const map = mapRef.current as MapView & {
        setMapBoundaries?: (northEast: LatLng, southWest: LatLng) => void;
      };
      map.setMapBoundaries?.(bounds.northEast, bounds.southWest);
    }
    const timeout = setTimeout(focusServiceArea, 250);
    return () => clearTimeout(timeout);
  }, [focusServiceArea, mapReady, servicePoints]);

  const focusTruck = useCallback(() => {
    if (!mapReady || !mapRef.current || !latest || !validPoint(latest.latitude, latest.longitude)) return;
    mapRef.current.animateCamera(
      {
        center: { latitude: latest.latitude, longitude: latest.longitude },
        zoom: 17.5,
      },
      { duration: 650 },
    );
  }, [latest, mapReady]);

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
      const { error: notifyError } = await supabase.functions.invoke('notify-neighborhood', {
        body: { report_id: report.id },
      });
      if (notifyError) console.warn('Push notification dispatch failed:', notifyError.message);
      Alert.alert('تم التأكيد', 'شكرًا. أصبح هذا الرصد مؤكدًا وسيظهر لسكان الحي.');
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
          <Text style={styles.sub}>حي العميرات • حي بن يوب</Text>
        </View>
        <Pressable style={styles.refresh} onPress={loadFeed} disabled={loading}>
          <Ionicons name="refresh" size={18} color={PRIMARY} />
          <Text style={styles.refreshText}>{loading ? '...' : 'تحديث'}</Text>
        </Pressable>
      </View>

      {loading && !latest && !pendingLatest ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.muted}>جارٍ تحميل الرصد...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorTitle}>تعذر تحميل بيانات الخريطة</Text>
          <Text style={styles.muted}>{error}</Text>
          <Pressable style={styles.retry} onPress={loadFeed}>
            <Text style={styles.retryText}>إعادة المحاولة</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.mapShell}>
          {hasGoogleMapsKey ? (
            <MapView
              ref={mapRef}
              style={StyleSheet.absoluteFill}
              initialRegion={DEFAULT_REGION}
              minZoomLevel={14.3}
              maxZoomLevel={20}
              mapType="standard"
              showsBuildings
              showsPointsOfInterest
              showsTraffic={false}
              toolbarEnabled={false}
              onMapReady={() => setMapReady(true)}
              mapPadding={{ top: 12, right: 8, bottom: 105, left: 8 }}
            >
              {polygon.length >= 4 && (
                <Polygon
                  coordinates={polygon}
                  strokeColor="rgba(22,138,85,0.55)"
                  fillColor="rgba(22,138,85,0.055)"
                  strokeWidth={2}
                />
              )}

              {anchors.map((anchor) => (
                <Marker
                  key={anchor.key}
                  coordinate={{ latitude: anchor.latitude, longitude: anchor.longitude }}
                  title={anchor.label}
                  pinColor="#6E8F82"
                />
              ))}

              {latest && (
                <TruckPulseMarker coordinate={{ latitude: latest.latitude, longitude: latest.longitude }} />
              )}

              {items.slice(1, 5).map((item) => (
                <Marker
                  key={item.id}
                  coordinate={{ latitude: item.latitude, longitude: item.longitude }}
                  title="رصد مؤكد سابق"
                  description={`حي ${item.neighborhood}`}
                  pinColor={PRIMARY}
                />
              ))}

              {pending.map((item) => (
                <Marker
                  key={`pending-${item.id}`}
                  coordinate={{ latitude: item.latitude, longitude: item.longitude }}
                  title="رصد أولي ينتظر التأكيد"
                  description={`حي ${item.neighborhood}`}
                  pinColor="#D98E04"
                />
              ))}
            </MapView>
          ) : (
            <View style={styles.mapFallback}>
              <Text style={styles.mapEmoji}>🗺️</Text>
              <Text style={styles.mapFallbackTitle}>الخريطة جاهزة للربط</Text>
              <Text style={styles.mapFallbackText}>يجب تضمين مفتاح Google Maps في نسخة Android.</Text>
            </View>
          )}

          {hasGoogleMapsKey && (
            <View style={styles.floatingActions}>
              <Pressable style={styles.floatingButton} onPress={focusServiceArea}>
                <Ionicons name="map" size={19} color={PRIMARY} />
                <Text style={styles.floatingText}>الحي</Text>
              </Pressable>
              {latest && (
                <Pressable style={[styles.floatingButton, styles.floatingButtonPrimary]} onPress={focusTruck}>
                  <Ionicons name="locate" size={19} color="#FFFFFF" />
                  <Text style={styles.floatingTextPrimary}>الشاحنة</Text>
                </Pressable>
              )}
            </View>
          )}

          {pendingLatest && !latest && (
            <View style={styles.pendingCard}>
              <Text style={styles.pendingBadge}>رصد أولي – في انتظار التأكيد</Text>
              <Text style={styles.pendingTitle}>بلاغ قريب في حي {pendingLatest.neighborhood}</Text>
              <Pressable
                style={styles.confirmButton}
                disabled={confirmingId === pendingLatest.id}
                onPress={() => confirmSighting(pendingLatest)}
              >
                <Text style={styles.confirmButtonText}>
                  {confirmingId === pendingLatest.id ? 'جارٍ التحقق من موقعك...' : 'نعم، أرى الشاحنة أيضًا'}
                </Text>
              </Pressable>
            </View>
          )}

          {latest && (
            <View style={styles.liveCard}>
              <View style={styles.liveTopRow}>
                <View style={styles.liveIcon}>
                  <Ionicons name="trash-bin" size={22} color={PRIMARY} />
                </View>
                <View style={styles.liveTextWrap}>
                  <Text style={styles.liveTitle}>شاحنة النظافة قريبة</Text>
                  <Text style={styles.liveNeighborhood}>حي {latest.neighborhood}</Text>
                </View>
                <View style={styles.confirmedBadge}>
                  <Text style={styles.confirmedBadgeText}>مرور مؤكد</Text>
                </View>
              </View>
              <View style={styles.liveBottomRow}>
                <Text style={styles.liveTime}>آخر تأكيد {relativeAge(latest.confirmed_at ?? latest.created_at)}</Text>
                <Pressable style={styles.showTruckButton} onPress={focusTruck}>
                  <Text style={styles.showTruckText}>عرض الموقع</Text>
                  <Ionicons name="navigate" size={16} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
          )}

          {!latest && !pendingLatest && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>لا يوجد رصد مؤكد حاليًا</Text>
              <Text style={styles.emptyText}>عند تأكيد مرور الشاحنة سيظهر موقعها المتوهج هنا.</Text>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LIGHT },
  header: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 10,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: LIGHT,
  },
  title: { fontSize: 27, fontWeight: '900', color: DARK, textAlign: 'right' },
  sub: { textAlign: 'right', color: '#6B7A73', marginTop: 4 },
  refresh: {
    backgroundColor: '#EAF7F0',
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 9,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  refreshText: { color: PRIMARY, fontWeight: '900' },
  mapShell: { flex: 1, position: 'relative', overflow: 'hidden' },
  mapFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, backgroundColor: '#EAF7F0' },
  mapEmoji: { fontSize: 56 },
  mapFallbackTitle: { fontSize: 21, fontWeight: '900', color: DARK, marginTop: 12 },
  mapFallbackText: { textAlign: 'center', color: '#6B7A73', lineHeight: 22, marginTop: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 12 },
  muted: { color: '#6B7A73', textAlign: 'center', lineHeight: 22 },
  errorTitle: { fontSize: 20, fontWeight: '900', color: '#9B2C2C', textAlign: 'center' },
  retry: { backgroundColor: PRIMARY, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, marginTop: 6 },
  retryText: { color: '#fff', fontWeight: '900' },
  floatingActions: { position: 'absolute', top: 14, left: 12, gap: 8 },
  floatingButton: {
    minWidth: 72,
    height: 42,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.97)',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#DCE7E1',
    elevation: 4,
  },
  floatingButtonPrimary: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  floatingText: { color: PRIMARY, fontWeight: '900', fontSize: 12 },
  floatingTextPrimary: { color: '#fff', fontWeight: '900', fontSize: 12 },
  truckMarkerWrap: { width: 66, height: 66, alignItems: 'center', justifyContent: 'center' },
  pulseRing: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(22,138,85,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(22,138,85,0.45)',
  },
  truckMarkerCore: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: PRIMARY,
    elevation: 7,
    shadowColor: PRIMARY,
    shadowOpacity: 0.35,
    shadowRadius: 9,
  },
  liveCard: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DCE7E1',
    elevation: 8,
  },
  liveTopRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  liveIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#EAF7F0', alignItems: 'center', justifyContent: 'center' },
  liveTextWrap: { flex: 1 },
  liveTitle: { textAlign: 'right', fontSize: 16, fontWeight: '900', color: DARK },
  liveNeighborhood: { textAlign: 'right', color: '#6B7A73', marginTop: 2 },
  confirmedBadge: { backgroundColor: '#EAF7F0', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 6 },
  confirmedBadgeText: { color: PRIMARY, fontWeight: '900', fontSize: 11 },
  liveBottomRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  liveTime: { color: '#6B7A73', fontSize: 12 },
  showTruckButton: { backgroundColor: PRIMARY, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row-reverse', alignItems: 'center', gap: 5 },
  showTruckText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  pendingCard: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: '#FFF9EA',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F0D89A',
    elevation: 6,
  },
  pendingBadge: { color: '#9A6500', fontWeight: '900', textAlign: 'right', fontSize: 12 },
  pendingTitle: { textAlign: 'right', fontWeight: '900', fontSize: 16, color: '#6E4D00', marginTop: 5 },
  confirmButton: { backgroundColor: '#D98E04', borderRadius: 12, padding: 12, marginTop: 10 },
  confirmButtonText: { color: '#fff', fontWeight: '900', textAlign: 'center' },
  emptyCard: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DCE7E1',
  },
  emptyTitle: { textAlign: 'right', fontWeight: '900', fontSize: 16, color: DARK },
  emptyText: { textAlign: 'right', color: '#6B7A73', lineHeight: 20, marginTop: 4 },
});
