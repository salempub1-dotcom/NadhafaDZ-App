import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function MapScreen(){
  return <SafeAreaView style={styles.safe}>
    <Text style={styles.title}>الخريطة الحية</Text>
    <Text style={styles.sub}>حي بن يوب وحي العميرات</Text>
    <View style={styles.mapPlaceholder}><Text style={styles.pin}>📍</Text><Text style={styles.mapTitle}>خريطة المرور ستظهر هنا</Text><Text style={styles.body}>في النسخة التالية سنعرض آخر موقع مؤكد للشاحنة ومسارها التقريبي. الربط المباشر مع شاحنات البلدية سيحوّل هذه الشاشة إلى تتبع آلي.</Text></View>
  </SafeAreaView>
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:'#F5FAF7',padding:20},title:{fontSize:28,fontWeight:'900',color:'#17352A',textAlign:'right',marginTop:16},sub:{textAlign:'right',color:'#6B7A73',marginTop:5},mapPlaceholder:{flex:1,backgroundColor:'#E7EFE9',borderRadius:24,marginTop:18,alignItems:'center',justifyContent:'center',padding:30},pin:{fontSize:48},mapTitle:{fontSize:21,fontWeight:'900',color:'#17352A',marginTop:12},body:{textAlign:'center',color:'#6B7A73',lineHeight:22,marginTop:10}});
