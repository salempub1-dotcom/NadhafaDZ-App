import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, type LatLng } from 'react-native-maps';
import * as Location from 'expo-location';
import Ionicons from '@react-native-vector-icons/ionicons';
import { supabase } from '@/lib/supabase';
import { proximityLabel, SERVICE_LANDMARKS } from '@/lib/landmarks';

const PRIMARY = '#008B4C';
const DARK = '#073C32';
const WARNING = '#D98E04';
const STALE = '#6B7280';
const REFERENCE = '#2F80ED';
const NEIGHBORHOODS = ['بن يوب', 'العميرات'] as const;
const AUTO_REFRESH_MS = 30_000;
const SERVICE_START: LatLng = { latitude: 36.65164, longitude: 3.108959 };

const DEFAULT_REGION = {
  latitude: SERVICE_START.latitude,
  longitude: SERVICE_START.longitude,
  latitudeDelta: 0.0075,
  longitudeDelta: 0.012,
};

type LivePoint = {
  report_id: string;
  session_id: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  sighting_kind: string;
  confirmed_at: string;
  session_started_at: string;
  session_last_sighting_at: string;
  sightings_count: number;
};

type PendingReport = {
  id: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  created_at: string;
};

type MapKind = 'standard' | 'satellite' | 'hybrid';
type Freshness = 'fresh' | 'recent' | 'old';

function validPoint(lat: unknown, lon: unknown) {
  return typeof lat === 'number' && Number.isFinite(lat) && typeof lon === 'number' && Number.isFinite(lon);
}
function minutesSince(value?: string | null) {
  if (!value) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
}
function relativeAge(value?: string | null) {
  const minutes = minutesSince(value);
  if (minutes < 1) return 'الآن';
  if (minutes === 1) return 'منذ دقيقة';
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  return `منذ ${Math.floor(minutes / 60)} ساعة`;
}
function freshnessFor(value?: string | null): Freshness {
  const minutes = minutesSince(value);
  if (minutes <= 10) return 'fresh';
  if (minutes <= 20) return 'recent';
  return 'old';
}
function freshnessColor(freshness: Freshness) {
  return freshness === 'fresh' ? PRIMARY : freshness === 'recent' ? WARNING : STALE;
}
function displayNeighborhood(value: string) {
  return value === 'العميرات' ? 'الحوش' : value === 'بن يوب' ? 'حي بن يوب' : value;
}

function TruckPulseMarker({ point }: { point: LivePoint }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const freshness = freshnessFor(point.confirmed_at);
  const color = freshnessColor(freshness);
  const place = proximityLabel(point.latitude, point.longitude) ?? displayNeighborhood(point.neighborhood);

  useEffect(() => {
    pulse.setValue(0);
    const animation = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1150, useNativeDriver: true }));
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.85, 2.35] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });

  return (
    <Marker
      coordinate={{ latitude: point.latitude, longitude: point.longitude }}
      anchor={{ x: 0.5, y: 0.5 }}
      title="آخر موقع مؤكد للشاحنة"
      description={`${place} • ${relativeAge(point.confirmed_at)}`}
      zIndex={50}
    >
      <View style={styles.truckMarkerWrap}>
        <Animated.View style={[styles.pulseRing, { borderColor: color, opacity, transform: [{ scale }] }]} />
        <View style={[styles.truckMarkerCore, { borderColor: color }]}>
          <Ionicons name="bus" size={27} color={color} />
          <View style={[styles.trashBadge, { backgroundColor: color }]}><Ionicons name="trash-bin" size={10} color="#fff" /></View>
        </View>
      </View>
    </Marker>
  );
}

