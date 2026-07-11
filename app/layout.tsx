import type { Metadata } from "next";
import { Geist_Mono, Roboto } from "next/font/google";
import React, { Suspense } from "react";
import { NavigationLoader } from "@/components/navigation-loader";
import { Toaster } from "sonner";
import { AuthInitializer } from "@/components/auth-initializer";
import { OfflineBootstrap } from "@/components/offline/offline-bootstrap";
import "./globals.css";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
  variable: "--font-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Yowyob ERP —Accounting & Analytical Solution",
  description: "Solution de gestion comptable générale et analytique",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/images/yowyob-logo.png", type: "image/png", sizes: "218x256" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png" }],
    shortcut: "/favicon.ico",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Yowyob ERP",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${roboto.variable} ${geistMono.variable}`}>
      <head>
        <meta name="theme-color" content="#1e40af" />
      </head>
      <body className={`${roboto.className} font-sans antialiased`}>
        <AuthInitializer />
        <OfflineBootstrap />
        <Suspense fallback={null}>
          <NavigationLoader />
        </Suspense>
        <Toaster position="top-right" richColors />
        {children}
      </body>
    </html>
  );
}