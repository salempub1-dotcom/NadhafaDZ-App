import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

type Landmark = { name: string; latitude: number; longitude: number; neighborhood: 'بن يوب' | 'العميرات' };
const LANDMARKS: Landmark[] = [
  { name: 'كونديا', latitude: 36.65195, longitude: 3.1042, neighborhood: 'العميرات' },
  { name: 'Blb Brique', latitude: 36.6522, longitude: 3.1087, neighborhood: 'العميرات' },
  { name: 'Hicham bo', latitude: 36.65255, longitude: 3.1128, neighborhood: 'العميرات' },
  { name: 'الإخوة شايبي', latitude: 36.65245, longitude: 3.1142, neighborhood: 'العميرات' },
  { name: 'مسجد حمزة', latitude: 36.6525756, longitude: 3.1151464, neighborhood: 'بن يوب' },
  { name: 'Zaki BVA', latitude: 36.6538, longitude: 3.11535, neighborhood: 'بن يوب' },
  { name: 'Groupe Oussama mécanique', latitude: 36.65455, longitude: 3.1164, neighborhood: 'بن يوب' },
  { name: 'Pharmacie Bensenouci', latitude: 36.6527, longitude: 3.11715, neighborhood: 'بن يوب' },
  { name: 'Oz School', latitude: 36.65295, longitude: 3.11825, neighborhood: 'بن يوب' },
  { name: 'Alliliche', latitude: 36.65565, longitude: 3.11915, neighborhood: 'بن يوب' },
  { name: 'Salem rebhi', latitude: 36.65495, longitude: 3.12005, neighborhood: 'بن يوب' },
  { name: 'Hamouda sat', latitude: 36.65325, longitude: 3.12065, neighborhood: 'بن يوب' },
];

function displayNeighborhood(value: string) {
  return value === 'العميرات' ? 'الحوش' : 'حي بن يوب';
}
function toRad(value: number) { return (value * Math.PI) / 180; }
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
  const nearest = LANDMARKS.filter((x) => x.neighborhood === neighborhood)
    .map((landmark) => ({ landmark, distance: distanceMeters(point, landmark) }))
    .sort((a, b) => a.distance - b.distance)[0];
  if (!nearest) return `في ${displayNeighborhood(neighborhood)}`;
  const meters = Math.max(25, Math.round(nearest.distance / 50) * 50);
  if (nearest.distance <= 60) return `عند ${nearest.landmark.name}`;
  if (nearest.distance <= 300) return `بالقرب من ${nearest.landmark.name}، على بعد نحو ${meters} متر`;
  return neighborhood === 'العميرات' ? 'على الطريق الرئيسي في الحوش' : 'داخل حي بن يوب، قرب الطريق الرئيسي';
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  try {
    if (!req.headers.get('Authorization')) return new Response('Unauthorized', { status: 401 });

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    const { report_id } = await req.json();
    if (!report_id) return Response.json({ error: 'report_id is required' }, { status: 400 });

    const { data: report, error: reportError } = await admin
      .from('truck_reports')
      .select('id, neighborhood, status, confirmed_at, latitude, longitude, session_id')
      .eq('id', report_id)
      .single();
    if (reportError || !report) return Response.json({ error: 'Report not found' }, { status: 404 });
    if (report.status !== 'confirmed') return Response.json({ error: 'Report is not confirmed' }, { status: 409 });

    const confirmedAt = new Date(report.confirmed_at ?? 0).getTime();
    if (!confirmedAt || Date.now() - confirmedAt > 15 * 60 * 1000) {
      return Response.json({ error: 'Confirmed report is too old to notify' }, { status: 409 });
    }

    let eventType = 'truck_confirmed';
    let isSessionStart = false;
    if (report.session_id) {
      const { data: session } = await admin
        .from('truck_sessions')
        .select('id, anchor_report_id')
        .eq('id', report.session_id)
        .single();
      isSessionStart = session?.anchor_report_id === report.id;
      eventType = isSessionStart ? 'session_started' : 'location_update';

      if (!isSessionStart) {
        const { data: lastEvent } = await admin
          .from('notification_events')
          .select('report_id, created_at')
          .eq('session_id', report.session_id)
          .in('event_type', ['session_started', 'location_update'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lastEvent) {
          const minutesSince = (Date.now() - new Date(lastEvent.created_at).getTime()) / 60000;
          if (minutesSince < 10) return Response.json({ ok: true, skipped: 'cooldown' });
          const { data: previous } = await admin
            .from('truck_reports')
            .select('latitude, longitude')
            .eq('id', lastEvent.report_id)
            .maybeSingle();
          if (previous) {
            const moved = distanceMeters(
              { latitude: Number(previous.latitude), longitude: Number(previous.longitude) },
              { latitude: Number(report.latitude), longitude: Number(report.longitude) },
            );
            if (moved < 500) return Response.json({ ok: true, skipped: 'small_movement' });
          }
        }
      }
    }

    const { error: eventError } = await admin.from('notification_events').insert({
      report_id: report.id,
      session_id: report.session_id,
      event_type: eventType,
    });
    if (eventError) {
      if (eventError.code === '23505') return Response.json({ ok: true, skipped: 'already_sent' });
      throw eventError;
    }

    const { data: tokens, error: tokensError } = await admin
      .from('push_tokens')
      .select('token')
      .eq('neighborhood', report.neighborhood)
      .eq('enabled', true);
    if (tokensError) throw tokensError;
    if (!tokens?.length) return Response.json({ ok: true, sent: 0 });

    const nearText = proximityText(Number(report.latitude), Number(report.longitude), report.neighborhood);
    const title = isSessionStart
      ? `🚛 تم تأكيد دخول الشاحنة إلى ${displayNeighborhood(report.neighborhood)}`
      : '🚛 تحديث جديد لموقع الشاحنة';
    const body = isSessionStart
      ? `تم تأكيد مرور الشاحنة ${nearText}. اضغط لمتابعتها مباشرة على الخريطة.`
      : `تم رصد الشاحنة الآن ${nearText}. اضغط لرؤية آخر مسار مؤكد.`;

    const messages = tokens.map(({ token }) => ({
      to: token,
      sound: 'default',
      priority: 'high',
      channelId: 'truck-alerts',
      title,
      body,
      data: {
        type: isSessionStart ? 'truck_session_started' : 'truck_location_update',
        report_id: report.id,
        session_id: report.session_id,
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

    return Response.json({ ok: true, sent: messages.length, event_type: eventType, proximity: nearText, expo: expoBody });
  } catch (error) {
    console.error(error);
    return Response.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
});
