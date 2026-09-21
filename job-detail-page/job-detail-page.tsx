import { Icon } from "@iconify/react";

export function JobDetailPage() {
  return (
    <main className="min-h-screen bg-background text-foreground pb-28">
      <section className="relative px-4 pt-4">
        <div className="relative overflow-hidden rounded-[1.25rem] shadow-sm">
          <img
            src="https://ggrhecslgdflloszjkwl.supabase.co/storage/v1/object/public/user-assets/67irDpa9Tml/components/A5K1e0gva9A.jpeg"
            alt="Boutique hotel reception workplace"
            className="h-64 w-full object-cover"
          />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
            <button
              aria-label="Geri"
              className="flex size-11 items-center justify-center rounded-full bg-white/80 text-foreground shadow-sm backdrop-blur-md"
            >
              <Icon icon="ph:arrow-left" className="size-5" />
            </button>
            <div className="flex gap-2">
              <button
                aria-label="Paylaş"
                className="flex size-11 items-center justify-center rounded-full bg-white/80 text-foreground shadow-sm backdrop-blur-md"
              >
                <Icon icon="ph:share-network" className="size-5" />
              </button>
              <button
                aria-label="Kaydet"
                className="flex size-11 items-center justify-center rounded-full bg-white/80 text-foreground shadow-sm backdrop-blur-md"
              >
                <Icon icon="ph:bookmark-simple" className="size-5" />
              </button>
            </div>
          </div>
        </div>
        <article className="relative -mt-16 rounded-[1.25rem] bg-card px-5 pb-7 pt-5 shadow-[0_12px_35px_rgba(44,24,16,0.12)]">
          <div className="flex justify-end">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              Sezonluk
            </span>
          </div>
          <h1 className="font-heading mt-3 pr-3 text-[2rem] font-extrabold leading-tight tracking-[-0.04em] text-primary">
            Resepsiyonist
          </h1>
          <p className="mt-2 text-sm font-semibold text-muted-foreground">Mavi Koy Hotel</p>
          <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Icon icon="ph:map-pin" className="size-4 text-primary" />
            <span>Kaş, Antalya</span>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-input p-4">
              <p className="text-xs font-medium text-muted-foreground">Aylık Ücret</p>
              <p className="mt-2 text-sm font-extrabold leading-snug text-foreground">
                ₺45.000 + Prim
              </p>
            </div>
            <div className="rounded-2xl bg-input p-4">
              <p className="text-xs font-medium text-muted-foreground">Çalışma Şekli</p>
              <p className="mt-2 text-sm font-extrabold leading-snug text-foreground">
                Haftalık 45 Saat
              </p>
            </div>
          </div>
          <div className="mt-7">
            <h2 className="font-heading text-lg font-extrabold text-primary">İş Tanımı</h2>
            <p className="mt-3 text-[0.93rem] leading-7 text-muted-foreground">
              Misafirlerimizi güler yüzle karşılayacak, giriş ve çıkış işlemlerini yönetecek ekip
              arkadaşımızı arıyoruz. Otelimizin sıcak atmosferini yansıtacak, iletişimi güçlü ve
              çözüm odaklı bir çalışma arkadaşı olmanız beklenmektedir.
            </p>
          </div>
        </article>
      </section>
      <div className="fixed inset-x-0 bottom-0 z-10 bg-background/90 px-4 pb-5 pt-3 backdrop-blur-md">
        <button className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-accent px-6 text-base font-extrabold text-accent-foreground shadow-[0_8px_20px_rgba(217,142,74,0.28)]">
          <span>Hemen Başvur</span>
          <Icon icon="ph:arrow-right" className="size-5" />
        </button>
      </div>
    </main>
  );
}
