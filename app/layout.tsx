import type { Metadata } from "next";
import { Barlow_Condensed } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/layout/site-header";
import Providers from "@/components/providers";

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display-loaded",
  display: "swap",
});

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
    <html lang="ko" className={`h-full ${barlowCondensed.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{__html: `(function(){try{var t=localStorage.getItem('theme');if(t==='light')document.documentElement.setAttribute('data-theme','light');}catch(e){}})()`}} />
        <link rel="preconnect" href="https://vklbmllbdhjtamcvcxhh.supabase.co" />
        <link rel="preconnect" href="https://ddragon.leagueoflegends.com" />
        <link rel="preconnect" href="https://lh3.googleusercontent.com" />
      </head>
      <body className="min-h-full flex flex-col bg-surface text-text antialiased">
        <Providers>
          <SiteHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
