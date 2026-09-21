# Supabase Şeması

> Bu tablolar Supabase'de zaten mevcut (migration'lar, RLS politikaları dahil).
> Bu dosya sadece dokümantasyon amaçlı yeniden oluşturulmuştur; tablo/kolon
> isimleri frontend geliştirirken referans olarak kullanılmalıdır.
>
> **Kurulum notu:** Bu dosyadaki `is_urgent`, `district`, `required_languages`,
> `languages`, `team_size`, `team_members` kolonları ve `favorite_workers`,
> `job_invites`, `push_tokens` tabloları henüz Supabase'de yok. Bunları
> eklemek için `supabase/schema_updates.sql` dosyasını Supabase Dashboard >
> SQL Editor'de bir kere çalıştır (idempotent, tekrar çalıştırmak güvenli).
> Acil ilan push bildirimi için ayrıca `supabase/functions/notify-urgent-job`
> fonksiyonunu deploy edip bir Database Webhook bağlaman gerekiyor — bkz.
> "Yeni Özellikler" bölümü.

## users

Ana kullanıcı tablosu.

| Kolon | Tip / Açıklama |
|---|---|
| id | uuid, PK |
| email | text |
| phone | text |
| name | text |
| role | `worker` \| `employer` \| `null` |
| created_at | timestamp |

## employer_profiles

`users`'a 1-1 ek profil (employer rolü için).

| Kolon | Tip / Açıklama |
|---|---|
| user_id | uuid, FK → users.id |
| business_name | text |
| location | text |
| description | text |

## worker_profiles

`users`'a 1-1 ek profil (worker rolü için).

| Kolon | Tip / Açıklama |
|---|---|
| user_id | uuid, FK → users.id |
| skills | text[] |
| availability_status | text |
| available_from | date |
| available_to | date |
| bio | text |
| district *(yeni)* | text — işçinin bulunduğu Muğla ilçesi |
| languages *(yeni)* | text[], default `{}` — konuştuğu diller |

## master_profiles

Opsiyonel "usta" profili — worker veya employer'a ek olarak edinilebilir.

| Kolon | Tip / Açıklama |
|---|---|
| user_id | uuid, FK → users.id |
| skills | text[] |
| bio | text |

## job_posts

Employer'ların açtığı iş ilanları.

| Kolon | Tip / Açıklama |
|---|---|
| id | uuid, PK |
| employer_id | uuid, FK → users.id |
| title | text |
| position | text |
| date | date |
| needed_worker_count | int |
| daily_wage | numeric |
| description | text |
| status | text |
| duration_type | `daily` \| `seasonal` |
| cover_photo_url | text |
| is_urgent *(yeni)* | boolean, default false — acil ilan bildirimi tetikler |
| district *(yeni)* | text — Muğla ilçesi (bkz. `MUGLA_DISTRICTS`) |
| required_languages *(yeni)* | text[], default `{}` |

## applications

Worker'ların iş ilanlarına başvuruları.

| Kolon | Tip / Açıklama |
|---|---|
| id | uuid, PK |
| job_post_id | uuid, FK → job_posts.id |
| worker_id | uuid, FK → users.id |
| status | `pending` \| `accepted` \| `rejected` \| `auto_cancelled` \| `completed` |
| applied_at | timestamp |
| completed_at | timestamp |
| team_size *(yeni)* | int, default 1 — ekip halinde başvuruda toplam kişi sayısı |
| team_members *(yeni)* | text[], default `{}` — ekip arkadaşlarının adları |

## service_requests

"Bi' Zahmet" — kullanıcıların açtığı usta/hizmet talepleri.

| Kolon | Tip / Açıklama |
|---|---|
| id | uuid, PK |
| requester_id | uuid, FK → users.id |
| category | text |
| title | text |
| description | text |
| price | numeric |
| is_urgent | boolean |
| needed_date | date |
| location | text |
| status | `open` \| `in_progress` \| `completed` \| `cancelled` |

## service_offers

Ustaların hizmet taleplerine verdiği teklifler.

| Kolon | Tip / Açıklama |
|---|---|
| id | uuid, PK |
| request_id | uuid, FK → service_requests.id |
| master_id | uuid, FK → users.id |
| offered_price | numeric |
| message | text |
| status | `pending` \| `accepted` \| `rejected` |

## service_photos

Hizmet talebi öncesi/sonrası fotoğrafları.

