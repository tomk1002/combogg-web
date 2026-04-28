import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Combo Share",
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
        {children}
      </body>
    </html>
  );
}
