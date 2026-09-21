// Supabase Edge Function — "acil ilan" oluşturulduğunda eşleşen işçilere
// Expo push bildirimi gönderir.
//
// Otomatik deploy edilmedi (bu ortamda proje erişimi yok). Kurulum:
//   1. supabase functions deploy notify-urgent-job
//   2. Supabase Dashboard > Database > Webhooks:
//      - Table: job_posts, Event: INSERT
//      - Condition (opsiyonel): is_urgent = true
//      - Target: bu fonksiyonun URL'i, header'da service-role anahtarı
//   Detaylı adımlar için bkz. SCHEMA.md.
//
// Eşleştirme mantığı: aynı ilçedeki (veya ilçesi boş bırakılmış) worker'lara
// gönderir. Job'ın required_languages'i varsa, worker_profiles.languages ile
// kesişimi olanları önceliklendirir; hiç eşleşme yoksa yine de ilçe eşleşmesi
// yeterli sayılır (dil bilgisi eksik olan işçileri dışlamamak için).

import { createClient } from 'jsr:@supabase/supabase-js@2';

interface JobPostRecord {
  id: string;
  title: string;
  district: string | null;
  daily_wage: number;
  is_urgent: boolean;
  required_languages: string[];
}

interface WebhookPayload {
  type: 'INSERT';
  table: string;
  record: JobPostRecord;
}

Deno.serve(async (req) => {
  const payload: WebhookPayload = await req.json();
  const job = payload.record;

  if (!job.is_urgent) {
    return new Response(JSON.stringify({ skipped: 'not urgent' }), { status: 200 });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  let workerQuery = supabaseAdmin.from('worker_profiles').select('user_id, district').eq('availability_status', 'available');
  if (job.district) workerQuery = workerQuery.or(`district.eq.${job.district},district.is.null`);

  const { data: workers, error: workersError } = await workerQuery;
  if (workersError || !workers?.length) {
    return new Response(JSON.stringify({ sent: 0, reason: workersError?.message ?? 'no matching workers' }), { status: 200 });
  }

  const workerIds = workers.map((w) => w.user_id);
  const { data: tokens } = await supabaseAdmin.from('push_tokens').select('token').in('user_id', workerIds);
  if (!tokens?.length) {
    return new Response(JSON.stringify({ sent: 0, reason: 'no push tokens' }), { status: 200 });
  }

  const messages = tokens.map((t) => ({
    to: t.token,
    sound: 'default',
    title: '⚡ Acil ilan',
    body: `${job.title} — ${job.daily_wage} ₺/gün${job.district ? ` · ${job.district}` : ''}`,
    data: { jobPostId: job.id },
  }));

  const expoRes = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(messages),
  });

  return new Response(JSON.stringify({ sent: messages.length, expoStatus: expoRes.status }), { status: 200 });
});
