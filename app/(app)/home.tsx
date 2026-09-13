import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useNeighborhood } from '@/contexts/NeighborhoodContext';

export default function HomeScreen() {
  const { neighborhood, setNeighborhood } = useNeighborhood();
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.hero}>
      <View style={styles.heroDecor}><Text style={styles.heroEmoji}>🧹</Text><Text style={styles.heroEmoji}>🚛</Text><Text style={styles.heroEmoji}>🦺</Text></View>
      <Text style={styles.brand}>NadhafaDZ</Text>
      <Text style={styles.title}>نظافة حينا</Text>
      <Text style={styles.heroSub}>معًا لتنبيه السكان ومساعدة عمال النظافة على خدمة الحي بشكل أفضل</Text>
      <Text style={styles.subtitle}>حي {neighborhood} • براقي</Text>
    </View>

    <View style={styles.selectorCard}><Text style={styles.selectorTitle}>اختر حيّك</Text><View style={styles.selectorRow}>{(['بن يوب','العميرات'] as const).map(item=><Pressable key={item} onPress={()=>setNeighborhood(item)} style={[styles.choice,neighborhood===item&&styles.choiceActive]}><Text style={[styles.choiceText,neighborhood===item&&styles.choiceTextActive]}>حي {item}</Text></Pressable>)}</View></View>

    <View style={styles.statusCard}><Text style={styles.label}>حالة شاحنة النظافة</Text><Text style={styles.status}>لم يتم رصدها بعد</Text><Text style={styles.muted}>سيظهر آخر رصد مؤكد هنا عند توفر بيانات المرور.</Text></View>

    <Pressable style={styles.primary} onPress={()=>router.push('/(app)/report')}><Text style={styles.primaryIcon}>🚛</Text><Text style={styles.primaryTitle}>رأيت شاحنة النظافة الآن</Text><Text style={styles.primarySub}>شارك موقع الشاحنة فقط لتنبيه سكان حي {neighborhood}</Text></Pressable>

    <Text style={styles.sectionTitle}>خدمات سريعة</Text><View style={styles.row}>
      <Pressable style={styles.smallCard} onPress={()=>router.push('/(app)/map')}><Text style={styles.cardIcon}>🗺️</Text><Text style={styles.smallTitle}>الخريطة الحية</Text><Text style={styles.muted}>موقع وآخر رصد</Text></Pressable>
      <Pressable style={styles.smallCard} onPress={()=>router.push('/(app)/notifications')}><Text style={styles.cardIcon}>🔔</Text><Text style={styles.smallTitle}>التنبيهات</Text><Text style={styles.muted}>مرور واقتراب الشاحنة</Text></Pressable>
    </View>

    <View style={styles.info}><Text style={styles.infoTitle}>نسخة تجريبية مجتمعية</Text><Text style={styles.infoText}>في المرحلة الأولى يعتمد التطبيق على بلاغات السكان. لاحقًا يمكن ربطه مباشرة بشاحنات البلدية لإرسال التنبيهات تلقائيًا.</Text></View>
  </ScrollView></SafeAreaView>;
}

const styles=StyleSheet.create({safe:{flex:1,backgroundColor:'#F5FAF7'},content:{padding:18,gap:16},hero:{backgroundColor:'#DFF2E8',borderRadius:28,padding:22,overflow:'hidden',borderWidth:1,borderColor:'#CFE5D8'},heroDecor:{flexDirection:'row-reverse',gap:10,marginBottom:14},heroEmoji:{fontSize:30},brand:{color:'#168A55',fontSize:16,fontWeight:'900',textAlign:'right'},title:{fontSize:31,fontWeight:'900',color:'#17352A',textAlign:'right'},heroSub:{color:'#365C4B',textAlign:'right',lineHeight:21,marginTop:7},subtitle:{color:'#6B7A73',textAlign:'right',marginTop:8,fontWeight:'700'},selectorCard:{backgroundColor:'#fff',borderRadius:20,padding:18,borderWidth:1,borderColor:'#DCE7E1'},selectorTitle:{textAlign:'right',fontWeight:'900',color:'#17352A',marginBottom:12},selectorRow:{flexDirection:'row',gap:10},choice:{flex:1,borderRadius:14,paddingVertical:12,borderWidth:1,borderColor:'#CFE1D7',backgroundColor:'#F7FBF9'},choiceActive:{backgroundColor:'#168A55',borderColor:'#168A55'},choiceText:{textAlign:'center',fontWeight:'800',color:'#17352A'},choiceTextActive:{color:'#fff'},statusCard:{backgroundColor:'#fff',borderRadius:22,padding:20,borderWidth:1,borderColor:'#DCE7E1'},label:{textAlign:'right',color:'#6B7A73',fontWeight:'700'},status:{textAlign:'right',fontSize:24,fontWeight:'900',color:'#17352A',marginTop:8},muted:{color:'#6B7A73',textAlign:'right',lineHeight:20,marginTop:6},primary:{backgroundColor:'#168A55',borderRadius:22,padding:22,alignItems:'center'},primaryIcon:{fontSize:34,marginBottom:8},primaryTitle:{color:'#fff',fontWeight:'900',fontSize:20,textAlign:'center'},primarySub:{color:'#EAF7F0',fontSize:12,textAlign:'center',marginTop:6},sectionTitle:{textAlign:'right',fontSize:18,fontWeight:'900',color:'#17352A'},row:{flexDirection:'row',gap:12},smallCard:{flex:1,backgroundColor:'#fff',padding:18,borderRadius:18,borderWidth:1,borderColor:'#DCE7E1'},cardIcon:{fontSize:26,textAlign:'right'},smallTitle:{fontWeight:'900',fontSize:16,color:'#17352A',textAlign:'right',marginTop:7},info:{backgroundColor:'#EAF7F0',borderRadius:18,padding:18},infoTitle:{textAlign:'right',fontWeight:'900',color:'#168A55'},infoText:{textAlign:'right',color:'#17352A',lineHeight:22,marginTop:7}});
