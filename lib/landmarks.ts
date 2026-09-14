export type ServiceLandmark = {
  key: string;
  name: string;
  latitude: number;
  longitude: number;
  neighborhood: 'بن يوب' | 'العميرات';
  kind: 'mosque' | 'area' | 'road' | 'pharmacy' | 'school' | 'shop' | 'workshop';
};

// Canonical pilot-corridor points confirmed by the user from Google Maps.
// Order matters: 1 -> 6 is the operational axis followed by the garbage truck.
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
    latitude: 36.652237,
    longitude: 3.112296,
    neighborhood: 'العميرات',
    kind: 'area',
  },
  {
    key: 'route-3-hamza-mosque',
    name: 'مسجد حمزة',
    latitude: 36.652788,
    longitude: 3.115609,
    neighborhood: 'بن يوب',
    kind: 'mosque',
  },
  {
    key: 'route-4-baraka',
    name: 'سبيرات البركة – حي بن يوب (M438+5M3)',
    latitude: 36.653063,
    longitude: 3.116484,
    neighborhood: 'بن يوب',
    kind: 'shop',
  },
  {
    key: 'route-5-ben-youb',
    name: 'بن يوب',
    latitude: 36.653037,
    longitude: 3.117797,
    neighborhood: 'بن يوب',
    kind: 'area',
  },
  {
    key: 'route-6-end',
    name: 'آخر نقطة تصل إليها الشاحنة',
    latitude: 36.653179,
    longitude: 3.118782,
    neighborhood: 'بن يوب',
    kind: 'road',
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
