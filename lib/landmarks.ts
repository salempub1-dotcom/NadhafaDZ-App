export type ServiceLandmark = {
  key: string;
  name: string;
  latitude: number;
  longitude: number;
  neighborhood: 'بن يوب' | 'العميرات';
  kind: 'mosque' | 'area' | 'road' | 'pharmacy' | 'school' | 'shop' | 'workshop';
};

// Local reference points used only to describe the truck position in familiar terms.
// They are based on the Google Maps references supplied for the pilot area and can be
// fine-tuned later without changing the reporting model or Supabase schema.
export const SERVICE_LANDMARKS: ServiceLandmark[] = [
  { key: 'candia', name: 'كونديا', latitude: 36.65195, longitude: 3.1042, neighborhood: 'العميرات', kind: 'shop' },
  { key: 'blb-brique', name: 'Blb Brique', latitude: 36.6522, longitude: 3.1087, neighborhood: 'العميرات', kind: 'shop' },
  { key: 'hicham-bo', name: 'Hicham bo', latitude: 36.65255, longitude: 3.1128, neighborhood: 'العميرات', kind: 'shop' },
  { key: 'chaybi', name: 'الإخوة شايبي', latitude: 36.65245, longitude: 3.1142, neighborhood: 'العميرات', kind: 'shop' },
  { key: 'hamza-mosque', name: 'مسجد حمزة', latitude: 36.6525756, longitude: 3.1151464, neighborhood: 'بن يوب', kind: 'mosque' },
  { key: 'zaki-bva', name: 'Zaki BVA', latitude: 36.6538, longitude: 3.11535, neighborhood: 'بن يوب', kind: 'workshop' },
  { key: 'oussama', name: 'Groupe Oussama mécanique', latitude: 36.65455, longitude: 3.1164, neighborhood: 'بن يوب', kind: 'workshop' },
  { key: 'bensenouci', name: 'Pharmacie Bensenouci', latitude: 36.6527, longitude: 3.11715, neighborhood: 'بن يوب', kind: 'pharmacy' },
  { key: 'oz-school', name: 'Oz School', latitude: 36.65295, longitude: 3.11825, neighborhood: 'بن يوب', kind: 'school' },
  { key: 'alliliche', name: 'Alliliche', latitude: 36.65565, longitude: 3.11915, neighborhood: 'بن يوب', kind: 'area' },
  { key: 'salem-rebhi', name: 'Salem rebhi', latitude: 36.65495, longitude: 3.12005, neighborhood: 'بن يوب', kind: 'area' },
  { key: 'hamouda-sat', name: 'Hamouda sat', latitude: 36.65325, longitude: 3.12065, neighborhood: 'بن يوب', kind: 'shop' },
  { key: 'ben-youb-center', name: 'وسط حي بن يوب', latitude: 36.6543, longitude: 3.1181, neighborhood: 'بن يوب', kind: 'area' },
];

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

export function distanceMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  const earthRadius = 6371000;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function nearestServiceLandmark(latitude: number, longitude: number) {
  const point = { latitude, longitude };
  return SERVICE_LANDMARKS
    .map((landmark) => ({ landmark, distance: distanceMeters(point, landmark) }))
    .sort((a, b) => a.distance - b.distance)[0];
}

export function proximityLabel(latitude: number, longitude: number) {
  const nearest = nearestServiceLandmark(latitude, longitude);
  if (!nearest) return null;

  const meters = Math.max(25, Math.round(nearest.distance / 50) * 50);
  if (nearest.distance <= 60) return `عند ${nearest.landmark.name}`;
  if (nearest.distance <= 300) return `بالقرب من ${nearest.landmark.name}، على بعد نحو ${meters} متر`;
  if (nearest.landmark.neighborhood === 'العميرات') return 'على الطريق الرئيسي في الحوش';
  return 'داخل حي بن يوب، قرب الطريق الرئيسي';
}