export default function MapScreen() {
  const mapRef = useRef<MapView | null>(null);
  const [livePoints, setLivePoints] = useState<LivePoint[]>([]);
  const [pending, setPending] = useState<PendingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapType, setMapType] = useState<MapKind>('standard');

  const latest = livePoints[0] ?? null;
  const routePoints = useMemo(
    () => [...livePoints].reverse().map((x) => ({ latitude: x.latitude, longitude: x.longitude })),
    [livePoints],
  );
  const serviceViewPoints = useMemo(
    () => SERVICE_LANDMARKS.filter((x) => validPoint(x.latitude, x.longitude)).map((x) => ({ latitude: x.latitude, longitude: x.longitude })),
    [],
  );

  const loadFeed = useCallback(async () => {
    setLoading(true);
    const results = await Promise.all(NEIGHBORHOODS.map(async (target) => {
      const [live, pendingResult] = await Promise.all([
        supabase.rpc('live_truck_session_feed', { target_neighborhood: target }),
        supabase.rpc('recent_pending_truck_reports', { target_neighborhood: target }),
      ]);
      return { live, pendingResult };
    }));

    const points: LivePoint[] = [];
    const pendingRows: PendingReport[] = [];
    for (const result of results) {
      if (!result.live.error) points.push(...((result.live.data ?? []) as LivePoint[]).filter((x) => validPoint(x.latitude, x.longitude)));
      if (!result.pendingResult.error) pendingRows.push(...((result.pendingResult.data ?? []) as PendingReport[]).filter((x) => validPoint(x.latitude, x.longitude)));
    }
    points.sort((a, b) => new Date(b.confirmed_at).getTime() - new Date(a.confirmed_at).getTime());
    pendingRows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setLivePoints(points);
    setPending(pendingRows);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadFeed();
    const interval = setInterval(() => void loadFeed(), AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, [loadFeed]);

  const focusServiceArea = useCallback(() => {
    if (!mapReady || !mapRef.current) return;
    mapRef.current.fitToCoordinates(serviceViewPoints, { edgePadding: { top: 60, right: 36, bottom: 170, left: 36 }, animated: true });
  }, [mapReady, serviceViewPoints]);

  const focusTruck = useCallback(() => {
    if (!mapReady || !mapRef.current || !latest) return;
    mapRef.current.animateCamera({ center: { latitude: latest.latitude, longitude: latest.longitude }, zoom: 18 }, { duration: 650 });
  }, [latest, mapReady]);

  async function confirmSighting(report: PendingReport) {
    setConfirmingId(report.id);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('الموقع مطلوب', 'نحتاج موقعك فقط للتحقق أنك قريب من مكان الرصد قبل التأكيد.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { error } = await supabase.rpc('confirm_truck_report', {
        target_report: report.id,
        confirmer_lat: pos.coords.latitude,
        confirmer_lon: pos.coords.longitude,
      });
      if (error) throw error;

      const { error: notifyError } = await supabase.functions.invoke('notify-neighborhood', { body: { report_id: report.id } });
      if (notifyError) console.warn('Push notification dispatch failed:', notifyError.message);

      Alert.alert('بدأ الرصد الحي', 'تم تأكيد الشاحنة من شخصين. أصبح هذا الرصد بداية جلسة حية وستظهر المشاهدات التالية كنقاط حركة على الخريطة.');
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
          <Text style={styles.sub}>{latest ? `${latest.sightings_count} مشاهدات في الجلسة الحالية` : 'المفترق الرئيسي • الحوش • حي بن يوب'}</Text>
        </View>
        <Pressable style={styles.refresh} onPress={() => void loadFeed()} disabled={loading}>
          <Ionicons name="refresh" size={18} color={PRIMARY} />
          <Text style={styles.refreshText}>{loading ? '...' : 'تحديث'}</Text>
        </Pressable>
      </View>

      <View style={styles.mapShell}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={DEFAULT_REGION}
          minZoomLevel={15}
          maxZoomLevel={20}
          mapType={mapType}
          showsBuildings
          showsPointsOfInterests
          toolbarEnabled={false}
          onMapReady={() => setMapReady(true)}
          mapPadding={{ top: 12, right: 8, bottom: 125, left: 8 }}
        >
          {SERVICE_LANDMARKS.map((landmark, index) => (
            <Marker
              key={`reference-${landmark.key}`}
              coordinate={{ latitude: landmark.latitude, longitude: landmark.longitude }}
              anchor={{ x: 0.5, y: 0.5 }}
              title={`نقطة مرجعية ${index + 1}`}
              description={`${landmark.name} • ${displayNeighborhood(landmark.neighborhood)}`}
              zIndex={10}
            >
              <View style={styles.referenceMarkerWrap}>
                <View style={[styles.referenceMarker, index === 0 && styles.referenceMarkerStart]}>
                  <Text style={styles.referenceMarkerText}>{index + 1}</Text>
                </View>
              </View>
            </Marker>
          ))}

          {routePoints.length >= 2 && (
            <Polyline coordinates={routePoints.slice(-6)} strokeColor={PRIMARY} strokeWidth={5} lineCap="round" lineJoin="round" />
          )}

          {livePoints.slice(1, 6).map((point, index) => (
            <Marker
              key={point.report_id}
              coordinate={{ latitude: point.latitude, longitude: point.longitude }}
              title={`رصد سابق ${index + 1}`}
              description={relativeAge(point.confirmed_at)}
              pinColor={freshnessColor(freshnessFor(point.confirmed_at))}
            />
          ))}

          {latest && <TruckPulseMarker point={latest} />}

          {pending.map((item) => (
            <Marker
              key={`pending-${item.id}`}
              coordinate={{ latitude: item.latitude, longitude: item.longitude }}
              title="رصد أولي ينتظر التأكيد"
              description="اقترب منه وأكّد فقط إذا رأيت الشاحنة فعلاً"
              pinColor={WARNING}
              onCalloutPress={() => void confirmSighting(item)}
            />
          ))}
        </MapView>

        {loading && <View style={styles.loadingChip}><ActivityIndicator color={PRIMARY} size="small" /><Text style={styles.loadingText}>تحديث الرصد...</Text></View>}

        <View style={styles.referenceLegend} pointerEvents="none">
          <View style={styles.referenceLegendDot} />
          <Text style={styles.referenceLegendText}>النقاط المرجعية الثابتة</Text>
        </View>

        <View style={styles.floatingActions}>
          <Pressable style={styles.floatingButton} onPress={focusServiceArea}><Ionicons name="map" size={19} color={PRIMARY} /><Text style={styles.floatingText}>الحي</Text></Pressable>
          <Pressable style={styles.floatingButton} onPress={() => setMapType((x) => x === 'standard' ? 'hybrid' : x === 'hybrid' ? 'satellite' : 'standard')}><Ionicons name="layers" size={19} color={PRIMARY} /><Text style={styles.floatingText}>الطبقات</Text></Pressable>
          {latest && <Pressable style={[styles.floatingButton, styles.floatingButtonPrimary]} onPress={focusTruck}><Ionicons name="locate" size={19} color="#fff" /><Text style={[styles.floatingText, { color: '#fff' }]}>الشاحنة</Text></Pressable>}
        </View>

        <View style={styles.bottomCard}>
          {latest ? (
            <>
              <View style={styles.liveRow}><View style={styles.liveDot} /><Text style={styles.bottomTitle}>الشاحنة داخل المنطقة الآن</Text></View>
              <Text style={styles.bottomText}>{proximityLabel(latest.latitude, latest.longitude) ?? displayNeighborhood(latest.neighborhood)} • آخر مشاهدة {relativeAge(latest.confirmed_at)}</Text>
              <Text style={styles.bottomMeta}>{latest.sightings_count} نقاط رصد مؤكدة في الجلسة الحالية</Text>
            </>
          ) : pending.length ? (
            <>
              <Text style={styles.bottomTitle}>يوجد رصد أولي ينتظر التأكيد</Text>
              <Text style={styles.bottomText}>اضغط على العلامة البرتقالية ثم أكّد فقط إذا كنت قريبًا ورأيت الشاحنة.</Text>
              {confirmingId && <ActivityIndicator color={PRIMARY} />}
            </>
          ) : (
            <>
              <Text style={styles.bottomTitle}>لا يوجد رصد حي حاليًا</Text>
              <Text style={styles.bottomText}>عند تأكيد الشاحنة من شخصين تبدأ جلسة حية وتظهر حركتها هنا.</Text>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5FAF7' },
  header: { paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: DARK, fontSize: 30, fontWeight: '900', textAlign: 'right' },
  sub: { color: '#6B7280', textAlign: 'right', marginTop: 3 },
  refresh: { minWidth: 86, height: 46, borderRadius: 16, backgroundColor: '#E8F5EE', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6 },
  refreshText: { color: PRIMARY, fontWeight: '900' },
  mapShell: { flex: 1, overflow: 'hidden' },
  loadingChip: { position: 'absolute', top: 14, alignSelf: 'center', backgroundColor: '#FFFFFFEE', borderRadius: 20, paddingHorizontal: 13, paddingVertical: 8, flexDirection: 'row-reverse', alignItems: 'center', gap: 7 },
  loadingText: { color: DARK, fontWeight: '800', fontSize: 12 },
  referenceLegend: { position: 'absolute', top: 16, right: 16, backgroundColor: '#FFFFFFEE', borderRadius: 18, paddingHorizontal: 11, paddingVertical: 8, flexDirection: 'row-reverse', alignItems: 'center', gap: 7, elevation: 2 },
  referenceLegendDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: REFERENCE },
  referenceLegendText: { color: DARK, fontSize: 11, fontWeight: '800' },
  floatingActions: { position: 'absolute', top: 18, left: 18, gap: 10 },
  floatingButton: { minWidth: 94, height: 48, borderRadius: 18, backgroundColor: '#FFFFFFEE', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 7, elevation: 3 },
  floatingButtonPrimary: { backgroundColor: PRIMARY },
  floatingText: { color: PRIMARY, fontWeight: '900' },
  bottomCard: { position: 'absolute', left: 18, right: 18, bottom: 20, backgroundColor: '#FFFFFFF2', borderRadius: 22, padding: 18, borderWidth: 1, borderColor: '#D7E5DD', elevation: 4 },
  liveRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: PRIMARY },
  bottomTitle: { color: DARK, fontWeight: '900', fontSize: 18, textAlign: 'right' },
  bottomText: { color: '#6B7280', textAlign: 'right', marginTop: 6, lineHeight: 20 },
  bottomMeta: { color: PRIMARY, textAlign: 'right', marginTop: 6, fontWeight: '800', fontSize: 12 },
  referenceMarkerWrap: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  referenceMarker: { width: 28, height: 28, borderRadius: 14, backgroundColor: REFERENCE, borderWidth: 3, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', elevation: 5 },
  referenceMarkerStart: { backgroundColor: PRIMARY },
  referenceMarkerText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  truckMarkerWrap: { width: 66, height: 66, alignItems: 'center', justifyContent: 'center' },
  pulseRing: { position: 'absolute', width: 48, height: 48, borderRadius: 24, borderWidth: 2, backgroundColor: '#008B4C20' },
  truckMarkerCore: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFFFFF', borderWidth: 3, alignItems: 'center', justifyContent: 'center', elevation: 6 },
  trashBadge: { position: 'absolute', right: -3, bottom: -2, width: 19, height: 19, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
});