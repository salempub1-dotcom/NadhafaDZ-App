import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

type Landmark = {
  name: string;
  latitude: number;
  longitude: number;
  neighborhood: 'بن يوب' | 'العميرات';
};

const LANDMARKS: Landmark[] = [
  { name: 'بداية الحوش', latitude: 36.65406, longitude: 3.10031, neighborhood: 'العميرات' },
  { name: 'مسجد حمزة', latitude: 36.6529492, longitude: 3.1161007, neighborhood: 'بن يوب' },
  { name: 'وسط حي بن يوب', latitude: 36.65443, longitude: 3.118, neighborhood: 'بن يوب' },
];

function displayNeighborhood(value: string) {
  return value === 'العميرات' ? 'الحوش' : `حي ${value}`;
}

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

function distanceMeters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const earthRadius = 6371000;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function proximityText(latitude: number, longitude: number, neighborhood: string) {
  const point = { latitude, longitude };
  const nearest = LANDMARKS
    .filter((landmark) => landmark.neighborhood === neighborhood)
    .map((landmark) => ({ landmark, distance: distanceMeters(point, landmark) }))
    .sort((a, b) => a.distance - b.distance)[0];

  if (!nearest) return `في ${displayNeighborhood(neighborhood)}`;
  const meters = Math.max(10, Math.round(nearest.distance / 10) * 10);

  if (nearest.distance <= 70) return `عند ${nearest.landmark.name}`;
  if (nearest.distance <= 250) return `بالقرب من ${nearest.landmark.name}، على بعد نحو ${meters} متر`;
  if (neighborhood === 'العميرات') return 'على امتداد الطريق الرئيسي في الحوش';
  return 'داخل حي بن يوب، بالقرب من الطريق الرئيسي';
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response('Unauthorized', { status: 401 });

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { report_id } = await req.json();
    if (!report_id) return Response.json({ error: 'report_id is required' }, { status: 400 });

    const { data: report, error: reportError } = await admin
      .from('truck_reports')
      .select('id, neighborhood, status, confirmed_at, latitude, longitude')
      .eq('id', report_id)
      .single();

    if (reportError || !report) return Response.json({ error: 'Report not found' }, { status: 404 });
    if (report.status !== 'confirmed') return Response.json({ error: 'Report is not confirmed' }, { status: 409 });

    const confirmedAt = new Date(report.confirmed_at ?? 0).getTime();
    if (!confirmedAt || Date.now() - confirmedAt > 10 * 60 * 1000) {
      return Response.json({ error: 'Confirmed report is too old to notify' }, { status: 409 });
    }

    const { error: dedupeError } = await admin.from('notification_events').insert({
      report_id: report.id,
      event_type: 'truck_confirmed',
    });

    if (dedupeError) {
      if (dedupeError.code === '23505') return Response.json({ ok: true, skipped: 'already_sent' });
      throw dedupeError;
    }

    const { data: tokens, error: tokensError } = await admin
      .from('push_tokens')
      .select('token')
      .eq('neighborhood', report.neighborhood)
      .eq('enabled', true);

    if (tokensError) throw tokensError;
    if (!tokens?.length) return Response.json({ ok: true, sent: 0 });

    const nearText = proximityText(Number(report.latitude), Number(report.longitude), report.neighborhood);
    const messages = tokens.map(({ token }) => ({
      to: token,
      sound: 'default',
      title: '🚛 الشاحنة قريبة',
      body: `تم تأكيد شاحنة النظافة ${nearText}. افتح الخريطة لرؤية آخر موقع مؤكد.`,
      data: {
        type: 'truck_confirmed',
        report_id: report.id,
        neighborhood: report.neighborhood,
        latitude: report.latitude,
        longitude: report.longitude,
      },
    }));

    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });

    const expoBody = await expoResponse.json();
    if (!expoResponse.ok) throw new Error(`Expo push failed: ${JSON.stringify(expoBody)}`);

    return Response.json({ ok: true, sent: messages.length, proximity: nearText, expo: expoBody });
  } catch (error) {
    console.error(error);
    return Response.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
});
