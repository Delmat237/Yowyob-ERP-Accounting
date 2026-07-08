import type { Metadata } from "next";
import React, { Suspense } from "react";
import { NavigationLoader } from "@/components/navigation-loader";
import { Toaster } from "sonner";
import { AuthInitializer } from "@/components/auth-initializer";
import "./globals.css";

export const metadata: Metadata = {
  title: "KSM ACCOUNTING ERP",
  description: "Solution de gestion comptable",
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
      </head>
      <body style={{ fontFamily: "'Roboto', sans-serif" }}>
        <AuthInitializer />
        <Suspense fallback={null}>
          <NavigationLoader />
        </Suspense>
        <Toaster position="top-right" richColors />
        {children}
      </body>
    </html>
  );
}