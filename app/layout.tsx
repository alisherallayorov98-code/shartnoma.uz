import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/LanguageContext";
import { ThemeProvider } from "@/lib/ThemeContext";
import { I18nProvider } from "@/lib/i18nProvider";

export const metadata: Metadata = {
  title: "Kabinetim.uz — Biznes hujjat boshqaruv tizimi",
  description: "O'zbekiston biznes uchun hujjat boshqaruv platformasi. Shartnomalar, kadrlar, buxgalteriya, yurist — barchasi bitta joyda.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Kabinetim",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563EB",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" data-theme="dark">
      <body className="antialiased">
        <ThemeProvider>
          <LanguageProvider>
            <I18nProvider>{children}</I18nProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
