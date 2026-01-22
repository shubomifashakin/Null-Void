import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Null-Void",
  description:
    "A simple collaborative canvas where you and your friends can create, collaborate, and bring ideas to life in real-time",
  creator: "Fashakin Olashubomi",
  keywords: [
    "collaborative canvas",
    "real-time collaboration",
    "creative tools",
  ],
  twitter: {
    title: "Null-Void",
    description:
      "A simple collaborative canvas where you and your friends can create, collaborate, and bring ideas to life in real-time",
    creator: "@545plea",
    card: "summary_large_image",
    images: ["/og-image.png"],
    site: "https://null-void.545plea.xyz",
  },
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
        {children}
      </body>
    </html>
  );
}
