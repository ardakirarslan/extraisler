import { Icon } from "@iconify/react";

export function JobListings() {
  return (
    <main className="min-h-screen bg-background text-foreground pb-28 font-sans">
      <header className="px-5 pt-6 pb-2">
        <div className="mt-4 flex items-center gap-2.5">
          <div className="relative flex-1 flex items-center">
            <Icon
              icon="ph:magnifying-glass"
              className="absolute left-3.5 text-muted-foreground"
              width={18}
              height={18}
            />
            <input
              type="text"
              placeholder="Pozisyon, otel veya şehir ara..."
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-card border border-border/80 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm active:scale-95 transition-transform">
            <Icon icon="ph:sliders-horizontal" width={18} height={18} />
          </button>
        </div>
        <div className="mt-3.5 -mx-5 flex gap-2 overflow-x-auto no-scrollbar px-5 py-1">
          <button className="shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm">
            Tümü
          </button>
          <button className="shrink-0 rounded-full bg-card border border-border/80 px-4 py-2 text-xs font-medium text-foreground hover:bg-input transition-colors">
            Sezonluk
          </button>
          <button className="shrink-0 rounded-full bg-card border border-border/80 px-4 py-2 text-xs font-medium text-foreground hover:bg-input transition-colors">
            Günlük / Yevmiye
          </button>
          <button className="shrink-0 rounded-full bg-card border border-border/80 px-4 py-2 text-xs font-medium text-foreground hover:bg-input transition-colors">
            Otel & Turizm
          </button>
          <button className="shrink-0 rounded-full bg-card border border-border/80 px-4 py-2 text-xs font-medium text-foreground hover:bg-input transition-colors">
            Restoran & Cafe
          </button>
        </div>
      </header>
      <section className="px-5 mt-4 space-y-4">
        <article className="overflow-hidden rounded-2xl bg-card border border-border/70 shadow-[0_8px_24px_rgba(44,24,16,0.06)] transition-all active:scale-[0.99]">
          <div className="relative h-40 w-full overflow-hidden">
            <img
              src="https://ggrhecslgdflloszjkwl.supabase.co/storage/v1/object/public/user-assets/Dt8hqCPKGnV/components/vHc2NT1BtWT.jpeg"
              alt="Limon Hotel & Resort"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
            <div className="absolute top-3 left-3">
              <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground shadow-sm">
                Sezonluk
              </span>
            </div>
            <button className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-white/80 text-foreground shadow-sm backdrop-blur-md">
              <Icon icon="ph:bookmark-simple" width={18} height={18} />
            </button>
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
              <div className="flex items-center gap-1.5 text-xs font-medium text-white/95">
                <Icon icon="ph:map-pin" className="text-accent" width={15} height={15} />
                <span>Antalya, Kaş</span>
              </div>
              <span className="rounded-full bg-black/40 backdrop-blur-sm px-2.5 py-0.5 text-[11px] font-semibold text-white">
                Konaklama Dahil
              </span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-heading text-lg font-bold text-foreground leading-snug">
                  Resepsiyonist
                </h3>
                <p className="text-xs font-medium text-muted-foreground mt-0.5">
                  Limon Hotel & Resort
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[11px] font-medium text-muted-foreground">Aylık Ücret</p>
                <p className="text-sm font-bold text-primary">
                  ₺45.000 <span className="text-xs font-normal text-muted-foreground">+ Prim</span>
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-lg bg-input px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                <Icon icon="ph:clock" width={13} height={13} />
                Haftalık 45 Saat
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-input px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                <Icon icon="ph:fork-knife" width={13} height={13} />3 Öğün Yemek
              </span>
            </div>
            <div className="mt-3.5 pt-3 border-t border-border/60 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">2 saat önce yayınlandı</span>
              <button className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:text-accent/80">
                <span>Detayları Gör</span>
                <Icon icon="ph:arrow-right" width={14} height={14} />
              </button>
            </div>
          </div>
        </article>
        <article className="overflow-hidden rounded-2xl bg-card border border-border/70 shadow-[0_8px_24px_rgba(44,24,16,0.06)] transition-all active:scale-[0.99]">
          <div className="relative h-40 w-full overflow-hidden">
            <img
              src="https://ggrhecslgdflloszjkwl.supabase.co/storage/v1/object/public/user-assets/Dt8hqCPKGnV/components/2tWKbhEpjMl.jpeg"
              alt="Artisan Roastery"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
            <div className="absolute top-3 left-3">
              <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-bold text-accent-foreground shadow-sm">
                Günlük
              </span>
            </div>
            <button className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-white/80 text-foreground shadow-sm backdrop-blur-md">
              <Icon icon="ph:bookmark-simple" width={18} height={18} />
            </button>
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
              <div className="flex items-center gap-1.5 text-xs font-medium text-white/95">
                <Icon icon="ph:map-pin" className="text-accent" width={15} height={15} />
                <span>Muğla, Bodrum</span>
              </div>
              <span className="rounded-full bg-black/40 backdrop-blur-sm px-2.5 py-0.5 text-[11px] font-semibold text-white">
                Yevmiye Usulü
              </span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-heading text-lg font-bold text-foreground leading-snug">
                  Head Barista / Servis
                </h3>
                <p className="text-xs font-medium text-muted-foreground mt-0.5">
                  Roast & Co. Marina
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[11px] font-medium text-muted-foreground">Günlük Yevmiye</p>
                <p className="text-sm font-bold text-primary">
                  ₺1.800 <span className="text-xs font-normal text-muted-foreground">/ Gün</span>
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-lg bg-input px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                <Icon icon="ph:clock" width={13} height={13} />
                Vardiyalı (8 Saat)
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-input px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                <Icon icon="ph:tip-jar" width={13} height={13} />
                Günlük Tip Payı
              </span>
            </div>
            <div className="mt-3.5 pt-3 border-t border-border/60 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">5 saat önce yayınlandı</span>
              <button className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:text-accent/80">
                <span>Detayları Gör</span>
                <Icon icon="ph:arrow-right" width={14} height={14} />
              </button>
            </div>
          </div>
        </article>
        <article className="overflow-hidden rounded-2xl bg-card border border-border/70 shadow-[0_8px_24px_rgba(44,24,16,0.06)] transition-all active:scale-[0.99]">
          <div className="relative h-40 w-full overflow-hidden">
            <img
              src="https://ggrhecslgdflloszjkwl.supabase.co/storage/v1/object/public/user-assets/Dt8hqCPKGnV/components/GAGyRwOiWtM.jpeg"
              alt="Gourmet Restaurant"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
            <div className="absolute top-3 left-3">
              <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground shadow-sm">
                Sezonluk
              </span>
            </div>
            <button className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-white/80 text-foreground shadow-sm backdrop-blur-md">
              <Icon icon="ph:bookmark-simple" width={18} height={18} />
            </button>
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
              <div className="flex items-center gap-1.5 text-xs font-medium text-white/95">
                <Icon icon="ph:map-pin" className="text-accent" width={15} height={15} />
                <span>İzmir, Çeşme</span>
              </div>
              <span className="rounded-full bg-black/40 backdrop-blur-sm px-2.5 py-0.5 text-[11px] font-semibold text-white">
                Konaklama + Servis
              </span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-heading text-lg font-bold text-foreground leading-snug">
                  Sous Chef / Mutfak Şefi
                </h3>
                <p className="text-xs font-medium text-muted-foreground mt-0.5">
                  Marea Aegean Brasserie
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[11px] font-medium text-muted-foreground">Aylık Ücret</p>
                <p className="text-sm font-bold text-primary">
                  ₺60.000 <span className="text-xs font-normal text-muted-foreground">+ Prim</span>
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-lg bg-input px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                <Icon icon="ph:calendar-check" width={13} height={13} />
                Mayıs - Ekim
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-input px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                <Icon icon="ph:house-line" width={13} height={13} />
                Lojman İmkânı
              </span>
            </div>
            <div className="mt-3.5 pt-3 border-t border-border/60 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Dün yayınlandı</span>
              <button className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:text-accent/80">
                <span>Detayları Gör</span>
                <Icon icon="ph:arrow-right" width={14} height={14} />
              </button>
            </div>
          </div>
        </article>
      </section>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/80 bg-card/95 backdrop-blur-md px-4 py-2.5">
        <div className="flex items-center justify-between">
          <button className="flex flex-1 flex-col items-center gap-1 py-1 text-primary font-semibold">
            <div className="relative flex items-center justify-center">
              <Icon icon="ph:briefcase-fill" width={20} height={20} />
            </div>
            <span className="text-[11px]">İlanlar</span>
          </button>
          <button className="flex flex-1 flex-col items-center gap-1 py-1 text-muted-foreground transition-colors hover:text-foreground">
            <Icon icon="ph:paper-plane-tilt" width={20} height={20} />
            <span className="text-[11px] font-medium">Başvurular</span>
          </button>
          <button className="flex flex-1 flex-col items-center gap-1 py-1 text-muted-foreground transition-colors hover:text-foreground">
            <Icon icon="ph:bookmark-simple" width={20} height={20} />
            <span className="text-[11px] font-medium">Kayıtlar</span>
          </button>
          <button className="flex flex-1 flex-col items-center gap-1 py-1 text-muted-foreground transition-colors hover:text-foreground">
            <Icon icon="ph:chat-dots" width={20} height={20} />
            <span className="text-[11px] font-medium">Mesajlar</span>
          </button>
          <button className="flex flex-1 flex-col items-center gap-1 py-1 text-muted-foreground transition-colors hover:text-foreground">
            <Icon icon="ph:gear-six" width={20} height={20} />
            <span className="text-[11px] font-medium">Ayarlar</span>
          </button>
        </div>
      </nav>
    </main>
  );
}
