import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import ReactQueryProvider from "@/providers/QueryClientProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";

import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://null-void.545plea.xyz"),
  title: "Null-Void",
  description:
    "A simple collaborative canvas where you and your friends can create, collaborate, and bring ideas to life in real-time",
  creator: "Fashakin Olashubomi",
  keywords: [
    "collaborative canvas",
    "real-time collaboration",
    "creative tools",
  ],
  robots: {
    index: true,
    follow: true,
  },
  twitter: {
    title: "Null-Void",
    description:
      "A simple collaborative canvas where you and your friends can create, collaborate, and bring ideas to life in real-time",
    creator: "@545plea",
    card: "summary_large_image",
    images: ["/og-image.png"],
    site: "https://null-void.545plea.xyz",
  },
  openGraph: {
    title: "Null-Void",
    description:
      "A simple collaborative canvas where you and your friends can create, collaborate, and bring ideas to life in real-time",
    url: "https://null-void.545plea.xyz",
    siteName: "Null-Void",
    images: ["/og-image.png"],
    type: "website",
    locale: "en_US",
  },
  authors: [{ name: "Fashakin Olashubomi", url: "https://545plea.xyz" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ReactQueryProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} font-sans antialiased`}
        >
          <ThemeProvider>
            {children}
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ReactQueryProvider>
  );
}
