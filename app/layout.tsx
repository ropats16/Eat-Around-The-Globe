import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import Script from "next/script";
import "./globals.css";
import WalletProviders from "@/providers/WalletProviders";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Eat Around The Globe - Discover World Cuisines",
  description:
    "Explore and discover the best food recommendations from around the world on an interactive 3D globe",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Eat Around The Globe",
  },
  icons: {
    icon: "/globe-w-markers.png",
    apple: "/globe-w-markers.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* DataFast queue script - ensures events are captured before main script loads */}
        <script
          id="datafast-queue"
          dangerouslySetInnerHTML={{
            __html: `
              window.datafast = window.datafast || function() {
                window.datafast.q = window.datafast.q || [];
                window.datafast.q.push(arguments);
              };
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <WalletProviders>
          {children}
          <Toaster position="top-center" richColors />
        </WalletProviders>
        <Script
          defer
          src="https://datafa.st/js/script.js"
          data-website-id="dfid_vyw9HXDk9Vs7gwQysOXeD"
          data-domain="eataroundtheglobe.com"
          data-allow-localhost="true"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
