import { ImageBackground, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useNeighborhood } from '@/contexts/NeighborhoodContext';

const HERO_IMAGE = { uri: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Loading_Refuse_into_Dustbin_Truck.jpg?width=1600' };

export default function HomeScreen() {
  const { neighborhood, setNeighborhood } = useNeighborhood();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ImageBackground source={HERO_IMAGE} style={styles.hero} imageStyle={styles.heroImage}>
          <View style={styles.heroOverlay}>
            <Text style={styles.brand}>NadhafaDZ</Text>
            <Text style={styles.title}>نظافة حينا</Text>
            <Text style={styles.heroSub}>معًا لتنبيه السكان ومساندة عمال النظافة في خدمة الحي</Text>
            <View style={styles.locationBadge}>
              <Ionicons name="location" size={16} color="#FFFFFF" />
              <Text style={styles.locationText}>حي {neighborhood} • براقي</Text>
            </View>
          </View>
        </ImageBackground>

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
            <View style={styles.statusIcon}><Ionicons name="truck-outline" size={22} color="#168A55" /></View>
            <Text style={styles.label}>حالة شاحنة النظافة</Text>
          </View>
          <Text style={styles.status}>لم يتم رصدها بعد</Text>
          <Text style={styles.muted}>سيظهر آخر رصد مؤكد هنا عند توفر بيانات المرور.</Text>
        </View>

        <Pressable style={styles.primary} onPress={() => router.push('/(app)/report')}>
          <View style={styles.primaryIcon}><Ionicons name="megaphone" size={28} color="#168A55" /></View>
          <Text style={styles.primaryTitle}>رأيت شاحنة النظافة الآن</Text>
          <Text style={styles.primarySub}>شارك موقع الشاحنة فقط لتنبيه سكان حي {neighborhood}</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>خدمات سريعة</Text>
        <View style={styles.row}>
          <Pressable style={styles.smallCard} onPress={() => router.push('/(app)/map')}>
            <View style={styles.cardIcon}><Ionicons name="map" size={23} color="#168A55" /></View>
            <Text style={styles.smallTitle}>الخريطة الحية</Text>
            <Text style={styles.muted}>موقع وآخر رصد</Text>
          </Pressable>
          <Pressable style={styles.smallCard} onPress={() => router.push('/(app)/notifications')}>
            <View style={styles.cardIcon}><Ionicons name="notifications" size={23} color="#168A55" /></View>
            <Text style={styles.smallTitle}>التنبيهات</Text>
            <Text style={styles.muted}>مرور واقتراب الشاحنة</Text>
          </Pressable>
        </View>

        <View style={styles.info}>
          <View style={styles.infoHead}><Ionicons name="people" size={20} color="#168A55" /><Text style={styles.infoTitle}>نسخة تجريبية مجتمعية</Text></View>
          <Text style={styles.infoText}>في المرحلة الأولى يعتمد التطبيق على بلاغات السكان. لاحقًا يمكن ربطه مباشرة بشاحنات البلدية لإرسال التنبيهات تلقائيًا.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5FAF7' },
  content: { padding: 18, gap: 16 },
  hero: { height: 260, justifyContent: 'flex-end', borderRadius: 28, overflow: 'hidden' },
  heroImage: { borderRadius: 28 },
  heroOverlay: { backgroundColor: 'rgba(8,48,34,0.62)', padding: 22 },
  brand: { color: '#A7F0C9', fontSize: 16, fontWeight: '900', textAlign: 'right' },
  title: { fontSize: 32, fontWeight: '900', color: '#FFFFFF', textAlign: 'right', marginTop: 2 },
  heroSub: { color: '#ECFFF4', textAlign: 'right', lineHeight: 22, marginTop: 7 },
  locationBadge: { marginTop: 12, alignSelf: 'flex-end', flexDirection: 'row-reverse', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 7 },
  locationText: { color: '#FFFFFF', fontWeight: '800' },
  selectorCard: { backgroundColor: '#fff', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#DCE7E1' },
  selectorTitle: { textAlign: 'right', fontWeight: '900', color: '#17352A', marginBottom: 12 },
  selectorRow: { flexDirection: 'row', gap: 10 },
  choice: { flex: 1, borderRadius: 14, paddingVertical: 12, borderWidth: 1, borderColor: '#CFE1D7', backgroundColor: '#F7FBF9' },
  choiceActive: { backgroundColor: '#168A55', borderColor: '#168A55' },
  choiceText: { textAlign: 'center', fontWeight: '800', color: '#17352A' },
  choiceTextActive: { color: '#fff' },
  statusCard: { backgroundColor: '#fff', borderRadius: 22, padding: 20, borderWidth: 1, borderColor: '#DCE7E1' },
  statusHead: { flexDirection: 'row-reverse', alignItems: 'center', gap: 9 },
  statusIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAF7F0' },
  label: { textAlign: 'right', color: '#6B7A73', fontWeight: '700' },
  status: { textAlign: 'right', fontSize: 24, fontWeight: '900', color: '#17352A', marginTop: 10 },
  muted: { color: '#6B7A73', textAlign: 'right', lineHeight: 20, marginTop: 6 },
  primary: { backgroundColor: '#168A55', borderRadius: 24, padding: 22, alignItems: 'center', shadowColor: '#168A55', shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  primaryIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  primaryTitle: { color: '#fff', fontWeight: '900', fontSize: 21, textAlign: 'center' },
  primarySub: { color: '#EAF7F0', fontSize: 12, textAlign: 'center', marginTop: 6 },
  sectionTitle: { textAlign: 'right', fontSize: 18, fontWeight: '900', color: '#17352A' },
  row: { flexDirection: 'row', gap: 12 },
  smallCard: { flex: 1, backgroundColor: '#fff', padding: 18, borderRadius: 18, borderWidth: 1, borderColor: '#DCE7E1' },
  cardIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAF7F0', alignSelf: 'flex-end' },
  smallTitle: { fontWeight: '900', fontSize: 16, color: '#17352A', textAlign: 'right', marginTop: 9 },
  info: { backgroundColor: '#EAF7F0', borderRadius: 18, padding: 18 },
  infoHead: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  infoTitle: { textAlign: 'right', fontWeight: '900', color: '#168A55' },
  infoText: { textAlign: 'right', color: '#17352A', lineHeight: 22, marginTop: 7 },
});
