import { SITE_URL as siteUrl } from "@/shared/constants/site";
import { NavigationProgress } from "@/app/_components/navigation-progress/navigation-progress";
import { Providers } from "@/app/providers";
import { AuthProvider } from "@/features/auth/components/auth-provider/auth-provider.client";
import "@/shared/styles/globals.css";
import { socialPreviewMetadata } from "@/shared/constants/social-preview";
import { serializeJsonLd } from "@/shared/utils/serialize-json-ld";
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
  ...socialPreviewMetadata,
  metadataBase: new URL(siteUrl),
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

const RootLayout = ({ children }: { children: React.ReactNode }) => {
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
      </body>
    </html>
  );
}

export default RootLayout;
