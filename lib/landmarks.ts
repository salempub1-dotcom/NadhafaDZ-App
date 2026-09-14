export type ServiceLandmark = {
  key: string;
  name: string;
  latitude: number;
  longitude: number;
  neighborhood: 'بن يوب' | 'العميرات';
  kind: 'mosque' | 'area' | 'road';
};

export const SERVICE_LANDMARKS: ServiceLandmark[] = [
  {
    key: 'el-houch-start',
    name: 'بداية الحوش',
    latitude: 36.65406,
    longitude: 3.10031,
    neighborhood: 'العميرات',
    kind: 'road',
  },
  {
    key: 'hamza-mosque',
    name: 'مسجد حمزة',
    latitude: 36.6529492,
    longitude: 3.1161007,
    neighborhood: 'بن يوب',
    kind: 'mosque',
  },
  {
    key: 'ben-youb-center',
    name: 'وسط حي بن يوب',
    latitude: 36.65443,
    longitude: 3.118,
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
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
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

  const meters = Math.max(10, Math.round(nearest.distance / 10) * 10);
  if (nearest.distance <= 70) return `عند ${nearest.landmark.name}`;
  if (nearest.distance <= 250) return `بالقرب من ${nearest.landmark.name}، على بعد نحو ${meters} متر`;
  if (nearest.landmark.neighborhood === 'العميرات') return 'على امتداد الطريق الرئيسي في الحوش';
  return 'داخل حي بن يوب، بالقرب من الطريق الرئيسي';
}
