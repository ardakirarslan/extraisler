import type { BadgeTone } from '@/components/badge';
import type { ApplicationStatus, JobPostStatus, ServiceOfferStatus, ServiceRequestStatus } from '@/types/database';

export const APPLICATION_STATUS: Record<ApplicationStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: 'Beklemede', tone: 'amber' },
  accepted: { label: 'Kabul edildi', tone: 'green' },
  rejected: { label: 'Reddedildi', tone: 'red' },
  auto_cancelled: { label: 'İptal edildi', tone: 'gray' },
  completed: { label: 'Tamamlandı', tone: 'blue' },
};

export const JOB_POST_STATUS: Record<JobPostStatus, { label: string; tone: BadgeTone }> = {
  open: { label: 'Açık', tone: 'green' },
  filled: { label: 'Dolduruldu', tone: 'blue' },
  closed: { label: 'Kapandı', tone: 'gray' },
  cancelled: { label: 'İptal edildi', tone: 'red' },
};

export const SERVICE_REQUEST_STATUS: Record<ServiceRequestStatus, { label: string; tone: BadgeTone }> = {
  open: { label: 'Açık', tone: 'green' },
  in_progress: { label: 'Devam ediyor', tone: 'amber' },
  completed: { label: 'Tamamlandı', tone: 'blue' },
  cancelled: { label: 'İptal edildi', tone: 'red' },
};

export const SERVICE_OFFER_STATUS: Record<ServiceOfferStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: 'Beklemede', tone: 'amber' },
  accepted: { label: 'Kabul edildi', tone: 'green' },
  rejected: { label: 'Reddedildi', tone: 'red' },
};
