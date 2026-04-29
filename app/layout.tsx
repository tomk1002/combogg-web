import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/layout/site-header";
import { LangProvider } from "@/lib/i18n-client";

export const metadata: Metadata = {
  title: "combo.gg",
  description: "LoL 콤보를 녹화하고 공유하세요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col bg-surface text-text antialiased">
        <LangProvider>
          <SiteHeader />
          {children}
        </LangProvider>
      </body>
    </html>
  );
}
