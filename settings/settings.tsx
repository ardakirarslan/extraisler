import { Icon } from "@iconify/react";

export function Settings() {
  return (
    <main className="min-h-screen bg-background text-foreground pb-28 font-sans">
      <div className="px-5 pt-7 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
              Ayarlar
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Hesap tercihlerinizi ve ayarlarınızı yönetin
            </p>
          </div>
          <button className="flex size-10 items-center justify-center rounded-full bg-card border border-border/70 shadow-sm text-foreground">
            <Icon icon="ph:bell-simple" className="size-5" />
          </button>
        </div>
        <div className="mt-5 relative overflow-hidden rounded-2xl bg-card border border-border/60 p-4 shadow-[0_8px_24px_rgba(44,24,16,0.06)]">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <img
                src="https://lh3.googleusercontent.com/a/ACg8ocJV3zsVXix6ZV8X2BrBBaYzVOGjtTOsXxQQNH_AcEd0Mse_Ow=s96-c"
                alt="Arda Kırarslan"
                className="size-14 rounded-full object-cover ring-2 ring-primary/15"
              />
              <span className="absolute bottom-0 right-0 size-3.5 rounded-full bg-emerald-600 ring-2 ring-card" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-base font-bold text-foreground truncate">
                  Arda Kırarslan
                </h2>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  Aday
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                arda.kirarslan@example.com
              </p>
            </div>
            <button className="flex size-9 items-center justify-center rounded-full bg-input text-foreground transition-colors active:scale-95">
              <Icon icon="ph:pencil-simple" className="size-4" />
            </button>
          </div>
          <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Icon icon="ph:sparkle-fill" className="size-4 text-accent" />
              <span>Profil Doluluk Oranı</span>
            </div>
            <span className="font-bold text-primary">%85</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-input overflow-hidden">
            <div className="h-full rounded-full bg-primary" style="width: 85%" />
          </div>
        </div>
        <div className="mt-6">
          <p className="px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Hesap & Güvenlik
          </p>
          <div className="mt-2.5 overflow-hidden rounded-2xl bg-card border border-border/60 shadow-[0_4px_16px_rgba(44,24,16,0.04)] divide-y divide-border/60">
            <button className="w-full flex items-center justify-between p-4 text-left transition-colors active:bg-input/60">
              <div className="flex items-center gap-3.5">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon icon="ph:user" className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Profil Bilgileri</p>
                  <p className="text-xs text-muted-foreground">CV, deneyim ve iletişim detayları</p>
                </div>
              </div>
              <Icon icon="ph:caret-right" className="size-4 text-muted-foreground" />
            </button>
            <button className="w-full flex items-center justify-between p-4 text-left transition-colors active:bg-input/60">
              <div className="flex items-center gap-3.5">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon icon="ph:lock-key" className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Şifre Değiştirme</p>
                  <p className="text-xs text-muted-foreground">Güvenlik ve giriş ayarları</p>
                </div>
              </div>
              <Icon icon="ph:caret-right" className="size-4 text-muted-foreground" />
            </button>
          </div>
        </div>
        <div className="mt-6">
          <p className="px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Topluluk & Destek
          </p>
          <div className="mt-2.5 overflow-hidden rounded-2xl bg-card border border-border/60 shadow-[0_4px_16px_rgba(44,24,16,0.04)] divide-y divide-border/60">
            <button className="w-full flex items-center justify-between p-4 text-left transition-colors active:bg-input/60">
              <div className="flex items-center gap-3.5">
                <div className="flex size-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
                  <Icon icon="ph:gift" className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">Arkadaşlarını Davet Et</p>
                    <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                      Kazan
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Arkadaşın iş bulsun, sen kazan</p>
                </div>
              </div>
              <Icon icon="ph:caret-right" className="size-4 text-muted-foreground" />
            </button>
            <button className="w-full flex items-center justify-between p-4 text-left transition-colors active:bg-input/60">
              <div className="flex items-center gap-3.5">
                <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
                  <Icon icon="ph:star" className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Uygulamayı Değerlendir</p>
                  <p className="text-xs text-muted-foreground">App Store ve Play Store'da oyla</p>
                </div>
              </div>
              <Icon icon="ph:caret-right" className="size-4 text-muted-foreground" />
            </button>
            <button className="w-full flex items-center justify-between p-4 text-left transition-colors active:bg-input/60">
              <div className="flex items-center gap-3.5">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon icon="ph:chats-circle" className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Destek Merkezi</p>
                  <p className="text-xs text-muted-foreground">SSS, canlı yardım ve iletişim</p>
                </div>
              </div>
              <Icon icon="ph:caret-right" className="size-4 text-muted-foreground" />
            </button>
          </div>
        </div>
        <div className="mt-6 flex flex-col items-center gap-2 pb-2">
          <button className="inline-flex items-center gap-2 text-sm font-semibold text-destructive py-2 px-4 rounded-xl hover:bg-destructive/10 transition-colors">
            <Icon icon="ph:sign-out" className="size-4" />
            <span>Çıkış Yap</span>
          </button>
          <p className="text-[11px] text-muted-foreground">Versiyon 2.4.0 (Build 184)</p>
        </div>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/80 bg-card/95 backdrop-blur-md px-4 py-2.5">
        <div className="flex items-center justify-between">
          <button className="flex flex-1 flex-col items-center gap-1 py-1 text-muted-foreground transition-colors hover:text-foreground">
            <Icon icon="ph:briefcase" className="size-5" />
            <span className="text-[11px] font-medium">İlanlar</span>
          </button>
          <button className="flex flex-1 flex-col items-center gap-1 py-1 text-muted-foreground transition-colors hover:text-foreground">
            <Icon icon="ph:paper-plane-tilt" className="size-5" />
            <span className="text-[11px] font-medium">Başvurular</span>
          </button>
          <button className="flex flex-1 flex-col items-center gap-1 py-1 text-muted-foreground transition-colors hover:text-foreground">
            <Icon icon="ph:bookmark-simple" className="size-5" />
            <span className="text-[11px] font-medium">Kayıtlar</span>
          </button>
          <button className="flex flex-1 flex-col items-center gap-1 py-1 text-muted-foreground transition-colors hover:text-foreground">
            <Icon icon="ph:chat-dots" className="size-5" />
            <span className="text-[11px] font-medium">Mesajlar</span>
          </button>
          <button className="flex flex-1 flex-col items-center gap-1 py-1 text-primary font-semibold">
            <div className="relative flex items-center justify-center">
              <Icon icon="ph:gear-six-fill" className="size-5" />
            </div>
            <span className="text-[11px]">Ayarlar</span>
          </button>
        </div>
      </nav>
    </main>
  );
}
