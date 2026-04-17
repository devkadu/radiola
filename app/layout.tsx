import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};
import { Plus_Jakarta_Sans, Outfit } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { Providers } from "./providers";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
  preload: true,
});

const outfit = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://segundatemporada.com.br"),
  title: {
    default: "Segunda Temporada",
    template: "%s | Segunda Temporada",
  },
  description: "Comentários organizados por episódio para quem leva séries a sério.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    siteName: "Segunda Temporada",
    locale: "pt_BR",
    type: "website",
    title: "Segunda Temporada",
    description: "Comentários organizados por episódio para quem leva séries a sério.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Segunda Temporada" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Segunda Temporada",
    description: "Comentários organizados por episódio para quem leva séries a sério.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Segunda Temporada",
  },
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://segundatemporada.com.br";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "Segunda Temporada",
      url: siteUrl,
      logo: { "@type": "ImageObject", url: `${siteUrl}/icon.svg` },
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "Segunda Temporada",
      description: "Comentários organizados por episódio para quem leva séries a sério.",
      inLanguage: "pt-BR",
      publisher: { "@id": `${siteUrl}/#organization` },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body
        className={`${plusJakartaSans.variable} ${outfit.variable} antialiased`}
        suppressHydrationWarning
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers>
          <AuthProvider>{children}</AuthProvider>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
