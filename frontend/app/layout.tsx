import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../lib/auth/AuthProvider";
import { SessionProviderWrapper } from "../components/providers/SessionProviderWrapper";
import { QueryProvider } from "../components/providers/QueryProvider";
import {
  SubscriptionAccessProvider,
  SubscriptionAccessGuard,
} from "../components/subscription/SubscriptionAccessProvider";
import { Toaster } from "../components/ui/toast";
import { ThemeProvider } from "../hooks/useTheme";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LoRaWAN Dashboard",
  description: "LoRaWAN Network Management Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <QueryProvider>
            <SessionProviderWrapper>
              <AuthProvider>
                <SubscriptionAccessProvider>
                  <SubscriptionAccessGuard>{children}</SubscriptionAccessGuard>
                </SubscriptionAccessProvider>
              </AuthProvider>
            </SessionProviderWrapper>
          </QueryProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
