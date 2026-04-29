import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/layout/site-header";
import { LangProvider } from "@/lib/i18n-client";
import { getLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "combo.gg",
  description: "LoL 콤보를 녹화하고 공유하세요",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} className="h-full">
      <body className="min-h-full flex flex-col bg-surface text-text antialiased">
        <LangProvider locale={locale}>
          <SiteHeader locale={locale} />
          {children}
        </LangProvider>
      </body>
    </html>
  );
}
