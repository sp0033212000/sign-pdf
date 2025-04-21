import "./globals.css";

import React from "react";

import type { Metadata } from "next";
import { Noto_Sans_TC } from "next/font/google";

import { clsx } from "clsx";

const NotoSansTC = Noto_Sans_TC({
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-noto-sans-tc",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PDFs Signature Generator",
  description: "Generate PDFs Signatures",
  openGraph: {
    type: "website",
    title: "PDFs Signature Generator",
    description: "Generate PDFs Signatures",
    images: [
      {
        url: "https://pdf-signature-generator.vercel.app/android-chrome-512x512.png",
        width: 1200,
        height: 630,
        alt: "PDFs Signature Generator",
      },
    ],
  },
  authors: [
    {
      name: "Wei Liao",
      url: "https://github.com/sp0033212000",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={clsx(
          NotoSansTC.className,
          NotoSansTC.variable,
          "antialiased",
        )}
      >
        {children}
      </body>
    </html>
  );
}
