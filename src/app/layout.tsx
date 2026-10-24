import { NavigationProgress } from "@/app/_components/navigation-progress/navigation-progress";
import { Providers } from "@/app/providers";
import { AuthProvider } from "@/features/auth/components/auth-provider/auth-provider.client";
import "@/shared/styles/globals.css";
import { serializeJsonLd } from "@/shared/utils/serialize-json-ld";
import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata,Viewport } from "next";
import localFont from "next/font/local";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const plusJakartaSans = localFont({
  src: "../shared/assets/fonts/plus-jakarta-sans-latin.woff2",
  variable: "--font-display",
  weight: "700 800",
  display: "swap",
  preload: true,
});

const outfit = localFont({
  src: "../shared/assets/fonts/outfit-latin.woff2",
  variable: "--font-body",
  weight: "400 600",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(
    (() => {
      const u = process.env.NEXT_PUBLIC_SITE_URL ?? "https://segundatemporada.com.br";
      return u.startsWith("http") ? u : `https://${u}`;
    })(),
  ),
  title: {
    default: "Segunda Temporada",
    template: "%s | Segunda Temporada",
  },
  description: "Comentários organizados por episódio para quem leva séries a sério.",
  verification: {
    google: "A-42VZAQsgby6OQc2-UWD_ZKb3HbQEzyQJF7ieeN64Y",
  },
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
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteUrl}/busca?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
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
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
        <Providers>
          <NavigationProgress />
          <AuthProvider>{children}</AuthProvider>
        </Providers>
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID!} />
      </body>
    </html>
  );
}
