import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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
      .select('id, neighborhood, status, confirmed_at')
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

    const messages = tokens.map(({ token }) => ({
      to: token,
      sound: 'default',
      title: '🚛 تم رصد شاحنة النظافة',
      body: `تم تأكيد مرور شاحنة النظافة في حي ${report.neighborhood}. افتح الخريطة لرؤية آخر موقع مؤكد.`,
      data: { type: 'truck_confirmed', report_id: report.id, neighborhood: report.neighborhood },
    }));

    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });

    const expoBody = await expoResponse.json();
    if (!expoResponse.ok) throw new Error(`Expo push failed: ${JSON.stringify(expoBody)}`);

    return Response.json({ ok: true, sent: messages.length, expo: expoBody });
  } catch (error) {
    console.error(error);
    return Response.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
});
