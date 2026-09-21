import { Icon } from "@iconify/react";

export function Profile() {
  return (
    <main className="min-h-screen bg-background text-foreground pb-24">
      <section className="relative px-4 pt-4">
        <div className="relative h-36 w-full overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-primary via-[#24543F] to-[#16382A] p-4 shadow-sm">
          <div className="flex items-center justify-between text-white">
            <span className="text-xs font-bold uppercase tracking-wider text-white/80">
              Kullanıcı Profili
            </span>
            <div className="flex items-center gap-2">
              <button
                aria-label="Ayarlar"
                className="flex size-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition-colors active:bg-white/25"
              >
                <Icon icon="ph:gear-six" width={20} height={20} />
              </button>
              <button
                aria-label="Profili Düzenle"
                className="flex size-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition-colors active:bg-white/25"
              >
                <Icon icon="ph:pencil-simple" width={20} height={20} />
              </button>
            </div>
          </div>
        </div>
        <article className="relative -mt-14 rounded-[1.25rem] bg-card px-5 pb-6 pt-0 shadow-[0_12px_35px_rgba(44,24,16,0.12)]">
          <div className="flex items-end justify-between">
            <div className="relative -mt-10 inline-block">
              <img
                src="https://lh3.googleusercontent.com/a/ACg8ocInxpBrmnSC286K5N_TmXyq1JfQaaNMWh_WSKmtOgtArDULEQ=s96-c"
                alt="Arda Kirarslan"
                className="size-20 rounded-full border-4 border-card object-cover shadow-md"
              />
              <span
                className="absolute bottom-1 right-1 flex size-5 items-center justify-center rounded-full bg-emerald-600 text-white ring-2 ring-card"
                title="Doğrulanmış Profil"
              >
                <Icon icon="ph:check-bold" width={12} height={12} />
              </span>
            </div>
            <div className="pb-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                <span className="size-2 rounded-full bg-primary animate-pulse" />
                İş Arıyor
              </span>
            </div>
          </div>
          <div className="mt-3">
            <h1 className="font-heading text-2xl font-extrabold tracking-[-0.03em] text-primary">
              Arda Kirarslan
            </h1>
            <p className="mt-0.5 text-sm font-semibold text-muted-foreground">
              Otelcilik & Misafir İlişkileri Uzmanı
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Icon icon="ph:map-pin" className="text-primary" width={14} height={14} />
                Antalya / Kaş
              </span>
              <span className="flex items-center gap-1">
                <Icon icon="ph:star-fill" className="text-accent" width={14} height={14} />
                4.9 (18 Değerlendirme)
              </span>
              <span className="flex items-center gap-1">
                <Icon icon="ph:clock" className="text-primary" width={14} height={14} />5 Yıl
                Deneyim
              </span>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2.5">
            <div className="rounded-2xl bg-input p-3 text-center">
              <p className="text-[0.68rem] font-medium text-muted-foreground">Tamamlanan</p>
              <p className="mt-1 text-base font-extrabold text-foreground">24 İş</p>
            </div>
            <div className="rounded-2xl bg-input p-3 text-center">
              <p className="text-[0.68rem] font-medium text-muted-foreground">Aktif Başvuru</p>
              <p className="mt-1 text-base font-extrabold text-accent">3 İlan</p>
            </div>
            <div className="rounded-2xl bg-input p-3 text-center">
              <p className="text-[0.68rem] font-medium text-muted-foreground">Kabul Oranı</p>
              <p className="mt-1 text-base font-extrabold text-primary">%96</p>
            </div>
          </div>
        </article>
        <article className="mt-4 rounded-[1.25rem] bg-card p-5 shadow-[0_8px_24px_rgba(44,24,16,0.06)]">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-base font-extrabold text-primary">
              Yetenekler & Uzmanlık
            </h2>
            <button className="text-xs font-bold text-accent">Düzenle</button>
          </div>
          <div className="mt-3.5 flex flex-wrap gap-2">
            <span className="rounded-full bg-input px-3 py-1.5 text-xs font-semibold text-foreground">
              Ön Büro Yönetimi
            </span>
            <span className="rounded-full bg-input px-3 py-1.5 text-xs font-semibold text-foreground">
              Opera PMS
            </span>
            <span className="rounded-full bg-input px-3 py-1.5 text-xs font-semibold text-foreground">
              İngilizce (C1)
            </span>
            <span className="rounded-full bg-input px-3 py-1.5 text-xs font-semibold text-foreground">
              Misafir Karşılama
            </span>
            <span className="rounded-full bg-input px-3 py-1.5 text-xs font-semibold text-foreground">
              Rezervasyon
            </span>
            <span className="rounded-full bg-input px-3 py-1.5 text-xs font-semibold text-foreground">
              Almanca (B1)
            </span>
          </div>
        </article>
        <article className="mt-4 rounded-[1.25rem] bg-card p-5 shadow-[0_8px_24px_rgba(44,24,16,0.06)]">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-base font-extrabold text-primary">
              Özgeçmiş & Belgeler
            </h2>
            <span className="text-xs font-semibold text-muted-foreground">2 Belge</span>
          </div>
          <div className="mt-3.5 space-y-2.5">
            <div className="flex items-center justify-between rounded-2xl bg-input p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon icon="ph:file-pdf" width={22} height={22} />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Arda_Kirarslan_CV.pdf</p>
                  <p className="text-xs text-muted-foreground">Güncellendi: 3 gün önce • 1.2 MB</p>
                </div>
              </div>
              <button
                aria-label="CV Görüntüle"
                className="flex size-8 items-center justify-center rounded-full bg-card text-primary shadow-sm"
              >
                <Icon icon="ph:arrow-square-out" width={16} height={16} />
              </button>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-input p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
                  <Icon icon="ph:certificate" width={22} height={22} />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Turizm & Otelcilik Sertifikası
                  </p>
                  <p className="text-xs text-muted-foreground">MEB Onaylı • PDF</p>
                </div>
              </div>
              <button
                aria-label="Sertifika Görüntüle"
                className="flex size-8 items-center justify-center rounded-full bg-card text-primary shadow-sm"
              >
                <Icon icon="ph:arrow-square-out" width={16} height={16} />
              </button>
            </div>
          </div>
        </article>
        <article className="mt-4 rounded-[1.25rem] bg-card p-2 shadow-[0_8px_24px_rgba(44,24,16,0.06)]">
          <button className="flex w-full items-center justify-between rounded-xl p-3.5 text-left transition-colors active:bg-input">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-input text-primary">
                <Icon icon="ph:paper-plane-tilt" width={18} height={18} />
              </div>
              <span className="text-sm font-bold text-foreground">Başvurduğum İlanlar</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent">
                3 Aktif
              </span>
              <Icon icon="ph:caret-right" width={16} height={16} />
            </div>
          </button>
          <div className="mx-3 h-px bg-border/60" />
          <button className="flex w-full items-center justify-between rounded-xl p-3.5 text-left transition-colors active:bg-input">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-input text-primary">
                <Icon icon="ph:bookmark-simple" width={18} height={18} />
              </div>
              <span className="text-sm font-bold text-foreground">Kaydedilen İlanlar</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="text-xs font-medium">8 İlan</span>
              <Icon icon="ph:caret-right" width={16} height={16} />
            </div>
          </button>
          <div className="mx-3 h-px bg-border/60" />
          <button className="flex w-full items-center justify-between rounded-xl p-3.5 text-left transition-colors active:bg-input">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-input text-primary">
                <Icon icon="ph:sliders-horizontal" width={18} height={18} />
              </div>
              <span className="text-sm font-bold text-foreground">İş Arama Tercihleri</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Icon icon="ph:caret-right" width={16} height={16} />
            </div>
          </button>
          <div className="mx-3 h-px bg-border/60" />
          <button className="flex w-full items-center justify-between rounded-xl p-3.5 text-left transition-colors active:bg-input">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-input text-destructive">
                <Icon icon="ph:sign-out" width={18} height={18} />
              </div>
              <span className="text-sm font-bold text-destructive">Çıkış Yap</span>
            </div>
          </button>
        </article>
      </section>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border/80 bg-card/95 px-6 py-2.5 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <button className="flex flex-1 flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-primary">
            <Icon icon="ph:compass" width={22} height={22} />
            <span className="text-[0.68rem] font-semibold">Keşfet</span>
          </button>
          <button className="flex flex-1 flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-primary">
            <Icon icon="ph:briefcase" width={22} height={22} />
            <span className="text-[0.68rem] font-semibold">Başvurular</span>
          </button>
          <button className="flex flex-1 flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-primary">
            <Icon icon="ph:chat-circle-dots" width={22} height={22} />
            <span className="text-[0.68rem] font-semibold">Mesajlar</span>
          </button>
          <button className="flex flex-1 flex-col items-center gap-1 text-primary">
            <Icon icon="ph:user-circle-fill" width={22} height={22} />
            <span className="text-[0.68rem] font-bold">Profil</span>
          </button>
        </div>
      </nav>
    </main>
  );
}
