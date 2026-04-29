"use client";

import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n-client";

export default function LangToggle() {
  const { locale, setLocale } = useLang();
  const router = useRouter();

  const toggle = () => {
    const next = locale === "ko" ? "en" : "ko";
    setLocale(next);
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="h-8 px-2.5 rounded-md border border-[rgba(255,255,255,0.08)] text-xs font-bold text-text-muted hover:text-text hover:bg-surface-overlay transition-colors cursor-pointer tracking-wide"
    >
      {locale === "ko" ? "EN" : "KO"}
    </button>
  );
}
