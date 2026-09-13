import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import { useNeighborhood } from '@/contexts/NeighborhoodContext';

type TruckFeedItem = { id:string; neighborhood:string; latitude:number; longitude:number; status:string; created_at:string; confirmed_at:string|null };
type PendingReport = { id:string; neighborhood:string; latitude:number; longitude:number; created_at:string };

const DEFAULT_REGION = { latitude:36.666, longitude:3.096, latitudeDelta:0.06, longitudeDelta:0.06 };
const hasGoogleMapsKey = Boolean(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY);

function validPoint(lat: unknown, lon: unknown) {
  return typeof lat === 'number' && Number.isFinite(lat) && typeof lon === 'number' && Number.isFinite(lon);
}

export default function MapScreen() {
  const { neighborhood } = useNeighborhood();
  const [items,setItems] = useState<TruckFeedItem[]>([]);
  const [pending,setPending] = useState<PendingReport[]>([]);
  const [loading,setLoading] = useState(true);
  const [confirmingId,setConfirmingId] = useState<string|null>(null);
  const [error,setError] = useState<string|null>(null);

  const loadFeed = useCallback(async()=>{
    setLoading(true); setError(null);
    const [confirmedResult,pendingResult] = await Promise.all([
      supabase.rpc('recent_truck_feed',{target_neighborhood:neighborhood}),
      supabase.rpc('recent_pending_truck_reports',{target_neighborhood:neighborhood}),
    ]);
    if (confirmedResult.error) { setError(confirmedResult.error.message); setItems([]); }
    else setItems(((confirmedResult.data??[]) as TruckFeedItem[]).filter(x=>validPoint(x.latitude,x.longitude)));
    if (!pendingResult.error) setPending(((pendingResult.data??[]) as PendingReport[]).filter(x=>validPoint(x.latitude,x.longitude)));
    else setPending([]);
    setLoading(false);
  },[neighborhood]);

  useEffect(()=>{ loadFeed(); },[loadFeed]);

  async function confirmSighting(report:PendingReport){
    setConfirmingId(report.id);
    try{
      const {status}=await Location.requestForegroundPermissionsAsync();
      if(status!=='granted'){ Alert.alert('الموقع مطلوب','نحتاج موقعك فقط للتحقق أنك قريب من مكان الرصد قبل التأكيد.'); return; }
      const pos=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced});
      const {error:rpcError}=await supabase.rpc('confirm_truck_report',{target_report:report.id,confirmer_lat:pos.coords.latitude,confirmer_lon:pos.coords.longitude});
      if(rpcError) throw rpcError;
      const {error:notifyError}=await supabase.functions.invoke('notify-neighborhood',{body:{report_id:report.id}});
      if(notifyError) console.warn('Push notification dispatch failed:',notifyError.message);
      Alert.alert('تم التأكيد','شكرًا. أصبح هذا الرصد مؤكدًا وسيظهر لسكان الحي.');
      await loadFeed();
    }catch(e:any){ Alert.alert('تعذر تأكيد الرصد',e?.message??'حاول مرة أخرى.'); }
    finally{ setConfirmingId(null); }
  }

  const latest=items[0]; const pendingLatest=pending[0];
  const region=useMemo(()=>{
    const source=latest??pendingLatest;
    return source&&validPoint(source.latitude,source.longitude)
      ? {latitude:source.latitude,longitude:source.longitude,latitudeDelta:0.012,longitudeDelta:0.012}
      : DEFAULT_REGION;
  },[latest,pendingLatest]);

  return <SafeAreaView style={styles.safe}>
    <View style={styles.header}><View><Text style={styles.title}>الخريطة الحية</Text><Text style={styles.sub}>حي {neighborhood} • البلاغات الحديثة</Text></View><Pressable style={styles.refresh} onPress={loadFeed} disabled={loading}><Text style={styles.refreshText}>{loading?'...':'تحديث'}</Text></Pressable></View>
    {loading&&!latest&&!pendingLatest ? <View style={styles.center}><ActivityIndicator size="large" color="#168A55"/><Text style={styles.muted}>جارٍ تحميل الرصد...</Text></View>
    : error ? <View style={styles.center}><Text style={styles.errorTitle}>تعذر تحميل بيانات الخريطة</Text><Text style={styles.muted}>{error}</Text><Pressable style={styles.retry} onPress={loadFeed}><Text style={styles.retryText}>إعادة المحاولة</Text></Pressable></View>
    : <>
      {hasGoogleMapsKey ? <MapView style={styles.map} initialRegion={region}>
        {items.map((item,index)=><Marker key={item.id} coordinate={{latitude:item.latitude,longitude:item.longitude}} title={index===0?'آخر رصد مؤكد للشاحنة':'رصد مؤكد سابق'} description={`حي ${item.neighborhood}`}/>) }
        {pending.map(item=><Marker key={`pending-${item.id}`} coordinate={{latitude:item.latitude,longitude:item.longitude}} title="رصد أولي ينتظر التأكيد" description={`حي ${item.neighborhood}`} pinColor="orange"/>) }
      </MapView> : <View style={styles.mapFallback}><Text style={styles.mapEmoji}>🗺️</Text><Text style={styles.mapFallbackTitle}>الخريطة جاهزة للربط</Text><Text style={styles.mapFallbackText}>بيانات الرصد تعمل، لكن عرض Google Maps يحتاج مفتاح API في نسخة Android. لن يغلق التطبيق بعد الآن.</Text>{latest&&<Text style={styles.coords}>📍 {latest.latitude.toFixed(5)}, {latest.longitude.toFixed(5)}</Text>}</View>}
      {pendingLatest&&<View style={styles.confirmCard}><Text style={styles.confirmTitle}>رصد أولي قريب في حي {neighborhood}</Text><Text style={styles.confirmText}>إذا كنت ترى الشاحنة أيضًا، أكّد الرصد.</Text><Pressable style={styles.confirmButton} disabled={confirmingId===pendingLatest.id} onPress={()=>confirmSighting(pendingLatest)}><Text style={styles.confirmButtonText}>{confirmingId===pendingLatest.id?'جارٍ التحقق من موقعك...':'نعم، أرى الشاحنة أيضًا'}</Text></Pressable></View>}
      <View style={styles.infoCard}>{latest?<><Text style={styles.infoTitle}>تم رصد الشاحنة مؤخرًا</Text><Text style={styles.infoText}>آخر تأكيد: {new Date(latest.confirmed_at??latest.created_at).toLocaleTimeString('ar-DZ',{hour:'2-digit',minute:'2-digit'})}</Text></>:<><Text style={styles.infoTitle}>لا يوجد رصد مؤكد حاليًا</Text><Text style={styles.infoText}>عند تأكيد مرور الشاحنة سيظهر آخر موقع مؤكد هنا.</Text></>}</View>
    </>}
  </SafeAreaView>;
}

