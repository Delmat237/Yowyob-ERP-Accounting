import type { Metadata } from "next";
import React, { Suspense } from "react";
import { NavigationLoader } from "@/components/navigation-loader";
import { Toaster } from "sonner";
import { AuthInitializer } from "@/components/auth-initializer";
import { OfflineBootstrap } from "@/components/offline/offline-bootstrap";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yowyob ERP — Solution Comptable",
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
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500;700;900&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#1e40af" />
      </head>
      <body style={{ fontFamily: "'Roboto', sans-serif" }}>
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