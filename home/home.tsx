import { Icon } from "@iconify/react";

export function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground pb-24">
      <header className="sticky top-0 z-30 bg-background/95 px-4 pt-4 pb-3 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://lh3.googleusercontent.com/a/ACg8ocInxpBrmnSC286K5N_TmXyq1JfQaaNMWh_WSKmtOgtArDULEQ=s96-c"
              alt="Arda Kirarslan"
              className="size-10 rounded-full border-2 border-card object-cover shadow-sm"
            />
            <div>
              <p className="text-[0.7rem] font-medium text-muted-foreground uppercase tracking-wider">
                Konum
              </p>
              <button className="flex items-center gap-1 text-sm font-extrabold text-foreground transition-colors hover:text-primary">
                <Icon icon="ph:map-pin-fill" className="text-accent" width={15} height={15} />
                <span>Kaş, Antalya</span>
                <Icon
                  icon="ph:caret-down-bold"
                  className="text-muted-foreground"
                  width={12}
                  height={12}
                />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              aria-label="Arama"
              className="flex size-10 items-center justify-center rounded-full bg-card text-foreground shadow-sm border border-border/60"
            >
              <Icon icon="ph:magnifying-glass" width={18} height={18} />
            </button>
            <button
              aria-label="Bildirimler"
              className="relative flex size-10 items-center justify-center rounded-full bg-card text-foreground shadow-sm border border-border/60"
            >
              <Icon icon="ph:bell" width={18} height={18} />
              <span className="absolute top-2 right-2 size-2 rounded-full bg-accent ring-2 ring-card" />
            </button>
          </div>
        </div>
        <div className="mt-4 flex rounded-2xl bg-input p-1">
          <button className="flex-1 rounded-xl bg-card py-2.5 px-1.5 text-center shadow-sm text-primary transition-all">
            <div className="flex items-center justify-center gap-1.5">
              <Icon icon="ph:sun-dim-fill" className="text-accent" width={16} height={16} />
              <span className="text-xs font-extrabold">Sezonluk</span>
            </div>
            <span className="block text-[0.62rem] font-semibold text-muted-foreground mt-0.5">
              142 İlan
            </span>
          </button>
          <button className="flex-1 rounded-xl py-2.5 px-1.5 text-center text-muted-foreground transition-all hover:text-foreground">
            <div className="flex items-center justify-center gap-1.5">
              <Icon icon="ph:calendar-check" width={16} height={16} />
              <span className="text-xs font-bold">Günlük</span>
            </div>
            <span className="block text-[0.62rem] font-medium text-muted-foreground mt-0.5">
              38 İlan
            </span>
          </button>
          <button className="flex-1 rounded-xl py-2.5 px-1.5 text-center text-muted-foreground transition-all hover:text-foreground">
            <div className="flex items-center justify-center gap-1.5">
              <Icon icon="ph:wrench" width={16} height={16} />
              <span className="text-xs font-bold">Usta Talebi</span>
            </div>
            <span className="block text-[0.62rem] font-medium text-muted-foreground mt-0.5">
              19 Talep
            </span>
          </button>
        </div>
      </header>
      <section className="mt-1">
        <div className="flex gap-2 overflow-x-auto px-4 pb-2 pt-1 no-scrollbar">
          <button className="shrink-0 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground shadow-sm">
            Tümü (142)
          </button>
          <button className="shrink-0 rounded-full bg-card px-4 py-1.5 text-xs font-semibold text-muted-foreground border border-border/70 shadow-xs hover:text-foreground">
            Otel & Konaklama
          </button>
          <button className="shrink-0 rounded-full bg-card px-4 py-1.5 text-xs font-semibold text-muted-foreground border border-border/70 shadow-xs hover:text-foreground">
            Restoran & Bar
          </button>
          <button className="shrink-0 rounded-full bg-card px-4 py-1.5 text-xs font-semibold text-muted-foreground border border-border/70 shadow-xs hover:text-foreground">
            Yat & Denizcilik
          </button>
          <button className="shrink-0 rounded-full bg-card px-4 py-1.5 text-xs font-semibold text-muted-foreground border border-border/70 shadow-xs hover:text-foreground">
            Plaj & Beach Club
          </button>
        </div>
      </section>
      <section className="px-4 mt-2">
        <div className="relative overflow-hidden rounded-[1.25rem] bg-gradient-to-r from-primary to-[#2C5E48] p-4 text-primary-foreground shadow-md">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-2.5 py-0.5 text-[0.68rem] font-extrabold text-accent">
                <Icon icon="ph:lightning-fill" width={12} height={12} />
                Acil İhtiyaç
              </span>
              <h2 className="font-heading mt-1.5 text-base font-extrabold text-white">
                Bu Hafta Başlayacak İşler
              </h2>
              <p className="mt-0.5 text-xs text-white/80">
                Konaklama + Yemek dahil 18 yeni sezonluk ilan
              </p>
            </div>
            <button
              aria-label="İncele"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-sm"
            >
              <Icon icon="ph:arrow-right-bold" width={16} height={16} />
            </button>
          </div>
          <div className="absolute -bottom-8 -right-8 size-28 rounded-full bg-white/10 blur-xl" />
        </div>
      </section>
      <section className="px-4 mt-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-lg font-extrabold text-primary">Öne Çıkan İlanlar</h2>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
              Sezon 2025
            </span>
          </div>
          <button className="flex items-center gap-1 text-xs font-bold text-accent">
            <span>Filtrele</span>
            <Icon icon="ph:faders" width={14} height={14} />
          </button>
        </div>
        <article className="overflow-hidden rounded-[1.25rem] bg-card shadow-[0_10px_30px_rgba(44,24,16,0.08)] border border-border/50">
          <div className="relative h-44 w-full overflow-hidden">
            <img
              src="https://ggrhecslgdflloszjkwl.supabase.co/storage/v1/object/public/user-assets/67irDpa9Tml/components/HPEasscV2NF.jpeg"
              alt="Boutique Resort"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
              <span className="rounded-full bg-primary/90 px-3 py-1 text-[0.7rem] font-bold text-primary-foreground backdrop-blur-md shadow-xs">
                Sezonluk (6 Ay)
              </span>
              <button
                aria-label="Kaydet"
                className="flex size-9 items-center justify-center rounded-full bg-white/85 text-foreground shadow-sm backdrop-blur-md"
              >
                <Icon icon="ph:bookmark-simple" width={17} height={17} />
              </button>
            </div>
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[0.68rem] font-medium text-white backdrop-blur-md">
              <Icon icon="ph:house-line" width={13} height={13} />
              <span>Konaklama Sağlanıyor</span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-heading text-lg font-extrabold text-primary leading-snug">
                  Resepsiyon & Ön Büro Şefi
                </h3>
                <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                  Mavi Koy Luxury Hotel
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-extrabold text-foreground">₺45.000</p>
                <p className="text-[0.65rem] font-medium text-muted-foreground">+ Prim / Ay</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground border-t border-border/50 pt-3">
              <span className="flex items-center gap-1">
                <Icon icon="ph:map-pin" className="text-accent" width={14} height={14} />
                Kaş, Antalya
              </span>
              <span className="flex items-center gap-1">
                <Icon icon="ph:calendar-blank" className="text-primary" width={14} height={14} />
                Mayıs - Ekim
              </span>
              <span className="flex items-center gap-1">
                <Icon icon="ph:clock" className="text-primary" width={14} height={14} />
                Haftalık 45 Saat
              </span>
            </div>
          </div>
        </article>
        <article className="overflow-hidden rounded-[1.25rem] bg-card shadow-[0_10px_30px_rgba(44,24,16,0.08)] border border-border/50">
          <div className="relative h-44 w-full overflow-hidden">
            <img
              src="https://ggrhecslgdflloszjkwl.supabase.co/storage/v1/object/public/user-assets/67irDpa9Tml/components/5JX7kAnDra3.jpeg"
              alt="Artisan Cafe"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
              <span className="rounded-full bg-accent px-3 py-1 text-[0.7rem] font-extrabold text-accent-foreground backdrop-blur-md shadow-xs">
                Günlük İlan
              </span>
              <button
                aria-label="Kaydet"
                className="flex size-9 items-center justify-center rounded-full bg-white/85 text-foreground shadow-sm backdrop-blur-md"
              >
                <Icon icon="ph:bookmark-simple" width={17} height={17} />
              </button>
            </div>
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[0.68rem] font-medium text-white backdrop-blur-md">
              <Icon icon="ph:clock-countdown" width={13} height={13} />
              <span>Yarın Başlangıç • 08:30 - 17:00</span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-heading text-lg font-extrabold text-primary leading-snug">
                  Baş Barista (Etkinlik)
                </h3>
                <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                  Petra Roasting Co. Kalkan Pop-up
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-extrabold text-accent">₺2.400</p>
                <p className="text-[0.65rem] font-medium text-muted-foreground">Günlük Net</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground border-t border-border/50 pt-3">
              <span className="flex items-center gap-1">
                <Icon icon="ph:map-pin" className="text-accent" width={14} height={14} />
                Kalkan, Antalya
              </span>
              <span className="flex items-center gap-1">
                <Icon icon="ph:fork-knife" className="text-primary" width={14} height={14} />
                Yemek Dahil
              </span>
              <span className="flex items-center gap-1">
                <Icon icon="ph:credit-card" className="text-primary" width={14} height={14} />
                Aynı Gün Ödeme
              </span>
            </div>
          </div>
        </article>
        <article className="overflow-hidden rounded-[1.25rem] bg-card shadow-[0_10px_30px_rgba(44,24,16,0.08)] border border-border/50">
          <div className="relative h-44 w-full overflow-hidden">
            <img
              src="https://ggrhecslgdflloszjkwl.supabase.co/storage/v1/object/public/user-assets/67irDpa9Tml/components/194Cpzc1Qtt.jpeg"
              alt="Craftsman Woodwork"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
              <span className="rounded-full bg-[#3B5B4C] px-3 py-1 text-[0.7rem] font-bold text-white backdrop-blur-md shadow-xs">
                Usta Talebi
              </span>
              <button
                aria-label="Kaydet"
                className="flex size-9 items-center justify-center rounded-full bg-white/85 text-foreground shadow-sm backdrop-blur-md"
              >
                <Icon icon="ph:bookmark-simple" width={17} height={17} />
              </button>
            </div>
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[0.68rem] font-medium text-white backdrop-blur-md">
              <Icon icon="ph:shield-check" width={13} height={13} />
              <span>Malzeme Sahada Hazır</span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-heading text-lg font-extrabold text-primary leading-snug">
                  Ahşap Deck & Pergola Ustası
                </h3>
                <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                  Villa Bella Tadilat Projesi
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-extrabold text-foreground">₺32.000</p>
                <p className="text-[0.65rem] font-medium text-muted-foreground">
                  İş Başı / 4 Günlük
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground border-t border-border/50 pt-3">
              <span className="flex items-center gap-1">
                <Icon icon="ph:map-pin" className="text-accent" width={14} height={14} />
                Çukurbağ, Kaş
              </span>
              <span className="flex items-center gap-1">
                <Icon icon="ph:hammer" className="text-primary" width={14} height={14} />
                İnşaat / Marangoz
              </span>
              <span className="flex items-center gap-1">
                <Icon icon="ph:user-check" className="text-primary" width={14} height={14} />2 Usta
                Aranıyor
              </span>
            </div>
          </div>
        </article>
      </section>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-card/95 px-6 py-2.5 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <button className="flex flex-1 flex-col items-center gap-1 text-primary">
            <Icon icon="ph:compass-fill" width={22} height={22} />
            <span className="text-[0.68rem] font-bold">Keşfet</span>
          </button>
          <button className="flex flex-1 flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-primary">
            <Icon icon="ph:briefcase" width={22} height={22} />
            <span className="text-[0.68rem] font-semibold">Başvurular</span>
          </button>
          <button className="flex flex-1 flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-primary">
            <Icon icon="ph:chat-circle-dots" width={22} height={22} />
            <span className="text-[0.68rem] font-semibold">Mesajlar</span>
          </button>
          <button className="flex flex-1 flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-primary">
            <Icon icon="ph:user-circle" width={22} height={22} />
            <span className="text-[0.68rem] font-semibold">Profil</span>
          </button>
        </div>
      </nav>
    </main>
  );
}
