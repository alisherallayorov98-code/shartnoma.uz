import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/LanguageContext";
import { ThemeProvider } from "@/lib/ThemeContext";

export const metadata: Metadata = {
  title: "Kabinetim.uz — Biznes hujjat boshqaruv tizimi",
  description: "O'zbekiston biznes uchun hujjat boshqaruv platformasi. Shartnomalar, kadrlar, buxgalteriya, yurist — barchasi bitta joyda.",
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
          <LanguageProvider>{children}</LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
