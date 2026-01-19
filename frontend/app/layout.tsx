import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../lib/auth/AuthProvider";
import { SessionProviderWrapper } from "../components/providers/SessionProviderWrapper";
import { QueryProvider } from "../components/providers/QueryProvider";
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <QueryProvider>
            <SessionProviderWrapper>
              <AuthProvider>{children}</AuthProvider>
            </SessionProviderWrapper>
          </QueryProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
