# Extra İşler

## Amaç

Muğla bölgesinde otel ve organizasyonların günlük/sezonluk personel ihtiyacını
işçilerle eşleştiren bir platform. Buna ek olarak "Bi' Zahmet" adı verilen bir
usta/hizmet talebi sistemi (elektrikçi, tesisatçı, boyacı vb. küçük iş
taleplerinin ustalarla eşleştirilmesi) ve kullanıcılar arası gerçek zamanlı
mesajlaşma barındırır.

## Kullanıcı Rolleri

- **worker** — iş ilanlarına başvuran, günlük/sezonluk çalışan kullanıcı.
- **employer** — otel/organizasyon adına iş ilanı açan kullanıcı.
- **usta (master)** — opsiyonel, ek bir profil katmanı. Bir kullanıcı aynı
  anda worker veya employer olabilir ve buna ek olarak `master_profiles`
  üzerinden "Bi' Zahmet" sisteminde usta olarak hizmet teklifi verebilir.
  Yani `role` (worker/employer) ile "usta olma" durumu birbirinden bağımsız,
  usta profili herkese açık opsiyonel bir ek profildir.

## Teknoloji

- **Frontend:** React Native, Expo (SDK 54)
- **Backend:** Supabase (Postgres + Auth + Storage + Realtime)
- Supabase veritabanı (migration'lar, tablolar, RLS politikaları) önceki
  projeden sağlam duruyor — sadece frontend sıfırdan yazılıyor.

## Ana Özellikler

1. **Auth** — email/password ve Google OAuth ile giriş/kayıt.
2. **Profiller** — worker profili (yetenekler, müsaitlik durumu/tarihi, bio),
   employer profili (işletme adı, konum, açıklama), opsiyonel usta profili.
3. **İş İlanları (job_posts)** — employer'ların açtığı günlük veya sezonluk
   ilanlar; işçiler başvurur (`applications`), employer kabul/red eder.
4. **Bi' Zahmet (service_requests)** — kullanıcıların usta talebi açması
   (kategori, açıklama, fiyat, aciliyet, konum), ustaların teklif vermesi
   (`service_offers`), iş öncesi/sonrası fotoğraf paylaşımı
   (`service_photos`).
5. **Mesajlaşma** — kullanıcılar arası gerçek zamanlı (Supabase Realtime)
   birebir konuşmalar (`conversations`, `messages`).
6. **Puanlama Sistemi** — tamamlanan iş/başvuru sonrası karşılıklı puanlama
   (`ratings`).
7. **Bildirimler** — kullanıcıya uygulama içi/push bildirimler.
8. **WhatsApp paylaşım köprüsü** — ilanları tek dokunuşla WhatsApp grubuna paylaşma.
9. **Acil ilan bildirimleri** — "acil" işaretli ilanlar için işçilere push bildirimi.
10. **Favori personel + davet** — işverenin güvendiği işçileri favoriye alıp doğrudan yeni bir ilana davet etmesi.
11. **Ekip halinde başvuru** — işçilerin bir ilana birden fazla kişilik ekip olarak başvurabilmesi.
12. **İlçe filtresi + dil etiketi** — Muğla ilçesine göre ilan filtreleme, ilan/profilde konuşulan dil bilgisi.
13. **"Bi' Zahmet" tam işlevselliği** — usta olma, talep oluşturma, teklif verme/kabul etme, iş tamamlama + before/after fotoğraf yükleme.
14. **Puanlama sistemi** — iş/talep tamamlandığında karşılıklı 1-5 yıldız + yorum, profilde ortalama puan.
15. **Usta arama/keşif ekranı** — kategoriye göre usta listeleme ve mesaj gönderme.
16. **Talep iptali** — "Bi' Zahmet" talebinin sahibi tarafından iptal edilebilmesi.
17. **Before/after fotoğraf galerisi** — tamamlanan talebin fotoğraflarının görüntülenmesi.
18. **Okunmamış mesaj rozeti** — Mesajlar sekmesinde okunmamış sayaç, sohbet açılınca okundu işaretleme.
19. **Metin arama** — ilan ve talep listelerinde başlık/pozisyon arama.
20. **Genişletilmiş bildirimler** — yeni mesaj, başvuru durumu, yeni teklif, iş daveti için push bildirimi.
21. **Yeniden tasarlanan profil ekranı** — rol bazlı istatistikler, puan özeti, profil düzenleme (yeni), CV/belge yükleme (yeni).
22. **Yeniden tasarlanan ana sayfa + tek merkezden renk paleti** — segment sekmeleri, ilçe filtresi, öne çıkan ilan/talep kartları; tüm uygulamanın renk paleti tek dosyadan yönetiliyor.
23. **"Ayarlar" sekmesi** — alt navigasyondaki "Profil" sekmesi "Ayarlar"a dönüştürüldü: Profilim, Şifre Değiştir, Arkadaşlarını Davet Et, Uygulamayı Değerlendir, Destek Merkezi.
24. **Yeniden tasarlanan iş ilanları listesi + kapak fotoğrafı düzeltmesi** — arama/filtre çubuğu, büyük görsel kartlar; ilan kapak fotoğrafları artık gösteriliyor.
25. **Şifre değiştirme ve Destek Merkezi** — Ayarlar menüsündeki bu iki öğe artık gerçek ekranlara bağlı (gerçek şifre güncelleme, SSS + WhatsApp destek hattı).
26. **Kaydedilen İlanlar** — işçilerin bir ilanı kalıcı olarak kaydedip ayrı bir listeden tekrar bulabilmesi.
27. **İşveren ilan durumu yönetimi + başvuran CV görüntüleme** — işveren bir ilanı dolu/kapalı/iptal olarak işaretleyebiliyor, başvuranların yüklediği CV/belgeleri görüntüleyebiliyor.
28. **İlk açılış tanıtımı (onboarding)** — uygulamanın ilk açılışında 3 sayfalık kısa bir tanıtım akışı.

Bu özelliklerin şema/kurulum detayları için bkz. `SCHEMA.md` → "Yeni Özellikler".

## Notlar

- Bu proje daha önce geliştirilmiş, bilgisayar arızası nedeniyle frontend
  kodu kayboldu. Supabase backend'i (şema, RLS, migration'lar) sağlam,
  yeniden oluşturulmasına gerek yok — bkz. `SCHEMA.md`.
- Frontend Expo ile sıfırdan yazılıyor.
