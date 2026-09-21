import { ProfileForm } from '@/components/profile-form';
import { useAuth } from '@/providers/auth-provider';

export default function CompleteProfileScreen() {
  const { profile } = useAuth();
  const isEmployer = profile?.role === 'employer';

  return (
    <ProfileForm
      title="Profilini Tamamla"
      subtitle={isEmployer ? 'İlan açabilmen için işletme bilgilerini gir.' : 'İşlere başvurabilmen için birkaç bilgiye ihtiyacımız var.'}
      submitLabel="Profili Tamamla"
      onSaved={() => {}}
    />
  );
}
