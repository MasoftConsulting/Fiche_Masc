import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Bricolage_Grotesque } from "next/font/google";
import { PWA } from "@/components/pwa";
import "./globals.css";

const texte = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--police-texte",
  display: "swap",
});

const titre = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--police-titre",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Fiches d'intervention · MA SOFT CONSULTING",
  description:
    "Saisie, validation et impression des fiches d'intervention MA SOFT CONSULTING.",
  applicationName: "Fiches MASC",
  // Installée sur iOS, l'application s'ouvre en plein écran avec cette barre
  // d'état ; sans ces réglages, Safari garde sa propre chrome.
  appleWebApp: {
    capable: true,
    title: "Fiches MASC",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0f3352",
  // Les techniciens saisissent sur le terrain, souvent sur mobile : on laisse
  // le zoom accessible. `viewport-fit: cover` permet de peindre sous l'encoche,
  // les marges de sécurité étant reprises en CSS.
  maximumScale: 5,
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${texte.variable} ${titre.variable}`}>
      <head>
        {/* Sans JavaScript, les blocs animés à l'entrée dans le viewport
            resteraient invisibles : on neutralise l'effet. */}
        <noscript>
          <style>{`.reveler{opacity:1 !important;animation:none !important}`}</style>
        </noscript>
      </head>
      <body className="antialiased">
        {children}
        <PWA />
      </body>
    </html>
  );
}
