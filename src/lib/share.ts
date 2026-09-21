import * as Linking from 'expo-linking';

import type { JobPost } from '@/types/database';

/** Opens WhatsApp (app if installed, wa.me web fallback otherwise) with a prefilled job ad. */
export async function shareJobToWhatsApp(job: JobPost) {
  const link = Linking.createURL(`/jobs/${job.id}`);
  const text = [
    `${job.is_urgent ? '⚡ ACİL — ' : ''}${job.title}`,
    job.district ? `📍 ${job.district}` : null,
    `📅 ${job.date}`,
    `💰 ${job.daily_wage} ₺/gün · ${job.needed_worker_count} kişi`,
    job.required_languages?.length ? `🗣 ${job.required_languages.join(', ')}` : null,
    '',
    'Detaylar ve başvuru için:',
    link,
  ]
    .filter(Boolean)
    .join('\n');

  const appUrl = `whatsapp://send?text=${encodeURIComponent(text)}`;
  const canOpenApp = await Linking.canOpenURL(appUrl);
  await Linking.openURL(canOpenApp ? appUrl : `https://wa.me/?text=${encodeURIComponent(text)}`);
}
