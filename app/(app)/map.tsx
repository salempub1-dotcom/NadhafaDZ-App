import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
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

export default function MapScreen() {
  const { neighborhood } = useNeighborhood();
  const [items, setItems] = useState<TruckFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: rpcError } = await supabase.rpc('recent_truck_feed', {
      target_neighborhood: neighborhood,
    });

    if (rpcError) {
      setError(rpcError.message);
      setItems([]);
    } else {
      setItems((data ?? []) as TruckFeedItem[]);
    }

    setLoading(false);
  }, [neighborhood]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const latest = items[0];

  const region = useMemo(() => ({
    latitude: latest?.latitude ?? 36.666,
    longitude: latest?.longitude ?? 3.096,
    latitudeDelta: latest ? 0.012 : 0.06,
    longitudeDelta: latest ? 0.012 : 0.06,
  }), [latest]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>الخريطة الحية</Text>
          <Text style={styles.sub}>حي {neighborhood} • آخر البلاغات المؤكدة</Text>
        </View>
        <Pressable style={styles.refresh} onPress={loadFeed} disabled={loading}>
          <Text style={styles.refreshText}>{loading ? '...' : 'تحديث'}</Text>
        </Pressable>
      </View>

      {loading && !latest ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#168A55" /><Text style={styles.muted}>جارٍ تحميل آخر رصد مؤكد...</Text></View>
      ) : error ? (
        <View style={styles.center}><Text style={styles.errorTitle}>تعذر تحميل الخريطة</Text><Text style={styles.muted}>{error}</Text><Pressable style={styles.retry} onPress={loadFeed}><Text style={styles.retryText}>إعادة المحاولة</Text></Pressable></View>
      ) : (
        <>
          <MapView style={styles.map} region={region}>
            {items.map((item, index) => (
              <Marker
                key={item.id}
                coordinate={{ latitude: item.latitude, longitude: item.longitude }}
                title={index === 0 ? 'آخر رصد مؤكد للشاحنة' : 'رصد مؤكد سابق'}
                description={`حي ${item.neighborhood}`}
              />
            ))}
          </MapView>

          <View style={styles.infoCard}>
            {latest ? (
              <>
                <Text style={styles.infoTitle}>تم رصد الشاحنة مؤخرًا</Text>
                <Text style={styles.infoText}>آخر تأكيد: {new Date(latest.confirmed_at ?? latest.created_at).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}</Text>
                <Text style={styles.infoText}>الموقع المعروض هو موقع الشاحنة المبلّغ عنه، ولا تظهر هوية المبلّغ للسكان.</Text>
              </>
            ) : (
              <>
                <Text style={styles.infoTitle}>لا يوجد رصد مؤكد حاليًا</Text>
                <Text style={styles.infoText}>عند تأكيد مرور الشاحنة من مستخدم آخر سيظهر آخر موقع مؤكد هنا لمدة ساعتين.</Text>
              </>
            )}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5FAF7' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '900', color: '#17352A', textAlign: 'right' },
  sub: { textAlign: 'right', color: '#6B7A73', marginTop: 5 },
  refresh: { backgroundColor: '#EAF7F0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  refreshText: { color: '#168A55', fontWeight: '900' },
  map: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 12 },
  muted: { color: '#6B7A73', textAlign: 'center', lineHeight: 22 },
  errorTitle: { fontSize: 20, fontWeight: '900', color: '#9B2C2C', textAlign: 'center' },
  retry: { backgroundColor: '#168A55', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, marginTop: 6 },
  retryText: { color: '#fff', fontWeight: '900' },
  infoCard: { backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#DCE7E1', padding: 18 },
  infoTitle: { textAlign: 'right', fontWeight: '900', fontSize: 17, color: '#17352A' },
  infoText: { textAlign: 'right', color: '#6B7A73', lineHeight: 21, marginTop: 5 },
});
