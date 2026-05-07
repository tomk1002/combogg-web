import Link from "next/link";
import { getServerT } from "@/lib/i18n-server";

export default async function SiteFooter() {
  const t = await getServerT();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface-raised/40 mt-16">
      <div className="max-w-[var(--width-content)] mx-auto px-4 sm:px-8 py-10 flex flex-col gap-6">
        {/* Riot disclaimer */}
        <p className="text-xs text-text-muted leading-relaxed max-w-3xl">
          {t.footer_riot_disclaimer}
        </p>

        {/* Links + copyright */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 pt-2 border-t border-border">
          <span className="text-xs font-mono text-text-muted">{t.footer_copyright(year)}</span>
          <nav className="flex items-center gap-5 text-xs text-text-secondary">
            <Link href="/privacy" className="hover:text-text transition-colors">
              {t.footer_privacy}
            </Link>
            <Link href="/terms" className="hover:text-text transition-colors">
              {t.footer_terms}
            </Link>
            <a
              href="mailto:combo.gg@gmail.com"
              className="hover:text-text transition-colors"
            >
              {t.footer_contact}
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
