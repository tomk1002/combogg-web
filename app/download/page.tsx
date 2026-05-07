import Link from "next/link";
import { getServerT } from "@/lib/i18n-server";

export default async function DownloadPage() {
  const t = await getServerT();
  const opkUrl = process.env.NEXT_PUBLIC_OPK_DOWNLOAD_URL;
  const isAvailable = Boolean(opkUrl);

  return (
    <main className="flex-1 max-w-[var(--width-content)] mx-auto px-8 py-16 w-full">
      {/* Hero */}
      <section className="text-center mb-12">
        <div className="w-20 h-20 rounded-2xl bg-surface-raised border border-border flex items-center justify-center mx-auto mb-6 text-3xl font-black font-mono select-none">
          ⌥▷
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 h-6 rounded-full bg-gold/10 text-gold text-xs font-bold mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
          {t.dl_alpha_badge}
        </div>
        <h1 className="text-4xl font-black tracking-tight mb-3">{t.dl_hero_title}</h1>
        <p className="text-text-secondary text-lg mb-8 max-w-md mx-auto">
          {t.dl_hero_subtitle}
        </p>
        <div className="inline-flex flex-col items-center gap-2 mb-3">
          {isAvailable ? (
            <a
              href={opkUrl}
              download
              className="inline-flex items-center gap-2.5 px-8 h-12 rounded-xl bg-gold text-white font-bold text-sm shadow-[0_4px_16px_var(--color-gold-muted)] hover:bg-gold-light hover:shadow-[0_0_24px_var(--color-gold-muted)] transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 16V4m0 12L8 9m4 7 4-7M3 20h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {t.dl_btn_windows}
            </a>
          ) : (
            <span className="inline-flex items-center gap-2.5 px-8 h-12 rounded-xl bg-gold/60 text-white font-bold text-sm cursor-default select-none">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 16V4m0 12L8 9m4 7 4-7M3 20h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {t.dl_btn_windows}
              <span className="text-xs font-semibold bg-white/20 px-1.5 py-0.5 rounded-full">{t.dl_btn_coming_soon}</span>
            </span>
          )}
        </div>
        <p className="text-xs text-text-muted">{t.dl_system_req}</p>
      </section>

      {/* Alpha notice */}
      <section className="mb-12">
        <div className="bg-gold/5 border border-gold/30 rounded-xl p-5 max-w-2xl mx-auto">
          <p className="font-bold text-sm mb-1.5 text-gold">{t.dl_alpha_title}</p>
          <p className="text-sm text-text-secondary leading-relaxed">{t.dl_alpha_desc}</p>
        </div>
      </section>

      {/* Feature cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16">
        <div className="bg-surface-raised border border-border rounded-xl p-6">
          <div className="text-2xl mb-3">🎮</div>
          <h3 className="font-bold text-sm mb-2">{t.dl_feat_record_title}</h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            {t.dl_feat_record_desc}
          </p>
        </div>
        <div className="bg-surface-raised border border-border rounded-xl p-6">
          <div className="text-2xl mb-3">▷</div>
          <h3 className="font-bold text-sm mb-2">{t.dl_feat_overlay_title}</h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            {t.dl_feat_overlay_desc}
          </p>
        </div>
        <div className="bg-surface-raised border border-border rounded-xl p-6">
          <div className="text-2xl mb-3">↑</div>
          <h3 className="font-bold text-sm mb-2">{t.dl_feat_share_title}</h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            {t.dl_feat_share_desc}
          </p>
        </div>
      </section>

      {/* Install guide */}
      <section className="bg-surface-raised border border-border rounded-2xl p-8 mb-8">
        <h2 className="text-lg font-black tracking-tight mb-6">{t.dl_install_title}</h2>
        <div className="flex flex-col gap-6">
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-surface-overlay border border-border flex items-center justify-center text-xs font-black text-text-muted shrink-0 mt-0.5">
              1
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm mb-1">{t.dl_install_step1_title}</p>
              <p className="text-sm text-text-secondary mb-2">
                {t.dl_install_step1_desc}
              </p>
              <a
                href="https://www.overwolf.com/install"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gold hover:underline font-bold"
              >
                {t.dl_install_step1_link}
              </a>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-surface-overlay border border-border flex items-center justify-center text-xs font-black text-text-muted shrink-0 mt-0.5">
              2
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm mb-1">{t.dl_install_step2_title}</p>
              <p className="text-sm text-text-secondary mb-2">
                {t.dl_install_step2_desc}
              </p>
              {isAvailable ? (
                <a
                  href={opkUrl}
                  download
                  className="text-sm text-gold hover:underline font-bold"
                >
                  {t.dl_install_step2_link}
                </a>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm text-text-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                  {t.dl_btn_coming_soon}
                </span>
              )}
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-surface-overlay border border-border flex items-center justify-center text-xs font-black text-text-muted shrink-0 mt-0.5">
              3
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm mb-1">{t.dl_install_step3_title}</p>
              <p className="text-sm text-text-secondary">
                {t.dl_install_step3_desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Untrusted developer warning */}
      <section className="mb-16">
        <div className="bg-surface-raised border border-border rounded-xl p-5 flex gap-4 max-w-2xl mx-auto">
          <div className="text-xl shrink-0">⚠</div>
          <div>
            <p className="font-bold text-sm mb-1.5">{t.dl_install_warning_title}</p>
            <p className="text-sm text-text-secondary leading-relaxed">{t.dl_install_warning_desc}</p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="text-center">
        <p className="text-text-secondary text-sm mb-3">{t.dl_bottom_cta_text}</p>
        <Link
          href="/upload"
          className="inline-flex items-center gap-1.5 px-6 h-10 rounded-xl bg-surface-raised border border-border text-sm font-bold hover:border-[rgba(255,255,255,0.24)] transition-colors"
        >
          {t.dl_bottom_cta_btn}
        </Link>
      </section>
    </main>
  );
}
