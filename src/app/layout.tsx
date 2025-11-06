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
  title:"Master Thesis Feedback Page",
  description: "Page for gathering feedback about design advocacy thesis.",
  keywords: ["design", "advocacy", "thesis"],
  openGraph: {
    type: "website",
    url: "https://thesis.radovanlamac.com",
    title: "Master Thesis Feedback Page",
    description: "Page for gathering feedback about design advocacy thesis..",
    siteName: "Master Thesis Feedback Page",
    images: [
      {
        url: "/public/og.png", // place file in /public/og.png
        width: 1200,
        height: 630,
        alt: "Master Thesis Feedback Page Image",
      },
    ],
  },
  icons: {
    icon: "public/favicon2.png",
    shortcut: "public/favicon2.png",
  },
  robots: {
    index: true,
    follow: true,
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
