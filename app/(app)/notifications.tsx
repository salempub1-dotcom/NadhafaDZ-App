import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

const items=[
  {title:'الشاحنة دخلت حي بن يوب',body:'سيظهر هنا آخر مرور مؤكد عند ربط بيانات البلاغات.'},
  {title:'تنبيه اقتراب الشاحنة',body:'لاحقًا يمكن إرساله تلقائيًا عند ربط التطبيق بجهاز GPS في شاحنة البلدية.'}
];

export default function NotificationsScreen(){
  return <SafeAreaView style={styles.safe}><Text style={styles.title}>التنبيهات</Text><Text style={styles.sub}>الإشعارات الخاصة بالحي الذي اخترته.</Text>{items.map((x,i)=><View key={i} style={styles.card}><Text style={styles.cardTitle}>{x.title}</Text><Text style={styles.body}>{x.body}</Text></View>)}</SafeAreaView>
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:'#F5FAF7',padding:20},title:{fontSize:28,fontWeight:'900',textAlign:'right',color:'#17352A',marginTop:16},sub:{textAlign:'right',color:'#6B7A73',marginTop:6,marginBottom:16},card:{backgroundColor:'#fff',borderRadius:18,padding:18,borderWidth:1,borderColor:'#DCE7E1',marginBottom:12},cardTitle:{fontWeight:'900',fontSize:16,color:'#17352A',textAlign:'right'},body:{color:'#6B7A73',lineHeight:21,textAlign:'right',marginTop:7}});
