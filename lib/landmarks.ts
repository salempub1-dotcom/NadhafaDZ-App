export type ServiceLandmark = {
  key: string;
  name: string;
  latitude: number;
  longitude: number;
  neighborhood: 'بن يوب' | 'العميرات';
  kind: 'mosque' | 'area' | 'road' | 'pharmacy' | 'school' | 'shop' | 'workshop';
};

// Canonical pilot reference points confirmed by the user from Google Maps.
// Points 1 -> 5 follow the original operational corridor. Additional numbered
// points are kept in the same list so they remain permanently visible on the map
// and progressively define the full Ben Youb / Al Omayrat service perimeter.
export const SERVICE_LANDMARKS: ServiceLandmark[] = [
  {
    key: 'route-1-start-houch',
    name: 'مفترق بداية الطريق الرئيسي',
    latitude: 36.651640,
    longitude: 3.108959,
    neighborhood: 'العميرات',
    kind: 'road',
  },
  {
    key: 'route-2-salem-dztube',
    name: 'Salem DZTube',
    latitude: 36.652214,
    longitude: 3.112289,
    neighborhood: 'العميرات',
    kind: 'area',
  },
  {
    key: 'route-3-sidi-ali-ben-youb-mosque',
    name: 'مسجد حي سيد علي بن يوب (M438+469)',
    latitude: 36.652788,
    longitude: 3.115609,
    neighborhood: 'بن يوب',
    kind: 'mosque',
  },
  {
    key: 'route-4-baraka',
    name: 'سبيرات البركة (M438+5M3)',
    latitude: 36.653063,
    longitude: 3.116484,
    neighborhood: 'بن يوب',
    kind: 'shop',
  },
  {
    key: 'route-5-end',
    name: 'آخر نقطة تصل إليها الشاحنة',
    latitude: 36.653178,
    longitude: 3.118758,
    neighborhood: 'بن يوب',
    kind: 'road',
  },
  {
    key: 'reference-6',
    name: 'النقطة المرجعية 6',
    latitude: 36.655100,
    longitude: 3.118318,
    neighborhood: 'بن يوب',
    kind: 'road',
  },
  {
    key: 'reference-7',
    name: 'النقطة المرجعية 7',
    latitude: 36.656365,
    longitude: 3.117925,
    neighborhood: 'بن يوب',
    kind: 'road',
  },
  {
    key: 'reference-8-m438-rcw',
    name: 'النقطة المرجعية 8 (M438+RCW)',
    latitude: 36.654640,
    longitude: 3.116191,
    neighborhood: 'بن يوب',
    kind: 'area',
  },
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