| Kolon | Tip / Açıklama |
|---|---|
| id | uuid, PK |
| request_id | uuid, FK → service_requests.id |
| photo_url | text |
| type | `before` \| `after` |
| uploaded_by | uuid, FK → users.id |

## ratings

İş/başvuru veya "Bi' Zahmet" talebi sonrası karşılıklı puanlama.

| Kolon | Tip / Açıklama |
|---|---|
| id | uuid, PK |
| application_id | uuid, nullable, FK → applications.id |
| service_request_id *(yeni)* | uuid, nullable, FK → service_requests.id |
| rater_id | uuid, FK → users.id |
| rated_id | uuid, FK → users.id |
| rater_role | enum (`worker`, `employer`, artı *(yeni)* `master`, `requester`) |
| score | int |
| comment | text |

> `application_id`/`service_request_id`'den **tam biri** dolu olmalı (check
> constraint). Orijinal şema sadece `application_id`'yi destekliyordu;
> `schema_updates.sql` bunu "Bi' Zahmet" tarafını da kapsayacak şekilde
> genişletiyor.

## conversations

Birebir mesajlaşma oturumları.

| Kolon | Tip / Açıklama |
|---|---|
| id | uuid, PK |
| participant_1_id | uuid, FK → users.id |
| participant_2_id | uuid, FK → users.id |
| created_at | timestamp |
| last_message_at | timestamp |

## messages

Konuşma içi mesajlar (Realtime ile dinlenir).

| Kolon | Tip / Açıklama |
|---|---|
| id | uuid, PK |
| conversation_id | uuid, FK → conversations.id |
| sender_id | uuid, FK → users.id |
| content | text |
| created_at | timestamp |
| read_at | timestamp |

## public_user_info (view)

Diğer kullanıcılara güvenli şekilde gösterilebilecek public alanlar.

| Kolon | Tip / Açıklama |
|---|---|
| id | uuid |
| name | text |
| role | text |
| created_at | timestamp |

## favorite_workers *(yeni)*

İşverenin sık çalıştığı/güvendiği personel havuzu.

| Kolon | Tip / Açıklama |
|---|---|
| employer_id | uuid, FK → users.id, PK (birlikte) |
| worker_id | uuid, FK → users.id, PK (birlikte) |
| created_at | timestamp |

## job_invites *(yeni)*

İşverenin favori personeli doğrudan bir ilana davet etmesi.

| Kolon | Tip / Açıklama |
|---|---|
| id | uuid, PK |
| job_post_id | uuid, FK → job_posts.id |
| employer_id | uuid, FK → users.id |
| worker_id | uuid, FK → users.id |
| status | `pending` \| `accepted` \| `declined` |
| created_at | timestamp |

## push_tokens *(yeni)*

Acil ilan bildirimleri için Expo push token kaydı.

| Kolon | Tip / Açıklama |
|---|---|
| user_id | uuid, PK, FK → users.id |
| token | text |
| updated_at | timestamp |

## worker_documents *(yeni)*

Profil ekranındaki "Özgeçmiş & Belgeler" — CV/sertifika yükleme.

| Kolon | Tip / Açıklama |
|---|---|
| id | uuid, PK |
| worker_id | uuid, FK → users.id |
| name | text |
| file_url | text |
| file_size | bigint, nullable |
| created_at | timestamp |

---

## Yeni Özellikler (2026-09-20 talebi)

1. **WhatsApp paylaşım köprüsü** — `src/lib/share.ts`, ilan detayında ve
   işverenin kendi ilan yönetim ekranında WhatsApp ikonuna dokunarak ilanı
   gruba paylaşma. Şema değişikliği gerektirmez.
2. **Acil ilan bildirimleri** — `job_posts.is_urgent` + `push_tokens` +
   `supabase/functions/notify-urgent-job`. Kurulum:
   - `supabase functions deploy notify-urgent-job`
   - Dashboard > Database > Webhooks: `job_posts` tablosunda `INSERT`
     olayında bu fonksiyonu çağıracak bir webhook oluştur.
   - `app.json`'a `extra.eas.projectId` eklemek gerekiyor (`eas init` ile).
3. **Favori personel + davet** — `favorite_workers`, `job_invites`,
   `src/app/favorites.tsx`. İşveren, başvuran bir işçiyi yıldızlayıp favoriye
   ekleyebilir; favoriler ekranından açık bir ilana doğrudan davet
   gönderebilir. İşçi, Başvurularım sekmesinde daveti kabul/reddedebilir.
