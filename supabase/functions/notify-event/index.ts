// Supabase Edge Function — genel bildirim gönderici.
//
// notify-urgent-job'dan farklı olarak bu fonksiyon TEK bir deploy ile birden
// fazla tabloyu/olayı kapsar; her tablo için Dashboard'da AYRI bir Database
// Webhook oluşturman gerekir (hepsi bu fonksiyonun URL'ine işaret eder):
//
//   1. messages       INSERT  -> karşı tarafa "yeni mesaj" bildirimi
//   2. applications   UPDATE  -> worker'a "başvurun kabul/red edildi"
//   3. service_offers INSERT  -> talep sahibine "yeni teklif" bildirimi
//   4. job_invites    INSERT  -> worker'a "iş daveti" bildirimi
//
// Kurulum: `supabase functions deploy notify-event`, sonra Dashboard >
// Database > Webhooks'tan yukarıdaki 4 satırı bu fonksiyona bağla.

import { createClient } from 'jsr:@supabase/supabase-js@2';

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE';
  table: string;
  record: Record<string, unknown>;
  old_record: Record<string, unknown> | null;
}

async function sendPush(supabaseAdmin: ReturnType<typeof createClient>, userId: string, title: string, body: string, data: Record<string, unknown>) {
  const { data: tokens } = await supabaseAdmin.from('push_tokens').select('token').eq('user_id', userId);
  if (!tokens?.length) return;

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(tokens.map((t) => ({ to: t.token, sound: 'default', title, body, data }))),
  });
}

Deno.serve(async (req) => {
  const payload: WebhookPayload = await req.json();
  const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  switch (payload.table) {
    case 'messages': {
      if (payload.type !== 'INSERT') break;
      const conversationId = payload.record.conversation_id as string;
      const senderId = payload.record.sender_id as string;
      const { data: conversation } = await supabaseAdmin
        .from('conversations')
        .select('participant_1_id, participant_2_id')
        .eq('id', conversationId)
        .single();
      if (!conversation) break;
      const recipientId = conversation.participant_1_id === senderId ? conversation.participant_2_id : conversation.participant_1_id;
      await sendPush(supabaseAdmin, recipientId, 'Yeni mesaj', String(payload.record.content ?? ''), { conversationId });
      break;
    }

    case 'applications': {
      if (payload.type !== 'UPDATE') break;
      const oldStatus = payload.old_record?.status;
      const newStatus = payload.record.status;
      if (oldStatus === newStatus) break;
      if (newStatus !== 'accepted' && newStatus !== 'rejected') break;
      const workerId = payload.record.worker_id as string;
      const title = newStatus === 'accepted' ? 'Başvurun kabul edildi 🎉' : 'Başvurun reddedildi';
      await sendPush(supabaseAdmin, workerId, title, 'Detaylar için uygulamayı aç.', { applicationId: payload.record.id });
      break;
    }

    case 'service_offers': {
      if (payload.type !== 'INSERT') break;
      const requestId = payload.record.request_id as string;
      const { data: request } = await supabaseAdmin
        .from('service_requests')
        .select('requester_id, title')
        .eq('id', requestId)
        .single();
      if (!request) break;
      await sendPush(supabaseAdmin, request.requester_id, 'Yeni teklif', `"${request.title}" talebine yeni bir teklif geldi.`, {
        requestId,
      });
      break;
    }

    case 'job_invites': {
      if (payload.type !== 'INSERT') break;
      const workerId = payload.record.worker_id as string;
      await sendPush(supabaseAdmin, workerId, 'Yeni iş daveti', 'Bir işveren seni bir ilana davet etti.', {
        jobPostId: payload.record.job_post_id,
      });
      break;
    }
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
});
