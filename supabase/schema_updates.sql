-- Extra İşler — yeni özellikler için şema güncellemeleri
--
-- Bu dosya Supabase'de OTOMATİK çalışmaz. Supabase Dashboard > SQL Editor'e
-- yapıştırıp elle çalıştırman gerekiyor (proje service-role erişimi bu ortamda
-- yok). Tamamı idempotent yazıldı, güvenle tekrar çalıştırılabilir.
--
-- Kapsanan özellikler:
--   1) WhatsApp paylaşım köprüsü        -> şema değişikliği gerektirmiyor
--   2) Acil ilan bildirimleri            -> job_posts.is_urgent, push_tokens
--   4) İşletme verimliliği (favori/davet) -> favorite_workers, job_invites
--   5) İlçe filtresi + dil etiketi        -> job_posts/worker_profiles kolonları
--   6) Ekip halinde başvuru               -> applications.team_size/team_members

-- ---------------------------------------------------------------------------
-- 2 & 5) job_posts: acil ilan, ilçe, gerekli diller
-- ---------------------------------------------------------------------------
alter table public.job_posts
  add column if not exists is_urgent boolean not null default false,
  add column if not exists district text,
  add column if not exists required_languages text[] not null default '{}';

create index if not exists job_posts_is_urgent_idx on public.job_posts (is_urgent) where is_urgent;
create index if not exists job_posts_district_idx on public.job_posts (district);

-- ---------------------------------------------------------------------------
-- 5) worker_profiles: ilçe + konuşulan diller
-- ---------------------------------------------------------------------------
alter table public.worker_profiles
  add column if not exists district text,
  add column if not exists languages text[] not null default '{}';

-- ---------------------------------------------------------------------------
-- 6) applications: ekip halinde başvuru
-- ---------------------------------------------------------------------------
alter table public.applications
  add column if not exists team_size int not null default 1,
  add column if not exists team_members text[] not null default '{}';

alter table public.applications
  drop constraint if exists applications_team_size_check;
alter table public.applications
  add constraint applications_team_size_check check (team_size >= 1 and team_size <= 20);

-- ---------------------------------------------------------------------------
-- 4) favorite_workers: işverenin sık çalıştığı/güvendiği personel havuzu
-- ---------------------------------------------------------------------------
create table if not exists public.favorite_workers (
  employer_id uuid not null references public.users (id) on delete cascade,
  worker_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (employer_id, worker_id)
);

alter table public.favorite_workers enable row level security;

drop policy if exists "employer manages own favorites" on public.favorite_workers;
create policy "employer manages own favorites"
  on public.favorite_workers
  for all
  using (employer_id = auth.uid())
  with check (employer_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 4) job_invites: işverenin favori personeli doğrudan bir ilana davet etmesi
-- ---------------------------------------------------------------------------
create table if not exists public.job_invites (
  id uuid primary key default gen_random_uuid(),
  job_post_id uuid not null references public.job_posts (id) on delete cascade,
  employer_id uuid not null references public.users (id) on delete cascade,
  worker_id uuid not null references public.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  unique (job_post_id, worker_id)
);

alter table public.job_invites enable row level security;

drop policy if exists "employer manages own invites" on public.job_invites;
create policy "employer manages own invites"
  on public.job_invites
  for all
  using (employer_id = auth.uid())
  with check (employer_id = auth.uid());

drop policy if exists "worker reads own invites" on public.job_invites;
create policy "worker reads own invites"
  on public.job_invites
  for select
  using (worker_id = auth.uid());

drop policy if exists "worker updates own invite status" on public.job_invites;
create policy "worker updates own invite status"
  on public.job_invites
  for update
  using (worker_id = auth.uid())
  with check (worker_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 2) push_tokens: acil ilan bildirimleri için Expo push token kaydı
-- ---------------------------------------------------------------------------
create table if not exists public.push_tokens (
  user_id uuid primary key references public.users (id) on delete cascade,
  token text not null,
  updated_at timestamptz not null default now()
);

alter table public.push_tokens enable row level security;

drop policy if exists "user manages own push token" on public.push_tokens;
create policy "user manages own push token"
  on public.push_tokens
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Sunucu tarafı (Database Webhook) bu tabloyu okuyup Expo push API'sine
-- istek atacak — bkz. supabase/functions/notify-urgent-job/index.ts ve
-- SCHEMA.md'deki kurulum notu. Bu SQL sadece veri modelini kurar, bildirim
-- gönderimini otomatik tetiklemez.

-- ---------------------------------------------------------------------------
-- Ek: conversations / messages için RLS güvenlik ağı
--
-- "İşverene mesaj gönder" / "Mesaj Gönder" çalışmıyorsa en olası sebep bu iki
-- tablodaki RLS politikalarının insert/select'i doğru izin vermemesi
-- (örn. sadece participant_1_id yerine iki taraftan birini kontrol etmemesi).
-- Bu politikalar zaten doğruysa yeniden oluşturmak zararsızdır (idempotent).
-- ---------------------------------------------------------------------------
alter table public.conversations enable row level security;

