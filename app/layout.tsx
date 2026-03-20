import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { BottonNavigator } from "@/components/BottonNavigator";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Radiola",
  description: "Comentários e avaliações de séries de TV",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <div className="lg:flex min-h-screen">
          <Sidebar />
          <div className="flex-1 min-w-0 flex flex-col">
            <Header />
            <div className="flex-1 max-w-[1296px] w-full mx-auto lg:px-8 lg:py-6">
              {children}
            </div>
            <BottonNavigator />
          </div>
        </div>
      </body>
    </html>
  );
}
