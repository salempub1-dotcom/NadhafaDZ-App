import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View>
          <Text style={styles.brand}>NadhafaDZ</Text>
          <Text style={styles.title}>نظافة حينا</Text>
          <Text style={styles.subtitle}>حي بن يوب • براقي</Text>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.label}>حالة شاحنة النظافة</Text>
          <Text style={styles.status}>لم يتم رصدها بعد</Text>
          <Text style={styles.muted}>سيظهر آخر رصد مؤكد هنا عند تفعيل بيانات المرور.</Text>
        </View>

        <Pressable style={styles.primary} onPress={() => router.push('/(app)/report')}>
          <Text style={styles.primaryTitle}>رأيت شاحنة النظافة الآن</Text>
          <Text style={styles.primarySub}>شارك موقع الشاحنة فقط لتنبيه سكان الحي</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>خدمات سريعة</Text>
        <View style={styles.row}>
          <Pressable style={styles.smallCard} onPress={() => router.push('/(app)/map')}>
            <Text style={styles.smallTitle}>الخريطة الحية</Text>
            <Text style={styles.muted}>موقع وآخر رصد</Text>
          </Pressable>
          <Pressable style={styles.smallCard} onPress={() => router.push('/(app)/notifications')}>
            <Text style={styles.smallTitle}>التنبيهات</Text>
            <Text style={styles.muted}>مرور واقتراب الشاحنة</Text>
          </Pressable>
        </View>

        <View style={styles.info}>
          <Text style={styles.infoTitle}>نسخة تجريبية مجتمعية</Text>
          <Text style={styles.infoText}>في المرحلة الأولى يعتمد التطبيق على بلاغات السكان. لاحقًا يمكن ربطه مباشرة بشاحنات البلدية لإرسال التنبيهات تلقائيًا.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles=StyleSheet.create({safe:{flex:1,backgroundColor:'#F5FAF7'},content:{padding:20,gap:18},brand:{color:'#168A55',fontSize:15,fontWeight:'800',textAlign:'right'},title:{fontSize:29,fontWeight:'900',color:'#17352A',textAlign:'right'},subtitle:{color:'#6B7A73',textAlign:'right',marginTop:4},statusCard:{backgroundColor:'#fff',borderRadius:22,padding:20,borderWidth:1,borderColor:'#DCE7E1'},label:{textAlign:'right',color:'#6B7A73',fontWeight:'700'},status:{textAlign:'right',fontSize:24,fontWeight:'900',color:'#17352A',marginTop:8},muted:{color:'#6B7A73',textAlign:'right',lineHeight:20,marginTop:6},primary:{backgroundColor:'#168A55',borderRadius:22,padding:22},primaryTitle:{color:'#fff',fontWeight:'900',fontSize:20,textAlign:'center'},primarySub:{color:'#EAF7F0',fontSize:12,textAlign:'center',marginTop:6},sectionTitle:{textAlign:'right',fontSize:18,fontWeight:'900',color:'#17352A'},row:{flexDirection:'row',gap:12},smallCard:{flex:1,backgroundColor:'#fff',padding:18,borderRadius:18,borderWidth:1,borderColor:'#DCE7E1'},smallTitle:{fontWeight:'900',fontSize:16,color:'#17352A',textAlign:'right'},info:{backgroundColor:'#EAF7F0',borderRadius:18,padding:18},infoTitle:{textAlign:'right',fontWeight:'900',color:'#168A55'},infoText:{textAlign:'right',color:'#17352A',lineHeight:22,marginTop:7}});