drop policy if exists "participants can view conversation" on public.conversations;
create policy "participants can view conversation"
  on public.conversations
  for select
  using (participant_1_id = auth.uid() or participant_2_id = auth.uid());

drop policy if exists "participants can start conversation" on public.conversations;
create policy "participants can start conversation"
  on public.conversations
  for insert
  with check (participant_1_id = auth.uid() or participant_2_id = auth.uid());

drop policy if exists "participants can update conversation" on public.conversations;
create policy "participants can update conversation"
  on public.conversations
  for update
  using (participant_1_id = auth.uid() or participant_2_id = auth.uid());

alter table public.messages enable row level security;

drop policy if exists "participants can view messages" on public.messages;
create policy "participants can view messages"
  on public.messages
  for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.participant_1_id = auth.uid() or c.participant_2_id = auth.uid())
    )
  );

drop policy if exists "participants can send messages" on public.messages;
create policy "participants can send messages"
  on public.messages
  for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.participant_1_id = auth.uid() or c.participant_2_id = auth.uid())
    )
  );

drop policy if exists "participants can mark messages read" on public.messages;
create policy "participants can mark messages read"
  on public.messages
  for update
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.participant_1_id = auth.uid() or c.participant_2_id = auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- ratings: "Bi' Zahmet" taleplerini de kapsayacak şekilde genişletme
--
-- Tablo şu an sadece applications'a bağlı (application_id). service_requests
-- için puanlama ekleyebilmek üzere nullable bir service_request_id kolonu
-- ekliyoruz ve tam olarak ikisinden birinin dolu olmasını zorunlu kılıyoruz.
-- rater_role enum'ına da 'master' ve 'requester' değerlerini ekliyoruz —
-- enum'ın gerçek tip adı ortamdan ortama değişebileceği için pg_type'tan
-- dinamik olarak buluyoruz.
-- ---------------------------------------------------------------------------
do $$
declare
  enum_type_name text;
  new_value text;
begin
  select t.typname into enum_type_name
  from pg_type t
  join pg_attribute a on a.atttypid = t.oid
  join pg_class c on c.oid = a.attrelid
  where c.relname = 'ratings' and a.attname = 'rater_role'
  limit 1;

  if enum_type_name is not null then
    foreach new_value in array array['master', 'requester'] loop
      execute format('alter type %I add value if not exists %L', enum_type_name, new_value);
    end loop;
  end if;
end $$;

alter table public.ratings
  add column if not exists service_request_id uuid references public.service_requests (id) on delete cascade;

alter table public.ratings
  alter column application_id drop not null;

alter table public.ratings
  drop constraint if exists ratings_rating_target_check;
alter table public.ratings
  add constraint ratings_rating_target_check
  check (
    (application_id is not null and service_request_id is null) or
    (application_id is null and service_request_id is not null)
  );

alter table public.ratings enable row level security;

-- Puanlar, profillerde ortalama/itibar puanı olarak gösterildiği için
-- herkese (giriş yapmış her kullanıcıya) açık okunabilir.
drop policy if exists "ratings are publicly readable" on public.ratings;
create policy "ratings are publicly readable"
  on public.ratings
  for select
  using (true);

drop policy if exists "users rate as themselves" on public.ratings;
create policy "users rate as themselves"
  on public.ratings
  for insert
  with check (rater_id = auth.uid());

-- ---------------------------------------------------------------------------
-- worker_documents: profil ekranındaki "Özgeçmiş & Belgeler" (CV/sertifika)
-- yükleme özelliği için. Sadece sahibi yönetir/görür.
-- ---------------------------------------------------------------------------
create table if not exists public.worker_documents (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  file_url text not null,
  file_size bigint,
  created_at timestamptz not null default now()
);

alter table public.worker_documents enable row level security;

drop policy if exists "worker manages own documents" on public.worker_documents;
create policy "worker manages own documents"
  on public.worker_documents
  for all
  using (worker_id = auth.uid())
  with check (worker_id = auth.uid());

-- Employer, kendi ilanına başvuran bir işçinin belgelerini (CV) görebilsin.
drop policy if exists "employer views applicant documents" on public.worker_documents;
create policy "employer views applicant documents"
  on public.worker_documents
  for select
  using (
    exists (
      select 1
      from public.applications a
      join public.job_posts jp on jp.id = a.job_post_id
      where a.worker_id = worker_documents.worker_id
        and jp.employer_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- saved_jobs: "Kaydedilen İlanlar" — işçinin bir ilanı kalıcı olarak
-- kaydedip sonra tekrar bulabilmesi için. Sadece sahibi yönetir/görür.
-- ---------------------------------------------------------------------------
create table if not exists public.saved_jobs (
  worker_id uuid not null references public.users (id) on delete cascade,
  job_post_id uuid not null references public.job_posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (worker_id, job_post_id)
);

alter table public.saved_jobs enable row level security;

drop policy if exists "worker manages own saved jobs" on public.saved_jobs;
create policy "worker manages own saved jobs"
  on public.saved_jobs
  for all
  using (worker_id = auth.uid())
  with check (worker_id = auth.uid());