4. **Ekip halinde başvuru** — `applications.team_size` / `team_members`.
   İşçi, ilan detayında "Ekip olarak başvur" açıp arkadaşlarının adlarını
   virgülle ayırarak ekleyebilir; işveren başvuru kartında ekip rozetini
   görür.
5. **İlçe filtresi + dil etiketi** — `job_posts.district` /
   `required_languages`, `worker_profiles.district` / `languages`. İlan
   listesinde ilçeye göre filtre çubuğu, ilan oluşturma ve profil
   tamamlamada ilçe/dil seçimi (`src/constants/locations.ts`).
6. **İlan kapak fotoğrafı yükleme** (2026-09-21) — `post-job.tsx`'e galeriden
   fotoğraf seçme eklendi (`expo-image-picker`), seçilen fotoğraf Supabase
   Storage'a yükleniyor ve `job_posts.cover_photo_url`'e public URL olarak
   kaydediliyor. **Kurulum gerekiyor:** Supabase Dashboard > Storage'da
   `job-covers` adında **public** bir bucket oluştur (anon key ile bucket
   oluşturulamıyor, RLS engelliyor — dashboard'dan elle yapılmalı). Bucket
   yoksa ilan oluşturulurken fotoğraf yükleme adımı hata verir.
7. **"Bi' Zahmet" tam işlevselliği** (2026-09-21) — şema değişikliği
   gerektirmiyor, sadece frontend. Yeni ekranlar:
   - `master-setup.tsx` — usta olma formu (`master_profiles` upsert).
   - `service-requests/create.tsx` — talep oluşturma; `is_urgent`/`status`
     kasıtlı olarak gönderilmiyor, Supabase trigger'ı hesaplıyor.
   - `service-requests/[id].tsx` — rol bazlı aksiyonlar: talep sahibi teklif
     sayısını görüp `offers/[id]`'e gider, `in_progress` ise
     `complete/[id]`'e; usta teklif verir/durumunu görür; ne biri ne diğeriyse
     "Usta Ol" CTA'sı.
   - `service-requests/offers/[id].tsx` — gelen teklifler + kabul etme.
     Kabul edilince trigger diğer teklifleri otomatik reddedip talebi
     `in_progress` yapıyor, client ekstra güncelleme yapmıyor.
   - `service-requests/complete/[id].tsx` — before/after fotoğraf zorunlu
     yükleme (`service-photos` bucket'ı — zaten mevcut, kurulum gerekmiyor),
     sonra `status: 'completed'`.
   - Profil ekranına usta profili bölümü + "Usta Ol" linki eklendi.
8. **Puanlama, keşif, iptal, bildirim genişletme, arama** (2026-09-21) —
   - **Puanlama sistemi** — `ratings` şema genişletmesi (yukarı bakınız).
     İş başvurusu tamamlandığında (`my-jobs/[id].tsx`'te "Tamamlandı Olarak
     İşaretle") veya "Bi' Zahmet" talebi tamamlandığında her iki taraf da
     `rate/[applicationId].tsx` / `rate/service/[requestId].tsx` üzerinden
     1-5 yıldız + yorum bırakabiliyor. Profilde ortalama puan gösteriliyor
     (`src/lib/ratings.ts`).
   - **Usta arama/keşif** — `src/app/masters.tsx`, kategoriye göre filtre,
     her usta kartında ortalama puan ve "Mesaj Gönder". Ana sayfaya "Ustalar"
     kartı eklendi.
   - **Talep iptali** — `service-requests/[id].tsx`'te talep sahibi için
     `open`/`in_progress` durumlarında onaylı "Talebi İptal Et" butonu.
   - **Before/after fotoğraf galerisi** — tamamlanan talep detayında
     `service_photos` öncesi/sonrası gruplu gösteriliyor.
   - **Okunmamış mesaj rozeti** — Mesajlar sekmesinde `tabBarBadge`
     (`src/lib/messages.ts`, 20 saniyede bir yenileniyor). Sohbet açılınca
     ve yeni mesaj geldiğinde `read_at` artık gerçekten güncelleniyor —
     önceden hiç güncellenmiyordu.
   - **Metin arama** — ilan listesinde başlık/pozisyon, talep listesinde
     başlık üzerinde arama çubuğu.
   - **Bildirim kapsamı genişletildi** — `supabase/functions/notify-event`
     tek fonksiyonla 4 olayı kapsıyor: yeni mesaj, başvuru kabul/red, yeni
     teklif, iş daveti. **Kurulum gerekiyor:**
     `supabase functions deploy notify-event`, sonra Dashboard > Database >
     Webhooks'tan şu 4 satırı (hepsi bu fonksiyona) ekle:
     `messages` INSERT, `applications` UPDATE, `service_offers` INSERT,
     `job_invites` INSERT.
9. **Profil ekranı yeniden tasarımı + profil düzenleme + CV yükleme**
   (2026-09-21) — `profile/` klasöründeki tasarım kaynağı uygulandı.
   - `(tabs)/profile.tsx` tamamen yeniden tasarlandı: banner, rozetli avatar,
     rol bazlı istatistik kutuları (işçi: tamamlanan/aktif başvuru/kabul
     oranı — işveren: açık ilan/toplam başvuru/tamamlanan iş), puan özeti,
     yetenek/işletme kartı, usta bölümü, CV/Belgeler kartı, gezinme listesi.
   - **Profil düzenleme daha önce hiç yoktu** — `complete-profile.tsx`
     sadece ilk kurulum içindi, sonradan düzenlemenin bir yolu yoktu. Ortak
     form mantığı `src/components/profile-form.tsx`'e çıkarıldı (artık
     mevcut veriyi önceden dolduruyor) ve yeni `edit-profile.tsx` route'u
     eklendi — profildeki kalem/"Düzenle" butonları buraya gidiyor.
   - **CV/Belge yükleme yeni bir özellik** — `worker_documents` tablosu +
     `expo-document-picker` (yeni bağımlılık, `npx expo install` ile
     eklendi) + `src/lib/documents.ts`. **Kurulum gerekiyor:** Supabase
     Dashboard > Storage'da `worker-documents` adında **public** bir bucket
     oluştur (`job-covers` ile aynı sebepten anon key ile oluşturulamıyor).
   - Tasarımdaki "Kaydedilen İlanlar" ve "İş Arama Tercihleri" öğeleri
     kasıtlı olarak eklenmedi — bunlar için karşılık gelen bir veri modeli
     yok (gerçek "kaydedilen ilan" tablosu, arama tercihi şeması). Onun
     yerine gerçekten çalışan "Başvurduğum İlanlar"/"İlanlarım" ve
     "Favori Personelim" bağlantıları kondu.
10. **Ana sayfa yeniden tasarımı + tüm uygulamada renk paleti tutarlılığı**
    (2026-09-21) — `home/` klasöründeki tasarım kaynağı uygulandı, şema
    değişikliği gerektirmiyor.
    - `(tabs)/index.tsx` tamamen yeniden yapıldı: segment sekmeleri
      (Sezonluk/Günlük/Usta Talebi, her birinde gerçek sayı), ilçe filtre
      çubuğu, acil ilan/talep sayısını gösteren banner, gerçek verilerle
      "Öne Çıkan İlanlar/Talepler" kartları (kapak fotoğrafı, rozetler,
      fiyat, konum). Kaydet/bookmark ikonu (job-detail-page'deki gibi)
      sadece oturum içi görsel bir anahtar, kalıcı değil.
      "Otel & Konaklama" gibi tasarımdaki iş kategorisi filtreleri
      kasıtlı atlandı — `job_posts`'ta böyle bir alan yok; yerine mevcut
      ilçe filtresi kondu.
    - **Tüm uygulamanın renk paleti tek merkezden değiştirildi** —
      `src/constants/theme.ts` ve `src/constants/auth-theme.ts`'deki renkler
      job-detail-page/profile'da kullanılan sıcak yeşil/turuncu palete
      taşındı. `ThemedView`/`ThemedText` bu dosyalardan renk aldığı için
      bu tek değişiklik, ayrı ayrı dokunmadan uygulamanın geri kalanının
      (ilan/talep listeleri, mesajlar, favoriler, ustalar, formlar) rengini
      otomatik güncelledi. Ayrıca kod genelinde tek tek yazılmış eski mavi
      ton (`#E9F3FE`, `#208AEF`) kullanan ~13 dosya da elle temizlendi.
11. **Alt navigasyonda "Profil" → "Ayarlar" + Ayarlar tasarımı** (2026-09-21)
    — şema değişikliği gerektirmiyor. `(tabs)/_layout.tsx`'teki sekme
    "Ayarlar" oldu; `(tabs)/profile.tsx` 5 satırlık bir menüye dönüştürüldü:
    Profilim (gerçek, `/my-profile`'a gider), Şifre Değiştir, Arkadaşlarını
    Davet Et, Uygulamayı Değerlendir, Destek Merkezi. O sıradaki durumları
    dürüstçe "yakında" (`coming-soon.tsx`) ekranına gidiyordu — Şifre
    Değiştir ve Destek Merkezi bu turda (bkz. madde 14) gerçek ekranlara
    bağlandı. `settings/` klasöründeki tasarım kaynağı menü kartına
    uygulandı. Ana sayfada kullanıcının kendi avatarına dokunmak
    `/my-profile`'a yönlendiriyor.
12. **İş ilanları sekmesi yeniden tasarımı + kapak fotoğrafı düzeltmesi**
    (2026-09-21) — `job-listings/` klasöründeki tasarım kaynağı
    `jobs/index.tsx`'e uygulandı (arama çubuğu, süre/ilçe filtre çipleri,
    büyük görsel kartlar). Bu ekranda ilan kapak fotoğrafları o zamana kadar
    hiç render edilmiyordu — kart görselleri artık `cover_photo_url`'i
    gösteriyor.
13. **Gerçekçi demo ilanlar** (2026-09-21) — kullanıcı tüm gerçek/test
    ilanlarını ve başvuruları SQL ile temizledikten sonra, temaya uygun
    LoremFlickr fotoğraflarıyla 6 gerçekçi demo ilan eklendi (otel, restoran,
    tekne turu vb.). Şema değişikliği gerektirmiyor, sadece veri.
14. **Şifre değiştirme, destek merkezi, kaydedilen ilanlar, ilan durumu
    yönetimi, CV görüntüleme, ilk açılış tanıtımı** (2026-09-21) —
    - **Şifre Değiştir** (`change-password.tsx`) — `supabase.auth.updateUser`
      ile gerçek şifre değişimi; Ayarlar menüsündeki ilgili satır artık
      buraya gidiyor.
    - **Destek Merkezi** (`support-center.tsx`) — statik SSS akordeonu +
      WhatsApp'tan yazma butonu. **Not:** `SUPPORT_WHATSAPP_NUMBER`
      içindeki numara placeholder — gerçek destek numarasıyla
      değiştirilmeli.
    - **Kaydedilen İlanlar (gerçek, kalıcı)** — yeni `saved_jobs` tablosu
      (yukarı bakınız) + `src/lib/saved-jobs.ts`. Daha önce (madde 9/10'da
      not edildiği gibi) sadece oturum içi/sahte bir yer imi ikonuydu; artık
      `jobs/[id].tsx`, `jobs/index.tsx` ve ana sayfadaki tüm kaydet
      ikonları gerçek insert/delete yapıyor. Yeni `saved-jobs.tsx` listesi,
      `my-profile.tsx`'te işçi rolü için "Kaydedilen İlanlar" satırı
      eklendi.
    - **İşveren ilan durumu yönetimi** — `my-jobs/[id].tsx`'te açık bir ilan
      için "Doldu Olarak İşaretle" / "İlanı Kapat" / "İptal Et" butonları,
      `job_posts.status`'u günceller.
    - **İşveren için başvuranın CV'sini görüntüleme** — `worker_documents`
      tablosuna işveren-okuma RLS politikası eklendi (yukarı bakınız);
      `my-jobs/[id].tsx`'te her başvuranın belgeleri varsa "CV Görüntüle"
      butonu açılıp dosya bağlantısını tarayıcıda açıyor.
    - **Basit ilk açılış tanıtımı** — yeni `onboarding.tsx` (3 sayfalık
      kaydırmalı tanıtım: iş ilanları, Bi' Zahmet, mesajlaşma/puanlama) +
      `src/providers/onboarding-provider.tsx` (AsyncStorage'da
      `hasSeenOnboarding` bayrağı). `_layout.tsx`'e oturum/profil
      guard'larından önce çalışan yeni bir guard eklendi — uygulama daha
      önce hiç açılmamışsa (giriş yapılı olsa da olmasa da) önce bu ekran
      gösteriliyor, "Geç" veya son sayfada "Hemen Başla" ile geçiliyor.
