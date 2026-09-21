import { router } from 'expo-router';

import { ProfileForm } from '@/components/profile-form';
import { useAuth } from '@/providers/auth-provider';

export default function EditProfileScreen() {
  const { profile } = useAuth();
  const isEmployer = profile?.role === 'employer';

  return (
    <ProfileForm
      title="Profili Düzenle"
      subtitle={isEmployer ? 'İşletme bilgilerini güncelle.' : 'Yeteneklerini ve bilgilerini güncel tut.'}
      submitLabel="Kaydet"
      onSaved={() => router.back()}
    />
  );
}