const styles=StyleSheet.create({safe:{flex:1,backgroundColor:'#F5FAF7'},header:{paddingHorizontal:20,paddingTop:16,paddingBottom:12,flexDirection:'row-reverse',justifyContent:'space-between',alignItems:'center'},title:{fontSize:28,fontWeight:'900',color:'#17352A',textAlign:'right'},sub:{textAlign:'right',color:'#6B7A73',marginTop:5},refresh:{backgroundColor:'#EAF7F0',borderRadius:12,paddingHorizontal:14,paddingVertical:10},refreshText:{color:'#168A55',fontWeight:'900'},map:{flex:1,minHeight:320},mapFallback:{flex:1,minHeight:320,alignItems:'center',justifyContent:'center',padding:28,backgroundColor:'#EAF7F0'},mapEmoji:{fontSize:56},mapFallbackTitle:{fontSize:21,fontWeight:'900',color:'#17352A',marginTop:12},mapFallbackText:{textAlign:'center',color:'#6B7A73',lineHeight:22,marginTop:8},coords:{marginTop:14,color:'#168A55',fontWeight:'800'},center:{flex:1,alignItems:'center',justifyContent:'center',padding:28,gap:12},muted:{color:'#6B7A73',textAlign:'center',lineHeight:22},errorTitle:{fontSize:20,fontWeight:'900',color:'#9B2C2C',textAlign:'center'},retry:{backgroundColor:'#168A55',paddingHorizontal:18,paddingVertical:12,borderRadius:12,marginTop:6},retryText:{color:'#fff',fontWeight:'900'},confirmCard:{backgroundColor:'#FFF8E8',borderTopWidth:1,borderColor:'#F0D89A',padding:16},confirmTitle:{textAlign:'right',fontWeight:'900',fontSize:17,color:'#6E4D00'},confirmText:{textAlign:'right',color:'#6B5A32',lineHeight:21,marginTop:5},confirmButton:{backgroundColor:'#D98E04',borderRadius:13,padding:14,marginTop:12},confirmButtonText:{color:'#fff',fontWeight:'900',textAlign:'center'},infoCard:{backgroundColor:'#fff',borderTopWidth:1,borderColor:'#DCE7E1',padding:18},infoTitle:{textAlign:'right',fontWeight:'900',fontSize:17,color:'#17352A'},infoText:{textAlign:'right',color:'#6B7A73',lineHeight:21,marginTop:5}});
