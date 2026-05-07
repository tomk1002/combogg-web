import Link from "next/link";
import { getServerT } from "@/lib/i18n-server";

export default async function DownloadPage() {
  const t = await getServerT();
  const opkUrl = process.env.NEXT_PUBLIC_OPK_DOWNLOAD_URL;
  const isAvailable = Boolean(opkUrl);

  return (
    <main className="flex-1 max-w-3xl mx-auto px-6 py-10 w-full">
      {/* Hero — compact */}
      <section className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-2.5 h-5 rounded-full bg-gold/10 text-gold text-[11px] font-bold mb-3">
          <span className="w-1 h-1 rounded-full bg-gold animate-pulse" />
          {t.dl_alpha_badge}
        </div>
        <h1 className="text-3xl font-black tracking-tight mb-2">{t.dl_hero_title}</h1>
        <p className="text-text-secondary text-sm mb-5">{t.dl_hero_subtitle}</p>
        {isAvailable ? (
          <a
            href={opkUrl}
            download
            className="inline-flex items-center gap-2 px-6 h-11 rounded-xl bg-gold text-white font-bold text-sm shadow-[0_4px_16px_var(--color-gold-muted)] hover:bg-gold-light hover:shadow-[0_0_24px_var(--color-gold-muted)] transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 16V4m0 12L8 9m4 7 4-7M3 20h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t.dl_btn_windows}
          </a>
        ) : (
          <span className="inline-flex items-center gap-2 px-6 h-11 rounded-xl bg-gold/60 text-white font-bold text-sm cursor-default select-none">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 16V4m0 12L8 9m4 7 4-7M3 20h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t.dl_btn_windows}
            <span className="text-[10px] font-semibold bg-white/20 px-1.5 py-0.5 rounded-full">{t.dl_btn_coming_soon}</span>
          </span>
        )}
        <p className="text-xs text-text-muted mt-3">{t.dl_system_req}</p>
      </section>

      {/* Alpha notice — slim */}
      <div className="bg-gold/5 border border-gold/30 rounded-lg px-4 py-2.5 text-xs text-text-secondary mb-8 text-center">
        <span className="font-bold text-gold">{t.dl_alpha_title}.</span> {t.dl_alpha_desc}
      </div>

      {/* Install guide — horizontal 3-step */}
      <section className="mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted mb-3">{t.dl_install_title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Step 1 */}
          <div className="bg-surface-raised border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-full bg-surface-overlay border border-border flex items-center justify-center text-[10px] font-black text-text-muted">1</div>
              <p className="font-bold text-sm">{t.dl_install_step1_title}</p>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed mb-2">{t.dl_install_step1_desc}</p>
            <a
              href="https://www.overwolf.com/install"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gold hover:underline font-bold"
            >
              {t.dl_install_step1_link}
            </a>
          </div>

          {/* Step 2 */}
          <div className="bg-surface-raised border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-full bg-surface-overlay border border-border flex items-center justify-center text-[10px] font-black text-text-muted">2</div>
              <p className="font-bold text-sm">{t.dl_install_step2_title}</p>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed mb-2">{t.dl_install_step2_desc}</p>
            {isAvailable ? (
              <a
                href={opkUrl}
                download
                className="text-xs text-gold hover:underline font-bold"
              >
                {t.dl_install_step2_link}
              </a>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
                <span className="w-1 h-1 rounded-full bg-gold animate-pulse" />
                {t.dl_btn_coming_soon}
              </span>
            )}
          </div>

          {/* Step 3 */}
          <div className="bg-surface-raised border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-full bg-surface-overlay border border-border flex items-center justify-center text-[10px] font-black text-text-muted">3</div>
              <p className="font-bold text-sm">{t.dl_install_step3_title}</p>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">{t.dl_install_step3_desc}</p>
          </div>
        </div>
      </section>

      {/* Warning — slim inline */}
      <div className="bg-surface-raised border border-border rounded-lg px-4 py-3 mb-8 flex gap-3 items-start">
        <span className="text-base leading-none mt-0.5">⚠</span>
        <div className="text-xs text-text-secondary">
          <span className="font-bold text-text-primary">{t.dl_install_warning_title}</span>{" "}
          {t.dl_install_warning_desc}
        </div>
      </div>

      {/* Features — compact inline */}
      <section className="mb-8">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-xl mb-1">🎮</div>
            <p className="font-bold text-xs mb-0.5">{t.dl_feat_record_title}</p>
            <p className="text-[11px] text-text-muted leading-snug">{t.dl_feat_record_desc}</p>
          </div>
          <div className="text-center">
            <div className="text-xl mb-1">▷</div>
            <p className="font-bold text-xs mb-0.5">{t.dl_feat_overlay_title}</p>
            <p className="text-[11px] text-text-muted leading-snug">{t.dl_feat_overlay_desc}</p>
          </div>
          <div className="text-center">
            <div className="text-xl mb-1">↑</div>
            <p className="font-bold text-xs mb-0.5">{t.dl_feat_share_title}</p>
            <p className="text-[11px] text-text-muted leading-snug">{t.dl_feat_share_desc}</p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <div className="text-center text-xs text-text-secondary">
        {t.dl_bottom_cta_text}{" "}
        <Link href="/upload" className="text-gold hover:underline font-bold">
          {t.dl_bottom_cta_btn}
        </Link>
      </div>
    </main>
  );
}
