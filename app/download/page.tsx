import { getServerT } from "@/lib/i18n-server";

export default async function DownloadPage() {
  const t = await getServerT();
  const opkUrl = process.env.NEXT_PUBLIC_OPK_DOWNLOAD_URL;
  const isAvailable = Boolean(opkUrl);

  return (
    <main className="flex-1 max-w-3xl mx-auto px-6 py-12 w-full">
      {/* Hero */}
      <section className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 h-6 rounded-full bg-gold/10 text-gold text-xs font-bold mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
          {t.dl_alpha_badge}
        </div>
        <h1 className="text-4xl font-black tracking-tight mb-3">{t.dl_hero_title}</h1>
        <p className="text-text-secondary text-base mb-6">{t.dl_hero_subtitle}</p>
        {isAvailable ? (
          <a
            href={opkUrl}
            download
            className="inline-flex items-center gap-2 px-7 h-12 rounded-xl bg-gold text-white font-bold text-base shadow-[0_4px_16px_var(--color-gold-muted)] hover:bg-gold-light hover:shadow-[0_0_24px_var(--color-gold-muted)] transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 16V4m0 12L8 9m4 7 4-7M3 20h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t.dl_btn_windows}
          </a>
        ) : (
          <span className="inline-flex items-center gap-2 px-7 h-12 rounded-xl bg-gold/60 text-white font-bold text-base cursor-default select-none">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 16V4m0 12L8 9m4 7 4-7M3 20h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t.dl_btn_windows}
            <span className="text-xs font-semibold bg-white/20 px-1.5 py-0.5 rounded-full">{t.dl_btn_coming_soon}</span>
          </span>
        )}
        <p className="text-sm text-text-muted mt-4">{t.dl_system_req}</p>
      </section>

      {/* Install guide — 3-step grid */}
      <section className="mb-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted mb-4">{t.dl_install_title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface-raised border border-border rounded-xl p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-6 h-6 rounded-full bg-surface-overlay border border-border flex items-center justify-center text-xs font-black text-text-muted">1</div>
              <p className="font-bold text-base">{t.dl_install_step1_title}</p>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed mb-3">{t.dl_install_step1_desc}</p>
            <a
              href="https://download.overwolf.com/install/Download"
              className="text-sm text-gold hover:underline font-bold"
            >
              {t.dl_install_step1_link}
            </a>
          </div>

          <div className="bg-surface-raised border border-border rounded-xl p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-6 h-6 rounded-full bg-surface-overlay border border-border flex items-center justify-center text-xs font-black text-text-muted">2</div>
              <p className="font-bold text-base">{t.dl_install_step2_title}</p>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">{t.dl_install_step2_desc}</p>
          </div>

          <div className="bg-surface-raised border border-border rounded-xl p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-6 h-6 rounded-full bg-surface-overlay border border-border flex items-center justify-center text-xs font-black text-text-muted">3</div>
              <p className="font-bold text-base">{t.dl_install_step3_title}</p>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">{t.dl_install_step3_desc}</p>
          </div>
        </div>
      </section>

      {/* Warning */}
      <div className="bg-surface-raised border border-border rounded-lg px-5 py-4 flex gap-3 items-start">
        <span className="text-lg leading-none mt-0.5">⚠</span>
        <div className="text-sm text-text-secondary leading-relaxed">
          <span className="font-bold text-text-primary">{t.dl_install_warning_title}</span>{" "}
          {t.dl_install_warning_desc}
        </div>
      </div>
    </main>
  );
}
